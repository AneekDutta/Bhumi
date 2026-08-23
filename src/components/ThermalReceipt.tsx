import { useState } from "react";
import { Printer, CheckCircle2, QrCode, ShieldCheck } from "lucide-react";
import { PageShell, Button } from "./ui";
import { useData } from "../DataContext";

interface ThermalReceiptProps {
  member?: string;
  type?: string;
  amount?: number;
  txId?: string;
  balance?: number;
  date?: string;
}

export default function ThermalReceipt({
  member = "Sunita Devi",
  type = "CONTRIBUTION",
  amount = 500,
  txId = "#1047",
  balance = 14000,
  date = "22 AUG 2026",
}: ThermalReceiptProps) {
  const { transactions, stats } = useData();
  const [printed, setPrinted] = useState(false);

  const targetTx = transactions[0];
  const displayMember = targetTx?.member || member;
  const displayType = (targetTx?.type || type).toUpperCase();
  const displayAmount = Number(targetTx?.amount || amount);
  const displayTxId = targetTx?.id || txId;
  const displayHash = targetTx?.currentHash || targetTx?.hash || "8f9a2b7c4d1e...";

  const handlePrint = () => {
    setPrinted(true);
    if (typeof window !== "undefined") {
      window.print();
    }
    setTimeout(() => setPrinted(false), 2000);
  };

  return (
    <PageShell>
      <div className="max-w-sm mx-auto">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Thermal Receipt</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">Physical printer proof of ledger transaction</p>
          </div>
          <Button size="sm" onClick={handlePrint}>
            <Printer size={13} className="mr-1 inline" /> Print
          </Button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-[6px] p-5 font-mono text-xs text-gray-900 shadow-sm print:border-none print:shadow-none">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-300">
            <div className="text-sm font-bold tracking-wider">MAA DURGA SHG</div>
            <div className="text-[10px] text-gray-600">Varanasi, Uttar Pradesh</div>
            <div className="text-[10px] text-gray-600">Reg: NRLM-UP-VAR-2024-048</div>
            <div className="text-[10px] text-gray-500 mt-1">{date} &bull; 10:45 AM</div>
          </div>

          {/* Transaction Info */}
          <div className="py-3 border-b border-dashed border-gray-300 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-600">TXN ID:</span>
              <span className="font-bold">{displayTxId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MEMBER:</span>
              <span className="font-bold">{displayMember}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CATEGORY:</span>
              <span>{displayType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MODE:</span>
              <span>CASH / RECONCILED</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="py-3 border-b border-dashed border-gray-300 text-center">
            <div className="text-[10px] uppercase text-gray-500 font-bold">Amount Paid</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              ₹{displayAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Verified & Cleared</div>
          </div>

          {/* Cryptographic Seal */}
          <div className="pt-3 text-center space-y-1 text-[9px] text-gray-600">
            <div className="flex items-center justify-center gap-1 font-bold text-gray-800">
              <ShieldCheck size={11} className="text-green-700" />
              <span>SHA-256 LEDGER HASH</span>
            </div>
            <div className="font-mono text-[8px] break-all bg-gray-50 p-1 rounded border border-gray-200">
              {displayHash}
            </div>
            <div className="text-gray-400 mt-2">
              *** TAMPER-EVIDENT RECEIPT ***
            </div>
          </div>
        </div>

        {printed && (
          <div className="mt-3 bg-green-50 text-green-800 text-xs p-2.5 rounded text-center font-medium border border-green-200">
            ✓ Sent to connected printer dialog
          </div>
        )}
      </div>
    </PageShell>
  );
}
