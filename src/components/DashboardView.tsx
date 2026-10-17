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
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  SlidersHorizontal,
} from "lucide-react";
import { TENANTS, TenantConfig } from "@/lib/tenants";
import { AVAILABLE_MODELS, ModelOption } from "@/lib/truefoundry";
import { EnterpriseUser, DEMO_ENTERPRISE_USERS, signInWithGoogleAuth, signOutEnterpriseUser } from "@/lib/firebase";
import { ENTERPRISE_SOURCES, SourceDetail } from "@/lib/sources";

interface DashboardViewProps {
  currentTenant: TenantConfig;
  onSelectTenant: (tenant: TenantConfig) => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  currentUser: EnterpriseUser | null;
  onUserChange: (user: EnterpriseUser | null) => void;
  onRunQuery: (query: string) => void;
  onOpenSource: (source: SourceDetail) => void;
  onOpenGraph: () => void;
  onOpenMcp: () => void;
  onOpenMemory: () => void;
  latencyMs?: number;
}

const HERO_PROMPTS = [
  "What breaks if auth-v1 is shut down?",
  "Why was DEC-44 decided?",
  "Who owns payments-api?",
  "Audit PR #214",
];

export function DashboardView({
  currentTenant,
  onSelectTenant,
  selectedModel,
  onSelectModel,
  currentUser,
  onUserChange,
  onRunQuery,
  onOpenSource,
  onOpenGraph,
  onOpenMcp,
  onOpenMemory,
  latencyMs = 2,
}: DashboardViewProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [askText, setAskText] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<"all" | "rfc" | "meeting" | "pr" | "decision">("all");

  const sourcesList = Object.values(ENTERPRISE_SOURCES);
  const filteredSources = sourcesList.filter((s) => {
    if (selectedSourceType === "all") return true;
    return s.type === selectedSourceType;
  });

  const activeModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const handleGoogleSignIn = async (preset?: EnterpriseUser) => {
    setAuthLoading(true);
    try {
      const user = await signInWithGoogleAuth(preset);
      onUserChange(user);
      setShowAuthModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutEnterpriseUser();
    onUserChange(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. Hero: one headline, one ask bar */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/40 px-6 py-10 sm:px-12 sm:py-14 shadow-sm">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-indigo-700 text-xs font-semibold border border-indigo-100 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Company brain powered by FalkorDB
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Ask your company <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">anything.</span>
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
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Ask <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {HERO_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => onRunQuery(q)}
                className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenGraph}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <FolderTree className="h-3.5 w-3.5 text-indigo-600" />
              Explore the graph
            </button>
            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Signed in as {currentUser.displayName} · Sign out
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
              >
                <Lock className="h-3.5 w-3.5 text-indigo-300" />
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Multi-Tenant Switcher & Executive Stats */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Multi-Tenant Organization Workspaces
            </h2>
            <p className="text-xs text-slate-500">
              Isolated enterprise data partitions, repositories, policies, and team topologies.
            </p>
          </div>

          {/* Tenant Switcher Tabs */}
          <div className="inline-flex p-1 bg-slate-100/80 border border-slate-200/80 rounded-xl gap-1">
            {TENANTS.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => onSelectTenant(tenant)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTenant.id === tenant.id
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tenant.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tenant Details & Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Catalog Services</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{currentTenant.stats.servicesCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tier 0, 1 & 2 microservices</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Engineers & Leads</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{currentTenant.stats.engineersCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Mapped to service ownership</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Governing Policies</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{currentTenant.stats.decisionsCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Enforced via FalkorDB watchdog</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Traversal Latency</span>
              <Zap className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{latencyMs} ms</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Sub-5ms FalkorDB execution</div>
          </div>
        </div>
      </section>

      {/* 3. The 4 Institutional Problem Solvers (One-Click Queries) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            Instant Institutional Questions & Traversal Solvers
          </h2>
          <p className="text-xs text-slate-500">
            Click any prompt to run a multi-hop traversal in FalkorDB with live Neural AI synthesis and verifiable citations.
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
                <h3 className="text-sm font-bold text-slate-900">Task & Service Ownership</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Resolve who owns a component, who is on-call, and who authored the architecture.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onRunQuery("Who owns web-checkout and who is the lead?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Who owns web-checkout?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("Who is Sarah Chen and what services does she own?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Who is Sarah Chen?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What is fraud-detector?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
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
                <h3 className="text-sm font-bold text-slate-900">What Was Decided & Why?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Trace architectural decisions back to meetings, approving executives, and source specs.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onRunQuery("Explain DEC-88 and its origin")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Explain DEC-88 (Cookies & XSS)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What is DEC-105 regarding connection pooling?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>What is DEC-105 (DB Pool)?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What was decided in the Q3 meeting?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
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
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Why is PR #214 blocked?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What breaks if postgres-primary goes down?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Blast radius: postgres-primary</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What breaks if auth-v1 is shut down?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
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
                <h3 className="text-sm font-bold text-slate-900">Service Catalog & Memory</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Explore full enterprise inventory and prior autonomous agent audit findings.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onRunQuery("Show all services in the catalog")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Show full service catalog</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onRunQuery("What are the recent agent memory findings?")}
                className="w-full text-left text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Recall agent audit memory</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={onOpenMemory}
                className="w-full text-left text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50/60 p-2 rounded-lg transition-colors flex items-center justify-between"
              >
                <span>Open Incident Memory Log</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Supporting Documents & Verifiable Evidence Explorer */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Supporting Documents & Verifiable Evidence
            </h2>
            <p className="text-xs text-slate-500">
              Inspect the exact RFCs, meeting notes, PRs, and decisions that ground every AI answer.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1 text-xs font-medium">
            {(["all", "rfc", "meeting", "pr", "decision"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedSourceType(type)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${
                  selectedSourceType === type
                    ? "bg-white text-indigo-600 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Source Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              onClick={() => onOpenSource(source)}
              className="group cursor-pointer border border-slate-200 hover:border-indigo-300 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {source.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{source.date}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {source.title}
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                  {source.snippet}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 truncate max-w-[180px]">By {source.author}</span>
                <span className="text-indigo-600 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Inspect <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Enterprise MCP Gateway & Multi-Model Engine Section */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-400/30">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Enterprise MCP Gateway & Multi-Model Router
            </div>
            <h2 className="text-xl font-bold tracking-tight">Active Model & Tool Calling Architecture</h2>
            <p className="text-xs text-slate-300">
              Switch between high-throughput Groq LPUs and Google Gemini models via our Enterprise AI Gateway with automated sub-5ms FalkorDB circuit-breaking.
            </p>
          </div>

          <button
            onClick={onOpenMcp}
            className="self-start lg:self-auto inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Inspect MCP Tools & Logs
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

      {/* Auth Modal (Continue with Google / Firebase Demo Profiles) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                  G
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sign in to CompanyMind AI</h3>
                  <p className="text-[11px] text-slate-500">Firebase Auth & Multi-Tenant Sync</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Authenticate using your Google account via Firebase or select a pre-configured enterprise role for verification.
            </p>

            <div className="space-y-3">
              {/* Primary Google Auth Button */}
              <button
                onClick={() => handleGoogleSignIn()}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {authLoading ? "Signing in..." : "Continue with Google (Firebase)"}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-semibold">
                  Or Instant Demo Profiles
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Demo Profiles */}
              <div className="space-y-2">
                {DEMO_ENTERPRISE_USERS.map((demoUser) => (
                  <button
                    key={demoUser.uid}
                    onClick={() => handleGoogleSignIn(demoUser)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-white transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{demoUser.displayName}</p>
                      <p className="text-[11px] text-slate-500">{demoUser.role} · {demoUser.department}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      Use Profile
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Multi-tenant session state is synced to Firebase Firestore in real-time.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
