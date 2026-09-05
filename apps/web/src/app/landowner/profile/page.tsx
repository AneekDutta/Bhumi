"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  Layers, 
  Phone,
  Monitor,
  Smartphone
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getLandownerParcels } from "@/lib/api";

export default function LandownerProfilePage() {
  const router = useRouter();
  const [owner, setOwner] = useState<any>({
    owner_id: "O00004",
    name: "Geeta Meena",
    contact_village: "Chandwas (V03)",
    owner_type: "individual",
    mobile_number: "+91 98290 41234"
  });
  const [parcelsCount, setParcelsCount] = useState(3);

  useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("bhumi_officer_session="));
    if (sessionCookie) {
      try {
        const val = decodeURIComponent(sessionCookie.split("=")[1]);
        const parsed = JSON.parse(val);
        if (parsed?.owner_id) {
          setOwner(parsed);
          getLandownerParcels(parsed.owner_id).then((p) => setParcelsCount(p?.length || 3));
        }
      } catch {}
    }
  }, []);

  const handleSignOut = () => {
    document.cookie = "bhumi_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/landowner/login");
  };

  return (
    <LandownerShell title="Citizen Profile" showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Profile Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl flex-shrink-0">
              {owner.name.slice(0, 1)}
            </div>
            <div>
              <h1 className="font-bold text-white text-base font-display">
                {owner.name}
              </h1>
              <p className="text-xs text-emerald-400 font-medium">
                Verified Titleholder (Affected Person)
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {owner.owner_id} · {owner.contact_village}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Titleholder Type</span>
              <span className="font-semibold text-white capitalize">{owner.owner_type || "Individual"}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Corridor Parcels</span>
              <span className="font-semibold text-white font-mono">{parcelsCount} Registered</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
            <span>Statutory Clearance</span>
            <span className="text-emerald-400 font-mono font-semibold">RFCTLARR 2013 Verified</span>
          </div>
        </div>

        {/* Role Switching & Terminal Navigation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Platform Roles & Mode Switcher
          </h2>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                const sessionData = {
                  officer_id: "OFF-001",
                  name: "Ramesh Patel",
                  designation: "Patwari / Revenue Lekhpal",
                  assigned_villages: ["Ramganj Mandi", "Kanhera Kalan"],
                  role: "FIELD_OFFICER"
                };
                document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;
                window.location.href = "/field/dashboard";
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 font-medium text-xs transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Switch to Field Operations Console</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">→</span>
            </button>

            <button
              type="button"
              onClick={() => {
                document.cookie = "bhumi_officer_session=officer%40bhumi.gov.in; path=/; max-age=86400; SameSite=Lax";
                window.location.href = "/";
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 border border-slate-800 font-medium text-xs transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span>Switch to Desktop Admin Command Console</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">→</span>
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/60 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Citizen Portal</span>
          </button>
        </div>

      </div>
    </LandownerShell>
  );
}
