import { useState } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button, Field, Input, Select, Textarea, PageShell, Alert } from "./ui";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface CreateTransactionProps {
  onNavigate: (s: Screen) => void;
}

export default function CreateTransaction({ onNavigate }: CreateTransactionProps) {
  const { createTransaction, members } = useData();
  const [step, setStep] = useState<"form" | "review" | "submitted">("form");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "Contribution", member: "", amount: "", date: "2026-08-22", description: "" });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createTransaction({ type: form.type, member: form.member, amount: Number(form.amount), date: form.date, description: form.description });
      setStep("submitted");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create transaction. Please check your network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "submitted") {
    return (
      <PageShell>
        <div className="max-w-lg">
          <div className="bg-green-50 border border-green-200 rounded-[6px] px-6 py-8 text-center">
            <CheckCircle2 size={36} className="text-green-600 mx-auto mb-3" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-[#111827] mb-1">Transaction created</h2>
            <p className="text-sm text-[#6b7280] mb-4">Recorded and added to the ledger. Approval required before finalization.</p>
            <div className="bg-white border border-green-200 rounded-[6px] px-4 py-3 text-left mb-4">
              <div className="text-xs text-[#6b7280] mb-0.5">Transaction type</div>
              <div className="font-medium text-sm">{form.type}</div>
              <div className="text-sm text-[#374151]">₹{Number(form.amount).toLocaleString("en-IN")}</div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => onNavigate("approvals")}>Go to Approvals</Button>
              <Button onClick={() => { setStep("form"); setForm({ type: "Contribution", member: "", amount: "", date: "2026-08-22", description: "" }); }}>New transaction</Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (step === "review") {
    return (
      <PageShell>
        <div className="max-w-lg">
          <button onClick={() => setStep("form")} className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mb-5 cursor-pointer">
            <ChevronLeft size={15} /> Edit
          </button>
          <h1 className="text-lg font-semibold mb-4">Review transaction</h1>
          {submitError && (
            <div className="mb-4">
              <Alert variant="danger" title="Submission Failed">
                {submitError}
              </Alert>
            </div>
          )}
          <Alert variant="info" title="Review before submitting">
            Once submitted, this transaction will require approval before being added to the verified ledger.
          </Alert>
          <div className="bg-white border border-[#e5e7eb] rounded-[6px] mt-4 divide-y divide-[#e5e7eb]">
            {[["Type", form.type], ["Member", form.member || "—"], ["Amount", `₹${Number(form.amount || 0).toLocaleString("en-IN")}`], ["Date", form.date], ["Description", form.description || "—"]].map(([label, value]) => (
              <div key={label} className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">{label}</span>
                <span className="text-sm font-medium text-[#111827]">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setStep("form")}>Edit</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit for approval"}</Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-lg">
        <button onClick={() => onNavigate("transactions")} className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mb-5 cursor-pointer">
          <ChevronLeft size={15} /> Transactions
        </button>
        <h1 className="text-lg font-semibold mb-4">New Transaction</h1>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-5">
          <div className="space-y-4">
            <Field label="Transaction type">
              <Select value={form.type} onChange={(e) => update("type", e.target.value)}>
                <option>Contribution</option>
                <option>Loan</option>
                <option>Repayment</option>
                <option>Expense</option>
                <option>Withdrawal</option>
                <option>Other</option>
              </Select>
            </Field>
            <Field label="Member">
              <Select value={form.member} onChange={(e) => update("member", e.target.value)}>
                <option value="">Select member</option>
                {members.map((m: any) => <option key={m.id}>{m.name}</option>)}
              </Select>
            </Field>
            <Field label="Amount (₹)">
              <Input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)} placeholder="0" min="1" />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Brief description of this transaction" rows={3} />
            </Field>
            <Field label="Supporting document" hint="Photo or scan of receipt, passbook entry, or agreement (optional)">
              <div className="border border-dashed border-[#d1d5db] rounded-[6px] px-4 py-4 text-center text-xs text-[#9ca3af] cursor-pointer hover:bg-[#f9fafb] transition-colors">
                Click to attach file or drag here
              </div>
            </Field>
          </div>
          <div className="flex gap-2 mt-5 pt-4 border-t border-[#e5e7eb]">
            <Button variant="outline" onClick={() => onNavigate("transactions")}>Cancel</Button>
            <Button onClick={() => setStep("review")} disabled={!form.amount || !form.member}>Review &rarr;</Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
