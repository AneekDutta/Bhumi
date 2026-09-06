"use client";

import React from "react";
import { FileText, Upload, Trash2 } from "lucide-react";

export interface FieldDocument {
  id: string;
  name: string;
  sizeBytes: number;
  category: "aadhaar" | "mutation_deed" | "ror_extract" | "objection_notice" | "other";
  timestamp: string;
}

interface DocumentUploadProps {
  documents: FieldDocument[];
  onAddDocument: (doc: FieldDocument) => void;
  onRemoveDocument: (id: string) => void;
}

export function DocumentUpload({
  documents,
  onAddDocument,
  onRemoveDocument
}: DocumentUploadProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newDoc: FieldDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      sizeBytes: file.size,
      category: "mutation_deed",
      timestamp: new Date().toLocaleTimeString()
    };
    onAddDocument(newDoc);
    e.target.value = "";
  };

  return (
    <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0B2E59] dark:text-white">
          <FileText className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
          <span>Statutory Document &amp; Revenue Records</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#0B2E59] dark:text-sky-300 bg-[#E6F0FA] dark:bg-sky-950/40 px-2 py-0.5 rounded-[2px] border border-[#B8D5ED] dark:border-sky-800/40">
          {documents.length} Files
        </span>
      </div>

      <label className="py-3 px-3 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] hover:bg-[#F4F6F8] dark:hover:bg-white/5 border border-dashed border-[#DCE2E8] dark:border-white/20 text-[#0B2E59] dark:text-slate-200 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-colors shadow-xs">
        <Upload className="w-5 h-5 text-[#0B2E59] dark:text-sky-400" />
        <span>Attach PDF / Scanned Record (Aadhaar, RoR, Mutation)</span>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {documents.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2 rounded-[3px] bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-[#0B2E59] dark:text-sky-400 flex-shrink-0" />
                <span className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]">{doc.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  ({Math.round(doc.sizeBytes / 1024)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveDocument(doc.id)}
                className="p-1 text-slate-400 hover:text-[#B32424] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
