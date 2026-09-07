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
  uploaded_at: string;
  review_status: 'EXTRACTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  ocr_provider: string;
  ocr_confidence: number;
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
  const [useMockOCR, setUseMockOCR] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [applying, setApplying] = useState<boolean>(false);
  const [appliedResult, setAppliedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sample pre-load for quick exploration
  const handleLoadSample = async (cat: string) => {
    setCategory(cat);
    setUploading(true);
    setErrorMsg(null);
    setAppliedResult(null);
    try {
      const sampleContent = cat === 'SECTION_11_NOTIFICATION'
        ? 'GOVERNMENT OF BIHAR - NOTIFICATION UNDER SECTION 11(1) RFCTLARR ACT 2013\nNotification No: LA-2026-PAT-091\nGazette Date: 2026-03-01\nVillage: Rampur\nDistrict: Patna\nTotal Area Hectares: 14.50\nPublic Purpose: NH-927A Corridor Widening'
        : 'AWARD STATEMENT UNDER SECTION 23/25 RFCTLARR ACT 2013\nAward Number: AWD-2026-NH927A-044\nDate: 2026-06-15\nParcel: P00001\nMarket Value: INR 5,200,000\nSolatium 100%: INR 5,200,000\nTotal Award: INR 10,400,000';

      const blob = new Blob([sampleContent], { type: 'text/plain' });
      const sampleFile = new File([blob], `${cat.toLowerCase()}_sample.txt`, { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', sampleFile);
      formData.append('category', cat);
      formData.append('use_mock_ocr', 'true');

      const job = await uploadDocumentForIntelligence(formData);
      if (job && job.document_id) {
        const detail = await getDocumentExtraction(job.document_id);
        setDocDetail(detail);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to ingest sample document');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    setAppliedResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('use_mock_ocr', String(useMockOCR));

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
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
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
              href="/intelligence/golden-demo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Try Golden Demo Flow
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
              <Upload className="w-4 h-4 text-indigo-500" />
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
                  className="w-full text-sm bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.1] rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/40 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 dark:border-white/[0.08] rounded-xl p-2"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.06]">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Use High-Accuracy Mock OCR
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Simulates bounding box layouts & confidence scores
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useMockOCR}
                  onChange={(e) => setUseMockOCR(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
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

            {/* Quick Demo Pre-loaders */}
            <div className="border-t border-slate-200 dark:border-white/[0.06] pt-4 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Or Load Synthetic Prototype Scan (NH-927A)
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample('SECTION_11_NOTIFICATION')}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-[#14172b] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-white/[0.06] text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between"
                >
                  <span>Section 11(1) Preliminary Gazette</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('AWARD_STATEMENT')}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-[#14172b] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-white/[0.06] text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between"
                >
                  <span>Section 23/25 Award Statement</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
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
                        <FileText className="w-4 h-4 text-indigo-500" />
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
                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-[#1b1f3b] border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                        className="w-full text-xs bg-slate-50 dark:bg-[#14172b] border border-slate-200 dark:border-white/[0.1] rounded-xl p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        View in Officer Action Center <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href="/legal-rights"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        View Legal Provisions <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty State Placeholder */
              <div className="bg-white dark:bg-[#0c0e1e] p-12 rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.1] text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <ScanLine className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    No Document Ingested Yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Upload a gazette notification, award statement, or judicial stay order on the left,
                    or click one of the pre-loaded prototype scans to view the extraction & verification workflow.
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
