"use client";

import { useEffect, useRef } from "react";
import { createClient } from "./client";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook to subscribe to real-time updates for a specific parcel.
 * Listens for postgres_changes on 'parcels', 'documents', and 'audit_logs'.
 * Automatically cleans up the channel on component unmount.
 */
export function useRealtimeParcel(
  parcelId: string | undefined,
  onUpdate: (payload: { eventType: string; table: string; record: any }) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!parcelId) return;

    const supabase = createClient();
    const channelName = `rt-parcel-${parcelId.replace(/[^a-zA-Z0-9_-]/g, "_")}-${Date.now()}`;

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parcels"
        },
        (payload) => {
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
        (payload) => {
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
        (payload) => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parcelId]);
}

/**
 * Hook to subscribe to real-time incident updates.
 * Listens for changes on 'documents' (document_type = 'field_incident') and 'audit_logs'.
 */
export function useRealtimeIncidents(
  parcelId: string | undefined,
  onUpdate: (payload: { eventType: string; record: any }) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const supabase = createClient();
    const tag = parcelId ? parcelId.replace(/[^a-zA-Z0-9_-]/g, "_") : "all";
    const channelName = `rt-incidents-${tag}-${Date.now()}`;

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents"
        },
        (payload) => {
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
        (payload) => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parcelId]);
}

/**
 * Hook to subscribe to global project & corridor updates for the dashboard.
 */
export function useRealtimeDashboard(
  onUpdate: () => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const supabase = createClient();
    const channelName = `rt-dashboard-${Date.now()}`;

    const channel = supabase
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

/**
 * Hook to subscribe to real-time Citizen Grievance updates.
 * Listens for changes on 'documents' (document_type = 'landowner_complaint') and 'audit_logs'.
 * Synchronizes across Landowner, Admin Web, and Field Operations.
 */
export function useRealtimeComplaints(
  filterId: string | undefined,
  onUpdate: (payload?: any) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const supabase = createClient();
    const tag = filterId ? filterId.replace(/[^a-zA-Z0-9_-]/g, "_") : "all";
    const channelName = `rt-complaints-${tag}-${Date.now()}`;

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents"
        },
        (payload) => {
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
        (payload) => {
          const rec: any = payload.new;
          if (rec?.action?.includes("COMPLAINT") || rec?.entity_type === "complaint") {
            onUpdateRef.current(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterId]);
}
