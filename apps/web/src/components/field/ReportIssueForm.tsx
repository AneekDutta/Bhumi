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
    <div className={`rounded-[4px] p-4 shadow-xs space-y-4 border transition-all ${
      hasIssue
        ? "bg-[#FFEBEE]/60 dark:bg-rose-950/20 border-[#FFCDD2] dark:border-rose-800/40"
        : "bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${hasIssue ? "text-[#B32424] dark:text-rose-400" : "text-[#0B2E59] dark:text-slate-400"}`} />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Flag Ground Blocker / Dispute Issue
          </span>
        </div>
        <input
          type="checkbox"
          checked={hasIssue}
          onChange={(e) => onToggleIssue(e.target.checked)}
          className="w-4 h-4 rounded-[2px] border-[#DCE2E8] dark:border-slate-700 text-[#B32424] focus:ring-[#B32424] cursor-pointer"
        />
      </div>

      {hasIssue && (
        <div className="space-y-3 pt-2 border-t border-[#FFCDD2] dark:border-rose-800/40 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">
              Structured Issue Classification
            </label>
            <select
              value={issueType}
              onChange={(e) => onChangeType(e.target.value)}
              className="w-full bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/15 rounded-[3px] px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B2E59] font-medium cursor-pointer"
            >
              {STRUCTURED_ISSUE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.desc})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">
              Severity Level
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_STOPPAGE'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => onChangeSeverity(sev)}
                  className={`py-2 px-1 text-center rounded-[3px] text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                    issueSeverity === sev
                      ? sev === 'CRITICAL_STOPPAGE'
                        ? "bg-[#B32424] border-[#B32424] text-white shadow-xs"
                        : sev === 'HIGH'
                          ? "bg-[#B36B00] border-[#B36B00] text-white"
                          : "bg-[#0B2E59] border-[#0B2E59] text-white"
                      : "bg-white dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/15 text-slate-600 dark:text-slate-400 hover:bg-[#F4F6F8] dark:hover:bg-white/5"
                  }`}
                >
                  {sev === 'CRITICAL_STOPPAGE' ? 'CRITICAL' : sev}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Causal Intelligence Notice */}
          <div className="bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 rounded-[4px] p-3 text-[11px] text-[#B32424] dark:text-rose-200 flex items-start gap-2 leading-relaxed">
            <AlertOctagon className="w-4 h-4 flex-shrink-0 text-[#B32424] dark:text-rose-400 mt-0.5" />
            <div>
              <strong className="text-[#B32424] dark:text-rose-300 block mb-0.5">Causal CPM Propagation Hook:</strong>
              Reporting this issue triggers the NetworkX Critical Path engine, injects a dependency edge, updates the parcel risk score (+35), and alerts the desktop Command Unit.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
