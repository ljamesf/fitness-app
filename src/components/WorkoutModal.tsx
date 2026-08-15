import React, { useState, useEffect } from "react";
import {
  ExerciseCategory,
  ExerciseEntry,
  ExerciseIntensity,
  SavedWorkoutTemplate,
  UserSettings,
} from "../types";
import {
  X,
  Dumbbell,
  Flame,
  Footprints,
  Activity,
  Zap,
  Clock,
  Sparkles,
  Bookmark,
  Plus,
  Trash2,
  Check,
  Calculator,
  Compass,
} from "lucide-react";
import {
  estimateExerciseCalories,
  loadSavedWorkouts,
  saveSavedWorkout,
  deleteSavedWorkout,
  triggerHaptic,
} from "../utils/storage";

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogExercise: (exercise: ExerciseEntry) => void;
  userSettings: UserSettings;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  onLogExercise,
  userSettings,
}) => {
  const [activeTab, setActiveTab] = useState<"log" | "presets" | "custom">("log");

  // Form State
  const [category, setCategory] = useState<ExerciseCategory>("gym_strength");
  const [name, setName] = useState("Push Day (Chest, Shoulders & Triceps)");
  const [durationMinutes, setDurationMinutes] = useState<number | "">(45);
  const [intensity, setIntensity] = useState<ExerciseIntensity>("high");
  const [caloriesBurned, setCaloriesBurned] = useState<number | "">(350);
  const [isManualCalorie, setIsManualCalorie] = useState(false);

  // Cardio specific fields
  const [distanceKm, setDistanceKm] = useState<number | "">("");
  const [setsRepsNotes, setSetsRepsNotes] = useState("");

  // Saved routines library
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkoutTemplate[]>(loadSavedWorkouts);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Recalculate auto calories when parameters change if not explicitly manual
  useEffect(() => {
    if (!isManualCalorie && typeof durationMinutes === "number" && durationMinutes > 0) {
      const estimated = estimateExerciseCalories(
        category,
        durationMinutes,
        intensity,
        userSettings.weightKg || 75,
        typeof distanceKm === "number" ? distanceKm : undefined
      );
      setCaloriesBurned(estimated);
    }
  }, [category, durationMinutes, intensity, distanceKm, userSettings.weightKg, isManualCalorie]);

  if (!isOpen) return null;

  // Calculate Pace for Runs
  const paceFormatted = (() => {
    if (typeof distanceKm === "number" && distanceKm > 0 && typeof durationMinutes === "number" && durationMinutes > 0) {
      const paceDecimal = durationMinutes / distanceKm;
      const paceMins = Math.floor(paceDecimal);
      const paceSecs = Math.round((paceDecimal - paceMins) * 60);
      return `${paceMins}:${String(paceSecs).padStart(2, "0")} /km`;
    }
    return "";
  })();

  const handleSelectCategory = (cat: ExerciseCategory) => {
    triggerHaptic("light");
    setCategory(cat);
    setIsManualCalorie(false);

    // Set smart default names & durations based on category
    switch (cat) {
      case "gym_strength":
        setName("Gym Strength Workout");
        setDurationMinutes(50);
        setIntensity("high");
        setDistanceKm("");
        break;
      case "running":
        setName("Outdoor / Treadmill Run");
        setDurationMinutes(30);
        setDistanceKm(5.0);
        setIntensity("high");
        break;
      case "walking":
        setName("Incline Treadmill Walk");
        setDurationMinutes(30);
        setDistanceKm(2.5);
        setIntensity("moderate");
        break;
      case "hiit":
        setName("HIIT & Core Session");
        setDurationMinutes(35);
        setIntensity("intense");
        setDistanceKm("");
        break;
      case "cycling":
        setName("Stationary Bike / Cycling");
        setDurationMinutes(45);
        setDistanceKm(15.0);
        setIntensity("high");
        break;
      case "swimming":
        setName("Lap Swimming");
        setDurationMinutes(40);
        setIntensity("high");
        setDistanceKm(1.2);
        break;
      default:
        setName("Active Workout");
        setDurationMinutes(30);
        setIntensity("moderate");
        setDistanceKm("");
        break;
    }
  };

  const handleApplyPreset = (preset: SavedWorkoutTemplate) => {
    triggerHaptic("light");
    setCategory(preset.category);
    setName(preset.name);
    setDurationMinutes(preset.defaultDurationMinutes);
    setIntensity(preset.defaultIntensity);
    setCaloriesBurned(preset.defaultCaloriesBurned);
    setIsManualCalorie(true);
    setDistanceKm(preset.defaultDistanceKm || "");
    setSetsRepsNotes(preset.notes || "");
    setActiveTab("log");
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("medium");
    deleteSavedWorkout(id);
    setSavedWorkouts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !durationMinutes || typeof caloriesBurned !== "number") return;

    triggerHaptic("success");

    const newExercise: ExerciseEntry = {
      id: `ex-${Date.now()}`,
      name: name.trim(),
      category,
      durationMinutes: Number(durationMinutes),
      caloriesBurned: Number(caloriesBurned),
      distanceKm: typeof distanceKm === "number" && distanceKm > 0 ? distanceKm : undefined,
      paceMinPerKm: paceFormatted || undefined,
      intensity,
      setsRepsNotes: setsRepsNotes.trim() || undefined,
      loggedAt: new Date().toISOString(),
    };

    // Save as routine template if requested
    if (saveAsTemplate) {
      const template: SavedWorkoutTemplate = {
        id: `custom-preset-${Date.now()}`,
        name: name.trim(),
        category,
        defaultDurationMinutes: Number(durationMinutes),
        defaultCaloriesBurned: Number(caloriesBurned),
        defaultIntensity: intensity,
        defaultDistanceKm: typeof distanceKm === "number" ? distanceKm : undefined,
        notes: setsRepsNotes.trim() || undefined,
      };
      saveSavedWorkout(template);
      setSavedWorkouts((prev) => [template, ...prev]);
    }

    onLogExercise(newExercise);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Log Workout & Runs</h2>
              <p className="text-xs text-slate-500 font-medium">Add burned calories to increase your daily budget</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close workout modal"
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection Bento Bar */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab("log")}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "log" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Workout Logger</span>
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "presets" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-500" />
            <span>Saved Routines</span>
            {savedWorkouts.length > 0 && (
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full text-slate-600 font-bold">
                {savedWorkouts.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === "log" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Quick Select Chips */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-2">Activity Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory("gym_strength")}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                      category === "gym_strength"
                        ? "bg-orange-50/80 border-orange-400 text-orange-950 font-bold ring-1 ring-orange-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4 text-orange-600 shrink-0" />
                    <span className="text-xs truncate">Gym / Lifting</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectCategory("running")}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                      category === "running"
                        ? "bg-rose-50/80 border-rose-400 text-rose-950 font-bold ring-1 ring-rose-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-xs truncate">Running</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectCategory("walking")}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                      category === "walking"
                        ? "bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Footprints className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs truncate">Walk / Steps</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectCategory("hiit")}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                      category === "hiit"
                        ? "bg-amber-50/80 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs truncate">HIIT / Circuit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectCategory("cycling")}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                      category === "cycling"
                        ? "bg-blue-50/80 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs truncate">Cycling / Spin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectCategory("other")}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                      category === "other"
                        ? "bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold ring-1 ring-indigo-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs truncate">Other / Sport</span>
                  </button>
                </div>
              </div>

              {/* Workout Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Workout / Exercise Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chest & Triceps, 5k Morning Run"
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Duration & Intensity Bento */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Duration (minutes) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={400}
                      value={durationMinutes}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value);
                        setDurationMinutes(val);
                      }}
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors pr-10"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Effort Intensity</label>
                  <select
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value as ExerciseIntensity)}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  >
                    <option value="low">Light (Warmup / Easy)</option>
                    <option value="moderate">Moderate (Standard)</option>
                    <option value="high">High (Challenging)</option>
                    <option value="intense">Intense (Max Effort / HIIT)</option>
                  </select>
                </div>
              </div>

              {/* Distance & Pace (if Cardio) */}
              {(category === "running" || category === "walking" || category === "cycling" || category === "swimming") && (
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                  <div>
                    <label className="text-[11px] font-bold text-indigo-900 block mb-1">Distance (km)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={distanceKm}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value);
                        setDistanceKm(val);
                      }}
                      placeholder="e.g. 5.0"
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-indigo-900 block mb-1">Calculated Pace</label>
                    <div className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-600 flex items-center justify-between">
                      <span>{paceFormatted || "--:-- /km"}</span>
                      <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Calorie Burn Bento Card */}
              <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-700">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>Active Calories Burned *</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManualCalorie(!isManualCalorie)}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded-lg shadow-2xs"
                  >
                    {isManualCalorie ? "Auto Calculate" : "Type Custom kcal"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min={1}
                    max={3000}
                    value={caloriesBurned}
                    onChange={(e) => {
                      setIsManualCalorie(true);
                      setCaloriesBurned(e.target.value === "" ? "" : Number(e.target.value));
                    }}
                    className="w-full bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-base font-black text-rose-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                  />
                  <span className="text-xs font-extrabold text-rose-800 shrink-0">kcal</span>
                </div>

                <p className="text-[10px] text-rose-700/80 font-medium mt-1.5 flex items-center gap-1">
                  <Calculator className="w-3 h-3 shrink-0" />
                  {isManualCalorie
                    ? "Custom calories specified (from Apple Watch / Garmin / gym display)."
                    : `Estimated from ${durationMinutes || 0} min ${intensity} ${category} @ ${userSettings.weightKg}kg.`}
                </p>
              </div>

              {/* Sets / Reps / Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sets, Reps & Workout Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={setsRepsNotes}
                  onChange={(e) => setSetsRepsNotes(e.target.value)}
                  placeholder="e.g. Bench press 4x8 @ 85kg, Incline DB 3x10 @ 30kg, 15 min cooldown..."
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Save Routine Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer p-1">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700">Save to My Routines for 1-tap logging next time</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Log Workout (+{caloriesBurned || 0} kcal to budget)</span>
              </button>
            </form>
          )}

          {activeTab === "presets" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800">Saved Workout Presets</span>
                <span className="text-slate-500 font-medium">{savedWorkouts.length} routines available</span>
              </div>

              {savedWorkouts.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 truncate block">
                        {preset.name}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
                        {preset.category.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>{preset.defaultDurationMinutes} mins</span>
                      {preset.defaultDistanceKm && (
                        <>
                          <span>•</span>
                          <span>{preset.defaultDistanceKm} km</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-rose-600 font-bold">+{preset.defaultCaloriesBurned} kcal</span>
                    </div>

                    {preset.notes && (
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-mono">
                        {preset.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDeleteTemplate(preset.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs group-hover:scale-105 transition-all shadow-2xs flex items-center gap-1">
                      <span>Log</span>
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
