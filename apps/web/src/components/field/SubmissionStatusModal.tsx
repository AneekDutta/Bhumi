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
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-6 text-center shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/40 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {response.offline ? "Saved to Offline Device Queue" : "Field Verification Synchronized"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Survey No. <span className="text-[#0B2E59] dark:text-sky-300 font-mono font-bold">{surveyNo || "104/2B"}</span> · {villageName || "Kanhera Kalan"}
          </p>
        </div>

        {response.offline && (
          <div className="bg-[#FFF8E1] dark:bg-amber-950/40 border border-[#FFE082] dark:border-amber-800/40 rounded-[4px] p-3 text-left text-xs text-[#B36B00] dark:text-amber-300 flex items-start gap-2.5">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{response.message}</span>
          </div>
        )}

        {!response.offline && (
          <div className="bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B2E59] dark:text-sky-300 font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" /> Causal Propagation Verified
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white dark:bg-[#0D121F] p-2.5 rounded-[3px] border border-[#DCE2E8] dark:border-white/10 shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-mono uppercase">Parcel Risk Score</span>
                <span className={`text-sm font-bold font-mono ${response.updated_risk_score > 60 ? "text-[#B32424] dark:text-rose-400" : "text-[#1E7E34] dark:text-emerald-400"}`}>
                  {response.updated_risk_score} / 100
                </span>
              </div>
              <div className="bg-white dark:bg-[#0D121F] p-2.5 rounded-[3px] border border-[#DCE2E8] dark:border-white/10 shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-mono uppercase">CPM Schedule Float</span>
                <span className={`text-sm font-bold font-mono ${response.cpm_delay_days > 0 ? "text-[#B36B00] dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
                  +{response.cpm_delay_days || 0} Days
                </span>
              </div>
            </div>

            {response.is_critical_path && (
              <div className="flex items-center gap-2 bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 rounded-[3px] p-2.5 text-[#B32424] dark:text-rose-300 text-xs font-medium">
                <Flame className="w-4 h-4 flex-shrink-0" />
                <span>Injected blocking constraint into CPM schedule. Desktop alert dispatched.</span>
              </div>
            )}

            {response.recommended_action && (
              <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0D121F] p-2.5 rounded-[3px] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">Recommended Next Action:</span>
                {response.recommended_action}
              </div>
            )}
          </div>
        )}

        <div className="pt-2 space-y-2">
          <button
            onClick={onDone}
            className="w-full py-2.5 px-4 bg-[#1E7E34] hover:bg-[#166527] text-white rounded-[4px] text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Return to Field Queue
          </button>
          <Link
            href={`/parcels/${parcelId}`}
            className="w-full py-2 px-4 bg-white dark:bg-white/5 hover:bg-[#F4F6F8] dark:hover:bg-white/10 text-[#0B2E59] dark:text-slate-200 border border-[#DCE2E8] dark:border-white/10 rounded-[4px] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Inspect in Desktop Platform</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
