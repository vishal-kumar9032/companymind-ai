"use client";

import React, { useState } from "react";
import { Database, GitBranch, RefreshCw, CheckCircle, Github, Sparkles } from "lucide-react";

interface NavbarProps {
  nodeCount: number;
  edgeCount: number;
  onRefresh: () => void;
  activeTab: "overview" | "studio" | "registry";
  onTabChange: (tab: "overview" | "studio" | "registry") => void;
}

export function Navbar({
  nodeCount,
  edgeCount,
  onRefresh,
  activeTab,
  onTabChange,
}: NavbarProps) {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setMessage(null);
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        setMessage("Graph reset & seeded successfully!");
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  return (
    <header className="border-b border-border/40 bg-zinc-950/90 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70 sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onTabChange("overview")}
            className="size-10 rounded-xl bg-gradient-to-tr from-falkor-700 via-falkor-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-falkor-500/20 cursor-pointer"
          >
            <Sparkles className="size-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                onClick={() => onTabChange("overview")}
                className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent cursor-pointer"
              >
                CompanyMind AI
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-falkor-500/10 text-falkor-300 border border-falkor-500/30">
                FalkorDB Brain
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden lg:block">
              Autonomous Enterprise Graph Brain & Cross-Agent Shared Memory
            </p>
          </div>
        </div>

        {/* Center: Segmented View Navigation */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800/80 shadow-inner">
          <button
            onClick={() => onTabChange("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-falkor-600 text-white shadow-sm shadow-falkor-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onTabChange("studio")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "studio"
                ? "bg-falkor-600 text-white shadow-sm shadow-falkor-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Graph Studio
          </button>
          <button
            onClick={() => onTabChange("registry")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "registry"
                ? "bg-falkor-600 text-white shadow-sm shadow-falkor-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Registry
          </button>
        </div>

        {/* Right: Status Badges, Action Button, GitHub */}
        <div className="flex items-center gap-3">
          {message && (
            <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              <CheckCircle className="size-3.5" />
              {message}
            </span>
          )}

          {/* FalkorDB Live Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <Database className="size-3.5 text-falkor-400" />
            <span className="text-zinc-300">FalkorDB:</span>
            <span className="text-falkor-300 font-semibold">{nodeCount} nodes</span>
            <span className="text-zinc-500">|</span>
            <span className="text-indigo-300 font-semibold">{edgeCount} edges</span>
          </div>

          {/* Seed / Reset Graph Button */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer disabled:opacity-50"
            title="Reset and populate the graph with Google Workspace & GitHub data"
          >
            <RefreshCw className={`size-3.5 ${seeding ? "animate-spin text-falkor-400" : ""}`} />
            <span>{seeding ? "Seeding..." : "Reset Graph"}</span>
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/vishal-kumar9032/companymind-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all"
          >
            <Github className="size-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
