import React, { useState } from "react";
import { DailyGoals, UserSettings } from "../types";
import { X, Target, Dumbbell, Wheat, Droplets, Check, Volume2, VolumeX, Smartphone } from "lucide-react";
import { triggerHaptic } from "../utils/storage";

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [calories, setCalories] = useState(settings.goals.calories);
  const [protein, setProtein] = useState(settings.goals.protein);
  const [carbs, setCarbs] = useState(settings.goals.carbs);
  const [fat, setFat] = useState(settings.goals.fat);
  const [waterGoalMl, setWaterGoalMl] = useState(settings.goals.waterGoalMl || 2500);
  const [haptics, setHaptics] = useState(settings.hapticsEnabled ?? true);
  const [sound, setSound] = useState(settings.soundEnabled ?? true);

  // Preset macro distributions
  const applyPreset = (type: "high_protein" | "balanced" | "low_carb" | "muscle_gain") => {
    let pPct = 0.3;
    let cPct = 0.4;
    let fPct = 0.3;

    if (type === "high_protein") {
      pPct = 0.35;
      cPct = 0.35;
      fPct = 0.3;
    } else if (type === "low_carb") {
      pPct = 0.35;
      cPct = 0.15;
      fPct = 0.5;
    } else if (type === "muscle_gain") {
      pPct = 0.3;
      cPct = 0.5;
      fPct = 0.2;
    }

    const calculatedP = Math.round((calories * pPct) / 4);
    const calculatedC = Math.round((calories * cPct) / 4);
    const calculatedF = Math.round((calories * fPct) / 9);

    setProtein(calculatedP);
    setCarbs(calculatedC);
    setFat(calculatedF);
    triggerHaptic("light");
  };

  const handleSave = () => {
    const updatedGoals: DailyGoals = {
      calories: Number(calories) || 2000,
      protein: Number(protein) || 150,
      carbs: Number(carbs) || 200,
      fat: Number(fat) || 65,
      waterGoalMl: Number(waterGoalMl) || 2500,
    };

    const updatedSettings: UserSettings = {
      ...settings,
      goals: updatedGoals,
      hapticsEnabled: haptics,
      soundEnabled: sound,
    };

    onSaveSettings(updatedSettings);
    triggerHaptic("success");
    onClose();
  };

  // Macro sum check
  const calculatedCalFromMacros = protein * 4 + carbs * 4 + fat * 9;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] max-h-[88vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Daily Nutrition Goals</h2>
              <p className="text-xs text-slate-500 font-medium">Set your calorie & macro targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close goals modal"
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Calorie Target */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Daily Calorie Target (kcal)</label>
              <span className="text-lg font-black text-indigo-600">{calories} kcal</span>
            </div>
            <input
              type="range"
              min="1200"
              max="4500"
              step="50"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>1200 kcal</span>
              <span>2500 kcal</span>
              <span>4500 kcal</span>
            </div>
          </div>

          {/* Macro Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Macro Ratio Presets:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset("high_protein")}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-400 text-left transition-all hover:bg-indigo-50/50"
              >
                <div className="text-xs font-black text-orange-600">High Protein</div>
                <div className="text-[10px] text-slate-500 font-medium">35% P / 35% C / 30% F</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("balanced")}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-400 text-left transition-all hover:bg-indigo-50/50"
              >
                <div className="text-xs font-black text-indigo-600">Balanced</div>
                <div className="text-[10px] text-slate-500 font-medium">30% P / 40% C / 30% F</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("low_carb")}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-400 text-left transition-all hover:bg-indigo-50/50"
              >
                <div className="text-xs font-black text-amber-600">Low Carb / Keto</div>
                <div className="text-[10px] text-slate-500 font-medium">35% P / 15% C / 50% F</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("muscle_gain")}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-400 text-left transition-all hover:bg-indigo-50/50"
              >
                <div className="text-xs font-black text-blue-600">Muscle Gain</div>
                <div className="text-[10px] text-slate-500 font-medium">30% P / 50% C / 20% F</div>
              </button>
            </div>
          </div>

          {/* Granular Macro Grams Inputs */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
            <div className="text-xs font-bold text-slate-700">Custom Target Grams</div>

            {/* Protein */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-orange-600 font-bold flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5" /> Protein
                </span>
                <span className="text-slate-900 font-bold">{protein}g ({protein * 4} kcal)</span>
              </div>
              <input
                type="range"
                min="40"
                max="300"
                step="5"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            {/* Carbs */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-blue-600 font-bold flex items-center gap-1">
                  <Wheat className="w-3.5 h-3.5" /> Carbohydrates
                </span>
                <span className="text-slate-900 font-bold">{carbs}g ({carbs * 4} kcal)</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Fat */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> Dietary Fat
                </span>
                <span className="text-slate-900 font-bold">{fat}g ({fat * 9} kcal)</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                step="5"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80 flex justify-between font-medium">
              <span>Calculated Macro Sum:</span>
              <span className={Math.abs(calculatedCalFromMacros - calories) > 100 ? "text-amber-600 font-bold" : "text-indigo-600 font-bold"}>
                {calculatedCalFromMacros} kcal ({calculatedCalFromMacros === calories ? "Exact Match" : `${calculatedCalFromMacros > calories ? "+" : ""}${calculatedCalFromMacros - calories} diff`})
              </span>
            </div>
          </div>

          {/* Water Goal */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600 font-bold">Daily Hydration Target</span>
              <span className="text-slate-900 font-bold">{waterGoalMl} ml ({(waterGoalMl / 1000).toFixed(1)} L)</span>
            </div>
            <input
              type="range"
              min="1000"
              max="5000"
              step="250"
              value={waterGoalMl}
              onChange={(e) => setWaterGoalMl(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* iPhone Haptics & Sound */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>Tactile Haptic Feedback</span>
              </span>
              <input
                type="checkbox"
                checked={haptics}
                onChange={(e) => setHaptics(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Barcode Scanner Beep Sound</span>
              </span>
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => setSound(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save Nutrition Goals</span>
          </button>
        </div>
      </div>
    </div>
  );
};
