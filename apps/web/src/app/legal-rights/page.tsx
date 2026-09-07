'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  BookOpen,
  UserCheck,
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Building2,
  Landmark,
  Compass,
  ArrowRight,
  Filter,
  X,
  Info,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  getLegalDisclaimer,
  getLegalProvisions,
  getOfficerProceduralGuide,
  getLandownerRightsGuide,
  getDeadlineRules,
  calculateDeadline,
  getCorridorDeadlineSummary,
} from '@/lib/api';

export default function LegalRightsPage() {
  const [activeTab, setActiveTab] = useState<'landowner' | 'officer' | 'provisions' | 'deadlines'>('landowner');
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [provisions, setProvisions] = useState<any[]>([]);
  const [officerStages, setOfficerStages] = useState<any[]>([]);
  const [landownerSections, setLandownerSections] = useState<any[]>([]);
  const [deadlineRules, setDeadlineRules] = useState<any[]>([]);
  const [corridorSummary, setCorridorSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('ALL');

  // Accordion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    before_acquisition: true,
    compensation: true,
  });
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({
    3: true,
    7: true,
    11: true,
    12: true,
  });

  // Selected provision for modal
  const [selectedProvision, setSelectedProvision] = useState<any | null>(null);

  // Interactive Statutory Deadline Calculator State
  const [calcRuleId, setCalcRuleId] = useState<string>('RULE-SEC-19-DECLARATION');
  const [calcTriggerDate, setCalcTriggerDate] = useState<string>('2025-04-01');
  const [calcExtensionDays, setCalcExtensionDays] = useState<number>(0);
  const [calcCourtOrderRef, setCalcCourtOrderRef] = useState<string>('');
  const [calcUnpaidBalance, setCalcUnpaidBalance] = useState<number | undefined>(undefined);
  const [calcAwardDate, setCalcAwardDate] = useState<string>('2025-04-01');
  const [calcCondonationGranted, setCalcCondonationGranted] = useState<boolean>(false);
  const [calcCondonationDays, setCalcCondonationDays] = useState<number>(365);
  const [calcCondonationReason, setCalcCondonationReason] = useState<string>('');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [discRes, provRes, offRes, loRes, rulesRes, sumRes] = await Promise.all([
          getLegalDisclaimer().catch(() => ({
            disclaimer:
              'KOSH provides statutory information and workflow guidance based on configured legal sources. It does not provide legal advice or determine legal rights. Verify the current applicable law with the competent authority.',
          })),
          getLegalProvisions().catch(() => []),
          getOfficerProceduralGuide().catch(() => ({ stages: [] })),
          getLandownerRightsGuide().catch(() => ({ sections: [] })),
          getDeadlineRules().catch(() => []),
          getCorridorDeadlineSummary().catch(() => null),
        ]);

        setDisclaimer(discRes?.disclaimer || '');
        setProvisions(provRes || []);
        setOfficerStages(offRes?.stages || []);
        setLandownerSections(loRes?.sections || []);
        setDeadlineRules(rulesRes || []);
        setCorridorSummary(sumRes);
      } catch (err) {
        console.error('Failed to load legal center data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Run interactive calculator whenever parameters change
  useEffect(() => {
    let active = true;
    if (calcRuleId && calcTriggerDate) {
      setCalcLoading(true);
      calculateDeadline({
        rule_id: calcRuleId,
        trigger_date: calcTriggerDate,
        extension_days: Number(calcExtensionDays) || 0,
        court_order_reference: calcCourtOrderRef.trim() || undefined,
        is_court_stay_verified: Boolean(calcCourtOrderRef.trim()),
        unpaid_balance_amount: calcUnpaidBalance,
        award_date: calcRuleId === 'RULE-SEC-64-REFERENCE-ABSENT' ? calcAwardDate : undefined,
        condonation_granted: calcRuleId.startsWith('RULE-SEC-64') ? calcCondonationGranted : false,
        condonation_days: calcRuleId.startsWith('RULE-SEC-64') && calcCondonationGranted ? calcCondonationDays : undefined,
        condonation_reason: calcRuleId.startsWith('RULE-SEC-64') && calcCondonationGranted ? calcCondonationReason : undefined,
      })
        .then((res) => {
          if (active) {
            setCalcResult(res);
            setCalcLoading(false);
          }
        })
        .catch(() => {
          if (active) setCalcLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [calcRuleId, calcTriggerDate, calcExtensionDays, calcCourtOrderRef, calcUnpaidBalance, calcAwardDate, calcCondonationGranted, calcCondonationDays, calcCondonationReason]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleStage = (stageNum: number) => {
    setExpandedStages((prev) => ({ ...prev, [stageNum]: !prev[stageNum] }));
  };

  // Filtered provisions
  const filteredProvisions = useMemo(() => {
    return provisions.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      // Jurisdiction filter
      if (selectedJurisdiction !== 'ALL' && p.jurisdiction !== selectedJurisdiction) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchSec = (p.section_number || '').toLowerCase().includes(q);
        const matchSummary = (p.plain_language_summary || '').toLowerCase().includes(q);
        const matchLandowner = (p.landowner_guidance || '').toLowerCase().includes(q);
        const matchOfficer = (p.officer_guidance || '').toLowerCase().includes(q);
        return matchTitle || matchSec || matchSummary || matchLandowner || matchOfficer;
      }
      return true;
    });
  }, [provisions, selectedCategory, selectedJurisdiction, searchQuery]);

  return (
    <div className="space-y-8 pb-16 bg-[#07080F] rounded-xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800/80 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Scale className="w-3.5 h-3.5" /> Statutory Knowledge Center
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5" /> Deterministic Deadline Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> India Code & Rajasthan Gazette Verified
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Land Acquisition Law & Rights
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Statutory reference, citizen entitlements, procedural duties, and evidence rules under the{' '}
              <strong className="text-white">RFCTLARR Act, 2013</strong> (Act No. 30 of 2013) and{' '}
              <strong className="text-white">Rajasthan RFCTLARR Rules, 2016</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">Statutory Stages</div>
              <div className="text-xl font-bold font-mono text-indigo-400">17 Stages</div>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">Statutory Clocks</div>
              <div className="text-xl font-bold font-mono text-amber-400">{deadlineRules.length || 11} Rules</div>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">Seeded Provisions</div>
              <div className="text-xl font-bold font-mono text-emerald-400">19 Authoritative</div>
            </div>
          </div>
        </div>

        {/* Restrained Statutory Disclaimer */}
        <div className="mt-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] block mb-0.5">
              Decision-Support & Statutory Information Notice
            </span>
            {disclaimer ||
              'KOSH provides statutory information and workflow guidance based on configured legal sources. It does not provide legal advice or determine legal rights. Verify current applicable law with the competent authority or a qualified legal professional.'}
          </div>
        </div>
      </div>

      {/* Role Navigation & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('landowner')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'landowner'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Landowner Rights</span>
          </button>
          <button
            onClick={() => setActiveTab('officer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'officer'
                ? 'bg-[#0B2E59] text-white shadow-lg shadow-[#0B2E59]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Officer Roadmap (17 Stages)</span>
          </button>
          <button
            onClick={() => setActiveTab('deadlines')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'deadlines'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Statutory Clocks & Deadlines</span>
          </button>
          <button
            onClick={() => setActiveTab('provisions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'provisions'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Provisions ({provisions.length})</span>
          </button>
        </div>

        {/* Global Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sections, solatium, clocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
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
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
            <Filter className="w-3 h-3" /> Jurisdiction:
          </span>
          <button
            onClick={() => setSelectedJurisdiction('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedJurisdiction === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedJurisdiction('CENTRAL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedJurisdiction === 'CENTRAL'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Central Baseline (RFCTLARR 2013)
          </button>
          <button
            onClick={() => setSelectedJurisdiction('RAJASTHAN')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedJurisdiction === 'RAJASTHAN'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Rajasthan State Rules (2016)
          </button>
        </div>

        {activeTab === 'provisions' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-mono text-[11px]">Category:</span>
            {['ALL', 'VALUATION', 'COMPENSATION', 'OBJECTION', 'PROCEDURAL', 'POSSESSION', 'R_AND_R', 'DISPUTE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading verified statutory provisions from PostgreSQL...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: LANDOWNER VIEW */}
          {activeTab === 'landowner' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200/90 text-xs leading-relaxed flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>Landowner Empowerment Module:</strong> Practical explanations of your rights, notices, how compensation is calculated, and steps if you disagree.
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400">
                  6 Core Protection Areas
                </div>
              </div>

              {landownerSections.map((sec) => {
                const isExpanded = expandedSections[sec.section_key] ?? false;
                const secProvisions = (sec.provisions || []).filter((p: any) =>
                  selectedJurisdiction === 'ALL' ? true : p.jurisdiction === selectedJurisdiction
                );

                return (
                  <div
                    key={sec.section_key}
                    className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg transition-all"
                  >
                    <button
                      onClick={() => toggleSection(sec.section_key)}
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-base md:text-lg font-bold text-white">
                            {sec.title}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                            {sec.questions.length} Practical Questions
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{sec.subtitle}</p>
                      </div>
                      <div className="text-slate-400 ml-4 flex-shrink-0">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-5 border-t border-slate-800/80 bg-slate-950/40 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sec.questions.map((q: any, qIdx: number) => (
                            <div
                              key={qIdx}
                              className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-semibold text-slate-100 flex items-start gap-2">
                                    <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span>{q.question}</span>
                                  </h4>
                                  <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
                                    {q.linked_section}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {q.answer}
                                </p>
                              </div>

                              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-xs text-emerald-300/90 flex items-start gap-2">
                                <span className="font-bold text-emerald-400 uppercase text-[10px] flex-shrink-0 mt-0.5">
                                  Action:
                                </span>
                                <span>{q.action_needed}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {secProvisions.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/60">
                            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                              Authoritative Governing Provisions
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {secProvisions.map((p: any) => (
                                <button
                                  key={p.id}
                                  onClick={() => setSelectedProvision(p)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors text-left"
                                >
                                  <span className="font-mono font-bold text-indigo-400">
                                    Sec {p.section_number}
                                  </span>
                                  <span className="truncate max-w-[260px] text-slate-300">
                                    {p.title}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: FIELD OFFICER VIEW */}
          {activeTab === 'officer' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-200/90 text-xs leading-relaxed flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>
                    <strong>Statutory Procedural Roadmap:</strong> The 17 sequential stages of land acquisition under RFCTLARR Act, 2013 and Rajasthan Rules 2016. Ensure all statutory clocks and evidentiary requirements are met to prevent legal lapse.
                  </span>
                </div>
                <div className="text-[11px] font-mono text-indigo-400">
                  17 Sequential Statutory Stages
                </div>
              </div>

              <div className="space-y-4">
                {officerStages.map((stage) => {
                  const isExpanded = expandedStages[stage.stage_number] ?? false;
                  const isHardLapse =
                    stage.risk_if_overdue.toLowerCase().includes('lapse') ||
                    stage.stage_number === 7 ||
                    stage.stage_number === 12;

                  return (
                    <div
                      key={stage.stage_number}
                      className={`rounded-xl border transition-all ${
                        isHardLapse
                          ? 'bg-slate-900 border-rose-900/40 shadow-rose-950/20'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => toggleStage(stage.stage_number)}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-start md:items-center gap-4">
                          <div
                            className={`w-9 h-9 rounded-xl font-mono font-bold text-sm flex items-center justify-center flex-shrink-0 ${
                              isHardLapse
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                            }`}
                          >
                            {stage.stage_number}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-base font-bold text-white">
                                {stage.stage_name}
                              </h3>
                              {isHardLapse && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  CRITICAL STATUTORY CLOCK (LAPSE RISK)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                              <span>Clock: <strong className="text-slate-300">{stage.statutory_clock}</strong></span>
                              <span>•</span>
                              <span>Milestone: <strong className="text-indigo-300 font-mono">{stage.related_milestone}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="text-slate-400 ml-4 flex-shrink-0">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-5 border-t border-slate-800/80 bg-slate-950/50 space-y-4">
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                              Officer Statutory Responsibility
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">
                              {stage.officer_responsibility}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
                              <div className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                Mandatory Evidentiary Records
                              </div>
                              <ul className="space-y-1.5 text-slate-300">
                                {stage.required_evidence.map((doc: string, dIdx: number) => (
                                  <li key={dIdx} className="flex items-start gap-2">
                                    <span className="text-indigo-400 text-sm leading-none">•</span>
                                    <span>{doc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div
                              className={`rounded-lg p-3.5 space-y-2 border ${
                                isHardLapse
                                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-200/90'
                                  : 'bg-amber-950/20 border-amber-500/20 text-amber-200/90'
                              }`}
                            >
                              <div className="font-semibold flex items-center gap-1.5 font-mono text-[11px]">
                                <AlertTriangle
                                  className={`w-3.5 h-3.5 ${isHardLapse ? 'text-rose-400' : 'text-amber-400'}`}
                                />
                                Downstream Consequence if Overdue
                              </div>
                              <p className="leading-relaxed">
                                {stage.risk_if_overdue}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono text-slate-500">Applicable Laws:</span>
                              {stage.applicable_laws.map((law: string, lIdx: number) => (
                                <span
                                  key={lIdx}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                                >
                                  {law}
                                </span>
                              ))}
                            </div>

                            {stage.provisions && stage.provisions.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {stage.provisions.map((prov: any) => (
                                  <button
                                    key={prov.id}
                                    onClick={() => setSelectedProvision(prov)}
                                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-1.5"
                                  >
                                    <span>Sec {prov.section_number}</span>
                                    <ExternalLink className="w-3 h-3 text-indigo-400" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STATUTORY CLOCKS & DEADLINES ENGINE */}
          {activeTab === 'deadlines' && (
            <div className="space-y-6">
              {/* Corridor Clocks Summary */}
              {corridorSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 font-mono">Total Clocks</div>
                    <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                      {corridorSummary.total_deadlines}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/20">
                    <div className="text-xs text-emerald-400 font-mono">Upcoming / On Track</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                      {corridorSummary.upcoming_count}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/20">
                    <div className="text-xs text-amber-400 font-mono">Due Soon (&le; 30d)</div>
                    <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                      {corridorSummary.due_soon_count}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30">
                    <div className="text-xs text-rose-400 font-mono">Mandatory Lapse Risks</div>
                    <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                      {corridorSummary.mandatory_lapse_risks_count}
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Statutory Deadline Calculator */}
              <div className="rounded-2xl bg-slate-900/90 border border-amber-500/30 p-6 md:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      Deterministic Statutory Deadline Calculator
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Calculate exact due dates, statutory lapse windows, and CPM delays under the RFCTLARR Act 2013 rules.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                    RULE-BASED CALCULATION ENGINE
                  </span>
                </div>

                {/* Input Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                      Select Statutory Rule:
                    </label>
                    <select
                      value={calcRuleId}
                      onChange={(e) => setCalcRuleId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {deadlineRules.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.rule_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                      Statutory Trigger Date:
                    </label>
                    <input
                      type="date"
                      value={calcTriggerDate}
                      onChange={(e) => setCalcTriggerDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                      Court Stay / Extension Days:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={calcExtensionDays}
                      onChange={(e) => setCalcExtensionDays(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="e.g. 90 (Court injunction)"
                    />
                  </div>

                  {calcExtensionDays > 0 && (
                    <div className="md:col-span-3">
                      <label className="block text-xs font-mono text-amber-300 mb-1.5 uppercase flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        Court Order Reference / Case Citation (Required under Sec 19(7)/25):
                      </label>
                      <input
                        type="text"
                        value={calcCourtOrderRef}
                        onChange={(e) => setCalcCourtOrderRef(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                        placeholder="e.g. DB Special Appeal No. 1042/2025 (Rajasthan High Court)"
                      />
                      <p className="text-[10px] text-amber-400/80 mt-1">
                        Statutory court stay exclusions require case-specific judicial verification and cannot be generically applied.
                      </p>
                    </div>
                  )}

                  {calcRuleId === 'RULE-SEC-80-DELAY-INTEREST' && (
                    <div className="md:col-span-3">
                      <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                        Unpaid / Undeposited Compensation Balance (₹):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcUnpaidBalance ?? ''}
                        onChange={(e) => setCalcUnpaidBalance(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                        placeholder="e.g. 1500000 (Section 80 penal interest applies only to unpaid amount)"
                      />
                    </div>
                  )}

                  {calcRuleId === 'RULE-SEC-64-REFERENCE-ABSENT' && (
                    <div className="md:col-span-3">
                      <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                        Section 23/25 Award Pronouncement Date:
                      </label>
                      <input
                        type="date"
                        value={calcAwardDate}
                        onChange={(e) => setCalcAwardDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Section 64(2)(b) calculates the earlier of 6 weeks from notice receipt or 6 months from award date. Discretionary condonation up to 1 additional year may be granted by the Collector under Section 64(2) further proviso upon sufficient cause.
                      </p>
                    </div>
                  )}

                  {(calcRuleId === 'RULE-SEC-64-REFERENCE-PRESENT' || calcRuleId === 'RULE-SEC-64-REFERENCE-ABSENT') && (
                    <div className="md:col-span-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={calcCondonationGranted}
                            onChange={(e) => setCalcCondonationGranted(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                          />
                          <span>Collector Delay Condonation Granted (Section 64(2) Further Proviso)</span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">Statutory Max 1 Year (365 days)</span>
                      </div>
                      {calcCondonationGranted && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              Condoned Days (Max 365):
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={calcCondonationDays}
                              onChange={(e) => setCalcCondonationDays(Math.min(365, Math.max(1, Number(e.target.value) || 0)))}
                              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono text-slate-400 mb-1">
                              Recorded Sufficient Cause / Reason:
                            </label>
                            <input
                              type="text"
                              value={calcCondonationReason}
                              onChange={(e) => setCalcCondonationReason(e.target.value)}
                              placeholder="e.g. Hospitalization during primary limitation period"
                              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Calculated Result Card */}
                {calcResult && (
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="text-xs text-slate-400 font-mono">Calculated Statutory Due Date</div>
                        <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-400 mt-0.5">
                          {calcResult.calculated_due_date}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-slate-400 font-mono">Days Remaining</div>
                          <div className={`text-xl font-bold font-mono ${calcResult.days_remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {calcResult.days_remaining}d
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${
                            calcResult.status === 'OVERDUE' || calcResult.status === 'LAPSED'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                              : calcResult.status === 'DUE_SOON'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          {calcResult.status}
                        </span>
                      </div>
                    </div>

                    {/* Decoupled Legal Effect vs KOSH CPM Model */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                          <Scale className="w-3.5 h-3.5" /> Statutory Legal Consequence
                        </div>
                        <div className="text-xs font-bold text-white font-mono">
                          {calcResult.legal_effect || 'ACTION_REQUIRED'}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {calcResult.calculation_trace.consequence_if_overdue}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5" /> KOSH Project Impact Model
                        </div>
                        <div className="text-xs font-bold text-amber-400 font-mono">
                          {calcResult.operational_delay_cpm_days > 0
                            ? `+${calcResult.operational_delay_cpm_days} days schedule delay`
                            : 'No active schedule delay'}
                        </div>
                        <div className="text-[11px] text-slate-400 italic">
                          Operational CPM simulation heuristic: represents estimated schedule delay if stage lapses, NOT a statutory legal mandate.
                        </div>
                      </div>
                    </div>

                    {/* Section 80 Penal Interest Display */}
                    {calcResult.calculation_trace.penal_interest_rate_percent && (
                      <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-1 font-mono text-amber-200">
                        <div className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Landmark className="w-4 h-4 text-amber-400" /> Section 80 Penal Interest Slabs:
                        </div>
                        <div>
                          <strong>Applicable Rate:</strong> {calcResult.calculation_trace.penal_interest_rate_percent}% per annum (unpaid balance).
                        </div>
                        {calcResult.calculation_trace.penal_interest_estimated_amount !== null && (
                          <div className="text-amber-300 font-bold">
                            <strong>Estimated Penal Interest:</strong> ₹{calcResult.calculation_trace.penal_interest_estimated_amount?.toLocaleString('en-IN')}
                          </div>
                        )}
                        <div className="text-[10px] text-amber-400/80 italic pt-1">
                          Note: Section 80 penal interest runs strictly from date of physical possession on unpaid compensation and is distinct from Section 30(3) 12% additional statutory amount.
                        </div>
                      </div>
                    )}

                    {/* Section 64 Delay Condonation Proviso Notice */}
                    {calcResult.calculation_trace.condonation_notes && (
                      <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-xs space-y-1 font-mono text-indigo-200">
                        <div className="font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-indigo-400" /> Section 64(2) Delay Condonation Proviso:
                        </div>
                        <div className="text-[11px] text-indigo-300">
                          {calcResult.calculation_trace.condonation_notes}
                        </div>
                        {calcResult.calculation_trace.condonation_window_expires && (
                          <div className="text-[10px] text-indigo-400/80">
                            <strong>Statutory 1-Year Condonation Window Expires:</strong> {calcResult.calculation_trace.condonation_window_expires}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step-by-Step Explainable Trace */}
                    <div className="space-y-2 text-xs">
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        Explainable Calculation Trace & Citations
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5 text-slate-300 font-mono">
                        <div><strong>Formula:</strong> {calcResult.calculation_trace.formula}</div>
                        <div><strong>Calendar Logic:</strong> {calcResult.calculation_trace.calendar_logic}</div>
                        <div><strong>Authority Citation:</strong> {calcResult.calculation_trace.statutory_citation}</div>
                        {calcResult.calculation_trace.court_order_reference && (
                          <div className="text-indigo-300">
                            <strong>Court Order Citation:</strong> {calcResult.calculation_trace.court_order_reference} (Verified: {calcResult.calculation_trace.court_stay_verified ? 'YES' : 'PENDING'})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Statutory Rules Directory */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Statutory Deadline Rules Directory ({deadlineRules.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deadlineRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {rule.id}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {rule.rule_type || 'PROCEDURAL'}
                            </span>
                            {rule.is_mandatory_lapse && (
                              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                Mandatory Lapse
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-white">{rule.rule_name}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{rule.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                        <div className="flex justify-between items-center">
                          <span>Clock:</span>
                          <strong className="text-slate-200 font-mono">
                            {rule.duration_value ? `${rule.duration_value} ${rule.duration_unit}` : rule.clock_type}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Legal Effect:</span>
                          <strong className="text-indigo-300 font-mono">{rule.legal_effect || 'ACTION_REQUIRED'}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>KOSH CPM Heuristic:</span>
                          <strong className="text-amber-400 font-mono">+{rule.operational_delay_cpm_days || rule.cpm_delay_weight_days}d</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALL STATUTORY PROVISIONS */}
          {activeTab === 'provisions' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Showing {filteredProvisions.length} authoritative statutory provision(s)</span>
                {filteredProvisions.length !== provisions.length && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setSelectedJurisdiction('ALL');
                    }}
                    className="text-indigo-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProvisions.map((prov) => (
                  <div
                    key={prov.id}
                    onClick={() => setSelectedProvision(prov)}
                    className="cursor-pointer rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-5 space-y-3 transition-all group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-indigo-400 group-hover:text-indigo-300">
                            Section {prov.section_number}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              prov.jurisdiction === 'RAJASTHAN'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {prov.jurisdiction === 'RAJASTHAN' ? 'Rajasthan Rules' : 'Central Act'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {prov.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 line-clamp-2">
                        {prov.title}
                      </h4>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {prov.plain_language_summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                        {prov.act_short_name}
                      </span>
                      <span className="text-indigo-400 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        View Full Text <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL / INDIA CODE SOURCE VIEWER */}
      {selectedProvision && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedProvision(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 md:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold font-mono text-indigo-400">
                    Section {selectedProvision.section_number}
                    {selectedProvision.subsection ? `(${selectedProvision.subsection})` : ''}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      selectedProvision.jurisdiction === 'RAJASTHAN'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}
                  >
                    {selectedProvision.jurisdiction === 'RAJASTHAN' ? 'Rajasthan State Rules' : 'Central Baseline'}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {selectedProvision.category}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-white">
                  {selectedProvision.title}
                </h3>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedProvision.act_name}
                </div>
              </div>
              <button
                onClick={() => setSelectedProvision(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Statutory Summary
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {selectedProvision.plain_language_summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-4 space-y-2">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> For Landowners
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedProvision.landowner_guidance || 'General statutory provision applying to land acquisition.'}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-950/20 border border-indigo-500/20 p-4 space-y-2">
                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> For Acquisition Officers
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedProvision.officer_guidance || 'Official procedural duty under statutory rules.'}
                </p>
              </div>
            </div>

            {selectedProvision.required_documents && selectedProvision.required_documents.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Mandatory Documents & Evidence
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProvision.required_documents.map((doc: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                  Official Legislative Source
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Authoritative Grounding
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                <div>Document: <strong className="text-white">{selectedProvision.source_document}</strong></div>
                <div>Version: <span className="font-mono text-slate-400">{selectedProvision.source_version}</span></div>
              </div>
              <div className="pt-2">
                <a
                  href={selectedProvision.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  <span>Open Official Legislative Record</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
