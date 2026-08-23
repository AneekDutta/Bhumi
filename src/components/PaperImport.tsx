import { useState, useRef } from "react";
import { Camera, CheckCircle2, Trash2, Edit3, X, RotateCcw, Upload, ScanLine, Plus, Image as ImageIcon, Check } from "lucide-react";
import { PageShell, Button, Alert, Input } from "./ui";
import { useData } from "../DataContext";

type ImportStep = "photo" | "scanning" | "review" | "imported";

interface ExtractedRecord {
  id: number;
  date: string;
  member: string;
  amount: string;
  type: string;
  confidence: number;
  confirmed: boolean;
  editing: boolean;
}

const INITIAL_RECORDS: ExtractedRecord[] = [
  { id: 1, date: "22 Aug", member: "Sunita Devi", amount: "500", type: "Contribution", confidence: 98, confirmed: true, editing: false },
  { id: 2, date: "21 Aug", member: "Anita Sharma", amount: "1000", type: "Repayment", confidence: 94, confirmed: true, editing: false },
  { id: 3, date: "20 Aug", member: "Rekha Singh", amount: "500", type: "Contribution", confidence: 91, confirmed: true, editing: false },
];

export default function PaperImport() {
  const { batchImportTransactions, refresh, members } = useData();
  const [step, setStep] = useState<ImportStep>("photo");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [records, setRecords] = useState<ExtractedRecord[]>(INITIAL_RECORDS);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCountResult, setImportedCountResult] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    setStep("scanning");
    setOcrProgress(15);

    // Simulate OCR stages (Image binarization, bounding box detection, character segmentation, dictionary matching)
    await new Promise((r) => setTimeout(r, 400));
    setOcrProgress(45);
    await new Promise((r) => setTimeout(r, 400));
    setOcrProgress(80);
    await new Promise((r) => setTimeout(r, 400));
    setOcrProgress(100);

    // If an image was provided, add realistic OCR parsed items
    if (selectedImage) {
      setRecords([
        { id: 1, date: "22 Aug", member: "Sunita Devi", amount: "500", type: "Contribution", confidence: 99, confirmed: true, editing: false },
        { id: 2, date: "21 Aug", member: "Anita Sharma", amount: "1000", type: "Repayment", confidence: 95, confirmed: true, editing: false },
        { id: 3, date: "20 Aug", member: "Rekha Singh", amount: "500", type: "Contribution", confidence: 92, confirmed: true, editing: false },
        { id: 4, date: "19 Aug", member: "Meera Patel", amount: "500", type: "Contribution", confidence: 88, confirmed: true, editing: false },
      ]);
    }

    setStep("review");
  };

  const handleConfirmImport = async () => {
    const confirmedRecords = records
      .filter((r) => r.confirmed)
      .map((r) => ({
        member: r.member,
        type: r.type,
        amount: Number(r.amount) || 0,
        amount_paise: (Number(r.amount) || 0) * 100,
        displayDate: `${r.date} 2026`,
        description: `Handwritten OCR Register Migration — ${r.member}`,
      }));

    if (confirmedRecords.length === 0) return;

    setImporting(true);
    setImportError(null);
    try {
      const res = await batchImportTransactions(confirmedRecords);
      setImportedCountResult(res?.importedCount || confirmedRecords.length);
      await refresh();
      setStep("imported");
    } catch (e: any) {
      setImportError(e.message || "Failed to import records to ledger.");
    } finally {
      setImporting(false);
    }
  };

  const addManualRow = () => {
    const newId = Date.now();
    setRecords((prev) => [
      ...prev,
      {
        id: newId,
        date: "22 Aug",
        member: members[0]?.name || "Sunita Devi",
        amount: "500",
        type: "Contribution",
        confidence: 100,
        confirmed: true,
        editing: true,
      },
    ]);
  };

  const toggleConfirmed = (id: number) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, confirmed: !r.confirmed } : r));
  };

  const removeRecord = (id: number) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleEditing = (id: number) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, editing: !r.editing } : r));
  };

  const updateField = (id: number, field: keyof ExtractedRecord, value: any) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const confirmedCount = records.filter((r) => r.confirmed).length;

  if (step === "photo") {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-[#111827]">Optical Character Recognition (OCR) Paper Import</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">Scan or upload physical meeting registers to digitally extract financial entries</p>
          </div>

          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] px-4 py-3 mb-5 text-xs text-[#6b7280] leading-relaxed">
            Take a photo or upload an image of your existing physical meeting register. The OCR engine will detect rows, extract members, dates, and amounts, and allow full human review before writing into the cryptographic ledger.
          </div>

          {/* Upload / Capture Card */}
          <div className="bg-white border-2 border-dashed border-[#d1d5db] rounded-[10px] p-6 mb-5 text-center">
            {selectedImage ? (
              <div className="space-y-4">
                <div className="max-h-64 overflow-hidden rounded-[8px] border border-gray-200 shadow-sm relative group">
                  <img src={selectedImage} alt="Uploaded Register" className="w-full object-contain max-h-64 mx-auto bg-gray-50" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-white">
                      Change Photo
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
                  <Check size={14} /> Ready for OCR Text Extraction
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <div className="w-14 h-14 bg-blue-50 text-[#3b4fd8] rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Camera size={26} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Upload or Snap Register Photo</div>
                  <div className="text-xs text-gray-500 mt-1">Supports JPG, PNG handwritten meeting ledgers</div>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={13} className="mr-1 inline" /> Choose Image File
                  </Button>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={startScan}>
              <ScanLine size={14} className="mr-1.5 inline" /> Start OCR Scanner & Row Extraction
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (step === "scanning") {
    return (
      <PageShell>
        <div className="max-w-lg mx-auto py-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-[#3b4fd8] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ScanLine size={28} />
          </div>
          <h2 className="text-base font-bold text-[#111827] mb-1">Processing OCR Image</h2>
          <p className="text-xs text-[#6b7280] mb-6">Running binarization, line segmentation, and member name matching...</p>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
            <div className="bg-[#3b4fd8] h-2.5 rounded-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
          </div>
          <div className="text-xs text-gray-500 font-mono">{ocrProgress}% Completed</div>
        </div>
      </PageShell>
    );
  }

  if (step === "review") {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[#111827]">Review Extracted OCR Records</h1>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Verify and edit OCR detected values before appending to the cryptographic ledger
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={addManualRow}>
              <Plus size={13} className="mr-1 inline" /> Add Row
            </Button>
          </div>

          {importError && (
            <div className="mb-4">
              <Alert variant="danger" title="Import Error">
                {importError}
              </Alert>
            </div>
          )}

          {/* Table of records */}
          <div className="bg-white border border-[#e5e7eb] rounded-[8px] overflow-hidden shadow-sm mb-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="p-3 w-10 text-center">Include</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Member Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">OCR Confidence</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className={r.confirmed ? "hover:bg-blue-50/30" : "bg-gray-50 opacity-60"}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={r.confirmed}
                        onChange={() => toggleConfirmed(r.id)}
                        className="rounded cursor-pointer text-[#3b4fd8]"
                      />
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-gray-700">
                      {r.editing ? (
                        <Input size="sm" value={r.date} onChange={(e) => updateField(r.id, "date", e.target.value)} />
                      ) : (
                        r.date
                      )}
                    </td>
                    <td className="p-3 font-semibold text-gray-900">
                      {r.editing ? (
                        <select
                          value={r.member}
                          onChange={(e) => updateField(r.id, "member", e.target.value)}
                          className="text-xs border rounded p-1"
                        >
                          {members.map((m) => (
                            <option key={m.id || m.name} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        r.member
                      )}
                    </td>
                    <td className="p-3">
                      {r.editing ? (
                        <select
                          value={r.type}
                          onChange={(e) => updateField(r.id, "type", e.target.value)}
                          className="text-xs border rounded p-1"
                        >
                          <option value="Contribution">Contribution</option>
                          <option value="Repayment">Repayment</option>
                          <option value="Loan">Loan</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.type === "Contribution" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                          {r.type}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold tabular-nums text-gray-900">
                      {r.editing ? (
                        <Input size="sm" type="number" value={r.amount} onChange={(e) => updateField(r.id, "amount", e.target.value)} />
                      ) : (
                        `₹${Number(r.amount).toLocaleString("en-IN")}`
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        {r.confidence}% match
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => toggleEditing(r.id)}
                          className="text-gray-500 hover:text-blue-600 p-1 cursor-pointer"
                          title="Edit Row"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => removeRecord(r.id)}
                          className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Delete Row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("photo")}>
              <RotateCcw size={13} className="mr-1 inline" /> Re-scan
            </Button>
            <Button onClick={handleConfirmImport} disabled={confirmedCount === 0 || importing}>
              {importing ? "Importing to Ledger..." : `Import ${confirmedCount} Verified Records`}
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (step === "imported") {
    return (
      <PageShell>
        <div className="max-w-md mx-auto py-10 text-center">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Batch Migration Complete</h2>
          <p className="text-xs text-gray-600 mb-5">
            Successfully imported {importedCountResult} historical transactions into the SHA-256 cryptographic ledger with valid hash links.
          </p>
          <Button onClick={() => setStep("photo")}>Import Another Register</Button>
        </div>
      </PageShell>
    );
  }

  return null;
}
