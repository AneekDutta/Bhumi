import { useState } from "react";
import { CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { PageShell, Field, Input, Select, Button, Divider } from "./ui";
import LanguageSelector from "./LanguageSelector";

export default function Settings() {
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const confirmMatch = deleteConfirm === "DELETE";

  if (deleted) {
    return (
      <PageShell>
        <div className="max-w-sm mx-auto mt-12 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={20} className="text-red-500" strokeWidth={1.75} />
          </div>
          <h2 className="text-base font-semibold text-[#111827] mb-1">Account deleted</h2>
          <p className="text-sm text-[#6b7280]">Your account and associated data have been removed from this group ledger.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#111827]">Settings</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Group and account configuration</p>
      </div>

      <div className="max-w-xl space-y-5">
        {/* Language & Localization */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb] flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">App Language / भाषा</h3>
            <span className="text-[10px] text-gray-400">13 Indian Languages</span>
          </div>
          <div className="p-4">
            <LanguageSelector variant="settings" />
          </div>
        </div>

        {/* Group settings */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Group settings</h3>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Group name">
              <Input defaultValue="Maa Durga Self-Help Group" />
            </Field>
            <Field label="Location">
              <Input defaultValue="Varanasi, Uttar Pradesh" />
            </Field>
            <Field label="Registration number">
              <Input defaultValue="SHG-UP-2019-00481" />
            </Field>
            <Field label="Required approvals for transactions">
              <Select defaultValue="2">
                <option value="1">1 approval</option>
                <option value="2">2 approvals</option>
                <option value="3">3 approvals</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* Account settings */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">My account</h3>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Full name">
              <Input defaultValue="Rekha Singh" />
            </Field>
            <Field label="Email">
              <Input type="email" defaultValue="rekha.singh@maa-durga-shg.in" />
            </Field>
            <Field label="Role">
              <Input defaultValue="Treasurer" disabled className="opacity-60" />
            </Field>
            <Field label="Current password">
              <Input type="password" placeholder="Enter current password" />
            </Field>
            <Field label="New password">
              <Input type="password" placeholder="Enter new password" />
            </Field>
          </div>
        </div>

        {/* Contact verification */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Contact verification</h3>
          </div>
          <div className="divide-y divide-[#f3f4f6]">
            {/* Phone */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#374151]">+91 98765 43210</div>
                <div className="text-[10px] text-[#9ca3af]">Mobile number</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                  <CheckCircle2 size={10} strokeWidth={2} />
                  Verified
                </div>
              </div>
            </div>
            {/* Email */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#374151] truncate">rekha.singh@maa-durga-shg.in</div>
                <div className="text-[10px] text-[#9ca3af]">Email address</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {emailSent ? (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                    <CheckCircle2 size={10} strokeWidth={2} />
                    Link sent
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                      <AlertTriangle size={10} strokeWidth={2} />
                      Unverified
                    </div>
                    <button
                      onClick={() => setEmailSent(true)}
                      className="text-[10px] text-[#3b4fd8] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Verify email
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          {phoneSent && (
            <div className="px-4 pb-3 text-[10px] text-[#6b7280]">
              A new verification code was sent to your mobile.
            </div>
          )}
        </div>

        {/* Ledger integrity */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Ledger integrity</h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-[#6b7280] leading-relaxed mb-3">
              Each transaction is linked to the previous transaction using a cryptographic fingerprint.
              If historical data is changed, the verification process can detect the mismatch.
              This is a tamper-evident cryptographic ledger.
            </p>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-3 py-2 space-y-1">
              {[
                ["Hash algorithm", "SHA-256"],
                ["Chain root", "Genesis block — May 2019"],
                ["Last verified", "22 Aug 2026, 14:38"],
                ["Total entries", "247"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-[#6b7280]">{label}</span>
                  <span className="mono text-[11px] text-[#374151]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button>Save changes</Button>
          <Button variant="outline">Cancel</Button>
        </div>

        <Divider />

        {/* Legal, Terms of Service & Privacy Policy */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Legal Disclosures & Privacy Policy</h3>
          </div>
          <div className="p-4 space-y-3 text-xs text-gray-600">
            <div>
              <strong className="text-gray-900 block mb-0.5">Terms of Service (ToS)</strong>
              <p className="leading-relaxed">
                Lekha SHG Digital Ledger operates under National Rural Livelihoods Mission (NRLM) financial guidelines. All entries recorded in this ledger are cryptographically sealed with SHA-256 hash chains. Mutations represent legally binding digital records of member savings, loan disbursements, and meeting attendance.
              </p>
            </div>
            <div>
              <strong className="text-gray-900 block mb-0.5">Data Privacy Policy</strong>
              <p className="leading-relaxed">
                Member financial data, phone numbers, and Aadhaar-linked identifications are encrypted in transit and at rest. Financial data is accessible only by authenticated members of Maa Durga SHG and authorized block federation auditors. Data is never shared with third-party advertisers.
              </p>
            </div>
          </div>
        </div>

        <Divider />

        {/* Delete account */}
        <div className="bg-white border border-red-200 rounded-[6px]">
          <div className="px-4 py-2.5 border-b border-red-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-red-700">Delete account</h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-[#6b7280] leading-relaxed mb-4">
              Deleting your account removes your login access and personal details.
              <span className="font-medium text-[#374151]"> Transaction history and ledger records are preserved</span> — they are part of the group's permanent audit trail and cannot be removed.
            </p>
            {!showDeletePrompt ? (
              <button
                onClick={() => setShowDeletePrompt(true)}
                className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 rounded-[6px] px-3 py-1.5 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={12} strokeWidth={2} />
                Delete my account
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-[6px] p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-xs text-red-800 font-medium leading-snug">
                    This action cannot be undone. Your account will be permanently deactivated.
                  </p>
                </div>
                <Field label={'Type DELETE to confirm'}>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className={confirmMatch ? "border-red-400 focus:border-red-500" : ""}
                  />
                </Field>
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (confirmMatch) setDeleted(true); }}
                    disabled={!confirmMatch}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[6px] border transition-colors cursor-pointer
                      ${confirmMatch
                        ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                        : "bg-red-100 text-red-300 border-red-200 cursor-not-allowed"
                      }`}
                  >
                    <Trash2 size={12} strokeWidth={2} />
                    Permanently delete
                  </button>
                  <button
                    onClick={() => { setShowDeletePrompt(false); setDeleteConfirm(""); }}
                    className="text-xs text-[#6b7280] border border-[#d1d5db] rounded-[6px] px-3 py-1.5 hover:bg-[#f9fafb] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
