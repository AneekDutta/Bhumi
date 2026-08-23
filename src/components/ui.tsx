import type { ReactNode } from "react";

// Status badges — full transaction + loan + meeting state model
export type BadgeVariant =
  | "verified"    // ✓ Ledger verified
  | "completed"   // Transaction completed
  | "pending"     // Waiting for action
  | "review"      // Under review
  | "failed"      // Hash / integrity failed
  | "rejected"    // Rejected by approver
  | "recorded"    // Saved to ledger, not yet verified
  | "disputed"    // Member reported a problem
  | "resolved"    // Dispute resolved
  | "integrity"   // INTEGRITY_COMPROMISED — tamper detected
  | "overdue"     // Loan overdue
  | "blocked"     // Meeting/flow blocked
  | "partial";    // Partially repaid

const badgeStyles: Record<BadgeVariant, string> = {
  verified:  "bg-green-50 text-green-700 border border-green-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  resolved:  "bg-green-50 text-green-700 border border-green-200",
  pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  review:    "bg-amber-50 text-amber-700 border border-amber-200",
  recorded:  "bg-[#f3f4f6] text-[#374151] border border-[#d1d5db]",
  partial:   "bg-blue-50 text-blue-700 border border-blue-200",
  failed:    "bg-red-50 text-red-700 border border-red-200",
  rejected:  "bg-red-50 text-red-700 border border-red-200",
  disputed:  "bg-red-50 text-red-700 border border-red-200",
  integrity: "bg-red-700 text-white border border-red-800",
  overdue:   "bg-orange-50 text-orange-700 border border-orange-200",
  blocked:   "bg-red-50 text-red-800 border border-red-300",
};

export function Badge({ children, variant }: { children: ReactNode; variant: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeStyles[variant]}`}>
      {children}
    </span>
  );
}

// Status dot
export function StatusDot({ variant }: { variant: BadgeVariant }) {
  const colors: Record<BadgeVariant, string> = {
    verified:  "bg-green-500",
    completed: "bg-green-500",
    resolved:  "bg-green-500",
    pending:   "bg-amber-500",
    review:    "bg-amber-500",
    recorded:  "bg-[#9ca3af]",
    partial:   "bg-blue-500",
    failed:    "bg-red-500",
    rejected:  "bg-red-500",
    disputed:  "bg-red-500",
    integrity: "bg-red-800",
    overdue:   "bg-orange-500",
    blocked:   "bg-red-600",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[variant]} mr-1.5`} />;
}

// Button variants
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

const btnStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#3b4fd8] text-white hover:bg-[#3244c0] border border-[#3b4fd8] hover:border-[#3244c0]",
  secondary: "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb] border border-[#e5e7eb]",
  ghost: "bg-transparent text-[#374151] hover:bg-[#f3f4f6] border border-transparent",
  danger: "bg-[#dc2626] text-white hover:bg-[#b91c1c] border border-[#dc2626]",
  outline: "bg-white text-[#374151] hover:bg-[#f9fafb] border border-[#e5e7eb]",
};

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

export function Button({ children, variant = "primary", size = "md", onClick, type = "button", disabled, className = "" }: ButtonProps) {
  const sizes = { sm: "px-2.5 py-1 text-xs", md: "px-3.5 py-1.5 text-sm", lg: "px-5 py-2 text-sm" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-[6px] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${btnStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// Section header
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
        {subtitle && <p className="text-xs text-[#6b7280] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#e5e7eb] rounded-[6px] ${className}`}>
      {children}
    </div>
  );
}

// Stat tile
export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3">
      <div className="text-xs text-[#6b7280] mb-1">{label}</div>
      <div className="text-2xl font-semibold text-[#111827] tracking-tight">{value}</div>
      {sub && <div className="text-xs text-[#6b7280] mt-0.5">{sub}</div>}
    </div>
  );
}

// Form field wrapper
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#374151] mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#9ca3af] mt-1">{hint}</p>}
    </div>
  );
}

// Input
export function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-[#d1d5db] rounded-[6px] px-3 py-1.5 text-sm text-[#111827] bg-white focus:outline-none focus:border-[#3b4fd8] focus:ring-1 focus:ring-[#3b4fd8] placeholder:text-[#9ca3af] ${props.className ?? ""}`}
    />
  );
}

// Select
export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-[#d1d5db] rounded-[6px] px-3 py-1.5 text-sm text-[#111827] bg-white focus:outline-none focus:border-[#3b4fd8] focus:ring-1 focus:ring-[#3b4fd8] ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

// Textarea
export function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-[#d1d5db] rounded-[6px] px-3 py-1.5 text-sm text-[#111827] bg-white focus:outline-none focus:border-[#3b4fd8] focus:ring-1 focus:ring-[#3b4fd8] placeholder:text-[#9ca3af] resize-none ${props.className ?? ""}`}
    />
  );
}

// Hash display
export function HashDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[#6b7280] mb-1">{label}</div>
      <code className="mono text-[11px] text-[#374151] bg-[#f3f4f6] px-2 py-1 rounded block break-all">
        {value || "—"}
      </code>
    </div>
  );
}

// Alert
export function Alert({ variant, title, children }: { variant: "success" | "warning" | "danger" | "info"; title?: string; children: ReactNode }) {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    danger: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };
  return (
    <div className={`border rounded-[6px] px-4 py-3 text-sm ${styles[variant]}`}>
      {title && <div className="font-semibold mb-0.5">{title}</div>}
      {children}
    </div>
  );
}

// Divider
export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-t border-[#e5e7eb] ${className}`} />;
}

// Page shell
export function PageShell({ children }: { children: ReactNode }) {
  return <div className="p-6 max-w-5xl">{children}</div>;
}
