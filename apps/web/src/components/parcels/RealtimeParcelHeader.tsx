"use client";

import React, { useState } from "react";
import { useRealtimeParcel } from "@/lib/supabase/useRealtime";
import { ProvenanceBadge } from "@/components/common/ProvenanceBadge";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";

interface RealtimeParcelHeaderProps {
  parcelId: string;
  surveyNo: string;
  villageName: string;
  statutoryAct: string;
  initialStatus: string;
  isLapsed: boolean;
  sourceType: string;
}

export function RealtimeParcelHeader({
  parcelId,
  surveyNo,
  villageName,
  statutoryAct,
  initialStatus,
  isLapsed,
  sourceType
}: RealtimeParcelHeaderProps) {
  const [status, setStatus] = useState(initialStatus);
  const [hasDispute, setHasDispute] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Subscribe to real-time parcel changes from Field Operations
  useRealtimeParcel(parcelId, (update) => {
    if (update.table === "parcels" && update.record) {
      if (update.record.acquisition_status) {
        setStatus(update.record.acquisition_status);
      }
      if (update.record.ownership_conflict !== undefined) {
        setHasDispute(update.record.ownership_conflict);
      }
      setLastSyncTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } else if (update.table === "documents" && update.record) {
      if (update.record.document_type === "field_incident") {
        setHasDispute(update.record.status !== "RESOLVED");
        setLastSyncTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    }
  });

  const isVerified = status.toLowerCase() === "verified" || status.toLowerCase() === "possessed";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Cadastral Survey Record
        </span>
        <ProvenanceBadge sourceType={sourceType || "SYNTHETIC"} size="xs" />
        <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7a94" }}>
          ID: {parcelId}
        </span>

        {/* Live Synchronization Beacon */}
        {lastSyncTime && (
          <span style={{
            fontSize: 10,
            fontFamily: "JetBrains Mono, monospace",
            padding: "2px 8px",
            borderRadius: 4,
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.4)",
            color: "#818cf8",
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }}>
            <Sparkles style={{ width: 11, height: 11 }} /> Live Supabase Synced at {lastSyncTime}
          </span>
        )}

        {/* Status Badge with Real-Time State */}
        {isLapsed ? (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(244,63,94,0.2)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e", textTransform: "uppercase", letterSpacing: "0.06em", animation: "pulse 2s infinite" }}>
            ⚠ Sec 19(7) LAPSED
          </span>
        ) : hasDispute || status.toLowerCase() === "disputed" ? (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(244,63,94,0.18)", border: "1px solid rgba(244,63,94,0.45)", color: "#f43f5e", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <AlertTriangle style={{ width: 11, height: 11 }} /> DISPUTED / FIELD BLOCKER
          </span>
        ) : isVerified ? (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.45)", color: "#10b981", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 style={{ width: 11, height: 11 }} /> VERIFIED ON SITE
          </span>
        ) : (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#f59e0b", textTransform: "uppercase" }}>
            {status}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: 26, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
            Survey No. {surveyNo}
          </h1>
          <p style={{ fontSize: 12, color: "#4a5568", marginTop: 6 }}>
            {villageName} · RFCTLARR Act 2013 · {statutoryAct || "NH Act 1956"}
          </p>
        </div>
      </div>
    </div>
  );
}
