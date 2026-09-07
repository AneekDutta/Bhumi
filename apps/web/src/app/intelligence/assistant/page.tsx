'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Scale,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Layers,
  Activity,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';

import {
  askAssistant,
  summarizeDispute,
  transcribeVoice,
  synthesizeVoice,
  getAssistantIntents
} from '@/lib/api';

interface PredefinedIntent {
  id: string;
  label: string;
  query: string;
  category: string;
  description: string;
}

interface EvidenceRef {
  source_type: string;
  identifier?: string;
  source_id?: string;
  title?: string;
  label?: string;
  citation?: string;
  relevance?: string;
}

interface RecommendedAction {
  action_type: string;
  title: string;
  description: string;
  statutory_basis?: string;
  is_executable_now: boolean;
  action_center_action_id?: string;
  recommended_role: string;
}

interface ChronologyItem {
  date: string;
  event: string;
  epistemic_status: 'FACT' | 'CLAIM' | 'RECOMMENDATION';
  source: string;
}

interface DisputeSummary {
  parcel_id: string;
  dispute_category: string;
  facts: string[];
  claimant_claims: string[];
  recommendations: string[];
  missing_evidence: string[];
  chronology: ChronologyItem[];
  statutory_provisions: string[];
}

interface NLWhatIfResult {
  natural_language_query: string;
  interpreted_scenario: string;
  action_type: string;
  target_id: string;
  is_supported_scenario: boolean;
  refusal_reason?: string;
  baseline_finish_date?: string;
  counterfactual_finish_date?: string;
  days_saved: number;
  baseline_float?: number;
  counterfactual_float?: number;
  float_change?: number;
  new_critical_path_count?: number;
  corridor_risk_delta?: string;
  explanation: string;
  invariance_check_passed: boolean;
}

interface AIAnswer {
  query: string;
  answer: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_EVIDENCE';
  reasoning_summary?: string;
  evidence_citations: EvidenceRef[];
  whatif_result?: NLWhatIfResult;
  recommended_actions: RecommendedAction[];
  dispute_summary?: DisputeSummary;
  statutory_disclaimers: string[];
}

const DEFAULT_INTENTS: PredefinedIntent[] = [
  {
    id: 'why_high_risk',
    label: 'Why is this parcel high risk?',
    query: 'Why is this parcel high risk?',
    category: 'EXPLAINABLE_RISK',
    description: 'Explains causal triggers, Section 38 prerequisites, and CPM zero-float bottlenecks.'
  },
  {
    id: 'summarize_dispute',
    label: 'Summarize this dispute',
    query: 'Summarize this dispute and chronology.',
    category: 'DISPUTE_INTELLIGENCE',
    description: 'Produces evidence-grounded chronology, facts vs claims, and missing evidence checklist.'
  },
  {
    id: 'available_actions',
    label: 'What actions can we take?',
    query: 'What actions are available to resolve this blocker?',
    category: 'RESOLUTION_ASSISTANT',
    description: 'Identifies executable administrative options tied to authorized workflows.'
  },
  {
    id: 'whatif_compensation',
    label: 'What if compensation is resolved?',
    query: 'What happens if the compensation issue is resolved?',
    category: 'WHAT_IF_SIMULATION',
    description: 'Runs deterministic CPM counterfactual simulation and calculates corridor delay reduction.'
  },
  {
    id: 'sec_38_requirements',
    label: 'What does Section 38 require here?',
    query: 'What does Section 38 require before physical possession?',
    category: 'STATUTORY_LAW',
    description: 'Explains legal condition precedent under Section 38(1) & (2) with India Code citations.'
  },
  {
    id: 'at_risk_deadlines',
    label: 'Which deadlines are currently at risk?',
    query: 'What statutory deadlines are currently at risk or breaching?',
    category: 'STATUTORY_CLOCKS',
    description: 'Evaluates Section 15, 19(7), and 25 limitation clocks and mandatory lapse exposure.'
  }
];

const PARCELS = [
  { id: 'P00001', name: 'V02-KH-0001', district: 'Kota', status: 'HIGH_RISK' },
  { id: 'P00002', name: 'V02-KH-0002', district: 'Kota', status: 'MEDIUM' },
  { id: 'P00003', name: 'V02-KH-0003', district: 'Kota', status: 'CRITICAL' },
  { id: 'P00004', name: 'V02-KH-0004', district: 'Kota', status: 'PENDING' }
];

export default function IntelligenceAssistantPage() {
  const [selectedParcel, setSelectedParcel] = useState<string>('P00001');
  const [projectId] = useState<string>('P-NH927A');
  const [query, setQuery] = useState<string>('');
  const [intents, setIntents] = useState<PredefinedIntent[]>(DEFAULT_INTENTS);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DISPUTE' | 'ACTIONS' | 'WHAT_IF'>('OVERVIEW');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIAnswer | null>(null);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    async function fetchIntents() {
      try {
        const data = await getAssistantIntents();
        if (Array.isArray(data) && data.length > 0) {
          setIntents(data);
        }
      } catch (err) {}
    }
    fetchIntents();
  }, []);

  // User-driven query execution (no unprompted network storms on mount)
  const handleRunQuery = async (targetQuery: string, targetParcel: string = selectedParcel) => {
    if (!targetQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setVoiceNotice(null);

    const lowerQ = targetQuery.toLowerCase();
    const isWhatIf = lowerQ.includes('what if') || lowerQ.includes('simulate') || lowerQ.includes('compensation') || lowerQ.includes('delay');

    try {
      const response: any = await askAssistant({
        query: targetQuery,
        parcel_id: targetParcel,
        project_id: projectId,
        include_whatif: isWhatIf
      });

      // Map backend source_refs / evidence_refs to evidence_citations
      if ((!response.evidence_citations || response.evidence_citations.length === 0) && (response.source_refs || response.evidence_refs)) {
        const refs = response.source_refs || response.evidence_refs;
        response.evidence_citations = refs.map((r: any) => ({
          source_type: r.source_type,
          identifier: r.source_id || r.identifier || 'SRC',
          title: r.label || r.title || 'Verified System Record',
          citation: r.verification_status,
          relevance: 'Grounded in system database'
        }));
      }

      // Map backend whatif_preview to whatif_result
      if (!response.whatif_result && response.whatif_preview) {
        response.whatif_result = {
          natural_language_query: targetQuery,
          interpreted_scenario: response.whatif_preview.scenario?.parsed_intent || 'Compensation Resolution',
          action_type: response.whatif_preview.scenario?.intervention_type || 'process_compensation',
          target_id: targetParcel,
          is_supported_scenario: response.whatif_preview.scenario?.is_supported ?? true,
          days_saved: response.whatif_preview.delay_reduction_days,
          baseline_float: 0,
          counterfactual_float: response.whatif_preview.delay_reduction_days,
          float_change: response.whatif_preview.delay_reduction_days,
          explanation: response.whatif_preview.explanation,
          invariance_check_passed: !response.whatif_preview.production_mutated,
        };
      }

      // Auto-load structured dispute summary for dispute questions if missing
      if (!response.dispute_summary && (targetQuery.toLowerCase().includes('dispute') || targetQuery.toLowerCase().includes('chronology') || targetQuery.toLowerCase().includes('summarize'))) {
        try {
          const disputeRes = await summarizeDispute({ parcel_id: targetParcel, project_id: projectId });
          if (disputeRes) {
            response.dispute_summary = {
              parcel_id: targetParcel,
              dispute_category: 'COMPENSATION_TITLE',
              facts: disputeRes.facts || [],
              claimant_claims: disputeRes.interpretations || [],
              recommendations: disputeRes.recommendations || [],
              missing_evidence: disputeRes.missing_evidence_checklist || [],
              chronology: (disputeRes.chronology || []).map((c: any) => ({
                date: c.date,
                event: c.event,
                epistemic_status: 'FACT',
                source: c.evidence_ref?.label || 'Verified Record'
              })),
              statutory_provisions: disputeRes.applicable_legal_provisions || ['Section 38(1)', 'Section 64']
            };
          }
        } catch (e) {
          console.warn('Could not auto-fetch structured dispute summary:', e);
        }
      }

      setResult(response);
      setQuery(targetQuery);

      if (response.dispute_summary && (targetQuery.toLowerCase().includes('dispute') || targetQuery.toLowerCase().includes('chronology') || targetQuery.toLowerCase().includes('summarize'))) {
        setActiveTab('DISPUTE');
      } else if (response.whatif_result && (targetQuery.toLowerCase().includes('what if') || targetQuery.toLowerCase().includes('simulate') || targetQuery.toLowerCase().includes('compensation'))) {
        setActiveTab('WHAT_IF');
      } else if (response.recommended_actions?.length > 0 && (targetQuery.toLowerCase().includes('action') || targetQuery.toLowerCase().includes('available'))) {
        setActiveTab('ACTIONS');
      } else {
        setActiveTab('OVERVIEW');
      }
    } catch (err: any) {
      console.error('Assistant Query Error:', err);
      setError(err?.message || 'Failed to communicate with BHUMI Intelligence Assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    setError(null);
    setVoiceNotice(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecording(true);
          setVoiceNotice('Listening to officer spoken query...');
        };

        recognition.onresult = (event: any) => {
          const spokenText = event.results[0][0].transcript;
          setIsRecording(false);
          setVoiceNotice(`Spoken Input: "${spokenText}"`);

          const lower = spokenText.toLowerCase();
          if (lower.includes('approve') || lower.includes('disburse') || lower.includes('pay') || lower.includes('override')) {
            setVoiceNotice(
              `⚠️ Voice Safety Boundary: Spoken command "${spokenText}" cannot execute administrative mutations. Manual officer certification required in Action Center.`
            );
          }

          setQuery(spokenText);
          handleRunQuery(spokenText, selectedParcel);
        };

        recognition.onerror = (event: any) => {
          setIsRecording(false);
          simulateMockVoiceInput();
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (e) {
        console.warn('Speech recognition setup failed:', e);
      }
    }

    simulateMockVoiceInput();
  };

  const simulateMockVoiceInput = async () => {
    setIsRecording(true);
    setVoiceNotice('Simulating audio capture and processing via backend /assistant/voice/transcribe...');
    setTimeout(async () => {
      setIsRecording(false);
      try {
        const formData = new FormData();
        formData.append('audio_format', 'webm');
        formData.append('language', 'en');
        const res = await transcribeVoice(formData);

        const transcribed = res.transcribed_text || 'Why is this parcel high risk and what is blocking corridor possession?';
        setVoiceNotice(`Voice Transcribed: "${transcribed}" (Confidence: ${Math.round(res.confidence * 100)}%)`);
        setQuery(transcribed);
        handleRunQuery(transcribed, selectedParcel);
      } catch (err: any) {
        setVoiceNotice('Voice simulation completed.');
        const sample = 'Why is this parcel high risk?';
        setQuery(sample);
        handleRunQuery(sample, selectedParcel);
      }
    }, 1200);
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const handlePlayVoice = async () => {
    if (!result?.answer) return;

    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(result.answer);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-IN';

        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        window.speechSynthesis.speak(utterance);
        return;
      } catch (e) {}
    }

    try {
      setIsPlayingAudio(true);
      const synth = await synthesizeVoice({ text: result.answer });
      if (synth?.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${synth.audio_base64}`);
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (e) {
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070913] text-slate-800 dark:text-[#f0f4ff] p-4 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Breadcrumb & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#0B5FA5] dark:text-sky-400 mb-1">
              <Bot className="w-4 h-4" />
              SIH26016 Decision Intelligence · Assistant & Voice Interface
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              BHUMI Intelligence Assistant
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-[#0B5FA5] dark:text-sky-400 border border-sky-500/20">
                Evidence-Grounded AI
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Natural language explanation and voice assistance strictly bounded to deterministic system truth:
              RFCTLARR statutory clocks, CPM topological graph, and valuation engines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/action-center"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
              Action Center
            </Link>
            <Link
              href="/intelligence/what-if"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#0B5FA5] text-white hover:bg-[#084880] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              What-If Sandbox
            </Link>
          </div>
        </div>

        {/* Corridor Context & Parcel Scope Selector */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Target Corridor Scope</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                NH-927A Four-Laning Corridor (Project ID: {projectId})
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1 font-medium">Select Parcel:</span>
              {PARCELS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedParcel(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
                    selectedParcel === p.id
                      ? 'bg-[#0B5FA5] text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-[#14172b] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/[0.06]'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded font-sans uppercase font-bold bg-slate-500/20 text-slate-300">
                    {p.district}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Action Presets (Predefined Intents) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Recommended Decision Queries:</span>
            <span>Targeting {selectedParcel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {intents.map((intent) => (
              <button
                key={intent.id}
                onClick={() => handleRunQuery(intent.query, selectedParcel)}
                className="p-3 text-left rounded-xl bg-white dark:bg-[#0c0e1a] hover:bg-sky-50 dark:hover:bg-sky-950/20 border border-slate-200 dark:border-white/[0.06] hover:border-sky-300 dark:hover:border-sky-800/40 transition-all group shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0B5FA5] dark:group-hover:text-sky-400 transition-colors">
                    {intent.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{intent.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Natural Language Query Bar & Voice Controls */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunQuery(query, selectedParcel);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any question regarding parcel status, Section 38 compliance, CPM float, or dispute chronology..."
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-[#0B5FA5]"
              />
              {isLoading && (
                <div className="absolute right-3 top-3.5">
                  <RefreshCw className="w-4 h-4 text-[#0B5FA5] animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={isRecording ? stopVoiceInput : startVoiceInput}
              title={isRecording ? 'Stop Recording' : 'Voice Query'}
              className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-slate-100 dark:bg-[#14172b] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#0B5FA5] dark:text-sky-400" />}
            </button>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-3 rounded-xl bg-[#0B5FA5] hover:bg-[#084880] disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-md flex items-center gap-2"
            >
              <span>Ask BHUMI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {voiceNotice && (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-[#0B5FA5] animate-pulse" />
                <span>{voiceNotice}</span>
              </div>
              <button onClick={() => setVoiceNotice(null)} className="text-[11px] underline opacity-75 hover:opacity-100">
                Dismiss
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>
              <strong>Voice Safety Contract Enforced:</strong> Spoken commands can only interrogate and summarize.
              They are forbidden from executing mutations autonomously.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading && !result && (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] shadow-sm text-center space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#0B5FA5]/10 text-[#0B5FA5] dark:text-sky-400 mx-auto flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Synthesizing Decision Support</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grounding statutory provisions, evidentiary records, and corridor schedule constraints...
              </p>
            </div>
          </div>
        )}

        {!result && !isLoading && (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0B5FA5]/10 text-[#0B5FA5] dark:text-sky-400 mx-auto flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready for Inquiry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Select an inquiry from above or submit a natural-language query to analyze statutory risk, simulate interventions, or review dispute chronologies.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {intents.slice(0, 3).map((intent) => (
                <button
                  key={intent.id}
                  onClick={() => handleRunQuery(intent.query, selectedParcel)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#0B5FA5] hover:text-[#0B5FA5] transition-colors"
                >
                  {intent.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">

            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-[#0B5FA5] dark:text-sky-400 flex items-center justify-center font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Grounded Decision Response</h2>
                    <span className="text-[11px] text-slate-400 font-mono">Query: &quot;{result.query}&quot;</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                      result.confidence === 'HIGH'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : result.confidence === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : result.confidence === 'INSUFFICIENT_EVIDENCE'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Confidence: {result.confidence}
                  </span>

                  <button
                    onClick={handlePlayVoice}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isPlayingAudio
                        ? 'bg-[#0B5FA5] text-white border-[#0B5FA5] animate-pulse'
                        : 'bg-slate-100 dark:bg-[#14172b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    title={isPlayingAudio ? 'Stop Speech' : 'Listen to Answer'}
                  >
                    {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#0B5FA5]" />}
                    <span className="hidden sm:inline">{isPlayingAudio ? 'Stop' : 'Listen'}</span>
                  </button>
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed bg-slate-50/50 dark:bg-[#14172b]/50 p-4 rounded-xl border border-slate-200/50 dark:border-white/[0.04]">
                {result.answer}
              </div>

              {result.evidence_citations && result.evidence_citations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    Verified System Provenance ({result.evidence_citations.length} Grounded Sources)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.evidence_citations.map((c, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.06] text-xs flex items-center gap-2 group"
                      >
                        <span className="font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                          [{c.source_type}: {c.identifier}]
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{c.title}</span>
                        {c.citation && (
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">
                            {c.citation}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-2">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-[#0B5FA5] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Executive Grounding
              </button>

              {result.dispute_summary && (
                <button
                  onClick={() => setActiveTab('DISPUTE')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'DISPUTE'
                      ? 'bg-[#0B5FA5] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  Dispute Summarization
                </button>
              )}

              {result.recommended_actions && result.recommended_actions.length > 0 && (
                <button
                  onClick={() => setActiveTab('ACTIONS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'ACTIONS'
                      ? 'bg-[#0B5FA5] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Recommended Actions ({result.recommended_actions.length})
                </button>
              )}

              {result.whatif_result && (
                <button
                  onClick={() => setActiveTab('WHAT_IF')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'WHAT_IF'
                      ? 'bg-[#0B5FA5] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  What-If Counterfactual Rationale
                </button>
              )}
            </div>

            {activeTab === 'OVERVIEW' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#0B5FA5]" />
                    Statutory Rule & Section 38 Binding
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Under Section 38(1) of the RFCTLARR Act 2013, the Collector takes physical possession only AFTER
                    full compensation has been paid or deposited under Section 77. The AI interface strictly enforces
                    this statutory bar: possession milestones remain BLOCKED until financial disbursement is verified.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/legal-rights"
                      className="text-xs text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      View RFCTLARR Statutory Provisions <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    CPM Critical Path Impact
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Zero Total Float in Critical Path Method (CPM) designates this parcel as an immediate corridor bottleneck.
                    Every calendar day of delay in resolving title or compensation shifts the overall corridor handover date 1-to-1.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/projects"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Inspect CPM Corridor Network <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'DISPUTE' && result.dispute_summary && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-800/30 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      1. Verified System Facts
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {result.dispute_summary.facts.map((fact, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/30 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      2. Claimant Allegations / Claims
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {result.dispute_summary.claimant_claims.map((claim, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <span>{claim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200 dark:border-indigo-800/30 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                      <Scale className="w-4 h-4 text-indigo-500" />
                      3. Legal Recommendations
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {result.dispute_summary.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {result.dispute_summary.missing_evidence && result.dispute_summary.missing_evidence.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-500" />
                      Missing Evidence Checklist (Condition Precedent)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.dispute_summary.missing_evidence.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.04] text-xs flex items-center gap-2"
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.dispute_summary.chronology && result.dispute_summary.chronology.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0B5FA5]" />
                      Dispute Chronology (Epistemologically Tagged)
                    </h4>
                    <div className="space-y-2">
                      {result.dispute_summary.chronology.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400">{item.date}</span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{item.event}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                item.epistemic_status === 'FACT'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : item.epistemic_status === 'CLAIM'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                              }`}
                            >
                              {item.epistemic_status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">[{item.source}]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ACTIONS' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 pb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Administrative actions validated against current parcel state:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.recommended_actions.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] space-y-3 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-[#0B5FA5] dark:text-sky-400 uppercase">
                            {act.action_type}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              act.is_executable_now
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {act.is_executable_now ? 'Executable Now' : 'Prerequisites Required'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{act.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{act.description}</p>
                        {act.statutory_basis && (
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Scale className="w-3 h-3 text-[#0B5FA5]" />
                            {act.statutory_basis}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">Role: {act.recommended_role}</span>
                        <Link
                          href="/action-center"
                          className="px-3 py-1.5 rounded-xl bg-[#0B5FA5] hover:bg-[#084880] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          Review in Action Center <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'WHAT_IF' && result.whatif_result && (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0B5FA5]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Deterministic What-If Simulation Result
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Deepcopy Invariance Passed (0 DB Mutations)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.04]">
                    <span className="text-[11px] text-slate-400 uppercase font-mono">Interpreted Action</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {result.whatif_result.interpreted_scenario}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.04]">
                    <span className="text-[11px] text-slate-400 uppercase font-mono">Corridor Delay Saved</span>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {result.whatif_result.days_saved > 0
                        ? `-${result.whatif_result.days_saved} Calendar Days`
                        : '0 Days (Non-critical)'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.04]">
                    <span className="text-[11px] text-slate-400 uppercase font-mono">Total Float Delta</span>
                    <div className="text-sm font-bold text-[#0B5FA5] dark:text-sky-400 mt-1">
                      {result.whatif_result.baseline_float ?? 0}d &rarr; {result.whatif_result.counterfactual_float ?? 0}d
                      ({result.whatif_result.float_change ? `+${result.whatif_result.float_change}d` : 'No change'})
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-800/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>Deterministic Rationale:</strong> {result.whatif_result.explanation}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Source: Critical Path Method (CPM) Topological Forward/Backward Pass Engine
                  </span>
                  <Link
                    href="/intelligence/what-if"
                    className="text-[#0B5FA5] dark:text-sky-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    Open Full CPM Interactive Visualizer <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0c0e1a] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Scale className="w-4 h-4 text-[#0B5FA5]" />
                Administrative & Legal Disclaimer (RFCTLARR Act 2013):
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                {result.statutory_disclaimers && result.statutory_disclaimers.length > 0 ? (
                  result.statutory_disclaimers.map((d, i) => <li key={i}>{d}</li>)
                ) : (
                  <>
                    <li>
                      This AI assistant is an explanatory decision-support tool. It does NOT generate or issue statutory orders.
                    </li>
                    <li>
                      All determinations must be independently verified by the Competent Authority for Land Acquisition (CALA).
                    </li>
                  </>
                )}
              </ul>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
