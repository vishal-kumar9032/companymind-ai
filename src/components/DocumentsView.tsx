"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UploadCloud,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Network,
  MessageSquare,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { authHeaders } from "@/lib/clientAuth";

async function readAgentStream(res: Response, onEvent: (e: any) => void) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() || "";
    for (const part of parts) if (part.trim()) onEvent(JSON.parse(part));
  }
}

export interface UploadedDoc {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: number;
  uploaded_at?: string;
  chars?: number;
}

const ACCEPTED_EXTENSIONS =
  ".pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.md,.markdown,.json,.yaml,.yml,.xml,.html,.htm,.rtf,.log";

interface DocumentsViewProps {
  onAskAboutDoc?: (prompt: string) => void;
  onRefreshGraph?: () => void;
}

export function DocumentsView({ onAskAboutDoc, onRefreshGraph }: DocumentsViewProps) {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [building, setBuilding] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultDocName, setResultDocName] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/documents", {
        headers: await authHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setNotes([]);
    setResult(null);

    try {
      const form = new FormData();
      list.forEach((f) => form.append("files", f));
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: await authHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Upload failed (${res.status})`);
      }
      setNotes(
        (data.results || []).map((r: any) =>
          r.ok
            ? `✓ ${r.name}: successfully indexed (${r.chunks} chunks, ${r.entities || 0} graph entities extracted)`
            : `✕ ${r.name}: ${r.error}`
        )
      );
      await loadDocuments();
      onRefreshGraph?.();
    } catch (err: any) {
      setNotes([err?.message || "Upload failed"]);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from your knowledge graph?`)) return;
    try {
      await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      await loadDocuments();
      onRefreshGraph?.();
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleAddToGraph = async (doc: UploadedDoc) => {
    setBuilding(doc.id);
    setResult(null);
    setResultDocName(doc.name);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          message: `Read my uploaded document "${doc.name}" completely and record the people, teams, decisions, documents and services it states in my knowledge graph with graph_upsert (source upload:${doc.id}). Only record facts the document states. Then list what you recorded.`,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error((await res.json().catch(() => ({}))).error || `Failed (${res.status})`);
      }

      await readAgentStream(res, (e) => {
        if (e.type === "answer") setResult(e.text);
        else if (e.type === "error") setResult(e.message);
      });
      onRefreshGraph?.();
    } catch (err: any) {
      setResult(err?.message || "Could not extract entities into the graph");
    } finally {
      setBuilding(null);
    }
  };

  const getDocIcon = (type: string) => {
    const ext = type.toLowerCase();
    if (ext === "pdf") return <FileText className="size-5 text-rose-500" />;
    if (["doc", "docx"].includes(ext)) return <FileText className="size-5 text-indigo-500" />;
    if (["xlsx", "xls", "csv", "tsv"].includes(ext))
      return <FileSpreadsheet className="size-5 text-emerald-600" />;
    if (["json", "yaml", "yml", "xml", "html"].includes(ext))
      return <FileCode className="size-5 text-amber-500" />;
    return <File className="size-5 text-slate-500" />;
  };

  const totalChunks = docs.reduce((acc, d) => acc + (d.chunks || 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <FolderOpen className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Knowledge Documents &amp; File Ingestion
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Upload institutional documents (PDF, Word, Excel, Sheets, CSV, Markdown). Content is chunked into FalkorDB, mapped to graph entities, and injected into agent context.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Top Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Indexed Documents
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{docs.length} / 30</div>
          <div className="text-[10px] text-slate-400">Active uploaded files</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            FalkorDB Chunks
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">{totalChunks}</div>
          <div className="text-[10px] text-slate-400">Full-text indexed nodes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Max File Size
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">10 MB</div>
          <div className="text-[10px] text-slate-400">Per document limit</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Formats Supported
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">12+</div>
          <div className="text-[10px] text-slate-400">PDF, DOCX, XLSX, CSV, MD</div>
        </div>
      </div>

      {/* 3. Drag and Drop Upload Zone */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="size-4 text-indigo-600" />
            <span>Upload New Documents</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Auto-linked to FalkorDB Graph
          </span>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleUpload(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            dragging
              ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 scale-[0.99]"
              : "border-slate-300 bg-slate-50/70 hover:border-indigo-400 hover:bg-slate-100/70 text-slate-600"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-indigo-600" />
              <span className="font-semibold text-slate-900 text-sm">
                Parsing content &amp; generating FalkorDB graph entities…
              </span>
              <span className="text-xs text-slate-500">
                Extracting decisions, services, authors, and causal relationships
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-2xs">
                <UploadCloud className="size-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800">
                  Click to browse or drag and drop files here
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, Word (.docx, .doc), Excel (.xlsx, .xls), CSV, TSV, Markdown, JSON, or Plain Text
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-indigo-700 shadow-2xs mt-1">
                <Sparkles className="size-3 text-indigo-600" />
                <span>Instant Agent Context + Automatic Graph Traversal</span>
              </span>
            </div>
          )}

          <input
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files) void handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {/* Upload Notes / Results */}
        {notes.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs font-mono">
            {notes.map((n, i) => (
              <div
                key={i}
                className={n.startsWith("✓") ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}
              >
                {n}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Deep Graph Extraction Result Banner */}
      {result && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Network className="size-4 text-indigo-600" />
              <span>Entity Extraction Complete for &quot;{resultDocName}&quot;</span>
            </span>
            <button
              onClick={() => setResult(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-indigo-100">
            {result}
          </p>
        </div>
      )}

      {/* 5. Uploaded Documents Catalog Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Active Documents Catalog ({docs.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Files indexed in your private FalkorDB workspace. The Ask AI agent can cite, search, and reason over these documents.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin text-indigo-600" />
            <span>Loading document registry…</span>
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
            <FileText className="size-8 text-slate-400 mx-auto" />
            <h3 className="text-xs font-bold text-slate-800">No documents uploaded yet</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Drop an architectural document, meeting transcript, or Excel spreadsheet above to link it directly into your company knowledge graph.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getDocIcon(doc.type)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                        {doc.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                        {doc.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                      <span>{Math.round(doc.size / 1024)} KB</span>
                      <span>•</span>
                      <span>{doc.chunks} chunks indexed</span>
                      {doc.uploaded_at && (
                        <>
                          <span>•</span>
                          <span>{doc.uploaded_at.split("T")[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Query with Agent */}
                  <button
                    onClick={() => {
                      if (onAskAboutDoc) {
                        onAskAboutDoc(
                          `Summarize document "${doc.name}" and explain all key decisions, services, and policies defined in it.`
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Ask the AI agent about this document"
                  >
                    <MessageSquare className="size-3.5" />
                    <span>Ask Agent</span>
                  </button>

                  {/* Extract Entities / Add to Graph */}
                  <button
                    disabled={building === doc.id}
                    onClick={() => handleAddToGraph(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    title="Run AI agent entity extraction on this document"
                  >
                    {building === doc.id ? (
                      <Loader2 className="size-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <Network className="size-3.5 text-indigo-600" />
                    )}
                    <span>{building === doc.id ? "Extracting…" : "Add to Graph"}</span>
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(doc.id, doc.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete document from graph"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
