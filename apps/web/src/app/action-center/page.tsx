'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Scale,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FileCheck2,
  FileX2,
  ArrowRight,
  HelpCircle,
  Building2,
  Lock,
  Compass,
  FileText,
  X,
  Layers,
  Calendar,
  Eye,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import {
  getOfficerActions,
  getOfficerActionSummary,
  resolveOfficerAction,
  recordActionCourtStay,
  type OfficerActionItem,
  type OfficerActionSummary,
  type ActionEvidenceInfo
} from '@/lib/api';

type CategoryFilter = 'ALL' | 'CRITICAL' | 'DUE_SOON' | 'BLOCKED' | 'PROJECT_IMPACT' | 'UPCOMING' | 'COMPLETED';

const CATEGORY_TABS: { key: CategoryFilter; label: string; countKey?: keyof OfficerActionSummary; color: string }[] = [
  { key: 'ALL', label: 'All Actions', color: 'slate' },
  { key: 'CRITICAL', label: 'Critical Lapse / Urgent', countKey: 'critical_count', color: 'rose' },
  { key: 'DUE_SOON', label: 'Due Soon (≤ 30d)', countKey: 'due_soon_count', color: 'amber' },
  { key: 'BLOCKED', label: 'Blocked / Deficient', countKey: 'blocked_count', color: 'orange' },
  { key: 'PROJECT_IMPACT', label: 'Project Impact (CPM)', countKey: 'project_impact_count', color: 'sky' },
  { key: 'UPCOMING', label: 'Upcoming Clocks', countKey: 'upcoming_count', color: 'sky' },
  { key: 'COMPLETED', label: 'Completed Actions', countKey: 'completed_count', color: 'emerald' },
];

export default function OfficerActionCenterPage() {
  const [actions, setActions] = useState<OfficerActionItem[]>([]);
  const [summary, setSummary] = useState<OfficerActionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [parcelFilter, setParcelFilter] = useState<string>('');

  // Debounce search keystrokes (250ms) to avoid request bursts
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Selected Action for Detailed Drawer / Modal
  const [selectedAction, setSelectedAction] = useState<OfficerActionItem | null>(null);
  const [selectedCausalStep, setSelectedCausalStep] = useState<number>(0);

  // Modal Action Form States
  const [activeActionModalTab, setActiveActionModalTab] = useState<'causal_chain' | 'resolve' | 'court_stay'>('causal_chain');
  const [resolveDate, setResolveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [resolveEvidenceId, setResolveEvidenceId] = useState<string>('');
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [markStatutoryComplete, setMarkStatutoryComplete] = useState<boolean>(true);
  const [isSubmittingResolve, setIsSubmittingResolve] = useState<boolean>(false);
  const [resolveFeedback, setResolveFeedback] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

  // Court Stay Form States
  const [stayOrderRef, setStayOrderRef] = useState<string>('');
  const [stayCourtName, setStayCourtName] = useState<string>('High Court of Judicature for Rajasthan at Jaipur');
  const [stayOrderDate, setStayOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stayVacatedDate, setStayVacatedDate] = useState<string>('');
  const [stayDaysInput, setStayDaysInput] = useState<number>(90);
  const [stayVerificationStatus, setStayVerificationStatus] = useState<string>('VERIFIED');
  const [stayNotes, setStayNotes] = useState<string>('');
  const [isSubmittingStay, setIsSubmittingStay] = useState<boolean>(false);
  const [stayFeedback, setStayFeedback] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

  // Computed days for stay form
  const computedStayDays = useMemo(() => {
    if (stayOrderDate && stayVacatedDate) {
      const d1 = new Date(stayOrderDate).getTime();
      const d2 = new Date(stayVacatedDate).getTime();
      if (d2 > d1) {
        return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      }
    }
    return stayDaysInput || 90;
  }, [stayOrderDate, stayVacatedDate, stayDaysInput]);

  const fetchActionData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const [actionList, summaryData] = await Promise.all([
        getOfficerActions({
          category: selectedCategory === 'ALL' ? undefined : selectedCategory,
          parcel_id: parcelFilter.trim() || undefined,
          role: selectedRole === 'ALL' ? undefined : selectedRole,
          search: debouncedSearchQuery.trim() || undefined,
        }).catch((err) => {
          if (err.message && err.message.includes('403')) {
            throw new Error('ACCESS_DENIED_LANDOWNER');
          }
          return [];
        }),
        getOfficerActionSummary().catch(() => null),
      ]);

      setActions(Array.isArray(actionList) ? actionList : []);
      if (summaryData) setSummary(summaryData);
    } catch (err: any) {
      if (err.message === 'ACCESS_DENIED_LANDOWNER') {
        setError('ACCESS_DENIED_LANDOWNER');
      } else {
        setError('Failed to load Officer Action Center data. Verify backend connection.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, parcelFilter, selectedRole, debouncedSearchQuery]);

  useEffect(() => {
    fetchActionData();
  }, [fetchActionData]);

  // Handle Resolve Action Submission
  const handleResolveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;
    if (!resolveNotes.trim()) {
      alert('Please provide officer verification remarks and factual findings.');
      return;
    }

    try {
      setIsSubmittingResolve(true);
      setResolveFeedback(null);
      const res = await resolveOfficerAction(selectedAction.id, {
        completed_date: resolveDate,
        evidence_document_id: resolveEvidenceId.trim() || undefined,
        officer_notes: resolveNotes.trim(),
        mark_statutory_complete: markStatutoryComplete,
      });

      if (res.statutory_deadline_completed) {
        setResolveFeedback({
          type: 'success',
          message: res.message || 'Action resolved and statutory deadline officially marked completed with verified evidentiary record.',
        });
      } else {
        setResolveFeedback({
          type: 'warning',
          message: res.message || 'Officer verification recorded. Legal deadline remains active until mandatory proof is verified.',
        });
      }

      setTimeout(() => {
        fetchActionData();
        setSelectedAction(null);
        setResolveFeedback(null);
        setResolveNotes('');
        setResolveEvidenceId('');
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to process action resolution.');
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // Handle Record Court Stay Submission
  const handleRecordStay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;
    if (!stayOrderRef.trim()) {
      alert('Please provide a valid court order reference or writ petition citation.');
      return;
    }

    try {
      setIsSubmittingStay(true);
      setStayFeedback(null);
      const res = await recordActionCourtStay(selectedAction.id, {
        court_order_reference: stayOrderRef.trim(),
        stay_order_date: stayOrderDate,
        stay_vacated_date: stayVacatedDate || undefined,
        stay_days: computedStayDays,
        judicial_verification_status: stayVerificationStatus,
        court_name: stayCourtName.trim() || undefined,
        notes: stayNotes.trim() || undefined,
      });

      if (res.statutory_clock_extended) {
        setStayFeedback({
          type: 'success',
          message: res.message || 'Verified court stay recorded. Statutory clock recalculated with exclusion period.',
        });
      } else {
        setStayFeedback({
          type: 'warning',
          message: res.message || 'Stay citation recorded with PENDING_VERIFICATION. Clock remains unextended.',
        });
      }

      setTimeout(() => {
        fetchActionData();
        setSelectedAction(null);
        setStayFeedback(null);
        setStayOrderRef('');
        setStayNotes('');
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to record court stay.');
    } finally {
      setIsSubmittingStay(false);
    }
  };

  // Filtered Actions in Memory (if additional quick filters apply)
  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      if (selectedCategory !== 'ALL' && act.priority_category !== selectedCategory) {
        return false;
      }
      if (selectedRole !== 'ALL' && act.responsible_role !== selectedRole) {
        return false;
      }
      if (parcelFilter.trim() && !act.parcel_id.toLowerCase().includes(parcelFilter.trim().toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (act.action_title || '').toLowerCase().includes(q);
        const matchAction = (act.required_action || '').toLowerCase().includes(q);
        const matchSec = (act.statutory_section || '').toLowerCase().includes(q);
        const matchParcel = (act.parcel_id || '').toLowerCase().includes(q);
        const matchVillage = (act.village_name || '').toLowerCase().includes(q);
        const matchOwner = (act.landowner_name || '').toLowerCase().includes(q);
        return matchTitle || matchAction || matchSec || matchParcel || matchVillage || matchOwner;
      }
      return true;
    });
  }, [actions, selectedCategory, selectedRole, parcelFilter, searchQuery]);

  return (
    <div className="space-y-8 pb-20">
      {/* Access Denied Warning (Landowner Role Isolation) */}
      {error === 'ACCESS_DENIED_LANDOWNER' ? (
        <div className="rounded-2xl bg-slate-900 border border-rose-500/40 p-8 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Restricted Officer Area
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Internal officer action priorities, legal lapse exposure scores, and project risk calculations are restricted to authorized Competent Authority Land Acquisition (CALA) officers.
          </p>
          <div className="pt-2">
            <Link
              href="/legal-rights"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
            >
              <span>Go to Landowner Rights & Law Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800/80 p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
                    <AlertOctagon className="w-3.5 h-3.5" /> CALA COMMAND & CONTROL
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
                    <Sparkles className="w-3.5 h-3.5" /> CPM DIGITAL TWIN INTEGRATED
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ZERO FAKE URGENCY
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
                  Officer Action Center
                </h1>

                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  Unified operational command answering: <span className="text-white font-medium">What requires attention</span>, <span className="text-white font-medium">why</span>, <span className="text-white font-medium">what law governs it</span>, <span className="text-white font-medium">what deadline applies</span>, <span className="text-white font-medium">what evidence supports it</span>, and <span className="text-white font-medium">what CPM project impact exists</span>.
                </p>
              </div>

              {/* Live Status Controls */}
              <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                <button
                  onClick={fetchActionData}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>Refresh Queue</span>
                </button>
                <Link
                  href="/intelligence/what-if"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>What-If Simulator</span>
                </Link>
              </div>
            </div>

            {/* Restrained Statutory Disclaimer */}
            <div className="mt-6 rounded-xl bg-slate-950/60 border border-slate-800 p-3.5 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">
                  Authoritative Statutory Operation:
                </span>{' '}
                Actions are derived deterministically from RFCTLARR Act 2013 and Rajasthan Rules 2016 statutory deadline clocks. Prioritization is explained transparently via explicit statutory reasons (mandatory proceedings lapse &gt; overdue &gt; critical path impact &gt; float consumption).
              </div>
            </div>
          </div>

          {/* Metric KPI Counter Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div
                onClick={() => setSelectedCategory('CRITICAL')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCategory === 'CRITICAL'
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/30'
                    : 'bg-slate-900/80 border-rose-500/20 hover:border-rose-500/50'
                }`}
              >
                <div className="text-[11px] font-mono text-rose-400 font-semibold uppercase flex items-center justify-between">
                  <span>Critical / Lapse</span>
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-rose-400 mt-1">
                  {summary.critical_count}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {summary.mandatory_lapse_count} Mandatory Lapse
                </div>
              </div>

              <div
                onClick={() => setSelectedCategory('DUE_SOON')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCategory === 'DUE_SOON'
                    ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-900/80 border-amber-500/20 hover:border-amber-500/50'
                }`}
              >
                <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase flex items-center justify-between">
                  <span>Due Soon</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
                  {summary.due_soon_count}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  &le; 30 calendar days
                </div>
              </div>

              <div
                onClick={() => setSelectedCategory('BLOCKED')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCategory === 'BLOCKED'
                    ? 'bg-orange-950/40 border-orange-500 shadow-lg shadow-orange-950/30'
                    : 'bg-slate-900/80 border-orange-500/20 hover:border-orange-500/50'
                }`}
              >
                <div className="text-[11px] font-mono text-orange-400 font-semibold uppercase flex items-center justify-between">
                  <span>Blocked</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-orange-400 mt-1">
                  {summary.blocked_count}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Deficient / Stayed Prerequisite
                </div>
              </div>

              <div
                onClick={() => setSelectedCategory('PROJECT_IMPACT')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCategory === 'PROJECT_IMPACT'
                    ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-950/30'
                    : 'bg-slate-900/80 border-sky-500/20 hover:border-sky-500/50'
                }`}
              >
                <div className="text-[11px] font-mono text-sky-400 font-semibold uppercase flex items-center justify-between">
                  <span>Project Impact</span>
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1">
                  {summary.project_impact_count}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {summary.critical_path_blocker_count} Critical Path Blockers
                </div>
              </div>

              <div
                onClick={() => setSelectedCategory('UPCOMING')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCategory === 'UPCOMING'
                    ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-950/30'
                    : 'bg-slate-900/80 border-sky-500/20 hover:border-sky-500/50'
                }`}
              >
                <div className="text-[11px] font-mono text-sky-400 font-semibold uppercase flex items-center justify-between">
                  <span>Upcoming</span>
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1">
                  {summary.upcoming_count}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  On-track statutory clocks
                </div>
              </div>

              <div
                onClick={() => setSelectedCategory('COMPLETED')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCategory === 'COMPLETED'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/80 border-emerald-500/20 hover:border-emerald-500/50'
                }`}
              >
                <div className="text-[11px] font-mono text-emerald-400 font-semibold uppercase flex items-center justify-between">
                  <span>Completed</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                  {summary.completed_count}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Evidenced & verified
                </div>
              </div>
            </div>
          )}

          {/* Operational Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategory === tab.key;
              const count = tab.countKey && summary ? summary[tab.countKey] : tab.key === 'ALL' ? summary?.total_actions : undefined;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof count === 'number' && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        tab.key === 'CRITICAL' && count > 0
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : tab.key === 'DUE_SOON' && count > 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : tab.key === 'BLOCKED' && count > 0
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : tab.key === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter Bar: Search, Role, Parcel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by action, survey, village, or legal section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Responsible Roles</option>
                <option value="COLLECTOR">Competent Authority / Collector</option>
                <option value="FIELD_OFFICER">Field / Revenue Officer</option>
              </select>
            </div>

            {/* Parcel Filter */}
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder="Filter Parcel ID (e.g. P00003)"
                value={parcelFilter}
                onChange={(e) => setParcelFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono uppercase"
              />
            </div>

            {/* Clear All Filters */}
            <div className="md:col-span-1">
              {(searchQuery || parcelFilter || selectedRole !== 'ALL' || selectedCategory !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setParcelFilter('');
                    setSelectedRole('ALL');
                    setSelectedCategory('ALL');
                  }}
                  className="w-full py-2 px-2 text-[11px] text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-center"
                  title="Clear all filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Action Cards Queue */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <span>Prioritizing operational duties against statutory engine...</span>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white font-display">
                No Action Items in This Queue
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {selectedCategory !== 'ALL'
                  ? `There are no actions currently categorized under ${selectedCategory.replace(/_/g, ' ')}. All statutory requirements for this category are satisfied or up to date.`
                  : 'All acquisition statutory clocks and field duties are current. Zero unaddressed items in the corridor pipeline.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                <span>
                  Showing {filteredActions.length} Prioritized Action{filteredActions.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[11px]">
                  Ranked by Mandatory Statutory Lapse &gt; Overdue &gt; CPM Critical Path
                </span>
              </div>

              {filteredActions.map((action) => {
                const isCritical = action.priority_category === 'CRITICAL';
                const isDueSoon = action.priority_category === 'DUE_SOON';
                const isBlocked = action.priority_category === 'BLOCKED';
                const isImpact = action.priority_category === 'PROJECT_IMPACT';
                const isCompleted = action.priority_category === 'COMPLETED';

                return (
                  <div
                    key={action.id}
                    className={`rounded-2xl border transition-all p-5 shadow-lg relative overflow-hidden ${
                      isCritical
                        ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-500/70 shadow-rose-950/20'
                        : isDueSoon
                        ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20'
                        : isBlocked
                        ? 'bg-slate-900/90 border-orange-500/40 hover:border-orange-500/70 shadow-orange-950/20'
                        : isImpact
                        ? 'bg-slate-900/90 border-sky-500/40 hover:border-sky-500/70 shadow-sky-950/20'
                        : isCompleted
                        ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Lead with Priority Reasons (Zero Raw Score in Primary View) */}
                    <div className="flex items-start md:items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority Category Pill */}
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${
                            isCritical
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                              : isDueSoon
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                              : isBlocked
                              ? 'bg-orange-500/15 text-orange-400 border-orange-500/40'
                              : isImpact
                              ? 'bg-sky-500/15 text-sky-400 border-sky-500/40'
                              : isCompleted
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : 'bg-sky-500/15 text-sky-400 border-sky-500/40'
                          }`}
                        >
                          {action.priority_category.replace(/_/g, ' ')}
                        </span>

                        {/* Parcel ID & Survey Number */}
                        <Link
                          href={`/parcels/${action.parcel_id}`}
                          className="text-xs font-mono font-bold text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>{action.parcel_id}</span>
                          {action.survey_no && (
                            <span className="text-slate-400 font-normal">
                              ({action.survey_no})
                            </span>
                          )}
                        </Link>

                        {/* Village Name */}
                        {action.village_name && (
                          <span className="text-xs text-slate-400">
                            • {action.village_name}
                          </span>
                        )}

                        {/* Responsible Role Badge */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {action.responsible_role.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Right: Statutory Due Date & Immediacy */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-slate-400">Statutory Due Date</div>
                          <div
                            className={`text-sm font-mono font-bold ${
                              action.days_remaining < 0
                                ? 'text-rose-400'
                                : action.days_remaining <= 30
                                ? 'text-amber-400'
                                : 'text-slate-200'
                            }`}
                          >
                            {action.calculated_due_date} ({action.days_remaining}d)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Primary Reason Tags Banner: Officers see explicit legal rationale instead of points */}
                    <div className="pt-2.5 pb-1 flex items-center gap-1.5 flex-wrap">
                      {action.priority_reasons.map((reason, rIdx) => (
                        <span
                          key={rIdx}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold border ${
                            reason.includes('MANDATORY') || reason.includes('OVERDUE')
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : reason.includes('CRITICAL PATH') || reason.includes('SCHEDULE')
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                              : reason.includes('EVIDENCE') || reason.includes('PRECONDITION')
                              ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          • {reason}
                        </span>
                      ))}
                    </div>

                    {/* Answers to the 6 Core Questions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 text-xs">
                      {/* 1. What & Required Action (Col 1-5) */}
                      <div className="md:col-span-5 space-y-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                            1. What Requires Attention Right Now
                          </span>
                          <h3 className="text-sm font-bold text-white mt-0.5 font-display">
                            {action.action_title}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          {action.required_action}
                        </p>
                      </div>

                      {/* 2 & 3. Why & Governing Law (Col 6-8) */}
                      <div className="md:col-span-4 space-y-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                            2. Why & Legal Governing Provision
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-bold text-amber-400">
                              {action.statutory_section}
                            </span>
                            <span className="text-slate-400 truncate">
                              {action.act_name}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80 space-y-1">
                          <div className="text-[10px] font-mono text-slate-400">
                            Legal Effect: <strong className="text-slate-200">{action.legal_effect}</strong>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {action.consequence_if_overdue}
                          </p>
                        </div>

                        {/* Judicial Court Stay Indicator if applicable */}
                        {action.order_specific_court_stay && (
                          <div className="rounded-xl bg-sky-950/30 border border-sky-500/40 p-2 text-[11px] text-sky-200 flex items-center justify-between">
                            <span className="font-mono">Court Stay: {action.court_order_reference}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                              {action.judicial_verification_status || 'PENDING'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 5 & 6. Evidence & CPM Impact (Col 9-12) */}
                      <div className="md:col-span-3 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                              5. Evidence & 6. Downstream CPM
                            </span>
                            <div className="flex items-center justify-between mt-0.5">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  action.evidence_status === 'VERIFIED'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : action.evidence_status === 'DEFICIENT'
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                }`}
                              >
                                Evidence: {action.evidence_status}
                              </span>

                              {action.cpm_impact.is_critical_path && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                  CRITICAL PATH
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80 text-[11px] space-y-1">
                            <div className="text-slate-300">
                              CPM Delay:{' '}
                              <strong className="text-rose-400 font-mono">
                                +{action.cpm_impact.operational_delay_cpm_days} days
                              </strong>
                            </div>
                            <div className="text-slate-400 truncate">
                              Blocks: {action.cpm_impact.downstream_summary}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAction(action);
                              setActiveActionModalTab('causal_chain');
                              setSelectedCausalStep(0);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Drill Causal Chain</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAction(action);
                              setActiveActionModalTab('resolve');
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                            title="Resolve Action with Verified Evidence"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Dossier Modal / Drawer with Comprehensive Causal Chain Drill-Down */}
          {selectedAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        {selectedAction.priority_category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono text-indigo-400 font-bold">
                        Parcel: #{selectedAction.parcel_id}
                      </span>
                      {selectedAction.survey_no && (
                        <span className="text-xs font-mono text-slate-400">
                          Survey: {selectedAction.survey_no}
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400">
                        Action ID: {selectedAction.id}
                      </span>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white mt-1.5 font-display">
                      {selectedAction.action_title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setSelectedAction(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Tab Switcher */}
                <div className="flex items-center gap-3 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
                  <button
                    onClick={() => setActiveActionModalTab('causal_chain')}
                    className={`pb-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                      activeActionModalTab === 'causal_chain'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Full Causal Chain (Action &rarr; Law &rarr; Deadline &rarr; Case &rarr; Parcel &rarr; Evidence &rarr; Milestone &rarr; Dependency &rarr; CPM)</span>
                  </button>
                  <button
                    onClick={() => setActiveActionModalTab('resolve')}
                    className={`pb-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                      activeActionModalTab === 'resolve'
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve Action & Verify Evidence</span>
                  </button>
                  <button
                    onClick={() => setActiveActionModalTab('court_stay')}
                    className={`pb-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                      activeActionModalTab === 'court_stay'
                        ? 'border-sky-500 text-sky-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Record Verified Court Stay</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* TAB 1: THE FULL 9-STAGE CAUSAL CHAIN */}
                  {activeActionModalTab === 'causal_chain' && (
                    <div className="space-y-6">
                      {/* Step Indicator Breadcrumb */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" />
                            Deterministic Causal Chain Drill-Down (Click to Inspect Stage)
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Stage {selectedCausalStep + 1} of 9
                          </span>
                        </div>

                        {/* Interactive Step Chips */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 text-center text-[10px] font-mono">
                          {[
                            { name: '1. Action', key: 'action' },
                            { name: '2. Law', key: 'law' },
                            { name: '3. Deadline', key: 'deadline' },
                            { name: '4. Case', key: 'case' },
                            { name: '5. Parcel', key: 'parcel' },
                            { name: '6. Evidence', key: 'evidence' },
                            { name: '7. Milestone', key: 'milestone' },
                            { name: '8. Dependency', key: 'dependency' },
                            { name: '9. CPM Impact', key: 'cpm' },
                          ].map((step, idx) => (
                            <button
                              key={step.key}
                              onClick={() => setSelectedCausalStep(idx)}
                              className={`py-2 px-1 rounded-lg border font-semibold transition-all ${
                                selectedCausalStep === idx
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                              }`}
                            >
                              {step.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Causal Stage Panels */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. ACTION & 2. LAW & 3. DEADLINE */}
                        <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                              Stages 1–3: Legal Foundation
                            </span>
                            <Scale className="w-4 h-4 text-amber-400" />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">1. Operational Duty</span>
                            <div className="text-xs font-bold text-white">{selectedAction.action_title}</div>
                            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                              {selectedAction.required_action}
                            </p>
                          </div>

                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">2. Governing Law</span>
                            <div className="text-xs font-bold font-mono text-indigo-300">
                              {selectedAction.statutory_section} — {selectedAction.act_name}
                            </div>
                            <div className="text-[11px] text-slate-400 leading-relaxed">
                              {selectedAction.legal_citation_text}
                            </div>
                            <Link
                              href={selectedAction.legal_provision_url || '/legal-rights'}
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline pt-0.5"
                            >
                              <span>Inspect Section Text in Knowledge Center</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>

                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">3. Statutory Deadline</span>
                            <div className="text-sm font-bold font-mono text-amber-400">
                              {selectedAction.calculated_due_date} ({selectedAction.days_remaining}d remaining)
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Trigger Event: {selectedAction.trigger_event} on {selectedAction.trigger_date}
                            </div>
                            <div className="text-[11px] font-mono text-rose-300 pt-0.5">
                              Consequence: {selectedAction.consequence_if_overdue}
                            </div>
                          </div>
                        </div>

                        {/* 4. CASE & 5. PARCEL & 6. EVIDENCE */}
                        <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                              Stages 4–6: Case & Parcel Dossier
                            </span>
                            <Layers className="w-4 h-4 text-indigo-400" />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">4. Acquisition Case</span>
                            <div className="text-xs font-mono font-bold text-slate-200">
                              Case ID: {selectedAction.case_id}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Notification Date: {selectedAction.case_notification_date || selectedAction.trigger_date}
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">5. Parcel State</span>
                            <div className="text-xs font-bold text-white">
                              Survey {selectedAction.survey_no || 'N/A'} · {selectedAction.village_name || 'Corridor Village'}
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Owner: <strong>{selectedAction.landowner_name || 'Landholder'}</strong> · {selectedAction.area_hectares} Ha
                            </div>
                            <div className="text-[10px] font-mono text-indigo-400 pt-0.5">
                              Acquisition Stage: {selectedAction.current_acquisition_status.toUpperCase()}
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">6. Supporting Evidence</span>
                            <div className="text-[11px] text-slate-300">
                              Mandatory Record: <strong className="text-white">{selectedAction.required_evidence_type}</strong>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {selectedAction.evidence_list.length === 0 ? (
                                <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                  No evidence document uploaded. Action remains in BLOCKED/DEFICIENT category.
                                </div>
                              ) : (
                                selectedAction.evidence_list.map((doc, dIdx) => (
                                  <div
                                    key={dIdx}
                                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]"
                                  >
                                    <span className="text-slate-200 truncate max-w-[140px]">{doc.title}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${
                                        doc.status === 'VERIFIED'
                                          ? 'bg-emerald-500/20 text-emerald-400'
                                          : 'bg-amber-500/20 text-amber-400'
                                      }`}
                                    >
                                      {doc.status}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 7. MILESTONE & 8. DEPENDENCY & 9. CPM IMPACT */}
                        <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                              Stages 7–9: CPM Digital Twin
                            </span>
                            <Sparkles className="w-4 h-4 text-rose-400" />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">7. Downstream Milestone</span>
                            <div className="text-xs font-bold text-white font-mono">
                              {selectedAction.affected_milestone_name || 'Site Possession & Handover'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Milestone ID: {selectedAction.affected_milestone_id || 'MS-07'}
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">8. Structural Dependency</span>
                            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                              {selectedAction.dependency_summary || `Gating Right-of-Way possession hand-over for parcel ${selectedAction.parcel_id}`}
                            </p>
                          </div>

                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">9. CPM Delay & Simulation</span>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold font-mono text-rose-400">
                                +{selectedAction.cpm_impact.operational_delay_cpm_days}d Operational Delay
                              </span>
                              {selectedAction.cpm_impact.is_critical_path && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-bold">
                                  Critical Path
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Total Float: <strong className="text-slate-200 font-mono">{selectedAction.cpm_impact.total_float_days} days</strong>
                            </div>
                            <div className="pt-2">
                              <Link
                                href={`/intelligence/what-if?parcel=${selectedAction.parcel_id}`}
                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Simulate Intervention in What-If Twin</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: RESOLVE ACTION FORM */}
                  {activeActionModalTab === 'resolve' && (
                    <form onSubmit={handleResolveAction} className="space-y-5 max-w-2xl mx-auto">
                      {resolveFeedback && (
                        <div
                          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
                            resolveFeedback.type === 'success'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          {resolveFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                          )}
                          <span>{resolveFeedback.message}</span>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
                        <span className="font-bold text-white block">Statutory Evidence Requirement:</span>
                        <p>
                          A statutory deadline is only marked officially completed when the mandatory legal proof (e.g. Gazette notification publication, award decree, or PFMS deposit receipt) is verified.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-mono text-slate-300 uppercase">
                            Official Date of Statutory Event:
                          </label>
                          <input
                            type="date"
                            value={resolveDate}
                            onChange={(e) => setResolveDate(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-mono text-slate-300 uppercase">
                            Evidence Document ID / Gazette Citation:
                          </label>
                          <input
                            type="text"
                            value={resolveEvidenceId}
                            onChange={(e) => setResolveEvidenceId(e.target.value)}
                            placeholder="e.g. DOC-GZ-2025-0814 or Gazette Issue #12"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                          <p className="text-[10px] text-slate-500">
                            If omitted, remarks are saved as progress notes, but deadline remains open.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-mono text-slate-300 uppercase">
                          Officer Findings & Procedural Remarks:
                        </label>
                        <textarea
                          rows={4}
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          required
                          placeholder="State the official procedural steps completed, notification details, panchnama records, or PFMS deposit numbers..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="markStatutoryComplete"
                          checked={markStatutoryComplete}
                          onChange={(e) => setMarkStatutoryComplete(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0"
                        />
                        <label htmlFor="markStatutoryComplete" className="text-xs text-slate-300">
                          Verify statutory fulfillment and unblock downstream CPM milestone if evidence is verified
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingResolve}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmittingResolve ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Verifying & Persisting Resolution...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Submit Action Resolution</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* TAB 3: RECORD COURT STAY FORM */}
                  {activeActionModalTab === 'court_stay' && (
                    <form onSubmit={handleRecordStay} className="space-y-5 max-w-2xl mx-auto">
                      {stayFeedback && (
                        <div
                          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
                            stayFeedback.type === 'success'
                              ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          {stayFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-sky-400 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                          )}
                          <span>{stayFeedback.message}</span>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 text-xs text-sky-200/90 leading-relaxed">
                        Under Section 19(7) Explanation and Section 25 Proviso, only verified periods of court injunction or stay are excluded from limitation computation. A citation must be judicially verified before extending the statutory clock.
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-mono text-sky-300 uppercase">
                            Court Order Reference / Writ Citation:
                          </label>
                          <input
                            type="text"
                            value={stayOrderRef}
                            onChange={(e) => setStayOrderRef(e.target.value)}
                            required
                            placeholder="e.g. WP(C) No. 4128/2025"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-sky-500/40 text-xs text-slate-200 focus:outline-none focus:border-sky-400 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-mono text-slate-300 uppercase">
                            Court / Judicial Forum:
                          </label>
                          <input
                            type="text"
                            value={stayCourtName}
                            onChange={(e) => setStayCourtName(e.target.value)}
                            placeholder="e.g. High Court of Judicature for Rajasthan at Jaipur"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-400 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-mono text-slate-300 uppercase">
                            Date Stay Order Granted:
                          </label>
                          <input
                            type="date"
                            value={stayOrderDate}
                            onChange={(e) => setStayOrderDate(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-400 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-mono text-slate-300 uppercase">
                            Date Stay Vacated / Hearing Date (Optional):
                          </label>
                          <input
                            type="date"
                            value={stayVacatedDate}
                            onChange={(e) => setStayVacatedDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-400 font-mono"
                          />
                          <p className="text-[10px] text-slate-500">
                            Effective exclusion: {computedStayDays} calendar days
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-mono text-sky-300 uppercase">
                          Judicial Verification Status:
                        </label>
                        <select
                          value={stayVerificationStatus}
                          onChange={(e) => setStayVerificationStatus(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-sky-500/40 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                        >
                          <option value="VERIFIED">VERIFIED: Certified copy verified; extend statutory limitation clock</option>
                          <option value="PENDING_VERIFICATION">PENDING_VERIFICATION: Record citation; do NOT extend statutory clock until verified</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-mono text-slate-300 uppercase">
                          Judicial Remarks & Injunction Terms:
                        </label>
                        <textarea
                          rows={3}
                          value={stayNotes}
                          onChange={(e) => setStayNotes(e.target.value)}
                          placeholder="Bench details, interim injunction operative terms, status of counter-affidavit..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingStay}
                        className="w-full py-3 rounded-xl bg-[#0B5FA5] hover:bg-[#084880] text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmittingStay ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processing Judicial Verification...</span>
                          </>
                        ) : (
                          <>
                            <Scale className="w-4 h-4" />
                            <span>Record Court Stay Order</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
