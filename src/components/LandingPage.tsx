"use client";

import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Network,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  GitPullRequest,
  FileText,
  Users,
  Terminal,
  Activity,
  Play,
  Database,
  ExternalLink,
  ChevronRight,
  Check,
  Building2,
  Code2,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onExploreDemo: () => void;
}

export function LandingPage({
  onGetStarted,
  onSignIn,
  onExploreDemo,
}: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<"blast" | "governance" | "provenance" | "sme">("blast");

  const tabScenarios = {
    blast: {
      title: "4-Hop Outage Blast Radius",
      query: "What services break if auth-v1 is shut down?",
      executionTime: "2 ms",
      hops: ["auth-v1", "api-gateway", "mobile-app", "web-checkout"],
      impact: "3 downstream microservices affected across Core Infra & Checkout teams.",
      mcpTool: "service_blast_radius(service='auth-v1', max_hops=4)",
    },
    governance: {
      title: "PR Governance Watchdog",
      query: "Audit PR #214 against architectural decisions",
      executionTime: "3 ms",
      hops: ["PR-214", "auth-v1", "DEC-44"],
      impact: "Intercepted PR #214 modifying deprecated auth-v1 in violation of DEC-44.",
      mcpTool: "audit_pr_governance(pr_number=214)",
    },
    provenance: {
      title: "Decision Provenance Trace",
      query: "Why did we decide to use mTLS for identity-service?",
      executionTime: "2 ms",
      hops: ["identity-service", "DEC-44", "RFC-102", "David Kim"],
      impact: "Traced to RFC-102 approved by David Kim (VP Eng) in Q3 Architecture Review.",
      mcpTool: "trace_decision_provenance(service='identity-service')",
    },
    sme: {
      title: "Subject Matter Expert Discovery",
      query: "Who owns payments-api and who are the subject matter experts?",
      executionTime: "2 ms",
      hops: ["payments-api", "Checkout Team", "Alex Mercer", "Priya Patel"],
      impact: "Identified Alex Mercer and Priya Patel based on git commits & RFC authorship.",
      mcpTool: "find_subject_matter_experts(service='payments-api')",
    },
  };

  const activeScenario = tabScenarios[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* 1. SaaS Top Navigation Bar */}
      <nav className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain size={20} strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white">
              CompanyMind
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold uppercase">
              Agent Harness
            </span>
          </div>
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </a>
          <a href="#demo" className="hover:text-white transition-colors">
            Live Harness
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
          <a
            href="https://github.com/vishal-kumar9032/companymind-ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Docs</span>
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSignIn}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center space-y-8">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-inner">
          <span className="flex size-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-semibold text-indigo-400 font-mono text-[11px]">
            CompanyMind v1.0
          </span>
          <span className="text-slate-600">|</span>
          <span>The Open-Source Agent Harness for Enterprise Knowledge</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Turn Complex Company Knowledge into{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
              Autonomous, Verifiable Agents
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate information silos across Google Workspace RFCs, executive architecture meetings, GitHub PRs, and microservices. Run autonomous agents that traverse multi-hop graph relationships in sub-5ms with zero hallucination.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
          >
            <span>Deploy Your Agent Workforce</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onExploreDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all cursor-pointer active:scale-95"
          >
            <Play size={14} fill="currentColor" className="text-indigo-400" />
            <span>Launch Live Interactive Demo</span>
          </button>
        </div>

        {/* Metric Bar */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              2 ms
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              FalkorDB Cypher Engine
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">
              4 Hops
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              Causal Blast Radius
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-violet-400 font-mono">
              5 Agents
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              Autonomous Workforce
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              100%
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              PR Policy Interception
            </div>
          </div>
        </div>

        {/* 3. Interactive Hero Terminal / Harness Showcase */}
        <div
          id="demo"
          className="w-full max-w-4xl mt-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-left"
        >
          {/* Terminal Window Header */}
          <div className="h-10 px-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-rose-500/80" />
              <div className="size-3 rounded-full bg-amber-500/80" />
              <div className="size-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] text-slate-500">
                companymind-agent — execution-loop: active
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              FalkorDB Online · 2ms
            </span>
          </div>

          {/* Scenario Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/50 overflow-x-auto p-1.5 gap-1">
            {(
              [
                ["blast", "4-Hop Outage Blast Radius"],
                ["governance", "PR Watchdog Interceptor"],
                ["provenance", "Decision Provenance"],
                ["sme", "SME & Owner Discovery"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === key
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Terminal Live Output Content */}
          <div className="p-5 font-mono text-xs space-y-4">
            <div className="space-y-1">
              <div className="text-slate-500 text-[11px]">
                // 1. User Inquiry dispatched to CompanyMind
              </div>
              <div className="text-white flex items-center gap-2">
                <span className="text-indigo-400 font-bold">$</span>
                <span>{activeScenario.query}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-indigo-400 font-semibold">
                  [Harness Execution Loop]
                </span>
                <span className="text-slate-500 font-mono">
                  Latency: {activeScenario.executionTime}
                </span>
              </div>
              <div className="text-slate-300 text-xs">
                ▶ Invoked MCP Tool:{" "}
                <span className="text-amber-300 font-bold">
                  {activeScenario.mcpTool}
                </span>
              </div>
              <div className="text-slate-400 text-xs">
                ▶ Causal Traversal Path:{" "}
                <span className="text-emerald-300 font-bold">
                  {activeScenario.hops.join(" → ")}
                </span>
              </div>
              <div className="text-slate-300 text-xs pt-1 border-t border-slate-800/60">
                ✔ <span className="font-semibold text-white">Impact:</span>{" "}
                {activeScenario.impact}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Verified with OpenCypher Proof & Supporting Citations</span>
              </div>
              <button
                onClick={onExploreDemo}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                <span>Run in Full Workspace</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Harness Capabilities Grid (Based on GitHub) */}
      <section id="features" className="py-16 sm:py-24 border-t border-slate-800 bg-slate-950 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              The CompanyMind Platform
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Everything Needed to Run Agents in Production
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              CompanyMind runs the agent execution loop for you: model planning, MCP tools, sandboxing, approvals, context engineering, and session state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Zap size={20} />
              </div>
              <h4 className="font-bold text-base text-white">Autonomous Agent Loop</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plans multi-turn actions, routes tool calls, streams token output, and retains long-term memory across sessions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="size-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <Network size={20} />
              </div>
              <h4 className="font-bold text-base text-white">FalkorDB Graph Engine</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                In-memory Redis graph with OpenCypher queries executing sub-5ms traversals to compute blast radius and decision provenance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <ShieldAlert size={20} />
              </div>
              <h4 className="font-bold text-base text-white">Human-in-the-Loop Approvals</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Policy Watchdog catches pull requests violating architecture decisions and pauses for engineer approval before merge.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Terminal size={20} />
              </div>
              <h4 className="font-bold text-base text-white">Remote MCP Tool Gateway</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects Model Context Protocol (MCP) servers with header authorization, OAuth, and live tool invocation telemetry.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="size-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Cpu size={20} />
              </div>
              <h4 className="font-bold text-base text-white">Multi-Model Routing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamlessly routes across Groq Qwen 27B, Gemini 3.1 Flash-Lite, and Autonomous FalkorDB fallback with automated circuit-breaker.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-indigo-500/50 transition-colors">
              <div className="size-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <Building2 size={20} />
              </div>
              <h4 className="font-bold text-base text-white">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Partition graph data, policies, and credentials by organization (Acme Corp, FinFlow Global, HealthPulse Systems).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Architecture Flow */}
      <section id="architecture" className="py-16 sm:py-24 border-t border-slate-800 bg-slate-900/40 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              End-to-End Pipeline
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              How Company Knowledge Flows into Verified Actions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-mono text-xs font-bold text-indigo-400">01 / Ingest</span>
              <h4 className="font-bold text-sm text-white">Enterprise Sources</h4>
              <p className="text-xs text-slate-400">
                Continuously synchronizes Google Workspace RFCs, executive architecture meetings, GitHub PRs, and Slack conversations.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-mono text-xs font-bold text-violet-400">02 / Model</span>
              <h4 className="font-bold text-sm text-white">FalkorDB Knowledge Graph</h4>
              <p className="text-xs text-slate-400">
                Extracts entities (Services, Decisions, People, Teams, PRs) and maps multi-hop causal relationships with high-speed indexes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-mono text-xs font-bold text-emerald-400">03 / Orchestrate</span>
              <h4 className="font-bold text-sm text-white">CompanyMind</h4>
              <p className="text-xs text-slate-400">
                Runs the agent loop, routes MCP tools, monitors context boundaries, and triggers human checkpoint approvals.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-mono text-xs font-bold text-amber-400">04 / Enforce</span>
              <h4 className="font-bold text-sm text-white">Verified Action & Proof</h4>
              <p className="text-xs text-slate-400">
                Synthesizes answers with verifiable document proofs (`[RFC-102]`, `[DEC-44]`) and intercepts non-compliant PRs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Tiers */}
      <section id="pricing" className="py-16 sm:py-24 border-t border-slate-800 bg-slate-950 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              Flexible Deployment
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Open-Source First, Enterprise Ready
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Community Tier */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Community</h4>
                  <p className="text-xs text-slate-400">For individual developers and local evaluation.</p>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  $0 <span className="text-xs font-sans text-slate-500">/ forever</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>Self-hosted CompanyMind</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>FalkorDB Docker integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>Standard MCP Tool Catalog</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onExploreDemo}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Launch Community Demo
              </button>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/80 to-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Professional</h4>
                  <p className="text-xs text-slate-300">For engineering teams standardizing architectures.</p>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  $49 <span className="text-xs font-sans text-slate-400">/ month</span>
                </div>
                <ul className="text-xs text-slate-200 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>Hosted CompanyMind Multi-Agent Studio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>Automated PR Governance Watchdog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>Sub-5ms FalkorDB cluster sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>Up to 10 active specialized agents</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Get Started with Pro
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Enterprise</h4>
                  <p className="text-xs text-slate-400">For large organizations requiring strict compliance.</p>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  Custom
                </div>
                <ul className="text-xs text-slate-300 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>Dedicated FalkorDB VPC cluster</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>SAML / SSO & Multi-Tenant Isolation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>Custom private MCP tool integrations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    <span>99.99% Uptime SLA & Dedicated Support</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-indigo-500" />
            <span className="font-semibold text-slate-400">CompanyMind</span>
            <span>·</span>
            <span>Powered by FalkorDB Graph Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com/vishal-kumar9032/companymind-ai" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">
              GitHub
            </a>
            <a href="https://falkordb.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">
              FalkorDB
            </a>
            <button onClick={onExploreDemo} className="hover:text-slate-300 transition-colors cursor-pointer">
              Live Demo
            </button>
            <button onClick={onSignIn} className="hover:text-slate-300 transition-colors cursor-pointer">
              Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
