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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* 1. SaaS Top Navigation Bar */}
      <nav className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Brain size={20} strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              CompanyMind
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold uppercase">
              Agent Harness
            </span>
          </div>
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">
            Capabilities
          </a>
          <a href="#architecture" className="hover:text-slate-900 transition-colors">
            Architecture
          </a>
          <a href="#demo" className="hover:text-slate-900 transition-colors">
            Live Harness
          </a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">
            Pricing
          </a>
          <a
            href="https://github.com/vishal-kumar9032/companymind-ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900 transition-colors inline-flex items-center gap-1"
          >
            <span>Docs</span>
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSignIn}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center space-y-8">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
          <span className="flex size-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="font-semibold text-indigo-700 font-mono text-[11px]">
            CompanyMind v1.0
          </span>
          <span className="text-slate-300">|</span>
          <span>The Open-Source Agent Harness for Enterprise Knowledge</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Turn Complex Company Knowledge into{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
              Autonomous, Verifiable Agents
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate information silos across Google Workspace RFCs, executive architecture meetings, GitHub PRs, and microservices. Run autonomous agents that traverse multi-hop graph relationships in sub-5ms with zero hallucination.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
          >
            <span>Deploy Your Agent Workforce</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onExploreDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Play size={14} fill="currentColor" className="text-indigo-600" />
            <span>Launch Live Interactive Demo</span>
          </button>
        </div>

        {/* Metric Bar */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              2 ms
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
              FalkorDB Cypher Engine
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono">
              4 Hops
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
              Causal Blast Radius
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-violet-600 font-mono">
              5 Agents
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
              Autonomous Workforce
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
              100%
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
              PR Policy Interception
            </div>
          </div>
        </div>

        {/* 3. Interactive Hero Terminal / Harness Showcase */}
        <div
          id="demo"
          className="w-full max-w-4xl mt-6 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden text-left"
        >
          {/* Terminal Window Header */}
          <div className="h-10 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-rose-400" />
              <div className="size-3 rounded-full bg-amber-400" />
              <div className="size-3 rounded-full bg-emerald-400" />
              <span className="ml-2 font-mono text-[11px] text-slate-600">
                companymind-agent — execution-loop: active
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              FalkorDB Online · 2ms
            </span>
          </div>

          {/* Scenario Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/60 overflow-x-auto p-1.5 gap-1">
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
                    ? "bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
              <div className="text-slate-900 flex items-center gap-2 font-medium">
                <span className="text-indigo-600 font-bold">$</span>
                <span>{activeScenario.query}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-indigo-700 font-semibold">
                  [Harness Execution Loop]
                </span>
                <span className="text-slate-500 font-mono">
                  Latency: {activeScenario.executionTime}
                </span>
              </div>
              <div className="text-slate-700 text-xs">
                ▶ Invoked MCP Tool:{" "}
                <span className="text-amber-700 font-bold">
                  {activeScenario.mcpTool}
                </span>
              </div>
              <div className="text-slate-600 text-xs">
                ▶ Causal Traversal Path:{" "}
                <span className="text-emerald-700 font-bold">
                  {activeScenario.hops.join(" → ")}
                </span>
              </div>
              <div className="text-slate-700 text-xs pt-1 border-t border-slate-200">
                ✔ <span className="font-semibold text-slate-900">Impact:</span>{" "}
                {activeScenario.impact}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Verified with OpenCypher Proof & Supporting Citations</span>
              </div>
              <button
                onClick={onExploreDemo}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                <span>Run in Full Workspace</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Harness Capabilities Grid (Based on GitHub) */}
      <section id="features" className="py-16 sm:py-24 border-t border-slate-200 bg-white px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
              The CompanyMind Platform
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Everything Needed to Run Agents in Production
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              CompanyMind runs the agent execution loop for you: model planning, MCP tools, sandboxing, approvals, context engineering, and session state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3 hover:border-indigo-300 hover:bg-white transition-all shadow-xs">
              <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                <Zap size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900">Autonomous Agent Loop</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plans multi-turn actions, routes tool calls, streams token output, and retains long-term memory across sessions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3 hover:border-indigo-300 hover:bg-white transition-all shadow-xs">
              <div className="size-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-200">
                <Network size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900">FalkorDB Graph Engine</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                In-memory Redis graph with OpenCypher queries executing sub-5ms traversals to compute blast radius and decision provenance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3 hover:border-indigo-300 hover:bg-white transition-all shadow-xs">
              <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <ShieldAlert size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900">Human-in-the-Loop Approvals</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Policy Watchdog catches pull requests violating architecture decisions and pauses for engineer approval before merge.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3 hover:border-indigo-300 hover:bg-white transition-all shadow-xs">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Terminal size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900">Remote MCP Tool Gateway</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects Model Context Protocol (MCP) servers with header authorization, OAuth, and live tool invocation telemetry.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3 hover:border-indigo-300 hover:bg-white transition-all shadow-xs">
              <div className="size-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200">
                <Cpu size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900">Multi-Model Routing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamlessly routes across Groq Qwen 27B, Gemini 3.1 Flash-Lite, and Autonomous FalkorDB fallback with automated circuit-breaker.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3 hover:border-indigo-300 hover:bg-white transition-all shadow-xs">
              <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Building2 size={20} />
              </div>
              <h4 className="font-bold text-base text-slate-900">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Partition graph data, policies, and credentials by organization (Acme Corp, FinFlow Global, HealthPulse Systems).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Architecture Flow */}
      <section id="architecture" className="py-16 sm:py-24 border-t border-slate-200 bg-slate-50/60 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
              End-to-End Pipeline
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              How Company Knowledge Flows into Verified Actions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <span className="font-mono text-xs font-bold text-indigo-600">01 / Ingest</span>
              <h4 className="font-bold text-sm text-slate-900">Enterprise Sources</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuously synchronizes Google Workspace RFCs, executive architecture meetings, GitHub PRs, and Slack conversations.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <span className="font-mono text-xs font-bold text-violet-600">02 / Model</span>
              <h4 className="font-bold text-sm text-slate-900">FalkorDB Knowledge Graph</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts entities (Services, Decisions, People, Teams, PRs) and maps multi-hop causal relationships with high-speed indexes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <span className="font-mono text-xs font-bold text-emerald-600">03 / Orchestrate</span>
              <h4 className="font-bold text-sm text-slate-900">CompanyMind</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Runs the agent loop, routes MCP tools, monitors context boundaries, and triggers human checkpoint approvals.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <span className="font-mono text-xs font-bold text-amber-600">04 / Enforce</span>
              <h4 className="font-bold text-sm text-slate-900">Verified Action & Proof</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Synthesizes answers with verifiable document proofs (`[RFC-102]`, `[DEC-44]`) and intercepts non-compliant PRs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Tiers */}
      <section id="pricing" className="py-16 sm:py-24 border-t border-slate-200 bg-white px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
              Flexible Deployment
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Open-Source First, Enterprise Ready
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Community Tier */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-6 shadow-xs">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900">Community</h4>
                  <p className="text-xs text-slate-500">For individual developers and local evaluation.</p>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono">
                  $0 <span className="text-xs font-sans text-slate-500">/ forever</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>Self-hosted CompanyMind</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>FalkorDB Docker integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>Standard MCP Tool Catalog</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onExploreDemo}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Launch Community Demo
              </button>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-50/50 via-white to-white border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900">Professional</h4>
                  <p className="text-xs text-slate-600">For engineering teams standardizing architectures.</p>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono">
                  $49 <span className="text-xs font-sans text-slate-500">/ month</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>Hosted CompanyMind Multi-Agent Studio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>Automated PR Governance Watchdog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>Sub-5ms FalkorDB cluster sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>Up to 10 active specialized agents</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Get Started with Pro
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-6 shadow-xs">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900">Enterprise</h4>
                  <p className="text-xs text-slate-500">For large organizations requiring strict compliance.</p>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono">
                  Custom
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>Dedicated FalkorDB VPC cluster</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>SAML / SSO & Multi-Tenant Isolation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>Custom private MCP tool integrations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600" />
                    <span>99.99% Uptime SLA & Dedicated Support</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-indigo-600" />
            <span className="font-semibold text-slate-700">CompanyMind</span>
            <span>·</span>
            <span>Powered by FalkorDB Graph Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com/vishal-kumar9032/companymind-ai" target="_blank" rel="noreferrer" className="hover:text-slate-800 transition-colors">
              GitHub
            </a>
            <a href="https://falkordb.com" target="_blank" rel="noreferrer" className="hover:text-slate-800 transition-colors">
              FalkorDB
            </a>
            <button onClick={onExploreDemo} className="hover:text-slate-800 transition-colors cursor-pointer">
              Live Demo
            </button>
            <button onClick={onSignIn} className="hover:text-slate-800 transition-colors cursor-pointer">
              Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
