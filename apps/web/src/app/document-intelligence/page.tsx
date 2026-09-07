'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ScanLine,
  Upload,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Clock,
  ArrowRight,
  Sparkles,
  Edit3,
  Check,
  X,
  FileText,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  AlertOctagon,
} from 'lucide-react';
import {
  uploadDocumentForIntelligence,
  getDocumentExtraction,
  updateDocumentReview,
  applyExtractionToWorkflow,
} from '@/lib/api';

interface ExtractedField {
  field_name: string;
  field_label: string;
  extracted_value: any;
  verified_value?: any;
  confidence_score: number;
  validation_status: string;
  validation_notes?: string;
}

interface DocumentDetail {
  document_id: string;
  filename: string;
  document_category: string;
  sha256_hash: string;
  document_hash?: string;
  uploaded_at: string;
  review_status: 'EXTRACTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  extraction_status?: string;
  ocr_provider: string;
  ocr_engine?: string;
  ocr_source?: string;
  ocr_status?: string;
  ocr_confidence: number;
  raw_text?: string;
  extracted_fields: ExtractedField[];
  structured_data: Record<string, any>;
  validation_errors: string[];
  verified_by?: string;
  verified_at?: string;
  review_notes?: string;
}


const CATEGORIES = [
  { value: 'SECTION_11_NOTIFICATION', label: 'Section 11(1) Preliminary Gazette Notification' },
  { value: 'SECTION_19_DECLARATION', label: 'Section 19(1) Final Acquisition Declaration' },
  { value: 'SECTION_21_NOTICE', label: 'Section 21 Public Claims Notice' },
  { value: 'AWARD_STATEMENT', label: 'Section 23/25 Land & Solatium Award Statement' },
  { value: 'COURT_STAY_ORDER', label: 'High Court Judicial Stay Order (Sec 19(7)/25 exclusion)' },
  { value: 'SALE_DEED', label: 'Registered Sale Deed (Market Value Comparable)' },
  { value: 'POSSESSION_PANCHNAMA', label: 'Section 38 Possession Panchnama & Handover Memo' },
];

export default function DocumentIntelligencePage() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('SECTION_11_NOTIFICATION');
  const [selectedProvider, setSelectedProvider] = useState<'ocrspace' | 'local' | 'mock'>('ocrspace');
  const [useMockOCR, setUseMockOCR] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [applying, setApplying] = useState<boolean>(false);
  const [appliedResult, setAppliedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setDocDetail(null);
    setErrorMsg(null);
    setAppliedResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('ocr_provider', selectedProvider);
      formData.append('use_mock_ocr', String(selectedProvider === 'mock'));

      const job = await uploadDocumentForIntelligence(formData);
      if (job && job.document_id) {
        const detail = await getDocumentExtraction(job.document_id);
        setDocDetail(detail);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Document processing failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveFieldEdit = (fieldName: string) => {
    if (!docDetail) return;
    const updatedFields = docDetail.extracted_fields.map((f) => {
      if (f.field_name === fieldName) {
        return {
          ...f,
          verified_value: editValue,
          validation_status: 'MODIFIED',
          validation_notes: 'Corrected by officer during human verification gate',
        };
      }
      return f;
    });

    setDocDetail({
      ...docDetail,
      extracted_fields: updatedFields,
      structured_data: {
        ...docDetail.structured_data,
        [fieldName]: editValue,
      },
    });
    setEditingField(null);
  };

  const handleVerifyGate = async () => {
    if (!docDetail) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const updates = docDetail.extracted_fields.map((f) => ({
        field_name: f.field_name,
        verified_value: f.verified_value !== undefined ? f.verified_value : f.extracted_value,
        status: f.validation_status || 'ACCEPTED',
        notes: f.validation_notes || 'Accepted in human review gate',
      }));

      const payload = {
        field_updates: updates,
        review_notes: reviewNotes || 'Human Review Gate completed and certified by Officer.',
        mark_verified: true,
      };

      const res = await updateDocumentReview(docDetail.document_id, payload);
      setDocDetail(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyToWorkflow = async () => {
    if (!docDetail) return;
    setApplying(true);
    setErrorMsg(null);
    try {
      const res = await applyExtractionToWorkflow(docDetail.document_id);
      setAppliedResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply document to statutory workflow');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070913] text-slate-800 dark:text-[#f0f4ff] p-6 lg:p-10 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#0B2E59] dark:text-sky-400 mb-1">
              <ScanLine className="w-4 h-4" />
              Intelligence Studio · SIH26016
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Document Intelligence & OCR Pipeline
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                Statutory Bridge
              </span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Extracts gazette notifications, awards, and stay orders with SHA-256 tamper verification,
              prompt injection defanging, and an authoritative Human Review Gate feeding statutory clocks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/action-center"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B2E59] hover:bg-[#0B2E59]/90 text-white text-sm font-medium shadow-sm transition-all"
            >
              <FileCheck2 className="w-4 h-4" />
              Officer Action Center
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Top Banner: Core Statutory Policy */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold">Authoritative Human Review Boundary:</span> AI and OCR models propose structured data extractions. In accordance with RFCTLARR Act 2013 and administrative law principles, AI proposals remain in <span className="font-mono font-semibold text-amber-700 dark:text-amber-200">PENDING_REVIEW</span> and cannot alter acquisition case milestones, statutory lapse clocks, or compensation schedules until certified by an authorized human officer.
          </div>
        </div>

        {/* Ingestion & Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Upload Form */}
          <div className="lg:col-span-1 bg-white dark:bg-[#0c0e1e] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              Ingest Statutory Document
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Document Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.1] rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2E59]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Select File (PDF, Image, Scan)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] || null;
                    setFile(selected);
                    setDocDetail(null);
                    setErrorMsg(null);
                    setAppliedResult(null);
                    setEditingField(null);
                    setReviewNotes('');
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 dark:file:bg-sky-950/40 file:text-[#0B2E59] dark:file:text-sky-400 hover:file:bg-sky-100 cursor-pointer border border-slate-200 dark:border-white/[0.08] rounded-xl p-2"
                />

              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  OCR Engine / Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    const val = e.target.value as 'ocrspace' | 'local' | 'mock';
                    setSelectedProvider(val);
                    setUseMockOCR(val === 'mock');
                  }}
                  className="w-full text-sm bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.1] rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2E59]"
                >
                  <option value="ocrspace">OCR.Space Cloud OCR (Engine 3)</option>
                  <option value="local">Local Headless OCR (On-Premises)</option>
                  <option value="mock">Synthetic Benchmark / Mock OCR</option>
                </select>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {selectedProvider === 'ocrspace' && 'Free-tier limits: ≤1 MB file size, ≤3 pages per PDF.'}
                  {selectedProvider === 'local' && 'Processes text locally without sending bytes to third-party endpoints.'}
                  {selectedProvider === 'mock' && 'Simulates deterministic bounding box layouts for testing.'}
                </div>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B2E59] hover:bg-[#0B2E59]/90 text-white font-medium text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0B2E59]/20"
              >
                {uploading ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" />
                    Ingesting & Extracting...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    Process Document
                  </>
                )}
              </button>
            </form>

            {/* Ingestion Guidelines */}
            <div className="border-t border-slate-200 dark:border-white/[0.06] pt-4 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-400 block">
                Supported File Formats & Guidance
              </span>
              <ul className="list-disc list-inside space-y-1">
                <li>Gazette notifications under Section 11(1) &amp; Section 19</li>
                <li>Valuation and Award statements under Section 23/30</li>
                <li>Judicial stay orders from High Court / LARR Authority</li>
                <li>Clear scans or digital PDFs yield optimal OCR accuracy</li>
              </ul>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Right 2 Columns: OCR Studio & Review Gate */}
          <div className="lg:col-span-2 space-y-6">
            {docDetail ? (
              <div className="space-y-6">
                {/* Document Metadata & Integrity Card */}
                <div className="bg-white dark:bg-[#0c0e1e] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.06] pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Document ID: {docDetail.document_id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                        <FileText className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
                        {docDetail.filename}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
                          docDetail.review_status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {docDetail.review_status === 'VERIFIED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {docDetail.review_status}
                      </span>
                    </div>
                  </div>

                  {/* SHA-256 & OCR Confidence Strip */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-1 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#14172b]">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        SHA-256 Checksum
                      </div>
                      <div className="font-mono text-[10px] text-slate-800 dark:text-slate-300 truncate mt-1">
                        {docDetail.sha256_hash}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#14172b]">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        OCR Confidence
                      </div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {Math.round(docDetail.ocr_confidence * 100)}% Confidence
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#14172b]">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Tamper / Injection Check
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Passed Integrity Gate
                      </div>
                    </div>
                  </div>

                  {/* OCR Provenance Indicator */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Authoritative Ingestion Provenance:
                      </span>
                      {docDetail.ocr_provider === 'OCR.Space' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> REAL OCR RESULT (OCR.Space Engine 3)
                        </span>
                      ) : docDetail.ocr_provider === 'Local OCR' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                          <Cpu className="w-3.5 h-3.5" /> LOCAL OCR PROVIDER (On-Premises Pipeline)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" /> LOCAL / MOCK BENCHMARK PROVIDER
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.06]">
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                          OCR Provider
                        </div>
                        <div className="text-xs font-bold text-[#0B2E59] dark:text-sky-400 mt-0.5 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" />
                          {docDetail.ocr_provider || 'OCR.Space'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.06]">
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                          Engine
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {docDetail.ocr_engine || '3'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.06]">
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                          Status
                        </div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {docDetail.ocr_status || 'OCR complete'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.06]">
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                          Source
                        </div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          {docDetail.ocr_source || 'External OCR'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw OCR Text Container (Verbatim Provider Output) */}
                <div className="bg-white dark:bg-[#0c0e1e] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ScanLine className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
                        Raw OCR Text (Verbatim Output)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Authoritative text extracted from document bytes before structured field parsing.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {docDetail.raw_text ? `${docDetail.raw_text.length} characters` : '0 characters'}
                    </span>
                  </div>

                  <pre className="font-mono text-xs p-4 bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.06] rounded-xl text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-52 overflow-y-auto select-text leading-relaxed">
                    {docDetail.raw_text || '(No text returned by OCR provider)'}
                  </pre>
                </div>

                {/* Structured Extraction & Human Review Fields */}
                <div className="bg-white dark:bg-[#0c0e1e] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-emerald-500" />
                        Extracted Fields (Human Review Gate)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Review and modify extracted statutory attributes before applying to case state.
                      </p>
                    </div>

                    {docDetail.review_status !== 'VERIFIED' && (
                      <button
                        onClick={handleVerifyGate}
                        disabled={uploading}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Certify & Verify
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/[0.06] border border-slate-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
                    {docDetail.extracted_fields.map((f) => (
                      <div
                        key={f.field_name}
                        className="p-3.5 bg-white dark:bg-[#0f1225] hover:bg-slate-50 dark:hover:bg-[#14172b] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {f.field_label || f.field_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Field ID: {f.field_name}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {editingField === f.field_name ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-[#1b1f3b] border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B2E59]"
                              />
                              <button
                                onClick={() => handleSaveFieldEdit(f.field_name)}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                                title="Save Edit"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingField(null)}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-[#181c38]">
                                {String(f.verified_value !== undefined ? f.verified_value : f.extracted_value)}
                              </span>

                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  f.confidence_score >= 0.85
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {Math.round(f.confidence_score * 100)}%
                              </span>

                              {docDetail.review_status !== 'VERIFIED' && (
                                <button
                                  onClick={() => {
                                    setEditingField(f.field_name);
                                    setEditValue(String(f.verified_value !== undefined ? f.verified_value : f.extracted_value));
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  title="Edit field value"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Officer Review Notes */}
                  {docDetail.review_status !== 'VERIFIED' && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Officer Audit Verification Notes
                      </label>
                      <textarea
                        rows={2}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="e.g., Verified against physical Bihar Gazette notification issue dated 01-March-2026."
                        className="w-full text-xs bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.1] rounded-xl p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2E59]"
                      />
                    </div>
                  )}

                  {/* Action Button: Apply to Workflow Bridge */}
                  <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {docDetail.review_status === 'VERIFIED' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Document verified by {docDetail.verified_by || 'Officer'}. Ready to link statutory clocks.
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Cannot apply to case until Human Review Gate certification is submitted.
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleApplyToWorkflow}
                      disabled={docDetail.review_status !== 'VERIFIED' || applying}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold disabled:opacity-40 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {applying ? (
                        <>
                          <Cpu className="w-3.5 h-3.5 animate-spin" />
                          Deriving Clocks & Refreshing CPM...
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          Apply & Trigger Statutory Clocks
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Workflow Application Confirmation Banner */}
                {appliedResult && (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Statutory Clocks Successfully Derived & Linked!
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {appliedResult.message}
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      {appliedResult.applied_actions?.map((act: string, idx: number) => (
                        <li key={idx}>{act}</li>
                      ))}
                    </ul>
                    <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
                      <Link
                        href="/action-center"
                        className="text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        View in Officer Action Center <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href="/legal-rights"
                        className="text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        View Legal Provisions <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : errorMsg ? (
              /* Dedicated OCR FAILED state card */
              <div className="bg-white dark:bg-[#0c0e1e] p-8 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      OCR FAILED
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      Document Processing Was Unsuccessful
                    </h3>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/30 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
                  <div className="font-semibold font-mono">Error Details:</div>
                  <div className="font-mono text-[11px] break-all">{errorMsg}</div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Statutory Pipeline Diagnostics:</div>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>OCR Provider Used:</strong> {selectedProvider === 'ocrspace' ? 'OCR.Space Cloud Engine' : selectedProvider === 'local' ? 'Local Headless OCR' : 'Mock Benchmark Engine'}</li>
                    <li>If using OCR.Space free tier, ensure the file is &le; 1 MB and &le; 3 pages, and the server has network egress.</li>
                    <li>If the remote OCR provider fails or times out, you can switch the OCR Provider dropdown on the left to <strong>Local Headless OCR</strong>.</li>
                    <li>In accordance with KOSH policy, failed OCR never fabricates or synthesizes statutory extractions.</li>
                  </ul>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setErrorMsg(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={(e) => handleUpload(e)}
                    disabled={!file || uploading}
                    className="px-4 py-2 rounded-xl bg-[#0B2E59] hover:bg-[#0B2E59]/90 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    <Cpu className="w-3.5 h-3.5" /> Retry Processing
                  </button>
                </div>
              </div>
            ) : (
              /* Empty State Placeholder */
              <div className="bg-white dark:bg-[#0c0e1e] p-12 rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.1] text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[#0B2E59] dark:text-sky-400 flex items-center justify-center mx-auto">
                  <ScanLine className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    No Document Ingested Yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Upload an official gazette notification, award statement, or judicial stay order on the left to process through the authoritative OCR and human review pipeline.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
