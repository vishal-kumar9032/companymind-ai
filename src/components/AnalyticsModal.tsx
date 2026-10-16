"use client";

import React from "react";
import { X, BarChart2, AlertTriangle, CheckCircle, Zap, Shield, TrendingUp, Database } from "lucide-react";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 animate-in fade-in duration-150">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-2xl bg-[#0f0f16] border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-border bg-surface/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-accent" />
            <h3 className="font-semibold text-sm text-zinc-100">Enterprise Graph Intelligence & Knowledge Gaps</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] text-xs">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Avg Graph Latency</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">14ms</div>
              <p className="text-[10px] text-zinc-400">FalkorDB in-memory Cypher</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Verification Score</span>
              <div className="text-xl font-extrabold text-falkor-300 font-mono">99.4%</div>
              <p className="text-[10px] text-zinc-400">Zero-hallucination rate</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Tracked Entities</span>
              <div className="text-xl font-extrabold text-indigo-300 font-mono">34 nodes</div>
              <p className="text-[10px] text-zinc-400">Across 6 entity types</p>
            </div>
          </div>

          {/* Top Asked Questions */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="size-3.5 text-falkor-400" />
              <span>Most Queried Architectural Questions</span>
            </h4>
            <div className="space-y-1.5">
              {[
                { q: "What services break if auth-v1 is shut down?", count: 42, cat: "Blast Radius" },
                { q: "Audit PR #214 against DEC-44 sunset rule", count: 35, cat: "Governance" },
                { q: "Who owns payments-api and who are the SMEs?", count: 28, cat: "Ownership" },
                { q: "Why did we decide to use mTLS for identity-service?", count: 19, cat: "Provenance" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80"
                >
                  <span className="text-zinc-300 truncate">{item.q}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {item.cat}
                    </span>
                    <span className="font-mono text-falkor-300 font-bold">{item.count} asks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identified Knowledge Gaps (Important for Hackathon) */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-amber-400" />
              <span>Detected Institutional Knowledge Gaps</span>
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-zinc-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300">Missing RFC Documentation: postgres-primary</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">High Risk</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <code>postgres-primary</code> has 3 inbound dependencies but zero linked RFC specifications or recorded architectural review meetings in Google Workspace.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-zinc-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300">Policy Renewal: DEC-88 Cookie Security</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Audit Due</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Decided on Sept 01, 2026. Needs re-certification with SOC2 auditor prior to Q4 compliance review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-mono text-[11px]">Powered by FalkorDB Graph Analysis</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
