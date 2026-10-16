"use client";

import React, { useState } from "react";
import { Brain, Github, RotateCcw, Check, MoreVertical, Sparkles } from "lucide-react";

interface NavbarProps {
  nodeCount: number;
  edgeCount: number;
  onRefresh: () => void;
  latencyMs?: number;
}

export function Navbar({
  nodeCount,
  edgeCount,
  onRefresh,
  latencyMs = 4,
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
    <header className="h-14 border-b border-border bg-bg/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Logo + Wordmark */}
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
          <Brain size={18} strokeWidth={1.75} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            CompanyMind AI
          </span>
          <span className="text-2xs font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline">
            FalkorDB
          </span>
        </div>
      </div>

      {/* Center: Track chips */}
      <div className="hidden md:flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium text-zinc-400 bg-surface border border-border">
          <span className="size-1.5 rounded-full bg-accent" />
          Track 3: Company Brain
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium text-zinc-400 bg-surface border border-border">
          <span className="size-1.5 rounded-full bg-cyan-400" />
          Track 2: Agent Memory
        </span>
      </div>

      {/* Right: Status Chip + GitHub + Overflow Menu */}
      <div className="flex items-center gap-2.5">
        {message && (
          <span className="inline-flex items-center gap-1 text-2xs text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-md">
            <Check size={12} strokeWidth={2} />
            {message}
          </span>
        )}

        {/* Real latency / connection status chip (no pinging dots) */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface border border-border text-2xs font-mono text-zinc-400">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="text-zinc-300">Connected</span>
          <span className="text-zinc-600">·</span>
          <span className="text-accent">{latencyMs} ms</span>
          <span className="text-zinc-600 hidden lg:inline">·</span>
          <span className="text-zinc-400 hidden lg:inline">
            {nodeCount}n / {edgeCount}e
          </span>
        </div>

        {/* GitHub link button */}
        <a
          href="https://github.com/vishal-kumar9032/companymind-ai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          className="size-8 rounded-lg bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Github size={16} strokeWidth={1.75} />
        </a>

        {/* Overflow Menu with Reset Graph */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="More options"
            className="size-8 rounded-lg bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <MoreVertical size={16} strokeWidth={1.75} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-bg/95 border border-border shadow-card backdrop-blur-xl p-1 z-50 text-xs">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-surface-hover text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw
                  size={14}
                  strokeWidth={1.75}
                  className={seeding ? "animate-spin text-accent" : "text-zinc-400"}
                />
                <span>{seeding ? "Resetting graph..." : "Reset graph dataset"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
