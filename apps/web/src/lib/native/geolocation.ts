/**
 * Capacitor-Ready Geolocation Service
 * Automatically uses window.Capacitor.Plugins.Geolocation when packaged in Android APK,
 * otherwise gracefully falls back to browser standard navigator.geolocation.
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export async function getCurrentGPSPosition(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
}): Promise<LocationCoordinates> {
  const highAccuracy = options?.enableHighAccuracy ?? true;
  const timeout = options?.timeout ?? 10000;

  // 1. Check for native Capacitor Geolocation plugin on window
  if (typeof window !== "undefined") {
    const CapGeo = (window as any).Capacitor?.Plugins?.Geolocation;
    if (CapGeo) {
      try {
        const pos = await CapGeo.getCurrentPosition({
          enableHighAccuracy: highAccuracy,
          timeout
        });
        return {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed
        };
      } catch (capError) {
        console.warn("Capacitor Geolocation error, falling back to browser API:", capError);
      }
    }
  }

  // 2. Browser standard HTML5 Geolocation fallback
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your mobile environment"));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed
        });
      },
      (err) => {
        reject(new Error(err.message || "Unable to retrieve GPS fix. Please verify location permissions."));
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge: 0
      }
    );
  });
}
