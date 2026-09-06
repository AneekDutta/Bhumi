"use client";

import React, { useState } from 'react';
import { PortfolioMap } from '@/components/dashboard/PortfolioMap';
import { LandownerGrievanceReviewCard } from '@/components/documents/LandownerGrievanceReviewCard';

interface AdminOperationsSectionProps {
  verifiedComplaints: any[];
  projects: any[];
}

export function AdminOperationsSection({ verifiedComplaints, projects }: AdminOperationsSectionProps) {
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const handleSelectParcel = (parcel: any) => {
    const id = parcel.map_id || parcel.id || parcel.parcel_id;
    setSelectedParcelId(id);

    // Smooth scroll to the complaint card
    const cardEl = document.getElementById(`complaint-card-${parcel.id}`) || document.getElementById(`complaint-card-${parcel.map_id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6">
      {/* ADMIN IMPLEMENTATION QUEUE (The Single Source of Truth for verified complaints) */}
      <LandownerGrievanceReviewCard 
        selectedParcelId={selectedParcelId}
        onSelectParcel={handleSelectParcel}
      />

      {/* Corridor Spatial GIS displaying Real Verified Complaint Parcels */}
      <div className="bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-none overflow-hidden shadow-none transition-colors">
        <div className="p-4 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 tracking-wider uppercase font-semibold">
              Cadastral Spatial GIS
            </div>
            <div className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF] mt-0.5">
              Verified Demarcation &amp; Cadastral Spatial Overview
            </div>
          </div>
          <div className="text-xs font-mono text-[#0B5FA5] dark:text-sky-400 font-bold">
            {verifiedComplaints.length} Verified Parcel{verifiedComplaints.length === 1 ? '' : 's'} on Ground
          </div>
        </div>

        <PortfolioMap 
          verifiedParcels={verifiedComplaints}
          projects={projects}
          selectedParcelId={selectedParcelId}
          onSelectParcel={handleSelectParcel}
        />
      </div>
    </div>
  );
}
