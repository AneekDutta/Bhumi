"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  User, 
  Clock, 
  Scale, 
  IndianRupee, 
  Check, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { generateCaseReportPdf, CaseReportData } from "@/lib/pdf/caseReportPdfGenerator";

interface CaseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: CaseReportData;
  onResolve?: () => void;
  isResolved?: boolean;
}

export function CaseReportModal({
  isOpen,
  onClose,
  reportData,
  onResolve,
  isResolved = false
}: CaseReportModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      generateCaseReportPdf(reportData);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-2xl overflow-hidden text-[#14213D] dark:text-[#F0F4FF]">
        
        {/* Tricolor Ribbon Top Accent */}
        <div className="h-[3px] w-full flex">
          <div className="h-full w-1/3 bg-[#FF9933]" />
          <div className="h-full w-1/3 bg-white" />
          <div className="h-full w-1/3 bg-[#128807]" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#E8F1FA] dark:bg-sky-950/40 border border-[#B8D5E5] dark:border-sky-800/40 flex items-center justify-center text-[#0B2E59] dark:text-sky-300 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#14213D] dark:text-white">Statutory Case Record &amp; What-If Report</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/40 font-semibold uppercase">
                  {reportData.currentStatus || "FIELD VERIFIED"}
                </span>
              </div>
              <p className="text-xs text-[#5A6A80] dark:text-slate-400">
                Case Tracking ID: <strong className="text-[#14213D] dark:text-slate-200 font-mono">{reportData.complaintId}</strong> &middot; RFCTLARR Act 2013 First Schedule Record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3.5 py-1.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download official PDF case file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? "Generating..." : "Download Case Report (PDF)"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-[4px] text-[#5A6A80] hover:text-[#14213D] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#5A6A80] dark:text-slate-300 bg-white dark:bg-[#0D121F] font-sans">
          
          {/* Official Letterhead Banner */}
          <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 text-center space-y-1">
            <div className="text-[11px] uppercase font-bold tracking-widest text-[#0B2E59] dark:text-sky-300 font-mono">
              Government of India &middot; Ministry of Road Transport &amp; Highways / Railways
            </div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white font-display">
              COMPETENT AUTHORITY LAND ACQUISITION (CALA) DIVISION
            </div>
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400">
              National Infrastructure Corridor Acquisition Directorate &middot; GatiShakti Portal
            </div>
          </div>

          {/* SECTION A: CASE INFORMATION */}
          <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <span className="font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" /> Section A: Case Information
              </span>
              <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">ID: {reportData.complaintId}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Grievance Case ID</span>
                <span className="font-mono font-bold text-[#14213D] dark:text-white">{reportData.complaintId}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Case Tracking Code</span>
                <span className="font-mono font-bold text-[#14213D] dark:text-slate-200">{reportData.caseId || `CALA-${reportData.complaintId.slice(-6)}`}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Date Lodged</span>
                <span className="text-[#14213D] dark:text-slate-200">{new Date(reportData.lodgedDate || Date.now()).toLocaleDateString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Current Status</span>
                <span className="text-[#1E7E34] dark:text-emerald-400 font-bold uppercase">{reportData.currentStatus}</span>
              </div>
            </div>
          </div>

          {/* SECTION B: LANDOWNER INFORMATION */}
          <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <span className="font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
                <User className="w-4 h-4 text-[#1E7E34]" /> Section B: Landowner Profile
              </span>
              <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">Aadhaar Verified</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Landowner Name</span>
                <span className="font-bold text-[#14213D] dark:text-white">{reportData.ownerName}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Owner ID</span>
                <span className="font-mono text-[#14213D] dark:text-slate-200">{reportData.ownerId || "REG-OWNER-01"}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Contact Village</span>
                <span className="text-[#14213D] dark:text-slate-200">{reportData.contactVillage || "Corridor Zone"}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Mobile Contact</span>
                <span className="font-mono text-[#14213D] dark:text-slate-200">{reportData.mobileNumber || "Registered on Portal"}</span>
              </div>
            </div>
          </div>

          {/* SECTION C: PARCEL & GIS RECORD */}
          <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <span className="font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B36B00]" /> Section C: Cadastral Parcel &amp; Spatial Geometry
              </span>
              <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">PostGIS Demarcated</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Parcel ID</span>
                <span className="font-mono font-bold text-[#14213D] dark:text-white">{reportData.parcelId}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Survey Plot No</span>
                <span className="font-mono font-bold text-[#B36B00] dark:text-amber-300">{reportData.surveyNumber}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Demarcated Area (Acres)</span>
                <span className="font-mono font-bold text-[#14213D] dark:text-white">{Number(reportData.areaAcres || 0).toFixed(3)} Acres</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Demarcated Area (Sq.m)</span>
                <span className="font-mono text-[#14213D] dark:text-slate-200">{Number(reportData.areaSqm || 0).toLocaleString()} m²</span>
              </div>
            </div>

            {reportData.coordinates && reportData.coordinates.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[#DCE2E8] dark:border-white/10">
                <span className="text-[10px] uppercase font-mono text-[#5A6A80] dark:text-slate-400 block mb-1.5 font-bold">
                  Field-Verified GPS Boundary Corner Coordinates:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {reportData.coordinates.slice(0, 6).map((pt, idx) => (
                    <div key={idx} className="p-2 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 font-mono text-[10px] flex items-center justify-between">
                      <span className="text-[#5A6A80] dark:text-slate-400">Pillar #{idx + 1}</span>
                      <span className="text-[#14213D] dark:text-slate-200 font-semibold">{pt.lat.toFixed(5)}°, {pt.lng.toFixed(5)}°</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION D: ORIGINAL CITIZEN GRIEVANCE & FIELD DETERMINATION */}
          <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <span className="font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1E7E34]" /> Section D: Grievance &amp; Field Verification
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 font-bold border border-[#C8E6C9] dark:border-emerald-800/40">
                {reportData.fieldDecision || "FIELD VERIFIED"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Grievance Category</span>
                <span className="font-semibold text-[#14213D] dark:text-white">{reportData.complaintType}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Field Officer</span>
                <span className="font-semibold text-[#14213D] dark:text-slate-200">{reportData.fieldOfficerName} ({reportData.fieldOfficerId})</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Verification Date</span>
                <span className="text-[#14213D] dark:text-slate-200">{new Date(reportData.fieldVerifiedAt || Date.now()).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#DCE2E8] dark:border-white/10">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#5A6A80] dark:text-slate-400 block mb-0.5 font-bold">Original Grievance Statement:</span>
                <p className="text-[#14213D] dark:text-slate-300 italic bg-white dark:bg-[#0D121F] p-2.5 rounded-[3px] border border-[#DCE2E8] dark:border-white/10 text-[11px]">
                  &ldquo;{reportData.description}&rdquo;
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#5A6A80] dark:text-slate-400 block mb-0.5 font-bold">Field Officer Ground Findings:</span>
                <p className="text-[#14213D] dark:text-slate-200 bg-white dark:bg-[#0D121F] p-2.5 rounded-[3px] border border-[#DCE2E8] dark:border-white/10 text-[11px]">
                  &ldquo;{reportData.fieldRemarks}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* SECTION E: WHAT-IF SIMULATION */}
          <div className="p-4 rounded-none bg-[#E8F1FA] dark:bg-[#0B2E59]/20 border border-[#B8D5E5] dark:border-sky-800/40 space-y-3">
            <div className="flex items-center justify-between border-b border-[#B8D5E5] dark:border-sky-800/30 pb-2">
              <span className="font-bold text-[#0B2E59] dark:text-white uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" /> Section E: Statutory What-If Simulation
              </span>
              <span className="text-[10px] font-mono text-[#0B2E59] dark:text-sky-300 font-bold">{reportData.simulationId || "SIM-2026-ACTIVE"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Intervention</span>
                <span className="font-bold text-[#14213D] dark:text-white">{reportData.interventionName || "PFMS Direct Disbursement"}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Statutory Provision</span>
                <span className="text-[#0B2E59] dark:text-sky-300 font-mono font-semibold">{reportData.interventionSection || "RFCTLARR § 30(1)"}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Delay Reduction</span>
                <span className="font-bold text-[#1E7E34] dark:text-emerald-400 font-mono">-{reportData.delayReductionDays || 120} Days</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Projected Corridor Delay</span>
                <span className="font-bold text-[#1E7E34] dark:text-emerald-300 font-mono">{reportData.projectedDelayDays || 25} Days</span>
              </div>
            </div>

            {/* Compensation Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#B8D5E5] dark:border-sky-800/30 text-xs">
              <div className="p-2 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[#5A6A80] dark:text-slate-400 text-[10px] block">Base Market Value</span>
                <span className="font-mono font-bold text-[#14213D] dark:text-white">₹{(reportData.marketValueInr || 0).toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[#5A6A80] dark:text-slate-400 text-[10px] block">Solatium 100% (§ 30(1))</span>
                <span className="font-mono font-bold text-[#B36B00] dark:text-amber-400">₹{(reportData.solatiumInr || 0).toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[#5A6A80] dark:text-slate-400 text-[10px] block">Interest 12% (§ 30(3))</span>
                <span className="font-mono font-bold text-[#0B2E59] dark:text-sky-300">₹{(reportData.interestInr || 0).toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-[3px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/40">
                <span className="text-[#1E7E34] dark:text-emerald-300 text-[10px] uppercase font-mono block font-bold">Total Statutory Award</span>
                <span className="font-mono font-extrabold text-[#1E7E34] dark:text-emerald-400 text-sm">₹{(reportData.totalAwardInr || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* SECTION F: ADMIN DIRECTIVE */}
          <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <span className="font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#1E7E34]" /> Section F: Admin Directive &amp; Assessment
              </span>
              <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">CALA Competent Authority</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Presiding Authority</span>
                <span className="font-bold text-[#14213D] dark:text-white">{reportData.adminName || "CALA District Competent Authority"}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Administrative Directives</span>
                <p className="text-[#14213D] dark:text-slate-300 italic text-[11px] mt-0.5">
                  &ldquo;{reportData.adminRemarks || "Statutory compensation award approved and authorized for electronic disbursement."}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* SECTION G: FINAL RESOLUTION & NOTICE */}
          <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <span className="font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E7E34]" /> Section G: Final Resolution &amp; Statutory Notice
              </span>
              <span className="text-[10px] font-mono text-[#1E7E34] dark:text-emerald-300 font-bold">
                {reportData.resolutionStatus || (isResolved ? "RESOLVED" : "READY FOR RESOLUTION")}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Statutory Notice Ref</span>
                <span className="font-mono font-bold text-[#B36B00] dark:text-amber-300">{reportData.noticeReference || `CALA/NOTICE/2026/${reportData.complaintId.slice(-6)}`}</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Notice Dispatch</span>
                <span className="text-[#14213D] dark:text-slate-200">Delivered to Citizen Landowner Portal</span>
              </div>
              <div>
                <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] uppercase font-mono">Legal Standing</span>
                <span className="text-[#1E7E34] dark:text-emerald-400 font-semibold">Binding Statutory Record</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5A6A80] hover:text-[#14213D] dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Close Report Viewer
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-4 py-2 rounded-[4px] bg-white dark:bg-white/5 hover:bg-[#F4F6F8] dark:hover:bg-white/10 text-[#0B2E59] dark:text-slate-200 font-bold text-xs flex items-center gap-2 border border-[#DCE2E8] dark:border-white/10 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? "Preparing PDF..." : "Download Detailed Case Report"}</span>
            </button>

            {!isResolved && onResolve && (
              <button
                onClick={() => {
                  onClose();
                  onResolve();
                }}
                className="px-5 py-2 rounded-[4px] bg-[#1E7E34] hover:bg-[#166527] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Resolve Matter</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
