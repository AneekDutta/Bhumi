/**
 * Capacitor-Ready Local Storage Layer
 * Supports offline parcel cache and verification queueing.
 */

export const DeviceStorage = {
  getItem<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage write error", e);
    }
  },

  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  }
};
