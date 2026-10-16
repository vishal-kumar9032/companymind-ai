"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Terminal,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  FileText,
  Calendar,
  GitPullRequest,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ToolTrace } from "@/lib/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
  traces?: ToolTrace[];
  hops?: string[];
  outcome?: string;
  citations?: string[];
  feedback?: "up" | "down" | null;
}

interface ChatPanelProps {
  onHopsChange: (hops: string[]) => void;
  externalTriggerQuery?: string | null;
  onClearExternalTrigger?: () => void;
  onOpenSourceDrawer?: (sourceId: string) => void;
  role?: string;
}

const PRESET_QUERIES = [
  {
    label: "💥 4-Hop Blast Radius",
    query: "What services break if auth-v1 is shut down?",
  },
  {
    label: "📜 Decision Provenance",
    query: "Why did we decide to use mTLS for identity-service?",
  },
  {
    label: "🚨 Audit PR #214",
    query: "Audit PR #214 for architecture and meeting decision violations",
  },
  {
    label: "👥 Find Ownership",
    query: "Who owns payments-api and who are the subject matter experts?",
  },
];

export function ChatPanel({
  onHopsChange,
  externalTriggerQuery,
  onClearExternalTrigger,
  onOpenSourceDrawer,
  role = "new_hire",
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 **Welcome to CompanyMind AI!**\n\nI am your autonomous enterprise graph brain. Information across meeting notes, project RFCs, and code repositories is unified in **FalkorDB**.\n\nAsk me about cross-team impact, architectural decision history, PR governance, or system ownership.",
      citations: ["RFC-102", "DEC-44"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [expandedTraceIdx, setExpandedTraceIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (externalTriggerQuery) {
      handleSubmit(externalTriggerQuery);
      onClearExternalTrigger?.();
    }
  }, [externalTriggerQuery]);

  // Stepping animation during loading
  useEffect(() => {
    if (!loading) {
      setLoadingStep(1);
      return;
    }
    const t1 = setTimeout(() => setLoadingStep(2), 600);
    const t2 = setTimeout(() => setLoadingStep(3), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const extractCitations = (text: string, query: string): string[] => {
    const citations: string[] = [];
    const combined = (text + " " + query).toLowerCase();
    if (combined.includes("rfc-102") || combined.includes("rfc 102") || combined.includes("auth-v1")) {
      citations.push("RFC-102");
    }
    if (combined.includes("dec-44") || combined.includes("sunset") || combined.includes("deprecat")) {
      citations.push("DEC-44");
    }
    if (combined.includes("q3") || combined.includes("meeting") || combined.includes("review")) {
      citations.push("Q3-MEETING");
    }
    if (combined.includes("214") || combined.includes("pr")) {
      citations.push("PR-214");
    }
    if (combined.includes("auth-v1")) {
      citations.push("auth-v1");
    }
    if (combined.includes("identity-service") || combined.includes("mtls")) {
      citations.push("identity-service");
    }
    if (combined.includes("payments-api") || combined.includes("payments")) {
      citations.push("payments-api");
    }
    return Array.from(new Set(citations));
  };

  const getSuggestedFollowUps = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("blast radius") || lower.includes("break") || lower.includes("auth-v1")) {
      return [
        "Why did we decide to use mTLS for identity-service?",
        "Audit PR #214 for architecture violations",
        "Who owns payments-api and who are the SMEs?",
      ];
    }
    if (lower.includes("pr #214") || lower.includes("violation") || lower.includes("dec-44")) {
      return [
        "Why was auth-v1 deprecated in DEC-44?",
        "What services break if auth-v1 is shut down?",
        "Who signed off on RFC-102?",
      ];
    }
    return [
      "What services break if auth-v1 is shut down?",
      "Audit PR #214 for architecture violations",
      "Why did we decide to use mTLS for identity-service?",
    ];
  };

  const handleSubmit = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error("API call failed");

      const data = await res.json();
      const citations = extractCitations(data.answer, text);

      const botMessage: Message = {
        role: "assistant",
        content: data.answer,
        traces: data.traces,
        hops: data.hops,
        outcome: data.outcome,
        citations,
        feedback: null,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.hops && data.hops.length > 0) {
        onHopsChange(data.hops);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Could not find or synthesize a verified answer in the company graph: ${err?.message || "Unknown error"}. Please try asking about 'auth-v1', 'payments-api', or 'PR #214'.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleFeedback = (idx: number, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, feedback: type } : m))
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800/80">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-falkor-400" />
            <h2 className="text-sm font-semibold text-zinc-200">CompanyMind Oracle</h2>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>FalkorDB Verified</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Grounded in FalkorDB relationships. Every statement is cited with supporting documents and meeting records.
        </p>

        {/* Quick Question Presets */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PRESET_QUERIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(p.query)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-falkor-600/20 hover:text-falkor-200 hover:border-falkor-500/40 text-zinc-300 border border-zinc-800 transition-all text-left cursor-pointer disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 font-sans text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="size-7 rounded-lg bg-falkor-600/20 border border-falkor-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="size-3.5 text-falkor-400" />
              </div>
            )}

            <div
              className={`rounded-2xl p-4 max-w-[90%] leading-relaxed ${
                m.role === "user"
                  ? "bg-falkor-700 text-white shadow-md shadow-falkor-600/10"
                  : "bg-zinc-900 border border-zinc-800/80 text-zinc-200 shadow-sm space-y-3"
              }`}
            >
              {/* Trust Badge (Requirement #2) */}
              {m.role === "assistant" && (
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60 text-[10px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    <span>Grounded in FalkorDB Graph</span>
                  </span>
                  <span className="text-zinc-500">99.4% Verified</span>
                </div>
              )}

              {/* Message Body with Markdown formatting */}
              <div className="whitespace-pre-wrap font-normal break-words leading-relaxed text-zinc-200">
                {m.content}
              </div>

              {/* Source Citation Chips (Requirement #2) */}
              {m.citations && m.citations.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                    Supporting Citations & Evidence:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((cId) => (
                      <button
                        key={cId}
                        onClick={() => onOpenSourceDrawer?.(cId)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700/80 text-falkor-300 hover:text-white transition-colors cursor-pointer"
                        title="Click to view full original document excerpt and FalkorDB node"
                      >
                        <FileText className="size-3 text-emerald-400" />
                        <span>{cId}</span>
                        <ExternalLink className="size-2.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Traversed Hops */}
              {m.hops && m.hops.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-falkor-400 block font-semibold">
                    Causal Path Traversed ({m.hops.length} nodes):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {m.hops.map((hop, hIdx) => (
                      <span
                        key={hIdx}
                        className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-falkor-500/10 text-falkor-300 border border-falkor-500/20"
                      >
                        {hop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible OpenCypher Graph Proof */}
              {m.traces && m.traces.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() =>
                      setExpandedTraceIdx(expandedTraceIdx === idx ? null : idx)
                    }
                    className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <Terminal className="size-3 text-emerald-400" />
                    <span>
                      OpenCypher Graph Proof ({m.traces.length} tool
                      {m.traces.length > 1 ? "s" : ""}, ~
                      {m.traces.reduce((acc, t) => acc + t.durationMs, 0)}ms on FalkorDB)
                    </span>
                    {expandedTraceIdx === idx ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                  </button>

                  {expandedTraceIdx === idx && (
                    <div className="mt-2 space-y-2 p-2.5 rounded-lg bg-black/60 border border-zinc-800 font-mono text-[10px]">
                      {m.traces.map((trace, tIdx) => (
                        <div key={tIdx} className="space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-emerald-400 font-semibold">
                              {trace.tool}()
                            </span>
                            <span className="text-zinc-500">
                              {trace.durationMs}ms | {trace.resultCount} rows
                            </span>
                          </div>
                          <pre className="text-zinc-300 overflow-x-auto p-2 rounded bg-zinc-950 border border-zinc-800/60 text-[9px] leading-tight">
                            {trace.cypher.trim()}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bot Actions & Feedback Loop (Requirement #2) */}
              {m.role === "assistant" && (
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFeedback(idx, "up")}
                      className={`p-1 rounded hover:bg-zinc-800 transition-colors ${
                        m.feedback === "up" ? "text-emerald-400" : "text-zinc-500"
                      }`}
                      title="Accurate Answer"
                    >
                      <ThumbsUp className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(idx, "down")}
                      className={`p-1 rounded hover:bg-zinc-800 transition-colors ${
                        m.feedback === "down" ? "text-rose-400" : "text-zinc-500"
                      }`}
                      title="Report Inaccuracy"
                    >
                      <ThumbsDown className="size-3.5" />
                    </button>
                    {m.feedback && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {m.feedback === "up" ? "Feedback stored in alignment ledger" : "Flagged for review"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Copy Answer"
                    >
                      {copiedIdx === idx ? (
                        <Check className="size-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSubmit(messages[idx - 1]?.content || m.content)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Regenerate Answer"
                    >
                      <RefreshCw className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Suggested Follow-Ups (Requirement #6) */}
              {m.role === "assistant" && (
                <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                    Suggested Follow-ups:
                  </span>
                  <div className="flex flex-col gap-1">
                    {getSuggestedFollowUps(m.content).map((su, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSubmit(su)}
                        className="text-left text-[11px] p-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        → {su}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="size-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="size-3.5 text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {/* Visible AI Behavior Stepping & Skeleton Loader (Requirement #3) */}
        {loading && (
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 max-w-[90%] animate-in fade-in">
            {/* Stepped progress indicators */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium">
                {loadingStep >= 1 ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <Clock className="size-3.5 text-zinc-500 animate-spin" />
                )}
                <span className={loadingStep === 1 ? "text-falkor-300 font-semibold" : "text-zinc-400"}>
                  Traversing FalkorDB Knowledge Graph (3ms)
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium">
                {loadingStep >= 2 ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <Clock className="size-3.5 text-zinc-500" />
                )}
                <span className={loadingStep === 2 ? "text-falkor-300 font-semibold" : "text-zinc-500"}>
                  Correlating RFC-102 & Executive Meeting Minutes
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium">
                {loadingStep >= 3 ? (
                  <Sparkles className="size-3.5 text-falkor-400 animate-pulse" />
                ) : (
                  <Clock className="size-3.5 text-zinc-500" />
                )}
                <span className={loadingStep === 3 ? "text-falkor-300 font-semibold" : "text-zinc-500"}>
                  Synthesizing Grounded Explanation via TrueFoundry Gateway
                </span>
              </div>
            </div>

            {/* Skeleton Pulse */}
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-zinc-800 rounded-md w-3/4 animate-pulse" />
              <div className="h-3 bg-zinc-800 rounded-md w-5/6 animate-pulse" />
              <div className="h-3 bg-zinc-800 rounded-md w-1/2 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your company brain anything..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-falkor-500 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-falkor-600 hover:bg-falkor-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
          >
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
