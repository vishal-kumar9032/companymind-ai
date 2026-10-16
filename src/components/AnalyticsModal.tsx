"use client";

import React from "react";
import { X, BarChart2, AlertTriangle, TrendingUp } from "lucide-react";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  latencyMs?: number;
  nodeCount?: number;
  edgeCount?: number;
}

export function AnalyticsModal({
  isOpen,
  onClose,
  latencyMs = 2,
  nodeCount = 34,
  edgeCount = 59,
}: AnalyticsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 animate-in fade-in duration-150">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-900">Enterprise Graph Intelligence & Knowledge Gaps</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] text-xs">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Avg Graph Latency</span>
              <div className="text-xl font-extrabold text-emerald-600 font-mono">{latencyMs} ms</div>
              <p className="text-[10px] text-slate-500">FalkorDB in-memory Cypher</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Verification Score</span>
              <div className="text-xl font-extrabold text-indigo-600 font-mono">100%</div>
              <p className="text-[10px] text-slate-500">Verifiable Cypher provenance</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Tracked Entities</span>
              <div className="text-xl font-extrabold text-purple-600 font-mono">{nodeCount} nodes</div>
              <p className="text-[10px] text-slate-500">{edgeCount} relationships connected</p>
            </div>
          </div>

          {/* Top Asked Questions */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="size-3.5 text-indigo-600" />
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span className="text-slate-800 font-medium truncate">{item.q}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {item.cat}
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">{item.count} asks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identified Knowledge Gaps */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-amber-600" />
              <span>Detected Institutional Knowledge Gaps</span>
            </h4>
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-800">Missing RFC Documentation: postgres-primary</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-800 font-bold">High Risk</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <code className="bg-amber-100/80 px-1 rounded text-amber-900">postgres-primary</code> has 3 inbound dependencies but zero linked RFC specifications or recorded architectural review meetings.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-800">Policy Renewal: DEC-88 Cookie Security</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-200 text-purple-800 font-bold">Audit Due</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Decided on Sept 01, 2026. Needs re-certification with SOC2 auditor prior to Q4 compliance review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Powered by FalkorDB Graph Analysis</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
