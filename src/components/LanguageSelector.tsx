import { useState, useRef, useEffect } from "react";
import { Languages, Check, Globe } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from "../LanguageContext";

interface LanguageSelectorProps {
  variant?: "header" | "sidebar" | "settings" | "login";
}

export default function LanguageSelector({ variant = "header" }: LanguageSelectorProps) {
  const { language, setLanguage, languageOption } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (variant === "settings") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`p-3 rounded-[6px] border text-left cursor-pointer transition-all flex items-center justify-between ${
                active
                  ? "bg-blue-50/80 border-[#3b4fd8] text-[#3b4fd8] font-bold shadow-xs"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <div>
                <div className="text-sm font-semibold">{lang.nativeName}</div>
                <div className="text-[10px] text-gray-500">{lang.name}</div>
              </div>
              {active && <Check size={14} className="text-[#3b4fd8]" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
          variant === "sidebar"
            ? "bg-white/10 text-white/90 hover:bg-white/20"
            : variant === "login"
            ? "bg-white/80 border border-gray-200 text-gray-700 hover:bg-white shadow-xs"
            : "bg-white/15 text-white hover:bg-white/25"
        }`}
        title="Change App Language"
      >
        <Globe size={13} />
        <span>{languageOption.nativeName}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-[8px] shadow-xl py-1.5 z-50 text-xs text-gray-800 max-h-72 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
            Choose Language / भाषा चुनें
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left cursor-pointer flex items-center justify-between transition-colors ${
                  active ? "bg-blue-50 text-[#3b4fd8] font-bold" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{lang.nativeName}</div>
                  <div className="text-[10px] text-gray-400">{lang.name}</div>
                </div>
                {active && <Check size={14} className="text-[#3b4fd8]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
