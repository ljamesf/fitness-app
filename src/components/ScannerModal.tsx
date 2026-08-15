import React, { useState, useEffect, useRef } from "react";
import { X, Camera, Flashlight, RefreshCw, Upload, Check, AlertCircle, Sparkles, Barcode as BarcodeIcon, Search } from "lucide-react";
import { detectBarcodeFromImageOrVideo, decodeBarcodeFromFile, cleanBarcode } from "../utils/barcodeDetector";
import { fetchFoodByBarcode } from "../utils/api";
import { FoodItem, MealType } from "../types";
import { SAMPLE_BARCODE_FOODS } from "../data/sampleFoods";
import { playScanBeep, triggerHaptic } from "../utils/storage";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodScanned: (food: FoodItem, mealType: MealType) => void;
  targetMeal: MealType;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onFoodScanned,
  targetMeal,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [showSamplePicker, setShowSamplePicker] = useState(false);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        setErrorMessage("Camera access is not supported in this browser. You can use photo upload or enter a barcode.");
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play().catch(() => {});
      }

      setHasCameraPermission(true);

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
        if (capabilities && "torch" in capabilities) {
          setTorchSupported(true);
        }
      }

      // Start detection frame loop
      startScanningLoop();
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      setHasCameraPermission(false);
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access in iPhone Settings or upload a photo."
          : "Unable to access camera. You can upload a photo or type a barcode."
      );
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const next = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: next }],
        });
        setTorchOn(next);
      } catch (err) {
        console.warn("Torch failed", err);
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const startScanningLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !isScanning || isLoadingProduct) {
        return;
      }

      try {
        const result = await detectBarcodeFromImageOrVideo(videoRef.current);
        if (result && result.text) {
          handleBarcodeDetected(result.text);
        }
      } catch {
        // Continue scanning
      }
    }, 200); // 5 scans per second
  };

  const handleBarcodeDetected = async (rawCode: string) => {
    const code = cleanBarcode(rawCode);
    if (!code || isLoadingProduct) return;

    setIsScanning(false);
    setScannedCode(code);
    setIsLoadingProduct(true);
    setErrorMessage(null);

    // Audio & Haptic Confirmation
    playScanBeep();
    triggerHaptic("success");

    try {
      const foodItem = await fetchFoodByBarcode(code);
      setIsLoadingProduct(false);
      stopCamera();
      onFoodScanned(foodItem, targetMeal);
    } catch (err: any) {
      setIsLoadingProduct(false);
      setErrorMessage(err.message || "Could not retrieve product information. Try another item.");
      // Resume scanning after 2 seconds
      setTimeout(() => {
        setIsScanning(true);
        setScannedCode(null);
      }, 2500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingProduct(true);
    setErrorMessage(null);

    try {
      const result = await decodeBarcodeFromFile(file);
      if (result && result.text) {
        await handleBarcodeDetected(result.text);
      } else {
        setIsLoadingProduct(false);
        setErrorMessage("No clear barcode found in the photo. Please try a closer, well-lit picture.");
      }
    } catch (err: any) {
      setIsLoadingProduct(false);
      setErrorMessage("Failed to process image: " + err.message);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
  };

  const handleSelectSample = (sample: FoodItem) => {
    if (sample.barcode) {
      handleBarcodeDetected(sample.barcode);
    } else {
      onFoodScanned(sample, targetMeal);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <span>Barcode Scanner</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Logging to <span className="text-indigo-400 font-bold capitalize">{targetMeal}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSamplePicker(!showSamplePicker)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/40 text-xs font-bold border border-indigo-500/30 flex items-center gap-1 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Barcodes</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Area */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {/* Viewfinder Target Overlay */}
        <div className="relative z-10 w-72 h-64 border-2 border-indigo-400/80 rounded-3xl shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] flex items-center justify-center pointer-events-none">
          {/* 4 Corner Markers */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />

          {/* Animated Laser Scan Line */}
          {isScanning && !isLoadingProduct && (
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent absolute shadow-[0_0_12px_#818cf8] animate-pulse" />
          )}

          {/* Prompt inside box */}
          <div className="text-center px-4">
            {isLoadingProduct ? (
              <div className="bg-slate-900/90 text-indigo-300 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-500/40 shadow-lg flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Recognizing Nutrition...</span>
              </div>
            ) : (
              <span className="text-xs text-white/90 font-semibold drop-shadow-md bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/10">
                Align barcode in frame
              </span>
            )}
          </div>
        </div>

        {/* Camera control buttons (Flash, Flip, Photo) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                torchOn
                  ? "bg-amber-500 text-slate-950 border-amber-400"
                  : "bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800"
              }`}
              title="Toggle Flashlight"
            >
              <Flashlight className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={toggleFacingMode}
            className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700 transition-all"
            title="Switch Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700 transition-all"
            title="Upload Barcode Photo"
          >
            <Upload className="w-5 h-5 text-indigo-400" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="absolute bottom-24 left-4 right-4 z-20 bg-rose-950/95 border border-rose-600/80 text-white p-3 rounded-2xl shadow-xl flex items-start gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-rose-200 mt-0.5">
                Tip: You can select a test barcode below or type the numbers directly.
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-300 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheet: Manual Input & Quick Sample Shelf */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 z-20">
        {/* Sample Barcode Quick Selector Drawer */}
        {showSamplePicker && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 mb-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Tap to Simulate Live Barcode Scan:
              </span>
              <button
                onClick={() => setShowSamplePicker(false)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Hide
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {SAMPLE_BARCODE_FOODS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-400 hover:bg-slate-800/80 transition-all text-xs group"
                >
                  <div className="font-bold text-slate-100 group-hover:text-indigo-400 truncate">
                    {sample.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-medium">
                    {sample.brand} • {sample.perServing.calories} kcal
                  </div>
                  <div className="text-[9px] text-indigo-400 font-mono mt-0.5">
                    UPC: {sample.barcode}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Barcode entry form */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Or enter barcode numbers (e.g. 894700010045)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim() || isLoadingProduct}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs transition-all flex items-center gap-1 shrink-0 shadow-md shadow-indigo-600/20"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lookup</span>
          </button>
        </form>
      </div>
    </div>
  );
};
