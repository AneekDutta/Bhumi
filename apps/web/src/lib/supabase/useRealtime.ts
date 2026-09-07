"use client";

import { useEffect, useRef } from "react";
import { createClient } from "./client";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Safely check if WebSockets are available and usable in the client environment.
 */
function isWebSocketAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const ws = (window as any).WebSocket || (globalThis as any).WebSocket;
    if (!ws || typeof ws !== "function") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook to subscribe to real-time updates for a specific parcel.
 * Listens for postgres_changes on 'parcels', 'documents', and 'audit_logs'.
 * Automatically falls back to periodic polling if WebSockets are blocked/unavailable.
 */
export function useRealtimeParcel(
  parcelId: string | undefined,
  onUpdate: (payload: { eventType: string; table: string; record: any }) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!parcelId) return;

    let channel: RealtimeChannel | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const startPollingFallback = () => {
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          try {
            onUpdateRef.current({
              eventType: "POLL",
              table: "parcels",
              record: { id: parcelId, parcel_id: parcelId }
            });
          } catch (e) {
            console.warn("[Realtime parcel] Polling error:", e);
          }
        }, 25000);
      }
    };

    if (!isWebSocketAvailable()) {
      startPollingFallback();
      return () => {
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    try {
      const supabase = createClient();
      const channelName = `rt-parcel-${parcelId.replace(/[^a-zA-Z0-9_-]/g, "_")}-${Date.now()}`;

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "parcels"
          },
          (payload: any) => {
            const rec: any = payload.new || payload.old;
            if (
              rec?.id === parcelId ||
              rec?.parcel_id === parcelId ||
              rec?.survey_no === parcelId ||
              rec?.survey_number === parcelId
            ) {
              onUpdateRef.current({
                eventType: payload.eventType,
                table: "parcels",
                record: payload.new || payload.old
              });
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "documents"
          },
          (payload: any) => {
            const rec: any = payload.new || payload.old;
            if (rec?.parcel_id === parcelId) {
              onUpdateRef.current({
                eventType: payload.eventType,
                table: "documents",
                record: payload.new || payload.old
              });
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "audit_logs"
          },
          (payload: any) => {
            const rec: any = payload.new;
            if (rec?.entity_id === parcelId) {
              onUpdateRef.current({
                eventType: payload.eventType,
                table: "audit_logs",
                record: payload.new
              });
            }
          }
        )
        .subscribe((status: string, err?: any) => {
          if (err || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`[Realtime parcel] Subscription state: ${status}`, err?.message || err);
            startPollingFallback();
          }
        });
    } catch (err: any) {
      console.warn("[Realtime parcel] WebSocket connection failed; falling back to polling:", err?.message || err);
      startPollingFallback();
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, [parcelId]);
}

/**
 * Hook to subscribe to real-time incident updates.
 * Listens for changes on 'documents' (document_type = 'field_incident') and 'audit_logs'.
 * Automatically falls back to periodic polling if WebSockets are blocked/unavailable.
 */
export function useRealtimeIncidents(
  parcelId: string | undefined,
  onUpdate: (payload: { eventType: string; record: any }) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const startPollingFallback = () => {
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          try {
            onUpdateRef.current({
              eventType: "POLL",
              record: null
            });
          } catch (e) {
            console.warn("[Realtime incidents] Polling error:", e);
          }
        }, 25000);
      }
    };

    if (!isWebSocketAvailable()) {
      startPollingFallback();
      return () => {
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    try {
      const supabase = createClient();
      const tag = parcelId ? parcelId.replace(/[^a-zA-Z0-9_-]/g, "_") : "all";
      const channelName = `rt-incidents-${tag}-${Date.now()}`;

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "documents"
          },
          (payload: any) => {
            const rec: any = payload.new || payload.old;
            if (rec?.document_type === "field_incident" || rec?.document_type === "field_verification") {
              if (!parcelId || rec?.parcel_id === parcelId) {
                onUpdateRef.current({
                  eventType: payload.eventType,
                  record: payload.new || payload.old
                });
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "audit_logs"
          },
          (payload: any) => {
            const rec: any = payload.new;
            if (rec?.action?.includes("INCIDENT") || rec?.action?.includes("VERIF")) {
              if (!parcelId || rec?.entity_id === parcelId) {
                onUpdateRef.current({
                  eventType: payload.eventType,
                  record: payload.new
                });
              }
            }
          }
        )
        .subscribe((status: string, err?: any) => {
          if (err || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`[Realtime incidents] Subscription state: ${status}`, err?.message || err);
            startPollingFallback();
          }
        });
    } catch (err: any) {
      console.warn("[Realtime incidents] WebSocket connection failed; falling back to polling:", err?.message || err);
      startPollingFallback();
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, [parcelId]);
}

/**
 * Hook to subscribe to global project & corridor updates for the dashboard.
 * Automatically falls back to periodic polling if WebSockets are blocked/unavailable.
 */
export function useRealtimeDashboard(
  onUpdate: () => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const startPollingFallback = () => {
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          try {
            onUpdateRef.current();
          } catch (e) {
            console.warn("[Realtime dashboard] Polling error:", e);
          }
        }, 30000);
      }
    };

    if (!isWebSocketAvailable()) {
      startPollingFallback();
      return () => {
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    try {
      const supabase = createClient();
      const channelName = `rt-dashboard-${Date.now()}`;

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "parcels" },
          () => { onUpdateRef.current(); }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "documents" },
          () => { onUpdateRef.current(); }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "projects" },
          () => { onUpdateRef.current(); }
        )
        .subscribe((status: string, err?: any) => {
          if (err || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`[Realtime dashboard] Subscription state: ${status}`, err?.message || err);
            startPollingFallback();
          }
        });
    } catch (err: any) {
      console.warn("[Realtime dashboard] WebSocket connection failed; falling back to polling:", err?.message || err);
      startPollingFallback();
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);
}

/**
 * Hook to subscribe to real-time Citizen Grievance updates.
 * Listens for changes on 'documents' (document_type = 'landowner_complaint') and 'audit_logs'.
 * Synchronizes across Landowner, Admin Web, and Field Operations.
 * Automatically falls back to periodic polling if WebSockets are blocked/unavailable.
 */
export function useRealtimeComplaints(
  filterId: string | undefined,
  onUpdate: (payload?: any) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const startPollingFallback = () => {
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          try {
            onUpdateRef.current({ eventType: "POLL" });
          } catch (e) {
            console.warn("[Realtime complaints] Polling error:", e);
          }
        }, 25000);
      }
    };

    if (!isWebSocketAvailable()) {
      startPollingFallback();
      return () => {
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    try {
      const supabase = createClient();
      const tag = filterId ? filterId.replace(/[^a-zA-Z0-9_-]/g, "_") : "all";
      const channelName = `rt-complaints-${tag}-${Date.now()}`;

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "documents"
          },
          (payload: any) => {
            const rec: any = payload.new || payload.old;
            if (rec?.document_type === "landowner_complaint") {
              onUpdateRef.current(payload);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "audit_logs"
          },
          (payload: any) => {
            const rec: any = payload.new;
            if (rec?.action?.includes("COMPLAINT") || rec?.entity_type === "complaint") {
              onUpdateRef.current(payload);
            }
          }
        )
        .subscribe((status: string, err?: any) => {
          if (err || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`[Realtime complaints] Subscription state: ${status}`, err?.message || err);
            startPollingFallback();
          }
        });
    } catch (err: any) {
      console.warn("[Realtime complaints] WebSocket connection failed; falling back to polling:", err?.message || err);
      startPollingFallback();
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, [filterId]);
}
