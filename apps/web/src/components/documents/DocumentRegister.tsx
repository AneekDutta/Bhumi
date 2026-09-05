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
    <div className="space-y-8">
      <div className="border border-slate-300 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Document</h3>
        <p className="text-sm text-slate-500 mb-6">
          Supported formats: PDF, JPEG, PNG. Max size: 50MB. Malware scanning is a production control and is not available in the local hackathon prototype.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm"
              >
                <option value="NOTICE">Notice</option>
                <option value="DEED">Deed</option>
                <option value="MAP">Map / Spatial</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </div>

      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Document Register</h3>
        </div>

        {versionSuccess && (
          <div className="bg-emerald-50 text-emerald-700 p-3 text-sm border-b border-emerald-200">
            {versionSuccess}
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No documents found.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {documents.map(doc => (
              <li key={doc.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-md font-medium text-slate-900">{doc.title}</h4>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {doc.document_type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        v{doc.current_version}
                      </span>
                    </div>
                    {doc.description && <p className="text-sm text-slate-500 mb-2">{doc.description}</p>}

                    <div className="text-xs text-slate-400 mt-2">
                      Latest file: {doc.versions[0]?.original_filename} ({(doc.versions[0]?.size_bytes / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                    >
                      Download Latest
                    </button>
                    <button
                      onClick={() => setVersionUploadDocId(versionUploadDocId === doc.id ? null : doc.id)}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100"
                    >
                      New Version
                    </button>
                    <button
                      onClick={() => toggleVersions(doc.id)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200"
                    >
                      {expandedVersions.has(doc.id) ? "Hide History" : "Version History"}
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {versionUploadDocId === doc.id && (
                  <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/50 rounded-md">
                    <h5 className="text-sm font-semibold text-indigo-900 mb-2">Upload Version {doc.current_version + 1}</h5>
                    {versionError && <div className="text-xs text-red-600 mb-2">{versionError}</div>}
                    <form onSubmit={(e) => handleVersionUpload(e, doc.id)} className="flex items-center gap-3">
                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={e => setVersionFile(e.target.files?.[0] || null)}
                        className="text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-indigo-700 file:border file:border-indigo-200 hover:file:bg-indigo-50"
                      />
                      <button
                        type="submit"
                        disabled={versionUploading || !versionFile}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {versionUploading ? "Uploading..." : "Submit Version"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVersionUploadDocId(null)}
                        className="px-3 py-1.5 bg-white text-slate-600 border border-slate-300 rounded text-xs font-medium hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                )}

                {expandedVersions.has(doc.id) && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <h5 className="text-sm font-medium text-slate-900 mb-3">Version History</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 text-xs border-y border-slate-200">
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
