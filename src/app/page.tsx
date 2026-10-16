"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ChatPanel } from "@/components/ChatPanel";
import { OverviewTab } from "@/components/OverviewTab";
import { RegistryTab } from "@/components/RegistryTab";
import { GraphData } from "@/lib/schema";
import { Network, Sparkles } from "lucide-react";

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [highlightHops, setHighlightHops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "studio" | "registry">("overview");
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

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

  const handleSelectScenario = (query: string) => {
    setSelectedQuery(query);
    setActiveTab("studio");
  };

  const handleQueryService = (serviceName: string) => {
    setSelectedQuery(`What services break if ${serviceName} is shut down?`);
    setActiveTab("studio");
  };

  const handleAuditPR = (prNum: number) => {
    setSelectedQuery(`Audit PR #${prNum} for architecture violations`);
    setActiveTab("studio");
  };

  return (
    <div className="flex flex-col h-screen bg-[#070709] text-zinc-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.edges.length}
        onRefresh={fetchGraph}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Viewport Content Area */}
      <main className="flex-1 min-h-0 relative">
        {activeTab === "overview" && (
          <OverviewTab
            onSelectScenario={handleSelectScenario}
            onOpenStudio={() => setActiveTab("studio")}
          />
        )}

        {activeTab === "registry" && (
          <RegistryTab
            graphData={graphData}
            onQueryService={handleQueryService}
            onAuditPR={handleAuditPR}
          />
        )}

        {activeTab === "studio" && (
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* Left: Interactive FalkorDB Graph Canvas (7 cols) */}
            <div className="lg:col-span-7 h-full p-4 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Network className="size-4 text-falkor-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Living Causal Graph Canvas
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono text-zinc-500">
                    {graphData.nodes.length} entities • {graphData.edges.length} relationships
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                {loading ? (
                  <div className="w-full h-full rounded-xl border border-zinc-800 flex items-center justify-center bg-zinc-950">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="size-2 rounded-full bg-falkor-500 animate-ping" />
                      Loading FalkorDB graph topology...
                    </div>
                  </div>
                ) : (
                  <GraphCanvas data={graphData} highlightHops={highlightHops} />
                )}
              </div>
            </div>

            {/* Right: AI Agent Chat & Oracle (5 cols) */}
            <div className="lg:col-span-5 h-full min-h-0">
              <ChatPanel
                onHopsChange={setHighlightHops}
                externalTriggerQuery={selectedQuery}
                onClearExternalTrigger={() => setSelectedQuery(null)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Hero Pitch Banner */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950/80 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2 shrink-0">
        <p className="line-clamp-1 text-[11px]">
          <span className="text-falkor-300 font-semibold">Core Insight: </span>
          Useful information is spread across meeting notes, project reports, and task records. Normal chatbots miss relationships; CompanyMind AI maps them in FalkorDB with full source provenance.
        </p>
        <div className="flex items-center gap-3 shrink-0 font-mono text-[10px] text-zinc-500">
          <span>Track 3: Company Brain</span>
          <span>•</span>
          <span>Track 2: Agent Memory</span>
          <span>•</span>
          <span className="text-emerald-400">Vercel Ready</span>
        </div>
      </footer>
    </div>
  );
}
