"use client";

import React, { useState } from "react";
import { PublicShell } from "@/components/layout/PublicShell";
import { useI18n } from "@/lib/i18n/I18nContext";
import { Calculator, Info, ShieldCheck, FileCheck, HelpCircle } from "lucide-react";

export default function CompensationCalculatorPage() {
  const { t } = useI18n();

  // Calculation parameters
  const [calcAreaSqm, setCalcAreaSqm] = useState(2400);
  const [calcCircleRate, setCalcCircleRate] = useState(850);
  const [calcLocationType, setCalcLocationType] = useState<"RURAL" | "URBAN">("RURAL");
  const [calcRuralMultiplier, setCalcRuralMultiplier] = useState(1.5);
  const [calcInterestMonths, setCalcInterestMonths] = useState(8);
  const [calcAssetsValue, setCalcAssetsValue] = useState(120000);

  // Mathematics
  const calcBaseMarketValue = calcAreaSqm * calcCircleRate;
  const calcEffectiveMultiplier = calcLocationType === "RURAL" ? calcRuralMultiplier : 1.0;
  const calcMultipliedValue = calcBaseMarketValue * calcEffectiveMultiplier;
  const calcTotalLandWithAssets = calcMultipliedValue + calcAssetsValue;
  const calcSolatium = calcTotalLandWithAssets * 1.0; // 100% Solatium
  const calcAdditionalInterest = calcBaseMarketValue * 0.12 * (calcInterestMonths / 12);
  const calcTotalCompensation = calcTotalLandWithAssets + calcSolatium + calcAdditionalInterest;

  return (
    <PublicShell>
      <div className="max-w-[1440px] mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-none bg-[#1E7E34] text-white uppercase">
              FIRST SCHEDULE &bull; RFCTLARR ACT 2013 &bull; SEC 3G NH ACT 1956
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] dark:text-white leading-tight">
            Statutory Compensation Estimator / मुआवजा आगणक
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
            Transparent calculation model pursuant to the First Schedule of the RFCTLARR Act, 2013 and Section 3G of the National Highways Act, 1956.
          </p>
        </div>

        {/* 2-Column Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Input Controls Form */}
          <div className="lg:col-span-6 bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-5 rounded-none space-y-4 shadow-none">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#1E7E34]" />
                <span>Parcel &amp; Location Parameters</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Form CALA-EST-01</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                  Land Area in Square Metres (Sqm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={calcAreaSqm}
                  onChange={(e) => setCalcAreaSqm(Number(e.target.value) || 0)}
                  className="w-full font-mono bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white p-2 rounded-none focus:outline-none focus:border-[#0B5FA5]"
                />
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">
                  Approx. {(calcAreaSqm / 10000).toFixed(3)} Hectares ({(calcAreaSqm * 0.000247105).toFixed(2)} Acres)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                  Circle Rate / DLC Rate (₹ / Sqm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={calcCircleRate}
                  onChange={(e) => setCalcCircleRate(Number(e.target.value) || 0)}
                  className="w-full font-mono bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white p-2 rounded-none focus:outline-none focus:border-[#0B5FA5]"
                />
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">
                  As recorded in Sub-Registrar Gazette
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                  Location Classification
                </label>
                <select
                  value={calcLocationType}
                  onChange={(e) => setCalcLocationType(e.target.value as any)}
                  className="w-full bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white p-2 rounded-none focus:outline-none focus:border-[#0B5FA5]"
                >
                  <option value="RURAL">Rural Area (Multiplier 1.5x - 2.0x applies)</option>
                  <option value="URBAN">Urban Area (Multiplier 1.0x applies)</option>
                </select>
              </div>

              {calcLocationType === "RURAL" && (
                <div>
                  <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                    Rural Multiplier Factor (RFCTLARR Sec 26)
                  </label>
                  <select
                    value={calcRuralMultiplier}
                    onChange={(e) => setCalcRuralMultiplier(Number(e.target.value))}
                    className="w-full font-mono bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white p-2 rounded-none focus:outline-none focus:border-[#0B5FA5]"
                  >
                    <option value={1.5}>1.5x (Radial distance 0 to 10 km from urban limits)</option>
                    <option value={1.75}>1.75x (Radial distance 10 to 20 km from urban limits)</option>
                    <option value={2.0}>2.0x (Radial distance &gt; 20 km into rural territory)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                  Structural &amp; Tree Valuation (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={calcAssetsValue}
                  onChange={(e) => setCalcAssetsValue(Number(e.target.value) || 0)}
                  className="w-full font-mono bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white p-2 rounded-none focus:outline-none focus:border-[#0B5FA5]"
                />
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">
                  Assessed value of wells, trees, boundary walls
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                  Interest Duration (Months from Sec 3A to Award)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={calcInterestMonths}
                  onChange={(e) => setCalcInterestMonths(Number(e.target.value) || 0)}
                  className="w-full font-mono bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white p-2 rounded-none focus:outline-none focus:border-[#0B5FA5]"
                />
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">
                  12% per annum under Section 30(3) of RFCTLARR Act
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-white/5 border-l-2 border-[#0B5FA5] text-[11px] text-[#555555] dark:text-slate-400">
              <strong className="text-[#14213D] dark:text-slate-200">Legal Mandate Note:</strong> Under RFCTLARR First Schedule, the statutory solatium is an unconditional 100% addition over the total market value of the land and all assets attached thereto.
            </div>

          </div>

          {/* Statutory Breakdown Result Ledger */}
          <div className="lg:col-span-6 bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-5 rounded-none space-y-4 shadow-none flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 border-b border-[#DCE2E8] dark:border-white/10 pb-2 flex items-center justify-between">
                <span>Statutory Award Breakdown</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">FIRST SCHEDULE LEDGER</span>
              </h2>

              <div className="space-y-2 text-xs">
                
                {/* Line 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-none bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-[#14213D] dark:text-white">1. Basic Market Value (Section 26(1))</span>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                      {calcAreaSqm.toLocaleString()} sqm × ₹ {calcCircleRate.toLocaleString()}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#14213D] dark:text-white">
                    ₹ {calcBaseMarketValue.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Line 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-none bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-[#14213D] dark:text-white">2. Multiplied Land Value (Factor: {calcEffectiveMultiplier}x)</span>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                      Pursuant to Section 26(2) of RFCTLARR Act 2013
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#14213D] dark:text-white">
                    ₹ {calcMultipliedValue.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Line 3 */}
                <div className="flex items-center justify-between p-2.5 rounded-none bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-[#14213D] dark:text-white">3. Immovable Assets / Trees / Crops (Section 29)</span>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                      Valuation of horticulture, timber, structures &amp; wells
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#14213D] dark:text-white">
                    ₹ {calcAssetsValue.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Line 4 */}
                <div className="flex items-center justify-between p-2.5 rounded-none bg-emerald-50/70 dark:bg-emerald-950/30 border-b-2 border-emerald-500">
                  <div>
                    <span className="font-bold text-[#1E7E34] dark:text-emerald-300">4. 100% Mandatory Solatium (Section 30(1))</span>
                    <div className="text-[10px] text-[#1E7E34] dark:text-emerald-400">
                      Statutory allowance equivalent to 100% of (Land + Assets)
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#1E7E34] dark:text-emerald-300">
                    + ₹ {calcSolatium.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Line 5 */}
                <div className="flex items-center justify-between p-2.5 rounded-none bg-blue-50/70 dark:bg-blue-950/30 border-b-2 border-blue-500">
                  <div>
                    <span className="font-bold text-[#0B5FA5] dark:text-sky-300">5. 12% Additional Interest ({calcInterestMonths} Months)</span>
                    <div className="text-[10px] text-[#0B5FA5] dark:text-sky-400">
                      Section 30(3) Interest from Notification Date to Award
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#0B5FA5] dark:text-sky-300">
                    + ₹ {calcAdditionalInterest.toLocaleString("en-IN")}
                  </span>
                </div>

              </div>

              {/* Grand Total Callout */}
              <div className="p-4 bg-[#0B2E59] text-white rounded-none flex items-center justify-between border-t-2 border-amber-400 mt-4">
                <div>
                  <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest block">
                    TOTAL ESTIMATED STATUTORY COMPENSATION
                  </span>
                  <span className="text-xs text-slate-200">
                    Payable directly into Khatedar Aadhaar-linked Bank Account via PFMS
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white">
                  ₹ {calcTotalCompensation.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#64748B] dark:text-slate-400 leading-tight italic pt-3 border-t border-slate-200 dark:border-slate-800">
              * Statutory Disclaimer: This calculation is indicative for citizen advisory and grievance preparation. The final statutory compensation award is determined by the Competent Authority for Land Acquisition (CALA) under Section 3G of the National Highways Act, 1956 following ground verification and public hearing of claims.
            </p>
          </div>

        </div>

      </div>
    </PublicShell>
  );
}
