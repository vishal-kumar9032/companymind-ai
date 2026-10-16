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
  LayoutDashboard,
  MessageSquare,
  Building2,
  Cpu,
  Lock,
  ChevronDown,
} from "lucide-react";
import { TenantConfig, TENANTS } from "@/lib/tenants";
import { AVAILABLE_MODELS } from "@/lib/truefoundry";
import { EnterpriseUser } from "@/lib/firebase";

interface NavbarProps {
  nodeCount: number;
  edgeCount: number;
  onRefresh: () => void;
  latencyMs?: number;
  currentView?: "dashboard" | "chat";
  onSelectView?: (view: "dashboard" | "chat") => void;
  currentTenant?: TenantConfig;
  onSelectTenant?: (tenant: TenantConfig) => void;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  currentUser?: EnterpriseUser | null;
  onOpenAuthModal?: () => void;
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
  currentView = "dashboard",
  onSelectView,
  currentTenant = TENANTS[0],
  onSelectTenant,
  selectedModel = "groq/qwen-qwen3.8-27b",
  onSelectModel,
  currentUser,
  onOpenAuthModal,
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
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

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

  const activeModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between gap-2 select-none shrink-0">
      {/* Left: Brand + FalkorDB Badge + View Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Brain size={17} strokeWidth={1.75} />
          </div>
          <div className="hidden sm:flex items-baseline gap-1.5">
            <span className="font-bold text-sm tracking-tight text-slate-900">
              CompanyMind AI
            </span>
            <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 font-semibold uppercase">
              FalkorDB
            </span>
          </div>
        </div>

        {/* View Switcher: Dashboard vs Ask AI */}
        {onSelectView && (
          <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onSelectView("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === "dashboard"
                  ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard size={13} />
              <span className="hidden md:inline">Dashboard</span>
            </button>
            <button
              onClick={() => onSelectView("chat")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === "chat"
                  ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare size={13} />
              <span className="hidden md:inline">Ask AI</span>
            </button>
          </div>
        )}
      </div>

      {/* Center: Tenant Switcher + Model Selector */}
      <div className="flex items-center gap-2">
        {/* Multi-Tenant Switcher */}
        {onSelectTenant && (
          <div className="relative">
            <button
              onClick={() => {
                setTenantDropdownOpen(!tenantDropdownOpen);
                setModelDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              title="Select Active Tenant Organization"
            >
              <Building2 size={13} className="text-indigo-600" />
              <span className="font-semibold text-slate-900 truncate max-w-[110px] sm:max-w-none">
                {currentTenant.name}
              </span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {tenantDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Tenant Workspaces
                </div>
                {TENANTS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTenant(t);
                      setTenantDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      currentTenant.id === t.id
                        ? "bg-indigo-50 text-indigo-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-[10px] text-slate-500 font-normal">{t.domain}</p>
                    </div>
                    {currentTenant.id === t.id && <Check size={13} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Model Selector Dropdown */}
        {onSelectModel && (
          <div className="relative hidden lg:block">
            <button
              onClick={() => {
                setModelDropdownOpen(!modelDropdownOpen);
                setTenantDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              title="Select LLM Gateway Model"
            >
              <Cpu size={13} className="text-violet-600" />
              <span className="font-semibold text-slate-900">{activeModel.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({activeModel.speed})</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Enterprise AI Models
                </div>
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedModel === m.id
                        ? "bg-indigo-50 text-indigo-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{m.name}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-500">
                          {m.speed}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal">{m.provider}</p>
                    </div>
                    {selectedModel === m.id && <Check size={13} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200 text-xs text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          title="Search queries, RFCs, decisions (⌘K)"
        >
          <Search size={12} className="text-slate-400" />
          <span className="hidden xl:inline">Search...</span>
          <kbd className="text-3xs font-mono px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Drawer Toggles + Google Sign-In + Status + GitHub */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Slide-over View Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          {onToggleProcess && (
            <button
              onClick={onToggleProcess}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
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
              <span className="hidden md:inline">Agents</span>
            </button>
          )}

          {onToggleGraph && (
            <button
              onClick={onToggleGraph}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-2xs font-mono transition-all cursor-pointer ${
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
        </div>

        {/* Google Sign-In with Firebase Button / Profile Avatar */}
        {currentUser ? (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
            title={`Signed in as ${currentUser.displayName} (${currentUser.role})`}
          >
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
              {currentUser.displayName.charAt(0)}
            </div>
            <span className="hidden xl:inline text-slate-900 font-semibold">{currentUser.displayName}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            title="Sign in with Google via Firebase"
          >
            <Lock size={12} className="text-indigo-400" />
            <span className="hidden sm:inline">Google Auth</span>
          </button>
        )}

        {/* Latency Chip */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-2xs font-mono text-slate-600 shadow-xs">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-indigo-600 font-semibold">{latencyMs}ms</span>
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
