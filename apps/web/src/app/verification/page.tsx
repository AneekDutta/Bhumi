'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  ArrowRight, 
  RefreshCw, 
  FileText, 
  ExternalLink,
  Smartphone,
  Navigation
} from 'lucide-react';
import { getLandownerComplaints, fieldVerifyComplaint, fieldRejectComplaint } from '@/lib/api';

export default function FieldVerificationOverviewPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getLandownerComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.error('Error fetching complaints for verification:', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingVerification = complaints.filter(c => 
    !c.status || c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Assigned'
  );

  const verified = complaints.filter(c => 
    c.status === 'FIELD VERIFIED' || c.status === 'Verified by Field Officer' || c.status === 'Field Verified' || c.status === 'Implementation Initiated' || c.status === 'Implementation Completed' || c.status === 'RESOLVED'
  );

  const handleQuickVerify = async (complaintId: string) => {
    const notes = prompt("Enter field verification inspection notes (e.g., 'Ground inspection completed. Boundary corners verified with cadastral map.'):", "Ground cadastral inspection verified matching physical boundaries.");
    if (!notes) return;

    setActionInProgress(complaintId);
    try {
      await fieldVerifyComplaint(complaintId, "OFF-001", "Ramesh Patel", notes);
      await loadData();
    } catch (err) {
      alert("Failed to verify complaint: " + err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real Data Provenance Banner */}
      <div className="bg-[#E8F1FA] dark:bg-[#0B2E59]/30 border border-[#B8D5E5] dark:border-[#0B2E59] px-4 py-2.5 rounded-[4px] flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
            FIELD VERIFICATION
          </span>
          <span className="text-xs text-[#0B2E59] dark:text-[#93C5FD] font-semibold">
            Ground Cadastral Verification &bull; Field Officer Queue
          </span>
        </div>
        <div className="flex items-center gap-3.5 text-xs text-[#555555] dark:text-slate-400">
          <span className="font-mono text-[11px]">Field Officer: Ramesh Patel (OFF-001)</span>
          <button
            onClick={loadData}
            className="text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
              Designated Officer: OFF-001
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#14213D] dark:text-[#F0F4FF]">
            Field Officer Cadastral Verification Queue
          </h1>
          <p className="text-xs text-[#555555] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Ground truth verification: Physical parcel boundary check, Aadhaar identity confirmation, and statutory inspection reports.
          </p>
        </div>

        <Link
          href="/field"
          className="px-3.5 py-2 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Open Field Officer Mobile App</span>
        </Link>
      </div>

      {/* Field Officer Profile & Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Officer Card */}
        <div className="md:col-span-5 bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#E8F1FA] dark:bg-sky-950/40 border border-[#B8D5E5] dark:border-sky-800/40 text-[#0B2E59] dark:text-sky-300 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#14213D] dark:text-white">Ramesh Patel</div>
              <div className="text-xs text-[#0B5FA5] dark:text-sky-400 font-mono font-semibold">OFF-001 &bull; Patwari / Revenue Lekhpal</div>
            </div>
          </div>
          <div className="text-xs text-[#555555] dark:text-slate-400 leading-relaxed bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#DCE2E8] dark:border-white/10 p-2.5 rounded-[4px] space-y-1">
            <div><strong className="text-[#14213D] dark:text-slate-200">Department:</strong> Department of Land Resources &bull; MoRD</div>
            <div><strong className="text-[#14213D] dark:text-slate-200">Jurisdiction:</strong> All active corridor acquisition sectors</div>
          </div>
        </div>

        {/* Verification Metrics */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
            <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Pending Inspection</div>
            <div className="text-2xl font-bold text-[#B36B00] dark:text-amber-400 mt-1">
              {pendingVerification.length}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Awaiting site visit</div>
          </div>

          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
            <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Ground Verified</div>
            <div className="text-2xl font-bold text-[#1E7E34] dark:text-emerald-400 mt-1">
              {verified.length}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Passed to Admin</div>
          </div>

          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
            <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Total Pipeline</div>
            <div className="text-2xl font-bold text-[#0B2E59] dark:text-sky-400 mt-1">
              {complaints.length}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Registered cases</div>
          </div>
        </div>
      </div>

      {/* Pending Inspection Section */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2 bg-slate-50/50 dark:bg-white/[0.02]">
          <div>
            <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Pending Ground Verification
            </div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">
              Awaiting Physical Cadastral Inspection
            </div>
          </div>
          <div className="text-xs font-mono text-[#B36B00] dark:text-amber-400 font-bold">
            {pendingVerification.length} Pending
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#64748B] text-xs">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#0B2E59] dark:text-sky-400" />
            <span>Loading verification queue...</span>
          </div>
        ) : pendingVerification.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#1E7E34] mx-auto mb-2" />
            <div className="text-sm font-bold text-[#14213D] dark:text-white mb-1">
              No complaints pending verification.
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              All landowner complaints have been inspected on the ground or no new complaints are currently registered.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {pendingVerification.map(c => {
              const pid = c.parcel_id || 'N/A';
              const owner = c.owner_name || 'Landowner';
              const isWorking = actionInProgress === c.id;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-3.5"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                        #{pid}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-amber-100 dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-400 border border-amber-300 dark:border-amber-800/50 uppercase">
                        {c.status || 'Submitted'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#14213D] dark:text-white">
                      {owner} &bull; <span className="font-normal text-[#555555] dark:text-slate-400">{c.complaint_type || 'Compensation & Boundary Dispute'}</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">
                      {c.description || 'Discrepancy in cadastral valuation and physical boundary survey.'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickVerify(c.id)}
                      disabled={isWorking}
                      className="px-3.5 py-1.5 rounded-[4px] bg-[#1E7E34] hover:bg-[#166527] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isWorking ? 'Verifying...' : 'Verify Ground Truth'}</span>
                    </button>
                    <Link
                      href={`/field/complaints/${c.id}`}
                      className="px-3 py-1.5 rounded-[4px] bg-white dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-sky-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-1 transition-colors"
                    >
                      <span>Site Inspection</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Verification Section */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2 bg-slate-50/50 dark:bg-white/[0.02]">
          <div>
            <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Ground Verified Pipeline
            </div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">
              Verified by Ramesh Patel (OFF-001)
            </div>
          </div>
          <div className="text-xs font-mono text-[#1E7E34] dark:text-emerald-400 font-bold">
            {verified.length} Verified
          </div>
        </div>

        {verified.length === 0 ? (
          <div className="py-8 text-center text-[#64748B] text-xs">
            No verified complaints in the pipeline.
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {verified.map(c => (
              <div
                key={c.id}
                className="p-3 rounded-[4px] bg-slate-50/60 dark:bg-white/[0.02] border border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2.5 text-xs"
              >
                <div>
                  <div className="font-bold text-[#14213D] dark:text-white">
                    Parcel #{c.parcel_id} &bull; {c.owner_name}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                    Status: <span className="text-[#1E7E34] dark:text-emerald-400 font-semibold">{c.status}</span> &bull; Field notes: &ldquo;{c.field_verification_notes || c.resolution_notes || 'Verified on ground'}&rdquo;
                  </div>
                </div>

                <Link
                  href="/landowner-cases"
                  className="font-bold text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Admin Implementation Directives</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
