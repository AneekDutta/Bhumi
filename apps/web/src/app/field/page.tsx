"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FieldRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/field/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] flex flex-col items-center justify-center gap-3 text-[#14213D] dark:text-[#F0F4FF]">
      <div className="w-8 h-8 border-2 border-[#0B2E59] dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono text-[#5A6A80] dark:text-slate-400">Loading BHUMI Field Console...</span>
    </div>
  );
}
