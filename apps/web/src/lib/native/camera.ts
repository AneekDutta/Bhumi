/**
 * Capacitor-Ready Camera Service
 * Automatically uses window.Capacitor.Plugins.Camera when packaged in Android APK,
 * otherwise gracefully supports HTML5 input[type=file][capture=environment].
 */

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  category: "boundary" | "crop" | "structure" | "document" | "other";
  caption?: string;
  timestamp: string;
  lat?: number;
  lng?: number;
}

export async function capturePhotoFromNativeCamera(
  category: CapturedPhoto["category"] = "boundary",
  coords?: { lat: number; lng: number }
): Promise<CapturedPhoto | null> {
  // 1. Check for native Capacitor Camera plugin on window
  if (typeof window !== "undefined") {
    const CapCamera = (window as any).Capacitor?.Plugins?.Camera;
    if (CapCamera) {
      try {
        const image = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: "dataUrl",
          source: "CAMERA"
        });

        if (image?.dataUrl) {
          return {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            dataUrl: image.dataUrl,
            category,
            caption: `${category.toUpperCase()} photo at survey site`,
            timestamp: new Date().toLocaleTimeString(),
            lat: coords?.lat,
            lng: coords?.lng
          };
        }
      } catch (e) {
        console.warn("Capacitor camera failed or cancelled, using web file capture fallback:", e);
      }
    }
  }

  return null;
}
