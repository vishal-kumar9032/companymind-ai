"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  Brain,
  Check,
  CircleAlert,
  Cpu,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  X,
  Users,
  Sparkles,
  Copy,
  CheckCircle2,
  Layers,
  FileText,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  Activity,
  Network,
  Paperclip,
  History,
  UploadCloud,
} from "lucide-react";
import { authHeaders } from "@/lib/clientAuth";
import { AVAILABLE_MODELS } from "@/lib/truefoundry";

type Ev = { type: string; [k: string]: any };

interface Approval {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  state: "pending" | "working" | "executed" | "rejected" | "failed";
  detail?: string;
}

interface Turn {
  id: number;
  question: string;
  events: Ev[];
  approvals: Approval[];
  answer: string;
  status: "running" | "done" | "error";
  error?: string;
}

interface EnterprisePrompt {
  category: string;
  badgeClass: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  prompt: string;
  subtitle: string;
}

const PERSONAL_PROMPTS: EnterprisePrompt[] = [
  {
    category: "INBOX & CALENDAR",
    badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    icon: Layers,
    prompt: "What needs my attention in my inbox and calendar this week?",
    subtitle: "Reads your connected Gmail and Google Calendar",
  },
  {
    category: "GITHUB",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    icon: ShieldAlert,
    prompt: "Which of my GitHub pull requests and issues are open, and which are blocked?",
    subtitle: "Reads your connected GitHub repositories",
  },
  {
    category: "DOCUMENTS",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    icon: FileText,
    prompt: "Which documents in my Drive changed recently, and who edited them?",
    subtitle: "Reads your connected Google Drive and Docs",
  },
  {
    category: "BUILD MY GRAPH",
    badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    icon: Network,
    prompt: "Read my recent emails and documents and record the people, documents and decisions you find in my knowledge graph",
    subtitle: "Turns what you connected into a graph the agent can reason over",
  },
];

const ENTERPRISE_PROMPTS: EnterprisePrompt[] = [
  {
    category: "BLAST RADIUS & TOPOLOGY",
    badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    icon: Layers,
    prompt: "What breaks if auth-v1 is shut down, and who leads those teams?",
    subtitle: "Identify downstream microservices, dependents, and engineering owners",
  },
  {
    category: "POLICY & GOVERNANCE",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    icon: ShieldAlert,
    prompt: "Audit PR #214 against DEC-44 sunset mandate and architecture specs",
    subtitle: "Verify code changes against ratified architecture council mandates",
  },
  {
    category: "PROVENANCE & OWNERSHIP",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    icon: FileText,
    prompt: "Who owns payments-api and what architectural decisions govern it?",
    subtitle: "Trace service authorship, ADRs, and executive meeting sign-offs",
  },
  {
    category: "WORKFORCE ORCHESTRATION",
    badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    icon: Network,
    prompt: "Summarize critical engineering initiatives and open blocker risks",
    subtitle: "Cross-reference connected institutional documents, repos, and notes",
  },
];

function describe(e: Ev): { icon: React.ReactNode; text: string; badge?: string } | null {
  switch (e.type) {
    case "memory_recalled":
      return e.count
        ? {
            icon: <Brain size={13} className="text-indigo-600" />,
            text: `Recalled ${e.count} institutional memories from past decisions`,
            badge: "Memory",
          }
        : null;
    case "tool_call":
      return {
        icon: <Wrench size={13} className="text-amber-600" />,
        text: `${e.role || "Agent"} executing ${e.name}`,
        badge: "Tool Call",
      };
    case "tool_result":
      return {
        icon: e.ok ? (
          <CheckCircle2 size={13} className="text-emerald-600" />
        ) : (
          <CircleAlert size={13} className="text-rose-600" />
        ),
        text: `${e.name} ${e.ok ? "completed" : "failed"}${e.ms ? ` in ${e.ms}ms` : ""}`,
        badge: e.ok ? "Success" : "Failed",
      };
    case "delegate":
      return {
        icon: <Users size={13} className="text-violet-600" />,
        text: `Handed off to ${e.to}: ${String(e.goal || "").slice(0, 90)}`,
        badge: "Delegate",
      };
    case "approval":
      return {
        icon: <ShieldCheck size={13} className="text-amber-600" />,
        text: `Security checkpoint waiting for human authorization: ${e.tool}`,
        badge: "Auth Gate",
      };
    default:
      return null;
  }
}

export function AssistantView({
  signedIn,
  personal = false,
  initialQuery,
  onInitialQueryUsed,
  model,
  onGraphUpdate,
}: {
  signedIn: boolean;
  personal?: boolean;
  initialQuery?: string | null;
  onInitialQueryUsed?: () => void;
  model?: string;
  onGraphUpdate?: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<number, boolean>>({});
  const [copiedTurnId, setCopiedTurnId] = useState<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  // File upload knowledge attachment state
  const [attachment, setAttachment] = useState<{
    id?: string;
    name: string;
    text: string;
    size: number;
    chars: number;
    entities?: number;
    relations?: number;
    chunks?: number;
  } | null>(null);
  const [extractingFile, setExtractingFile] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Dynamic user instructions & past runs
  const [recentInstructions, setRecentInstructions] = useState<
    Array<{ id: string; goal: string; role?: string; at: string }>
  >([]);

  const activeModelObj = AVAILABLE_MODELS.find((m) => m.id === model) || AVAILABLE_MODELS[0];

  const loadRecentInstructions = async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/agent", { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.runs)) {
          setRecentInstructions(data.runs.slice(0, 6));
        }
      }
    } catch {}
  };

  useEffect(() => {
    void loadRecentInstructions();
  }, [signedIn]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const patch = (id: number, fn: (t: Turn) => Turn) =>
    setTurns((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));

  const toggleReasoning = (turnId: number) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [turnId]: !prev[turnId],
    }));
  };

  const handleCopy = (turnId: number, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedTurnId(turnId);
      setTimeout(() => setCopiedTurnId(null), 2000);
    }
  };

  const handleClearChat = () => {
    if (busy) return;
    setTurns([]);
    setExpandedReasoning({});
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentError(null);
    setExtractingFile(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const headers = await authHeaders();
      const res = await fetch("/api/documents", {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract knowledge from file");
      }
      const item = data.results?.[0];
      if (!item || !item.ok) {
        throw new Error(item?.error || "Failed to process document");
      }
      setAttachment({
        id: item.id,
        name: item.name,
        text: item.text || "",
        size: file.size,
        chars: item.chars || file.size,
        entities: item.entities || 0,
        relations: item.relations || 0,
        chunks: item.chunks || 0,
      });
      onGraphUpdate?.();
    } catch (err: any) {
      setAttachmentError(err?.message || "Could not read file");
    } finally {
      setExtractingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const currentAttachment = attachment;
    const id = nextId.current++;
    setTurns((ts) => [
      ...ts,
      { id, question: currentAttachment ? `[Attachment: ${currentAttachment.name}] ${q}` : q, events: [], approvals: [], answer: "", status: "running" },
    ]);
    setInput("");
    setAttachment(null);
    setBusy(true);
    // Keep reasoning expanded while running
    setExpandedReasoning((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          message: q,
          model,
          attachment: currentAttachment ? { name: currentAttachment.name, text: currentAttachment.text } : undefined,
        }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const e: Ev = JSON.parse(line);
          if (e.type === "answer" && e.role === "orchestrator") {
            patch(id, (t) => ({ ...t, answer: e.text }));
          } else if (e.type === "approval") {
            patch(id, (t) => ({
              ...t,
              events: [...t.events, e],
              approvals: [
                ...t.approvals,
                { id: e.approvalId, tool: e.tool, args: e.args, state: "pending" },
              ],
            }));
          } else if (e.type === "error") {
            patch(id, (t) => ({ ...t, status: "error", error: e.message }));
          } else if (e.type === "done") {
            patch(id, (t) => ({ ...t, status: t.status === "error" ? "error" : "done" }));
            onGraphUpdate?.();
            void loadRecentInstructions();
          } else {
            patch(id, (t) => ({ ...t, events: [...t.events, e] }));
          }
        }
      }
      patch(id, (t) => (t.status === "running" ? { ...t, status: "done" } : t));
      onGraphUpdate?.();
      void loadRecentInstructions();
    } catch (err: any) {
      patch(id, (t) => ({
        ...t,
        status: "error",
        error: err?.message || "Something went wrong while processing the query.",
      }));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialQuery) {
      onInitialQueryUsed?.();
      void ask(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function decide(turnId: number, approvalId: string, decision: "approve" | "reject") {
    const setState = (state: Approval["state"], detail?: string) =>
      patch(turnId, (t) => ({
        ...t,
        approvals: t.approvals.map((a) => (a.id === approvalId ? { ...a, state, detail } : a)),
      }));
    setState("working");
    try {
      const res = await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ id: approvalId, decision }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return setState("failed", j.error || `Failed (${res.status})`);
      setState(j.status === "rejected" ? "rejected" : "executed");
      onGraphUpdate?.();
    } catch (err: any) {
      setState("failed", err?.message);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void ask(input);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Top Context Subheader */}
      <div className="h-10 px-4 sm:px-8 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium text-[11px]">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>FalkorDB Oracle Online</span>
          </div>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] font-mono text-slate-500 truncate">
            {activeModelObj.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || extractingFile}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
            title="Upload PDF, Word, Excel, Sheets, or TXT"
          >
            {extractingFile ? (
              <Loader2 size={12} className="animate-spin text-indigo-600" />
            ) : (
              <UploadCloud size={12} className="text-indigo-600" />
            )}
            <span>Upload Knowledge Doc / PDF</span>
          </button>

          {turns.length > 0 && (
            <button
              onClick={handleClearChat}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              title="Start new conversation"
            >
              <RotateCcw size={12} />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Empty State */}
          {turns.length === 0 && (
            <div className="space-y-8 pt-8 sm:pt-12 text-center animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                  <Brain size={26} strokeWidth={2.2} />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Enterprise Knowledge &amp; Autonomous Operations
                  </h2>
                  <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Ask questions across your institutional knowledge graph, audit architectural policies, verify downstream dependencies, and orchestrate verified actions.
                  </p>
                </div>
              </div>

              {/* Featured Upload Knowledge File Banner Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group p-4 rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer text-left flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {extractingFile ? (
                      <Loader2 size={20} className="animate-spin text-white" />
                    ) : (
                      <UploadCloud size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Upload Knowledge Document (PDF, Word, Sheet, TXT)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold">
                        Auto-Graph
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Drop any architectural RFC, PRD, Excel spreadsheet, or policy document. Automatically chunks text, maps microservice and decision entities into FalkorDB, and attaches it directly to the agent.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Paperclip size={13} />
                  <span>Choose File</span>
                </button>
              </div>

              {/* Categorized Enterprise Prompt Cards */}
              <div className="grid gap-3 sm:grid-cols-2 text-left">
                {(personal ? PERSONAL_PROMPTS : ENTERPRISE_PROMPTS).map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => ask(item.prompt)}
                      className="group relative flex flex-col justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer text-left space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border ${item.badgeClass}`}
                        >
                          {item.category}
                        </span>
                        <div className="size-6 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                          <Icon size={13} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">
                          {item.prompt}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Recent Instructions */}
              {recentInstructions.length > 0 && (
                <div className="space-y-3 pt-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <History size={14} className="text-indigo-600" />
                    <span>Recent Instructions &amp; Runs</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Live FalkorDB
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentInstructions.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => ask(r.goal)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 text-xs text-slate-700 transition cursor-pointer max-w-full text-left shadow-2xs"
                      >
                        <Sparkles size={11} className="text-indigo-600 shrink-0" />
                        <span className="truncate max-w-sm">{r.goal}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conversation Turns */}
          {turns.map((t) => {
            const validEvents = t.events.map((e) => describe(e)).filter(Boolean);
            const isExpanded = expandedReasoning[t.id] ?? (t.status === "running");

            return (
              <div key={t.id} className="space-y-4 animate-in fade-in duration-150">
                {/* 1. User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-indigo-600 px-4 py-3 text-xs sm:text-sm font-medium text-white shadow-xs leading-relaxed">
                    {t.question}
                  </div>
                </div>

                {/* 2. Assistant Message Box */}
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow">
                  {/* Top Bar inside Assistant Card */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Sparkles size={13} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          CompanyMind Oracle
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {activeModelObj.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.answer && (
                        <button
                          onClick={() => handleCopy(t.id, t.answer)}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Copy answer to clipboard"
                        >
                          {copiedTurnId === t.id ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reasoning & Telemetry Accordion */}
                  {validEvents.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => toggleReasoning(t.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Brain size={14} className="text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            Institutional Reasoning &amp; Graph Traversal
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[10px] font-semibold">
                            {validEvents.length} {validEvents.length === 1 ? "step" : "steps"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-200 space-y-1.5">
                          {validEvents.map((d, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2.5 py-1 text-[11px] text-slate-600 leading-normal"
                            >
                              <span className="mt-0.5 shrink-0">{d!.icon}</span>
                              <span className="flex-1 font-mono text-slate-700">{d!.text}</span>
                              {d!.badge && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 uppercase shrink-0">
                                  {d!.badge}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Processing Indicator */}
                  {t.status === "running" && !t.answer && (
                    <div className="flex items-center gap-2.5 py-2 text-xs font-medium text-indigo-600 animate-pulse">
                      <Loader2 size={15} className="animate-spin text-indigo-600" />
                      <span>Traversing knowledge graph &amp; evaluating policies…</span>
                    </div>
                  )}

                  {/* Rendered Answer */}
                  {t.answer && (
                    <div className="agent-md pt-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.answer}</ReactMarkdown>
                    </div>
                  )}

                  {/* Human-in-the-Loop Approval Card */}
                  {t.approvals.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                          <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                          <span>Action requires your explicit authorization</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono font-semibold">
                          Tool: {a.tool}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-amber-800 tracking-wider">
                          Proposed Payload:
                        </span>
                        <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-white border border-amber-200 p-2.5 text-[11px] font-mono text-amber-950">
                          {JSON.stringify(a.args, null, 2)}
                        </pre>
                      </div>

                      {a.state === "pending" && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => decide(t.id, a.id, "approve")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Check size={13} />
                            <span>Approve &amp; Execute</span>
                          </button>
                          <button
                            onClick={() => decide(t.id, a.id, "reject")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                          >
                            <X size={13} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {a.state === "working" && (
                        <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
                          <Loader2 size={13} className="animate-spin text-amber-600" />
                          <span>Executing tool on authorized connection…</span>
                        </div>
                      )}
                      {a.state === "executed" && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Action authorized and successfully executed.</span>
                        </div>
                      )}
                      {a.state === "rejected" && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <X size={14} className="text-slate-400" />
                          <span>Action rejected by user. Nothing was executed.</span>
                        </div>
                      )}
                      {a.state === "failed" && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                          <CircleAlert size={14} className="text-rose-600" />
                          <span>Failed: {a.detail}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Error Card */}
                  {t.status === "error" && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
                      <CircleAlert size={16} className="mt-0.5 shrink-0 text-rose-600" />
                      <div>
                        <span className="font-semibold">Query Processing Failed: </span>
                        <span>{t.error}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>
      </div>

      {/* Floating Prompt Input Dock */}
      <div className="shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
          className="mx-auto max-w-3xl"
        >
          {/* Active Attachment Pill */}
          {attachment && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs text-indigo-950 animate-in fade-in shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-indigo-600 shrink-0" />
                <span className="font-semibold truncate max-w-xs">{attachment.name}</span>
                <span className="text-[10px] text-indigo-700/80 font-mono">
                  ({Math.round(attachment.size / 1024)} KB · {attachment.chars.toLocaleString()} chars parsed)
                </span>
                {attachment.id ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                    <Check size={10} className="text-emerald-700" />
                    Graph Linked {attachment.entities ? `(${attachment.entities} entities)` : ""}
                  </span>
                ) : (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium px-1.5 py-0.5 rounded">
                    Prompt Context
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded"
                title="Remove attachment"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Attachment Error */}
          {attachmentError && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-800 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CircleAlert size={14} className="text-rose-600 shrink-0" />
                <span>{attachmentError}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentError(null)}
                className="p-1 text-rose-500 hover:text-rose-800 transition-colors cursor-pointer rounded"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-slate-50/80 p-2 shadow-2xs focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelected}
              className="hidden"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.md,.markdown,.json,.yaml,.yml,.xml,.html,.htm,.rtf,.log"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy || extractingFile}
              className="flex h-9 shrink-0 items-center gap-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs text-xs font-semibold"
              title="Upload doc, pdf, excel, or sheet - parses content, links knowledge into graph, and adds to agent context"
            >
              {extractingFile ? (
                <Loader2 size={14} className="animate-spin text-indigo-600" />
              ) : (
                <Paperclip size={14} className="text-indigo-600" />
              )}
              <span className="hidden sm:inline">Attach Doc/PDF</span>
            </button>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                attachment
                  ? `Ask or instruct the AI about ${attachment.name} (e.g. "Summarize this document and trace dependencies")…`
                  : "Ask anything about architecture dependencies, policies, or workflows…"
              }
              className="min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none max-h-32 leading-relaxed"
            />
            <button
              type="submit"
              disabled={busy || (!input.trim() && !attachment)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs transition hover:bg-indigo-500 disabled:opacity-40 cursor-pointer active:scale-95"
              title="Send prompt (Enter)"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowUp size={16} strokeWidth={2.2} />
              )}
            </button>
          </div>

          <div className="mt-1.5 flex items-center justify-between px-2 text-[10px] text-slate-500">
            <span>
              Press <kbd className="font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-[9px]">Enter</kbd> to submit · <kbd className="font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-[9px]">Shift+Enter</kbd> for new line
            </span>
            <span className="hidden sm:inline font-mono text-slate-400">
              Grounded in FalkorDB Causal Knowledge Graph
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
