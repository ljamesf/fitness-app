import React from "react";
import { ChevronLeft, ChevronRight, Calendar, Target, Sparkles, Flame } from "lucide-react";
import { getTodayDateString } from "../utils/storage";

interface HeaderProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  onOpenGoals: () => void;
  onOpenTrends: () => void;
  totalCaloriesLogged: number;
  calorieGoal: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onOpenGoals,
  onOpenTrends,
  totalCaloriesLogged,
  calorieGoal,
}) => {
  const today = getTodayDateString();
  const isToday = currentDate === today;

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    onDateChange(today);
  };

  // Format date display
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    return d.toLocaleDateString(undefined, options);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 px-4 pt-3 pb-3">
      {/* Top row: App branding & quick actions */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Flame className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
              <span>MacroScan</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Barcode & Nutrition Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-open-trends"
            onClick={onOpenTrends}
            aria-label="View Nutrition Trends"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 hover:text-indigo-600 transition-all border border-slate-200/80"
            title="Weekly Analytics"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </button>
          <button
            id="btn-open-goals"
            onClick={onOpenGoals}
            aria-label="Set Nutrition Goals"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold transition-all border border-slate-200/80"
            title="Adjust Targets"
          >
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span>{calorieGoal} kcal</span>
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-100/90 rounded-2xl p-1 border border-slate-200/70">
        <button
          id="btn-prev-day"
          onClick={handlePrevDay}
          aria-label="Previous day"
          className="p-1.5 rounded-xl hover:bg-white active:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-none hover:shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          id="btn-date-label"
          onClick={handleToday}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all hover:bg-white text-slate-800"
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span className={isToday ? "text-indigo-600 font-extrabold" : "text-slate-800"}>
            {isToday ? `Today, ${formatDateLabel(currentDate)}` : formatDateLabel(currentDate)}
          </span>
          {!isToday && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold ml-1">
              Today
            </span>
          )}
        </button>

        <button
          id="btn-next-day"
          onClick={handleNextDay}
          aria-label="Next day"
          className="p-1.5 rounded-xl hover:bg-white active:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-none hover:shadow-xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
