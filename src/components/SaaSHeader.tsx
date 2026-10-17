"use client";

import React, { useState } from "react";
import {
  Menu,
  Search,
  Sparkles,
  Play,
  RotateCcw,
  Cpu,
  ChevronDown,
  Check,
  ShieldCheck,
  ShieldAlert,
  Github,
  HelpCircle,
  Activity,
  Layers,
  Database,
} from "lucide-react";
import { TenantConfig } from "@/lib/tenants";
import { AVAILABLE_MODELS, ModelOption } from "@/lib/truefoundry";
import { SaaSView } from "./SaaSSidebar";

interface SaaSHeaderProps {
  currentView: SaaSView;
  currentTenant: TenantConfig;
  onToggleMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onRunDemo: () => void;
  onRefreshGraph: () => void;
  onGoToLanding?: () => void;
  activeAgent?: {
    name: string;
    role: string;
  };
  activeOutcome?: string;
  gatewayStatus?: {
    provider: string;
    status: "online" | "fallback_active";
    reason?: string;
    fallbackEngine?: string;
    model?: string;
  };
}

export function SaaSHeader({
  currentView,
  currentTenant,
  onToggleMobileSidebar,
  onOpenCommandPalette,
  selectedModel,
  onSelectModel,
  onRunDemo,
  onRefreshGraph,
  onGoToLanding,
  activeAgent = {
    name: "ArchitectureOracle",
    role: "Enterprise Knowledge & Provenance Orchestrator",
  },
  activeOutcome,
  gatewayStatus,
}: SaaSHeaderProps) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const activeModelObj =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const viewTitles: Record<SaaSView, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Executive Intelligence Hub",
      subtitle: "Enterprise Knowledge Silos & System Health",
    },
    chat: {
      title: "Ask AI & Graph Oracle",
      subtitle: "Multi-Agent Verifiable Knowledge Synthesis",
    },
    graph: {
      title: "Knowledge Graph Explorer",
      subtitle: "FalkorDB Multi-Hop Entity Topology",
    },
    agents: {
      title: "Autonomous Agent Workforce",
      subtitle: "MCP Tool Telemetry & PR Governance Interceptor",
    },
    memory: {
      title: "Institutional Episodic Memory",
      subtitle: "Persistent Cross-Session Knowledge & Findings",
    },
    connections: {
      title: "Connections",
      subtitle: "Connect your Google Workspace and GitHub accounts",
    },
    registry: {
      title: "Enterprise Document Catalog",
      subtitle: "Unified RFCs, ADRs, PRs & Architecture Review Specs",
    },
  };

  const handleResetGraph = async () => {
    try {
      setSeeding(true);
      setSeedNotice(null);
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        setSeedNotice("Graph Reset");
        onRefreshGraph();
      } else {
        setSeedNotice(res.status === 403 ? "Reset disabled" : "Reset failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedNotice(null), 3000);
    }
  };

  const hasGovernanceViolation = activeOutcome === "governance_violation";

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 select-none z-20">
      {/* 1. Left: Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline truncate">
            {currentTenant.name}
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 truncate">
              {viewTitles[currentView]?.title}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. Center: Global Search Bar trigger */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-400 hover:text-slate-700 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs truncate">
              Search services, RFCs, decisions, engineers...
            </span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-xs shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 3. Right: Quick Actions & Status Indicators */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Blast Radius Analysis Action */}
        <button
          onClick={onRunDemo}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer hover:shadow-indigo-500/20 active:scale-98"
          title="Run 4-Hop Blast Radius Causal Analysis"
        >
          <Play size={12} fill="currentColor" />
          <span>Analyze Blast Radius</span>
        </button>

        {/* Model Gateway Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-all cursor-pointer"
            title="Switch Enterprise AI Gateway Model"
          >
            <Cpu size={13} className="text-indigo-600" />
            <span className="hidden xl:inline max-w-[130px] truncate">
              {activeModelObj.name}
            </span>
            <span className="xl:hidden font-mono text-[11px]">
              {activeModelObj.name}
            </span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Enterprise AI Gateway Models
              </div>
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    selectedModel === model.id
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs truncate">{model.name}</span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {model.description}
                    </span>
                  </div>
                  {selectedModel === model.id && (
                    <Check size={13} className="text-indigo-600 shrink-0" />
                  )}
                </button>
              ))}
              <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-lg text-[10px] text-slate-500 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Sub-5ms Autonomous FalkorDB fallback enabled</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Active Agent Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
          <Activity size={12} className="text-indigo-600 animate-pulse" />
          <span className="font-semibold">{activeAgent?.name || "ArchitectureOracle"}</span>
        </div>

        {/* PR Governance Watchdog Status Pill */}
        {hasGovernanceViolation ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse">
            <ShieldAlert size={13} className="text-rose-600" />
            <span className="hidden sm:inline">Governance Alert</span>
          </div>
        ) : (
          <div className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Policy Watchdog</span>
          </div>
        )}

        {/* Seed / Reset Graph Button */}
        <button
          onClick={handleResetGraph}
          disabled={seeding}
          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          title="Reset FalkorDB Graph to Default State"
        >
          <RotateCcw
            size={14}
            className={`${seeding ? "animate-spin text-indigo-600" : ""}`}
          />
        </button>

        {seedNotice && (
          <span className="text-[11px] font-semibold text-emerald-600 animate-in fade-in">
            {seedNotice}
          </span>
        )}
      </div>
    </header>
  );
}
