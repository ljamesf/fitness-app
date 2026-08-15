import React, { useState } from "react";
import { DailyGoals, ExerciseEntry, LoggedFoodEntry } from "../types";
import { Flame, Dumbbell, Wheat, Droplets, ArrowRight, Plus, Sparkles } from "lucide-react";

interface MacroSummaryCardProps {
  entries: LoggedFoodEntry[];
  exercises?: ExerciseEntry[];
  goals: DailyGoals;
  onOpenGoals: () => void;
  onOpenWorkouts?: () => void;
}

export const MacroSummaryCard: React.FC<MacroSummaryCardProps> = ({
  entries,
  exercises = [],
  goals,
  onOpenGoals,
  onOpenWorkouts,
}) => {
  // Aggregate total consumed food nutrients
  const totals = entries.reduce(
    (acc, item) => {
      acc.calories += item.macros.calories || 0;
      acc.protein += item.macros.protein || 0;
      acc.carbs += item.macros.carbs || 0;
      acc.fat += item.macros.fat || 0;
      acc.fiber += item.macros.fiber || 0;
      acc.sugars += item.macros.sugars || 0;
      acc.sodium += item.macros.sodium || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugars: 0, sodium: 0 }
  );

  const roundedTotals = {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    fiber: Math.round(totals.fiber * 10) / 10,
    sugars: Math.round(totals.sugars * 10) / 10,
    sodium: Math.round(totals.sodium),
  };

  // Workout Calories Burned Calculation
  const totalBurnedCalories = exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);

  // Calorie Math
  const baseGoal = goals.calories;
  const adjustedGoal = baseGoal + totalBurnedCalories; // Goal including burned workout calories
  const foodConsumed = roundedTotals.calories;
  const remainingCalories = adjustedGoal - foodConsumed;
  const isOverCalories = remainingCalories < 0;

  const netCarbs = Math.max(0, Math.round((roundedTotals.carbs - roundedTotals.fiber) * 10) / 10);

  // Percentage calculations
  const calPercent = Math.min(100, Math.round((foodConsumed / (adjustedGoal || 1)) * 100));
  const proteinPercent = Math.min(100, Math.round((roundedTotals.protein / goals.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((roundedTotals.carbs / goals.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((roundedTotals.fat / goals.fat) * 100));

  // Circular progress ring math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (calPercent / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200/90 rounded-[28px] p-4.5 shadow-sm text-slate-900 relative overflow-hidden space-y-3.5">
      {/* Subtle Bento decorative gradient */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

      {/* Top Professional Calorie Formula Ribbon */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px]">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-slate-600 font-semibold">{baseGoal}</span>
          <span className="text-slate-400 text-[10px]">Goal</span>
          <span className="text-slate-400 font-bold">-</span>
          <span className="text-indigo-600 font-bold">{foodConsumed}</span>
          <span className="text-slate-400 text-[10px]">Food</span>
          <span className="text-slate-400 font-bold">+</span>
          <span className="text-rose-600 font-bold">{totalBurnedCalories}</span>
          <span className="text-slate-400 text-[10px]">Burn</span>
          <span className="text-slate-400 font-bold">=</span>
          <span className={`font-black ${isOverCalories ? "text-rose-600" : "text-emerald-600"}`}>
            {remainingCalories}
          </span>
          <span className="text-slate-500 text-[10px] font-bold">Left</span>
        </div>

        {onOpenWorkouts && (
          <button
            onClick={onOpenWorkouts}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[10px] border border-rose-100 transition-colors shrink-0"
          >
            <Flame className="w-3 h-3" />
            <span>+{totalBurnedCalories} kcal</span>
          </button>
        )}
      </div>

      {/* Main Calorie Bento Section */}
      <div className="flex items-center justify-between gap-4">
        {/* Calorie ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-28 h-28 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="8.5"
              fill="transparent"
              className="text-slate-100"
            />
            {/* Progress ring */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="8.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-700 ease-out ${
                isOverCalories ? "text-rose-500" : "text-indigo-600"
              }`}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black tracking-tight leading-none text-slate-900">
              {Math.abs(remainingCalories)}
            </span>
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wider mt-0.5 ${
                isOverCalories ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {isOverCalories ? "Over kcal" : "Left kcal"}
            </span>
          </div>
        </div>

        {/* Calorie Goals & Burn Breakdown */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Base Goal</span>
            <span className="text-slate-800 font-bold">{baseGoal} kcal</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <span>Active Burn</span>
              <Flame className="w-3 h-3 text-rose-500" />
            </span>
            <span className="text-rose-600 font-extrabold">+{totalBurnedCalories} kcal</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-700 font-bold">Adjusted Budget</span>
            <span className="text-slate-900 font-black">{adjustedGoal} kcal</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Food Consumed</span>
            <span className="text-indigo-600 font-extrabold">{foodConsumed} kcal</span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={onOpenGoals}
              className="flex-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 py-1 px-2 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-100 transition-all text-center"
            >
              Set Goals
            </button>
            {onOpenWorkouts && (
              <button
                onClick={onOpenWorkouts}
                className="flex-1 text-[10px] font-extrabold text-rose-600 hover:text-rose-700 py-1 px-2 rounded-xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-100 transition-all text-center flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Burn</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Core Macronutrients Bento Sub-Cards */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
        {/* Protein (Coral / Orange) */}
        <div className="bg-orange-50/60 border border-orange-100/90 rounded-2xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-orange-600 text-xs font-bold">
              <Dumbbell className="w-3 h-3" />
              <span>Protein</span>
            </div>
            <span className="text-[10px] font-extrabold text-orange-700">{proteinPercent}%</span>
          </div>

          <div className="text-base font-black text-slate-900 leading-tight">
            {roundedTotals.protein}
            <span className="text-[11px] font-semibold text-slate-500">/{goals.protein}g</span>
          </div>

          <div className="w-full h-1.5 bg-orange-200/50 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        {/* Carbs (Blue) */}
        <div className="bg-blue-50/60 border border-blue-100/90 rounded-2xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-blue-600 text-xs font-bold">
              <Wheat className="w-3 h-3" />
              <span>Carbs</span>
            </div>
            <span className="text-[10px] font-extrabold text-blue-700">{carbsPercent}%</span>
          </div>

          <div className="text-base font-black text-slate-900 leading-tight">
            {roundedTotals.carbs}
            <span className="text-[11px] font-semibold text-slate-500">/{goals.carbs}g</span>
          </div>

          <div className="w-full h-1.5 bg-blue-200/50 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* Fat (Amber / Yellow) */}
        <div className="bg-amber-50/60 border border-amber-100/90 rounded-2xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
              <Droplets className="w-3 h-3" />
              <span>Fat</span>
            </div>
            <span className="text-[10px] font-extrabold text-amber-700">{fatPercent}%</span>
          </div>

          <div className="text-base font-black text-slate-900 leading-tight">
            {roundedTotals.fat}
            <span className="text-[11px] font-semibold text-slate-500">/{goals.fat}g</span>
          </div>

          <div className="w-full h-1.5 bg-amber-200/50 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Micronutrients strip */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-1">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-600">Net Carbs:</span>
          <span className="text-slate-900 font-extrabold">{netCarbs}g</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-600">Fiber:</span>
          <span className="text-slate-900 font-extrabold">{roundedTotals.fiber}g</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-600">Sugar:</span>
          <span className="text-slate-900 font-extrabold">{roundedTotals.sugars}g</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-600">Sodium:</span>
          <span className="text-slate-900 font-extrabold">{roundedTotals.sodium}mg</span>
        </div>
      </div>
    </div>
  );
};

