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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ADMIN IMPLEMENTATION QUEUE (The Single Source of Truth for verified complaints) */}
      <LandownerGrievanceReviewCard 
        selectedParcelId={selectedParcelId}
        onSelectParcel={handleSelectParcel}
      />

      {/* Corridor Spatial GIS displaying Real Verified Complaint Parcels */}
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Cadastral Spatial GIS
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#c4cfe4', marginTop: 2 }}>
              Verified Demarcation &amp; Cadastral Spatial Overview
            </div>
          </div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#818cf8', fontWeight: 600 }}>
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
