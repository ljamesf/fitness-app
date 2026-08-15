import React from "react";
import { ExerciseCategory, ExerciseEntry } from "../types";
import {
  Dumbbell,
  Flame,
  Plus,
  Trash2,
  Footprints,
  Activity,
  Timer,
  Zap,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { triggerHaptic } from "../utils/storage";

interface WorkoutSectionProps {
  exercises: ExerciseEntry[];
  onOpenWorkoutModal: () => void;
  onDeleteExercise: (id: string) => void;
  onSelectExercise?: (exercise: ExerciseEntry) => void;
}

export const WorkoutSection: React.FC<WorkoutSectionProps> = ({
  exercises,
  onOpenWorkoutModal,
  onDeleteExercise,
  onSelectExercise,
}) => {
  const totalBurnedCalories = exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
  const totalDurationMinutes = exercises.reduce((sum, ex) => sum + (ex.durationMinutes || 0), 0);

  const getCategoryIcon = (category: ExerciseCategory) => {
    switch (category) {
      case "gym_strength":
        return <Dumbbell className="w-4 h-4 text-orange-600" />;
      case "running":
        return <Flame className="w-4 h-4 text-rose-600" />;
      case "walking":
        return <Footprints className="w-4 h-4 text-emerald-600" />;
      case "cycling":
        return <Activity className="w-4 h-4 text-blue-600" />;
      case "hiit":
        return <Zap className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getCategoryBg = (category: ExerciseCategory) => {
    switch (category) {
      case "gym_strength":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "running":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "walking":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "cycling":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "hiit":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-[28px] p-4 shadow-sm text-slate-900 overflow-hidden">
      {/* Header Bento Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900">Workouts & Active Burn</h3>
              {exercises.length > 0 && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  +{totalBurnedCalories} kcal
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {exercises.length === 0
                ? "Gym lifting, runs, cardio & calorie burn"
                : `${exercises.length} session${exercises.length > 1 ? "s" : ""} • ${totalDurationMinutes} mins total`}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic("light");
            onOpenWorkoutModal();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs transition-all shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Workout</span>
        </button>
      </div>

      {/* List of Logged Workouts */}
      {exercises.length > 0 ? (
        <div className="space-y-2.5">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              onClick={() => onSelectExercise && onSelectExercise(ex)}
              className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getCategoryBg(
                    ex.category
                  )}`}
                >
                  {getCategoryIcon(ex.category)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {ex.name}
                    </span>
                    {ex.intensity && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-200/70 text-slate-700 shrink-0">
                        {ex.intensity}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium flex-wrap">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3 text-slate-400" />
                      {ex.durationMinutes} min
                    </span>
                    {ex.distanceKm !== undefined && ex.distanceKm > 0 && (
                      <>
                        <span>•</span>
                        <span>{ex.distanceKm} km</span>
                      </>
                    )}
                    {ex.paceMinPerKm && (
                      <>
                        <span>•</span>
                        <span>{ex.paceMinPerKm}</span>
                      </>
                    )}
                  </div>

                  {ex.setsRepsNotes && (
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-mono bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/60 inline-block">
                      {ex.setsRepsNotes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-black text-rose-600">
                    +{ex.caloriesBurned}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">kcal burned</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic("medium");
                    onDeleteExercise(ex.id);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete workout"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State with Quick Preset Suggestions */
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-2.5">
          <p className="text-xs text-slate-500 font-medium">
            No workouts logged today. Add gym lifts, runs, or steps to increase your daily calorie allowance!
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                triggerHaptic("light");
                onOpenWorkoutModal();
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200/90 py-1.5 px-3 rounded-xl shadow-2xs hover:border-indigo-300 transition-all flex items-center gap-1.5"
            >
              <Dumbbell className="w-3 h-3 text-orange-500" />
              <span>Gym Lifting</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                onOpenWorkoutModal();
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200/90 py-1.5 px-3 rounded-xl shadow-2xs hover:border-indigo-300 transition-all flex items-center gap-1.5"
            >
              <Flame className="w-3 h-3 text-rose-500" />
              <span>5K Run / Cardio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
