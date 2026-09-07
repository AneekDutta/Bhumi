'use client';

import React from 'react';
import {
  X,
  MapPin,
  User,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Home,
  ShieldAlert,
  ArrowRight,
  GitBranch,
  Info,
  BookOpen,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { ValuationAwardCard } from '@/components/map/ValuationAwardCard';
import { getParcelLegalContext, getParcelDeadlines } from '@/lib/api';

interface ParcelDetailModalProps {
  parcel: any;
  onClose: () => void;
  onSimulate?: (parcelId: string) => void;
}

export function ParcelDetailModal({ parcel, onClose, onSimulate }: ParcelDetailModalProps) {
  const [legalContext, setLegalContext] = React.useState<any>(null);
  const [deadlines, setDeadlines] = React.useState<any[]>([]);

  React.useEffect(() => {
    let active = true;
    if (parcel?.parcel_id) {
      getParcelLegalContext(parcel.parcel_id)
        .then((data) => {
          if (active) setLegalContext(data);
        })
        .catch(() => {});

      getParcelDeadlines(parcel.parcel_id)
        .then((data) => {
          if (active && Array.isArray(data)) setDeadlines(data);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [parcel?.parcel_id]);

  if (!parcel) return null;

  const sqM = Number(parcel.area_sqm || 0).toLocaleString();
  const ha = Number(parcel.area_hectares || (parcel.area_sqm ? parcel.area_sqm / 10000 : 0)).toFixed(3);
  const critScore = Number(parcel.criticality_score || 0).toFixed(1);
  const riskScore = Number(parcel.risk_score || 0).toFixed(1);

  const comp = parcel.compensation || {};
  const rr = parcel.rr || {};
  const legals = parcel.legal_cases || [];
  const docs = parcel.documents || [];
  const verifs = parcel.verifications || [];
  const upstream = parcel.upstream_blockers || [];
  const downstream = parcel.downstream_dependencies || [];
  const breakdown = parcel.criticality_breakdown || {};

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full max-w-[580px] bg-white dark:bg-[#090d16] border-l border-[#DCE2E8] dark:border-white/10 shadow-2xl z-[1000] flex flex-col overflow-y-auto">
      {/* Modal Header */}
      <div className="p-5 border-b border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0D121F] flex items-start justify-between sticky top-0 z-10 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
              CADASTRAL PARCEL DOSSIER
            </span>
            <ProvenanceBadge sourceType={parcel.source_type || 'SYNTHETIC'} size="xs" />
          </div>
          <h2 className="text-xl font-bold text-[#14213D] dark:text-[#F0F4FF] m-0">
            Survey No. {parcel.survey_number || parcel.survey_no}
          </h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#5A6A80] dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
              {parcel.village_name || 'Kanhera Kalan'}, {parcel.tehsil || 'Ramganj Mandi'}
            </span>
            <span>•</span>
            <span className="font-mono">{ha} ha ({sqM} sq.m)</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-white/5 text-[#5A6A80] dark:text-slate-400 hover:bg-[#F4F6F8] dark:hover:bg-white/10 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Section 13 Prominent MODEL_DERIVED Recommended Action */}
        <div className="p-4 rounded-none bg-[#E8F1FA] dark:bg-[#0B2E59]/30 border border-[#B8D5E5] dark:border-[#0B2E59] border-l-4 border-l-[#0B2E59] shadow-none">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#0B2E59] dark:text-sky-300" />
              <span className="text-[11px] font-bold text-[#0B2E59] dark:text-sky-200 uppercase tracking-wider font-mono">
                MODEL-DERIVED RECOMMENDED ACTION
              </span>
            </div>
            <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
          </div>
          <p className="m-0 text-xs text-[#14213D] dark:text-[#F0F4FF] font-semibold leading-relaxed">
            {parcel.recommended_action || 'Proceed with statutory land record mutation and joint verification.'}
          </p>
          {onSimulate && (
            <button
              onClick={() => onSimulate(parcel.parcel_id)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <span>Simulate Intervention Effect</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Section 10 Composite Intelligence KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono font-bold uppercase">CRITICALITY SCORE</span>
              <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#0B2E59] dark:text-sky-400 mt-1">
              {critScore} <span className="text-xs text-[#5A6A80] dark:text-slate-400">/ 100</span>
            </div>
            {breakdown.w1_downstream_segments !== undefined && (
              <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 mt-1.5 font-mono">
                Seg: {breakdown.w1_downstream_segments} • MS: {breakdown.w2_downstream_milestones} • SPOF: {breakdown.w3_single_point_failure}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono font-bold uppercase">RISK SCORE</span>
              <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
            </div>
            <div className={`text-2xl font-bold font-mono mt-1 ${
              Number(riskScore) >= 60 ? 'text-[#B32424] dark:text-rose-400' : Number(riskScore) >= 30 ? 'text-[#B36B00] dark:text-amber-400' : 'text-[#1E7E34] dark:text-emerald-400'
            }`}>
              {riskScore} <span className="text-xs text-[#5A6A80] dark:text-slate-400">/ 100</span>
            </div>
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 mt-1.5 font-medium">
              {Number(riskScore) >= 60 ? 'High Risk Injunction' : Number(riskScore) >= 30 ? 'Moderate Statutory Delay' : 'Low Impedance'}
            </div>
          </div>
        </div>

        {/* Ownership & Classification */}
        <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 shadow-xs">
          <h4 className="m-0 mb-3 text-xs text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" /> Landholder & Tenure
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#5A6A80] dark:text-slate-400">Owner Name:</span>{' '}
              <span className="text-[#14213D] dark:text-[#F0F4FF] font-bold">{parcel.owner?.name || parcel.owner_name || 'Geeta Yadav'}</span>
            </div>
            <div>
              <span className="text-[#5A6A80] dark:text-slate-400">Tenure Type:</span>{' '}
              <span className="text-[#14213D] dark:text-slate-300">{parcel.owner?.owner_type || 'individual'}</span>
            </div>
            <div>
              <span className="text-[#5A6A80] dark:text-slate-400">Land Classification:</span>{' '}
              <span className="text-[#14213D] dark:text-slate-300 capitalize">{parcel.land_use || 'agricultural'}</span>
            </div>
            <div>
              <span className="text-[#5A6A80] dark:text-slate-400">Acquisition Stage:</span>{' '}
              <span className={`font-mono font-bold uppercase ${parcel.acquisition_status === 'possessed' ? 'text-[#1E7E34] dark:text-emerald-400' : 'text-[#B36B00] dark:text-amber-400'}`}>
                {parcel.acquisition_status || 'not_started'}
              </span>
            </div>
          </div>
          {parcel.ownership_conflict && (
            <div className="mt-2.5 p-2 rounded-[3px] bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Active Conflict: {parcel.conflict_type?.replace('_', ' ')}
            </div>
          )}
        </div>

        {/* RFCTLARR Act Sec 26-30 Statutory Compensation & Operational Review */}
        <ValuationAwardCard
          parcelId={parcel.parcel_id}
          initialCompensation={comp}
        />

        {/* Governing Statutory Provisions & Rights */}
        <div className="p-4 rounded-[4px] bg-[#E6F0FA]/40 dark:bg-sky-950/20 border border-[#B8D5E5] dark:border-sky-800/40 shadow-xs">
          <div className="flex justify-between items-center mb-2.5">
            <h4 className="m-0 text-xs text-[#0B2E59] dark:text-sky-400 uppercase font-mono font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#0B5FA5] dark:text-sky-400" /> Applicable Statutory Provisions & Rights
            </h4>
            <span className="text-[9px] font-mono text-[#0B2E59] dark:text-sky-300 font-bold px-1.5 py-0.5 rounded-[2px] bg-[#0B2E59]/10 dark:bg-sky-400/20">
              RFCTLARR 2013
            </span>
          </div>

          {legalContext?.provisions && legalContext.provisions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {legalContext.provisions.slice(0, 3).map((p: any) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-[3px] bg-white dark:bg-white/5 border border-[#DCE2E8]/70 dark:border-white/5 text-xs flex flex-col gap-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0B2E59] dark:text-sky-300">
                      {p.section_title || p.section_number}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      Sec {p.section_number}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A6A80] dark:text-slate-300 leading-relaxed">
                    {p.summary || p.statutory_text?.slice(0, 160) + '...'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#5A6A80] dark:text-slate-400 italic">
              Loading applicable statutory provisions...
            </div>
          )}

          <div className="flex justify-end mt-2.5">
            <a
              href="/legal-rights"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#0B5FA5] dark:text-sky-400 text-xs font-bold hover:underline"
            >
              <span>Open Legal & Rights Knowledge Center</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Case Statutory Clocks & Hard Deadlines */}
        {deadlines.length > 0 && (
          <div className="p-4 rounded-[4px] bg-[#FFF8E1]/50 dark:bg-amber-950/20 border border-[#FFE082] dark:border-amber-800/40 shadow-xs">
            <div className="flex justify-between items-center mb-2.5">
              <h4 className="m-0 text-xs text-[#B36B00] dark:text-amber-400 uppercase font-mono font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#B36B00] dark:text-amber-400" /> Case Statutory Clocks ({deadlines.length})
              </h4>
              <span className="text-[9px] font-mono text-[#B36B00] dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-[2px] bg-[#B36B00]/10 dark:bg-amber-400/20">
                DECISION SUPPORT
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {deadlines.map((dl: any) => {
                const isOverdue = dl.status === 'OVERDUE' || dl.status === 'LAPSED';
                const isLapse = dl.calculation_trace?.is_mandatory_lapse;
                const badgeColor = isOverdue ? 'text-[#B32424] bg-[#FFEBEE] border-[#FFCDD2]' : dl.status === 'DUE_SOON' ? 'text-[#B36B00] bg-[#FFF8E1] border-[#FFE082]' : 'text-[#1E7E34] bg-[#E8F5E9] border-[#C8E6C9]';
                return (
                  <div
                    key={dl.id}
                    className={`p-2.5 rounded-[3px] border text-xs flex flex-col gap-1 ${
                      isOverdue && isLapse ? 'bg-[#FFEBEE]/40 dark:bg-rose-950/20 border-rose-300' : 'bg-white dark:bg-white/5 border-[#DCE2E8]/70 dark:border-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#14213D] dark:text-slate-200">
                        {dl.calculation_trace?.rule_name || dl.rule_id}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                        {dl.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#5A6A80] dark:text-slate-400">
                      <span>Due: <strong className="text-[#14213D] dark:text-slate-200">{dl.calculated_due_date}</strong></span>
                      <span>Trigger: {dl.trigger_date} ({dl.trigger_event})</span>
                    </div>
                    {isLapse && (
                      <div className="text-[10px] text-[#B32424] dark:text-rose-400 font-semibold italic mt-0.5">
                        ⚠️ Statutory Lapse Warning: Failure to comply causes proceedings to lapse by operation of law.
                      </div>
                    )}
                    {dl.calculation_trace?.operational_delay_cpm_days > 0 && isOverdue && (
                      <div className="text-[10px] text-[#B36B00] dark:text-amber-400 font-mono mt-0.5">
                        CPM Simulation Heuristic: +{dl.calculation_trace.operational_delay_cpm_days}d estimated schedule delay if lapsed.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legal Injunctions / Disputes */}
        {legals.length > 0 && (
          <div className="p-4 rounded-[4px] bg-[#FFEBEE]/50 dark:bg-rose-950/20 border border-[#FFCDD2] dark:border-rose-800/40 shadow-xs">
            <div className="flex justify-between items-center mb-2.5">
              <h4 className="m-0 text-xs text-[#B32424] dark:text-rose-400 uppercase font-mono font-bold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Judicial Proceedings
              </h4>
              <ProvenanceBadge sourceType={legals[0].source_type || 'SYNTHETIC'} size="xs" />
            </div>
            {legals.map((l: any, i: number) => (
              <div key={i} className="text-xs text-[#14213D] dark:text-[#F0F4FF] leading-relaxed">
                <div className="font-bold text-[#B32424] dark:text-rose-300">{l.case_name} ({l.court})</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400">Issue: {l.legal_issue} • Status: <span className="text-[#B36B00] dark:text-amber-400 font-bold uppercase">{l.legal_status}</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Documents & Verifications */}
        <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 shadow-xs">
          <h4 className="m-0 mb-2.5 text-xs text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" /> Land Records & Documents ({docs.length})
          </h4>
          <div className="flex flex-col gap-1.5">
            {docs.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs p-2 rounded-[3px] bg-white dark:bg-white/5 border border-[#DCE2E8]/60 dark:border-white/5">
                <span className="text-[#14213D] dark:text-slate-200 capitalize">{d.document_type?.replace('_', ' ')}</span>
                <span className={`font-mono text-[10px] font-bold uppercase ${
                  d.document_status === 'verified' ? 'text-[#1E7E34] dark:text-emerald-400' : d.document_status === 'missing' ? 'text-[#B32424] dark:text-rose-400' : 'text-[#B36B00] dark:text-amber-400'
                }`}>
                  {d.document_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 11 Dependency Graph Connections */}
        <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 shadow-xs">
          <h4 className="m-0 mb-2.5 text-xs text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" /> Critical Chain Dependencies
          </h4>
          <div className="text-xs text-[#5A6A80] dark:text-slate-400 flex flex-col gap-1.5">
            <div>
              <span>Upstream Direct Blockers:</span>{' '}
              <span className={`font-bold ml-1 ${upstream.length > 0 ? 'text-[#B32424] dark:text-rose-400' : 'text-[#1E7E34] dark:text-emerald-400'}`}>
                {upstream.length} Active Blocker(s)
              </span>
            </div>
            <div>
              <span>Downstream Segments Impacted:</span>{' '}
              <span className="text-[#0B2E59] dark:text-sky-300 font-bold ml-1">{downstream.length || 2} Segments</span>
            </div>
            <div>
              <span>Critical Path Membership:</span>{' '}
              <span className={`font-bold ml-1 ${parcel.is_critical_path ? 'text-[#B32424] dark:text-rose-400' : 'text-[#1E7E34] dark:text-emerald-400'}`}>
                {parcel.is_critical_path ? 'YES (Zero-Float Corridor Bottleneck)' : 'NO (Has Float)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
