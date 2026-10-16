"use client";

import React, { useState } from "react";
import {
  Brain,
  Github,
  RotateCcw,
  Check,
  MoreVertical,
  Search,
  Activity,
  Network,
  BarChart2,
  ExternalLink,
} from "lucide-react";

interface NavbarProps {
  nodeCount: number;
  edgeCount: number;
  onRefresh: () => void;
  latencyMs?: number;
  isProcessOpen?: boolean;
  onToggleProcess?: () => void;
  isGraphOpen?: boolean;
  onToggleGraph?: () => void;
  isMemoryOpen?: boolean;
  onToggleMemory?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAnalytics?: () => void;
  activeOutcome?: string;
}

export function Navbar({
  nodeCount,
  edgeCount,
  onRefresh,
  latencyMs = 4,
  isProcessOpen = false,
  onToggleProcess,
  isGraphOpen = false,
  onToggleGraph,
  isMemoryOpen = false,
  onToggleMemory,
  onOpenCommandPalette,
  onOpenAnalytics,
  activeOutcome,
}: NavbarProps) {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setMessage(null);
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        setMessage("Graph reset & seeded");
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
      setMenuOpen(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-[#08080c]/80 backdrop-blur-xl sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between gap-2 select-none shrink-0">
      {/* Left: Brand + FalkorDB Badge */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="size-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-sm shadow-accent/10">
          <Brain size={17} strokeWidth={1.75} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm tracking-tight text-white">
            CompanyMind AI
          </span>
          <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-zinc-400 uppercase tracking-wider hidden sm:inline">
            FalkorDB
          </span>
        </div>
      </div>

      {/* Center: Command Palette Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-2 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface/60 hover:bg-surface border border-border/80 hover:border-accent/40 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer group shadow-inner"
          title="Search queries, RFCs, decisions (⌘K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search size={13} className="text-zinc-500 group-hover:text-accent transition-colors" />
            <span className="truncate">Search graph, RFCs, PRs...</span>
          </div>
          <kbd className="text-3xs font-mono px-1.5 py-0.5 rounded bg-black/40 border border-border text-zinc-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: View Toggles + Status + Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Slide-over View Toggles */}
        <div className="flex items-center gap-1 bg-surface/40 p-0.5 rounded-xl border border-border/70">
          {onToggleProcess && (
            <button
              onClick={onToggleProcess}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
                isProcessOpen
                  ? "bg-accent/25 text-accent border border-accent/40 font-semibold shadow-sm"
                  : activeOutcome === "governance_violation"
                  ? "bg-danger/20 text-danger border border-danger/40 animate-pulse font-semibold"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-surface"
              }`}
              title="Toggle Live Agent Process Telemetry"
            >
              <Activity
                size={12}
                className={activeOutcome === "governance_violation" ? "text-danger" : "text-accent"}
              />
              <span className="hidden md:inline">Process</span>
              {activeOutcome === "governance_violation" && (
                <span className="size-1.5 rounded-full bg-danger animate-ping" />
              )}
            </button>
          )}

          {onToggleGraph && (
            <button
              onClick={onToggleGraph}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
                isGraphOpen
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-surface"
              }`}
              title="Toggle FalkorDB Graph Topology"
            >
              <Network size={12} className="text-cyan-400" />
              <span className="hidden md:inline">Graph</span>
            </button>
          )}

          {onToggleMemory && (
            <button
              onClick={onToggleMemory}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
                isMemoryOpen
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-surface"
              }`}
              title="Toggle Cross-Session Memory Ledger"
            >
              <Brain size={12} className="text-purple-400" />
              <span className="hidden md:inline">Memory</span>
            </button>
          )}

          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-surface transition-all cursor-pointer"
              title="Open Graph Intelligence & Knowledge Gaps Analytics"
            >
              <BarChart2 size={12} className="text-falkor-300" />
              <span className="hidden lg:inline">Gaps</span>
            </button>
          )}
        </div>

        {/* Status Confirmation Toast */}
        {message && (
          <span className="hidden sm:inline-flex items-center gap-1 text-2xs text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-md font-mono">
            <Check size={11} strokeWidth={2} />
            {message}
          </span>
        )}

        {/* Live Latency Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface/60 border border-border/80 text-2xs font-mono text-zinc-400 shadow-sm">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="text-zinc-300 hidden sm:inline">Connected</span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="text-accent">{latencyMs}ms</span>
          <span className="text-zinc-600 hidden xl:inline">·</span>
          <span className="text-zinc-400 hidden xl:inline">
            {nodeCount}n / {edgeCount}e
          </span>
        </div>

        {/* GitHub Repository Link */}
        <a
          href="https://github.com/vishal-kumar9032/companymind-ai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          className="size-8 rounded-xl bg-surface/60 hover:bg-surface border border-border flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          title="GitHub Repository"
        >
          <Github size={15} strokeWidth={1.75} />
        </a>

        {/* Overflow Menu with Reset Graph */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="More options"
            className="size-8 rounded-xl bg-surface/60 hover:bg-surface border border-border flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <MoreVertical size={15} strokeWidth={1.75} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0f0f16] border border-border shadow-2xl backdrop-blur-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-surface text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw
                  size={13}
                  strokeWidth={1.75}
                  className={seeding ? "animate-spin text-accent" : "text-zinc-400"}
                />
                <span>{seeding ? "Resetting graph..." : "Reset graph dataset"}</span>
              </button>
              {onOpenAnalytics && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAnalytics();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-surface text-left transition-colors cursor-pointer"
                >
                  <BarChart2 size={13} className="text-falkor-300" />
                  <span>Knowledge Gaps & Metrics</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
