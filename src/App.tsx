import React, { useState, useEffect } from "react";
import { DailyLog, FoodItem, LoggedFoodEntry, MealType, UserSettings } from "./types";
import {
  getTodayDateString,
  loadDailyLog,
  loadUserSettings,
  saveDailyLog,
  saveRecentScan,
  saveUserSettings,
} from "./utils/storage";
import { Header } from "./components/Header";
import { MacroSummaryCard } from "./components/MacroSummaryCard";
import { MealSection } from "./components/MealSection";
import { WaterTracker } from "./components/WaterTracker";
import { ScannerModal } from "./components/ScannerModal";
import { AIVisionModal } from "./components/AIVisionModal";
import { FoodDetailModal } from "./components/FoodDetailModal";
import { QuickAddModal } from "./components/QuickAddModal";
import { GoalsModal } from "./components/GoalsModal";
import { DailyTrendsModal } from "./components/DailyTrendsModal";
import { WorkoutSection } from "./components/WorkoutSection";
import { WorkoutModal } from "./components/WorkoutModal";
import { BottomTabBar } from "./components/BottomTabBar";
import { IPhonePreviewWrapper } from "./components/IPhonePreviewWrapper";
import { Barcode, Camera, Sparkles, PlusCircle, Dumbbell } from "lucide-react";
import { ExerciseEntry } from "./types";

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString);
  const [userSettings, setUserSettings] = useState<UserSettings>(loadUserSettings);
  const [dailyLog, setDailyLog] = useState<DailyLog>(() => loadDailyLog(getTodayDateString()));

  // Active target meal when opening scanner/search
  const [activeMealTarget, setActiveMealTarget] = useState<MealType>("breakfast");

  // Modal Visibility States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAIVisionOpen, setIsAIVisionOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);

  // Selected food for inspection / logging
  const [inspectedFood, setInspectedFood] = useState<FoodItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Bottom Tab active tab
  const [activeNavTab, setActiveNavTab] = useState<"diary" | "search" | "goals">("diary");

  // Reload daily log whenever date changes
  useEffect(() => {
    const log = loadDailyLog(currentDate);
    setDailyLog(log);
  }, [currentDate]);

  // Save changes to daily log
  const handleUpdateLog = (updated: DailyLog) => {
    setDailyLog(updated);
    saveDailyLog(updated);
  };

  // Add logged food entry
  const handleAddFoodEntry = (entry: LoggedFoodEntry) => {
    const updatedEntries = [...dailyLog.entries, entry];
    const updatedLog: DailyLog = {
      ...dailyLog,
      entries: updatedEntries,
    };
    handleUpdateLog(updatedLog);
  };

  // Delete food entry
  const handleDeleteEntry = (entryId: string) => {
    const updatedEntries = dailyLog.entries.filter((e) => e.id !== entryId);
    const updatedLog: DailyLog = {
      ...dailyLog,
      entries: updatedEntries,
    };
    handleUpdateLog(updatedLog);
  };

  // Add or update exercise workout entry
  const handleLogExercise = (exercise: ExerciseEntry) => {
    const currentExercises = dailyLog.exercises || [];
    const updatedExercises = [
      exercise,
      ...currentExercises.filter((e) => e.id !== exercise.id),
    ];
    const updatedLog: DailyLog = {
      ...dailyLog,
      exercises: updatedExercises,
    };
    handleUpdateLog(updatedLog);
  };

  // Delete exercise workout entry
  const handleDeleteExercise = (exerciseId: string) => {
    const currentExercises = dailyLog.exercises || [];
    const updatedExercises = currentExercises.filter((e) => e.id !== exerciseId);
    const updatedLog: DailyLog = {
      ...dailyLog,
      exercises: updatedExercises,
    };
    handleUpdateLog(updatedLog);
  };

  // Update water intake
  const handleUpdateWater = (newAmountMl: number) => {
    const updatedLog: DailyLog = {
      ...dailyLog,
      waterDrankMl: newAmountMl,
    };
    handleUpdateLog(updatedLog);
  };

  // Update user goals/settings
  const handleSaveSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    saveUserSettings(newSettings);
  };

  // When a barcode or AI recognizes a food item
  const handleFoodRecognized = (food: FoodItem, mealType: MealType) => {
    saveRecentScan(food);
    setIsScannerOpen(false);
    setIsAIVisionOpen(false);
    setIsQuickAddOpen(false);
    setActiveMealTarget(mealType);
    setInspectedFood(food);
    setIsDetailOpen(true);
  };

  // When user clicks an already logged item to inspect or modify
  const handleInspectLoggedEntry = (entry: LoggedFoodEntry) => {
    const foodItem: FoodItem = {
      id: entry.foodId,
      name: entry.name,
      brand: entry.brand,
      barcode: entry.barcode,
      servingSize: entry.servingSizeDescription,
      servingGrams: entry.servingGrams,
      perServing: {
        calories: Math.round(entry.macros.calories / (entry.quantity || 1)),
        protein: Math.round((entry.macros.protein / (entry.quantity || 1)) * 10) / 10,
        carbs: Math.round((entry.macros.carbs / (entry.quantity || 1)) * 10) / 10,
        fat: Math.round((entry.macros.fat / (entry.quantity || 1)) * 10) / 10,
        fiber: entry.macros.fiber !== undefined ? Math.round((entry.macros.fiber / (entry.quantity || 1)) * 10) / 10 : undefined,
        sugars: entry.macros.sugars !== undefined ? Math.round((entry.macros.sugars / (entry.quantity || 1)) * 10) / 10 : undefined,
        saturatedFat: entry.macros.saturatedFat !== undefined ? Math.round((entry.macros.saturatedFat / (entry.quantity || 1)) * 10) / 10 : undefined,
        sodium: entry.macros.sodium !== undefined ? Math.round(entry.macros.sodium / (entry.quantity || 1)) : undefined,
      },
      imageUrl: entry.imageUrl,
    };
    setActiveMealTarget(entry.mealType);
    setInspectedFood(foodItem);
    setIsDetailOpen(true);
  };

  // Group entries by meal type
  const breakfastEntries = dailyLog.entries.filter((e) => e.mealType === "breakfast");
  const lunchEntries = dailyLog.entries.filter((e) => e.mealType === "lunch");
  const dinnerEntries = dailyLog.entries.filter((e) => e.mealType === "dinner");
  const snackEntries = dailyLog.entries.filter((e) => e.mealType === "snack");

  const totalCaloriesLogged = dailyLog.entries.reduce(
    (sum, item) => sum + (item.macros.calories || 0),
    0
  );

  return (
    <IPhonePreviewWrapper>
      {/* Top Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onOpenGoals={() => setIsGoalsOpen(true)}
        onOpenTrends={() => setIsTrendsOpen(true)}
        totalCaloriesLogged={totalCaloriesLogged}
        calorieGoal={userSettings.goals.calories}
      />

      {/* Main Scrollable Content */}
      <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* Daily Macronutrient & Calorie Summary Bento Card */}
        <MacroSummaryCard
          entries={dailyLog.entries}
          exercises={dailyLog.exercises || []}
          goals={userSettings.goals}
          onOpenGoals={() => setIsGoalsOpen(true)}
          onOpenWorkouts={() => setIsWorkoutOpen(true)}
        />

        {/* Quick Scan Action Bento Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setActiveMealTarget("breakfast");
              setIsScannerOpen(true);
            }}
            className="flex flex-col justify-between p-4 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-md shadow-indigo-500/25 transition-all text-left group min-h-[105px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Barcode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                Instant
              </span>
            </div>
            <div>
              <div className="text-sm font-black">Scan Barcode</div>
              <div className="text-[11px] text-indigo-100 font-medium">Auto-recognize food & macros</div>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveMealTarget("lunch");
              setIsAIVisionOpen(true);
            }}
            className="flex flex-col justify-between p-4 rounded-[24px] bg-white border border-slate-200/90 hover:border-indigo-300 active:scale-98 text-slate-900 shadow-sm transition-all text-left group min-h-[105px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                AI Vision
              </span>
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">AI Plate Snap</div>
              <div className="text-[11px] text-slate-500 font-medium">Analyze dishes & nutrition labels</div>
            </div>
          </button>
        </div>

        {/* Meals Sections (Breakfast, Lunch, Dinner, Snacks) */}
        <div className="space-y-3">
          <MealSection
            mealType="breakfast"
            title="Breakfast"
            entries={breakfastEntries}
            onOpenScanner={(meal) => {
              setActiveMealTarget(meal);
              setIsScannerOpen(true);
            }}
            onOpenAIVision={(meal) => {
              setActiveMealTarget(meal);
              setIsAIVisionOpen(true);
            }}
            onOpenSearch={(meal) => {
              setActiveMealTarget(meal);
              setIsQuickAddOpen(true);
            }}
            onDeleteEntry={handleDeleteEntry}
            onSelectEntry={handleInspectLoggedEntry}
          />

          <MealSection
            mealType="lunch"
            title="Lunch"
            entries={lunchEntries}
            onOpenScanner={(meal) => {
              setActiveMealTarget(meal);
              setIsScannerOpen(true);
            }}
            onOpenAIVision={(meal) => {
              setActiveMealTarget(meal);
              setIsAIVisionOpen(true);
            }}
            onOpenSearch={(meal) => {
              setActiveMealTarget(meal);
              setIsQuickAddOpen(true);
            }}
            onDeleteEntry={handleDeleteEntry}
            onSelectEntry={handleInspectLoggedEntry}
          />

          <MealSection
            mealType="dinner"
            title="Dinner"
            entries={dinnerEntries}
            onOpenScanner={(meal) => {
              setActiveMealTarget(meal);
              setIsScannerOpen(true);
            }}
            onOpenAIVision={(meal) => {
              setActiveMealTarget(meal);
              setIsAIVisionOpen(true);
            }}
            onOpenSearch={(meal) => {
              setActiveMealTarget(meal);
              setIsQuickAddOpen(true);
            }}
            onDeleteEntry={handleDeleteEntry}
            onSelectEntry={handleInspectLoggedEntry}
          />

          <MealSection
            mealType="snack"
            title="Snacks & Supplements"
            entries={snackEntries}
            onOpenScanner={(meal) => {
              setActiveMealTarget(meal);
              setIsScannerOpen(true);
            }}
            onOpenAIVision={(meal) => {
              setActiveMealTarget(meal);
              setIsAIVisionOpen(true);
            }}
            onOpenSearch={(meal) => {
              setActiveMealTarget(meal);
              setIsQuickAddOpen(true);
            }}
            onDeleteEntry={handleDeleteEntry}
            onSelectEntry={handleInspectLoggedEntry}
          />
        </div>

        {/* Gym Workouts, Runs & Calorie Burn Section */}
        <WorkoutSection
          exercises={dailyLog.exercises || []}
          onOpenAddWorkout={() => setIsWorkoutOpen(true)}
          onDeleteExercise={handleDeleteExercise}
        />

        {/* Hydration Tracker */}
        <WaterTracker
          waterDrankMl={dailyLog.waterDrankMl || 0}
          waterGoalMl={userSettings.goals.waterGoalMl || 2500}
          onUpdateWater={handleUpdateWater}
        />
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeNavTab}
        onTabChange={(tab) => {
          setActiveNavTab(tab);
          if (tab === "search") {
            setIsQuickAddOpen(true);
          } else if (tab === "goals") {
            setIsGoalsOpen(true);
          }
        }}
        onOpenBarcodeScanner={() => {
          setActiveMealTarget("breakfast");
          setIsScannerOpen(true);
        }}
        onOpenAICamera={() => {
          setActiveMealTarget("lunch");
          setIsAIVisionOpen(true);
        }}
      />

      {/* Barcode Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onFoodScanned={handleFoodRecognized}
        targetMeal={activeMealTarget}
      />

      {/* AI Vision Food & Label Modal */}
      <AIVisionModal
        isOpen={isAIVisionOpen}
        onClose={() => setIsAIVisionOpen(false)}
        onFoodRecognized={handleFoodRecognized}
        targetMeal={activeMealTarget}
      />

      {/* Food Details & Serving Size Stepper Modal */}
      <FoodDetailModal
        isOpen={isDetailOpen}
        food={inspectedFood}
        initialMealType={activeMealTarget}
        onClose={() => {
          setIsDetailOpen(false);
          setInspectedFood(null);
        }}
        onConfirmLog={handleAddFoodEntry}
      />

      {/* Quick Add / Search & Custom Food Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setActiveNavTab("diary");
        }}
        onSelectFood={handleFoodRecognized}
        targetMeal={activeMealTarget}
      />

      {/* Workout Logging Modal */}
      <WorkoutModal
        isOpen={isWorkoutOpen}
        onClose={() => setIsWorkoutOpen(false)}
        onLogExercise={handleLogExercise}
        userWeightKg={userSettings.profile.weightKg || 75}
      />

      {/* Nutrition Goals Modal */}
      <GoalsModal
        isOpen={isGoalsOpen}
        onClose={() => {
          setIsGoalsOpen(false);
          setActiveNavTab("diary");
        }}
        settings={userSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* 7-Day Trends Modal */}
      <DailyTrendsModal
        isOpen={isTrendsOpen}
        onClose={() => setIsTrendsOpen(false)}
        goals={userSettings.goals}
        currentDate={currentDate}
      />
    </IPhonePreviewWrapper>
  );
}
