/**
 * Comprehensive Unit Tests for Canonical RFCTLARR Compensation Calculator
 * SIH26016 / BHUMI Decision-Support Platform
 */
import {
  calculateStatutoryAward,
  determineRuralMultiplier,
  roundCurrency,
  RFCTLARR_MULTIPLIER_SLABS,
  URBAN_MULTIPLIER,
  MANDATORY_SOLATIUM_PERCENTAGE,
  ANNUAL_ADDITIONAL_RATE,
} from '../rfctlarrCalculator';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`TEST ASSERTION FAILED: ${msg}`);
  }
}

function assertApprox(val1: number, val2: number, epsilon = 0.05, msg = '') {
  if (Math.abs(val1 - val2) > epsilon) {
    throw new Error(`ASSERT APPROX FAILED: expected ${val2} +/- ${epsilon}, got ${val1}. ${msg}`);
  }
}

export function runRfctlarrCalculatorTests() {
  console.log('--- Starting RFCTLARR Calculator Tests ---');

  // Test 1: Baseline Award (Urban, Multiplier 1.0, No Assets, No Elapsed Time)
  {
    const res = calculateStatutoryAward({
      areaSqm: 1000,
      circleRatePerSqm: 1200,
      locationType: 'URBAN',
    });
    assert(res.marketValueBase === 1200000, 'Base market value should be 1,000 * 1,200 = 1,200,000');
    assert(res.multiplierFactor === 1.0, 'Urban multiplier must be exactly 1.00x');
    assert(res.marketValueAdjusted === 1200000, 'Adjusted market value must be 1,200,000');
    assert(res.subtotalBeforeSolatium === 1200000, 'Subtotal before solatium must be 1,200,000');
    assert(res.solatiumAmount === 1200000, '100% Solatium must equal subtotal (1,200,000)');
    assert(res.additionalStatutoryAmount12Pct === 0, 'No elapsed time implies 0 additional amount');
    assert(res.totalCompensation === 2400000, 'Total award must be 2,400,000 (2x subtotal)');
    assert(res.calculationSteps.length === 6, 'Trace must have all 6 statutory steps');
    console.log('✓ Test 1 Passed: Urban baseline award');
  }

  // Test 2: Distance Multiplier Slabs
  {
    assert(determineRuralMultiplier(5, 'RURAL') === 1.20, '0-10km distance must yield 1.20x multiplier');
    assert(determineRuralMultiplier(15, 'RURAL') === 1.50, '10-20km distance must yield 1.50x multiplier');
    assert(determineRuralMultiplier(25, 'RURAL') === 1.75, '20-30km distance must yield 1.75x multiplier');
    assert(determineRuralMultiplier(35, 'RURAL') === 2.00, '>30km distance must yield 2.00x multiplier');
    assert(determineRuralMultiplier(15, 'URBAN') === 1.00, 'Urban location must override distance to 1.00x');
    console.log('✓ Test 2 Passed: Rural distance multiplier slabs');
  }

  // Test 3: Attached Assets and Severance Damages (Sections 27, 28, 29)
  {
    const res = calculateStatutoryAward({
      areaSqm: 2000,
      circleRatePerSqm: 1000,
      multiplierFactor: 1.5,
      assetsValue: 200000,       // Structures/wells
      treesCropsValue: 50000,    // Trees/crops
      severanceDamage: 30000,    // Severance
      otherDamages: 20000,       // Other damages
    });
    // Base: 2,000 * 1,000 = 2,000,000
    // Adjusted: 2,000,000 * 1.5 = 3,000,000
    // Assets: 200,000 + 50,000 = 250,000
    // Damages: 30,000 + 20,000 = 50,000
    // Subtotal: 3,000,000 + 250,000 + 50,000 = 3,300,000
    // Solatium 100%: 3,300,000
    // Total: 3,300,000 + 3,300,000 = 6,600,000
    assert(res.marketValueBase === 2000000, 'Base market value must be 2,000,000');
    assert(res.marketValueAdjusted === 3000000, 'Adjusted land value must be 3,000,000');
    assert(res.attachedAssetsTotal === 250000, 'Attached assets must total 250,000');
    assert(res.damagesTotal === 50000, 'Damages must total 50,000');
    assert(res.subtotalBeforeSolatium === 3300000, 'Subtotal before solatium must be 3,300,000');
    assert(res.solatiumAmount === 3300000, 'Solatium must be 100% of subtotal (3,300,000)');
    assert(res.totalCompensation === 6600000, 'Total compensation must be 6,600,000');
    console.log('✓ Test 3 Passed: Attached assets & severance damages');
  }

  // Test 4: Section 30(3) 12% Per Annum Additional Statutory Component
  {
    // 12% per annum on BASE market value (not adjusted market value!)
    const res = calculateStatutoryAward({
      areaSqm: 1000,
      circleRatePerSqm: 1000, // Base = 1,000,000
      multiplierFactor: 1.5,  // Adjusted = 1,500,000
      interestYears: 2,       // 2 years elapsed
    });
    // 12% of 1,000,000 per year * 2 years = 240,000
    assert(res.marketValueBase === 1000000, 'Base market value must be 1,000,000');
    assert(res.marketValueAdjusted === 1500000, 'Adjusted market value must be 1,500,000');
    assertApprox(res.additionalStatutoryAmount12Pct, 240000, 1.0, '12% amount for 2 years on 1M base');
    assert(res.subtotalBeforeSolatium === 1500000, 'Subtotal is 1,500,000');
    assert(res.solatiumAmount === 1500000, 'Solatium is 1,500,000');
    // Total = 1,500,000 + 1,500,000 + 240,000 = 3,240,000
    assertApprox(res.totalCompensation, 3240000, 1.0, 'Total compensation package with 12% component');
    console.log('✓ Test 4 Passed: 12% additional statutory amount on base market value');
  }

  // Test 5: Section 11 Notification Date to Award Date Elapsed Calculation
  {
    const res = calculateStatutoryAward({
      areaSqm: 2400,
      circleRatePerSqm: 850,
      locationType: 'RURAL',
      distanceFromUrbanKm: 15, // Multiplier 1.50
      notificationDate: '2025-01-01',
      awardDate: '2026-01-01', // ~365 days
      assetsValue: 120000,
    });
    // Base: 2,400 * 850 = 2,040,000
    // Mult: 1.5 -> Adjusted = 3,060,000
    // Assets: 120,000 -> Subtotal = 3,180,000
    // Solatium: 3,180,000
    // 12% on 2,040,000 for 1 year = ~244,800
    assert(res.marketValueBase === 2040000, 'Base market value must be 2,040,000');
    assert(res.multiplierFactor === 1.5, 'Multiplier must be 1.50');
    assert(res.marketValueAdjusted === 3060000, 'Adjusted market value must be 3,060,000');
    assert(res.subtotalBeforeSolatium === 3180000, 'Subtotal before solatium must be 3,180,000');
    assert(res.solatiumAmount === 3180000, 'Solatium must be 3,180,000');
    assertApprox(res.additionalStatutoryAmount12Pct, 244800, 500, '12% amount for 1 year');
    assertApprox(res.totalCompensation, 6604800, 500, 'Total award package');
    console.log('✓ Test 5 Passed: Section 11 date difference calculation');
  }

  // Test 6: Zero & Null Edge Cases
  {
    const zeroRes = calculateStatutoryAward({
      areaSqm: 0,
      circleRatePerSqm: 0,
    });
    assert(zeroRes.marketValueBase === 0, 'Zero area and rate must yield 0 base');
    assert(zeroRes.totalCompensation === 0, 'Zero inputs must yield 0 total compensation');

    const negRes = calculateStatutoryAward({
      areaSqm: -50,
      circleRatePerSqm: -100,
    });
    assert(negRes.marketValueBase === 0, 'Negative inputs must be clamped to 0');
    assert(negRes.totalCompensation === 0, 'Negative inputs must yield 0 total compensation');
    console.log('✓ Test 6 Passed: Zero and negative edge cases handled cleanly');
  }

  // Test 7: Canonical P00001 Benchmark Values
  {
    // Canonical P00001: 2,500 sqm (0.25 ha), circle rate 2,800/sqm, rural multiplier 1.5, assets 350,000
    const res = calculateStatutoryAward({
      parcelId: 'P00001',
      areaSqm: 2500,
      circleRatePerSqm: 2800,
      multiplierFactor: 1.5,
      assetsValue: 350000,
      interestMonths: 6, // 0.5 year
    });
    // Base: 2,500 * 2,800 = 7,000,000
    // Adjusted: 7,000,000 * 1.5 = 10,500,000
    // Assets: 350,000 -> Subtotal = 10,850,000
    // Solatium: 10,850,000
    // 12% on 7,000,000 for 0.5y = 7,000,000 * 0.12 * 0.5 = 420,000
    // Total: 10,850,000 + 10,850,000 + 420,000 = 22,120,000
    assert(res.marketValueBase === 7000000, 'P00001 base market value must be 7,000,000');
    assert(res.marketValueAdjusted === 10500000, 'P00001 adjusted land value must be 10,500,000');
    assert(res.subtotalBeforeSolatium === 10850000, 'P00001 subtotal must be 10,850,000');
    assert(res.solatiumAmount === 10850000, 'P00001 solatium must be 10,850,000');
    assertApprox(res.additionalStatutoryAmount12Pct, 420000, 10, 'P00001 12% component for 6 months');
    assertApprox(res.totalCompensation, 22120000, 10, 'P00001 total statutory award');
    console.log('✓ Test 7 Passed: Canonical P00001 benchmark values verified');
  }

  console.log('=== All 7 RFCTLARR Calculator Tests Passed Successfully ===');
}

// Run directly if executed in Node
if (typeof require !== 'undefined' && require.main === module) {
  runRfctlarrCalculatorTests();
}
