"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DocumentVersion {
  id: string;
  version_number: number;
  original_filename: string;
  size_bytes: number;
  created_at: string;
  uploaded_by_id: string;
  uploaded_by_role: string;
}

interface Document {
  id: string;
  title: string;
  description: string;
  document_type: string;
  current_version: number;
  created_at: string;
  versions: DocumentVersion[];
}

export function DocumentRegister({
  projectId,
  parcelId,
  caseId
}: {
  projectId?: string;
  parcelId?: string;
  caseId?: string;
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState("NOTICE");
  const [uploading, setUploading] = useState(false);

  // Version Upload State
  const [versionUploadDocId, setVersionUploadDocId] = useState<string | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionUploading, setVersionUploading] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [versionSuccess, setVersionSuccess] = useState<string | null>(null);

  // UI State
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const fetchDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (projectId) params.append("project_id", projectId);
      if (parcelId) params.append("parcel_id", parcelId);

      const { authenticatedFetch } = await import('@/lib/api');
      const res = await authenticatedFetch(`/documents?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized to view documents. Please login.");
        if (res.status === 403) throw new Error("You do not have permission to view these documents.");
        if (res.status === 404) throw new Error("Document register not found.");
        throw new Error("Unable to load documents.");
      }

      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }, [projectId, parcelId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const toggleVersions = (docId: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) newSet.delete(docId);
      else newSet.add(docId);
      return newSet;
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const metadata = {
        title,
        description,
        document_type: docType,
        project_id: projectId,
        parcel_id: parcelId,
        acquisition_case_id: caseId,
      };

      const formData = new FormData();
      formData.append("metadata", JSON.stringify(metadata));
      formData.append("file", file);

      const { authenticatedFetch } = await import('@/lib/api');
      const res = await authenticatedFetch("/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized to upload documents.");
        if (res.status === 403) throw new Error("You do not have permission to upload documents.");
        throw new Error("Document upload failed.");
      }

      setFile(null);
      setTitle("");
      setDescription("");

      fetchDocuments();
    } catch (err: any) {
      setError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleVersionUpload = async (e: React.FormEvent, docId: string) => {
    e.preventDefault();
    if (!versionFile) return;

    try {
      setVersionUploading(true);
      setVersionError(null);
      setVersionSuccess(null);

      const formData = new FormData();
      formData.append("file", versionFile);

      const { authenticatedFetch } = await import('@/lib/api');
      const res = await authenticatedFetch(`/documents/${docId}/versions`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized to upload version.");
        if (res.status === 403) throw new Error("You do not have permission to upload version.");
        throw new Error("Version upload failed.");
      }

      setVersionFile(null);
      setVersionUploadDocId(null);
      setVersionSuccess("New version uploaded successfully.");

      fetchDocuments();
      setTimeout(() => setVersionSuccess(null), 3000);
    } catch (err: any) {
      setVersionError(err.message || "Version upload failed.");
    } finally {
      setVersionUploading(false);
    }
  };

  const handleDownload = async (docId: string, version?: number) => {
    try {
      let url = `/documents/${docId}/download`;
      if (version) {
        url += `?version=${version}`;
      }
      const { authenticatedFetch } = await import('@/lib/api');
      const res = await authenticatedFetch(url);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized to download document.");
        if (res.status === 403) throw new Error("You do not have permission to download this document.");
        if (res.status === 404) throw new Error("Document or version not found.");
        throw new Error("Document download could not be completed.");
      }

      const data = await res.json();
      window.open(data.download_url, "_blank");
    } catch (err: any) {
      setError(err.message || "Document download could not be completed.");
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { authenticatedFetch } = await import('@/lib/api');
      const res = await authenticatedFetch(`/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized to delete document.");
        if (res.status === 403) throw new Error("You do not have permission to delete this document.");
        if (res.status === 404) throw new Error("Document not found.");
        throw new Error("Document deletion could not be completed.");
      }
      fetchDocuments();
    } catch (err: any) {
      setError(err.message || "Document deletion could not be completed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 bg-white dark:bg-[#0D121F] shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wide font-mono">Upload Document</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Supported formats: PDF, JPEG, PNG. Maximum file size: 50MB.
        </p>

        {error && (
          <div className="bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 p-2.5 rounded-[3px] mb-4 text-xs border border-[#FFCDD2] dark:border-rose-800/40">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-[#DCE2E8] dark:border-white/15 rounded-[3px] px-3 py-1.5 bg-white dark:bg-[#07080F] text-slate-900 dark:text-white shadow-xs focus:border-[#0B2E59] text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full border border-[#DCE2E8] dark:border-white/15 rounded-[3px] px-3 py-1.5 bg-white dark:bg-[#07080F] text-slate-900 dark:text-white shadow-xs focus:border-[#0B2E59] text-xs outline-none"
              >
                <option value="NOTICE">Notice</option>
                <option value="DEED">Deed</option>
                <option value="MAP">Map / Spatial</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-[#DCE2E8] dark:border-white/15 rounded-[3px] px-3 py-1.5 bg-white dark:bg-[#07080F] text-slate-900 dark:text-white shadow-xs focus:border-[#0B2E59] text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">File</label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-[3px] file:border-0 file:text-xs file:font-semibold file:bg-[#F4F6F8] dark:file:bg-white/10 file:text-[#0B2E59] dark:file:text-slate-200 hover:file:bg-[#E6F0FA]"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full sm:w-auto px-4 py-2 bg-[#0B2E59] hover:bg-[#082242] text-white rounded-[4px] text-xs font-bold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </div>

      <div className="border border-[#DCE2E8] dark:border-white/10 rounded-[4px] overflow-hidden bg-white dark:bg-[#0D121F] shadow-xs">
        <div className="px-5 py-3 border-b border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F]">
          <h3 className="text-xs font-bold text-[#0B2E59] dark:text-slate-200 uppercase tracking-wide font-mono">Document Register</h3>
        </div>

        {versionSuccess && (
          <div className="bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 p-2.5 text-xs border-b border-[#C8E6C9] dark:border-emerald-800/40">
            {versionSuccess}
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No documents found.</div>
        ) : (
          <ul className="divide-y divide-[#DCE2E8] dark:divide-white/5">
            {documents.map(doc => (
              <li key={doc.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{doc.title}</h4>
                      <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40">
                        {doc.document_type}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-[#F4F6F8] dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-[#DCE2E8] dark:border-white/10">
                        v{doc.current_version}
                      </span>
                    </div>
                    {doc.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{doc.description}</p>}

                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      Latest file: {doc.versions[0]?.original_filename} ({(doc.versions[0]?.size_bytes / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#0B2E59] dark:text-slate-200 bg-white dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 rounded-[3px] hover:bg-[#F4F6F8] dark:hover:bg-white/10 shadow-xs"
                    >
                      Download Latest
                    </button>
                    <button
                      onClick={() => setVersionUploadDocId(versionUploadDocId === doc.id ? null : doc.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0B2E59] hover:bg-[#082242] rounded-[3px] shadow-xs"
                    >
                      New Version
                    </button>
                    <button
                      onClick={() => toggleVersions(doc.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-[#F4F6F8] dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 rounded-[3px] hover:bg-slate-200 shadow-xs"
                    >
                      {expandedVersions.has(doc.id) ? "Hide History" : "Version History"}
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#B32424] dark:text-rose-300 bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 rounded-[3px] hover:bg-[#FFCDD2] shadow-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {versionUploadDocId === doc.id && (
                  <div className="mt-3 p-3.5 border border-[#B8D5ED] dark:border-sky-800/40 bg-[#E6F0FA]/60 dark:bg-sky-950/20 rounded-[4px]">
                    <h5 className="text-xs font-bold text-[#0B2E59] dark:text-sky-300 mb-1.5 uppercase font-mono">Upload Version {doc.current_version + 1}</h5>
                    {versionError && <div className="text-xs text-[#B32424] mb-2">{versionError}</div>}
                    <form onSubmit={(e) => handleVersionUpload(e, doc.id)} className="flex items-center gap-2.5 flex-wrap">
                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={e => setVersionFile(e.target.files?.[0] || null)}
                        className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-[3px] file:border-0 file:text-xs file:font-semibold file:bg-white dark:file:bg-[#07080F] file:text-[#0B2E59] dark:file:text-sky-300 file:border file:border-[#DCE2E8] dark:file:border-white/10 hover:file:bg-[#F4F6F8]"
                      />
                      <button
                        type="submit"
                        disabled={versionUploading || !versionFile}
                        className="px-3 py-1 bg-[#0B2E59] hover:bg-[#082242] text-white rounded-[3px] text-xs font-bold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        {versionUploading ? "Uploading..." : "Submit Version"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVersionUploadDocId(null)}
                        className="px-3 py-1 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-[#DCE2E8] dark:border-white/10 rounded-[3px] text-xs font-semibold hover:bg-[#F4F6F8] dark:hover:bg-white/10 transition-colors shadow-xs"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                )}

                {expandedVersions.has(doc.id) && (
                  <div className="mt-4 pt-3 border-t border-[#DCE2E8] dark:border-white/10">
                    <h5 className="text-xs font-bold text-[#0B2E59] dark:text-slate-200 mb-2 uppercase font-mono">Version History</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead className="bg-[#F8FAFC] dark:bg-[#07080F] text-slate-600 dark:text-slate-400 text-[10px] font-mono uppercase font-bold border-y border-[#DCE2E8] dark:border-white/10">
                          <tr>
                            <th className="px-4 py-2 font-medium">Version</th>
                            <th className="px-4 py-2 font-medium">Filename</th>
                            <th className="px-4 py-2 font-medium text-right">Size</th>
                            <th className="px-4 py-2 font-medium">Date</th>
                            <th className="px-4 py-2 font-medium">Uploader</th>
                            <th className="px-4 py-2 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {doc.versions.map(v => (
                            <tr key={v.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-medium text-slate-900">v{v.version_number} {v.version_number === doc.current_version && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">CURRENT</span>}</td>
                              <td className="px-4 py-2 truncate max-w-[150px]" title={v.original_filename}>{v.original_filename}</td>
                              <td className="px-4 py-2 text-right font-mono">{(v.size_bytes / 1024).toFixed(1)} KB</td>
                              <td className="px-4 py-2">{new Date(v.created_at).toLocaleString()}</td>
                              <td className="px-4 py-2">{v.uploaded_by_id}</td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={() => handleDownload(doc.id, v.version_number)}
                                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                                >
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
