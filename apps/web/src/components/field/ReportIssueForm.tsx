"use client";

import React from "react";
import { AlertTriangle, AlertOctagon, Flame } from "lucide-react";

export const STRUCTURED_ISSUE_TYPES = [
  { key: "ownership_mismatch", label: "Ownership Mismatch", desc: "Disputed title or unmutated heirs" },
  { key: "boundary_discrepancy", label: "Boundary Discrepancy", desc: "Encroachment or survey limit deviation" },
  { key: "missing_document", label: "Missing Document", desc: "RoR, mutation deed, or ID proof absent" },
  { key: "occupation_issue", label: "Occupation Issue", desc: "Unauthorized squatter or physical resistance" },
  { key: "compensation_issue", label: "Compensation Issue", desc: "Award amount dispute or multiple bank claims" },
  { key: "rr_issue", label: "R&R Issue", desc: "Resettlement & Rehabilitation opposition" },
  { key: "legal_issue", label: "Legal Issue", desc: "Court stay or pending title litigation" },
  { key: "access_issue", label: "Access Issue", desc: "Physical survey access blocked by local group" },
  { key: "other", label: "Other Observation", desc: "General environmental or ground anomaly" }
];

interface ReportIssueFormProps {
  hasIssue: boolean;
  issueType: string;
  issueSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL_STOPPAGE";
  onToggleIssue: (enabled: boolean) => void;
  onChangeType: (type: string) => void;
  onChangeSeverity: (sev: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL_STOPPAGE") => void;
}

export function ReportIssueForm({
  hasIssue,
  issueType,
  issueSeverity,
  onToggleIssue,
  onChangeType,
  onChangeSeverity
}: ReportIssueFormProps) {
  return (
    <div className={`rounded-2xl p-4 shadow-lg space-y-4 border transition-all ${
      hasIssue
        ? "bg-red-950/20 border-red-500/50"
        : "bg-slate-800/90 border-slate-700"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${hasIssue ? "text-red-400" : "text-slate-400"}`} />
          <span className="text-xs font-bold text-white">
            Flag Ground Blocker / Dispute Issue
          </span>
        </div>
        <input
          type="checkbox"
          checked={hasIssue}
          onChange={(e) => onToggleIssue(e.target.checked)}
          className="w-5 h-5 rounded border-slate-700 text-red-600 focus:ring-red-500 cursor-pointer"
        />
      </div>

      {hasIssue && (
        <div className="space-y-3 pt-2 border-t border-red-500/20 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">
              Structured Issue Classification
            </label>
            <select
              value={issueType}
              onChange={(e) => onChangeType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-medium cursor-pointer"
            >
              {STRUCTURED_ISSUE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.desc})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">
              Severity Level
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_STOPPAGE'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => onChangeSeverity(sev)}
                  className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                    issueSeverity === sev
                      ? sev === 'CRITICAL_STOPPAGE'
                        ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/50"
                        : "bg-amber-600 border-amber-500 text-white"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {sev === 'CRITICAL_STOPPAGE' ? 'CRITICAL' : sev}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Causal Intelligence Notice */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-[11px] text-red-200 flex items-start gap-2 leading-relaxed">
            <AlertOctagon className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <strong className="text-red-300 block mb-0.5">Causal CPM Propagation Hook:</strong>
              Reporting this issue triggers the NetworkX Critical Path engine, injects a dependency edge, updates the parcel risk score (+35), and alerts the desktop Command Unit.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
