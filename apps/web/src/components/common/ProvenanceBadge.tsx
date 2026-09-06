'use client';

import React, { useState } from 'react';
import { ShieldCheck, Database, UserCheck, Cpu, ExternalLink, Info } from 'lucide-react';

export type SourceType = 'REAL_PUBLIC' | 'SYNTHETIC' | 'USER_ENTERED' | 'MODEL_DERIVED';

interface ProvenanceBadgeProps {
  sourceType?: SourceType | string;
  source?: string;
  sourceUrl?: string;
  sourceTimestamp?: string;
  confidence?: number;
  size?: 'xs' | 'sm' | 'md';
  showTooltip?: boolean;
  className?: string;
}

const PROVENANCE_CONFIG: Record<
  SourceType,
  {
    label: string;
    icon: any;
    bg: string;
    text: string;
    border: string;
    description: string;
  }
> = {
  REAL_PUBLIC: {
    label: 'REAL PUBLIC',
    icon: ShieldCheck,
    bg: 'rgba(14, 165, 233, 0.12)',
    text: '#38bdf8', // sky-400
    border: 'rgba(56, 189, 248, 0.35)',
    description: 'Verified authoritative public-domain data traceable to an official citation or gazette notification.'
  },
  SYNTHETIC: {
    label: 'SYNTHETIC',
    icon: Database,
    bg: 'rgba(168, 85, 247, 0.12)',
    text: '#c084fc', // purple-400
    border: 'rgba(192, 132, 252, 0.35)',
    description: 'Synthetically generated benchmark dataset conforming strictly to SIH26016 cadastral schema.'
  },
  USER_ENTERED: {
    label: 'USER ENTERED',
    icon: UserCheck,
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#fbbf24', // amber-400
    border: 'rgba(251, 191, 36, 0.35)',
    description: 'Entered or verified by Competent Authority / Field Officer during statutory workflow.'
  },
  MODEL_DERIVED: {
    label: 'MODEL DERIVED',
    icon: Cpu,
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#34d399', // emerald-400
    border: 'rgba(52, 211, 153, 0.35)',
    description: 'Computed algorithmically via deterministic CPM dependency engine or RFCTLARR statutory math.'
  }
};

export function ProvenanceBadge({
  sourceType = 'SYNTHETIC',
  source,
  sourceUrl,
  sourceTimestamp,
  confidence,
  size = 'sm',
  showTooltip = true,
  className = ''
}: ProvenanceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const cleanType: SourceType =
    sourceType && PROVENANCE_CONFIG[sourceType as SourceType]
      ? (sourceType as SourceType)
      : 'SYNTHETIC';

  const cfg = PROVENANCE_CONFIG[cleanType];
  const Icon = cfg.icon;

  const fontSizes = {
    xs: { px: '5px 8px', text: '9px', icon: 10 },
    sm: { px: '6px 10px', text: '10px', icon: 12 },
    md: { px: '8px 12px', text: '11px', icon: 14 }
  }[size];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} className={className}>
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: fontSizes.px,
          borderRadius: 3,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.text,
          fontSize: fontSizes.text,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.06em',
          cursor: showTooltip ? 'help' : 'default',
          userSelect: 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <Icon style={{ width: fontSizes.icon, height: fontSizes.icon }} />
        <span>{cfg.label}</span>
      </div>

      {showTooltip && isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 260,
            padding: '12px 14px',
            borderRadius: 4,
            background: '#0D121F',
            border: `1px solid ${cfg.border}`,
            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.6)',
            zIndex: 9999,
            fontSize: 11,
            color: '#c4cfe4',
            lineHeight: 1.45,
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 800, color: cfg.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
              DATA PROVENANCE: {cfg.label}
            </span>
            {confidence !== undefined && (
              <span style={{ fontSize: 9, color: '#94a3b8' }}>
                Conf: {Math.round(confidence * 100)}%
              </span>
            )}
          </div>

          <p style={{ margin: 0, color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>
            {cfg.description}
          </p>

          {source && (
            <div style={{ fontSize: 10, marginTop: 4, color: '#cbd5e1' }}>
              <span style={{ color: '#64748b' }}>Source:</span> {source}
            </div>
          )}

          {sourceTimestamp && (
            <div style={{ fontSize: 10, marginTop: 2, color: '#94a3b8' }}>
              <span style={{ color: '#64748b' }}>Timestamp:</span> {sourceTimestamp}
            </div>
          )}

          {sourceUrl && cleanType === 'REAL_PUBLIC' && (
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#38bdf8',
                  fontSize: 10,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Inspect Original Citation <ExternalLink style={{ width: 10, height: 10 }} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DataRealityBanner() {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2.5 px-4 py-2.5 rounded-[4px] bg-[#E8F1FA] dark:bg-[#0B2E59]/30 border border-[#B8D5E5] dark:border-[#0B2E59] mb-4 shadow-xs">
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400 shrink-0" />
        <span className="text-xs text-[#0B2E59] dark:text-sky-200 font-semibold">
          SIH26016 Provenance Reality Matrix Active:
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <ProvenanceBadge sourceType="REAL_PUBLIC" size="xs" />
        <ProvenanceBadge sourceType="SYNTHETIC" size="xs" />
        <ProvenanceBadge sourceType="USER_ENTERED" size="xs" />
        <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
      </div>
    </div>
  );
}
