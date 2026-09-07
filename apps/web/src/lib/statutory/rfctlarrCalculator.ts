/**
 * RFCTLARR Act 2013 Canonical Statutory Compensation Calculator
 * SIH26016 / KOSH Decision-Support Platform
 *
 * Implements Section 26 to Section 30 statutory compensation formulas matching
 * backend/app/services/valuation_engine.py:
 * - Section 26(1): Determination of Market Value (higher of circle rate and registered sale deeds)
 * - Section 26(2) & First Schedule: Multiplier factor for rural areas (1.00x - 2.00x based on distance)
 * - Sections 27, 28 & 29: Valuation of attached assets (structures, trees, crops) and severance damage
 * - Section 30(1): Mandatory Solatium (100% on total market value + attached assets + damages)
 * - Section 30(3): 12% per annum Additional Statutory Amount on base market value
 *   (strictly NOT mislabeled as penal interest, which is governed separately by Section 80)
 *
 * Pure, deterministic utility with explicit rounding and explainability traces.
 */

export interface RfctlarrCalculationParams {
  areaSqm: number;
  circleRatePerSqm: number;
  marketRatePerSqm?: number;
  locationType?: 'RURAL' | 'URBAN';
  distanceFromUrbanKm?: number;
  multiplierFactor?: number;
  assetsValue?: number;
  treesCropsValue?: number;
  severanceDamage?: number;
  otherDamages?: number;
  solatiumPercentage?: number; // Defaults to 100% under Section 30(1)
  notificationDate?: string | Date | null;
  awardDate?: string | Date | null;
  interestMonths?: number;
  interestYears?: number;
  parcelId?: string;
  surveyNo?: string;
}

export interface RfctlarrCalculationStep {
  stepNumber: number;
  title: string;
  statutoryCitation: string;
  formula: string;
  inputs: Record<string, number | string | null>;
  result: number;
  explanation: string;
}

export interface RfctlarrAwardResult {
  parcelId?: string;
  areaSqm: number;
  chosenRatePerSqm: number;
  marketValueBase: number;
  multiplierFactor: number;
  marketValueAdjusted: number;
  attachedAssetsTotal: number;
  damagesTotal: number;
  subtotalBeforeSolatium: number;
  solatiumPercentage: number;
  solatiumAmount: number;
  additionalStatutoryAmount12Pct: number;
  totalCompensation: number;
  calculationSteps: RfctlarrCalculationStep[];
  disclaimer: string;
}

export const RFCTLARR_MULTIPLIER_SLABS: Array<{ minKm: number; maxKm: number; multiplier: number }> = [
  { minKm: 0.0, maxKm: 10.0, multiplier: 1.20 },
  { minKm: 10.0, maxKm: 20.0, multiplier: 1.50 },
  { minKm: 20.0, maxKm: 30.0, multiplier: 1.75 },
  { minKm: 30.0, maxKm: Infinity, multiplier: 2.00 },
];

export const URBAN_MULTIPLIER = 1.00;
export const MANDATORY_SOLATIUM_PERCENTAGE = 100.00;
export const ANNUAL_ADDITIONAL_RATE = 0.12; // Section 30(3) 12% per annum
export const DAYS_IN_YEAR = 365.25;

export const STATUTORY_DISCLAIMER =
  "Statutory valuation computed pursuant to the First Schedule of the RFCTLARR Act, 2013 " +
  "(Sections 26 to 30). For institutional decision support only; final award remains subject " +
  "to Competent Authority (CALA) determination under Section 23/37.";

/**
 * Derives the statutory multiplier factor based on location type and distance.
 */
export function determineRuralMultiplier(distanceKm?: number, locationType?: 'RURAL' | 'URBAN'): number {
  if (locationType === 'URBAN') {
    return URBAN_MULTIPLIER;
  }
  if (distanceKm === undefined || distanceKm === null || distanceKm <= 0) {
    return 1.50; // Standard default rural multiplier if distance unrecorded
  }
  for (const slab of RFCTLARR_MULTIPLIER_SLABS) {
    if (distanceKm > slab.minKm && distanceKm <= slab.maxKm) {
      return slab.multiplier;
    }
  }
  return 2.00;
}

/**
 * Deterministically rounds currency amounts to 2 decimal places (or integer where specified).
 */
export function roundCurrency(amount: number): number {
  if (!isFinite(amount) || isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates canonical statutory compensation package under RFCTLARR Act 2013 (Sections 26-30).
 */
export function calculateStatutoryAward(params: RfctlarrCalculationParams): RfctlarrAwardResult {
  const areaSqm = Math.max(0, Number(params.areaSqm) || 0);
  const circleRate = Math.max(0, Number(params.circleRatePerSqm) || 0);
  const marketSaleRate = Math.max(0, Number(params.marketRatePerSqm) || 0);

  // 1. Determination of Base Market Value (Section 26(1))
  // Higher of minimum land value (circle rate) or average registered sale deeds
  const chosenRate = Math.max(circleRate, marketSaleRate);
  const marketValueBase = roundCurrency(areaSqm * chosenRate);

  // 2. Rural Distance Multiplier Factor (Section 26(2) & First Schedule)
  let multiplier = 1.0;
  let multReason = "Urban location standard factor of 1.00x.";

  if (params.multiplierFactor !== undefined && params.multiplierFactor !== null) {
    multiplier = Math.max(1.0, Math.min(2.0, Number(params.multiplierFactor)));
    multReason = `Explicitly configured multiplier factor of ${multiplier.toFixed(2)}x.`;
  } else if (params.locationType === 'URBAN') {
    multiplier = URBAN_MULTIPLIER;
    multReason = "Urban municipal limits multiplier of 1.00x.";
  } else {
    const dist = params.distanceFromUrbanKm !== undefined ? Number(params.distanceFromUrbanKm) : 15.0;
    multiplier = determineRuralMultiplier(dist, params.locationType || 'RURAL');
    multReason = `Statutory rural factor of ${multiplier.toFixed(2)}x based on ${dist.toFixed(1)} km distance from urban boundary.`;
  }

  const marketValueAdjusted = roundCurrency(marketValueBase * multiplier);

  // 3. Attached Assets & Severance Damages (Sections 27, 28, 29)
  const structuresVal = Math.max(0, Number(params.assetsValue) || 0);
  const treesCropsVal = Math.max(0, Number(params.treesCropsValue) || 0);
  const attachedAssetsTotal = roundCurrency(structuresVal + treesCropsVal);

  const severanceVal = Math.max(0, Number(params.severanceDamage) || 0);
  const otherDamagesVal = Math.max(0, Number(params.otherDamages) || 0);
  const damagesTotal = roundCurrency(severanceVal + otherDamagesVal);

  const subtotalBeforeSolatium = roundCurrency(marketValueAdjusted + attachedAssetsTotal + damagesTotal);

  // 4. Mandatory Solatium (Section 30(1))
  // 100% on total market value + attached assets + damages
  const solatiumPct = params.solatiumPercentage !== undefined ? Number(params.solatiumPercentage) : MANDATORY_SOLATIUM_PERCENTAGE;
  const solatiumAmount = roundCurrency(subtotalBeforeSolatium * (solatiumPct / 100.0));

  // 5. Additional 12% Statutory Amount (Section 30(3))
  // 12% per annum on base market value from Section 11 notice to award/possession
  let elapsedDays = 0;
  let yearFraction = 0;
  if (params.notificationDate) {
    const notif = new Date(params.notificationDate).getTime();
    const award = params.awardDate ? new Date(params.awardDate).getTime() : Date.now();
    if (!isNaN(notif) && !isNaN(award)) {
      elapsedDays = Math.max(0, Math.floor((award - notif) / (1000 * 60 * 60 * 24)));
      yearFraction = elapsedDays / DAYS_IN_YEAR;
    }
  } else if (params.interestMonths !== undefined && params.interestMonths !== null) {
    const m = Math.max(0, Number(params.interestMonths));
    yearFraction = m / 12.0;
    elapsedDays = Math.round(yearFraction * DAYS_IN_YEAR);
  } else if (params.interestYears !== undefined && params.interestYears !== null) {
    const y = Math.max(0, Number(params.interestYears));
    yearFraction = y;
    elapsedDays = Math.round(y * DAYS_IN_YEAR);
  }

  let additional12Pct = 0;
  if (yearFraction > 0 && marketValueBase > 0) {
    additional12Pct = roundCurrency(marketValueBase * ANNUAL_ADDITIONAL_RATE * yearFraction);
  }

  // 6. Total Statutory Compensation Package (Sections 26-30)
  const totalCompensation = roundCurrency(subtotalBeforeSolatium + solatiumAmount + additional12Pct);

  // Traceable calculation steps
  const steps: RfctlarrCalculationStep[] = [
    {
      stepNumber: 1,
      title: "Determination of Base Market Value of Land",
      statutoryCitation: "RFCTLARR Act 2013 Section 26(1)",
      formula: "area_sqm * max(circle_rate_per_sqm, average_sale_rate_per_sqm)",
      inputs: {
        area_sqm: areaSqm,
        circle_rate_per_sqm: circleRate,
        market_sale_rate_per_sqm: marketSaleRate,
        chosen_rate_per_sqm: chosenRate,
      },
      result: marketValueBase,
      explanation: `Statutory base rate determined as ₹${chosenRate.toLocaleString('en-IN')}/sqm across ${areaSqm.toLocaleString('en-IN')} sqm, yielding base land value of ₹${marketValueBase.toLocaleString('en-IN')}.`,
    },
    {
      stepNumber: 2,
      title: "Application of Rural Distance Multiplier Factor",
      statutoryCitation: "RFCTLARR Act 2013 Section 26(2) & First Schedule",
      formula: "market_value_base * multiplier_factor",
      inputs: {
        multiplier_factor: multiplier,
      },
      result: marketValueAdjusted,
      explanation: `Applied multiplier factor of ${multiplier.toFixed(2)}x (${multReason}), resulting in adjusted land market value of ₹${marketValueAdjusted.toLocaleString('en-IN')}.`,
    },
    {
      stepNumber: 3,
      title: "Valuation of Attached Assets and Severance Damages",
      statutoryCitation: "RFCTLARR Act 2013 Sections 27, 28 & 29",
      formula: "market_value_adjusted + (structures_value + trees_crops_value) + (severance_damage + other_damages)",
      inputs: {
        structures_value: structuresVal,
        trees_crops_value: treesCropsVal,
        total_attached_assets: attachedAssetsTotal,
        severance_damage: severanceVal,
        other_damages: otherDamagesVal,
        total_damages: damagesTotal,
      },
      result: subtotalBeforeSolatium,
      explanation: `Added attached assets ₹${attachedAssetsTotal.toLocaleString('en-IN')} and damages ₹${damagesTotal.toLocaleString('en-IN')}, yielding pre-solatium subtotal of ₹${subtotalBeforeSolatium.toLocaleString('en-IN')}.`,
    },
    {
      stepNumber: 4,
      title: "Mandatory Solatium Award (100%)",
      statutoryCitation: "RFCTLARR Act 2013 Section 30(1)",
      formula: `${solatiumPct}% * subtotal_before_solatium`,
      inputs: {
        solatium_percentage: solatiumPct,
        subtotal_before_solatium: subtotalBeforeSolatium,
      },
      result: solatiumAmount,
      explanation: `Awarded statutory ${solatiumPct}% solatium (₹${solatiumAmount.toLocaleString('en-IN')}) on aggregate adjusted land value and attached assets.`,
    },
    {
      stepNumber: 5,
      title: "12% Per Annum Additional Statutory Component",
      statutoryCitation: "RFCTLARR Act 2013 Section 30(3)",
      formula: "market_value_base * 12% * (elapsed_days / 365.25)",
      inputs: {
        elapsed_days: elapsedDays,
        annual_rate_pct: 12,
        market_value_base: marketValueBase,
      },
      result: additional12Pct,
      explanation: elapsedDays > 0
        ? `12.0% per annum statutory addition on base market value (₹${marketValueBase.toLocaleString('en-IN')}) for ${elapsedDays} days: ₹${additional12Pct.toLocaleString('en-IN')} (Section 30(3) statutory component, distinct from Section 80 penal interest).`
        : "Notification timeline not recorded; Section 30(3) additional statutory amount computed as ₹0.00.",
    },
    {
      stepNumber: 6,
      title: "Total Statutory Compensation Package",
      statutoryCitation: "RFCTLARR Act 2013 Sections 26-30",
      formula: "subtotal_before_solatium + solatium_amount + additional_12pct_amount",
      inputs: {
        subtotal_before_solatium: subtotalBeforeSolatium,
        solatium_amount: solatiumAmount,
        additional_12pct_amount: additional12Pct,
      },
      result: totalCompensation,
      explanation: `Total statutory award determined at ₹${totalCompensation.toLocaleString('en-IN')}.`,
    },
  ];

  return {
    parcelId: params.parcelId,
    areaSqm,
    chosenRatePerSqm: chosenRate,
    marketValueBase,
    multiplierFactor: multiplier,
    marketValueAdjusted,
    attachedAssetsTotal,
    damagesTotal,
    subtotalBeforeSolatium,
    solatiumPercentage: solatiumPct,
    solatiumAmount,
    additionalStatutoryAmount12Pct: additional12Pct,
    totalCompensation,
    calculationSteps: steps,
    disclaimer: STATUTORY_DISCLAIMER,
  };
}
