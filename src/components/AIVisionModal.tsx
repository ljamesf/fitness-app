import React, { useState, useRef, useEffect } from "react";
import { X, Camera, RefreshCw, Upload, Sparkles, AlertCircle, Check, Image as ImageIcon } from "lucide-react";
import { analyzeFoodWithAI } from "../utils/api";
import { FoodItem, MealType } from "../types";
import { triggerHaptic } from "../utils/storage";

interface AIVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodRecognized: (food: FoodItem, mealType: MealType) => void;
  targetMeal: MealType;
}

export const AIVisionModal: React.FC<AIVisionModalProps> = ({
  isOpen,
  onClose,
  onFoodRecognized,
  targetMeal,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play().catch(() => {});
      }
      setHasCamera(true);
    } catch {
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    analyzeImage(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    triggerHaptic("medium");

    try {
      const { food } = await analyzeFoodWithAI(base64Image);
      setIsAnalyzing(false);
      triggerHaptic("success");
      onFoodRecognized(food, targetMeal);
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage(err.message || "Failed to recognize food. You can try taking another angle or upload a clearer photo.");
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setErrorMessage(null);
    setIsAnalyzing(false);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-10">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>AI Food & Nutrition Scanner</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Snap meal dish or nutrition label &bull; Logging to{" "}
            <span className="text-indigo-400 font-bold capitalize">{targetMeal}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close AI scanner"
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera / Photo preview area */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured meal"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        )}

        {/* AI Scanning Status HUD */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/40">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-base font-black text-white mb-1">Analyzing Nutrition with Gemini AI</h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed font-medium">
              Detecting meal ingredients, portion weights, protein, carbs, fats, and calories...
            </p>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="absolute bottom-20 left-4 right-4 z-20 bg-rose-950/95 border border-rose-600 text-white p-3.5 rounded-2xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
        {capturedImage ? (
          <div className="flex gap-2 w-full">
            <button
              onClick={retakePhoto}
              disabled={isAnalyzing}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Upload from Photos"
            >
              <ImageIcon className="w-5 h-5 text-indigo-400" />
            </button>

            <button
              onClick={capturePhoto}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Camera className="w-5 h-5 text-white" />
              <span>Snap & Calculate Macros</span>
            </button>

            <button
              onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Switch Camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </>
        )}
      </div>
    </div>
  );
};
