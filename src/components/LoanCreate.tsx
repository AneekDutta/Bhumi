import { useState } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button, Field, Input, Select, Textarea, PageShell, Alert } from "./ui";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface LoanCreateProps {
  onNavigate: (s: Screen) => void;
}

export default function LoanCreate({ onNavigate }: LoanCreateProps) {
  const { createLoan, members } = useData();
  const [step, setStep] = useState<"form" | "review" | "submitted">("form");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    borrower: "",
    amount: "",
    termsMonths: "10",
    frequency: "Monthly",
    startDate: "2026-08-22",
    notes: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createLoan({
        member: form.borrower,
        principal: Number(form.amount),
        termsMonths: Number(form.termsMonths),
        frequency: form.frequency,
        startDate: form.startDate,
        notes: form.notes,
      });
      setStep("submitted");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit loan request.");
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
            <h2 className="text-base font-semibold text-[#111827] mb-1">Loan request submitted</h2>
            <p className="text-sm text-[#6b7280] mb-4">Awaiting Treasurer and Group Leader approval before disbursement.</p>
            <div className="bg-white border border-green-200 rounded-[6px] px-4 py-3 text-left mb-4 space-y-1">
              {[["Borrower", form.borrower || "—"], ["Amount", `₹${Number(form.amount || 0).toLocaleString("en-IN")}`], ["Terms", `${form.termsMonths} months`]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => onNavigate("approvals")}>Go to Approvals</Button>
              <Button onClick={() => onNavigate("loans")}>View Loans</Button>
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
          <h1 className="text-lg font-semibold mb-4">Review Loan</h1>
          {submitError && (
            <div className="mb-4">
              <Alert variant="danger" title="Submission Failed">
                {submitError}
              </Alert>
            </div>
          )}
          <Alert variant="info" title="Approval required">
            This loan will not be disbursed until it receives required approvals from the Treasurer and Group Leader.
          </Alert>
          <div className="bg-white border border-[#e5e7eb] rounded-[6px] mt-4 divide-y divide-[#e5e7eb]">
            {[
              ["Borrower", form.borrower || "—"],
              ["Amount", `₹${Number(form.amount || 0).toLocaleString("en-IN")}`],
              ["Terms", `${form.termsMonths} monthly repayments`],
              ["Frequency", form.frequency],
              ["Start date", form.startDate],
              ["Notes", form.notes || "—"],
            ].map(([k, v]) => (
              <div key={k} className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">{k}</span>
                <span className="text-sm font-medium text-[#111827]">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setStep("form")}>Edit</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting…" : "Submit for Approval"}</Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-lg">
        <button onClick={() => onNavigate("loans")} className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mb-5 cursor-pointer">
          <ChevronLeft size={15} /> Loans
        </button>
        <h1 className="text-lg font-semibold mb-4">New Loan</h1>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-5">
          <div className="space-y-4">
            <Field label="Borrower">
              <Select value={form.borrower} onChange={(e) => update("borrower", e.target.value)}>
                <option value="">Select member</option>
                {members.length > 0
                  ? members.map((m: any) => <option key={m.id} value={m.name}>{m.name}</option>)
                  : ["Kamla Verma", "Sunita Devi", "Anita Sharma", "Rekha Singh", "Meera Patel", "Priya Kumari", "Savita Yadav", "Lakshmi Nair"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
              </Select>
            </Field>
            <Field label="Loan amount (₹)">
              <Input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)} placeholder="0" min="100" />
            </Field>
            <Field label="Repayment terms (months)">
              <Select value={form.termsMonths} onChange={(e) => update("termsMonths", e.target.value)}>
                {["3", "6", "10", "12", "18", "24"].map((v) => <option key={v} value={v}>{v} months</option>)}
              </Select>
            </Field>
            <Field label="Repayment frequency">
              <Select value={form.frequency} onChange={(e) => update("frequency", e.target.value)}>
                <option>Monthly</option>
                <option>Bi-weekly</option>
                <option>Weekly</option>
              </Select>
            </Field>
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </Field>
            <Field label="Notes" hint="Purpose of loan or any additional information">
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="e.g. Business expansion, medical emergency…" rows={2} />
            </Field>
          </div>
          <div className="flex gap-2 mt-5 pt-4 border-t border-[#e5e7eb]">
            <Button variant="outline" onClick={() => onNavigate("loans")}>Cancel</Button>
            <Button onClick={() => setStep("review")} disabled={!form.amount || !form.borrower}>Review &rarr;</Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
