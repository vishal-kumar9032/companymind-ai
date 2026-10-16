"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Terminal, ChevronDown, ChevronRight, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { ToolTrace } from "@/lib/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
  traces?: ToolTrace[];
  hops?: string[];
  outcome?: string;
}

interface ChatPanelProps {
  onHopsChange: (hops: string[]) => void;
  externalTriggerQuery?: string | null;
  onClearExternalTrigger?: () => void;
}

const PRESET_QUERIES = [
  {
    label: "💥 4-Hop Blast Radius",
    query: "What services break if auth-v1 is shut down?",
  },
  {
    label: "📜 Decision Provenance",
    query: "Why did we sunset auth-v1 and what RFC proposed it?",
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
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 **Welcome to CompanyMind AI!**\n\nI am your enterprise intelligence graph agent. Useful information across your meeting notes, project RFCs, task records, and microservices is unified into **FalkorDB**.\n\nAsk me about cross-team impact, architectural decision history, PR governance, or system ownership.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedTraceIdx, setExpandedTraceIdx] = useState<number | null>(null);
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
      const botMessage: Message = {
        role: "assistant",
        content: data.answer,
        traces: data.traces,
        hops: data.hops,
        outcome: data.outcome,
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
          content: `⚠️ Failed to query graph brain: ${err?.message || "Unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800/80">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/40">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="size-4 text-falkor-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Autonomous Company Oracle</h2>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Grounded in FalkorDB relationships. Traces decisions back to supporting documents and meeting records.
        </p>

        {/* Quick Question Presets */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PRESET_QUERIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(p.query)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-falkor-600/20 hover:text-falkor-200 hover:border-falkor-500/40 text-zinc-300 border border-zinc-700/50 transition-all text-left cursor-pointer disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
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
              className={`rounded-xl p-3.5 max-w-[90%] leading-relaxed ${
                m.role === "user"
                  ? "bg-falkor-700 text-white shadow-md shadow-falkor-600/10"
                  : "bg-zinc-900 border border-zinc-800/80 text-zinc-200 shadow-sm"
              }`}
            >
              {/* Message Body with Markdown styling */}
              <div className="whitespace-pre-wrap space-y-1 font-normal break-words">
                {m.content}
              </div>

              {/* Hop Chain Badge */}
              {m.hops && m.hops.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-falkor-400 block mb-1">
                    🧭 Traversed Hops ({m.hops.length} nodes):
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

              {/* Collapsible Cypher Query Execution Trace */}
              {m.traces && m.traces.length > 0 && (
                <div className="mt-3 pt-2 border-t border-zinc-800/80">
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
                    <div className="mt-2 space-y-2 p-2 rounded-lg bg-black/60 border border-zinc-800/80 font-mono text-[10px]">
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
                          <pre className="text-zinc-400 overflow-x-auto p-1.5 rounded bg-zinc-950/80 border border-zinc-800/40 text-[9px] leading-tight">
                            {trace.cypher.trim()}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
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

        {loading && (
          <div className="flex gap-3 items-center text-zinc-400 text-xs">
            <div className="size-7 rounded-lg bg-falkor-600/20 border border-falkor-500/30 flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="size-3.5 text-falkor-400" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
              <span className="size-2 rounded-full bg-falkor-400 animate-ping" />
              <span>Traversing FalkorDB knowledge graph...</span>
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
            placeholder="Ask anything (e.g., What breaks if auth-v1 is shut down?)..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-falkor-500 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-falkor-600 hover:bg-falkor-500 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
