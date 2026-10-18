"use client";

import React from "react";
import { X, ExternalLink, FileText, Calendar, GitPullRequest, ShieldCheck, Server, Network } from "lucide-react";
import { SourceDetail } from "@/lib/sources";

interface SourceDrawerProps {
  source: SourceDetail | null;
  onClose: () => void;
  onHighlightGraph: (hops: string[]) => void;
}

export function SourceDrawer({ source, onClose, onHighlightGraph }: SourceDrawerProps) {
  if (!source) return null;

  const getIcon = () => {
    switch (source.type) {
      case "rfc":
        return <FileText className="size-4 text-emerald-600" />;
      case "meeting":
        return <Calendar className="size-4 text-amber-600" />;
      case "pr":
        return <GitPullRequest className="size-4 text-indigo-600" />;
      case "decision":
        return <ShieldCheck className="size-4 text-rose-600" />;
      case "service":
        return <Server className="size-4 text-purple-600" />;
      default:
        return <FileText className="size-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900/98 backdrop-blur-2xl border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10 text-slate-200"
        aria-label="Source Document Provenance"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
              Source Provenance
            </span>
            <span className="text-3xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
              {source.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close source drawer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Title & Badge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
                {source.badge}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{source.date}</span>
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">{source.title}</h3>
            <p className="text-[11px] text-slate-400">By {source.author}</p>
          </div>

          {/* Verified Snippet Excerpt */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Verified Document Excerpt:
            </span>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
              {source.snippet}
            </div>
          </div>

          {/* FalkorDB Native Graph Representation */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block font-semibold flex items-center gap-1.5">
              <Network className="size-3 text-indigo-400" />
              <span>FalkorDB Graph Node:</span>
            </span>
            <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto shadow-inner">
              {source.falkorNode}
            </pre>
          </div>

          {/* Traversal Hops */}
          {source.graphHops && source.graphHops.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                Connected Graph Entities:
              </span>
              <div className="flex flex-wrap gap-1">
                {source.graphHops.map((hop, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                  >
                    {hop}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2 shrink-0">
          <button
            onClick={() => onHighlightGraph(source.graphHops)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
          >
            <Network className="size-3.5" />
            <span>Light Up Nodes in FalkorDB Graph</span>
          </button>

          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-[11px] transition-colors"
          >
            <span>Open Full Original Document</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </aside>
    </div>
  );
}
