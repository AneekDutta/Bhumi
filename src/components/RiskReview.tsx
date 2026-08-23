import { useState, useEffect } from "react";
import { AlertTriangle, AlertOctagon, Info, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { PageShell, Button } from "./ui";
import type { Screen } from "../types";
import { useData } from "../DataContext";
import { evaluateRiskAndAnomalies, type RiskAlert, type RiskLevel } from "../riskEngine";

interface RiskReviewProps {
  onNavigate: (s: Screen) => void;
}

const levelConfig: Record<RiskLevel, { icon: typeof AlertOctagon; label: string; labelColor: string; borderColor: string; bg: string; iconColor: string }> = {
  critical: {
    icon: AlertOctagon,
    label: "Critical",
    labelColor: "text-red-700",
    borderColor: "border-red-500",
    bg: "bg-red-50/80",
    iconColor: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    labelColor: "text-amber-700",
    borderColor: "border-amber-500",
    bg: "bg-amber-50/80",
    iconColor: "text-amber-600",
  },
  review: {
    icon: Info,
    label: "Review",
    labelColor: "text-blue-700",
    borderColor: "border-blue-400",
    bg: "bg-blue-50/80",
    iconColor: "text-blue-600",
  },
};

export default function RiskReview({ onNavigate }: RiskReviewProps) {
  const { transactions, loans, meetings, disputes, members, verifyLedger } = useData();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [evaluating, setEvaluating] = useState(false);

  const runEvaluation = async () => {
    setEvaluating(true);
    let verifyRes = { valid: true, errors: [] };
    try {
      verifyRes = await verifyLedger();
    } catch {}

    const calculatedAlerts = evaluateRiskAndAnomalies({
      transactions,
      loans,
      meetings,
      disputes,
      members,
      verificationResult: verifyRes,
    });

    setAlerts(calculatedAlerts);
    setEvaluating(false);
  };

  useEffect(() => {
    runEvaluation();
  }, [transactions, loans, meetings, disputes]);

  const criticalCount = alerts.filter((a) => a.level === "critical").length;
  const warningCount = alerts.filter((a) => a.level === "warning").length;
  const reviewCount = alerts.filter((a) => a.level === "review").length;

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Risk & Anomaly Engine</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">Deterministic rule-based anomaly detection over live financial records</p>
          </div>
          <Button size="sm" variant="outline" onClick={runEvaluation} disabled={evaluating}>
            <RefreshCw size={13} className={`mr-1.5 inline ${evaluating ? "animate-spin" : ""}`} /> Re-evaluate Rules
          </Button>
        </div>

        {/* Counts summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-red-50 border border-red-200 rounded-[6px] px-4 py-3 shadow-xs">
            <div className="text-2xl font-bold text-red-700">{criticalCount}</div>
            <div className="text-xs text-red-600 mt-0.5 font-medium">Critical Violations</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-[6px] px-4 py-3 shadow-xs">
            <div className="text-2xl font-bold text-amber-700">{warningCount}</div>
            <div className="text-xs text-amber-600 mt-0.5 font-medium">Warnings Flagged</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-[6px] px-4 py-3 shadow-xs">
            <div className="text-2xl font-bold text-blue-700">{reviewCount}</div>
            <div className="text-xs text-blue-600 mt-0.5 font-medium">Audit Review Items</div>
          </div>
        </div>

        <div className="text-[11px] text-[#6b7280] mb-5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-4 py-2.5">
          These alerts are generated deterministically from live database records across 10 defined governance rules (Rules A through J). No unexplained AI black-box scores are used.
        </div>

        {/* Dynamic Alert Cards */}
        <div className="space-y-4">
          {alerts.map((alert) => {
            const cfg = levelConfig[alert.level];
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className="bg-white border border-gray-200 rounded-[8px] p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${cfg.bg} ${cfg.labelColor} border ${cfg.borderColor}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 font-semibold">{alert.ruleCode}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#111827] mb-2">{alert.title}</h3>

                <div className="space-y-2 mb-3 bg-white/60 p-3 rounded border border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Observed Fact</span>
                    <p className="text-xs text-[#111827] mt-0.5">{alert.what}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Why Flagged</span>
                    <p className="text-xs text-gray-700 mt-0.5">{alert.why}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Affected Entities</span>
                    <p className="text-xs font-mono text-gray-700 mt-0.5">{alert.affected}</p>
                  </div>
                </div>

                {alert.actionScreen && (
                  <button
                    onClick={() => onNavigate(alert.actionScreen as Screen)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#3b4fd8] hover:underline cursor-pointer"
                  >
                    {alert.action} <ArrowRight size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
