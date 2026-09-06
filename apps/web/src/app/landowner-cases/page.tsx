'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import { getLandownerComplaints } from '@/lib/api';
import { LandownerGrievanceReviewCard } from '@/components/documents/LandownerGrievanceReviewCard';
import { PortfolioMap } from '@/components/dashboard/PortfolioMap';

export default function LandownerCasesPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const fetchRealData = async () => {
    setLoading(true);
    try {
      const data = await getLandownerComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.error('Failed to load landowner complaints:', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  // Filter verified complaints that have passed Field Officer verification
  const verifiedComplaints = complaints.filter(c => {
    const s = c.status || '';
    return (
      s === 'Verified by Field Officer' ||
      s === 'Field Verified' ||
      s === 'Implementation Initiated' ||
      s === 'Implementation Completed' ||
      s === 'RESOLVED'
    );
  });

  const pendingInitiation = verifiedComplaints.filter(c => 
    c.status === 'Verified by Field Officer' || c.status === 'Field Verified'
  ).length;

  const inProgress = verifiedComplaints.filter(c => 
    c.status === 'Implementation Initiated'
  ).length;

  const completed = verifiedComplaints.filter(c => 
    c.status === 'Implementation Completed' || c.status === 'RESOLVED'
  ).length;

  const totalAcres = verifiedComplaints.reduce((sum, c) => {
    const ac = c.landowner_declared_area?.acres || (c.area_sqm ? c.area_sqm / 4046.86 : 0);
    return sum + Number(ac);
  }, 0);

  const handleSelectParcel = (parcel: any) => {
    const id = parcel.map_id || parcel.id || parcel.parcel_id;
    setSelectedParcelId(id);

    const cardEl = document.getElementById(`complaint-card-${parcel.id}`) || document.getElementById(`complaint-card-${parcel.map_id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Official Landowner Cases Banner */}
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.25)',
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
            LANDOWNER GRIEVANCES
          </span>
          <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>
            Authoritative Citizen Land Records &bull; Field Verification Workflow
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
            Designated Field Officer: Ramesh Patel (OFF-001)
          </span>
          <button
            onClick={fetchRealData}
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '3px 10px', borderRadius: 5,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399'
            }}>
              {verifiedComplaints.length} Verified Landowner Grievances
            </span>
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
              Statutory Resolution &bull; RFCTLARR 2013 First Schedule
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            Landowner Grievances &amp; Acquisition Resolution
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Direct administrative oversight for citizen disputes: review field officer findings, evaluate counterfactual What-If scenarios, and issue statutory determinations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/landowner-gis"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Navigation style={{ width: 14, height: 14 }} />
            <span>Open Real Landowner GIS</span>
          </Link>
          <Link
            href="/intelligence/what-if"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
            }}
          >
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>What-If Workbench</span>
          </Link>
        </div>
      </div>

      {/* Real Statistics Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Verified Cases</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {verifiedComplaints.length}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Inspected by Field Officer</div>
        </div>

        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Pending Directives</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {pendingInitiation}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Awaiting admin order</div>
        </div>

        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Active Orders</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#818cf8', marginTop: 4 }}>
            {inProgress}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Implementation in progress</div>
        </div>

        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)' }}>
          <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Completed Awards</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            {completed}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Statutory awards disbursed</div>
        </div>

        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Disputed Area</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#e2e8f0', marginTop: 4 }}>
            {totalAcres.toFixed(2)} <span style={{ fontSize: 13, fontWeight: 500 }}>Acres</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Cadastral geometry</div>
        </div>
      </div>

      {/* Main Admin Implementation Card (with What-If simulation modal) */}
      <LandownerGrievanceReviewCard
        selectedParcelId={selectedParcelId}
        onSelectParcel={handleSelectParcel}
      />

      {/* Spatial Real Cadastral Polygon Map */}
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Cadastral Spatial Map &bull; Ground Demarcated Boundaries
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#c4cfe4', marginTop: 2 }}>
              Ground-Demarcated Polygon Geometry
            </div>
          </div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#10b981', fontWeight: 600 }}>
            {verifiedComplaints.length} Verified Cadastral Polygon{verifiedComplaints.length === 1 ? '' : 's'}
          </div>
        </div>

        <PortfolioMap 
          verifiedParcels={verifiedComplaints}
          selectedParcelId={selectedParcelId}
          onSelectParcel={handleSelectParcel}
        />
      </div>

    </div>
  );
}
