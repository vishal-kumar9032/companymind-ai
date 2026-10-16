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
  gatewayStatus?: {
    provider: string;
    status: "online" | "fallback_active";
    reason?: string;
    fallbackEngine?: string;
    model?: string;
  };
  agent?: {
    name: string;
    role: string;
    status?: string;
  };
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
  gatewayStatus,
  agent,
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
    <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between gap-2 select-none shrink-0">
      {/* Left: Brand + FalkorDB Badge */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="size-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
          <Brain size={17} strokeWidth={1.75} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm tracking-tight text-slate-900">
            CompanyMind AI
          </span>
          <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wider hidden sm:inline font-medium">
            FalkorDB
          </span>
        </div>
      </div>

      {/* Center: Command Palette Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-2 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200 hover:border-indigo-400 text-xs text-slate-500 hover:text-slate-800 transition-all cursor-pointer group shadow-inner"
          title="Search queries, RFCs, decisions (⌘K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search size={13} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span className="truncate">Search graph, RFCs, PRs...</span>
          </div>
          <kbd className="text-3xs font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: View Toggles + Status + Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Slide-over View Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          {onToggleProcess && (
            <button
              onClick={onToggleProcess}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
                isProcessOpen
                  ? "bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-xs"
                  : activeOutcome === "governance_violation"
                  ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
              title="Toggle Live Agent Process Telemetry"
            >
              <Activity
                size={12}
                className={activeOutcome === "governance_violation" ? "text-rose-600" : "text-indigo-600"}
              />
              <span className="hidden md:inline">Process</span>
              {activeOutcome === "governance_violation" && (
                <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
              )}
            </button>
          )}

          {onToggleGraph && (
            <button
              onClick={onToggleGraph}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
                isGraphOpen
                  ? "bg-white text-sky-700 border border-sky-200 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
              title="Toggle FalkorDB Graph Topology"
            >
              <Network size={12} className="text-sky-600" />
              <span className="hidden md:inline">Graph</span>
            </button>
          )}

          {onToggleMemory && (
            <button
              onClick={onToggleMemory}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
                isMemoryOpen
                  ? "bg-white text-purple-700 border border-purple-200 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
              title="Toggle Cross-Session Memory Ledger"
            >
              <Brain size={12} className="text-purple-600" />
              <span className="hidden md:inline">Memory</span>
            </button>
          )}

          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-mono text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all cursor-pointer"
              title="Open Graph Intelligence & Knowledge Gaps Analytics"
            >
              <BarChart2 size={12} className="text-indigo-600" />
              <span className="hidden lg:inline">Gaps</span>
            </button>
          )}
        </div>

        {/* Status Confirmation Toast */}
        {message && (
          <span className="hidden sm:inline-flex items-center gap-1 text-2xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
            <Check size={11} strokeWidth={2} />
            {message}
          </span>
        )}

        {/* LLM Gateway Status Pill */}
        {gatewayStatus?.status === "fallback_active" ? (
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-2xs font-mono text-amber-800 shadow-xs"
            title={`TrueFoundry LLM Gateway (${gatewayStatus.model || "gemini-2.5-flash-lite"}): ${gatewayStatus.reason || "Quota Exceeded (429)"}. Autonomous FalkorDB Graph Fallback Active.`}
          >
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold">Gateway:</span>
            <span>Fallback (429)</span>
          </div>
        ) : (
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-2xs font-mono text-emerald-800 shadow-xs"
            title="TrueFoundry LLM Gateway: Online"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold">Gateway:</span>
            <span>TrueFoundry</span>
          </div>
        )}

        {/* TrueForge MCP Badge */}
        <div
          className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-2xs font-mono text-indigo-700 font-medium shadow-xs"
          title="5 TrueForge MCP tools registered for zero-shot OpenCypher graph traversals"
        >
          <span className="size-1.5 rounded-full bg-indigo-500" />
          <span>TrueForge MCPs (5)</span>
        </div>

        {/* Live Latency Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-2xs font-mono text-slate-600 shadow-xs">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-slate-700 hidden sm:inline">FalkorDB</span>
          <span className="text-slate-300 hidden sm:inline">·</span>
          <span className="text-indigo-600 font-semibold">{latencyMs}ms</span>
          <span className="text-slate-300 hidden xl:inline">·</span>
          <span className="text-slate-500 hidden xl:inline">
            {nodeCount}n / {edgeCount}e
          </span>
        </div>

        {/* GitHub Repository Link */}
        <a
          href="https://github.com/vishal-kumar9032/companymind-ai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          className="size-8 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          title="GitHub Repository"
        >
          <Github size={15} strokeWidth={1.75} />
        </a>

        {/* Overflow Menu with Reset Graph */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="More options"
            className="size-8 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
          >
            <MoreVertical size={15} strokeWidth={1.75} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-xl backdrop-blur-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw
                  size={13}
                  strokeWidth={1.75}
                  className={seeding ? "animate-spin text-indigo-600" : "text-slate-400"}
                />
                <span>{seeding ? "Resetting graph..." : "Reset graph dataset"}</span>
              </button>
              {onOpenAnalytics && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAnalytics();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <BarChart2 size={13} className="text-indigo-600" />
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
