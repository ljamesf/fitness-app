import {
  DailyGoals,
  DailyLog,
  ExerciseCategory,
  ExerciseEntry,
  ExerciseIntensity,
  FoodItem,
  LoggedFoodEntry,
  SavedWorkoutTemplate,
  UserSettings,
} from "../types";
import { SAMPLE_BARCODE_FOODS } from "../data/sampleFoods";

const SETTINGS_KEY = "macroscan_user_settings";
const LOGS_PREFIX = "macroscan_log_";
const RECENT_SCANS_KEY = "macroscan_recent_scans";
const FAVORITES_KEY = "macroscan_favorites";
const CUSTOM_FOODS_KEY = "macroscan_custom_foods";
const SAVED_WORKOUTS_KEY = "macroscan_saved_workouts";

export const DEFAULT_GOALS: DailyGoals = {
  calories: 2200,
  protein: 160,
  carbs: 220,
  fat: 70,
  waterGoalMl: 2500,
};

export const DEFAULT_SETTINGS: UserSettings = {
  name: "Athlete",
  gender: "male",
  age: 28,
  weightKg: 75,
  heightCm: 178,
  activityLevel: "moderate",
  goalType: "build_muscle",
  goals: DEFAULT_GOALS,
  hapticsEnabled: true,
  soundEnabled: true,
  unitSystem: "metric",
};

export const DEFAULT_WORKOUT_PRESETS: SavedWorkoutTemplate[] = [
  {
    id: "preset-gym-push",
    name: "Push Day (Chest, Shoulders & Triceps)",
    category: "gym_strength",
    defaultDurationMinutes: 50,
    defaultCaloriesBurned: 380,
    defaultIntensity: "high",
    notes: "Flat bench press 4x8, Incline DB press 3x10, Overhead DB press 3x10, Cable lateral raises 4x15, Tricep pushdowns 3x12",
  },
  {
    id: "preset-gym-pull",
    name: "Pull Day (Back, Traps & Biceps)",
    category: "gym_strength",
    defaultDurationMinutes: 55,
    defaultCaloriesBurned: 410,
    defaultIntensity: "high",
    notes: "Lat pulldowns 4x10, Barbell bent-over rows 4x8, Seated cable row 3x12, Face pulls 4x15, Incline bicep curls 3x12",
  },
  {
    id: "preset-gym-legs",
    name: "Leg Day (Quads, Hamstrings & Calves)",
    category: "gym_strength",
    defaultDurationMinutes: 60,
    defaultCaloriesBurned: 480,
    defaultIntensity: "intense",
    notes: "Barbell back squats 4x8, Romanian deadlifts 4x10, Leg press 3x12, Walking lunges 3x20 steps, Standing calf raises 4x15",
  },
  {
    id: "preset-run-5k",
    name: "5K Tempo / Outdoor Run",
    category: "running",
    defaultDurationMinutes: 28,
    defaultCaloriesBurned: 320,
    defaultIntensity: "high",
    defaultDistanceKm: 5.0,
    notes: "Pace: ~5:35 /km, avg heart rate 155 bpm",
  },
  {
    id: "preset-treadmill-incline",
    name: "Incline Treadmill Walk (12-3-30)",
    category: "walking",
    defaultDurationMinutes: 30,
    defaultCaloriesBurned: 240,
    defaultIntensity: "moderate",
    defaultDistanceKm: 2.4,
    notes: "12% incline @ 4.8 km/h (3.0 mph) steady fat burn",
  },
  {
    id: "preset-hiit-circuit",
    name: "Full Body HIIT & Core Blast",
    category: "hiit",
    defaultDurationMinutes: 35,
    defaultCaloriesBurned: 350,
    defaultIntensity: "intense",
    notes: "Kettlebell swings, Burpees, Battle ropes, Box jumps, Planks (45s on / 15s off x 5 rounds)",
  },
  {
    id: "preset-cycling-spin",
    name: "Spin Class / Stationary Bike",
    category: "cycling",
    defaultDurationMinutes: 45,
    defaultCaloriesBurned: 420,
    defaultIntensity: "high",
    defaultDistanceKm: 18.0,
    notes: "High cadence intervals + hill resistance climbs",
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

export function loadDailyLog(date: string): DailyLog {
  try {
    const raw = localStorage.getItem(LOGS_PREFIX + date);
    if (raw) {
      const parsed: DailyLog = JSON.parse(raw);
      if (!parsed.exercises) parsed.exercises = [];
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load daily log", e);
  }

  // Prepopulate today with realistic sample entries on initial visit if empty
  const today = getTodayDateString();
  if (date === today) {
    const initialEntries: LoggedFoodEntry[] = [
      {
        id: "init-1",
        foodId: SAMPLE_BARCODE_FOODS[2].id, // Quaker Oats
        name: SAMPLE_BARCODE_FOODS[2].name,
        brand: SAMPLE_BARCODE_FOODS[2].brand,
        mealType: "breakfast",
        servingSizeDescription: "1/2 cup dry (40g)",
        servingGrams: 40,
        quantity: 1,
        macros: SAMPLE_BARCODE_FOODS[2].perServing,
        loggedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        barcode: SAMPLE_BARCODE_FOODS[2].barcode,
      },
      {
        id: "init-2",
        foodId: SAMPLE_BARCODE_FOODS[0].id, // Chobani Vanilla
        name: SAMPLE_BARCODE_FOODS[0].name,
        brand: SAMPLE_BARCODE_FOODS[0].brand,
        mealType: "breakfast",
        servingSizeDescription: "1 cup (150g)",
        servingGrams: 150,
        quantity: 1,
        macros: SAMPLE_BARCODE_FOODS[0].perServing,
        loggedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        barcode: SAMPLE_BARCODE_FOODS[0].barcode,
      },
      {
        id: "init-3",
        foodId: SAMPLE_BARCODE_FOODS[7].id, // Grilled chicken
        name: SAMPLE_BARCODE_FOODS[7].name,
        brand: SAMPLE_BARCODE_FOODS[7].brand,
        mealType: "lunch",
        servingSizeDescription: "1 breast (140g)",
        servingGrams: 140,
        quantity: 1.2,
        macros: {
          calories: Math.round(SAMPLE_BARCODE_FOODS[7].perServing.calories * 1.2),
          protein: Math.round(SAMPLE_BARCODE_FOODS[7].perServing.protein * 1.2 * 10) / 10,
          carbs: 0,
          fat: Math.round(SAMPLE_BARCODE_FOODS[7].perServing.fat * 1.2 * 10) / 10,
          fiber: 0,
          sugars: 0,
          saturatedFat: 1.6,
          sodium: 125,
        },
        loggedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        barcode: SAMPLE_BARCODE_FOODS[7].barcode,
      },
    ];

    const initialExercises: ExerciseEntry[] = [
      {
        id: "init-ex-1",
        name: "Push Day Strength Session",
        category: "gym_strength",
        durationMinutes: 45,
        caloriesBurned: 350,
        intensity: "high",
        setsRepsNotes: "Bench press 4x8 @ 80kg, Overhead press 3x10 @ 45kg, Dips 3x12",
        loggedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ];

    const initialLog: DailyLog = {
      date,
      entries: initialEntries,
      exercises: initialExercises,
      waterDrankMl: 1500,
    };
    saveDailyLog(initialLog);
    return initialLog;
  }

  return {
    date,
    entries: [],
    exercises: [],
    waterDrankMl: 0,
  };
}

export function saveDailyLog(log: DailyLog): void {
  try {
    localStorage.setItem(LOGS_PREFIX + log.date, JSON.stringify(log));
  } catch (e) {
    console.error("Failed to save daily log", e);
  }
}

// Persistent Custom Foods Library (Saved Previous Foods)
export function loadCustomFoods(): FoodItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FOODS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load custom foods", e);
  }
  return [];
}

export function saveCustomFood(food: FoodItem): void {
  try {
    const existing = loadCustomFoods().filter((item) => item.id !== food.id && (!food.barcode || item.barcode !== food.barcode));
    const updated = [food, ...existing];
    localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save custom food", e);
  }
}

export function deleteCustomFood(foodId: string): void {
  try {
    const existing = loadCustomFoods().filter((item) => item.id !== foodId);
    localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to delete custom food", e);
  }
}

// Persistent Saved Workouts / Routine Presets
export function loadSavedWorkouts(): SavedWorkoutTemplate[] {
  try {
    const raw = localStorage.getItem(SAVED_WORKOUTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load saved workouts", e);
  }
  return DEFAULT_WORKOUT_PRESETS;
}

export function saveSavedWorkout(workout: SavedWorkoutTemplate): void {
  try {
    const existing = loadSavedWorkouts().filter((w) => w.id !== workout.id);
    const updated = [workout, ...existing];
    localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save workout template", e);
  }
}

export function deleteSavedWorkout(workoutId: string): void {
  try {
    const existing = loadSavedWorkouts().filter((w) => w.id !== workoutId);
    localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to delete workout template", e);
  }
}

// MET-Based Calorie Estimation Helper
export function estimateExerciseCalories(
  category: ExerciseCategory,
  durationMinutes: number,
  intensity: ExerciseIntensity = "moderate",
  weightKg: number = 75,
  distanceKm?: number
): number {
  if (durationMinutes <= 0) return 0;

  // Base METs (Metabolic Equivalent of Task)
  let baseMet = 6.0;

  switch (category) {
    case "gym_strength":
      baseMet = intensity === "low" ? 4.5 : intensity === "moderate" ? 6.0 : intensity === "high" ? 7.5 : 9.0;
      break;
    case "running":
      if (distanceKm && distanceKm > 0) {
        const speedKmh = (distanceKm / durationMinutes) * 60;
        if (speedKmh <= 8) baseMet = 8.0;
        else if (speedKmh <= 10) baseMet = 9.8;
        else if (speedKmh <= 12) baseMet = 11.5;
        else baseMet = 13.5;
      } else {
        baseMet = intensity === "low" ? 7.5 : intensity === "moderate" ? 9.5 : intensity === "high" ? 11.5 : 13.5;
      }
      break;
    case "cycling":
      baseMet = intensity === "low" ? 5.5 : intensity === "moderate" ? 7.5 : intensity === "high" ? 10.0 : 12.0;
      break;
    case "hiit":
      baseMet = intensity === "low" ? 6.5 : intensity === "moderate" ? 8.5 : intensity === "high" ? 10.5 : 12.5;
      break;
    case "walking":
      baseMet = intensity === "low" ? 3.0 : intensity === "moderate" ? 4.0 : intensity === "high" ? 5.5 : 7.0; // Incline walk
      break;
    case "swimming":
      baseMet = intensity === "low" ? 6.0 : intensity === "moderate" ? 8.0 : intensity === "high" ? 10.0 : 12.0;
      break;
    case "sports":
      baseMet = intensity === "low" ? 5.5 : intensity === "moderate" ? 7.5 : intensity === "high" ? 9.5 : 11.5;
      break;
    case "other":
    default:
      baseMet = intensity === "low" ? 4.0 : intensity === "moderate" ? 6.0 : intensity === "high" ? 8.0 : 10.0;
      break;
  }

  // Formula: Calories = MET * Weight(kg) * (Duration(mins) / 60)
  const calories = Math.round(baseMet * weightKg * (durationMinutes / 60));
  return Math.max(10, calories);
}

export function loadRecentScans(): FoodItem[] {
  try {
    const raw = localStorage.getItem(RECENT_SCANS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load recent scans", e);
  }
  return SAMPLE_BARCODE_FOODS.slice(0, 5);
}

export function saveRecentScan(food: FoodItem): void {
  try {
    const recents = loadRecentScans().filter((item) => item.barcode !== food.barcode && item.id !== food.id);
    const updated = [food, ...recents].slice(0, 30);
    localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save recent scan", e);
  }
}

export function loadFavorites(): FoodItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load favorites", e);
  }
  return SAMPLE_BARCODE_FOODS.slice(0, 3);
}

export function toggleFavorite(food: FoodItem): boolean {
  try {
    const favs = loadFavorites();
    const exists = favs.some((f) => f.id === food.id || (f.barcode && f.barcode === food.barcode));
    let next: FoodItem[];
    if (exists) {
      next = favs.filter((f) => f.id !== food.id && (!f.barcode || f.barcode !== food.barcode));
    } else {
      next = [food, ...favs];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return !exists;
  } catch {
    return false;
  }
}

// Audio synthesizer for barcode scan confirmation beep
let audioCtx: AudioContext | null = null;

export function playScanBeep(): void {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (!audioCtx) return;

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High pleasant A6 note
    osc.frequency.exponentialRampToValueAtTime(2349.32, audioCtx.currentTime + 0.08); // Ramp to D7

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.13);
  } catch (e) {
    // AudioContext may be blocked before gesture
  }
}

export function triggerHaptic(type: "success" | "medium" | "light" = "success"): void {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "success") {
        navigator.vibrate([30, 40, 50]);
      } else if (type === "medium") {
        navigator.vibrate(40);
      } else {
        navigator.vibrate(15);
      }
    }
  } catch {
    // Ignore if not supported
  }
}
