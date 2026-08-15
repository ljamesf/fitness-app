import React from "react";
import { BookOpen, Barcode, Camera, Search, Target } from "lucide-react";

interface BottomTabBarProps {
  activeTab: "diary" | "search" | "goals";
  onTabChange: (tab: "diary" | "search" | "goals") => void;
  onOpenBarcodeScanner: () => void;
  onOpenAICamera: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  onOpenBarcodeScanner,
  onOpenAICamera,
}) => {
  return (
    <nav aria-label="Main Navigation" className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 pb-5 sm:pb-2 shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Diary Tab */}
        <button
          onClick={() => onTabChange("diary")}
          className={`flex flex-col items-center gap-1 p-1 transition-colors ${
            activeTab === "diary" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold">Diary</span>
        </button>

        {/* AI Camera Tab */}
        <button
          onClick={onOpenAICamera}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] font-bold">AI Snap</span>
        </button>

        {/* Center Elevated Barcode Scanner Action Button */}
        <div className="-mt-5">
          <button
            onClick={onOpenBarcodeScanner}
            aria-label="Scan Food Barcode"
            className="w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 border-4 border-[#F4F4F7] transition-all group"
          >
            <Barcode className="w-6 h-6 stroke-[2.2] group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Food Search Tab */}
        <button
          onClick={() => onTabChange("search")}
          className={`flex flex-col items-center gap-1 p-1 transition-colors ${
            activeTab === "search" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold">Search</span>
        </button>

        {/* Goals Tab */}
        <button
          onClick={() => onTabChange("goals")}
          className={`flex flex-col items-center gap-1 p-1 transition-colors ${
            activeTab === "goals" ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] font-bold">Goals</span>
        </button>
      </div>
    </nav>
  );
};
