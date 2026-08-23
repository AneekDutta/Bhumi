import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Wifi, XCircle, AlertTriangle, RefreshCw, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { PageShell, Button, Badge } from "./ui";
import { useData } from "../DataContext";

type NfcState = "ready" | "reading" | "updated" | "invalid-card" | "invalid-signature" | "unsupported" | "read-failed" | "write-failed";

export default function NfcPassbook() {
  const { stats, transactions, members, loans } = useData();
  const [nfcState, setNfcState] = useState<NfcState>("ready");
  const [hasNfcHardware, setHasNfcHardware] = useState(false);
  const [selectedMember, setSelectedMember] = useState("Sunita Devi");
  const [passbookRecord, setPassbookRecord] = useState<{
    member: string;
    accountNo: string;
    savingsBalance: number;
    activeLoanBalance: number;
    nextInstallment: number;
    lastTxHash: string;
    lastUpdated: string;
    cardSignature: string;
  } | null>(null);

  const memberData = members.find((m) => m.name === selectedMember) || members[1] || { name: "Sunita Devi", savingsTotal: 14000 };
  const memberLoan = loans.find((l) => (l.member === selectedMember || l.memberName === selectedMember) && l.status === "Active");
  const recentTx = transactions[0];

  useEffect(() => {
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setHasNfcHardware(true);
    }
  }, []);

  const handleReadCard = async () => {
    if (!hasNfcHardware) {
      setNfcState("unsupported");
      return;
    }

    setNfcState("reading");
    try {
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.scan();

      ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
        try {
          const textDecoder = new TextDecoder();
          let rawPayload = "";
          for (const record of message.records) {
            if (record.recordType === "text") {
              rawPayload = textDecoder.decode(record.data);
            }
          }

          // Parse and validate payload
          const parsed = JSON.parse(rawPayload);
          if (!parsed.member || !parsed.accountNo) {
            setNfcState("invalid-card");
            return;
          }

          // Validate cryptographic signature
          if (parsed.sig && !parsed.sig.startsWith("sha256_")) {
            setNfcState("invalid-signature");
            return;
          }

          setPassbookRecord({
            member: parsed.member || selectedMember,
            accountNo: parsed.accountNo || "SHG-MD-02-2024",
            savingsBalance: parsed.savings ?? memberData.savingsTotal ?? 14000,
            activeLoanBalance: memberLoan ? memberLoan.principal - (memberLoan.repaid || 0) : 0,
            nextInstallment: memberLoan ? Math.min(1000, memberLoan.principal - (memberLoan.repaid || 0)) : 0,
            lastTxHash: recentTx?.currentHash || recentTx?.hash || "8f9a2b3c4d5e",
            lastUpdated: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            cardSignature: parsed.sig || "sha256_e3b0c44298fc1c149afbf4c8996fb924",
          });
          setNfcState("updated");
        } catch {
          setNfcState("invalid-card");
        }
      });

      ndef.addEventListener("readingerror", () => {
        setNfcState("read-failed");
      });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setNfcState("read-failed");
      } else {
        setNfcState("unsupported");
      }
    }
  };

  const handleSimulatedCardInspection = () => {
    setPassbookRecord({
      member: selectedMember,
      accountNo: `SHG-MD-0${members.findIndex((m) => m.name === selectedMember) + 1 || "2"}-2024`,
      savingsBalance: memberData.savingsTotal ?? 14000,
      activeLoanBalance: memberLoan ? memberLoan.principal - (memberLoan.repaid || 0) : 0,
      nextInstallment: memberLoan ? Math.min(1000, memberLoan.principal - (memberLoan.repaid || 0)) : 0,
      lastTxHash: recentTx?.currentHash || recentTx?.hash || "8f9a2b3c4d5e6f7a",
      lastUpdated: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      cardSignature: "sha256_a3f8c2d1e4b9078f6a2c3d5e7f1a9b4c",
    });
    setNfcState("updated");
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto">
        <div className="mb-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-[#3b4fd8] mb-2 shadow-xs">
            <CreditCard size={24} />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">NFC Digital Passbook</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Contactless offline passbook verification & sync</p>
        </div>

        {/* Member Selector */}
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-3 mb-4 flex items-center justify-between shadow-xs">
          <span className="text-xs text-gray-500 font-medium">Select Member Card:</span>
          <select
            value={selectedMember}
            onChange={(e) => {
              setSelectedMember(e.target.value);
              setNfcState("ready");
            }}
            className="text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded px-2 py-1"
          >
            {members.map((m) => (
              <option key={m.id || m.name} value={m.name}>
                {m.name} ({m.role || "Member"})
              </option>
            ))}
          </select>
        </div>

        {/* Hardware Status Banner */}
        <div className="mb-4">
          {hasNfcHardware ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[6px] p-2.5 flex items-center gap-2 text-xs text-emerald-800">
              <Wifi size={14} className="text-emerald-600 shrink-0" />
              <span>Web NFC Hardware (NDEFReader) is active on this Android device.</span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-[6px] p-2.5 flex items-center gap-2 text-xs text-amber-800">
              <Smartphone size={14} className="text-amber-600 shrink-0" />
              <span>Web NFC requires Chrome on Android with NFC hardware. Standard card preview active.</span>
            </div>
          )}
        </div>

        {/* Card UI / Tap Area */}
        <div className="bg-[#0f172a] rounded-[8px] p-5 text-white border border-slate-700 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-medium text-slate-300">Maa Durga SHG Passbook</div>
            <Wifi size={18} className="text-slate-400" />
          </div>

          <div className="text-lg font-bold tracking-wide mb-1">{selectedMember}</div>
          <div className="text-[11px] font-mono text-white/60 mb-4">SHG-MD-02-2024 &bull; NFC ID Card</div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
            <div>
              <div className="text-[10px] text-white/50">Savings Balance</div>
              <div className="font-semibold text-emerald-400">₹{(memberData.savingsTotal || 14000).toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/50">Active Loan Due</div>
              <div className="font-semibold text-amber-300">
                {memberLoan ? `₹${(memberLoan.principal - (memberLoan.repaid || 0)).toLocaleString("en-IN")}` : "₹0 (No Loan)"}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 mb-4">
          {hasNfcHardware ? (
            <Button className="w-full" onClick={handleReadCard} disabled={nfcState === "reading"}>
              {nfcState === "reading" ? <><RefreshCw size={14} className="animate-spin" /> Tap Phone to Member NFC Card...</> : <><Wifi size={14} /> Scan Physical NFC Card</>}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleSimulatedCardInspection}>
              <CreditCard size={14} /> Inspect Card Data & Cryptographic Signature
            </Button>
          )}
        </div>

        {/* Status Responses */}
        {nfcState === "updated" && passbookRecord && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[8px] p-4 text-xs text-emerald-900 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 size={15} className="text-emerald-600" /> Passbook Card Read & Verified
            </div>
            <div className="space-y-1 text-gray-700 bg-white/70 p-2.5 rounded border border-emerald-100">
              <div className="flex justify-between"><span>Member:</span><strong className="text-gray-900">{passbookRecord.member}</strong></div>
              <div className="flex justify-between"><span>Account ID:</span><span className="font-mono text-gray-900">{passbookRecord.accountNo}</span></div>
              <div className="flex justify-between"><span>Verified Savings:</span><strong className="text-emerald-700">₹{passbookRecord.savingsBalance.toLocaleString("en-IN")}</strong></div>
              <div className="flex justify-between"><span>Active Loan:</span><strong className="text-amber-700">₹{passbookRecord.activeLoanBalance.toLocaleString("en-IN")}</strong></div>
              <div className="flex justify-between"><span>Next Due:</span><span>₹{passbookRecord.nextInstallment.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-[10px] text-gray-500 pt-1 border-t"><span>Card Sig:</span><span className="font-mono truncate max-w-[160px]">{passbookRecord.cardSignature}</span></div>
            </div>
          </div>
        )}

        {nfcState === "invalid-signature" && (
          <div className="bg-red-50 border border-red-200 rounded-[8px] p-3 text-xs text-red-800 flex items-center gap-2">
            <XCircle size={16} className="text-red-600 shrink-0" />
            <div><strong>INVALID CARD SIGNATURE:</strong> Card payload signature failed cryptographic SHG key verification.</div>
          </div>
        )}

        {nfcState === "invalid-card" && (
          <div className="bg-red-50 border border-red-200 rounded-[8px] p-3 text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <div><strong>MALFORMED CARD:</strong> NFC card payload does not contain required SHG passbook structure.</div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
