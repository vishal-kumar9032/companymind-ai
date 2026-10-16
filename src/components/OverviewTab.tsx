"use client";

import React from "react";
import {
  Sparkles,
  ShieldAlert,
  Network,
  GitPullRequest,
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  Zap,
  Layers,
  Database,
  Cpu,
  Lock,
  Compass,
} from "lucide-react";

interface OverviewTabProps {
  onSelectScenario: (query: string) => void;
  onOpenStudio: () => void;
}

export function OverviewTab({ onSelectScenario, onOpenStudio }: OverviewTabProps) {
  const scenarios = [
    {
      id: "blast-radius",
      title: "4-Hop Outage Blast Radius",
      track: "Track 3 • Company Brain",
      badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      icon: Network,
      iconColor: "text-purple-400",
      query: "What services break if auth-v1 is shut down?",
      description:
        "Calculates multi-hop downstream dependencies across microservices when a core service is sunset or fails, surfacing impacted teams and team leads in 97ms.",
      highlight: "Traverses auth-v1 → api-gateway → mobile-app & web-checkout across 3 teams.",
    },
    {
      id: "governance-audit",
      title: "PR Governance Watchdog",
      track: "Track 2 • Agent Coordination",
      badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/30",
      icon: ShieldAlert,
      iconColor: "text-rose-400",
      query: "Audit PR #214 for architecture and meeting decision violations",
      description:
        "Catches code pull requests attempting to bypass sunsetting policies or modify deprecated systems before merging into production.",
      highlight: "Intercepts PR #214 modifying deprecated auth-v1, citing Executive Decision DEC-44.",
    },
    {
      id: "decision-provenance",
      title: "Architectural Decision Provenance",
      track: "Track 3 • Institutional Memory",
      badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      icon: Compass,
      iconColor: "text-amber-400",
      query: "Why did we decide to use mTLS for identity-service?",
      description:
        "Answers 'Why was this built this way?' by connecting code constraints to executive meeting notes, RFC documents, and leadership sign-offs.",
      highlight: "Traces DEC-44 to RFC-102 approved by David Kim (VP Eng) in Q3 Architecture Review.",
    },
    {
      id: "sme-discovery",
      title: "Institutional Knowledge & SME Mapping",
      track: "Track 3 • Company Brain",
      badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      icon: Users,
      iconColor: "text-cyan-400",
      query: "Who owns payments-api and who are the subject matter experts?",
      description:
        "Discovers the true owners and domain experts for critical services by correlating RFC authorship, team assignments, and git pull request history in FalkorDB.",
      highlight: "Identifies Priya Patel and Alex Mercer as designated subject matter experts.",
    },
  ];

  return (
    <div className="h-full overflow-y-auto px-6 py-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="relative text-center space-y-5 pt-4 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-falkor-500/10 border border-falkor-500/30 text-falkor-300 text-xs font-medium">
          <Sparkles className="size-3.5 text-falkor-400 animate-pulse" />
          <span>WeMakeDevs Graph Hacks 2026 • Powered by FalkorDB</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
          The Autonomous Enterprise Graph Brain & Cross-Agent Shared Memory
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          In modern tech companies, critical knowledge is scattered across Google Meet transcripts, RFC specifications, GitHub PRs, and microservice architectures. Traditional document chatbots miss relationships — <strong className="text-zinc-200">CompanyMind AI maps them in FalkorDB with full causal provenance.</strong>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenStudio}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-falkor-600 hover:bg-falkor-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-falkor-600/25 transition-all cursor-pointer active:scale-95"
          >
            <span>Launch Graph Studio</span>
            <ArrowRight className="size-4" />
          </button>
          <button
            onClick={() => onSelectScenario(scenarios[0].query)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95"
          >
            <Zap className="size-4 text-falkor-400" />
            <span>Simulate 4-Hop Blast Radius</span>
          </button>
        </div>
      </div>

      {/* The Pain vs Solution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pain Point */}
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 to-zinc-950 p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="size-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Traditional Document RAG</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Vector search chatbots chunk documents and look for keyword similarity. When an engineer asks <em className="text-zinc-300">"What breaks if auth-v1 is shut down?"</em>, vector RAG fails because the answer is not in any single paragraph. It is a <strong>4-hop dependency graph</strong> linking microservices, routing layers, and team ownership.
          </p>
          <ul className="space-y-2 text-xs text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0">✕</span>
              <span>Blind to recursive microservice dependency cascades</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0">✕</span>
              <span>Cannot trace decisions back to executive meetings or sign-offs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0">✕</span>
              <span>AI agents work in isolation with no shared episodic graph memory</span>
            </li>
          </ul>
        </div>

        {/* CompanyMind Solution */}
        <div className="rounded-2xl border border-falkor-500/30 bg-gradient-to-br from-falkor-950/30 to-zinc-950 p-6 space-y-4 shadow-xl shadow-falkor-950/40">
          <div className="flex items-center gap-2 text-falkor-400">
            <Database className="size-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">CompanyMind AI (FalkorDB Core)</h3>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Connects Google Workspace (Meet transcripts, RFC docs) with GitHub (PRs, issues, commits) and microservice infrastructure in <strong>FalkorDB</strong>. Traverses multi-hop causal graphs in milliseconds, with zero hallucinations and full supporting proof.
          </p>
          <ul className="space-y-2 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Multi-hop OpenCypher graph traversals with microsecond latency</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Deterministic provenance: links code directly to RFCs and executive meetings</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Autonomous agent shared memory: agents store and share findings in the graph</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Demo Scenarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-200">Interactive Demo Scenarios</h2>
            <p className="text-xs text-zinc-400">Click any scenario to run live against FalkorDB and view the highlighted graph path.</p>
          </div>
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">4 Live Scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-falkor-500/50 hover:bg-zinc-900/90 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                      {s.track}
                    </span>
                    <Icon className={`size-4 ${s.iconColor}`} />
                  </div>

                  <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-falkor-300 transition-colors">
                    {s.title}
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed">{s.description}</p>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/60 text-[11px] font-mono text-zinc-400">
                    <span className="text-falkor-400 font-semibold block text-[10px] uppercase mb-0.5">Graph Traverse:</span>
                    {s.highlight}
                  </div>
                </div>

                <button
                  onClick={() => onSelectScenario(s.query)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800/80 hover:bg-falkor-600 text-zinc-200 hover:text-white text-xs font-medium transition-all cursor-pointer group-hover:bg-falkor-600"
                >
                  <span>Execute on Graph Brain</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
        <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="size-4 text-falkor-400" />
          <span>System Architecture & Integration Stack</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
            <div className="text-xs font-semibold text-zinc-200">FalkorDB</div>
            <p className="text-[11px] text-zinc-400">Ultra-fast Redis-based graph database for sub-10ms OpenCypher traversals.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
            <div className="text-xs font-semibold text-zinc-200">Enterprise AI Gateway</div>
            <p className="text-[11px] text-zinc-400">High-throughput multi-model router with Groq Qwen 27B and Gemini.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
            <div className="text-xs font-semibold text-zinc-200">Cytoscape.js</div>
            <p className="text-[11px] text-zinc-400">GPU-accelerated interactive force-directed graph canvas with real-time hop animation.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
            <div className="text-xs font-semibold text-zinc-200">Next.js 15 App Router</div>
            <p className="text-[11px] text-zinc-400">Serverless architecture hostable directly on Vercel with zero cold start lag.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
