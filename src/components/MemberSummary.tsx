import { CheckCircle2 } from "lucide-react";
import { PageShell } from "./ui";
import { CurrencyViewToggle, NoteRow } from "./CurrencyNotes";
import { useData } from "../DataContext";

// Simulated member data for Sunita Devi
const MY_CONTRIBUTION = 12500;
const MY_LOAN_PRINCIPAL = 10000;
const MY_OUTSTANDING = 6000;

const contributionHistory = [
  { date: "22 Aug", amount: 500 },
  { date: "15 Aug", amount: 500 },
  { date: "08 Aug", amount: 1000 },
  { date: "01 Aug", amount: 500 },
  { date: "22 Jul", amount: 500 },
  { date: "15 Jul", amount: 500 },
];

export default function MemberSummary() {
  const { stats } = useData();
  const balance = stats?.balance ?? 87700;

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#111827]">My Financial Summary</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Sunita Devi &mdash; Maa Durga SHG</p>
      </div>

      {/* Group + personal stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3">
          <div className="text-xs text-[#6b7280] mb-1">Group savings</div>
          <div className="text-xl font-semibold text-[#111827] tabular-nums">₹{balance.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3">
          <div className="text-xs text-[#6b7280] mb-1">My total contribution</div>
          <CurrencyViewToggle amount={MY_CONTRIBUTION} size="sm" compact defaultView="numeric" />
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3">
          <div className="text-xs text-[#6b7280] mb-1">My active loan</div>
          <div className="text-xl font-semibold text-[#111827] tabular-nums">₹{MY_LOAN_PRINCIPAL.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3">
          <div className="text-xs text-[#6b7280] mb-1">Outstanding balance</div>
          <div className="text-xl font-semibold text-[#111827] tabular-nums">₹{MY_OUTSTANDING.toLocaleString("en-IN")}</div>
          <div className="w-full bg-[#f3f4f6] rounded-full h-1.5 mt-2">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${((MY_LOAN_PRINCIPAL - MY_OUTSTANDING) / MY_LOAN_PRINCIPAL) * 100}%` }} />
          </div>
          <div className="text-[10px] text-[#9ca3af] mt-0.5">40% repaid</div>
        </div>
      </div>

      {/* Group savings goal */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Group Savings Goal</div>
            <div className="text-xl font-semibold text-[#111827] tabular-nums mt-0.5">₹{balance.toLocaleString("en-IN")}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6b7280]">Goal</div>
            <div className="text-sm font-semibold text-[#374151]">₹1,00,000</div>
          </div>
        </div>
        <div className="w-full bg-[#f3f4f6] rounded-full h-2">
          <div className="bg-[#3b4fd8] h-2 rounded-full" style={{ width: `${(balance / 100000) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#9ca3af]">{Math.round((balance / 100000) * 100)}% reached</span>
          <span className="text-[10px] text-[#9ca3af]">₹{(100000 - balance).toLocaleString("en-IN")} remaining</span>
        </div>
      </div>

      {/* Contribution history */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
        <div className="px-4 py-2.5 border-b border-[#e5e7eb] flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">My contribution history</h3>
          <span className="text-xs text-[#6b7280]">Total: ₹{MY_CONTRIBUTION.toLocaleString("en-IN")}</span>
        </div>
        <div className="divide-y divide-[#f9fafb]">
          {contributionHistory.map((c, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6b7280] w-12">{c.date}</span>
                <NoteRow amount={c.amount} showToggle />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 size={11} strokeWidth={2} />
                Verified
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
