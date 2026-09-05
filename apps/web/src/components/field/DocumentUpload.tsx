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
    <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Statutory Document & Revenue Records</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {documents.length} Files
        </span>
      </div>

      <label className="py-3 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-dashed border-slate-600 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all">
        <Upload className="w-5 h-5 text-indigo-400" />
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
              className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="text-white font-medium truncate max-w-[200px]">{doc.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({Math.round(doc.sizeBytes / 1024)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveDocument(doc.id)}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
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
