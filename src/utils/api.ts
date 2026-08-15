import { FoodItem, MacroProfile } from "../types";
import { SAMPLE_BARCODE_FOODS } from "../data/sampleFoods";

export async function fetchFoodByBarcode(barcode: string): Promise<FoodItem> {
  const cleanCode = barcode.trim();

  // 1. Check local sample database first for instant hit
  const localMatch = SAMPLE_BARCODE_FOODS.find(
    (item) => item.barcode === cleanCode || item.barcode?.endsWith(cleanCode) || cleanCode.endsWith(item.barcode || "___")
  );
  if (localMatch) {
    return { ...localMatch, id: `barcode-${cleanCode}-${Date.now()}` };
  }

  // 2. Query backend proxy to OpenFoodFacts + Gemini
  try {
    const res = await fetch(`/api/barcode/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.product) {
        return {
          id: `item-${cleanCode}-${Date.now()}`,
          ...data.product,
        };
      }
    }
  } catch (e) {
    console.warn("Backend barcode lookup failed, checking offline fallback", e);
  }

  // 3. Direct client fetch to OpenFoodFacts if server was unreachable
  try {
    const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`);
    if (offRes.ok) {
      const offData = await offRes.json();
      if (offData && offData.status === 1 && offData.product) {
        const p = offData.product;
        const n = p.nutriments || {};
        const servingGrams = Number(p.serving_quantity) || 100;
        const energyKcal = n["energy-kcal_100g"] ?? (n.energy_100g ? Math.round(n.energy_100g / 4.184) : 0);
        const p100 = Number(n.proteins_100g ?? 0);
        const c100 = Number(n.carbohydrates_100g ?? 0);
        const f100 = Number(n.fat_100g ?? 0);
        const fib100 = Number(n.fiber_100g ?? 0);
        const sug100 = Number(n.sugars_100g ?? 0);

        return {
          id: `off-${cleanCode}-${Date.now()}`,
          barcode: cleanCode,
          name: p.product_name || p.product_name_en || "Scanned Food Item",
          brand: p.brands || "Brand",
          servingSize: p.serving_size || `${servingGrams}g`,
          servingGrams,
          nutriScore: p.nutriscore_grade?.toUpperCase() || null,
          categories: p.categories ? p.categories.split(",").map((s: string) => s.trim()).slice(0, 3) : [],
          per100g: {
            calories: Math.round(energyKcal),
            protein: Math.round(p100 * 10) / 10,
            carbs: Math.round(c100 * 10) / 10,
            fat: Math.round(f100 * 10) / 10,
            fiber: Math.round(fib100 * 10) / 10,
            sugars: Math.round(sug100 * 10) / 10,
          },
          perServing: {
            calories: Math.round((energyKcal * servingGrams) / 100),
            protein: Math.round(((p100 * servingGrams) / 100) * 10) / 10,
            carbs: Math.round(((c100 * servingGrams) / 100) * 10) / 10,
            fat: Math.round(((f100 * servingGrams) / 100) * 10) / 10,
            fiber: Math.round(((fib100 * servingGrams) / 100) * 10) / 10,
            sugars: Math.round(((sug100 * servingGrams) / 100) * 10) / 10,
          },
          source: "openfoodfacts",
        };
      }
    }
  } catch (e) {
    //
  }

  // If completely unknown, return an editable template with the barcode
  return {
    id: `custom-${cleanCode}-${Date.now()}`,
    barcode: cleanCode,
    name: `Unknown Item (${cleanCode})`,
    brand: "Unidentified Product",
    servingSize: "1 serving (100g)",
    servingGrams: 100,
    perServing: {
      calories: 150,
      protein: 10,
      carbs: 15,
      fat: 5,
      fiber: 2,
      sugars: 2,
    },
    source: "barcode",
    notes: "Barcode scanned, but not yet in database. You can customize the macros below.",
  };
}

export async function analyzeFoodWithAI(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{ food: FoodItem; confidence: number; notes: string }> {
  const res = await fetch("/api/gemini/analyze-food", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to analyze photo with AI");
  }

  const data = await res.json();
  const r = data.result;

  const perServing: MacroProfile = {
    calories: Math.round(r.calories || 0),
    protein: Math.round((r.protein || 0) * 10) / 10,
    carbs: Math.round((r.carbs || 0) * 10) / 10,
    fat: Math.round((r.fat || 0) * 10) / 10,
    fiber: r.fiber !== undefined ? Math.round(r.fiber * 10) / 10 : undefined,
    sugars: r.sugars !== undefined ? Math.round(r.sugars * 10) / 10 : undefined,
    saturatedFat: r.saturatedFat !== undefined ? Math.round(r.saturatedFat * 10) / 10 : undefined,
    sodium: r.sodium !== undefined ? Math.round(r.sodium) : undefined,
    potassium: r.potassium !== undefined ? Math.round(r.potassium) : undefined,
  };

  const food: FoodItem = {
    id: `ai-${Date.now()}`,
    name: r.name || "AI Recognized Dish",
    brand: r.brand || "Fresh Meal",
    servingSize: r.servingSize || `${r.servingGrams || 250}g portion`,
    servingGrams: r.servingGrams || 250,
    perServing,
    tags: r.tags || ["AI Estimated"],
    source: "gemini-ai",
    notes: r.notes || "Detected with Gemini Vision Nutrition engine.",
  };

  return {
    food,
    confidence: r.confidence ?? 0.9,
    notes: r.notes || "",
  };
}

export async function searchFoodWithAI(query: string): Promise<FoodItem> {
  const res = await fetch("/api/gemini/search-food", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to search food macros");
  }

  const data = await res.json();
  const r = data.result;

  const perServing: MacroProfile = {
    calories: Math.round(r.calories || 0),
    protein: Math.round((r.protein || 0) * 10) / 10,
    carbs: Math.round((r.carbs || 0) * 10) / 10,
    fat: Math.round((r.fat || 0) * 10) / 10,
    fiber: r.fiber !== undefined ? Math.round(r.fiber * 10) / 10 : undefined,
    sugars: r.sugars !== undefined ? Math.round(r.sugars * 10) / 10 : undefined,
    saturatedFat: r.saturatedFat !== undefined ? Math.round(r.saturatedFat * 10) / 10 : undefined,
    sodium: r.sodium !== undefined ? Math.round(r.sodium) : undefined,
  };

  return {
    id: `search-${Date.now()}`,
    name: r.name || query,
    brand: r.brand || "Generic",
    servingSize: r.servingSize || `${r.servingGrams || 100}g`,
    servingGrams: r.servingGrams || 100,
    perServing,
    tags: r.tags || ["Verified Entry"],
    source: "gemini-ai",
  };
}
