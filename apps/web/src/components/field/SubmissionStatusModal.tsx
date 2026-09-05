"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Sparkles, Flame, ExternalLink, ArrowLeft } from "lucide-react";

interface SubmissionStatusModalProps {
  response: any;
  parcelId: string;
  surveyNo?: string;
  villageName?: string;
  onDone: () => void;
}

export function SubmissionStatusModal({
  response,
  parcelId,
  surveyNo,
  villageName,
  onDone
}: SubmissionStatusModalProps) {
  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-xl space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white font-display">
            {response.offline ? "Saved to Offline Device Queue" : "Field Verification Synchronized"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Survey No. <span className="text-white font-mono font-semibold">{surveyNo || "104/2B"}</span> · {villageName || "Kanhera Kalan"}
          </p>
        </div>

        {response.offline && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-left text-xs text-amber-300 flex items-start gap-2.5">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{response.message}</span>
          </div>
        )}

        {!response.offline && (
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Causal Propagation Verified
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">Parcel Risk Score</span>
                <span className={`text-base font-bold font-mono ${response.updated_risk_score > 60 ? "text-red-400" : "text-emerald-400"}`}>
                  {response.updated_risk_score} / 100
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">CPM Schedule Float</span>
                <span className={`text-base font-bold font-mono ${response.cpm_delay_days > 0 ? "text-amber-400" : "text-slate-300"}`}>
                  +{response.cpm_delay_days || 0} Days
                </span>
              </div>
            </div>

            {response.is_critical_path && (
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-lg p-2.5 text-red-300 text-xs font-medium">
                <Flame className="w-4 h-4 flex-shrink-0" />
                <span>Injected blocking constraint into CPM schedule. Desktop alert dispatched.</span>
              </div>
            )}

            {response.recommended_action && (
              <div className="text-[11px] text-slate-300 bg-slate-800/60 p-2.5 rounded-lg border border-white/5">
                <span className="text-slate-400 font-semibold block mb-0.5">Recommended Next Action:</span>
                {response.recommended_action}
              </div>
            )}
          </div>
        )}

        <div className="pt-2 space-y-2">
          <button
            onClick={onDone}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Return to Field Queue
          </button>
          <Link
            href={`/parcels/${parcelId}`}
            className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <span>Inspect in Desktop Platform</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
