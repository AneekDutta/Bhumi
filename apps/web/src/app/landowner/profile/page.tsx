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
  Mail
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getLandownerParcels } from "@/lib/api";

export default function LandownerProfilePage() {
  const router = useRouter();
  const [owner, setOwner] = useState<any>(null);
  const [parcelsCount, setParcelsCount] = useState(0);

  useEffect(() => {
    async function fetchAuth() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();

      let activeId: string | null = null;
      let activeName = "Citizen Titleholder";
      let activeEmail = "";
      let activeVillage = "Corridor Sector";

      if (authData?.user) {
        activeId = authData.user.id;
        activeEmail = authData.user.email || "";
        activeName = authData.user.user_metadata?.full_name || activeName;
        activeVillage = authData.user.user_metadata?.village || activeVillage;

        setOwner({
          owner_id: activeId,
          email: activeEmail,
          name: activeName,
          contact_village: activeVillage
        });
      }

      if (!activeId) {
        router.push("/landowner/login");
        return;
      }

      getLandownerParcels(activeId).then((p) => setParcelsCount(p?.length || 0));
    }

    fetchAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    router.push("/landowner/login");
  };

  if (!owner) {
    return (
      <LandownerShell title="Citizen Profile" showBack>
        <div className="py-24 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <span>Loading citizen profile...</span>
        </div>
      </LandownerShell>
    );
  }

  return (
    <LandownerShell title="Citizen Profile" showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Profile Details Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl flex-shrink-0">
              {owner.name?.slice(0, 1) || "U"}
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base font-display">
                {owner.name}
              </h1>
              <p className="text-xs text-amber-400 font-medium">
                Registered Citizen Titleholder
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-[#e2e8f0] pt-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> Email
              </span>
              <span className="font-mono text-slate-900">{owner.email || "Not set"}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Village
              </span>
              <span className="text-slate-900">{owner.contact_village || owner.village || "Corridor Sector"}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Registered Parcels
              </span>
              <span className="font-mono text-amber-400 font-bold">{parcelsCount} Parcels</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#e2e8f0]">
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Citizen Portal</span>
            </button>
          </div>
        </div>

      </div>
    </LandownerShell>
  );
}
