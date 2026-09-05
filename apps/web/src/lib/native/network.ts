/**
 * Capacitor-Ready Network Monitor
 * Emits online/offline events, ready for @capacitor/network.
 */

export function isDeviceOnline(): boolean {
  if (typeof window === "undefined") return true;
  return window.navigator.onLine;
}

export function subscribeNetworkStatus(onChange: (online: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
