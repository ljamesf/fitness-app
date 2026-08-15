import React from "react";
import { DailyGoals, DailyLog } from "../types";
import { X, Sparkles, TrendingUp, Award, Flame, Calendar, Dumbbell, Wheat, Droplets } from "lucide-react";
import { loadDailyLog } from "../utils/storage";

interface DailyTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: DailyGoals;
  currentDate: string;
}

export const DailyTrendsModal: React.FC<DailyTrendsModalProps> = ({
  isOpen,
  onClose,
  goals,
  currentDate,
}) => {
  if (!isOpen) return null;

  // Build 7-day history array
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const log = loadDailyLog(dateStr);

    const totals = log.entries.reduce(
      (acc, item) => {
        acc.calories += item.macros.calories || 0;
        acc.protein += item.macros.protein || 0;
        acc.carbs += item.macros.carbs || 0;
        acc.fat += item.macros.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const dayName = d.toLocaleDateString(undefined, { weekday: "narrow" });

    return {
      dateStr,
      dayName,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      entriesCount: log.entries.length,
    };
  });

  const activeDays = last7Days.filter((d) => d.calories > 0);
  const avgCalories =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, d) => sum + d.calories, 0) / activeDays.length)
      : 0;
  const avgProtein =
    activeDays.length > 0
      ? Math.round((activeDays.reduce((sum, d) => sum + d.protein, 0) / activeDays.length) * 10) / 10
      : 0;

  const maxCalInChart = Math.max(goals.calories * 1.2, ...last7Days.map((d) => d.calories), 2500);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] max-h-[88vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Nutrition Analytics</h2>
              <p className="text-xs text-slate-500 font-medium">7-Day Macro & Calorie History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close trends"
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Key Bento Stat Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-indigo-600" />
                <span>7-Day Calorie Avg</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {avgCalories} <span className="text-xs text-slate-400 font-normal">kcal</span>
              </div>
              <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                Target: {goals.calories} kcal
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-orange-600" />
                <span>7-Day Protein Avg</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {avgProtein} <span className="text-xs text-slate-400 font-normal">g</span>
              </div>
              <div className="text-[10px] text-orange-600 font-bold mt-0.5">
                Target: {goals.protein} g
              </div>
            </div>
          </div>

          {/* 7-Day Calorie Bar Chart */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">Daily Calorie Intake</span>
              <span className="text-slate-500 font-medium">Goal: {goals.calories} kcal</span>
            </div>

            {/* Bars */}
            <div className="h-36 flex items-end justify-between gap-2 pt-4 pb-1 border-b border-slate-200/80">
              {last7Days.map((day) => {
                const heightPct = Math.min(100, Math.round((day.calories / maxCalInChart) * 100));
                const isSelected = day.dateStr === currentDate;
                const isOver = day.calories > goals.calories;

                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[9px] font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.calories}
                    </div>
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        isSelected
                          ? isOver
                            ? "bg-rose-500 shadow-md shadow-rose-500/30"
                            : "bg-indigo-600 shadow-md shadow-indigo-500/30"
                          : day.calories > 0
                          ? "bg-slate-300 hover:bg-slate-400"
                          : "bg-slate-200/60 border border-dashed border-slate-300"
                      }`}
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                    <span
                      className={`text-[10px] font-bold mt-2 ${
                        isSelected ? "text-indigo-600 font-black" : "text-slate-400"
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consistency Badge & Insights */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Tracking Streak Active</div>
              <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                {activeDays.length} of 7 days logged this week. Consistent food logging is the #1 predictor of fitness success.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
