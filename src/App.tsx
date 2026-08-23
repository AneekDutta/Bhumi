import { useState, useEffect } from "react";
import type { Screen, UserRole } from "./types";
import { useAuth } from "./AuthContext";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import CreateTransaction from "./components/CreateTransaction";
import TransactionDetails from "./components/TransactionDetails";
import Approvals from "./components/Approvals";
import Verification from "./components/Verification";
import Disputes from "./components/Disputes";
import Members from "./components/Members";
import Reports from "./components/Reports";
import AuditHistory from "./components/AuditHistory";
import Settings from "./components/Settings";
import MemberHome from "./components/MemberHome";
import VoiceEntry from "./components/VoiceEntry";
import Loans from "./components/Loans";
import LoanCreate from "./components/LoanCreate";
import FederationAudit from "./components/FederationAudit";
import GroupFinances from "./components/GroupFinances";
import CashReconciliation from "./components/CashReconciliation";
import FinancialTimeline from "./components/FinancialTimeline";
import MemberSummary from "./components/MemberSummary";
import MeetingSession from "./components/MeetingSession";
import PaperImport from "./components/PaperImport";
import RiskReview from "./components/RiskReview";
import PanchasutreHealth from "./components/PanchasutreHealth";
import OfflineSync from "./components/OfflineSync";
import NfcPassbook from "./components/NfcPassbook";
import BankPosition from "./components/BankPosition";
import ThermalReceipt from "./components/ThermalReceipt";
import DemoData from "./components/DemoData";
import LanguageSelector from "./components/LanguageSelector";
import lekhaLogo from "@/imports/lekha-logo.png";
import { Home, Mic, List, HandCoins, Menu, ShieldCheck, LogOut, UserCheck } from "lucide-react";

const roleDefaultScreen: Record<UserRole, Screen> = {
  member: "member-home",
  treasurer: "dashboard",
  auditor: "fed-overview",
};

export default function App() {
  const { user, role, profile, loading: authLoading, signOut, setRole } = useAuth();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (role && roleDefaultScreen[role]) {
      setScreen(roleDefaultScreen[role]);
    }
  }, [role]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f9fafb]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#3b4fd8] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#6b7280]">Restoring secure session…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const nav = (s: Screen) => {
    setScreen(s);
    setMobileMenuOpen(false);
  };

  const handleRoleChange = (r: UserRole) => {
    setRole(r);
    setScreen(roleDefaultScreen[r]);
    setMobileMenuOpen(false);
  };

  const displayName = profile?.name || user.email?.split("@")[0] || "User";

  const renderScreen = () => {
    switch (screen) {
      // Member screens
      case "member-home": return <MemberHome onNavigate={nav} />;
      case "member-record": return <VoiceEntry onNavigate={nav} />;
      case "member-transactions": return <Transactions onNavigate={nav} />;
      case "member-loans": return <Loans onNavigate={nav} />;
      case "member-summary": return <MemberSummary />;
      case "group-finances": return <GroupFinances onNavigate={nav} />;

      // Treasurer screens
      case "dashboard": return <Dashboard onNavigate={nav} />;
      case "transactions": return <Transactions onNavigate={nav} />;
      case "create-transaction": return <CreateTransaction onNavigate={nav} />;
      case "transaction-details": return <TransactionDetails onNavigate={nav} />;
      case "approvals": return <Approvals onNavigate={nav} />;
      case "loans": return <Loans onNavigate={nav} />;
      case "loan-create": return <LoanCreate onNavigate={nav} />;
      case "verification": return <Verification onNavigate={nav} />;
      case "disputes": return <Disputes onNavigate={nav} />;
      case "members": return <Members />;
      case "reports": return <Reports />;
      case "settings": return <Settings />;
      case "audit-history": return <AuditHistory />;

      // Additional feature screens
      case "cash-reconciliation": return <CashReconciliation onNavigate={nav} />;
      case "meeting": return <MeetingSession onNavigate={nav} />;
      case "risk-review": return <RiskReview onNavigate={nav} />;
      case "panchasutra": return <PanchasutreHealth />;
      case "sync-center": return <OfflineSync />;
      case "thermal-receipt": return <ThermalReceipt />;
      case "nfc-passbook": return <NfcPassbook />;
      case "bank-position": return <BankPosition />;
      case "paper-import": return <PaperImport />;
      case "demo-data": return <DemoData />;
      case "financial-timeline": return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-[#111827]">Financial Timeline</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">Chronological record of all group financial activity</p>
          </div>
          <FinancialTimeline onNavigate={nav} />
        </div>
      );

      // Federation Auditor screens
      case "fed-overview": return <FederationAudit screen="fed-overview" onNavigate={nav} />;
      case "fed-transactions": return <FederationAudit screen="fed-transactions" onNavigate={nav} />;
      case "fed-verification": return <FederationAudit screen="fed-verification" onNavigate={nav} />;
      case "fed-reports": return <FederationAudit screen="fed-reports" onNavigate={nav} />;

      default: return <Dashboard onNavigate={nav} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb] text-[#111827]">
      {/* Desktop Sidebar (visible on md screens and up) */}
      <div className="hidden md:flex md:w-56 shrink-0 h-full">
        <Sidebar
          current={screen}
          role={role}
          onNavigate={nav}
          onLogout={() => signOut()}
          onRoleChange={handleRoleChange}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Top Header (visible on mobile only) */}
        <header className="md:hidden bg-[#111827] text-white px-3 py-2 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10 p-0.5 flex items-center justify-center shrink-0 border border-white/20 overflow-hidden">
              <img src={lekhaLogo} alt="Lekha Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight tracking-tight">Lekha</div>
              <div className="text-[9px] text-white/50">Maa Durga SHG</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <LanguageSelector variant="header" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 cursor-pointer"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111827] text-white border-b border-white/10 px-4 py-3 z-50 shrink-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
              <span className="text-white/70">{displayName} ({role})</span>
              <button onClick={() => signOut()} className="text-red-400 hover:underline flex items-center gap-1 text-[11px]">
                <LogOut size={12} /> Sign out
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                { label: "Dashboard", screen: "dashboard" as Screen },
                { label: "Record Entry", screen: "member-record" as Screen },
                { label: "Transactions", screen: "transactions" as Screen },
                { label: "Loans", screen: "loans" as Screen },
                { label: "Meeting Session", screen: "meeting" as Screen },
                { label: "Cash Reconcile", screen: "cash-reconciliation" as Screen },
                { label: "Paper Import", screen: "paper-import" as Screen },
                { label: "Bank & Cash", screen: "bank-position" as Screen },
                { label: "Verification", screen: "verification" as Screen },
                { label: "Disputes", screen: "disputes" as Screen },
                { label: "Reports", screen: "reports" as Screen },
                { label: "Panchasutra", screen: "panchasutra" as Screen },
                { label: "NFC Passbook", screen: "nfc-passbook" as Screen },
                { label: "Offline Sync", screen: "sync-center" as Screen },
              ].map(({ label, screen: s }) => (
                <button
                  key={s}
                  onClick={() => nav(s)}
                  className={`text-left py-1.5 px-2 rounded text-[11px] ${
                    screen === s ? "bg-[#3b4fd8] text-white font-semibold" : "text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Screen View Container */}
        <main className="flex-1 overflow-y-auto w-full">
          {renderScreen()}
        </main>

        {/* Mobile Bottom Navigation Bar (Visible on mobile only) */}
        <nav className="md:hidden bg-white border-t border-[#e5e7eb] px-2 py-1.5 flex justify-around items-center shrink-0 z-40">
          <button
            onClick={() => nav(role === "member" ? "member-home" : "dashboard")}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded text-[10px] cursor-pointer ${
              screen === "dashboard" || screen === "member-home" ? "text-[#3b4fd8] font-bold" : "text-[#6b7280]"
            }`}
          >
            <Home size={16} />
            <span>Home</span>
          </button>

          <button
            onClick={() => nav("member-record")}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded text-[10px] cursor-pointer ${
              screen === "member-record" ? "text-[#3b4fd8] font-bold" : "text-[#6b7280]"
            }`}
          >
            <Mic size={16} />
            <span>Voice</span>
          </button>

          <button
            onClick={() => nav(role === "member" ? "member-transactions" : "transactions")}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded text-[10px] cursor-pointer ${
              screen === "transactions" || screen === "member-transactions" ? "text-[#3b4fd8] font-bold" : "text-[#6b7280]"
            }`}
          >
            <List size={16} />
            <span>Ledger</span>
          </button>

          <button
            onClick={() => nav(role === "member" ? "member-loans" : "loans")}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded text-[10px] cursor-pointer ${
              screen === "loans" || screen === "member-loans" ? "text-[#3b4fd8] font-bold" : "text-[#6b7280]"
            }`}
          >
            <HandCoins size={16} />
            <span>Loans</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded text-[10px] cursor-pointer text-[#6b7280]"
          >
            <Menu size={16} />
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
