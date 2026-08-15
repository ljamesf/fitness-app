import React from "react";
import { Droplets } from "lucide-react";
import { triggerHaptic } from "../utils/storage";

interface WaterTrackerProps {
  waterDrankMl: number;
  waterGoalMl: number;
  onUpdateWater: (newAmountMl: number) => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  waterDrankMl,
  waterGoalMl,
  onUpdateWater,
}) => {
  const percent = Math.min(100, Math.round((waterDrankMl / (waterGoalMl || 2500)) * 100));

  const addWater = (amount: number) => {
    const next = Math.max(0, waterDrankMl + amount);
    onUpdateWater(next);
    triggerHaptic("light");
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-[26px] p-4 shadow-sm text-slate-900">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Hydration Tracker</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Goal: {(waterGoalMl / 1000).toFixed(1)}L / day
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-black text-blue-600">
            {waterDrankMl} <span className="text-[10px] text-slate-400 font-normal">ml</span>
          </div>
          <div className="text-[10px] font-bold text-slate-500">{percent}% reached</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3 border border-slate-200/60">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Quick Add Pill Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={() => addWater(250)}
          className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-blue-50 active:scale-95 text-blue-600 text-xs font-extrabold transition-all text-center border border-slate-200/80 hover:border-blue-200"
        >
          +250ml
        </button>

        <button
          onClick={() => addWater(500)}
          className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-blue-50 active:scale-95 text-blue-600 text-xs font-extrabold transition-all text-center border border-slate-200/80 hover:border-blue-200"
        >
          +500ml
        </button>

        <button
          onClick={() => addWater(1000)}
          className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-blue-50 active:scale-95 text-blue-600 text-xs font-extrabold transition-all text-center border border-slate-200/80 hover:border-blue-200"
        >
          +1.0L
        </button>

        <button
          onClick={() => addWater(-250)}
          disabled={waterDrankMl <= 0}
          className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 disabled:opacity-40 text-slate-400 text-xs font-bold transition-all text-center border border-slate-200/80"
        >
          -250ml
        </button>
      </div>
    </div>
  );
};
