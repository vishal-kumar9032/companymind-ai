"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ChatPanel } from "@/components/ChatPanel";
import { AgentsTab } from "@/components/AgentsTab";
import { MemoryTab } from "@/components/MemoryTab";
import { SourceDrawer } from "@/components/SourceDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { AnalyticsModal } from "@/components/AnalyticsModal";
import { GraphData, ToolTrace } from "@/lib/schema";
import { ENTERPRISE_SOURCES, SourceDetail } from "@/lib/sources";
import {
  Network,
  Sparkles,
  Bot,
  Brain,
  ShieldAlert,
  Search,
} from "lucide-react";

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [highlightHops, setHighlightHops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<"oracle" | "agents" | "memory">("oracle");
  const [mobileTab, setMobileTab] = useState<"graph" | "oracle" | "agents" | "memory">("graph");
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<SourceDetail | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(4);
  const [lastTraces, setLastTraces] = useState<ToolTrace[]>([]);
  const [lastQuery, setLastQuery] = useState("What services break if auth-v1 is shut down?");
  const [lastOutcome, setLastOutcome] = useState("answered_with_path");
  const [memoryRefreshTrigger, setMemoryRefreshTrigger] = useState(0);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/graph");
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      console.error("Failed to load graph data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleOpenSource = (sourceId: string) => {
    const src = ENTERPRISE_SOURCES[sourceId];
    if (src) {
      setActiveSource(src);
    }
  };

  const handleSelectQueryFromPalette = (query: string) => {
    setSelectedQuery(query);
    setActiveRightTab("oracle");
    setMobileTab("oracle");
  };

  const handleResponseUpdate = (data: {
    traces: ToolTrace[];
    query: string;
    outcome: string;
    hops: string[];
    latencyMs?: number;
  }) => {
    if (data.traces) setLastTraces(data.traces);
    if (data.query) setLastQuery(data.query);
    if (data.outcome) setLastOutcome(data.outcome);
    if (data.latencyMs) setLatencyMs(data.latencyMs);
    if (data.hops) setHighlightHops(data.hops);
  };

  return (
    <div className="flex flex-col h-screen bg-[#08080c] text-zinc-100 overflow-hidden font-sans select-none">
      {/* Top Slim Navigation Bar */}
      <Navbar
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.edges.length}
        onRefresh={fetchGraph}
        latencyMs={latencyMs}
      />

      {/* Main Stage: Two Floating Rounded Cards with 16px Gaps */}
      <main className="flex-1 min-h-0 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* LEFT FLOATING CARD: Graph Canvas (7 cols on lg, full width when mobileTab === 'graph') */}
        <section
          className={`h-full min-h-0 flex flex-col rounded-card border border-border bg-surface/30 backdrop-blur-md overflow-hidden relative shadow-card ${
            mobileTab === "graph" ? "flex lg:col-span-7" : "hidden lg:flex lg:col-span-7"
          }`}
          aria-label="FalkorDB Graph Visualization"
        >
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-bg/50 text-xs font-mono text-zinc-400 gap-2">
              <span className="size-2 rounded-full bg-accent animate-ping" />
              <span>Hydrating FalkorDB graph topology...</span>
            </div>
          ) : (
            <GraphCanvas
              data={graphData}
              highlightHops={highlightHops}
              onSelectNode={(nodeId: string) => {
                const src = ENTERPRISE_SOURCES[nodeId];
                if (src) setActiveSource(src);
              }}
            />
          )}
        </section>

        {/* RIGHT FLOATING CARD: Tabbed Panel (5 cols on lg, full width when mobileTab !== 'graph') */}
        <section
          className={`h-full min-h-0 flex flex-col rounded-card border border-border bg-surface/30 backdrop-blur-md overflow-hidden shadow-card ${
            mobileTab !== "graph" ? "flex lg:col-span-5" : "hidden lg:flex lg:col-span-5"
          }`}
          aria-label="Agent Workstation and Intelligence Tabs"
        >
          {/* Tab Bar Header */}
          <div className="p-2.5 border-b border-border bg-surface/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-border/60">
              <button
                onClick={() => {
                  setActiveRightTab("oracle");
                  setMobileTab("oracle");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeRightTab === "oracle"
                    ? "bg-accent text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles size={13} strokeWidth={1.75} />
                <span>Oracle</span>
              </button>

              <button
                onClick={() => {
                  setActiveRightTab("agents");
                  setMobileTab("agents");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeRightTab === "agents"
                    ? "bg-accent text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Bot size={13} strokeWidth={1.75} />
                <span>Agents</span>
                {lastOutcome === "governance_violation" && (
                  <span className="size-1.5 rounded-full bg-danger animate-pulse" />
                )}
              </button>

              <button
                onClick={() => {
                  setActiveRightTab("memory");
                  setMobileTab("memory");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeRightTab === "memory"
                    ? "bg-accent text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Brain size={13} strokeWidth={1.75} />
                <span>Memory</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center gap-1.5 text-2xs font-mono text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-surface hover:bg-surface-hover border border-border transition-colors cursor-pointer"
                title="Search graph & commands (Cmd+K)"
              >
                <Search size={11} />
                <span className="hidden sm:inline">Cmd+K</span>
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeRightTab === "oracle" && (
              <ChatPanel
                onHopsChange={setHighlightHops}
                externalTriggerQuery={selectedQuery}
                onClearExternalTrigger={() => setSelectedQuery(null)}
                onOpenSourceDrawer={handleOpenSource}
                onSelectNode={(nodeId) => {
                  setHighlightHops([nodeId]);
                  handleOpenSource(nodeId);
                }}
                onResponseUpdate={handleResponseUpdate}
              />
            )}

            {activeRightTab === "agents" && (
              <AgentsTab
                traces={lastTraces}
                lastQuery={lastQuery}
                outcome={lastOutcome}
                sessionId="session-1"
                onSelectNode={(nodeId) => {
                  setHighlightHops([nodeId]);
                  handleOpenSource(nodeId);
                }}
                onFindingSaved={() => setMemoryRefreshTrigger((prev) => prev + 1)}
              />
            )}

            {activeRightTab === "memory" && (
              <MemoryTab
                onSelectNode={(nodeId) => {
                  setHighlightHops([nodeId]);
                  handleOpenSource(nodeId);
                }}
                refreshTrigger={memoryRefreshTrigger}
              />
            )}
          </div>
        </section>
      </main>

      {/* Responsive Bottom Tabs (Rendered below lg) */}
      <nav
        className="lg:hidden shrink-0 border-t border-border bg-surface/90 backdrop-blur-md px-3 py-2 flex items-center justify-around text-xs font-mono"
        aria-label="Mobile Navigation"
      >
        <button
          onClick={() => setMobileTab("graph")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
            mobileTab === "graph" ? "text-accent font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Network size={16} strokeWidth={1.75} />
          <span className="text-3xs">Graph</span>
        </button>

        <button
          onClick={() => {
            setMobileTab("oracle");
            setActiveRightTab("oracle");
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
            mobileTab === "oracle" ? "text-accent font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sparkles size={16} strokeWidth={1.75} />
          <span className="text-3xs">Ask</span>
        </button>

        <button
          onClick={() => {
            setMobileTab("agents");
            setActiveRightTab("agents");
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
            mobileTab === "agents" ? "text-accent font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Bot size={16} strokeWidth={1.75} />
          <span className="text-3xs">Agents</span>
        </button>

        <button
          onClick={() => {
            setMobileTab("memory");
            setActiveRightTab("memory");
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
            mobileTab === "memory" ? "text-accent font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Brain size={16} strokeWidth={1.75} />
          <span className="text-3xs">Memory</span>
        </button>
      </nav>

      {/* Slide-in Source Inspector Drawer */}
      <SourceDrawer
        source={activeSource}
        onClose={() => setActiveSource(null)}
        onHighlightGraph={(hops) => setHighlightHops(hops)}
      />

      {/* Global Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectQuery={handleSelectQueryFromPalette}
        onSelectSource={handleOpenSource}
      />

      {/* Analytics & Knowledge Gaps Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
}
