"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FieldRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/field/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-100">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono text-slate-400">Loading BHUMI Field Console...</span>
    </div>
  );
}
