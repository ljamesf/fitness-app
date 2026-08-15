import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

export interface ScanResult {
  text: string;
  format?: string;
}

// Check if native BarcodeDetector API is available
export function hasNativeBarcodeDetector(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

let zxingReader: BrowserMultiFormatReader | null = null;

function getZXingReader(): BrowserMultiFormatReader {
  if (!zxingReader) {
    zxingReader = new BrowserMultiFormatReader();
  }
  return zxingReader;
}

/**
 * Scan a video frame or image element using native BarcodeDetector or ZXing
 */
export async function detectBarcodeFromImageOrVideo(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap
): Promise<ScanResult | null> {
  // 1. Try Native BarcodeDetector (Fastest & most accurate on iOS 17+ / Chrome)
  if (hasNativeBarcodeDetector()) {
    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const formats = await BarcodeDetectorClass.getSupportedFormats();
      const detector = new BarcodeDetectorClass({
        formats: formats.length > 0 ? formats : ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });
      const barcodes = await detector.detect(source);
      if (barcodes && barcodes.length > 0) {
        const raw = barcodes[0].rawValue || barcodes[0].displayValue;
        if (raw) {
          return {
            text: cleanBarcode(raw),
            format: barcodes[0].format,
          };
        }
      }
    } catch (err) {
      // Fallback to ZXing
    }
  }

  // 2. Fallback to ZXing
  try {
    const reader = getZXingReader();
    let result;
    if (source instanceof HTMLVideoElement) {
      result = await reader.decodeFromVideoElement(source);
    } else if (source instanceof HTMLImageElement) {
      result = await reader.decodeFromImageElement(source);
    }

    if (result) {
      return {
        text: cleanBarcode(result.getText()),
        format: result.getBarcodeFormat().toString(),
      };
    }
  } catch (err) {
    if (!(err instanceof NotFoundException)) {
      // Normal when no barcode in current frame
    }
  }

  return null;
}

/**
 * Clean and normalize barcode string (strip leading zeroes or whitespace if needed)
 */
export function cleanBarcode(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/[^0-9A-Za-z]/g, "");
  return cleaned;
}

/**
 * Decode from a File / Blob (e.g., photo taken by user)
 */
export async function decodeBarcodeFromFile(file: File): Promise<ScanResult | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const result = await detectBarcodeFromImageOrVideo(img);
        URL.revokeObjectURL(url);
        resolve(result);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
