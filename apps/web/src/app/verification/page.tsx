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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Real Data Provenance Banner */}
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 4,
            background: '#10b981',
            color: '#000',
            textTransform: 'uppercase'
          }}>
            FIELD VERIFICATION
          </span>
          <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>
            Ground Cadastral Verification &bull; Field Officer Queue
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
            Field Officer: Ramesh Patel (OFF-001)
          </span>
          <button
            onClick={loadData}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#34d399',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600
            }}
          >
            <RefreshCw style={{ width: 12, height: 12, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#0a2c5f',
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Designated Officer: OFF-001
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0a2c5f', margin: 0 }}>
            Field Officer Cadastral Verification Queue
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Ground truth verification: Physical parcel boundary check, Aadhaar identity confirmation, and statutory inspection reports.
          </p>
        </div>

        <Link
          href="/field"
          style={{
            padding: '9px 18px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
          }}
        >
          <Smartphone style={{ width: 15, height: 15 }} />
          <span>Open Field Officer Mobile App</span>
        </Link>
      </div>

      {/* Field Officer Profile & Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 16 }}>
        {/* Officer Card */}
        <div className="glass" style={{ borderRadius: 14, padding: 18, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#0a2c5f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0a2c5f' }}>Ramesh Patel</div>
              <div style={{ fontSize: 11, color: '#0a2c5f', fontFamily: 'JetBrains Mono, monospace' }}>OFF-001 &middot; Patwari / Revenue Lekhpal</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, background: '#ffffff', padding: '10px 12px', borderRadius: 8 }}>
            <div style={{ marginBottom: 4 }}><strong style={{ color: '#cbd5e1' }}>Department:</strong> Department of Land Resources &middot; MoRD</div>
            <div><strong style={{ color: '#cbd5e1' }}>Jurisdiction:</strong> All active corridor acquisition sectors</div>
          </div>
        </div>

        {/* Verification Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Pending Inspection</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
              {pendingVerification.length}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Awaiting site visit</div>
          </div>

          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Ground Verified</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {verified.length}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Passed to Admin</div>
          </div>

          <div style={{ borderRadius: 12, padding: '14px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Total Pipeline</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#0a2c5f', marginTop: 4 }}>
              {complaints.length}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Registered cases</div>
          </div>
        </div>
      </div>

      {/* Pending Inspection Section */}
      <div className="glass" style={{ borderRadius: 14, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Pending Ground Verification
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
              Awaiting Physical Cadastral Inspection
            </div>
          </div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#f59e0b', fontWeight: 600 }}>
            {pendingVerification.length} Pending
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            <RefreshCw style={{ width: 18, height: 18, margin: '0 auto 8px', animation: 'spin 1s linear infinite', color: '#10b981' }} />
            <span>Loading verification queue...</span>
          </div>
        ) : pendingVerification.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <CheckCircle2 style={{ width: 32, height: 32, color: '#10b981', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0a2c5f', marginBottom: 4 }}>
              No complaints pending verification.
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              All landowner complaints have been inspected on the ground or no new complaints are currently registered.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
            {pendingVerification.map(c => {
              const pid = c.parcel_id || 'N/A';
              const owner = c.owner_name || 'Landowner';
              const isWorking = actionInProgress === c.id;

              return (
                <div
                  key={c.id}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: 'rgba(10,44,95,0.04)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#0284c7' }}>
                        #{pid}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '1px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                        {c.status || 'Submitted'}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0a2c5f' }}>
                      {owner} &middot; <span style={{ fontWeight: 400, color: '#64748b', fontSize: 12 }}>{c.complaint_type || 'Compensation & Boundary Dispute'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      {c.description || 'Discrepancy in cadastral valuation and physical boundary survey.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleQuickVerify(c.id)}
                      disabled={isWorking}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        background: '#10b981',
                        color: '#000',
                        fontSize: 11,
                        fontWeight: 700,
                        border: 'none',
                        cursor: isWorking ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <CheckCircle2 style={{ width: 13, height: 13 }} />
                      <span>{isWorking ? 'Verifying...' : 'Verify Ground Truth'}</span>
                    </button>
                    <Link
                      href={`/field/complaints/${c.id}`}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#cbd5e1',
                        fontSize: 11,
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span>Site Inspection</span>
                      <ArrowRight style={{ width: 12, height: 12 }} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Verification Section */}
      <div className="glass" style={{ borderRadius: 14, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Ground Verified Pipeline
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
              Verified by Ramesh Patel (OFF-001)
            </div>
          </div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#10b981', fontWeight: 600 }}>
            {verified.length} Verified
          </div>
        </div>

        {verified.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            No verified complaints in the pipeline.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
            {verified.map(c => (
              <div
                key={c.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(16,185,129,0.03)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0a2c5f' }}>
                    Parcel #{c.parcel_id} &middot; {c.owner_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Status: <span style={{ color: '#34d399', fontWeight: 600 }}>{c.status}</span> &middot; Field notes: &ldquo;{c.field_verification_notes || c.resolution_notes || 'Verified on ground'}&rdquo;
                  </div>
                </div>

                <Link
                  href="/landowner-cases"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#0a2c5f',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>Admin Implementation Directives</span>
                  <ArrowRight style={{ width: 12, height: 12 }} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
