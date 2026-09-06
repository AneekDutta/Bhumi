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
    <div className="space-y-6">
      {/* Real Data Provenance Banner */}
      <div className="bg-[#E8F1FA] dark:bg-[#0B2E59]/30 border border-[#B8D5E5] dark:border-[#0B2E59] px-4 py-2.5 rounded-[4px] flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
            CADASTRAL RECORDS
          </span>
          <span className="text-xs text-[#0B2E59] dark:text-[#93C5FD] font-semibold">
            Registered Cadastral Parcels &bull; Authoritative Statutory Registry
          </span>
        </div>
        <div className="flex items-center gap-3.5 text-xs text-[#555555] dark:text-slate-400">
          <span className="font-mono text-[11px]">Official Revenue Parcels</span>
          <button
            onClick={loadParcels}
            className="text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-emerald-100 dark:bg-emerald-950/50 text-[#1E7E34] dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 uppercase">
              {parcels.length} Registered Parcels
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#14213D] dark:text-[#F0F4FF]">
            Cadastral Parcel Register
          </h1>
          <p className="text-xs text-[#555555] dark:text-slate-400 mt-1">
            Authoritative registry of citizen land parcels with verified Aadhaar identity, official documents, and GPS boundaries
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/landowner-gis"
            className="px-3.5 py-2 rounded-[4px] bg-white dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-sky-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>View in Landowner GIS</span>
          </Link>
          <Link
            href="/landowner"
            className="px-3.5 py-2 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Citizen Portal</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards - Form Ledger Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B2E59] dark:border-sky-500">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider font-mono">Registered Parcels</div>
          <div className="text-2xl font-bold text-[#14213D] dark:text-white mt-1 font-mono">{parcels.length}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Registered in System</div>
        </div>

        <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B5FA5]">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider font-mono">Aadhaar Verified</div>
          <div className="text-2xl font-bold text-[#0B5FA5] dark:text-sky-400 mt-1 font-mono">{verifiedIdentityCount}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Citizen identity confirmed</div>
        </div>

        <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#1E7E34]">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider font-mono">Registered Area</div>
          <div className="text-2xl font-bold text-[#1E7E34] dark:text-emerald-400 mt-1 font-mono">
            {totalAreaAcres.toFixed(2)} <span className="text-xs font-medium text-[#555555] dark:text-slate-400">Acres</span>
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Total declared cadastral land</div>
        </div>

        <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#B36B00]">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider font-mono">Field Officer</div>
          <div className="text-base font-bold text-[#B36B00] dark:text-amber-400 mt-1.5 font-mono">Ramesh Patel</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">OFF-001 &bull; Patwari</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative min-w-[280px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search by Parcel ID, Owner Name, Village, District..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0a0f1d] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white rounded-[4px] text-xs focus:border-[#0B2E59] outline-none shadow-xs"
          />
        </div>
        <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
          Showing {filteredParcels.length} of {parcels.length} parcels
        </span>
      </div>

      {/* Parcel Table */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div>
            <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 tracking-wider uppercase">
              Cadastral Parcel Register
            </div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white">
              Authoritative Records
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#64748B] text-xs">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#0B2E59] dark:text-sky-400" />
            <span>Loading registered parcels...</span>
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#1E7E34] mx-auto mb-2" />
            <div className="text-sm font-bold text-[#14213D] dark:text-white mb-1">
              No registered land parcels available.
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Land parcels registered by citizens in the Landowner Portal will appear here with verified identity, uploaded deeds, and GPS boundary vertices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#F1F4F7] dark:bg-white/5 border-b border-[#DCE2E8] dark:border-white/10 text-[#555555] dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                  {['Parcel ID', 'Owner Name', 'Identity Status', 'Location', 'Area (Acres)', 'Boundary GPS', 'Documents', 'Action'].map(h => (
                    <th key={h} className="px-4 py-2.5 whitespace-nowrap font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10">
                {filteredParcels.map(p => {
                  const pid = p.parcel_id || p.id || 'N/A';
                  const owner = p.owner_legal_name || p.owner_name || 'Landowner';
                  const isVerified = p.identity_verified || p.aadhaar_verified || p.status === 'VERIFIED';
                  const location = [p.village_name || p.contact_village, p.district, p.state].filter(Boolean).join(', ') || 'Rural Sector';
                  const areaAcres = Number(p.calculated_area_acres || p.area_acres || (p.calculated_area_sqm ? p.calculated_area_sqm / 4046.86 : 0)).toFixed(2);
                  const coordsCount = (p.coordinates && p.coordinates.length) || (p.landowner_reported_boundary?.coordinates?.[0]?.length) || 0;
                  const docCount = p.documents?.length || p.document_ids?.length || (p.document_filename ? 1 : 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                        #{pid}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#14213D] dark:text-white">
                        {owner}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-[4px] border ${
                          isVerified
                            ? 'bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-400 border-[#C8E6C9] dark:border-emerald-800/50'
                            : 'bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-400 border-[#FFE082] dark:border-amber-800/50'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          <span>{isVerified ? 'Aadhaar Verified' : 'Pending Verification'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#555555] dark:text-slate-300">
                        {location}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#1E7E34] dark:text-emerald-400">
                        {areaAcres} Acres
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#0B5FA5] dark:text-sky-400 font-mono">
                          {coordsCount} GPS Vertices
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#555555] dark:text-slate-300">
                        {docCount} Document{docCount === 1 ? '' : 's'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/landowner-gis?id=${pid}`}
                          className="font-bold text-[#0B5FA5] dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>GIS Boundary</span>
                          <ArrowRight className="w-3 h-3" />
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
