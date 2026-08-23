import { useState } from "react";
import { ShieldCheck, Lock, CheckCircle2, Phone, Mail, ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button, Input, Field, Alert } from "./ui";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import LanguageSelector from "./LanguageSelector";
import lekhaLogo from "@/imports/lekha-logo.png";

type AuthView = "signin" | "create" | "created" | "otp" | "forgot" | "reset-sent";
type SignInMode = "password" | "otp";

interface LoginProps {
  onLogin?: () => void;
}

const ROLES = [
  { value: "member", label: "Member" },
  { value: "treasurer", label: "Treasurer" },
  { value: "auditor", label: "Auditor" },
];

export default function Login({ onLogin }: LoginProps) {
  const { signIn, signInWithEmailOtp, verifyEmailOtp, signUp, resetPassword, error: authError } = useAuth();
  const [view, setView] = useState<AuthView>("signin");
  const [signInMode, setSignInMode] = useState<SignInMode>("password");
  const [localError, setLocalError] = useState<string | null>(null);

  // Sign-in fields
  const [email, setEmail] = useState("treasurer@maa-durga-shg.in");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // OTP fields
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Create-account fields
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("member");
  const [groupCode, setGroupCode] = useState("MDSHG-2024");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [creating, setCreating] = useState(false);

  // Forgot password
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  const displayError = localError || authError;

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    setSigningIn(true);
    const { error } = await signIn(email, password);
    setSigningIn(false);

    if (error) {
      setLocalError(error.message || "Failed to sign in. Please verify your credentials.");
    } else {
      onLogin?.();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!otpEmail) {
      setLocalError("Please enter your registered email address.");
      return;
    }

    setSendingOtp(true);
    const { error } = await signInWithEmailOtp(otpEmail);
    setSendingOtp(false);

    if (error) {
      setLocalError(error.message || "Failed to send OTP code.");
    } else {
      setView("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!otpCode || otpCode.length < 6) {
      setLocalError("Please enter the 6-digit OTP code.");
      return;
    }

    setVerifyingOtp(true);
    const { error } = await verifyEmailOtp(otpEmail, otpCode);
    setVerifyingOtp(false);

    if (error) {
      setLocalError(error.message || "Invalid or expired OTP code.");
    } else {
      onLogin?.();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name || !signupEmail || !phone || !groupCode || !newPw) {
      setLocalError("Please fill in all required fields.");
      return;
    }

    if (newPw.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    if (newPw !== confirmPw) {
      setLocalError("Passwords do not match.");
      return;
    }

    setCreating(true);
    const { error } = await signUp(signupEmail, newPw, {
      name,
      phone,
      role,
      groupCode,
    });
    setCreating(false);

    if (error) {
      setLocalError(error.message || "Failed to create account.");
    } else {
      setView("created");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!resetEmail) {
      setLocalError("Please enter your registered email address.");
      return;
    }

    setResetting(true);
    const { error } = await resetPassword(resetEmail);
    setResetting(false);

    if (error) {
      setLocalError(error.message || "Failed to send reset link.");
    } else {
      setView("reset-sent");
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Language Picker Header */}
        <div className="flex justify-end mb-3">
          <LanguageSelector variant="login" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-md border border-gray-100 p-2 mb-3">
            <img src={lekhaLogo} alt="Lekha Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight mb-1">Lekha</h1>
          <p className="text-xs text-[#6b7280]">SHG Digital Ledger &bull; Secure Financial Records with Verifiable Integrity</p>
        </div>

        {displayError && (
          <div className="mb-4">
            <Alert variant="danger" title="Authentication Error">
              {displayError}
            </Alert>
          </div>
        )}

        {/* ── SIGN IN ── */}
        {view === "signin" && (
          <>
            <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Sign in</div>
                {/* Auth Mode Toggle */}
                <div className="flex rounded-[5px] bg-[#f3f4f6] p-0.5 border border-[#e5e7eb]">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMode("password");
                      setLocalError(null);
                    }}
                    className={`text-[10px] font-medium px-2 py-1 rounded-[4px] cursor-pointer transition-colors ${
                      signInMode === "password" ? "bg-white text-[#111827] shadow-xs" : "text-[#6b7280] hover:text-[#111827]"
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMode("otp");
                      setLocalError(null);
                    }}
                    className={`text-[10px] font-medium px-2 py-1 rounded-[4px] cursor-pointer transition-colors ${
                      signInMode === "otp" ? "bg-white text-[#111827] shadow-xs" : "text-[#6b7280] hover:text-[#111827]"
                    }`}
                  >
                    Email OTP
                  </button>
                </div>
              </div>

              {signInMode === "password" ? (
                <form onSubmit={handlePasswordSignIn} className="space-y-4">
                  <Field label="Email address">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setLocalError(null);
                      }}
                      placeholder="treasurer@maa-durga-shg.in"
                      required
                    />
                  </Field>
                  <Field label="Password / PIN">
                    <div className="relative">
                      <Input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setLocalError(null);
                        }}
                        placeholder="Enter password"
                        required
                        className="pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] cursor-pointer"
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                  <div className="text-right -mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot");
                        setLocalError(null);
                      }}
                      className="text-xs text-[#3b4fd8] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" size="lg" className="w-full justify-center mt-1" disabled={signingIn}>
                    {signingIn ? "Signing in…" : "Sign in"}
                  </Button>

                  {/* 1-Click Instant Demo Login (Bypasses Email Rate Limits) */}
                  <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">1-Click Instant Demo Login</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setSigningIn(true);
                          await signIn("treasurer@maa-durga-shg.in", "password123");
                          setSigningIn(false);
                          onLogin?.();
                        }}
                        className="text-[11px] font-semibold py-1.5 px-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                      >
                        Treasurer
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setSigningIn(true);
                          await signIn("member@maa-durga-shg.in", "password123");
                          setSigningIn(false);
                          onLogin?.();
                        }}
                        className="text-[11px] font-semibold py-1.5 px-2 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Member
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setSigningIn(true);
                          await signIn("auditor@varanasi-clf.gov.in", "password123");
                          setSigningIn(false);
                          onLogin?.();
                        }}
                        className="text-[11px] font-semibold py-1.5 px-2 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                      >
                        Auditor
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-[#6b7280] leading-relaxed">
                    Enter your email to receive a secure 6-digit OTP code.
                  </p>
                  <Field label="Registered email">
                    <Input
                      type="email"
                      value={otpEmail}
                      onChange={(e) => {
                        setOtpEmail(e.target.value);
                        setLocalError(null);
                      }}
                      placeholder="member@maa-durga-shg.in"
                      required
                    />
                  </Field>
                  <Button type="submit" size="lg" className="w-full justify-center mt-1" disabled={sendingOtp || !otpEmail}>
                    {sendingOtp ? "Sending OTP…" : "Send 6-digit OTP"}
                  </Button>
                </form>
              )}
            </div>
            <div className="mt-4 text-center">
              <span className="text-xs text-[#9ca3af]">New to this group? </span>
              <button
                onClick={() => {
                  setView("create");
                  setLocalError(null);
                }}
                className="text-xs text-[#3b4fd8] hover:underline cursor-pointer font-medium"
              >
                Create account
              </button>
            </div>
          </>
        )}

        {/* ── EMAIL OTP VERIFICATION ── */}
        {view === "otp" && (
          <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setView("signin");
                  setLocalError(null);
                }}
                className="text-[#6b7280] hover:text-[#111827] cursor-pointer"
              >
                <ArrowLeft size={15} />
              </button>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Enter OTP code</div>
            </div>
            <div className="flex items-center gap-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-3 py-2.5 mb-5">
              <Mail size={14} className="text-[#3b4fd8] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#374151] truncate">{otpEmail}</div>
                <div className="text-[10px] text-[#9ca3af]">Check your inbox for the 6-digit code</div>
              </div>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Field label="6-digit verification code">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setLocalError(null);
                  }}
                  placeholder="• • • • • •"
                  required
                  className="text-center text-lg tracking-[0.4em] font-mono"
                  maxLength={6}
                  autoFocus
                />
              </Field>
              <Button
                type="submit"
                size="lg"
                className="w-full justify-center"
                disabled={otpCode.length < 6 || verifyingOtp}
              >
                {verifyingOtp ? "Verifying…" : "Verify & Sign in"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-xs text-[#3b4fd8] hover:underline cursor-pointer"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Resending…" : "Resend OTP code"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── CREATE ACCOUNT ── */}
        {view === "create" && (
          <>
            <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setView("signin");
                    setLocalError(null);
                  }}
                  className="text-[#6b7280] hover:text-[#111827] cursor-pointer"
                >
                  <ArrowLeft size={15} />
                </button>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Create account</div>
              </div>
              <form onSubmit={handleCreate} className="space-y-3.5">
                <Field label="Full name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sunita Devi"
                    required
                  />
                </Field>
                <Field label="Email address">
                  <Input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. sunita.devi@maa-durga-shg.in"
                    required
                  />
                </Field>
                <Field label="Mobile number">
                  <div className="flex gap-1.5">
                    <div className="px-2.5 py-1.5 border border-[#d1d5db] rounded-[6px] text-sm text-[#374151] bg-[#f9fafb] shrink-0 flex items-center gap-1">
                      <Phone size={12} className="text-[#9ca3af]" />
                      +91
                    </div>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile"
                      required
                      className="flex-1"
                    />
                  </div>
                </Field>
                <Field label="Role in group">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-[#d1d5db] rounded-[6px] px-2.5 py-1.5 text-sm text-[#374151] focus:outline-none focus:border-[#3b4fd8] bg-white"
                    required
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Group invitation code">
                  <Input
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MDSHG-2024"
                    required
                  />
                </Field>
                <Field label="Password">
                  <Input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                </Field>
                <Field label="Confirm password">
                  <Input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                  {confirmPw && newPw !== confirmPw && (
                    <div className="text-[10px] text-red-600 mt-1">Passwords do not match.</div>
                  )}
                </Field>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full justify-center mt-2"
                  disabled={creating || (confirmPw !== "" && newPw !== confirmPw) || !name || !signupEmail || !phone || !groupCode}
                >
                  {creating ? "Creating account…" : "Register Account"}
                </Button>
              </form>
            </div>
          </>
        )}

        {/* ── CREATED SUCCESS ── */}
        {view === "created" && (
          <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-green-600" strokeWidth={1.75} />
            </div>
            <h2 className="text-base font-semibold text-[#111827] mb-1">Account created</h2>
            <p className="text-xs text-[#6b7280] mb-4">
              Your account has been registered with Maa Durga SHG. Please sign in with your credentials or email OTP.
            </p>
            <Button size="lg" className="w-full justify-center" onClick={() => setView("signin")}>
              Continue to sign in
            </Button>
          </div>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === "forgot" && (
          <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setView("signin");
                  setLocalError(null);
                }}
                className="text-[#6b7280] hover:text-[#111827] cursor-pointer"
              >
                <ArrowLeft size={15} />
              </button>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Reset password</div>
            </div>
            <p className="text-xs text-[#6b7280] mb-4 leading-relaxed">
              Enter your registered email address to receive password reset instructions.
            </p>
            <form onSubmit={handleForgot} className="space-y-4">
              <Field label="Registered email">
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="member@maa-durga-shg.in"
                  required
                />
              </Field>
              <Button type="submit" size="lg" className="w-full justify-center" disabled={!resetEmail || resetting}>
                {resetting ? "Sending link…" : "Send reset link"}
              </Button>
            </form>
          </div>
        )}

        {/* ── RESET LINK SENT ── */}
        {view === "reset-sent" && (
          <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={20} className="text-[#3b4fd8]" strokeWidth={1.75} />
            </div>
            <h2 className="text-base font-semibold text-[#111827] mb-1">Reset link sent</h2>
            <p className="text-xs text-[#6b7280] mb-5">
              If an account exists for <span className="font-medium text-[#374151]">{resetEmail}</span>, a password reset link has been sent.
            </p>
            <Button variant="outline" size="lg" className="w-full justify-center" onClick={() => setView("signin")}>
              Back to sign in
            </Button>
          </div>
        )}

        {/* Footer */}
        {view === "signin" && (
          <div className="flex items-center gap-2 mt-4 text-[#6b7280] justify-center">
            <Lock size={12} strokeWidth={1.75} />
            <p className="text-xs">Tamper-evident cryptographic ledger</p>
          </div>
        )}
        <div className="mt-3 text-center space-y-1">
          <p className="text-xs text-[#9ca3af]">Maa Durga Self-Help Group &middot; Varanasi, UP</p>
          <p className="text-[11px] text-[#9ca3af]">
            <span>Terms of Service</span> &middot; <span>Privacy Policy</span> &middot; <span>NRLM Compliant</span>
          </p>
        </div>
      </div>
    </div>
  );
}
