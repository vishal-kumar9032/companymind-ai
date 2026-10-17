"use client";

import React, { useState } from "react";
import {
  Building2,
  Users,
  GitPullRequest,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  ExternalLink,
  Cpu,
  Layers,
  Search,
  Sparkles,
  Lock,
  ChevronRight,
  FolderTree,
  SlidersHorizontal,
  Network,
} from "lucide-react";
import { TenantConfig } from "@/lib/tenants";
import { AVAILABLE_MODELS } from "@/lib/truefoundry";
import { EnterpriseUser, signOutEnterpriseUser } from "@/lib/firebase";
import { AuthModal } from "./AuthModal";

interface DashboardViewProps {
  currentTenant: TenantConfig;
  onSelectTenant: (tenant: TenantConfig) => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  currentUser: EnterpriseUser | null;
  onUserChange: (user: EnterpriseUser | null) => void;
  onRunQuery: (query: string) => void;
  onOpenSource?: (source: any) => void;
  onOpenGraph: () => void;
  onOpenMcp: () => void;
  onOpenMemory: () => void;
  onOpenRegistry?: () => void;
  latencyMs?: number;
  nodeCount?: number;
  edgeCount?: number;
}

const HERO_PROMPTS = [
  "What breaks if auth-v1 is shut down?",
  "Why was DEC-44 decided?",
  "Who owns payments-api?",
  "Audit PR #214",
];

export function DashboardView({
  currentTenant,
  selectedModel,
  onSelectModel,
  currentUser,
  onUserChange,
  onRunQuery,
  onOpenGraph,
  onOpenMcp,
  onOpenMemory,
  onOpenRegistry,
  latencyMs = 2,
  nodeCount = 36,
  edgeCount = 61,
}: DashboardViewProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [askText, setAskText] = useState("");

  const activeModelObj =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const handleSignOut = async () => {
    await signOutEnterpriseUser();
    onUserChange(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 selection:bg-indigo-500 selection:text-white">
      {/* 1. Hero: One headline, one ask bar */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/40 px-6 py-10 sm:px-12 sm:py-14 shadow-sm">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-indigo-700 text-xs font-semibold border border-indigo-100 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Company brain powered by FalkorDB
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Ask your company{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              anything.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Who owns it, why it was decided, what breaks next. Every answer is traced through the graph to its source.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = askText.trim();
              if (q) onRunQuery(q);
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-indigo-100/50 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              placeholder="What services break if auth-v1 is shut down?"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <span>Ask</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {HERO_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => onRunQuery(q)}
                className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-white transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenGraph}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FolderTree className="h-3.5 w-3.5 text-indigo-600" />
              <span>Explore Knowledge Graph</span>
            </button>
            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Signed in as {currentUser.displayName} · Sign out
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-indigo-300" />
                <span>Enterprise Sign In</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Enterprise System Telemetry & Graph Health */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Enterprise Knowledge Graph Telemetry
            </h2>
            <p className="text-xs text-slate-500">
              Live causal topology, dependency mapping, and sub-5ms graph execution powered by FalkorDB.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>FalkorDB Cluster: Online</span>
          </div>
        </div>

        {/* Real Live Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Graph Entities</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{nodeCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Services, RFCs, PRs &amp; Decisions</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Causal Relations</span>
              <Network className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{edgeCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Dependencies, approvals &amp; authorship</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Traversal Latency</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{latencyMs} ms</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Sub-5ms FalkorDB execution</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Active AI Model</span>
              <Cpu className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-sm font-bold text-slate-900 truncate mt-1">
              {activeModelObj.name}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              {activeModelObj.provider}
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 4 Institutional Problem Solvers (One-Click Queries) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            Instant Institutional Questions &amp; Traversal Solvers
          </h2>
          <p className="text-xs text-slate-500">
            Click any prompt to run a multi-hop traversal in FalkorDB with live AI synthesis and verifiable citations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Task & Ownership */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Task &amp; Service Ownership</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Resolve who owns a component, who is on-call, and who authored the architecture.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onRunQuery("Who owns web-checkout and who is the lead?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Who owns web-checkout?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What services depend on auth-v1?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Services depending on auth-v1</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What is fraud-detector?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>What is fraud-detector?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Decisions & Provenance */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">What Was Decided &amp; Why?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Trace architectural decisions back to meetings, approving executives, and source specs.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onRunQuery("Explain DEC-88 and its origin")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Explain DEC-88 (Cookies &amp; XSS)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What is DEC-105 regarding connection pooling?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>What is DEC-105 (DB Pool)?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What was decided in the Q3 meeting?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Decisions in Q3 Meeting</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 3: Project Delays & PR Blockers */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Why Delayed or Blocked?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Discover policy violations, breaking dependencies, and cascading blast radii.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onRunQuery("Audit GitHub PR #214")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Why is PR #214 blocked?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What breaks if postgres-primary goes down?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Blast radius: postgres-primary</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What breaks if auth-v1 is shut down?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>4-Hop Blast radius: auth-v1</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Card 4: Service Catalog & Memory */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Service Catalog &amp; Memory</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Explore full enterprise inventory and prior autonomous agent audit findings.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onRunQuery("Show all services in the catalog")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Show full service catalog</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What are the recent agent memory findings?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Recall agent audit memory</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={onOpenMemory}
                className="w-full text-left text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50/60 p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Open Incident Memory Log</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Unified Enterprise Catalog Shortcut */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-400/30">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>FalkorDB Verified Knowledge Catalog</span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white">
            Unified Enterprise RFCs, Decisions &amp; PR Specs
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            All institutional records are stored directly in FalkorDB with cryptographic commit hashes, authorship links, and council approvals.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onOpenRegistry && (
            <button
              onClick={onOpenRegistry}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <span>Explore Document Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* 5. Enterprise MCP Gateway & Multi-Model Engine Section */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-400/30">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enterprise MCP Gateway &amp; Multi-Model Router</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Active Model &amp; Tool Calling Architecture
            </h2>
            <p className="text-xs text-slate-300">
              Switch between high-throughput Groq LPUs and Google Gemini models via our Enterprise AI Gateway with automated sub-5ms FalkorDB circuit-breaking.
            </p>
          </div>

          <button
            onClick={onOpenMcp}
            className="self-start lg:self-auto inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Inspect MCP Tools &amp; Logs</span>
          </button>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = model.id === selectedModel;
            return (
              <div
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  isSelected
                    ? "bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40"
                    : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-indigo-300">{model.speed}</span>
                  {isSelected && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white">
                      ACTIVE
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white mb-1">{model.name}</h4>
                <p className="text-[11px] text-slate-400 mb-2">{model.provider}</p>
                <p className="text-[10px] text-slate-300 line-clamp-2">{model.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Enterprise Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onUserAuthenticated={(user) => {
          onUserChange(user);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}
