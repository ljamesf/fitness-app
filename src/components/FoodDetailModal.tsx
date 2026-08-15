import React, { useState } from "react";
import { FoodItem, MealType, LoggedFoodEntry } from "../types";
import { X, Plus, Minus, Heart, Check, Barcode, Sparkles, Scale, Dumbbell, Wheat, Droplets } from "lucide-react";
import confetti from "canvas-confetti";
import { toggleFavorite, loadFavorites, triggerHaptic } from "../utils/storage";

interface FoodDetailModalProps {
  isOpen: boolean;
  food: FoodItem | null;
  initialMealType: MealType;
  onClose: () => void;
  onConfirmLog: (entry: LoggedFoodEntry) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  isOpen,
  food,
  initialMealType,
  onClose,
  onConfirmLog,
}) => {
  if (!isOpen || !food) return null;

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType);
  const [isFav, setIsFav] = useState(() => {
    const favs = loadFavorites();
    return favs.some((f) => f.id === food.id || (f.barcode && f.barcode === food.barcode));
  });

  const baseServing = food.perServing;
  const baseGrams = food.servingGrams || 100;

  // Dynamically calculate macros based on current quantity multiplier
  const calculatedMacros = {
    calories: Math.round(baseServing.calories * quantity),
    protein: Math.round(baseServing.protein * quantity * 10) / 10,
    carbs: Math.round(baseServing.carbs * quantity * 10) / 10,
    fat: Math.round(baseServing.fat * quantity * 10) / 10,
    fiber: baseServing.fiber !== undefined ? Math.round(baseServing.fiber * quantity * 10) / 10 : undefined,
    sugars: baseServing.sugars !== undefined ? Math.round(baseServing.sugars * quantity * 10) / 10 : undefined,
    saturatedFat:
      baseServing.saturatedFat !== undefined
        ? Math.round(baseServing.saturatedFat * quantity * 10) / 10
        : undefined,
    sodium: baseServing.sodium !== undefined ? Math.round(baseServing.sodium * quantity) : undefined,
    potassium:
      baseServing.potassium !== undefined ? Math.round(baseServing.potassium * quantity) : undefined,
  };

  const calculatedGrams = Math.round(baseGrams * quantity);

  // Macro calorie energy contribution percentages
  const proteinKcal = calculatedMacros.protein * 4;
  const carbsKcal = calculatedMacros.carbs * 4;
  const fatKcal = calculatedMacros.fat * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal || 1;

  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbsPct = Math.round((carbsKcal / totalMacroKcal) * 100);
  const fatPct = Math.round((fatKcal / totalMacroKcal) * 100);

  const handleAdjustQuantity = (delta: number) => {
    const next = Math.max(0.1, Math.round((quantity + delta) * 10) / 10);
    setQuantity(next);
    triggerHaptic("light");
  };

  const handleToggleFav = () => {
    const nextState = toggleFavorite(food);
    setIsFav(nextState);
    triggerHaptic("medium");
  };

  const handleLog = () => {
    const entry: LoggedFoodEntry = {
      id: `entry-${Date.now()}`,
      foodId: food.id,
      name: food.name,
      brand: food.brand,
      mealType: selectedMeal,
      servingSizeDescription: food.servingSize,
      servingGrams: baseGrams,
      quantity,
      macros: calculatedMacros,
      loggedAt: new Date().toISOString(),
      barcode: food.barcode,
      imageUrl: food.imageUrl,
    };

    // Confetti effect
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#10b981", "#06b6d4", "#f59e0b"],
      });
    } catch {
      //
    }

    triggerHaptic("success");
    onConfirmLog(entry);
    onClose();
  };

  const getNutriScoreColor = (score: string) => {
    switch (score.toUpperCase()) {
      case "A":
        return "bg-emerald-600 text-white";
      case "B":
        return "bg-lime-600 text-white";
      case "C":
        return "bg-yellow-500 text-black";
      case "D":
        return "bg-amber-600 text-white";
      case "E":
        return "bg-rose-600 text-white";
      default:
        return "bg-slate-700 text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {food.barcode && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  <Barcode className="w-3 h-3" />
                  <span>{food.barcode}</span>
                </span>
              )}
              {food.nutriScore && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getNutriScoreColor(
                    food.nutriScore
                  )}`}
                >
                  Nutri-Score {food.nutriScore}
                </span>
              )}
              {food.source === "gemini-ai" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Analyzed</span>
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {food.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {food.brand ? `${food.brand} • ` : ""}
              {food.servingSize}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleToggleFav}
              aria-label="Favorite this food"
              className={`p-2 rounded-full border transition-all ${
                isFav
                  ? "bg-rose-50 text-rose-500 border-rose-200"
                  : "bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-700"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500" : ""}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close food details"
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Main Calorie & Macro Bento Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-indigo-600 leading-none">
                {calculatedMacros.calories}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Total Calories (kcal)
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <div className="text-slate-700 font-bold">
                Weight: <span className="text-slate-900 font-extrabold">{calculatedGrams}g</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                ({quantity} × {food.servingSize})
              </div>
            </div>
          </div>

          {/* Quantity Stepper & Slider */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span>Portion & Servings</span>
              </span>
              <span className="text-xs font-black text-indigo-600">{quantity}x Servings</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => handleAdjustQuantity(-0.25)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-800 flex items-center justify-center font-bold transition-all border border-slate-200 shadow-xs"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0.25"
                  max="5"
                  step="0.25"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <button
                onClick={() => handleAdjustQuantity(0.25)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-800 flex items-center justify-center font-bold transition-all border border-slate-200 shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[0.5, 1, 1.5, 2, 3].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setQuantity(val);
                    triggerHaptic("light");
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    quantity === val
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>

          {/* 3 Core Macros Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Protein */}
            <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-2.5 text-center">
              <div className="text-[11px] font-bold text-orange-600 flex items-center justify-center gap-1 mb-1">
                <Dumbbell className="w-3 h-3" />
                <span>Protein</span>
              </div>
              <div className="text-lg font-black text-slate-900">{calculatedMacros.protein}g</div>
              <div className="text-[10px] text-orange-700 font-bold">{proteinPct}% of cals</div>
            </div>

            {/* Carbs */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-2.5 text-center">
              <div className="text-[11px] font-bold text-blue-600 flex items-center justify-center gap-1 mb-1">
                <Wheat className="w-3 h-3" />
                <span>Carbs</span>
              </div>
              <div className="text-lg font-black text-slate-900">{calculatedMacros.carbs}g</div>
              <div className="text-[10px] text-blue-700 font-bold">{carbsPct}% of cals</div>
            </div>

            {/* Fat */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-2.5 text-center">
              <div className="text-[11px] font-bold text-amber-600 flex items-center justify-center gap-1 mb-1">
                <Droplets className="w-3 h-3" />
                <span>Total Fat</span>
              </div>
              <div className="text-lg font-black text-slate-900">{calculatedMacros.fat}g</div>
              <div className="text-[10px] text-amber-700 font-bold">{fatPct}% of cals</div>
            </div>
          </div>

          {/* Macro Ratio Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Energy Distribution</span>
              <span>P: {proteinPct}% / C: {carbsPct}% / F: {fatPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-orange-500 h-full" style={{ width: `${proteinPct}%` }} />
              <div className="bg-blue-500 h-full" style={{ width: `${carbsPct}%` }} />
              <div className="bg-amber-500 h-full" style={{ width: `${fatPct}%` }} />
            </div>
          </div>

          {/* Full Nutrition Facts Table */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Detailed Nutrition Breakdown
            </h3>
            <div className="divide-y divide-slate-200/80 text-xs">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500 font-medium">Dietary Fiber</span>
                <span className="text-slate-900 font-bold">{calculatedMacros.fiber ?? 0}g</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500 font-medium">Total Sugars</span>
                <span className="text-slate-900 font-bold">{calculatedMacros.sugars ?? 0}g</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500 font-medium">Saturated Fat</span>
                <span className="text-slate-900 font-bold">{calculatedMacros.saturatedFat ?? 0}g</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500 font-medium">Sodium</span>
                <span className="text-slate-900 font-bold">{calculatedMacros.sodium ?? 0}mg</span>
              </div>
              {calculatedMacros.potassium !== undefined && (
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Potassium</span>
                  <span className="text-slate-900 font-bold">{calculatedMacros.potassium}mg</span>
                </div>
              )}
            </div>
          </div>

          {/* Meal Selection Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Assign to Meal:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    selectedMeal === meal
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Log Action */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={handleLog}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>
              Log {calculatedMacros.calories} kcal to {selectedMeal.toUpperCase()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
