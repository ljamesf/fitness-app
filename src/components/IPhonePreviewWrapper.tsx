import React, { useState, useEffect } from "react";
import { Smartphone, Monitor, Wifi, Battery, Signal } from "lucide-react";

interface IPhonePreviewWrapperProps {
  children: React.ReactNode;
}

export const IPhonePreviewWrapper: React.FC<IPhonePreviewWrapperProps> = ({ children }) => {
  const [isIPhoneFrame, setIsIPhoneFrame] = useState(false);
  const [currentTime, setCurrentTime] = useState("9:41");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hours % 12 || 12}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-start antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Device Mode Switcher Banner (Desktop only) */}
      <div className="hidden lg:flex items-center justify-between w-full max-w-4xl px-4 py-2 text-xs text-slate-500 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="font-semibold text-slate-800">MacroScan • Bento Grid Edition</span>
          <span className="text-slate-400">&bull; Live Barcode Scanner & Nutrition Vision</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsIPhoneFrame(false)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              !isIPhoneFrame ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Responsive View</span>
          </button>
          <button
            onClick={() => setIsIPhoneFrame(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isIPhoneFrame ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone Frame</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      {isIPhoneFrame ? (
        <div className="py-6 flex items-center justify-center">
          {/* iPhone mockup frame */}
          <div className="relative w-[390px] h-[844px] bg-slate-900 rounded-[50px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-center pointer-events-none shadow-md">
              <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 ml-auto mr-2" />
            </div>

            {/* iOS Status Bar */}
            <div className="w-full h-7 px-6 flex items-center justify-between text-[11px] font-bold text-slate-800 bg-[#F4F4F7] z-40 shrink-0 select-none">
              <span>{currentTime}</span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Inner Content Area */}
            <div className="flex-1 bg-[#F4F4F7] rounded-[40px] overflow-y-auto flex flex-col relative">
              {children}
            </div>

            {/* iOS Home Indicator bar */}
            <div className="w-32 h-1 bg-slate-400 rounded-full mx-auto my-1.5 shrink-0" />
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg min-h-screen flex flex-col bg-[#F4F4F7] shadow-xl border-x border-slate-200/80">
          {children}
        </div>
      )}
    </div>
  );
};
