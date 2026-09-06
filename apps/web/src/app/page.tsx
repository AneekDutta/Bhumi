import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  ArrowRight, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  IndianRupee, 
  Layers, 
  Users, 
  TrendingUp, 
  Scale,
  Navigation,
  Building2,
  Sparkles,
  Train,
  Zap,
  Droplet
} from 'lucide-react';
import { apiClient, getRealDashboardStats } from '@/lib/api';
import { AdminOperationsSection } from '@/components/dashboard/AdminOperationsSection';
import { MOCK_GOVERNMENT_PROJECTS } from '@/lib/mockProjectData';

export const metadata: Metadata = {
  title: 'National Operations Console | BHUMI',
  description: 'National land acquisition portfolio overview separated into Government Infrastructure Corridors and Real Citizen Grievances.',
};

async function getVerifiedComplaints() {
  try {
    const data = await apiClient.getLandownerComplaints({});
    return (data || []).filter((c: any) => {
      const s = c.status || "";
      return (
        s === "Verified by Field Officer" ||
        s === "Field Verified" ||
        s === "Implementation Initiated" ||
        s === "Implementation Completed" ||
        s === "RESOLVED"
      );
    });
  } catch {
    return [];
  }
}

export default async function NationalDashboardPage() {
  const verifiedComplaints = await getVerifiedComplaints();
  const stats = await getRealDashboardStats();

  const totalParcels = stats.total_parcels;
  const pendingVerification = stats.pending_field_verification;
  const verifiedCount = stats.verified_by_field_officer;
  const implementationInitiated = stats.implementation_initiated;
  const implementationCompleted = stats.implementation_completed;

  // Mock Government Projects data
  const mockProjects = MOCK_GOVERNMENT_PROJECTS;
  const mockTotalLength = mockProjects.reduce((sum, p) => sum + (p.total_length_km || 0), 0);
  const mockTotalPlannedAcq = mockProjects.reduce((sum, p) => sum + p.planned_acquisition_ha, 0);
  const mockTotalAcquired = mockProjects.reduce((sum, p) => sum + p.acquired_area_ha, 0);
  const mockAvgProgress = Math.round((mockTotalAcquired / (mockTotalPlannedAcq || 1)) * 100);
  const mockBottlenecks = mockProjects.reduce((s, p) => s + p.statistics.unresolved_bottlenecks, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* Main Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '3px 10px', borderRadius: 6,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              LIVE CONSOLE
            </span>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
              Institutional Operations &middot; CALA Administration
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 800, color: '#e2e8f0', margin: 0, lineHeight: 1.2 }}>
            National Land Acquisition Operations
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            National Infrastructure Corridors and Citizen Landowner Cases.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/projects/gis" style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            color: '#fcd34d', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Navigation style={{ width: 14, height: 14 }} />
            <span>Project Spatial Map</span>
          </Link>
          <Link href="/landowner-gis" style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#34d399', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Navigation style={{ width: 14, height: 14 }} />
            <span>Land Parcel Map</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: GOVERNMENT INFRASTRUCTURE PROJECT PORTFOLIO */}
      {/* ========================================================================= */}
      <section style={{
        borderRadius: 16,
        padding: 24,
        background: 'rgba(245,158,11,0.02)',
        border: '1px solid rgba(245,158,11,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Section A Tag & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 5,
              background: '#f59e0b',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              SECTION A &bull; NATIONAL INFRASTRUCTURE PROJECTS
            </span>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 800, color: '#fcd34d', margin: 0 }}>
              Government Infrastructure Project Portfolio
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
              6 Strategic National Corridors
            </span>
            <Link
              href="/projects"
              style={{
                fontSize: 11,
                color: '#f59e0b',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>View Full Directory</span>
              <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Multi-sector linear corridor footprints representing Highways, Railways, Industrial Corridors, Irrigation, Renewable Energy, and Urban Development. Isolated from citizen-submitted records.
        </p>

        {/* Section A Portfolio KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Total Length</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800, color: '#fcd34d', marginTop: 4 }}>
              {mockTotalLength.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 500 }}>km</span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Highways &amp; Railways</div>
          </div>

          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Planned Acquisition</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
              {mockTotalPlannedAcq.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>Ha</span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Projected corridor land</div>
          </div>

          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Acquired to Date</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {mockTotalAcquired.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>Ha</span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{mockAvgProgress}% Portfolio throughput</div>
          </div>

          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Corridor Bottlenecks</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
              {mockBottlenecks}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Simulated risk clusters</div>
          </div>
        </div>

        {/* Corridor Preview Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {mockProjects.slice(0, 3).map(p => (
            <div
              key={p.id}
              style={{
                borderRadius: 10,
                padding: '14px 16px',
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#818cf8', fontWeight: 700 }}>
                    {p.code} &middot; {p.sector}
                  </span>
                  <span style={{
                    fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    padding: '1px 5px', borderRadius: 3,
                    background: p.status === 'DELAYED' ? 'rgba(245,158,11,0.2)' : p.status === 'CRITICAL_BLOCKER' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                    color: p.status === 'DELAYED' ? '#f59e0b' : p.status === 'CRITICAL_BLOCKER' ? '#ef4444' : '#10b981'
                  }}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {p.state} &middot; {p.acquisition_progress_pct}% Acquired
                </div>
              </div>

              <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  Target: {p.timeline_target}
                </span>
                <Link
                  href={`/projects/gis?id=${p.id}`}
                  style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <span>Corridor GIS</span>
                  <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION B: CITIZEN LANDOWNER GRIEVANCES & ACQUISITION DIRECTIVES */}
      {/* ========================================================================= */}
      <section style={{
        borderRadius: 16,
        padding: 24,
        background: 'rgba(16,185,129,0.02)',
        border: '1px solid rgba(16,185,129,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }}>
        {/* Section B Tag & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 5,
              background: '#10b981',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              SECTION B &bull; LANDOWNER CASES &amp; ACQUISITION DIRECTIVES
            </span>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 800, color: '#6ee7b7', margin: 0 }}>
              Landowner Grievances &amp; Cadastral Acquisition Cases
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
              Field Officer: Ramesh Patel (OFF-001)
            </span>
            <Link
              href="/landowner-cases"
              style={{
                fontSize: 11,
                color: '#34d399',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>View Full Cases Queue</span>
              <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Sole source of truth for citizen cases. Originates strictly from citizen parcel registrations (4+ GPS coordinates) &rarr; landowner complaints &rarr; Field Officer ground verification &rarr; Admin statutory determination.
        </p>

        {/* Real KPIs Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Registered Parcels</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {totalParcels}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{stats.area_proposed_acres || 0} Acres Proposed</div>
          </div>

          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Pending Inspection</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
              {pendingVerification}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Ramesh Patel (OFF-001)</div>
          </div>

          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Verified Cases</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#818cf8', marginTop: 4 }}>
              {verifiedCount}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Passed ground check</div>
          </div>

          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Active Orders</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
              {implementationInitiated}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Admin implementation</div>
          </div>

          <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 10, color: '#6b7a94', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Completed Awards</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
              {implementationCompleted}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Disbursed awards</div>
          </div>
        </div>

        {/* Statutory Aggregations Strip */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Scale style={{ width: 14, height: 14, color: '#10b981' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>
                RFCTLARR 2013 Statutory First Schedule Aggregations
              </span>
            </div>
            <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
              Official Statutory Reconciliation
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            <div>
              <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Compensation Assessed</span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                ₹{(stats.compensation_assessed_inr || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Compensation Paid</span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                ₹{(stats.compensation_paid_inr || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Affected Families</span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                {stats.affected_families_count || 0}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Possession Complete</span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                {stats.possession_complete_count || 0} / {totalParcels || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Live Admin Implementation Operations & Real GIS Map */}
        <AdminOperationsSection 
          verifiedComplaints={verifiedComplaints}
          projects={[]}
        />
      </section>

    </div>
  );
}
