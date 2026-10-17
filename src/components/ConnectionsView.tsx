"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  Lock,
  Plug,
  Sparkles,
  ExternalLink,
  Layers,
  Unlink,
} from "lucide-react";
import { authHeaders } from "@/lib/clientAuth";

interface Toolkit {
  slug: string;
  label: string;
  blurb: string;
  connected: boolean;
  isGoogle?: boolean;
  isBundle?: boolean;
}

interface State {
  authenticated: boolean;
  configured: boolean;
  error?: string;
  note?: string;
  toolkits: Toolkit[];
}

/** Reads a newline-delimited JSON agent stream, calling onEvent for each event. */
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

interface SyncLine {
  text: string;
  ok?: boolean;
}

/** Streams /api/sync: the agent reads recent items from connected accounts and records them in the user's graph. */
function SyncPanel() {
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<SyncLine[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setLines([]);
    setSummary(null);
    setErr(null);
    try {
      const res = await fetch("/api/sync", { method: "POST", headers: await authHeaders() });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Sync failed (${res.status})`);
      }
      await readAgentStream(res, (e) => {
        if (e.type === "tool_call") setLines((l) => [...l, { text: `Reading ${e.name}` }]);
        else if (e.type === "tool_result") setLines((l) => [...l, { text: `${e.name} ${e.ok ? "done" : "failed"}`, ok: e.ok }]);
        else if (e.type === "answer") setSummary(e.text);
        else if (e.type === "error") setErr(e.message);
      });
    } catch (e: any) {
      setErr(e?.message || "Sync failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Sync connected accounts into your graph</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reads recent email, calendar events, documents and GitHub activity (read-only) and records the people, documents and pull requests it finds, each linked to its source.
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60 cursor-pointer"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {running ? "Syncing…" : "Sync now"}
        </button>
      </div>
      {lines.length > 0 && (
        <ul className="max-h-32 overflow-y-auto space-y-0.5 text-[11px] font-mono text-slate-500">
          {lines.map((l, i) => (
            <li key={i} className={l.ok === false ? "text-rose-600" : undefined}>{l.text}</li>
          ))}
        </ul>
      )}
      {summary && <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{summary}</p>}
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </div>
  );
}

interface UploadedDoc {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: number;
}

const ACCEPT = ".pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.md,.markdown,.json,.yaml,.yml,.xml,.html,.htm,.rtf,.log";

/** Upload PDF / Word / Excel / CSV / text. The agent searches them and can turn them into graph entities. */
function DocumentsPanel() {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [building, setBuilding] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/documents", { headers: await authHeaders(), cache: "no-store" });
      if (res.ok) setDocs((await res.json()).documents || []);
    } catch {
      /* leave the list as it was */
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setNotes([]);
    try {
      const form = new FormData();
      list.forEach((f) => form.append("files", f));
      const res = await fetch("/api/documents", { method: "POST", headers: await authHeaders(), body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Upload failed (${res.status})`);
      setNotes(j.results.map((r: any) => (r.ok ? `${r.name}: added (${r.chunks} parts)` : `${r.name}: ${r.error}`)));
      await load();
    } catch (e: any) {
      setNotes([e?.message || "Upload failed"]);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: await authHeaders() });
    await load();
  }

  async function addToGraph(doc: UploadedDoc) {
    setBuilding(doc.id);
    setResult(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          message: `Read my uploaded document "${doc.name}" completely and record the people, teams, decisions, documents and services it states in my knowledge graph with graph_upsert (source upload:${doc.id}). Only record facts the document states. Then list what you recorded.`,
        }),
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error || `Failed (${res.status})`);
      await readAgentStream(res, (e) => {
        if (e.type === "answer") setResult(e.text);
        else if (e.type === "error") setResult(e.message);
      });
    } catch (e: any) {
      setResult(e?.message || "Could not add to the graph");
    } finally {
      setBuilding(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Upload documents</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          PDF, Word, Excel, CSV, TSV, text, JSON, HTML, or Markdown (up to 10 MB each). The agent can search and cite them, and you can add what they state to your graph.
        </p>
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
          void upload(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-5 text-xs transition ${
          dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-indigo-300"
        }`}
      >
        {uploading ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Layers size={16} className="text-indigo-600" />}
        <span className="font-semibold text-slate-700">{uploading ? "Reading files…" : "Drop files here or click to choose"}</span>
        <input
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files) void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {notes.length > 0 && (
        <ul className="space-y-0.5 text-[11px] text-slate-600">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
      {docs.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
              <span className="min-w-0 truncate font-medium text-slate-800">
                {d.name} <span className="font-normal text-slate-400">· {d.chunks} parts</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => void addToGraph(d)}
                  disabled={building !== null}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 cursor-pointer"
                >
                  {building === d.id ? "Adding…" : "Add to graph"}
                </button>
                <button onClick={() => void remove(d.id)} className="text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete">
                  <Unlink size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {result && <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{result}</p>}
    </div>
  );
}

export function ConnectionsView({ onRequestSignIn }: { onRequestSignIn: () => void }) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/connections", { headers: await authHeaders(), cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Failed (${res.status})`);
      setState(j);
    } catch (e: any) {
      setError(e?.message || "Could not load connections");
    }
  }, []);

  useEffect(() => {
    void load();
    // Returning from the OAuth redirect: refresh state and clean the URL.
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected")) {
      window.history.replaceState({}, "", window.location.pathname);
      void load();
    }
  }, [load]);

  async function connect(slug: string) {
    setBusy(slug);
    setError(null);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ toolkit: slug }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Failed (${res.status})`);
      window.location.href = j.url;
    } catch (e: any) {
      setError(e?.message || "Could not start the connection");
      setBusy(null);
    }
  }

  async function disconnect(slug: string, label: string) {
    const isBundle = slug === "googlesuper";
    const confirmMsg = isBundle
      ? "Disconnect Google Workspace?\n\nThis will revoke access to Gmail, Calendar, Drive, Docs, and Sheets."
      : `Disconnect ${label}?\n\nThis will remove connected account access for ${label}.`;

    if (!window.confirm(confirmMsg)) return;

    setDisconnecting(slug);
    setError(null);
    try {
      const res = await fetch("/api/connections", {
        method: "DELETE",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ toolkit: slug }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Failed (${res.status})`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Could not disconnect account");
    } finally {
      setDisconnecting(null);
    }
  }

  const signedOut = state && !state.authenticated;

  // Determine if all Google tools are connected
  const googleToolkits = (state?.toolkits || []).filter((t) => t.isGoogle && !t.isBundle);
  const isGoogleSuperConnected =
    (state?.toolkits || []).some((t) => t.slug === "googlesuper" && t.connected) ||
    (googleToolkits.length > 0 && googleToolkits.every((t) => t.connected));

  // Individual toolkits excluding the bundle
  const individualToolkits = (state?.toolkits || []).filter((t) => !t.isBundle);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Connections &amp; Workspaces</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect your accounts so autonomous agents can securely index institutional knowledge and prepare actions with human-in-the-loop approval.
        </p>
      </div>

      {state?.authenticated && <DocumentsPanel />}

      {state?.authenticated && state.toolkits.some((t) => t.connected) && <SyncPanel />}

      {signedOut && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-2 text-sm text-indigo-900 font-medium">
            <Lock size={16} /> Sign in with Google to connect your enterprise accounts.
          </div>
          <button
            onClick={onRequestSignIn}
            className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
          >
            Sign in
          </button>
        </div>
      )}

      {state && !state.configured && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <CircleAlert size={16} className="mt-0.5 shrink-0" /> Connectors are not configured on this server (COMPOSIO_API_KEY missing).
        </div>
      )}

      {(error || state?.error) && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 animate-in fade-in">
          <CircleAlert size={16} className="mt-0.5 shrink-0 text-rose-600" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-900">Connection Gateway Notice</p>
            <p className="leading-relaxed">{error || state?.error}</p>
            <p className="text-[11px] text-rose-600">
              Verify your <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[10px]">COMPOSIO_API_KEY</code> or <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[10px]">COMPOSIO_USER_API_KEY</code> in environment configuration.
            </p>
          </div>
        </div>
      )}

      {!state && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={15} className="animate-spin" /> Checking account connections…
        </div>
      )}

      {/* 1-Click Unified Google Workspace Connect Card */}
      <div className="rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-11 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
              <Sparkles className="size-5 text-indigo-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                Unified 1-Click Connect
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Connect All Google Tools at Once
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Authorize Gmail, Google Calendar, Drive, Docs &amp; Sheets in a single Google consent prompt.
              </p>
            </div>
          </div>

          <div>
            {isGoogleSuperConnected ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs">
                  <CheckCircle2 size={14} className="text-emerald-700" /> All Google Tools Connected
                </span>
                <button
                  disabled={disconnecting !== null || busy !== null}
                  onClick={() => disconnect("googlesuper", "Google Workspace")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-40"
                  title="Disconnect all Google tools"
                >
                  {disconnecting === "googlesuper" ? (
                    <Loader2 size={13} className="animate-spin text-rose-600" />
                  ) : (
                    <Unlink size={13} className="text-rose-600" />
                  )}
                  <span>Disconnect All</span>
                </button>
              </div>
            ) : (
              <button
                disabled={!state?.authenticated || !state?.configured || busy !== null}
                onClick={() => connect("googlesuper")}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-40"
              >
                {busy === "googlesuper" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plug size={14} />
                )}
                <span>Connect All Google Tools</span>
              </button>
            )}
          </div>
        </div>

        {/* Google Apps Included Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-100/60 text-xs">
          <span className="text-[11px] font-medium text-slate-500 mr-1">Includes 5 Services:</span>
          {["Gmail", "Google Calendar", "Google Drive", "Google Docs", "Google Sheets"].map((app) => (
            <span
              key={app}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs"
            >
              <span className={`size-1.5 rounded-full ${isGoogleSuperConnected ? "bg-emerald-500" : "bg-indigo-500"}`} />
              <span>{app}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Individual Toolkits Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Individual Connector Status
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {individualToolkits.map((t) => (
            <div
              key={t.slug}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                  {t.isGoogle && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Google
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{t.blurb}</p>
              </div>

              {t.connected ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 size={13} /> Connected
                  </span>
                  <button
                    disabled={disconnecting !== null || busy !== null}
                    onClick={() => disconnect(t.slug, t.label)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-500 px-2.5 py-1 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    title={`Disconnect ${t.label}`}
                  >
                    {disconnecting === t.slug ? (
                      <Loader2 size={12} className="animate-spin text-rose-600" />
                    ) : (
                      <Unlink size={12} />
                    )}
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <button
                  disabled={!state?.authenticated || !state?.configured || busy !== null}
                  onClick={() => connect(t.slug)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  {busy === t.slug ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />} Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
