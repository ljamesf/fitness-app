import React from "react";
import { LoggedFoodEntry, MealType } from "../types";
import { Plus, Barcode, Camera, Trash2, Sun, Sunset, Moon, Coffee } from "lucide-react";

interface MealSectionProps {
  mealType: MealType;
  title: string;
  entries: LoggedFoodEntry[];
  onOpenScanner: (mealType: MealType) => void;
  onOpenAIVision: (mealType: MealType) => void;
  onOpenSearch: (mealType: MealType) => void;
  onDeleteEntry: (entryId: string) => void;
  onSelectEntry?: (entry: LoggedFoodEntry) => void;
}

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  title,
  entries,
  onOpenScanner,
  onOpenAIVision,
  onOpenSearch,
  onDeleteEntry,
  onSelectEntry,
}) => {
  // Compute meal macro subtotals
  const subtotals = entries.reduce(
    (acc, item) => {
      acc.calories += item.macros.calories || 0;
      acc.protein += item.macros.protein || 0;
      acc.carbs += item.macros.carbs || 0;
      acc.fat += item.macros.fat || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const getMealIcon = () => {
    switch (mealType) {
      case "breakfast":
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case "lunch":
        return <Sun className="w-4 h-4 text-orange-500" />;
      case "dinner":
        return <Sunset className="w-4 h-4 text-indigo-600" />;
      case "snack":
        return <Moon className="w-4 h-4 text-teal-600" />;
    }
  };

  const getMealBadgeColor = () => {
    switch (mealType) {
      case "breakfast":
        return "bg-amber-50 border-amber-200/80";
      case "lunch":
        return "bg-orange-50 border-orange-200/80";
      case "dinner":
        return "bg-indigo-50 border-indigo-200/80";
      case "snack":
        return "bg-teal-50 border-teal-200/80";
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-[26px] p-4 shadow-sm">
      {/* Meal Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${getMealBadgeColor()}`}>
            {getMealIcon()}
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight">{title}</h2>
            <div className="text-[11px] text-slate-400 font-medium">
              {entries.length} {entries.length === 1 ? "item" : "items"} logged
            </div>
          </div>
        </div>

        {/* Meal total stats */}
        <div className="text-right">
          <div className="text-sm font-black text-indigo-600 leading-tight">
            {Math.round(subtotals.calories)} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
            <span className="text-orange-600">{Math.round(subtotals.protein * 10) / 10}g P</span>
            <span>•</span>
            <span className="text-blue-600">{Math.round(subtotals.carbs * 10) / 10}g C</span>
            <span>•</span>
            <span className="text-amber-600">{Math.round(subtotals.fat * 10) / 10}g F</span>
          </div>
        </div>
      </div>

      {/* Logged Items List */}
      {entries.length > 0 ? (
        <div className="space-y-2 mb-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-indigo-300 transition-all group"
            >
              <div
                className="flex-1 min-w-0 pr-2 cursor-pointer"
                onClick={() => onSelectEntry && onSelectEntry(entry)}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-extrabold text-slate-900 truncate block">
                    {entry.name}
                  </span>
                  {entry.barcode && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-200 shrink-0">
                      <Barcode className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  {entry.brand ? `${entry.brand} • ` : ""}
                  {entry.quantity !== 1 ? `${entry.quantity}x ` : ""}
                  {entry.servingSizeDescription} ({Math.round(entry.servingGrams * entry.quantity)}g)
                </div>

                {/* Macro Pills */}
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold">
                  <span className="text-indigo-600 font-black">{entry.macros.calories} kcal</span>
                  <span className="text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200/80">
                    {entry.macros.protein}g P
                  </span>
                  <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/80">
                    {entry.macros.carbs}g C
                  </span>
                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/80">
                    {entry.macros.fat}g F
                  </span>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEntry(entry.id);
                }}
                aria-label={`Remove ${entry.name}`}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3 text-xs text-slate-400 font-medium">
          No food logged yet for {title.toLowerCase()}
        </div>
      )}

      {/* Quick Add Action Buttons in Bento styling */}
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <button
          onClick={() => onOpenScanner(mealType)}
          className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 text-xs font-bold border border-indigo-200/80 transition-all"
        >
          <Barcode className="w-3.5 h-3.5" />
          <span>Scan</span>
        </button>

        <button
          onClick={() => onOpenAIVision(mealType)}
          className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>AI Vision</span>
        </button>

        <button
          onClick={() => onOpenSearch(mealType)}
          className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>Add Food</span>
        </button>
      </div>
    </div>
  );
};
