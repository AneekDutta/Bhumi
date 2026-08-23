import { runAllLedgerTests } from "./ledgerIntegrity.test";
import { runAllFinancialWorkflowTests } from "./financialWorkflows.test";
import { runOfflineSyncTests } from "./offlineSync.test";
import { runFinalPassTests } from "./finalPass.test";

async function main() {
  console.log("================================================================================");
  console.log("PS-18 SUITE 1: LEDGER CRYPTOGRAPHIC INTEGRITY & INVARIANT TESTS (PHASE 2)");
  console.log("================================================================================\n");

  const s1 = await runAllLedgerTests();
  for (const r of s1.results) {
    const icon = r.passed ? "✓ PASS" : "✕ FAIL";
    console.log(`[${icon}] ${r.name}`);
    console.log(`       ${r.message}\n`);
  }
  console.log(`Suite 1 Total: ${s1.passedCount}/${s1.totalCount} tests passed.\n`);

  console.log("================================================================================");
  console.log("PS-18 SUITE 2: CORE FINANCIAL WORKFLOWS & PERSISTENCE TESTS (PHASE 3)");
  console.log("================================================================================\n");

  const s2 = await runAllFinancialWorkflowTests();
  for (const r of s2.results) {
    const icon = r.passed ? "✓ PASS" : "✕ FAIL";
    console.log(`[${icon}] ${r.name}`);
    console.log(`       ${r.message}\n`);
  }
  console.log(`Suite 2 Total: ${s2.passedCount}/${s2.totalCount} tests passed.\n`);

  console.log("================================================================================");
  console.log("PS-18 SUITE 3: OFFLINE-FIRST LEDGER & SAFE SYNCHRONIZATION TESTS (PHASE 4)");
  console.log("================================================================================\n");

  const s3 = await runOfflineSyncTests();
  for (const r of s3.results) {
    const icon = r.passed ? "✓ PASS" : "✕ FAIL";
    console.log(`[${icon}] ${r.name}`);
    console.log(`       ${r.message}\n`);
  }
  console.log(`Suite 3 Total: ${s3.passedCount}/${s3.totalCount} tests passed.\n`);

  const s4 = await runFinalPassTests();

  const grandPassed = s1.passedCount + s2.passedCount + s3.passedCount + s4.passed;
  const grandTotal = s1.totalCount + s2.totalCount + s3.totalCount + s4.total;

  console.log("--------------------------------------------------------------------------------");
  console.log(`GRAND TOTAL: ${grandPassed}/${grandTotal} tests passed (${Math.round((grandPassed / grandTotal) * 100)}%)`);
  console.log("--------------------------------------------------------------------------------");

  if (grandPassed < grandTotal) {
    throw new Error("One or more tests failed.");
  }
}

if (typeof window === "undefined") {
  main().catch((err) => {
    console.error(err);
  });
}
