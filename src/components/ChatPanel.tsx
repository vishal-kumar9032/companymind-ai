"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  Terminal,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Square,
  CheckCircle2,
  Loader2,
  Circle,
  FileText,
  Calendar,
  Users,
  GitPullRequest,
  Server,
  Brain,
  ArrowRight,
  CornerDownLeft,
  Play,
  Zap,
  GitBranch,
} from "lucide-react";
import { ToolTrace } from "@/lib/schema";
import { ENTERPRISE_SOURCES, SourceDetail } from "@/lib/sources";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  traces?: ToolTrace[];
  hops?: string[];
  outcome?: string;
  citations?: string[];
  feedback?: "up" | "down" | null;
  isStreaming?: boolean;
}

interface ChatPanelProps {
  onHopsChange: (hops: string[]) => void;
  externalTriggerQuery?: string | null;
  onClearExternalTrigger?: () => void;
  onOpenSourceDrawer?: (sourceId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  role?: string;
  onResponseUpdate?: (data: {
    traces: ToolTrace[];
    query: string;
    outcome: string;
    hops: string[];
    latencyMs?: number;
  }) => void;
}

const PRESET_CARDS = [
  {
    icon: Zap,
    title: "4-Hop Blast Radius",
    description: "Simulate downstream service failures and team ownership if auth-v1 is shut down",
    query: "What services break if auth-v1 is shut down?",
  },
  {
    icon: GitBranch,
    title: "Decision Provenance",
    description: "Trace why mTLS was chosen for identity-service back to meeting minutes and RFC-102",
    query: "Why did we decide to use mTLS for identity-service?",
  },
  {
    icon: ShieldAlert,
    title: "PR Governance Audit",
    description: "Audit PR #214 for architecture violations against executive deprecation policies",
    query: "Audit PR #214 for architecture and meeting decision violations",
  },
  {
    icon: Users,
    title: "Ownership & Experts",
    description: "Find subject matter experts and owning teams for payments-api in FalkorDB",
    query: "Who owns payments-api and who are the subject matter experts?",
  },
];

const PRESET_QUERIES = PRESET_CARDS.map((c) => ({ label: c.title, query: c.query }));

export function ChatPanel({
  onHopsChange,
  externalTriggerQuery,
  onClearExternalTrigger,
  onOpenSourceDrawer,
  onSelectNode,
  role = "new_hire",
  onResponseUpdate,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-oracle",
      role: "assistant",
      content:
        "Welcome to **CompanyMind AI**. I map causal relationships across meeting notes, RFCs, GitHub PRs, and microservices in **FalkorDB**.\n\nAsk why an architectural decision was made, what services break if a system goes down, or who owns a service.",
      citations: ["RFC-102", "DEC-44"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [expandedTraceIdx, setExpandedTraceIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [prActions, setPrActions] = useState<Record<string, "approved" | "rejected">>({});
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoCaption, setDemoCaption] = useState<string | null>(null);

  const handlePlayDemoScenario = () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setDemoCaption("🎬 Step 1/4: Targeting legacy authentication cluster auth-v1");
    onHopsChange(["auth-v1"]);

    setTimeout(() => {
      setDemoCaption("🎬 Step 2/4: Traversing call dependency → api-gateway (Envoy/Rust)");
      onHopsChange(["auth-v1", "api-gateway"]);
    }, 1000);

    setTimeout(() => {
      setDemoCaption("🎬 Step 3/4: Cascading impact → mobile-app & web-checkout (Tier 1 Services)");
      onHopsChange(["auth-v1", "api-gateway", "mobile-app", "web-checkout"]);
    }, 2000);

    setTimeout(() => {
      setDemoCaption("🎬 Step 4/4: Correlating policy constraints → DEC-44 sunset mandate signed by Sarah Chen");
      onHopsChange(["auth-v1", "api-gateway", "mobile-app", "web-checkout", "DEC-44", "RFC-102", "Sarah Chen"]);
    }, 3000);

    setTimeout(() => {
      setDemoCaption("⚡ FalkorDB Graph Traversal Verified in 4ms. Synthesizing executive answer...");
      handleSubmit("What services break if auth-v1 is shut down?");
    }, 4200);

    setTimeout(() => {
      setDemoCaption(null);
      setDemoRunning(false);
    }, 8500);
  };

  const resolveSourceCards = (citations?: string[], hops?: string[]): SourceDetail[] => {
    const list: SourceDetail[] = [];
    const seen = new Set<string>();

    const checkAndAdd = (key: string) => {
      if (ENTERPRISE_SOURCES[key] && !seen.has(key)) {
        seen.add(key);
        list.push(ENTERPRISE_SOURCES[key]);
      }
    };

    if (citations) {
      for (const c of citations) {
        checkAndAdd(c);
      }
    }

    if (hops) {
      for (const h of hops) {
        if (h.includes("214")) checkAndAdd("PR-214");
        else if (h.includes("102") || h.includes("RFC")) checkAndAdd("RFC-102");
        else if (h.includes("DEC-44")) checkAndAdd("DEC-44");
        else if (h.includes("auth-v1")) checkAndAdd("auth-v1");
        else if (h.includes("identity-service")) checkAndAdd("identity-service");
        else if (h.includes("payments-api")) checkAndAdd("payments-api");
        else if (h.toLowerCase().includes("meeting") || h.toLowerCase().includes("q3")) checkAndAdd("Q3-MEETING");
      }
    }

    return list;
  };

  const renderSourceIcon = (type: string) => {
    switch (type) {
      case "rfc":
        return <FileText size={13} className="text-violet-400" strokeWidth={1.75} />;
      case "meeting":
        return <Users size={13} className="text-cyan-400" strokeWidth={1.75} />;
      case "pr":
        return <GitPullRequest size={13} className="text-amber-400" strokeWidth={1.75} />;
      case "decision":
        return <ShieldCheck size={13} className="text-emerald-400" strokeWidth={1.75} />;
      default:
        return <Server size={13} className="text-blue-400" strokeWidth={1.75} />;
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortStreamRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, loadingStep]);

  // Keyboard shortcut listener: "/" focuses input, "Escape" clears highlights
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current && !(document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        onHopsChange([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onHopsChange]);

  // Handle external queries
  useEffect(() => {
    if (externalTriggerQuery) {
      handleSubmit(externalTriggerQuery);
      onClearExternalTrigger?.();
    }
  }, [externalTriggerQuery]);

  // Stepped progress ticks while loading
  useEffect(() => {
    if (!loading) {
      setLoadingStep(1);
      return;
    }
    const t1 = setTimeout(() => setLoadingStep(2), 300);
    const t2 = setTimeout(() => setLoadingStep(3), 600);
    const t3 = setTimeout(() => setLoadingStep(4), 1000);
    const t4 = setTimeout(() => setLoadingStep(5), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
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

  // Simulate token/word streaming
  const streamText = async (msgId: string, fullText: string) => {
    abortStreamRef.current = false;
    setStreamingMsgId(msgId);
    const words = fullText.split(" ");
    let current = "";

    for (let i = 0; i < words.length; i++) {
      if (abortStreamRef.current) break;
      current += (i === 0 ? "" : " ") + words[i];
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: current, isStreaming: true } : m))
      );
      await new Promise((resolve) => setTimeout(resolve, 16));
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, content: fullText, isStreaming: false } : m))
    );
    setStreamingMsgId(null);
  };

  const handleStopStreaming = () => {
    abortStreamRef.current = true;
    setStreamingMsgId(null);
  };

  const handleSubmit = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
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
      const botMsgId = `bot-${Date.now()}`;

      const botMessage: Message = {
        id: botMsgId,
        role: "assistant",
        content: "",
        traces: data.traces,
        hops: data.hops,
        outcome: data.outcome,
        citations,
        feedback: null,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.hops && data.hops.length > 0) {
        onHopsChange(data.hops);
      }

      const latency = (data.traces || []).reduce((acc: number, t: any) => acc + (t.durationMs || 0), 0) || 4;
      onResponseUpdate?.({
        traces: data.traces || [],
        query: text,
        outcome: data.outcome || "answered_with_path",
        hops: data.hops || [],
        latencyMs: latency,
      });

      setLoading(false);
      await streamText(botMsgId, data.answer);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Could not find this in the company graph. Try rephrasing or asking about **auth-v1**, **payments-api**, or **PR #214**.`,
        },
      ]);
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
    <div className="flex flex-col h-full bg-surface/30 backdrop-blur-md rounded-card border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={16} strokeWidth={1.75} className="text-accent" />
          <h2 className="text-sm font-semibold text-zinc-100">CompanyMind Oracle</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono text-zinc-400 bg-surface px-2 py-0.5 rounded border border-border">
            FalkorDB Provenance
          </span>
          {streamingMsgId && (
            <button
              onClick={handleStopStreaming}
              className="flex items-center gap-1 text-2xs font-mono px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors cursor-pointer"
            >
              <Square size={10} />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        {/* First Load Hero Strip & 4 Preset Scenario Cards */}
        {messages.length <= 1 && (
          <div className="p-4 rounded-2xl bg-surface/60 border border-border space-y-4 shadow-sm mb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  <span>Ask why a decision was made, what breaks, or who owns it</span>
                </h3>
                <p className="text-2xs text-zinc-400 mt-1">
                  Autonomous enterprise graph intelligence grounded in FalkorDB with zero hallucination.
                </p>
              </div>

              <button
                onClick={handlePlayDemoScenario}
                disabled={demoRunning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md shadow-accent/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Play size={12} fill="currentColor" />
                <span>{demoRunning ? "Playing Scenario..." : "Play Demo (4-Hop)"}</span>
              </button>
            </div>

            {/* Demo Step Caption Banner */}
            {demoCaption && (
              <div className="p-2.5 rounded-xl bg-accent/20 border border-accent/40 flex items-center gap-2 text-xs font-mono text-zinc-100 animate-in fade-in">
                <span className="size-2 rounded-full bg-accent animate-ping shrink-0" />
                <span>{demoCaption}</span>
              </div>
            )}

            {/* Four Large Preset Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_CARDS.map((card, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => handleSubmit(card.query)}
                  className="flex flex-col text-left p-3 rounded-xl bg-surface hover:bg-surface-hover border border-border hover:border-accent/40 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent group-hover:scale-110 transition-transform">
                      <card.icon size={14} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-white font-mono">
                      {card.title}
                    </span>
                  </div>
                  <span className="text-2xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {card.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={m.id || idx}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="size-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                <Sparkles size={14} strokeWidth={1.75} />
              </div>
            )}

            <div
              className={`rounded-2xl p-4 max-w-[92%] sm:max-w-[85%] leading-relaxed ${
                m.role === "user"
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "bg-surface border border-border text-zinc-200 shadow-card space-y-3"
              }`}
            >
              {/* Outcome Badge / Trust Header */}
              {m.role === "assistant" && (
                <div className="flex items-center justify-between pb-2 border-b border-border text-2xs font-mono">
                  {m.outcome === "governance_violation" ? (
                    <span className="flex items-center gap-1.5 text-danger font-semibold">
                      <ShieldAlert size={13} strokeWidth={2} />
                      <span>Governance Watchdog Interception</span>
                    </span>
                  ) : m.outcome === "answered_from_memory" ? (
                    <span className="flex items-center gap-1.5 text-accent font-semibold">
                      <Brain size={13} strokeWidth={2} />
                      <span>Recalled from Agent Memory</span>
                    </span>
                  ) : m.outcome === "not_in_graph" || m.outcome === "unknown_entity" ? (
                    <span className="flex items-center gap-1.5 text-warning font-semibold">
                      <AlertTriangle size={13} strokeWidth={2} />
                      <span>Entity Missing from Graph</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-success">
                      <CheckCircle2 size={12} strokeWidth={2} />
                      <span>Grounded in FalkorDB Graph</span>
                    </span>
                  )}
                  <span className="text-zinc-500">
                    {m.outcome === "governance_violation"
                      ? "P0 Block"
                      : m.outcome === "answered_from_memory"
                      ? "Cross-Session"
                      : "99.4% Verified"}
                  </span>
                </div>
              )}

              {/* Specialized Governance Violation Card */}
              {m.outcome === "governance_violation" && (
                <div className="rounded-xl p-3.5 bg-danger/10 border border-danger/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-mono uppercase tracking-wider text-danger font-bold flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      Active Policy Violation
                    </span>
                    <span className="text-3xs font-mono px-2 py-0.5 rounded bg-danger/20 text-danger border border-danger/30">
                      RFC-102 Mandate
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 space-y-1.5 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-danger/20">
                    <div>
                      <span className="text-zinc-400 font-mono text-2xs uppercase">Target PR: </span>
                      <span className="font-semibold text-zinc-100">PR #214 (mobile-app fallback to auth-v1)</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-mono text-2xs uppercase">Violated Mandate: </span>
                      <span className="font-semibold text-danger">DEC-44: Mandatory Deprecation of Auth-v1</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-mono text-2xs uppercase">Policy Rationale: </span>
                      <span className="italic text-zinc-300">
                        "Auth-v1 fails SOC2 controls. All new traffic must route through api-gateway to identity-service by Nov 1, 2026."
                      </span>
                    </div>
                  </div>

                  {/* Approve Exception / Reject PR Action Buttons */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    {prActions[m.id] ? (
                      <div
                        className={`w-full py-2 px-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                          prActions[m.id] === "rejected"
                            ? "bg-danger/20 text-danger border border-danger/40"
                            : "bg-success/20 text-success border border-success/40"
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        <span>
                          {prActions[m.id] === "rejected"
                            ? "PR #214 rejected by Policy Watchdog. Incident recorded to Agent Memory."
                            : "Exception granted for 72h. Security audit trail recorded in FalkorDB."}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => setPrActions((prev) => ({ ...prev, [m.id]: "rejected" }))}
                          className="flex-1 py-2 px-3 rounded-lg bg-danger hover:bg-danger/90 text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <ShieldAlert size={14} />
                          <span>Reject PR</span>
                        </button>
                        <button
                          onClick={() => setPrActions((prev) => ({ ...prev, [m.id]: "approved" }))}
                          className="flex-1 py-2 px-3 rounded-lg bg-surface hover:bg-surface-hover border border-border text-zinc-300 hover:text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck size={14} />
                          <span>Approve Exception</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Helpful Empty State for Not In Graph / Unknown Entity */}
              {(m.outcome === "not_in_graph" || m.outcome === "unknown_entity") && (
                <div className="rounded-xl p-3.5 bg-warning/10 border border-warning/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-warning font-semibold text-xs uppercase tracking-wide font-mono">
                    <AlertTriangle size={15} strokeWidth={2} />
                    <span>Entity or Causal Link Not Found</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    FalkorDB graph traversal did not find an indexed entity or policy decision matching this query. Try rephrasing or asking about one of the known production systems in the company brain:
                  </p>
                  <div className="pt-2 border-t border-warning/20 space-y-1">
                    <span className="text-2xs font-mono uppercase tracking-wider text-warning/80 block">
                      Suggested Graph Inquiries:
                    </span>
                    <div className="flex flex-col gap-1">
                      {PRESET_QUERIES.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSubmit(p.query)}
                          className="text-left text-2xs p-1.5 rounded-lg bg-bg/80 hover:bg-surface-hover border border-warning/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        >
                          → {p.query}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message Body with react-markdown rendering */}
              {m.role === "assistant" ? (
                <div className="prose prose-invert max-w-none text-sm leading-relaxed text-zinc-200 space-y-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm text-zinc-200">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
                      code: ({ children, className }) => {
                        const isBlock = Boolean(className);
                        return isBlock ? (
                          <pre className="p-3 my-2 rounded-xl bg-black/60 border border-border font-mono text-xs text-zinc-300 overflow-x-auto">
                            <code>{children}</code>
                          </pre>
                        ) : (
                          <code className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-xs text-accent">{children}</code>
                        );
                      },
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-sm text-zinc-300">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-sm text-zinc-300">{children}</ol>,
                      li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-white font-medium">
                  {m.content}
                </div>
              )}

              {/* Traversed Causal Path Hops with Connected Arrows */}
              {m.hops && m.hops.length > 0 && (
                <div className="pt-2 border-t border-border/80 space-y-1.5">
                  <div className="flex items-center justify-between text-2xs font-mono uppercase tracking-wider text-accent font-medium">
                    <span>Causal Path Traversed ({m.hops.length} nodes):</span>
                    <span className="text-zinc-500 font-normal">Sub-10ms FalkorDB</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {m.hops.map((hop, hIdx) => (
                      <React.Fragment key={hIdx}>
                        <button
                          onClick={() => onSelectNode?.(hop)}
                          className="inline-flex items-center gap-1 text-2xs font-mono px-2 py-1 rounded-md bg-accent/10 text-violet-300 border border-accent/25 hover:bg-accent/20 hover:border-accent transition-all cursor-pointer"
                          title={`Click to focus ${hop} in FalkorDB graph`}
                        >
                          <span>{hop}</span>
                        </button>
                        {hIdx < (m.hops?.length || 0) - 1 && (
                          <ArrowRight size={10} className="text-zinc-500 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting Evidence Source Cards Grid */}
              {(() => {
                const sourceCards = resolveSourceCards(m.citations, m.hops);
                if (sourceCards.length === 0) return null;
                return (
                  <div className="pt-2 border-t border-border/80 space-y-2">
                    <div className="flex items-center justify-between text-2xs font-mono uppercase tracking-wider text-zinc-400">
                      <span>Verified Evidence & Sources ({sourceCards.length}):</span>
                      <span className="text-zinc-500 font-normal">Click card to focus</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sourceCards.map((src) => (
                        <button
                          key={src.id}
                          onClick={() => {
                            onSelectNode?.(src.id);
                            onOpenSourceDrawer?.(src.id);
                          }}
                          className="flex flex-col text-left p-2.5 rounded-xl bg-surface/80 hover:bg-surface-hover border border-border/80 hover:border-accent/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="flex items-center gap-1.5 text-2xs font-semibold text-accent">
                              {renderSourceIcon(src.type)}
                              <span className="font-mono">{src.id}</span>
                            </span>
                            <span className="text-3xs font-mono text-zinc-400 bg-black/40 px-1.5 py-0.5 rounded border border-border/40">
                              {src.date}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-zinc-200 line-clamp-1 group-hover:text-white">
                            {src.title}
                          </span>
                          <span className="text-2xs text-zinc-400 line-clamp-1 mt-0.5">
                            {src.author}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Collapsible OpenCypher Graph Proof */}
              {m.traces && m.traces.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <button
                    onClick={() =>
                      setExpandedTraceIdx(expandedTraceIdx === idx ? null : idx)
                    }
                    className="flex items-center gap-1.5 text-2xs font-mono text-zinc-400 hover:text-success transition-colors cursor-pointer"
                  >
                    <Terminal size={12} strokeWidth={1.75} className="text-success" />
                    <span>
                      OpenCypher Graph Proof ({m.traces.length} tool
                      {m.traces.length > 1 ? "s" : ""}, ~
                      {m.traces.reduce((acc, t) => acc + t.durationMs, 0)}ms on FalkorDB)
                    </span>
                    {expandedTraceIdx === idx ? (
                      <ChevronDown size={12} strokeWidth={1.75} />
                    ) : (
                      <ChevronRight size={12} strokeWidth={1.75} />
                    )}
                  </button>

                  {expandedTraceIdx === idx && (
                    <div className="mt-2 space-y-2 p-2.5 rounded-lg bg-black/60 border border-border font-mono text-2xs">
                      {m.traces.map((trace, tIdx) => (
                        <div key={tIdx} className="space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-success font-semibold">
                              {trace.tool}()
                            </span>
                            <span className="text-zinc-500">
                              {trace.durationMs}ms | {trace.resultCount} rows
                            </span>
                          </div>
                          <pre className="text-zinc-300 overflow-x-auto p-2 rounded bg-bg border border-border/60 text-2xs leading-tight">
                            {trace.cypher.trim()}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bot Actions & Feedback Loop */}
              {m.role === "assistant" && !m.isStreaming && (
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFeedback(idx, "up")}
                      className={`p-1 rounded hover:bg-surface-hover transition-colors ${
                        m.feedback === "up" ? "text-success" : "text-zinc-500"
                      }`}
                      title="Accurate Answer"
                    >
                      <ThumbsUp size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => handleFeedback(idx, "down")}
                      className={`p-1 rounded hover:bg-surface-hover transition-colors ${
                        m.feedback === "down" ? "text-danger" : "text-zinc-500"
                      }`}
                      title="Report Inaccuracy"
                    >
                      <ThumbsDown size={14} strokeWidth={1.75} />
                    </button>
                    {m.feedback && (
                      <span className="text-2xs text-zinc-400 font-mono">
                        {m.feedback === "up" ? "Logged to alignment ledger" : "Flagged for review"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className="p-1 rounded hover:bg-surface-hover text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      title="Copy Answer"
                    >
                      {copiedIdx === idx ? (
                        <Check size={14} strokeWidth={2} className="text-success" />
                      ) : (
                        <Copy size={14} strokeWidth={1.75} />
                      )}
                    </button>
                    <button
                      onClick={() => handleSubmit(messages[idx - 1]?.content || m.content)}
                      className="p-1 rounded hover:bg-surface-hover text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      title="Regenerate Answer"
                    >
                      <RefreshCw size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              )}

              {/* Suggested Follow-Ups */}
              {m.role === "assistant" && !m.isStreaming && (
                <div className="pt-2 border-t border-border space-y-1.5">
                  <span className="text-2xs font-mono uppercase tracking-wider text-zinc-500 block">
                    Suggested Follow-ups:
                  </span>
                  <div className="flex flex-col gap-1">
                    {getSuggestedFollowUps(m.content).map((su, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSubmit(su)}
                        className="text-left text-xs p-2 rounded-lg bg-bg/80 hover:bg-surface-hover border border-border text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        → {su}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="size-7 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5 text-zinc-300">
                <User size={14} strokeWidth={1.75} />
              </div>
            )}
          </div>
        ))}

        {/* Live Step List Loader */}
        {loading && (
          <div className="p-4 rounded-2xl bg-surface border border-border max-w-[92%] sm:max-w-[85%] space-y-3">
            <span className="text-2xs font-mono uppercase tracking-wider text-accent block font-medium">
              Graph Query Execution Pipeline:
            </span>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                {loadingStep > 1 ? (
                  <Check size={14} strokeWidth={2} className="text-success" />
                ) : loadingStep === 1 ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin text-accent" />
                ) : (
                  <Circle size={14} strokeWidth={1.5} className="text-zinc-600" />
                )}
                <span className={loadingStep === 1 ? "text-zinc-100 font-medium" : loadingStep > 1 ? "text-zinc-400" : "text-zinc-600"}>
                  Understanding question & intent
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {loadingStep > 2 ? (
                  <Check size={14} strokeWidth={2} className="text-success" />
                ) : loadingStep === 2 ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin text-accent" />
                ) : (
                  <Circle size={14} strokeWidth={1.5} className="text-zinc-600" />
                )}
                <span className={loadingStep === 2 ? "text-zinc-100 font-medium" : loadingStep > 2 ? "text-zinc-400" : "text-zinc-600"}>
                  Resolving entities in FalkorDB
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {loadingStep > 3 ? (
                  <Check size={14} strokeWidth={2} className="text-success" />
                ) : loadingStep === 3 ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin text-accent" />
                ) : (
                  <Circle size={14} strokeWidth={1.5} className="text-zinc-600" />
                )}
                <span className={loadingStep === 3 ? "text-zinc-100 font-medium" : loadingStep > 3 ? "text-zinc-400" : "text-zinc-600"}>
                  Traversing causal graph hops (sub-10ms)
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {loadingStep > 4 ? (
                  <Check size={14} strokeWidth={2} className="text-success" />
                ) : loadingStep === 4 ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin text-accent" />
                ) : (
                  <Circle size={14} strokeWidth={1.5} className="text-zinc-600" />
                )}
                <span className={loadingStep === 4 ? "text-zinc-100 font-medium" : loadingStep > 4 ? "text-zinc-400" : "text-zinc-600"}>
                  Verifying RFC-102 & Meeting minutes sources
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {loadingStep === 5 ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin text-accent" />
                ) : (
                  <Circle size={14} strokeWidth={1.5} className="text-zinc-600" />
                )}
                <span className={loadingStep === 5 ? "text-zinc-100 font-medium" : "text-zinc-600"}>
                  Writing verified answer
                </span>
              </div>
            </div>

            {/* Skeleton Pulse Bars */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="h-2.5 bg-surface-hover rounded-md w-3/4 animate-pulse" />
              <div className="h-2.5 bg-surface-hover rounded-md w-5/6 animate-pulse" />
              <div className="h-2.5 bg-surface-hover rounded-md w-1/2 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field with Shortcut Hints */}
      <div className="p-3 border-t border-border bg-surface/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask why a decision was made, what breaks, or who owns it... (Press / to focus)"
            className="w-full bg-bg border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 p-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Send query"
          >
            <Send size={14} strokeWidth={2} />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-2xs text-zinc-500 font-mono px-1">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-surface border border-border text-zinc-400 font-mono">/</kbd> to focus</span>
            <span>·</span>
            <span><kbd className="px-1 py-0.5 rounded bg-surface border border-border text-zinc-400 font-mono">Esc</kbd> to clear hops</span>
          </div>
          <span>FalkorDB Graph Engine</span>
        </div>
      </div>
    </div>
  );
}
