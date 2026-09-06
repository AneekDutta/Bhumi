'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Filter, 
  FileText, 
  Layers, 
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { getAllRegisteredParcels } from '@/lib/api';

export default function ParcelsPage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadParcels = async () => {
    setLoading(true);
    try {
      const data = await getAllRegisteredParcels();
      setParcels(data || []);
    } catch (err) {
      console.error('Failed to load registered parcels:', err);
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParcels();
  }, []);

  const filteredParcels = parcels.filter(p => {
    const q = searchQuery.toLowerCase();
    const pid = (p.parcel_id || p.id || '').toLowerCase();
    const name = (p.owner_legal_name || p.owner_name || '').toLowerCase();
    const vill = (p.village_name || p.contact_village || '').toLowerCase();
    const dist = (p.district || '').toLowerCase();
    return pid.includes(q) || name.includes(q) || vill.includes(q) || dist.includes(q);
  });

  const totalAreaAcres = parcels.reduce((sum, p) => {
    const ac = Number(p.calculated_area_acres || p.area_acres || (p.calculated_area_sqm ? p.calculated_area_sqm / 4046.86 : 0)) || 0;
    return sum + ac;
  }, 0);

  const verifiedIdentityCount = parcels.filter(p => 
    p.identity_verified === true || p.aadhaar_verified === true || p.status === 'VERIFIED'
  ).length;

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
            CADASTRAL RECORDS
          </span>
          <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>
            Registered Cadastral Parcels &bull; Authoritative Statutory Registry
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
            Official Revenue Parcels
          </span>
          <button
            onClick={loadParcels}
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399',
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              {parcels.length} Registered Parcels
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0a2c5f', margin: 0 }}>
            Cadastral Parcel Register
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Authoritative registry of citizen land parcels with verified Aadhaar identity, official documents, and GPS boundaries
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/landowner-gis"
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: 'rgba(99,102,241,0.15)',
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
            <span>View in Landowner GIS</span>
          </Link>
          <Link
            href="/landowner"
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileText style={{ width: 14, height: 14 }} />
            <span>Citizen Portal</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ borderRadius: 13, padding: '16px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Registered Parcels</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#10b981', marginTop: 4 }}>{parcels.length}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Registered in System</div>
        </div>

        <div style={{ borderRadius: 13, padding: '16px 18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Aadhaar Verified</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0a2c5f', marginTop: 4 }}>{verifiedIdentityCount}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Citizen identity confirmed</div>
        </div>

        <div style={{ borderRadius: 13, padding: '16px 18px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Registered Area</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
            {totalAreaAcres.toFixed(2)} <span style={{ fontSize: 14, fontWeight: 500 }}>Acres</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Total declared cadastral land</div>
        </div>

        <div style={{ borderRadius: 13, padding: '16px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Field Officer</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 800, color: '#f59e0b', marginTop: 8 }}>Ramesh Patel</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>OFF-001 &middot; Patwari</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ position: 'relative', minWidth: 280, maxWidth: 400, flex: 1 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by Parcel ID, Owner Name, Village, District..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: 12,
              outline: 'none'
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
          Showing {filteredParcels.length} of {parcels.length} parcels
        </span>
      </div>

      {/* Parcel Table */}
      <div className="glass" style={{ borderRadius: 14, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Cadastral Parcel Register
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
              Authoritative Records
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            <RefreshCw style={{ width: 20, height: 20, margin: '0 auto 10px', animation: 'spin 1s linear infinite', color: '#10b981' }} />
            <span>Loading registered parcels...</span>
          </div>
        ) : filteredParcels.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center' }}>
            <CheckCircle2 style={{ width: 36, height: 36, color: '#10b981', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0a2c5f', marginBottom: 6 }}>
              No registered land parcels available.
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Land parcels registered by citizens in the Landowner Portal will appear here with verified identity, uploaded deeds, and GPS boundary vertices.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#f8fafc' }}>
                  {['Parcel ID', 'Owner Name', 'Identity Status', 'Location', 'Area (Acres)', 'Boundary GPS', 'Documents', 'Action'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredParcels.map(p => {
                  const pid = p.parcel_id || p.id || 'N/A';
                  const owner = p.owner_legal_name || p.owner_name || 'Landowner';
                  const isVerified = p.identity_verified || p.aadhaar_verified || p.status === 'VERIFIED';
                  const location = [p.village_name || p.contact_village, p.district, p.state].filter(Boolean).join(', ') || 'Rural Sector';
                  const areaAcres = Number(p.calculated_area_acres || p.area_acres || (p.calculated_area_sqm ? p.calculated_area_sqm / 4046.86 : 0)).toFixed(2);
                  const coordsCount = (p.coordinates && p.coordinates.length) || (p.landowner_reported_boundary?.coordinates?.[0]?.length) || 0;
                  const docCount = p.documents?.length || p.document_ids?.length || (p.document_filename ? 1 : 0);

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#0284c7' }}>
                        #{pid}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0a2c5f' }}>
                        {owner}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: isVerified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: isVerified ? '#34d399' : '#f59e0b',
                          border: `1px solid ${isVerified ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                        }}>
                          <ShieldCheck style={{ width: 11, height: 11 }} />
                          <span>{isVerified ? 'Aadhaar Verified' : 'Pending Verification'}</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {location}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#10b981' }}>
                        {areaAcres} Acres
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, color: '#0a2c5f', fontFamily: 'JetBrains Mono, monospace' }}>
                          {coordsCount} GPS Vertices
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 11 }}>
                        {docCount} Document{docCount === 1 ? '' : 's'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link
                          href={`/landowner-gis?id=${pid}`}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#0a2c5f',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span>GIS Boundary</span>
                          <ArrowRight style={{ width: 12, height: 12 }} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
