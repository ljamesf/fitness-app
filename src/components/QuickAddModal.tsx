import React, { useState } from "react";
import { FoodItem, MealType } from "../types";
import {
  Search,
  Sparkles,
  Plus,
  Heart,
  Clock,
  Barcode,
  X,
  RefreshCw,
  FolderHeart,
  Trash2,
} from "lucide-react";
import { SAMPLE_BARCODE_FOODS } from "../data/sampleFoods";
import {
  loadFavorites,
  loadRecentScans,
  loadCustomFoods,
  saveCustomFood,
  deleteCustomFood,
  triggerHaptic,
} from "../utils/storage";
import { searchFoodWithAI } from "../utils/api";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem, mealType: MealType) => void;
  targetMeal: MealType;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSelectFood,
  targetMeal,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<
    "search" | "my_foods" | "favorites" | "recents" | "custom"
  >("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Custom food form state
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customServing, setCustomServing] = useState("1 serving (100g)");
  const [customGrams, setCustomGrams] = useState(100);
  const [customCalories, setCustomCalories] = useState<number | "">("");
  const [customProtein, setCustomProtein] = useState<number | "">("");
  const [customCarbs, setCustomCarbs] = useState<number | "">("");
  const [customFat, setCustomFat] = useState<number | "">("");
  const [customFiber, setCustomFiber] = useState<number | "">("");
  const [customBarcode, setCustomBarcode] = useState("");

  const favorites = loadFavorites();
  const recents = loadRecentScans();
  const [customFoodsList, setCustomFoodsList] = useState<FoodItem[]>(loadCustomFoods);

  // Filtered standard foods
  const filteredSamples = SAMPLE_BARCODE_FOODS.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      f.brand?.toLowerCase().includes(q) ||
      f.categories?.some((c) => c.toLowerCase().includes(q)) ||
      f.barcode?.includes(q)
    );
  });

  // Filtered custom foods
  const filteredCustomFoods = customFoodsList.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q);
  });

  const handleAISearch = async () => {
    if (!searchQuery.trim() || isSearchingAI) return;
    setIsSearchingAI(true);
    setAiError(null);
    triggerHaptic("medium");

    try {
      const result = await searchFoodWithAI(searchQuery.trim());
      setIsSearchingAI(false);
      triggerHaptic("success");
      // Also save AI-generated food to custom foods history so the user can re-use it!
      saveCustomFood(result);
      setCustomFoodsList((prev) => [result, ...prev.filter((p) => p.id !== result.id)]);
      onSelectFood(result, targetMeal);
    } catch (err: any) {
      setIsSearchingAI(false);
      setAiError(err.message || "Failed to search food. Check the query and try again.");
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const cal = Number(customCalories) || 0;
    const p = Number(customProtein) || 0;
    const c = Number(customCarbs) || 0;
    const f = Number(customFat) || 0;
    const fib = customFiber !== "" ? Number(customFiber) : undefined;

    const food: FoodItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      brand: customBrand.trim() || undefined,
      barcode: customBarcode.trim() || undefined,
      servingSize: customServing || `${customGrams}g`,
      servingGrams: Number(customGrams) || 100,
      perServing: {
        calories: cal,
        protein: p,
        carbs: c,
        fat: f,
        fiber: fib,
      },
      source: "custom",
    };

    // Permanently save to My Custom Foods Library
    saveCustomFood(food);
    setCustomFoodsList((prev) => [food, ...prev]);

    triggerHaptic("success");
    onSelectFood(food, targetMeal);
  };

  const handleDeleteCustomItem = (foodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("medium");
    deleteCustomFood(foodId);
    setCustomFoodsList((prev) => prev.filter((item) => item.id !== foodId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[88vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-black text-slate-900">Add Food</h2>
            <p className="text-xs text-slate-500 font-medium">
              Logging to <span className="text-indigo-600 font-bold capitalize">{targetMeal}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add food"
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bento Bar */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === "search" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            onClick={() => setActiveTab("my_foods")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === "my_foods" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5 text-indigo-600" />
            <span>My Foods</span>
            {customFoodsList.length > 0 && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded-full">
                {customFoodsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === "favorites" ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Favorites</span>
          </button>

          <button
            onClick={() => setActiveTab("recents")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === "recents" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Recent</span>
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === "custom" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Create</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {/* SEARCH TAB */}
          {activeTab === "search" && (
            <div className="space-y-3">
              {/* Search Bar with AI Trigger */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                    placeholder="Search food, dish, or restaurant..."
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>

                <button
                  onClick={handleAISearch}
                  disabled={!searchQuery.trim() || isSearchingAI}
                  className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95"
                  title="Ask Gemini AI for Macro Breakdown"
                >
                  {isSearchingAI ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>AI Lookup</span>
                </button>
              </div>

              {aiError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {aiError}
                </div>
              )}

              {/* Food List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Verified Food Items
                </div>
                {filteredSamples.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => {
                      triggerHaptic("light");
                      onSelectFood(food, targetMeal);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate block">
                          {food.name}
                        </span>
                        {food.barcode && (
                          <span className="inline-flex items-center text-[9px] font-mono text-slate-400">
                            <Barcode className="w-2.5 h-2.5 mr-0.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-medium">
                        {food.brand ? `${food.brand} • ` : ""}
                        {food.servingSize}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold">
                        <span className="text-indigo-600 font-bold">{food.perServing.calories} kcal</span>
                        <span className="text-orange-600">{food.perServing.protein}g P</span>
                        <span className="text-blue-600">{food.perServing.carbs}g C</span>
                        <span className="text-amber-600">{food.perServing.fat}g F</span>
                      </div>
                    </div>
                    <button className="w-7 h-7 rounded-lg bg-white border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-500 transition-all shrink-0 shadow-2xs">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MY FOODS & PREVIOUSLY ADDED ITEMS TAB */}
          {activeTab === "my_foods" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Previously Saved & Custom Foods ({customFoodsList.length})
                </span>
                <button
                  onClick={() => setActiveTab("custom")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create New</span>
                </button>
              </div>

              {customFoodsList.length > 0 ? (
                filteredCustomFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => {
                      triggerHaptic("light");
                      onSelectFood(food, targetMeal);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate block">
                          {food.name}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                          Saved
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-medium">
                        {food.brand ? `${food.brand} • ` : ""}
                        {food.servingSize}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold">
                        <span className="text-indigo-600 font-bold">{food.perServing.calories} kcal</span>
                        <span className="text-orange-600">{food.perServing.protein}g P</span>
                        <span className="text-blue-600">{food.perServing.carbs}g C</span>
                        <span className="text-amber-600">{food.perServing.fat}g F</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDeleteCustomItem(food.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete from My Foods"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-white border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-500 transition-all shadow-2xs">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 px-4 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                  <p className="font-medium">No custom foods saved yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Any custom food you create or AI recipe you scan is permanently saved here for quick 1-tap re-logging!
                  </p>
                  <button
                    onClick={() => setActiveTab("custom")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Custom Food</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === "favorites" && (
            <div className="space-y-2">
              {favorites.length > 0 ? (
                favorites.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => {
                      triggerHaptic("light");
                      onSelectFood(food, targetMeal);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-xs font-bold text-slate-900 truncate block">
                        {food.name}
                      </span>
                      <div className="text-[11px] text-slate-500 truncate font-medium">
                        {food.brand ? `${food.brand} • ` : ""}
                        {food.servingSize}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold">
                        <span className="text-indigo-600 font-bold">{food.perServing.calories} kcal</span>
                        <span className="text-orange-600">{food.perServing.protein}g P</span>
                        <span className="text-blue-600">{food.perServing.carbs}g C</span>
                        <span className="text-amber-600">{food.perServing.fat}g F</span>
                      </div>
                    </div>
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  No favorites saved yet. Tap the heart icon on any food to pin it here.
                </div>
              )}
            </div>
          )}

          {/* RECENTS TAB */}
          {activeTab === "recents" && (
            <div className="space-y-2">
              {recents.length > 0 ? (
                recents.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => {
                      triggerHaptic("light");
                      onSelectFood(food, targetMeal);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-xs font-bold text-slate-900 truncate block">
                        {food.name}
                      </span>
                      <div className="text-[11px] text-slate-500 truncate font-medium">
                        {food.brand ? `${food.brand} • ` : ""}
                        {food.servingSize}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold">
                        <span className="text-indigo-600 font-bold">{food.perServing.calories} kcal</span>
                        <span className="text-orange-600">{food.perServing.protein}g P</span>
                        <span className="text-blue-600">{food.perServing.carbs}g C</span>
                        <span className="text-amber-600">{food.perServing.fat}g F</span>
                      </div>
                    </div>
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  No recently logged items yet.
                </div>
              )}
            </div>
          )}

          {/* CUSTOM FOOD CREATOR TAB */}
          {activeTab === "custom" && (
            <form onSubmit={handleCreateCustom} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Food / Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Homemade Sourdough Sandwich"
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Brand (Optional)
                  </label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="e.g. Bakery / Homemade"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Serving Description
                  </label>
                  <input
                    type="text"
                    value={customServing}
                    onChange={(e) => setCustomServing(e.target.value)}
                    placeholder="e.g. 1 slice (80g)"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Calories (kcal) *
                  </label>
                  <input
                    type="number"
                    required
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 350"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-orange-600 block mb-1">
                    Protein (g) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 24"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-blue-600 block mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 40"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-600 block mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 12"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Fiber (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFiber}
                    onChange={(e) => setCustomFiber(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 4"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Optional Barcode (UPC/EAN)
                </label>
                <input
                  type="text"
                  value={customBarcode}
                  onChange={(e) => setCustomBarcode(e.target.value)}
                  placeholder="e.g. 012345678905"
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs transition-all shadow-md mt-2"
              >
                Save to My Library & Log
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

