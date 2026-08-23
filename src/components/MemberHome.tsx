import { useState } from "react";
import { Mic, MicOff, CheckCircle2, PlusCircle, RefreshCw, MoreHorizontal, ChevronRight } from "lucide-react";
import { Badge } from "./ui";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface MemberHomeProps {
  onNavigate: (s: Screen) => void;
}

// Simulated voice parse states
type VoiceState = "idle" | "listening" | "parsed" | "confirmed";

export default function MemberHome({ onNavigate }: MemberHomeProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceText, setVoiceText] = useState("");
  const { stats, transactions, loans } = useData();
  const balance = stats?.balance ?? 80000;
  const myTxns = transactions
    .filter((tx: any) => tx.member === "Sunita Devi" || tx.memberName === "Sunita Devi")
    .slice(0, 5);

  const myContribution = transactions
    .filter((tx: any) => (tx.member === "Sunita Devi" || tx.memberName === "Sunita Devi") && (tx.type === "Contribution" || tx.transaction_type === "Contribution"))
    .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 2000);

  const sunitaLoan = loans.find((l: any) => (l.member === "Sunita Devi" || l.memberName === "Sunita Devi") && (l.status === "Active" || l.status === "Overdue"));
  const myLoanBalance = sunitaLoan ? sunitaLoan.principal - (sunitaLoan.repaid || 0) : 0;
  const goalAmount = 100000;

  const simulateVoice = () => {
    setVoiceState("listening");
    setTimeout(() => {
      setVoiceText("Sunita paid five hundred rupees.");
      setVoiceState("parsed");
    }, 1600);
  };

  const confirmVoice = () => {
    setVoiceState("confirmed");
    setTimeout(() => {
      setVoiceState("idle");
      setVoiceText("");
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] text-[#9ca3af] uppercase tracking-wider">Maa Durga SHG</div>
            <h1 className="text-base font-semibold text-[#111827] mt-0.5">Welcome, Sunita</h1>
          </div>
          <Badge variant="verified">Member</Badge>
        </div>
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "My savings", value: `₹${myContribution.toLocaleString("en-IN")}` },
            { label: "Loan due", value: `₹${myLoanBalance.toLocaleString("en-IN")}` },
            { label: "Group corpus", value: `₹${balance.toLocaleString("en-IN")}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-2.5 py-2 text-center">
              <div className="text-sm font-semibold text-[#111827]">{value}</div>
              <div className="text-[10px] text-[#9ca3af] mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pt-5">

        {/* Voice confirmation state */}
        {voiceState === "confirmed" && (
          <div className="bg-green-50 border border-green-200 rounded-[8px] p-4 mb-5 text-center">
            <CheckCircle2 size={28} className="text-green-600 mx-auto mb-2" strokeWidth={1.5} />
            <div className="text-sm font-semibold text-green-800">Transaction recorded</div>
            <div className="text-xs text-green-600 mt-0.5">Recorded and added to the ledger.</div>
          </div>
        )}

        {/* Voice entry panel */}
        {voiceState !== "confirmed" && (
          <div className="bg-white border border-[#e5e7eb] rounded-[8px] mb-5">
            <div className="px-4 pt-3 pb-2 border-b border-[#f3f4f6]">
              <div className="text-xs font-semibold text-[#374151] flex items-center gap-1.5">
                <Mic size={13} className="text-[#3b4fd8]" />
                Record by Voice
              </div>
            </div>
            <div className="px-4 py-3">
              {voiceState === "idle" && (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-[#6b7280] flex-1">Say something like: "Sunita paid five hundred rupees."</p>
                  <button
                    onClick={simulateVoice}
                    className="w-11 h-11 rounded-full bg-[#3b4fd8] flex items-center justify-center text-white shrink-0 hover:bg-[#3244c0] transition-colors cursor-pointer"
                  >
                    <Mic size={18} strokeWidth={1.75} />
                  </button>
                </div>
              )}

              {voiceState === "listening" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-[#3b4fd8] font-medium animate-pulse">Listening…</div>
                    <div className="flex gap-0.5 mt-2">
                      {[...Array(14)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#3b4fd8] rounded-full opacity-60"
                          style={{ height: `${8 + Math.random() * 14}px` }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setVoiceState("idle")}
                    className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 hover:bg-red-200 transition-colors cursor-pointer"
                  >
                    <MicOff size={16} strokeWidth={1.75} />
                  </button>
                </div>
              )}

              {voiceState === "parsed" && (
                <div>
                  <div className="text-xs text-[#6b7280] italic mb-2">"{voiceText}"</div>
                  <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6] mb-3">
                    {[
                      ["Member", "Sunita Devi"],
                      ["Transaction", "Contribution"],
                      ["Amount", "₹500"],
                      ["Date", "22 August 2026"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs text-[#6b7280]">{k}</span>
                        <span className="text-xs font-medium text-[#111827]">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setVoiceState("idle"); setVoiceText(""); }}
                      className="flex-1 border border-[#d1d5db] rounded-[6px] py-2 text-xs text-[#374151] hover:bg-[#f9fafb] cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={confirmVoice}
                      className="flex-1 bg-[#3b4fd8] text-white rounded-[6px] py-2 text-xs font-medium hover:bg-[#3244c0] cursor-pointer"
                    >
                      Confirm Transaction
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What would you like to record? */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-[#374151] mb-3">What would you like to record?</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Contribution", icon: PlusCircle, color: "text-[#3b4fd8]", bg: "bg-blue-50 border-blue-100" },
              { label: "Loan Repayment", icon: RefreshCw, color: "text-green-600", bg: "bg-green-50 border-green-100" },
              { label: "Other", icon: MoreHorizontal, color: "text-[#6b7280]", bg: "bg-[#f9fafb] border-[#e5e7eb]" },
            ].map(({ label, icon: Icon, color, bg }) => (
              <button
                key={label}
                onClick={() => onNavigate("member-record")}
                className={`border rounded-[8px] px-2 py-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer ${bg}`}
              >
                <Icon size={24} strokeWidth={1.5} className={color} />
                <span className="text-xs font-medium text-[#374151] text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] mb-5">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374151]">My recent transactions</span>
            <button onClick={() => onNavigate("member-transactions")} className="text-xs text-[#3b4fd8] hover:underline flex items-center gap-0.5 cursor-pointer">
              View all <ChevronRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-[#f3f4f6]">
            {(myTxns.length > 0 ? myTxns : [
              { date: "22 Aug", description: "Loan repayment", amount: 5000, type: "Repayment" },
              { date: "22 Aug", description: "Monthly contribution", amount: 2000, type: "Contribution" },
              { date: "01 Aug", description: "Loan received", amount: 10000, type: "Loan" },
            ]).map((tx: any, i: number) => {
              const isIn = tx.type === "Loan";
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <div className="text-sm text-[#111827]">{tx.description}</div>
                    <div className="text-xs text-[#9ca3af]">{tx.date?.slice(0, 6) ?? tx.date}</div>
                  </div>
                  <span className={`text-sm font-medium tabular-nums ${isIn ? "text-green-600" : "text-[#111827]"}`}>
                    {isIn ? "+" : ""}₹{Number(tx.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group savings progress */}
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] mb-5">
          <div className="px-4 py-2.5 border-b border-[#f3f4f6]">
            <span className="text-xs font-semibold text-[#374151]">Group Savings</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-xl font-semibold text-[#111827] tabular-nums">₹{balance.toLocaleString("en-IN")}</div>
                <div className="text-xs text-[#9ca3af]">Goal: ₹{goalAmount.toLocaleString("en-IN")}</div>
              </div>
              <div className="text-xs text-[#6b7280] text-right">
                ₹{(goalAmount - balance).toLocaleString("en-IN")} remaining
              </div>
            </div>
            <div className="w-full bg-[#f3f4f6] rounded-full h-2">
              <div className="bg-[#3b4fd8] h-2 rounded-full" style={{ width: `${(balance / goalAmount) * 100}%` }} />
            </div>
            <div className="text-[10px] text-[#9ca3af] mt-1">{Math.round((balance / goalAmount) * 100)}% of goal reached</div>
          </div>
        </div>

        {/* Loan status */}
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] mb-5">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
            <span className="text-xs font-semibold text-[#374151]">My loan</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-lg font-semibold text-[#111827]">₹6,000 outstanding</div>
                <div className="text-xs text-[#6b7280]">of ₹10,000 principal &mdash; ₹4,000 repaid</div>
              </div>
              <Badge variant="pending">Active</Badge>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#f3f4f6] rounded-full h-1.5 mt-2">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "40%" }} />
            </div>
            <div className="text-[10px] text-[#9ca3af] mt-1">40% repaid</div>
          </div>
        </div>
      </div>
    </div>
  );
}
