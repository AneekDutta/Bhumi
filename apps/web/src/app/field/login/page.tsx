"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserCheck, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  ClipboardList, 
  Layers, 
  Monitor, 
  Smartphone,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { getFieldOfficers } from "@/lib/api";
import { offlineStore } from "@/lib/offlineStore";

interface Officer {
  officer_id: string;
  name: string;
  designation?: string;
  department_name?: string;
  assigned_villages: string[];
  pending_tasks_count: number;
}

const FALLBACK_OFFICERS: Officer[] = [
  {
    officer_id: "OFF-001",
    name: "Ramesh Patel",
    designation: "Patwari / Revenue Lekhpal",
    department_name: "Revenue Dept · UP",
    assigned_villages: ["Rampur", "Bilaspur", "Wagholi"],
    pending_tasks_count: 6
  },
  {
    officer_id: "OFF-002",
    name: "Anita Sharma",
    designation: "Field Surveyor",
    department_name: "Survey of India / DILRMP",
    assigned_villages: ["Kalyanpur", "Shivpur"],
    pending_tasks_count: 4
  },
  {
    officer_id: "OFF-003",
    name: "Sanjay Verma",
    designation: "Naib Tehsildar",
    department_name: "Land Acquisition Authority",
    assigned_villages: ["All Project Corridor Sectors"],
    pending_tasks_count: 9
  },
  {
    officer_id: "OFF-004",
    name: "Rajesh Kumar",
    designation: "Competent Authority (CALA)",
    department_name: "National Highways Division",
    assigned_villages: ["Corridor P-NH927A"],
    pending_tasks_count: 14
  }
];

export default function FieldLoginPage() {
  const router = useRouter();
  const [officers, setOfficers] = useState<Officer[]>(FALLBACK_OFFICERS);
  const [loading, setLoading] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

  useEffect(() => {
    async function loadOfficers() {
      try {
        const data = await getFieldOfficers();
        if (data && data.length > 0) {
          setOfficers(data);
        }
      } catch (err) {
        console.warn("Using offline fallback officers:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOfficers();

    const active = offlineStore.getActiveOfficer();
    if (active) {
      const match = FALLBACK_OFFICERS.find((o) => o.officer_id === (active.officer_id || active.id));
      if (match) setSelectedOfficer(match);
    }
  }, []);

  const handleSelectOfficer = (officer: Officer) => {
    offlineStore.setActiveOfficer({
      officer_id: officer.officer_id,
      name: officer.name,
      designation: officer.designation,
      assigned_villages: officer.assigned_villages
    });
    router.push("/field");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 selection:bg-emerald-500/30">
      <div className="w-full max-w-md mx-auto space-y-6 pt-4 pb-12">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-950/50 mb-1">
            <Smartphone className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white">
            BHUMI Field Ops
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Mobile Cadastral Verification & Ground Issue Escalation Console
          </p>
        </div>

        {/* Instructions banner */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white block font-semibold mb-0.5">
              Select Field Officer Profile
            </strong>
            Assignments, geofenced boundaries, and offline sync queues are scoped to your assigned administrative unit.
          </div>
        </div>

        {/* Officer List Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Available Field Personnels</span>
            <span className="font-mono text-[10px] text-emerald-400">SIH26016 LIVE</span>
          </div>

          {officers.map((officer) => {
            const isCurrent = selectedOfficer?.officer_id === officer.officer_id;
            return (
              <button
                key={officer.officer_id}
                type="button"
                onClick={() => handleSelectOfficer(officer)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group ${
                  isCurrent
                    ? "bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/40"
                    : "bg-slate-800/90 border-slate-700/80 hover:border-emerald-500/40 hover:bg-slate-800"
                }`}
              >
                <div className="space-y-1.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                      {officer.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
                      {officer.officer_id}
                    </span>
                  </div>

                  <div className="text-xs text-emerald-400 font-medium truncate">
                    {officer.designation}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span>{officer.assigned_villages.join(", ")}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                    {officer.pending_tasks_count} Tasks
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-700/60 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Link back to Desktop */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <Monitor className="w-4 h-4" />
            <span>Switch to Desktop Decision Platform</span>
          </Link>
        </div>

      </div>

      <div className="text-center text-[10px] font-mono text-slate-500 py-3">
        BHUMI · PostGIS & NetworkX Causal Intelligence Engine
      </div>
    </div>
  );
}
