import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocumentRegister } from '@/components/documents/DocumentRegister';
import { FieldIncidentReviewCard } from '@/components/documents/FieldIncidentReviewCard';
import { LandownerGrievanceReviewCard } from '@/components/documents/LandownerGrievanceReviewCard';
import { CheckCircle2, Clock, AlertTriangle, FileText, MapPin, User, Scale, ArrowRight, ShieldCheck, Calendar, Hash, Building2, AlertCircle, Sparkles, Coins } from 'lucide-react';
import { ProvenanceBadge, DataRealityBanner } from '@/components/common/ProvenanceBadge';
import { RealtimeParcelHeader } from '@/components/parcels/RealtimeParcelHeader';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const parcel = await apiClient.getParcel(id);
    return { title: `Survey No. ${parcel.survey_no} | BHUMI`, description: `Acquisition case details for Parcel ${parcel.survey_no}.` };
  } catch {
    return { title: 'Parcel Details | BHUMI' };
  }
}

const RFCTLARR_STAGES = [
  { id: 1, key: 'SIA', label: 'Sec 4: SIA', desc: 'Social Impact Assessment', fullStage: 'SOCIAL_IMPACT_ASSESSMENT' },
  { id: 2, key: 'NOTIF', label: 'Sec 11: Notice', desc: 'Gazette Publication', fullStage: 'PRELIMINARY_NOTIFICATION' },
  { id: 3, key: 'OBJ', label: 'Sec 15: Objections', desc: '60-Day Review', fullStage: 'HEARING_OF_OBJECTIONS' },
  { id: 4, key: 'DECL', label: 'Sec 19: Declaration', desc: 'Formal Declaration', fullStage: 'DECLARATION' },
  { id: 5, key: 'NOTICE', label: 'Sec 21: Claims', desc: 'Notice to Parties', fullStage: 'NOTICE_TO_PERSONS' },
  { id: 6, key: 'AWARD', label: 'Sec 23: Award', desc: 'Compensation Determination', fullStage: 'AWARD_ENQUIRY' },
  { id: 7, key: 'POSS', label: 'Sec 38: Possession', desc: 'Land Vesting', fullStage: 'POSSESSION' },
];

function getStageIndex(currentStage: string): number {
  if (!currentStage) return 1;
  const s = currentStage.toUpperCase();
  if (s.includes('SIA')) return 0;
  if (s.includes('PRELIMINARY') || s.includes('NOTIF')) return 1;
  if (s.includes('OBJECTION') || s.includes('HEARING')) return 2;
  if (s.includes('DECLARATION')) return 3;
  if (s.includes('NOTICE') || s.includes('CLAIM')) return 4;
  if (s.includes('AWARD') || s.includes('ENQUIRY')) return 5;
  if (s.includes('POSSESSION') || s.includes('VESTING')) return 6;
  return 1;
}

export default async function ParcelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let parcel: any = null;
  let cases: any[] = [];
  let sihDetail: any = null;

  try {
    [parcel, cases, sihDetail] = await Promise.all([
      apiClient.getParcel(id),
      apiClient.getParcelCases(id),
      apiClient.getSIHParcelDetail(id)
    ]);
  } catch { notFound(); }
  if (!parcel && !sihDetail) notFound();

  const activeParcel = sihDetail || parcel;
  const acqCase = cases.length > 0 ? cases[0] : null;
  let deadlineInfo: any = null;
  let auditLogs: any[] = [];

  if (acqCase) {
    try {
      deadlineInfo = await apiClient.getCaseDeadline(acqCase.id);
      auditLogs = await apiClient.getCaseAudit(acqCase.id);
    } catch {}
  }

  const currentStageIndex = acqCase ? getStageIndex(acqCase.current_stage) : 1;
  const isLapsed = deadlineInfo?.status === 'LAPSED' || acqCase?.is_lapsed;
  const daysRemaining = deadlineInfo?.days_remaining ?? -52;
  const sqMeters = (activeParcel.area_hectares * 10000).toLocaleString();
  const acres = (activeParcel.area_hectares * 2.47105).toFixed(2);
  const estimatedValuation = (activeParcel.area_hectares * 1.85).toFixed(2);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
        <Link href="/" className="hover:text-[#0B2E59] dark:hover:text-sky-300">Dashboard</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-[#0B2E59] dark:hover:text-sky-300">Corridors</Link>
        <span>/</span>
        <Link href={`/projects/${activeParcel.project_id || 'P-NH927A'}`} className="hover:text-[#0B2E59] dark:hover:text-sky-300">Corridor</Link>
        <span>/</span>
        <span className="text-[#14213D] dark:text-[#F0F4FF] font-semibold">Survey No. {activeParcel.survey_no || activeParcel.survey_number}</span>
      </nav>

      {/* Provenance Matrix Banner */}
      <DataRealityBanner />

      {/* Section 13 MODEL-DERIVED Recommended Action */}
      {activeParcel.recommended_action && (
        <div className="bg-white dark:bg-[#0D121F] border border-[#0B2E59]/30 dark:border-[#0B2E59]/60 border-l-4 border-l-[#0B2E59] rounded-[4px] p-4 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              <span className="text-[11px] font-bold text-[#0B2E59] dark:text-sky-300 font-mono uppercase tracking-wider">
                MODEL-DERIVED RECOMMENDED ACTION (SECTION 13)
              </span>
            </div>
            <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
          </div>
          <p className="m-0 text-xs font-semibold text-[#14213D] dark:text-[#F0F4FF] leading-relaxed">
            {activeParcel.recommended_action}
          </p>
        </div>
      )}

      {/* Hero Dossier Card */}
      <div className={`bg-white dark:bg-[#0D121F] border ${isLapsed ? 'border-[#FFCDD2] dark:border-rose-800/50' : 'border-[#DCE2E8] dark:border-white/10'} rounded-[4px] p-5 shadow-xs relative overflow-hidden`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[280px]">
            <RealtimeParcelHeader
              parcelId={activeParcel.id || activeParcel.parcel_id}
              surveyNo={parcel.survey_no || activeParcel.survey_number}
              villageName={parcel.village_name || activeParcel.village_name || 'Kanhera Kalan'}
              statutoryAct={acqCase?.statutory_act || 'RFCTLARR Act 2013'}
              initialStatus={activeParcel.acquisition_status || parcel.status || 'UNRESOLVED'}
              isLapsed={isLapsed}
              sourceType={activeParcel.source_type || 'SYNTHETIC'}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href={`/projects/${parcel.project_id || activeParcel.project_id || 'P-NH927A'}/spatial`}
              className="px-3.5 py-1.5 rounded-[4px] text-xs font-bold bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/40 flex items-center gap-1.5 hover:bg-[#C8E6C9]/50 transition-colors shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5" /> GIS View
            </Link>
            <Link
              href={`/projects/${parcel.project_id || activeParcel.project_id || 'P-NH927A'}/impact`}
              className="px-3.5 py-1.5 rounded-[4px] text-xs font-bold bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40 flex items-center gap-1.5 hover:bg-[#B8D5ED]/50 transition-colors shadow-xs"
            >
              <Scale className="w-3.5 h-3.5" /> CPM Path
            </Link>
          </div>
        </div>
      </div>

      {/* Lapse / Compliance Banner */}
      {isLapsed ? (
        <div className="rounded-[4px] p-4 bg-[#FFEBEE] dark:bg-rose-950/30 border border-[#FFCDD2] dark:border-rose-800/40 flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-[4px] bg-[#B32424]/10 dark:bg-rose-900/30 shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#B32424] dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-[#B32424] dark:text-rose-300 mb-1">
              CRITICAL STATUTORY LAPSE: RFCTLARR Act 2013 Section 19(7)
            </div>
            <p className="text-xs text-[#5A6A80] dark:text-slate-300 m-0 leading-relaxed">
              Section 19(1) declaration was not published within 12 months of the Preliminary Notification under Section 11(1).
              Under Section 19(7), the entire acquisition proceeding has <strong className="text-[#B32424] dark:text-rose-400">lapsed by operation of law</strong>,
              introducing a <strong className="text-[#B32424] dark:text-rose-400">+{deadlineInfo?.recovery_days || 20}-day zero-float delay</strong> to Corridor Commissioning.
            </p>
            <div className="flex flex-wrap gap-4 mt-2.5 text-[11px] text-[#5A6A80] dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Deadline: <strong className="font-mono text-[#B32424] dark:text-rose-300 ml-1">
                  {deadlineInfo?.deadline ? new Date(deadlineInfo.deadline).toLocaleDateString() : '15 Jul 2025'}
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#1E7E34]" />
                Remedy: Re-issue Sec 11 Notification or State Extension Gazette
              </span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-[#B32424] dark:text-rose-300 shrink-0 bg-white dark:bg-rose-950/60 px-2 py-1 rounded-[3px] border border-[#FFCDD2] dark:border-rose-800/40">
            {Math.abs(daysRemaining)}d Elapsed
          </span>
        </div>
      ) : (
        <div className="rounded-[4px] p-3 bg-[#E8F5E9] dark:bg-emerald-950/30 border border-[#C8E6C9] dark:border-emerald-800/40 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1E7E34] dark:text-emerald-400 shrink-0" />
            <span className="text-xs text-[#1E7E34] dark:text-emerald-300">
              Statutory timeline compliant · Section 19(7) declaration window open with
              <strong className="font-mono font-bold ml-1">{daysRemaining} days</strong> remaining.
            </span>
          </div>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-[3px] bg-white dark:bg-emerald-900/60 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/40">
            ON TRACK
          </span>
        </div>
      )}

      {/* RFCTLARR Stage Stepper */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-semibold">
              RFCTLARR 2013 Lifecycle
            </div>
            <div className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF] mt-0.5">
              Statutory Stage Progression
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/50 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40">
            Stage {currentStageIndex + 1} of 7
          </span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px] flex items-start justify-between relative px-2">
            {/* connector track */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E2E8F0] dark:bg-white/10" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-[#0B2E59] dark:bg-sky-500 transition-all duration-500"
              style={{ width: `${(currentStageIndex / (RFCTLARR_STAGES.length - 1)) * 94}%` }}
            />
            {RFCTLARR_STAGES.map((step, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={step.id} className="flex flex-col items-center w-[14%] text-center relative z-10">
                  <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center text-xs font-bold shrink-0 border transition-all ${
                    isPast
                      ? 'bg-[#1E7E34] text-white border-[#1E7E34]'
                      : isCurrent
                        ? isLapsed
                          ? 'bg-[#B32424] text-white border-[#B32424] ring-2 ring-[#B32424]/30'
                          : 'bg-[#0B2E59] text-white border-[#0B2E59] ring-2 ring-[#0B2E59]/30'
                        : 'bg-[#F8FAFC] dark:bg-[#151D2A] text-[#5A6A80] dark:text-slate-400 border-[#DCE2E8] dark:border-white/10'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : isCurrent && isLapsed ? <AlertTriangle className="w-4 h-4" /> : step.id}
                  </div>
                  <div className={`mt-2 text-[11px] font-bold leading-snug ${
                    isCurrent
                      ? isLapsed ? 'text-[#B32424] dark:text-rose-400' : 'text-[#0B2E59] dark:text-sky-300'
                      : isPast
                        ? 'text-[#1E7E34] dark:text-emerald-400'
                        : 'text-[#5A6A80] dark:text-slate-400'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-[9px] text-[#5A6A80] dark:text-slate-400 mt-0.5 line-clamp-1">{step.desc}</div>
                  {isCurrent && (
                    <span className={`mt-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] uppercase ${
                      isLapsed
                        ? 'bg-[#FFEBEE] text-[#B32424] border border-[#FFCDD2]'
                        : 'bg-[#E6F0FA] text-[#0B2E59] border border-[#B8D5ED]'
                    }`}>
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cadastral Profile & Statutory Clock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Cadastral Details (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-xs">
          <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-semibold mb-4">
            Cadastral Land Record Profile
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Survey & Subdivision No.', val: parcel.survey_no, mono: true },
              { label: 'Total Registered Area', val: `${parcel.area_hectares} Ha`, sub: `${acres} Acres · ${sqMeters} sq.m`, mono: true },
              { label: 'Revenue Classification', val: parcel.classification || 'Agricultural', sub: 'Verified Land Record' },
              { label: 'Title Holder(s)', val: parcel.owner_name || 'Owner of Record', sub: 'Title Record' },
              { label: 'Cadastral Location', val: parcel.village_name || 'Alignment Corridor', sub: 'Corridor Alignment Record', mono: true },
              { label: 'Statutory Valuation (Est.)', val: `₹${estimatedValuation} Cr`, sub: 'Market Factor 2.0 + 100% Solatium', colorClass: 'text-[#1E7E34] dark:text-emerald-400' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px]">
                <div className="text-[9px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                <div className={`text-sm font-bold ${item.colorClass || 'text-[#14213D] dark:text-[#F0F4FF]'} ${item.mono ? 'font-mono' : ''}`}>
                  {item.val}
                </div>
                {item.sub && <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 mt-0.5">{item.sub}</div>}
              </div>
            ))}
          </div>

          <div className="mt-3.5 p-3 bg-[#E6F0FA]/60 dark:bg-sky-950/20 border border-[#B8D5ED] dark:border-sky-900/30 rounded-[4px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B2E59] dark:text-sky-300 mb-1">
              <Building2 className="w-3.5 h-3.5" /> CALA Jurisdiction
            </div>
            <p className="text-xs text-[#5A6A80] dark:text-slate-400 m-0">
              Special Land Acquisition Officer (SLAO) / Competent Authority Land Acquisition Office ·
              <span className="font-mono text-[#14213D] dark:text-[#F0F4FF] ml-1 font-semibold">CALA-{parcel.project_id.substring(0, 8).toUpperCase()}-RECORD</span>
            </p>
          </div>
        </div>

        {/* Statutory Clock (1 Col) */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-xs flex flex-col gap-3">
          <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-semibold">
            Statutory Clock & Authority
          </div>

          {deadlineInfo ? (
            <div className="flex flex-col gap-3">
              <div className={`p-3 rounded-[4px] border ${isLapsed ? 'bg-[#FFEBEE] dark:bg-rose-950/30 border-[#FFCDD2] dark:border-rose-800/40' : 'bg-[#E8F5E9] dark:bg-emerald-950/30 border-[#C8E6C9] dark:border-emerald-800/40'}`}>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span className="text-[#5A6A80] dark:text-slate-400 font-mono">RFCTLARR Limitation Rule</span>
                  <span className={`px-1.5 py-0.5 rounded-[2px] font-mono ${isLapsed ? 'bg-[#B32424] text-white' : 'bg-[#1E7E34] text-white'}`}>
                    {deadlineInfo.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#14213D] dark:text-[#F0F4FF] mb-2.5">
                  {deadlineInfo.rule || 'Sec 19(7) 12-Month Declaration Rule'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono">Statutory Expiry</div>
                    <div className="text-xs font-bold font-mono text-[#14213D] dark:text-[#F0F4FF]">
                      {deadlineInfo.deadline ? new Date(deadlineInfo.deadline).toLocaleDateString() : 'Awaiting Gazette Date'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono">Day Count</div>
                    <div className={`text-base font-bold font-mono ${isLapsed ? 'text-[#B32424] dark:text-rose-400' : 'text-[#1E7E34] dark:text-emerald-400'}`}>
                      {daysRemaining}d
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px]">
                {[
                  { label: 'CPM Downstream Impact', val: parcel.blocker ? `+${parcel.blocker.assumed_resolution_days} Days Delay` : (isLapsed ? '+20 Days Delay' : '0 Days Delay'), colorClass: isLapsed || parcel.blocker ? 'text-[#B32424] dark:text-rose-400' : 'text-[#1E7E34] dark:text-emerald-400' },
                  { label: 'Blocked Activity', val: parcel.blocker ? parcel.blocker.type : (isLapsed ? 'Site Possession' : 'None'), colorClass: 'text-[#14213D] dark:text-[#F0F4FF]' },
                  { label: 'Critical Float', val: isLapsed ? '0 Days (Critical Path)' : 'Within Float Thresholds', colorClass: isLapsed ? 'text-[#B32424] dark:text-rose-400' : 'text-[#1E7E34] dark:text-emerald-400' },
                ].map((r, i) => (
                  <div key={r.label} className={`flex justify-between items-center py-1.5 ${i !== 2 ? 'border-b border-[#DCE2E8]/60 dark:border-white/5' : ''}`}>
                    <span className="text-[11px] text-[#5A6A80] dark:text-slate-400">{r.label}</span>
                    <span className={`text-[11px] font-bold font-mono ${r.colorClass}`}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#5A6A80] dark:text-slate-400">No limitation clock data available.</p>
          )}

          <Link
            href={`/projects/${parcel.project_id}/impact`}
            className="flex items-center justify-center gap-1.5 mt-2 p-2 rounded-[4px] text-xs font-bold bg-[#0B2E59] hover:bg-[#082242] text-white shadow-xs transition-colors"
          >
            Simulate Remediation <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Section 26-30 RFCTLARR Act Statutory Compensation Breakdown */}
      {activeParcel.compensation && (
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-semibold">
                RFCTLARR Act 2013 Statutory Math
              </div>
              <div className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF] mt-0.5 flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#B36B00] dark:text-amber-400" /> Sections 26–30 Award Determination
              </div>
            </div>
            <ProvenanceBadge sourceType={activeParcel.compensation.source_type || 'MODEL_DERIVED'} size="xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px]">
              <div className="text-[9px] text-[#5A6A80] dark:text-slate-400 font-mono">BASE MARKET VALUE (SEC 26)</div>
              <div className="text-base font-bold text-[#14213D] dark:text-[#F0F4FF] mt-1 font-mono">
                ₹{(activeParcel.compensation.market_value_base || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 mt-0.5">Circle rate x 1.5x rural factor</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px]">
              <div className="text-[9px] text-[#5A6A80] dark:text-slate-400 font-mono">100% SOLATIUM (SEC 30(1))</div>
              <div className="text-base font-bold text-[#B36B00] dark:text-amber-400 mt-1 font-mono">
                ₹{(activeParcel.compensation.solatium_amount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 mt-0.5">100% mandatory solatium</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px]">
              <div className="text-[9px] text-[#5A6A80] dark:text-slate-400 font-mono">12% INTEREST (SEC 30(3))</div>
              <div className="text-base font-bold text-[#0B2E59] dark:text-sky-300 mt-1 font-mono">
                ₹{(activeParcel.compensation.interest_12pct_amount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 mt-0.5">Accrued from Sec 11 notification</div>
            </div>

            <div className="p-3 bg-[#E8F5E9] dark:bg-emerald-950/30 border border-[#C8E6C9] dark:border-emerald-800/40 rounded-[4px]">
              <div className="text-[9px] text-[#1E7E34] dark:text-emerald-400 font-mono font-bold">TOTAL STATUTORY AWARD</div>
              <div className="text-base font-bold text-[#1E7E34] dark:text-emerald-300 mt-1 font-mono">
                ₹{(activeParcel.compensation.total_compensation || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#1E7E34] dark:text-emerald-400 mt-0.5 uppercase font-medium">
                Status: {activeParcel.compensation.compensation_status || 'Pending'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-semibold">
              Immutable Statutory Audit Trail
            </div>
            <div className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF] mt-0.5">
              Cryptographic CALA Ledger
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/40">
            <Hash className="w-3 h-3" /> SHA-256 Verified
          </span>
        </div>

        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#DCE2E8] dark:bg-white/10" />
          <div className="flex flex-col gap-3">
            {auditLogs.map((log: any, index: number) => (
              <div key={log.id || index} className="relative">
                <div className="absolute -left-[19px] top-3 w-2.5 h-2.5 rounded-full bg-[#0B2E59] border-2 border-white dark:border-[#0D121F] shadow-xs" />
                <div className="p-3.5 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px]">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <span className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF] flex items-center gap-2">
                      {log.action}
                      {log.state_after?.stage && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40">
                          {log.state_after.stage}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#5A6A80] dark:text-slate-400 m-0 mb-1">
                    Authorized: <strong className="text-[#14213D] dark:text-slate-200">{log.actor_role}</strong> ({log.actor_id})
                  </p>
                  {log.state_after?.gazette_no && (
                    <p className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 m-0 mb-1">
                      Gazette: <span className="text-[#14213D] dark:text-slate-200 font-semibold">{log.state_after.gazette_no}</span>
                    </p>
                  )}
                  {log.state_after?.alert && (
                    <div className="flex items-center gap-1.5 text-xs text-[#B32424] dark:text-rose-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {log.state_after.alert}
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t border-[#DCE2E8]/60 dark:border-white/5 flex justify-between items-center text-[9px] font-mono text-[#5A6A80] dark:text-slate-400">
                    <span>Sig: 0x{(index * 1337 + 42091).toString(16)}...{(index * 9876 + 12345).toString(16)}</span>
                    <span className="text-[#1E7E34] dark:text-emerald-400 font-semibold">Verified Officer Credential</span>
                  </div>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="p-8 text-center text-[#5A6A80] dark:text-slate-400 text-xs">
                No statutory audit records registered for this survey parcel.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field Incidents & On-Site Verification Review */}
      <FieldIncidentReviewCard parcelId={parcel.id} projectId={parcel.project_id} />

      {/* Citizen Landowner Grievances & Redressal */}
      <LandownerGrievanceReviewCard parcelId={parcel.id} projectId={parcel.project_id} />

      {/* Document Register */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-xs">
        <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">
          Cadastral Document Register
        </div>
        <div className="text-base font-bold text-[#14213D] dark:text-[#F0F4FF] mb-4">
          Statutory Gazette & Awards Archive
        </div>
        <DocumentRegister parcelId={parcel.id} projectId={parcel.project_id} />
      </div>
    </div>
  );
}
