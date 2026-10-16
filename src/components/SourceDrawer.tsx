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
        return <FileText className="size-4 text-emerald-400" />;
      case "meeting":
        return <Calendar className="size-4 text-amber-400" />;
      case "pr":
        return <GitPullRequest className="size-4 text-cyan-400" />;
      case "decision":
        return <ShieldCheck className="size-4 text-rose-400" />;
      case "service":
        return <Server className="size-4 text-purple-400" />;
      default:
        return <FileText className="size-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#08080c]/98 backdrop-blur-2xl border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10"
        aria-label="Source Document Provenance"
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-surface/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-100 font-mono">
              Source Provenance
            </span>
            <span className="text-3xs font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-medium">
              {source.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-surface transition-colors cursor-pointer"
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
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-falkor-500/10 text-falkor-300 border border-falkor-500/20">
              {source.badge}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">{source.date}</span>
          </div>
          <h3 className="text-sm font-bold text-zinc-100 leading-snug">{source.title}</h3>
          <p className="text-[11px] text-zinc-400">By {source.author}</p>
        </div>

        {/* Verified Snippet Excerpt */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
            Verified Document Excerpt:
          </span>
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 leading-relaxed text-[11px] whitespace-pre-wrap">
            {source.snippet}
          </div>
        </div>

        {/* FalkorDB Native Graph Representation */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-falkor-400 block font-semibold flex items-center gap-1.5">
            <Network className="size-3 text-falkor-400" />
            <span>FalkorDB Graph Node:</span>
          </span>
          <pre className="p-2.5 rounded-lg bg-black/60 border border-zinc-800 font-mono text-[10px] text-zinc-400 overflow-x-auto">
            {source.falkorNode}
          </pre>
        </div>

        {/* Traversal Hops */}
        {source.graphHops && source.graphHops.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
              Connected Graph Entities:
            </span>
            <div className="flex flex-wrap gap-1">
              {source.graphHops.map((hop, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
                >
                  {hop}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border bg-surface/40 space-y-2 shrink-0">
        <button
          onClick={() => onHighlightGraph(source.graphHops)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs shadow-md shadow-accent/20 transition-all cursor-pointer"
        >
          <Network className="size-3.5" />
          <span>Light Up Nodes in FalkorDB Graph</span>
        </button>

        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors"
        >
          <span>Open Full Original Document</span>
          <ExternalLink className="size-3" />
        </a>
      </div>
      </aside>
    </div>
  );
}
