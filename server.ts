import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Lazy/safe initialization of Gemini
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI visual recognition will return fallback responses.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Barcode lookup endpoint
app.get("/api/barcode/:code", async (req, res) => {
  const barcode = req.params.code.trim();
  if (!barcode) {
    return res.status(400).json({ error: "Barcode is required" });
  }

  try {
    // 1. Try OpenFoodFacts v2 / v0 API
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    const offRes = await fetch(offUrl, {
      headers: {
        "User-Agent": "MacroScanApp/1.0 (lewisfarmerlewis@gmail.com) - BarcodeScannerApp",
      },
    });

    if (offRes.ok) {
      const data = await offRes.json();
      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const nutriments = p.nutriments || {};

        // Serving size parsing
        const servingSizeStr = p.serving_size || p.serving_quantity ? `${p.serving_quantity || 100}g` : "100g";
        let servingGrams = 100;
        if (p.serving_quantity) {
          servingGrams = Number(p.serving_quantity) || 100;
        } else if (p.serving_size) {
          const match = String(p.serving_size).match(/(\d+(\.\d+)?)\s*g/i);
          if (match) servingGrams = parseFloat(match[1]);
        }

        // Energy per 100g / per serving
        const energyKcal100g =
          nutriments["energy-kcal_100g"] ??
          nutriments["energy-kcal_value"] ??
          (nutriments.energy_100g ? Math.round(nutriments.energy_100g / 4.184) : 0);

        const protein100g = Number(nutriments.proteins_100g ?? nutriments.proteins ?? 0);
        const carbs100g = Number(nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0);
        const fat100g = Number(nutriments.fat_100g ?? nutriments.fat ?? 0);
        const fiber100g = Number(nutriments.fiber_100g ?? nutriments.fiber ?? 0);
        const sugars100g = Number(nutriments.sugars_100g ?? nutriments.sugars ?? 0);
        const satFat100g = Number(nutriments["saturated-fat_100g"] ?? nutriments["saturated-fat"] ?? 0);
        const sodium100g = Number(nutriments.sodium_100g ?? (nutriments.salt_100g ? nutriments.salt_100g * 0.4 : 0));

        const foodItem = {
          barcode,
          name: p.product_name || p.product_name_en || "Recognized Food Item",
          brand: p.brands || p.brand_owner || "Verified Brand",
          categories: p.categories ? p.categories.split(",").map((s: string) => s.trim()).slice(0, 3) : [],
          imageUrl: p.image_url || p.image_front_url || p.image_small_url || null,
          servingSize: servingSizeStr,
          servingGrams: Math.round(servingGrams) || 100,
          nutriScore: p.nutriscore_grade?.toUpperCase() || null,
          novaGroup: p.nova_group || null,
          // Per 100g
          per100g: {
            calories: Math.round(energyKcal100g),
            protein: Math.round(protein100g * 10) / 10,
            carbs: Math.round(carbs100g * 10) / 10,
            fat: Math.round(fat100g * 10) / 10,
            fiber: Math.round(fiber100g * 10) / 10,
            sugars: Math.round(sugars100g * 10) / 10,
            saturatedFat: Math.round(satFat100g * 10) / 10,
            sodium: Math.round(sodium100g * 1000), // in mg
          },
          // Standard default serving
          perServing: {
            calories: Math.round(
              nutriments["energy-kcal_serving"] ?? (energyKcal100g * servingGrams) / 100
            ),
            protein: Math.round(
              (nutriments.proteins_serving ?? (protein100g * servingGrams) / 100) * 10
            ) / 10,
            carbs: Math.round(
              (nutriments.carbohydrates_serving ?? (carbs100g * servingGrams) / 100) * 10
            ) / 10,
            fat: Math.round(
              (nutriments.fat_serving ?? (fat100g * servingGrams) / 100) * 10
            ) / 10,
            fiber: Math.round(
              (nutriments.fiber_serving ?? (fiber100g * servingGrams) / 100) * 10
            ) / 10,
            sugars: Math.round(
              (nutriments.sugars_serving ?? (sugars100g * servingGrams) / 100) * 10
            ) / 10,
            saturatedFat: Math.round(
              (nutriments["saturated-fat_serving"] ?? (satFat100g * servingGrams) / 100) * 10
            ) / 10,
            sodium: Math.round(
              nutriments.sodium_serving ? nutriments.sodium_serving * 1000 : (sodium100g * 1000 * servingGrams) / 100
            ),
          },
          source: "openfoodfacts",
        };

        return res.json({ success: true, product: foodItem });
      }
    }

    // 2. If OpenFoodFacts didn't have it, query Gemini with barcode information
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Identify the product associated with this barcode number: "${barcode}".
If this corresponds to a well-known grocery or food product (UPC/EAN), return its name, typical brand, serving size in grams, and detailed macro breakdown (Calories, Protein in g, Total Carbs in g, Total Fat in g, Dietary Fiber in g, Sugars in g, Saturated Fat in g, Sodium in mg).
If you cannot identify the exact barcode, generate a sensible default grocery product estimation or state unknown. Return purely JSON.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              found: { type: Type.BOOLEAN },
              name: { type: Type.STRING },
              brand: { type: Type.STRING },
              servingSize: { type: Type.STRING },
              servingGrams: { type: Type.NUMBER },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              fiber: { type: Type.NUMBER },
              sugars: { type: Type.NUMBER },
              saturatedFat: { type: Type.NUMBER },
              sodium: { type: Type.NUMBER },
              description: { type: Type.STRING },
            },
            required: ["found", "name", "servingGrams", "calories", "protein", "carbs", "fat"],
          },
        },
      });

      if (aiResponse.text) {
        const parsed = JSON.parse(aiResponse.text);
        if (parsed && parsed.found) {
          const servingGrams = parsed.servingGrams || 100;
          const factor = servingGrams > 0 ? 100 / servingGrams : 1;

          const foodItem = {
            barcode,
            name: parsed.name,
            brand: parsed.brand || "Recognized Food",
            categories: ["General Food"],
            imageUrl: null,
            servingSize: parsed.servingSize || `${servingGrams}g`,
            servingGrams,
            nutriScore: null,
            novaGroup: null,
            per100g: {
              calories: Math.round((parsed.calories || 0) * factor),
              protein: Math.round((parsed.protein || 0) * factor * 10) / 10,
              carbs: Math.round((parsed.carbs || 0) * factor * 10) / 10,
              fat: Math.round((parsed.fat || 0) * factor * 10) / 10,
              fiber: Math.round((parsed.fiber || 0) * factor * 10) / 10,
              sugars: Math.round((parsed.sugars || 0) * factor * 10) / 10,
              saturatedFat: Math.round((parsed.saturatedFat || 0) * factor * 10) / 10,
              sodium: Math.round((parsed.sodium || 0) * factor),
            },
            perServing: {
              calories: Math.round(parsed.calories || 0),
              protein: Math.round((parsed.protein || 0) * 10) / 10,
              carbs: Math.round((parsed.carbs || 0) * 10) / 10,
              fat: Math.round((parsed.fat || 0) * 10) / 10,
              fiber: Math.round((parsed.fiber || 0) * 10) / 10,
              sugars: Math.round((parsed.sugars || 0) * 10) / 10,
              saturatedFat: Math.round((parsed.saturatedFat || 0) * 10) / 10,
              sodium: Math.round(parsed.sodium || 0),
            },
            source: "gemini-ai",
          };

          return res.json({ success: true, product: foodItem });
        }
      }
    }

    return res.status(404).json({
      success: false,
      error: `No product found for barcode ${barcode}. You can enter details manually or scan again.`,
    });
  } catch (err: any) {
    console.error("Barcode lookup error:", err);
    return res.status(500).json({ error: "Failed to look up barcode: " + err.message });
  }
});

// Gemini Food & Label AI image analysis
app.post("/api/gemini/analyze-food", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", scanMode = "food_or_label" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured" });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const prompt = `You are an elite nutritionist and food recognition engine for an iPhone calorie tracking app.
Analyze this photo carefully. The user either scanned a physical food dish, an ingredient, a packaged food, or a Nutrition Facts table.

Extract or accurately estimate:
1. Exact or best identified Name of the food/dish.
2. Brand (if packaged, or leave as generic dish/homemade).
3. Primary portion/serving size description (e.g., "1 bowl (350g)", "1 slice (85g)", "200g portion", "1 can (330ml)").
4. Serving weight in grams (numerical integer or float).
5. Number of estimated servings shown in the photo (default 1).
6. Exact or high-precision estimated Macronutrients per serving:
   - Calories (kcal)
   - Protein (g)
   - Total Carbohydrates (g)
   - Dietary Fiber (g)
   - Total Sugars (g)
   - Total Fat (g)
   - Saturated Fat (g)
   - Sodium (mg)
   - Potassium (mg)
7. Health & Macro tags: list of 2-4 tags like "High Protein", "Low Carb", "Keto", "High Fiber", "Healthy Fats", "Vegan", "Gluten Free", etc.
8. Brief 1-sentence nutritional insight or description explaining what was detected.
9. Estimated detection confidence (0.0 to 1.0).

Return strict JSON adhering to the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            servingSize: { type: Type.STRING },
            servingGrams: { type: Type.NUMBER },
            servingsInImage: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            sugars: { type: Type.NUMBER },
            saturatedFat: { type: Type.NUMBER },
            sodium: { type: Type.NUMBER },
            potassium: { type: Type.NUMBER },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            notes: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["name", "servingSize", "servingGrams", "calories", "protein", "carbs", "fat"],
        },
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: "Failed to receive response from Gemini" });
    }

    const data = JSON.parse(response.text);
    return res.json({ success: true, result: data });
  } catch (err: any) {
    console.error("AI Analysis error:", err);
    return res.status(500).json({ error: "Failed to analyze image: " + err.message });
  }
});

// Gemini Food Search & Macro breakdown
app.post("/api/gemini/search-food", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query string is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured" });
    }

    const prompt = `A user wants to log the following food item: "${query}".
Break this food item down into accurate standard serving nutrition values based on standard USDA / verified food databases.
Provide:
- Canonical food name
- Brand or restaurant name (or "Generic" / "Homemade")
- Standard Serving size description (e.g., "1 medium apple (182g)", "1 scoop (30g)", "1 cup cooked (195g)")
- Serving weight in grams
- Calories (kcal)
- Protein (g)
- Carbohydrates (g)
- Fat (g)
- Fiber (g)
- Sugars (g)
- Saturated Fat (g)
- Sodium (mg)
- Helpful tags (e.g. "High Protein", "Whole Food")

Return strict JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            servingSize: { type: Type.STRING },
            servingGrams: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            sugars: { type: Type.NUMBER },
            saturatedFat: { type: Type.NUMBER },
            sodium: { type: Type.NUMBER },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["name", "servingSize", "servingGrams", "calories", "protein", "carbs", "fat"],
        },
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: "No response received" });
    }

    const parsed = JSON.parse(response.text);
    return res.json({ success: true, result: parsed });
  } catch (err: any) {
    console.error("Food search error:", err);
    return res.status(500).json({ error: "Failed to search food: " + err.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MacroScan server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
