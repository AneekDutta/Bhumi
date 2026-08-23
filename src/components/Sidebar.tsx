import { LayoutDashboard, List, CheckSquare, ShieldCheck, AlertTriangle, Users, BarChart2, Settings, LogOut, Home, PlusCircle, HandCoins, BookOpen, FileText, Search, Scale, CalendarDays, AlertOctagon, Activity, Wifi, CreditCard, Banknote, ScanLine, Globe } from "lucide-react";
import type { Screen, UserRole } from "../types";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import LanguageSelector from "./LanguageSelector";

import lekhaLogo from "@/imports/lekha-logo.png";

interface SidebarProps {
  current: Screen;
  role: UserRole;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
  onRoleChange: (r: UserRole) => void;
}

export default function Sidebar({ current, role, onNavigate, onLogout, onRoleChange }: SidebarProps) {
  const { profile, user } = useAuth();
  const { t } = useLanguage();

  const memberNav: { label: string; screen: Screen; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
    { label: t("nav.home", "Home"), screen: "member-home", icon: Home },
    { label: t("nav.record", "Record Entry"), screen: "member-record", icon: PlusCircle },
    { label: t("nav.transactions", "Transactions"), screen: "member-transactions", icon: List },
    { label: t("nav.loans", "Loans"), screen: "member-loans", icon: HandCoins },
    { label: t("nav.bankPosition", "Bank & Cash"), screen: "bank-position", icon: Banknote },
    { label: t("nav.passbook", "Passbook"), screen: "nfc-passbook", icon: CreditCard },
  ];

  const treasurerNav: { label: string; screen: Screen; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
    { label: t("nav.dashboard", "Overview"), screen: "dashboard", icon: LayoutDashboard },
    { label: t("nav.transactions", "Transactions"), screen: "transactions", icon: List },
    { label: t("nav.loans", "Loans"), screen: "loans", icon: HandCoins },
    { label: t("nav.bankPosition", "Bank & Cash"), screen: "bank-position", icon: Banknote },
    { label: t("nav.members", "Members"), screen: "members", icon: Users },
    { label: t("nav.approvals", "Approvals"), screen: "approvals", icon: CheckSquare },
    { label: t("nav.audit", "Audit"), screen: "audit-history", icon: ShieldCheck },
  ];

  const auditorNav: { label: string; screen: Screen; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
    { label: t("nav.dashboard", "Audit Overview"), screen: "fed-overview", icon: LayoutDashboard },
    { label: t("nav.transactions", "Financial Records"), screen: "fed-transactions", icon: Search },
    { label: t("nav.bankPosition", "Bank & Cash"), screen: "bank-position", icon: Banknote },
    { label: t("nav.verification", "Verification"), screen: "fed-verification", icon: ShieldCheck },
    { label: t("nav.loans", "Loans"), screen: "loans", icon: HandCoins },
    { label: t("nav.disputes", "Disputes"), screen: "disputes", icon: AlertTriangle },
    { label: t("nav.panchasutra", "Panchasutra"), screen: "panchasutra", icon: Activity },
    { label: t("nav.reports", "Reports"), screen: "fed-reports", icon: FileText },
  ];

  const roleNavMap: Record<UserRole, typeof memberNav> = {
    member: memberNav,
    treasurer: treasurerNav,
    auditor: auditorNav,
  };

  const nav = roleNavMap[role] || treasurerNav;
  const displayName = profile?.name || user?.email?.split("@")[0] || "User";
  const displayRoleTitle = role === "auditor" ? t("role.auditor", "Federation Auditor") : role === "treasurer" ? t("role.treasurer", "Treasurer") : t("role.member", "Member");

  return (
    <aside className="w-56 shrink-0 bg-[#111827] text-white flex flex-col h-full border-r border-white/10">
      {/* Product identity with Lekha Logo */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 p-0.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-white/20">
            <img src={lekhaLogo} alt="Lekha Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight leading-tight text-white">{t("app.title", "Lekha")}</div>
            <div className="text-[9px] text-white/50">{t("app.groupName", "Maa Durga SHG")}</div>
          </div>
        </div>
      </div>

      {/* Language Switcher Bar */}
      <div className="px-3 py-2 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <span className="text-[10px] text-white/50 font-medium">Language</span>
        <LanguageSelector variant="sidebar" />
      </div>

      {/* Role switcher */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">{t("nav.viewAs", "View as")}</div>
        <div className="flex rounded-[5px] overflow-hidden border border-white/10">
          {(["member", "treasurer", "auditor"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={`flex-1 py-1 text-[9px] font-medium capitalize cursor-pointer transition-colors ${
                role === r ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              {r === "auditor" ? "Auditor" : r === "treasurer" ? "Treasurer" : "Member"}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto">
        {nav.map(({ label, screen, icon: Icon }) => {
          const active = current === screen;
          return (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-xs mb-0.5 cursor-pointer transition-colors text-left
                ${active
                  ? "bg-[#3b4fd8] text-white font-semibold shadow-xs"
                  : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              <Icon size={14} strokeWidth={1.75} />
              <span>{label}</span>
            </button>
          );
        })}

        {/* Secondary items for treasurer */}
        {role === "treasurer" && (
          <>
            <div className="my-2 border-t border-white/10" />
            {[
              { label: t("nav.meeting", "Meeting Session"), screen: "meeting" as Screen, icon: CalendarDays },
              { label: t("nav.paperImport", "Paper Import"), screen: "paper-import" as Screen, icon: ScanLine },
              { label: t("nav.cashCheck", "Cash Check"), screen: "cash-reconciliation" as Screen, icon: Scale },
              { label: t("nav.bankPosition", "Bank / Cash"), screen: "bank-position" as Screen, icon: Banknote },
              { label: t("nav.verification", "Verification"), screen: "verification" as Screen, icon: ShieldCheck },
              { label: t("nav.disputes", "Disputes"), screen: "disputes" as Screen, icon: AlertTriangle },
              { label: t("nav.timeline", "Timeline"), screen: "financial-timeline" as Screen, icon: List },
              { label: t("nav.reports", "Reports"), screen: "reports" as Screen, icon: BarChart2 },
              { label: t("nav.sync", "Offline Sync"), screen: "sync-center" as Screen, icon: Wifi },
              { label: t("nav.settings", "Settings"), screen: "settings" as Screen, icon: Settings },
            ].map(({ label, screen: s, icon: Icon }) => (
              <button
                key={s}
                onClick={() => onNavigate(s)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[5px] text-xs mb-0.5 cursor-pointer transition-colors text-left
                  ${current === s
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/45 hover:text-white/70 hover:bg-white/5"
                  }`}
              >
                <Icon size={13} strokeWidth={1.5} />
                <span>{label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      {/* User profile footer */}
      <div className="px-4 py-3 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white truncate max-w-[130px]" title={displayName}>{displayName}</div>
            <div className="text-[10px] text-white/50">{displayRoleTitle}</div>
          </div>
          <button onClick={onLogout} className="text-white/40 hover:text-red-300 transition-colors cursor-pointer p-1" title={t("nav.signOut", "Sign out")}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
