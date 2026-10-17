"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Brain, Check, CircleAlert, Cpu, Loader2, ShieldCheck, Wrench, X, Users } from "lucide-react";
import { authHeaders } from "@/lib/clientAuth";

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

const PROMPTS_DEMO = [
  "What breaks if auth-v1 is shut down, and who leads those teams?",
  "Audit PR 214 and tell me which decision it violates",
  "Who owns payments-api and what governs it?",
];
const PROMPTS_REAL = [
  "Summarize my unread emails from today and flag anything urgent",
  "What meetings do I have this week and what do I need to prepare?",
  "Check my open GitHub pull requests and draft a status email",
  "Create a Google Sheet tracking my open PRs",
];

function describe(e: Ev): { icon: React.ReactNode; text: string } | null {
  switch (e.type) {
    case "memory_recalled":
      return e.count ? { icon: <Brain size={13} />, text: `Recalled ${e.count} memories from earlier work` } : null;
    case "tool_call":
      return { icon: <Wrench size={13} />, text: `${e.role} → ${e.name}` };
    case "tool_result":
      return { icon: e.ok ? <Check size={13} /> : <CircleAlert size={13} />, text: `${e.name} ${e.ok ? "returned" : "failed"} in ${e.ms}ms` };
    case "delegate":
      return { icon: <Users size={13} />, text: `Handed off to ${e.to}: ${String(e.goal).slice(0, 80)}` };
    case "approval":
      return { icon: <ShieldCheck size={13} />, text: `Waiting for your approval: ${e.tool}` };
    default:
      return null;
  }
}

export function AssistantView({ signedIn, initialQuery, onInitialQueryUsed, model }: {
  signedIn: boolean;
  initialQuery?: string | null;
  onInitialQueryUsed?: () => void;
  model?: string;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const patch = (id: number, fn: (t: Turn) => Turn) => setTurns((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const id = nextId.current++;
    setTurns((ts) => [...ts, { id, question: q, events: [], approvals: [], answer: "", status: "running" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ message: q, model }),
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
          if (e.type === "answer" && e.role === "orchestrator") patch(id, (t) => ({ ...t, answer: e.text }));
          else if (e.type === "approval")
            patch(id, (t) => ({ ...t, events: [...t.events, e], approvals: [...t.approvals, { id: e.approvalId, tool: e.tool, args: e.args, state: "pending" }] }));
          else if (e.type === "error") patch(id, (t) => ({ ...t, status: "error", error: e.message }));
          else if (e.type === "done") patch(id, (t) => ({ ...t, status: t.status === "error" ? "error" : "done" }));
          else patch(id, (t) => ({ ...t, events: [...t.events, e] }));
        }
      }
      patch(id, (t) => (t.status === "running" ? { ...t, status: "done" } : t));
    } catch (err: any) {
      patch(id, (t) => ({ ...t, status: "error", error: err?.message || "Something went wrong" }));
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
      patch(turnId, (t) => ({ ...t, approvals: t.approvals.map((a) => (a.id === approvalId ? { ...a, state, detail } : a)) }));
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
    } catch (err: any) {
      setState("failed", err?.message);
    }
  }

  const prompts = signedIn ? PROMPTS_REAL : PROMPTS_DEMO;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {turns.length === 0 && (
            <div className="space-y-6 pt-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Cpu size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">What should I work on?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {signedIn
                    ? "I can search your connected accounts, reason over your company graph, and act for you with your approval."
                    : "You are in the demo workspace (sample company data, read-only). Sign in with Google to use your own accounts."}
                </p>
              </div>
              <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                {prompts.map((p) => (
                  <button key={p} onClick={() => ask(p)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-xs transition hover:border-indigo-300 hover:shadow-sm">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t) => (
            <div key={t.id} className="space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-sm">{t.question}</div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                {t.events.some((e) => describe(e)) && (
                  <ol className="space-y-1 border-b border-slate-100 pb-3">
                    {t.events.map((e, i) => {
                      const d = describe(e);
                      return d ? (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="text-slate-400">{d.icon}</span>
                          {d.text}
                        </li>
                      ) : null;
                    })}
                  </ol>
                )}

                {t.status === "running" && !t.answer && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 size={15} className="animate-spin" /> Working…
                  </div>
                )}

                {t.answer && (
                  <div className="agent-md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.answer}</ReactMarkdown>
                  </div>
                )}

                {t.approvals.map((a) => (
                  <div key={a.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                      <ShieldCheck size={14} /> Action needs your approval: {a.tool}
                    </div>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/70 p-2 text-[11px] text-slate-700">{JSON.stringify(a.args, null, 2)}</pre>
                    {a.state === "pending" && (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => decide(t.id, a.id, "approve")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          <Check size={13} /> Approve &amp; run
                        </button>
                        <button onClick={() => decide(t.id, a.id, "reject")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          <X size={13} /> Reject
                        </button>
                      </div>
                    )}
                    {a.state === "working" && <p className="mt-2 text-xs text-slate-600">Running…</p>}
                    {a.state === "executed" && <p className="mt-2 text-xs font-medium text-emerald-700">Done. The action was executed.</p>}
                    {a.state === "rejected" && <p className="mt-2 text-xs text-slate-600">Rejected. Nothing was run.</p>}
                    {a.state === "failed" && <p className="mt-2 text-xs font-medium text-rose-700">Failed: {a.detail}</p>}
                  </div>
                ))}

                {t.status === "error" && (
                  <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                    <CircleAlert size={16} className="mt-0.5 shrink-0" /> {t.error}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottom} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-8"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={signedIn ? "Ask or tell me to do something…" : "Ask about the sample company…"}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button disabled={busy || !input.trim()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}
