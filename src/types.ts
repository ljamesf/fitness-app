export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MacroProfile {
  calories: number;       // kcal
  protein: number;        // grams
  carbs: number;          // grams
  fat: number;            // grams
  fiber?: number;         // grams
  sugars?: number;        // grams
  saturatedFat?: number;  // grams
  sodium?: number;        // mg
  potassium?: number;     // mg
  cholesterol?: number;   // mg
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string | null;
  servingSize: string;      // e.g. "1 container (170g)" or "100g"
  servingGrams: number;     // e.g. 170
  per100g?: MacroProfile;
  perServing: MacroProfile;
  categories?: string[];
  nutriScore?: string | null; // A, B, C, D, E
  novaGroup?: number | null;  // 1, 2, 3, 4
  source?: "barcode" | "openfoodfacts" | "gemini-ai" | "custom" | "verified";
  notes?: string;
  tags?: string[];
}

export interface LoggedFoodEntry {
  id: string;
  foodId: string;
  name: string;
  brand?: string;
  mealType: MealType;
  servingSizeDescription: string;
  servingGrams: number;
  quantity: number;          // multiplier, default 1
  macros: MacroProfile;      // calculated based on quantity
  loggedAt: string;          // ISO timestamp
  barcode?: string;
  imageUrl?: string | null;
}

export interface DailyGoals {
  calories: number;
  protein: number;           // grams
  carbs: number;             // grams
  fat: number;               // grams
  waterGoalMl: number;       // ml (e.g., 2500)
}

export type ExerciseCategory =
  | "gym_strength"
  | "running"
  | "cycling"
  | "hiit"
  | "walking"
  | "swimming"
  | "sports"
  | "other";

export type ExerciseIntensity = "low" | "moderate" | "high" | "intense";

export interface ExerciseEntry {
  id: string;
  name: string;                // e.g. "Chest & Triceps", "5k Morning Run"
  category: ExerciseCategory;
  durationMinutes: number;     // e.g. 45
  caloriesBurned: number;      // e.g. 380 kcal
  distanceKm?: number;         // e.g. 5.2
  paceMinPerKm?: string;       // e.g. "5:15 /km"
  intensity?: ExerciseIntensity;
  setsRepsNotes?: string;      // e.g. "4x10 Bench 80kg, 3x12 Incline DB 30kg"
  notes?: string;
  loggedAt: string;            // ISO timestamp
}

export interface SavedWorkoutTemplate {
  id: string;
  name: string;
  category: ExerciseCategory;
  defaultDurationMinutes: number;
  defaultCaloriesBurned: number;
  defaultIntensity: ExerciseIntensity;
  defaultDistanceKm?: number;
  notes?: string;
}

export interface DailyLog {
  date: string;              // YYYY-MM-DD
  entries: LoggedFoodEntry[];
  exercises?: ExerciseEntry[]; // Logged gym workouts, runs, and cardio
  waterDrankMl: number;
  weightKg?: number;
  notes?: string;
}

export interface UserSettings {
  name: string;
  gender: "male" | "female" | "other";
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: "sedentary" | "light" | "moderate" | "very_active";
  goalType: "lose_weight" | "maintain" | "build_muscle" | "keto" | "high_protein";
  goals: DailyGoals;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  unitSystem: "metric" | "imperial";
}
