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
        activeName = authData.user.user_metadata?.full_name || activeEmail.split("@")[0] || activeName;
        activeVillage = authData.user.user_metadata?.village || activeVillage;

        setOwner({
          owner_id: activeId,
          email: activeEmail,
          name: activeName,
          contact_village: activeVillage
        });
      } else {
        // Fallback: Check bhumi_landowner_session cookie
        const match = typeof document !== "undefined" ? document.cookie.match(/bhumi_landowner_session=([^;]+)/) : null;
        if (match) {
          try {
            const parsed = JSON.parse(decodeURIComponent(match[1]));
            if (parsed.user_id || parsed.owner_id) {
              activeId = parsed.user_id || parsed.owner_id;
              activeEmail = parsed.email || "";
              activeName = parsed.name || activeEmail.split("@")[0] || activeName;
              activeVillage = parsed.village || parsed.contact_village || activeVillage;
              setOwner({
                owner_id: activeId,
                email: activeEmail,
                name: activeName,
                contact_village: activeVillage
              });
            }
          } catch {}
        }
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
    // Clear session cookies cleanly
    document.cookie = "bhumi_landowner_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/landowner/login");
  };

  if (!owner) {
    return (
      <LandownerShell title="Citizen Profile" showBack>
        <div className="py-24 text-center text-xs text-[#5A6A80] dark:text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B2E59] dark:text-amber-400" />
          <span>Loading citizen profile...</span>
        </div>
      </LandownerShell>
    );
  }

  return (
    <LandownerShell title="Citizen Profile" showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Profile Details Card */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-[4px] bg-[#0B2E59] text-white flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-xs">
              {owner.name?.slice(0, 1) || "U"}
            </div>
            <div>
              <h1 className="font-bold text-[#14213D] dark:text-white text-base font-display">
                {owner.name}
              </h1>
              <p className="text-xs text-[#0B2E59] dark:text-sky-400 font-semibold">
                Registered Citizen Titleholder
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-[#DCE2E8] dark:border-white/10 pt-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-[#5A6A80] dark:text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#5A6A80]" /> Email
              </span>
              <span className="font-mono text-[#14213D] dark:text-white font-medium">{owner.email || "Not set"}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#5A6A80] dark:text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#5A6A80]" /> Village
              </span>
              <span className="text-[#14213D] dark:text-slate-200">{owner.contact_village || owner.village || "Corridor Sector"}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#5A6A80] dark:text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#5A6A80]" /> Registered Parcels
              </span>
              <span className="font-mono text-[#0B2E59] dark:text-sky-400 font-bold">{parcelsCount} Parcels</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10">
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-[4px] bg-[#FFEBEE] dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 border border-[#FFCDD2] dark:border-red-800/30 text-[#B32424] dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
