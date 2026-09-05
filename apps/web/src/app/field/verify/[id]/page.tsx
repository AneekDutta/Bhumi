"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyVerifyRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/field/parcels/${id}/verify`);
    } else {
      router.replace("/field/parcels");
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-100">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono text-slate-400">Redirecting to Parcel Verification...</span>
    </div>
  );
}
