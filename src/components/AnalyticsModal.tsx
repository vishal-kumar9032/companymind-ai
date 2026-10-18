"use client";

import React from "react";
import { X, BarChart2, AlertTriangle, TrendingUp, Sparkles, ArrowRight, ShieldCheck, Server } from "lucide-react";
import { GraphData } from "@/lib/schema";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData?: GraphData;
  onSelectQuery?: (query: string) => void;
  latencyMs?: number;
  nodeCount?: number;
  edgeCount?: number;
}

export function AnalyticsModal({
  isOpen,
  onClose,
  graphData,
  onSelectQuery,
  latencyMs = 2,
  nodeCount = 0,
  edgeCount = 0,
}: AnalyticsModalProps) {
  if (!isOpen) return null;

  const actualNodeCount = graphData?.nodes?.length ?? nodeCount;
  const actualEdgeCount = graphData?.edges?.length ?? edgeCount;

  // Extract real graph entities
  const services = graphData?.nodes?.filter((n) => n.label === "Service") || [];
  const decisions = graphData?.nodes?.filter((n) => n.label === "Decision") || [];
  const prs = graphData?.nodes?.filter((n) => n.label === "GitHubPR") || [];

  // Dynamically compute architectural questions based on real graph entities
  const dynamicQuestions = [
    ...(services.length > 0
      ? [
          {
            q: `What services break if ${services[0].name} is shut down?`,
            cat: "Blast Radius",
            service: services[0].name,
          },
        ]
      : []),
    ...(prs.length > 0
      ? [
          {
            q: `Audit ${prs[0].name} against active architectural decisions`,
            cat: "Governance",
            service: prs[0].name,
          },
        ]
      : []),
    ...(services.length > 1
      ? [
          {
            q: `Who owns ${services[1].name} and what decisions govern it?`,
            cat: "Ownership",
            service: services[1].name,
          },
        ]
      : []),
    ...(decisions.length > 0
      ? [
          {
            q: `Explain ${decisions[0].name} and trace its meeting origin`,
            cat: "Provenance",
            service: decisions[0].name,
          },
        ]
      : []),
  ];

  // Dynamically detect knowledge gaps by inspecting graph entities
  const dynamicGaps = [
    ...services
      .filter((s) => (s.properties?.tier || "").toLowerCase().includes("deprecated"))
      .map((s) => ({
        title: `Sunsetting Risk: ${s.name}`,
        level: "High Risk",
        levelClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
        bgClass: "bg-rose-950/20 border-rose-900/30",
        text: `${s.name} is classified as ${s.properties?.tier || "Deprecated"}. Inbound callers must be migrated to avoid breaking downstream microservices.`,
        query: `What services break if ${s.name} is shut down?`,
      })),
    ...services
      .filter((s) => s.name === "postgres-primary" || (s.properties?.tier || "").includes("Tier 0"))
      .map((s) => ({
        title: `Single-Point-of-Failure: ${s.name}`,
        level: "Tier 0 Critical",
        levelClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        bgClass: "bg-amber-950/20 border-amber-900/30",
        text: `${s.name} serves multiple inbound callers. Ensure connection pool limits (DEC-105) are enforced on all dependent client instances.`,
        query: `What breaks if ${s.name} goes down?`,
      })),
    ...decisions.slice(0, 1).map((d) => ({
      title: `Policy Watchdog: ${d.name} Compliance`,
      level: "Active Policy",
      levelClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
      bgClass: "bg-indigo-950/20 border-indigo-900/30",
      text: d.properties?.rationale || d.properties?.summary || `Governing mandate enforced across microservice PR audits.`,
      query: `Explain ${d.name} and why it was decided`,
    })),
  ];

  const handleRunQuery = (query: string) => {
    onSelectQuery?.(query);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-white">Enterprise Graph Intelligence & Knowledge Gaps</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] text-xs">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Avg Graph Latency</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">{latencyMs} ms</div>
              <p className="text-[10px] text-slate-400">FalkorDB in-memory execution</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Tracked Nodes</span>
              <div className="text-xl font-extrabold text-indigo-400 font-mono">{actualNodeCount}</div>
              <p className="text-[10px] text-slate-400">Entities in living topology</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Causal Relations</span>
              <div className="text-xl font-extrabold text-purple-400 font-mono">{actualEdgeCount}</div>
              <p className="text-[10px] text-slate-400">Dependencies & approvals</p>
            </div>
          </div>

          {/* Dynamic Architectural Questions */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="size-3.5 text-indigo-400" />
              <span>Recommended Graph Traversal Solvers</span>
            </h4>
            <div className="space-y-1.5">
              {dynamicQuestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleRunQuery(item.q)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group"
                >
                  <span className="text-slate-200 font-medium truncate group-hover:text-indigo-400 transition-colors">
                    {item.q}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 shadow-2xs">
                      {item.cat}
                    </span>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamically Identified Knowledge Gaps */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-amber-400" />
              <span>Identified Topology & Governance Risks</span>
            </h4>
            <div className="space-y-2">
              {dynamicGaps.map((gap, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border ${gap.bgClass} text-slate-200 space-y-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{gap.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${gap.levelClass}`}>
                      {gap.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{gap.text}</p>
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRunQuery(gap.query)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      <span>Analyze Risk in Graph</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Powered by FalkorDB Real Graph Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
