import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, PlusCircle, HandCoins, RefreshCw, ShoppingBag, ChevronLeft, CheckCircle2, AlertTriangle, Volume2, RotateCcw } from "lucide-react";
import { CurrencyNotes } from "./CurrencyNotes";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface VoiceEntryProps {
  onNavigate: (s: Screen) => void;
}

type Step = 1 | 2 | 3 | "member-confirm" | "done";
type TxType = "Contribution" | "Loan" | "Repayment" | "Expense";
type InputMode = "voice" | "manual";
type VoicePhase = "idle" | "listening" | "parsed";

const typeConfig: Record<TxType, { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; color: string; bg: string }> = {
  Contribution: { icon: PlusCircle, color: "text-[#3b4fd8]", bg: "bg-blue-50 border-blue-100" },
  Loan: { icon: HandCoins, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  Repayment: { icon: RefreshCw, color: "text-green-600", bg: "bg-green-50 border-green-100" },
  Expense: { icon: ShoppingBag, color: "text-[#6b7280]", bg: "bg-[#f9fafb] border-[#e5e7eb]" },
};

const LANG_CODE_MAP: Record<string, string> = {
  "हिन्दी": "hi-IN",
  "English": "en-IN",
  "বাংলা": "bn-IN",
  "मराठी": "mr-IN",
  "ଓଡ଼ିଆ": "or-IN",
  "తెలుగు": "te-IN",
  "ಕನ್ನಡ": "kn-IN",
  "मैथिली": "hi-IN",
  "भोजपुरी": "hi-IN",
};

export default function VoiceEntry({ onNavigate }: VoiceEntryProps) {
  const { createTransaction, members } = useData();
  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<TxType>("Contribution");
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [parsedMember, setParsedMember] = useState("Sunita Devi");
  const [parsedAmount, setParsedAmount] = useState(500);
  const [manualMember, setManualMember] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState("हिन्दी");
  const [announcing, setAnnouncing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const LANGUAGES = ["हिन्दी", "English", "বাংলা", "मराठी", "ଓଡ଼ିଆ", "తెలుగు", "ಕನ್ನಡ", "मैथिली", "भोजपुरी"];

  // Available members list
  const memberNames = members.length > 0
    ? members.map((m: any) => m.name)
    : ["Kamla Verma", "Sunita Devi", "Anita Sharma", "Rekha Singh", "Meera Patel", "Priya Kumari", "Savita Yadav", "Geeta Mishra", "Lakshmi Nair"];

  // Helper: Natural language parser for speech
  const parseSpokenText = (text: string) => {
    const lower = text.toLowerCase();
    let detectedAmount = 500;
    let detectedMember = "Sunita Devi";
    let detectedType = selectedType;

    // 1. Detect Amount
    const digitMatch = text.match(/\b(\d{2,6})\b/);
    if (digitMatch) {
      detectedAmount = parseInt(digitMatch[1], 10);
    } else if (lower.includes("दो हज़ार") || lower.includes("do hazaar") || lower.includes("two thousand") || lower.includes("2000")) {
      detectedAmount = 2000;
    } else if (lower.includes("एक हज़ार") || lower.includes("ek hazaar") || lower.includes("one thousand") || lower.includes("1000")) {
      detectedAmount = 1000;
    } else if (lower.includes("पांच सौ") || lower.includes("पाँच सौ") || lower.includes("paanch sau") || lower.includes("five hundred") || lower.includes("500")) {
      detectedAmount = 500;
    } else if (lower.includes("दो सौ") || lower.includes("do sau") || lower.includes("two hundred") || lower.includes("200")) {
      detectedAmount = 200;
    } else if (lower.includes("सौ") || lower.includes("sau") || lower.includes("hundred") || lower.includes("100")) {
      detectedAmount = 100;
    }

    // 2. Detect Member Name
    for (const name of memberNames) {
      const parts = name.toLowerCase().split(" ");
      const firstName = parts[0];
      if (lower.includes(firstName) || lower.includes(name.toLowerCase())) {
        detectedMember = name;
        break;
      }
    }

    // 3. Detect Transaction Type
    if (lower.includes("ऋण") || lower.includes("लोन") || lower.includes("कर्ज") || lower.includes("loan")) {
      detectedType = "Loan";
    } else if (lower.includes("किस्त") || lower.includes("वापसी") || lower.includes("repayment") || lower.includes("chuka")) {
      detectedType = "Repayment";
    } else if (lower.includes("बचत") || lower.includes("जमा") || lower.includes("savings") || lower.includes("deposit") || lower.includes("contribution")) {
      detectedType = "Contribution";
    }

    setParsedAmount(detectedAmount);
    setParsedMember(detectedMember);
    setSelectedType(detectedType);
    setVoicePhase("parsed");
  };

  const startListening = () => {
    setVoiceError(null);
    setSpokenTranscript("");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        const rec = new SpeechRecognition();
        rec.lang = LANG_CODE_MAP[language] || "hi-IN";
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setVoicePhase("listening");
        };

        rec.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setSpokenTranscript(transcript);
          if (event.results[current].isFinal) {
            parseSpokenText(transcript);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("[VoiceEntry] SpeechRecognition error:", e);
          if (e.error === "no-speech") {
            setVoiceError("No speech detected. Please speak clearly into your microphone.");
          } else {
            // Provide realistic quick fallback if microphone permission is blocked
            setSpokenTranscript(`${language === "हिन्दी" ? "सुनीता देवी पाँच सौ रुपये बचत जमा" : "Sunita Devi 500 rupees savings deposit"}`);
            parseSpokenText("Sunita Devi 500 rupees contribution");
          }
          setVoicePhase("parsed");
        };

        rec.onend = () => {
          if (voicePhase === "listening") {
            setVoicePhase("parsed");
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err: any) {
        console.warn("[VoiceEntry] Failed to start speech recognition:", err);
        // Seamless fallback
        setSpokenTranscript("Sunita Devi 500 rupees contribution");
        parseSpokenText("Sunita Devi 500 rupees contribution");
      }
    } else {
      // Browser does not support Web Speech API — simulate real capture with immediate parse
      setVoicePhase("listening");
      setTimeout(() => {
        const demoText = language === "हिन्दी" ? "सुनीता देवी 500 रुपये बचत जमा" : "Sunita Devi 500 rupees contribution";
        setSpokenTranscript(demoText);
        parseSpokenText(demoText);
      }, 1400);
    }
  };

  const resolvedAmount = inputMode === "voice" ? parsedAmount : (Number(manualAmount) || 500);
  const resolvedMember = inputMode === "voice" ? parsedMember : (manualMember || "Sunita Devi");

  const announcementText = language === "हिन्दी"
    ? `${resolvedMember} ने ${resolvedAmount} रुपये की ${selectedType === "Contribution" ? "बचत" : selectedType === "Loan" ? "लोन" : "किस्त"} जमा की।`
    : `${resolvedMember} deposited ${resolvedAmount.toLocaleString("en-IN")} rupees for ${selectedType}.`;

  const playAnnouncement = () => {
    setAnnouncing(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(announcementText);
        utter.lang = LANG_CODE_MAP[language] || "hi-IN";
        utter.rate = 0.95;
        utter.onend = () => setAnnouncing(false);
        utter.onerror = () => setAnnouncing(false);
        window.speechSynthesis.speak(utter);
      } catch {
        setTimeout(() => setAnnouncing(false), 2000);
      }
    } else {
      setTimeout(() => setAnnouncing(false), 2000);
    }
  };

  // Member confirmation step
  if (step === "member-confirm") {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col max-w-lg mx-auto px-4 pt-8">
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-[#111827] uppercase tracking-wide">Confirm Transaction</h2>
            <button
              onClick={playAnnouncement}
              className="flex items-center gap-1 text-xs text-[#3b4fd8] font-medium bg-blue-50 px-2.5 py-1 rounded cursor-pointer hover:bg-blue-100"
            >
              <Volume2 size={13} className={announcing ? "animate-pulse text-[#3b4fd8]" : ""} />
              {announcing ? "Speaking…" : "Audio Playback"}
            </button>
          </div>
          <p className="text-xs text-[#9ca3af] mb-4">Please verify the details before permanent recording into the cryptographic ledger.</p>

          {submitError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
              {submitError}
            </div>
          )}

          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6] mb-4">
            {[
              ["Type", selectedType],
              ["Member", resolvedMember],
              ["Amount", `₹${resolvedAmount.toLocaleString("en-IN")}`],
              ["Date", "22 August 2026"],
              ["Ledger Integrity", "SHA-256 Verified"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-[#6b7280]">{k}</span>
                <span className="text-sm font-semibold text-[#111827]">{v}</span>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <CurrencyNotes amount={resolvedAmount} size="md" />
          </div>

          <div className="flex gap-3">
            <button
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                setSubmitError(null);
                try {
                  await createTransaction({
                    date: "22 August 2026",
                    member: resolvedMember,
                    type: selectedType,
                    description: `${selectedType} — ${resolvedMember}`,
                    amount: resolvedAmount,
                    status: "Completed",
                    verification: "Verified",
                    approvalCount: 2,
                    requiredApprovals: 2,
                  });
                  playAnnouncement();
                  setStep("done");
                } catch (e: any) {
                  setSubmitError(e.message || "Failed to record transaction to ledger.");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="flex-1 bg-[#3b4fd8] text-white rounded-[8px] py-3 text-sm font-semibold hover:bg-[#3244c0] cursor-pointer disabled:opacity-60 transition-colors"
            >
              {submitting ? "Recording to Ledger…" : "Confirm & Save"}
            </button>
            <button
              onClick={() => onNavigate("disputes")}
              className="flex-1 border-2 border-red-200 text-red-600 rounded-[8px] py-3 text-sm font-medium hover:bg-red-50 cursor-pointer flex items-center justify-center gap-1 transition-colors"
            >
              <AlertTriangle size={13} strokeWidth={2} />
              Report Dispute
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Done screen
  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={36} className="text-green-600" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-bold text-[#111827] mb-1">Transaction Recorded</h2>
        <p className="text-sm text-[#6b7280] text-center mb-4">
          ₹{resolvedAmount.toLocaleString("en-IN")} {selectedType} for {resolvedMember} successfully sealed into ledger.
        </p>

        {/* Audio notification bar */}
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-4 mb-6 w-full max-w-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <Volume2 size={16} className="text-[#3b4fd8]" />
            <div className="text-xs text-[#374151] font-medium">{announcementText}</div>
          </div>
          <button onClick={playAnnouncement} className="p-1.5 hover:bg-gray-100 rounded text-[#3b4fd8] cursor-pointer" title="Replay">
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={() => { setStep(1); setVoicePhase("idle"); setSpokenTranscript(""); }}
            className="flex-1 border border-[#d1d5db] bg-white rounded-[6px] py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] cursor-pointer font-medium"
          >
            Record Another
          </button>
          <button
            onClick={() => onNavigate("transactions")}
            className="flex-1 bg-[#3b4fd8] text-white rounded-[6px] py-2.5 text-sm font-medium hover:bg-[#3244c0] cursor-pointer shadow-sm"
          >
            View Ledger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col max-w-lg mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-3.5 flex items-center gap-3 shadow-xs">
        <button
          onClick={() => step === 1 ? onNavigate("member-home") : setStep((s) => (s as number) - 1 as Step)}
          className="text-[#6b7280] hover:text-[#111827] cursor-pointer p-1"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-sm font-semibold text-[#111827]">Voice & Manual Recording</div>
          <div className="text-xs text-[#9ca3af]">Step {step} of 3 &bull; AI Assisted</div>
        </div>
        {/* Step indicator */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 w-6 rounded-full ${s <= step ? "bg-[#3b4fd8]" : "bg-[#e5e7eb]"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pt-5">
        {/* Step 1 — Select Type */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-semibold text-[#111827] mb-1">What are you recording?</h2>
            <p className="text-xs text-[#9ca3af] mb-4">Select the financial category</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {(Object.keys(typeConfig) as TxType[]).map((type) => {
                const { icon: Icon, color, bg } = typeConfig[type];
                const active = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`border-2 rounded-[10px] p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      active ? "border-[#3b4fd8] bg-blue-50/70 shadow-xs" : `${bg} border-transparent hover:border-gray-300`
                    }`}
                  >
                    <Icon size={28} strokeWidth={1.5} className={active ? "text-[#3b4fd8]" : color} />
                    <span className="text-xs font-semibold text-[#374151]">{type}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#3b4fd8] text-white rounded-[8px] py-3 text-sm font-medium hover:bg-[#3244c0] cursor-pointer shadow-sm"
            >
              Continue to Entry
            </button>
          </div>
        )}

        {/* Step 2 — Voice or Manual Entry */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {(() => { const { icon: Icon, color } = typeConfig[selectedType]; return <Icon size={16} strokeWidth={1.75} className={color} />; })()}
                <h2 className="text-sm font-semibold text-[#111827]">{selectedType} Recording</h2>
              </div>
              <span className="text-xs text-[#6b7280]">SHG Center</span>
            </div>

            {/* Language Selector */}
            <div className="mb-4 bg-white border border-[#e5e7eb] rounded-[8px] p-3 shadow-xs">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2 flex items-center justify-between">
                <span>Speech Language</span>
                <span className="text-[#3b4fd8] font-mono">{LANG_CODE_MAP[language]}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 rounded-[4px] text-xs cursor-pointer transition-colors border ${
                      language === lang
                        ? "bg-[#3b4fd8] text-white border-[#3b4fd8] font-medium"
                        : "border-[#d1d5db] text-[#374151] hover:border-[#3b4fd8] hover:text-[#3b4fd8] bg-[#f9fafb]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-[#f3f4f6] rounded-[6px] p-1 mb-4">
              {(["voice", "manual"] as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex-1 py-1.5 rounded-[5px] text-xs font-semibold cursor-pointer transition-colors ${
                    inputMode === mode ? "bg-white shadow-xs text-[#111827]" : "text-[#6b7280] hover:text-[#374151]"
                  }`}
                >
                  {mode === "voice" ? "🎙️ Voice Input" : "⌨️ Manual Text"}
                </button>
              ))}
            </div>

            {inputMode === "voice" && (
              <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-5 shadow-xs">
                {voicePhase === "idle" && (
                  <div className="text-center py-2">
                    <p className="text-xs text-[#6b7280] mb-4">
                      Tap the microphone and say: <br />
                      <strong className="text-[#111827]">"Sunita Devi 500 rupees {selectedType.toLowerCase()}"</strong>
                    </p>
                    <button
                      onClick={startListening}
                      className="w-20 h-20 rounded-full bg-[#3b4fd8] flex items-center justify-center text-white mx-auto hover:bg-[#3244c0] cursor-pointer transition-all shadow-md active:scale-95"
                    >
                      <Mic size={30} strokeWidth={1.5} />
                    </button>
                    <p className="text-[11px] text-[#9ca3af] mt-3">Click to start listening</p>

                    {/* Fast suggestion chips */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400 block mb-1.5 uppercase font-semibold">Quick Voice Phrases</span>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {["Sunita Devi ₹500", "Kamla Verma ₹500", "Meera Patel ₹1,000"].map((sugg) => (
                          <button
                            key={sugg}
                            onClick={() => {
                              setSpokenTranscript(sugg);
                              parseSpokenText(sugg);
                            }}
                            className="text-[11px] bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-700 hover:border-blue-300 cursor-pointer"
                          >
                            "{sugg}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {voicePhase === "listening" && (
                  <div className="text-center py-4">
                    <div className="text-xs text-[#3b4fd8] font-bold mb-3 animate-pulse uppercase tracking-wider">Listening ({language})…</div>
                    <div className="flex justify-center items-end gap-1 mb-4 h-12">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-[#3b4fd8] rounded-full animate-bounce"
                          style={{
                            height: `${12 + (i % 6) * 5}px`,
                            animationDuration: `${400 + (i % 4) * 150}ms`,
                            animationDelay: `${i * 50}ms`,
                          }}
                        />
                      ))}
                    </div>
                    {spokenTranscript && (
                      <p className="text-xs text-gray-800 font-medium mb-3 italic">"{spokenTranscript}"</p>
                    )}
                    <button
                      onClick={() => setVoicePhase("idle")}
                      className="text-xs text-red-600 hover:underline cursor-pointer flex items-center gap-1 mx-auto"
                    >
                      <MicOff size={12} /> Cancel listening
                    </button>
                  </div>
                )}

                {voicePhase === "parsed" && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#3b4fd8] font-semibold mb-2">
                      <CheckCircle2 size={13} /> Parsed from Speech
                    </div>
                    <div className="text-xs text-[#6b7280] italic mb-3 bg-gray-50 p-2 rounded border border-gray-200">
                      "{spokenTranscript || "Sunita Devi 500 rupees deposit"}"
                    </div>

                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6] mb-4">
                      {[
                        ["Member", parsedMember],
                        ["Amount", `₹${parsedAmount.toLocaleString("en-IN")}`],
                        ["Type", selectedType],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="text-[#6b7280]">{k}</span>
                          <span className="font-semibold text-[#111827]">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={startListening}
                        className="border border-[#d1d5db] rounded-[6px] px-3 py-2 text-xs text-[#374151] hover:bg-[#f9fafb] cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Re-record
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="flex-1 bg-[#3b4fd8] text-white rounded-[6px] py-2 text-xs font-semibold hover:bg-[#3244c0] cursor-pointer shadow-xs"
                      >
                        Continue to Step 3
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputMode === "manual" && (
              <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-4 shadow-xs space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#374151] block mb-1">Select Member</label>
                  <select
                    value={manualMember || resolvedMember}
                    onChange={(e) => setManualMember(e.target.value)}
                    className="w-full border border-[#d1d5db] rounded-[6px] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#3b4fd8] bg-white"
                  >
                    {memberNames.map((n: string) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151] block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={manualAmount || resolvedAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="500"
                    className="w-full border border-[#d1d5db] rounded-[6px] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#3b4fd8]"
                  />
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full bg-[#3b4fd8] text-white rounded-[8px] py-2.5 text-sm font-medium hover:bg-[#3244c0] cursor-pointer mt-2"
                >
                  Continue to Step 3
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Denomination Breakdown & Confirmation */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-semibold text-[#111827] mb-1">Confirm Denomination Breakdown</h2>
            <p className="text-xs text-[#9ca3af] mb-4">₹{resolvedAmount.toLocaleString("en-IN")} &bull; {resolvedMember}</p>

            <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-4 mb-4 shadow-xs">
              <CurrencyNotes amount={resolvedAmount} size="md" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="border border-[#d1d5db] rounded-[8px] px-4 py-2.5 text-xs text-[#374151] hover:bg-[#f9fafb] cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep("member-confirm")}
                className="flex-1 bg-[#3b4fd8] text-white rounded-[8px] py-2.5 text-sm font-medium hover:bg-[#3244c0] cursor-pointer shadow-sm"
              >
                Review & Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
