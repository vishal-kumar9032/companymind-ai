"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ChatPanel } from "@/components/ChatPanel";
import { OverviewTab } from "@/components/OverviewTab";
import { RegistryTab } from "@/components/RegistryTab";
import { Sidebar, UserRole } from "@/components/Sidebar";
import { SourceDrawer } from "@/components/SourceDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { AnalyticsModal } from "@/components/AnalyticsModal";
import { GraphData } from "@/lib/schema";
import { ENTERPRISE_SOURCES, SourceDetail } from "@/lib/sources";
import { Network, Sparkles, Database, Layers, ArrowRight } from "lucide-react";

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [highlightHops, setHighlightHops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"studio" | "overview" | "registry">("studio");
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("new_hire");
  const [activeSource, setActiveSource] = useState<SourceDetail | null>(null);
  const [isGraphView, setIsGraphView] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

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

  const handleOpenSource = (sourceId: string) => {
    const src = ENTERPRISE_SOURCES[sourceId];
    if (src) {
      setActiveSource(src);
    }
  };

  // 90-Second Walkthrough for Judges (Requirement #7)
  const handleStartDemoWalkthrough = () => {
    setActiveTab("studio");
    setSelectedQuery("What services break if auth-v1 is shut down?");
    setTimeout(() => {
      setActiveSource(ENTERPRISE_SOURCES["RFC-102"]);
    }, 1800);
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

      {/* Main 3-Part Viewport */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Sidebar (Chats, Connected Sources, Roles) */}
        <Sidebar
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onSelectQuery={handleSelectScenario}
          onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onStartDemoWalkthrough={handleStartDemoWalkthrough}
          isGraphView={isGraphView}
          onToggleGraphView={() => setIsGraphView(!isGraphView)}
        />

        {/* Center Main Stage */}
        <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
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
              {/* Left Graph Visualizer (7 cols if graph is active, otherwise collapsed) */}
              {isGraphView && (
                <div className="lg:col-span-7 h-full p-3 flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <Network className="size-4 text-falkor-400" />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        FalkorDB Causal Topology
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-mono text-zinc-500">
                        {graphData.nodes.length} nodes • {graphData.edges.length} edges
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
              )}

              {/* Right Chat Oracle Panel (5 cols if graph view active, full width otherwise) */}
              <div
                className={`${
                  isGraphView ? "lg:col-span-5" : "lg:col-span-12"
                } h-full min-h-0`}
              >
                <ChatPanel
                  onHopsChange={setHighlightHops}
                  externalTriggerQuery={selectedQuery}
                  onClearExternalTrigger={() => setSelectedQuery(null)}
                  onOpenSourceDrawer={handleOpenSource}
                  role={currentRole}
                />
              </div>
            </div>
          )}
        </main>

        {/* Right Source Inspector Drawer */}
        <SourceDrawer
          source={activeSource}
          onClose={() => setActiveSource(null)}
          onHighlightGraph={(hops) => setHighlightHops(hops)}
        />
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectQuery={handleSelectScenario}
        onSelectSource={handleOpenSource}
      />

      {/* Analytics & Knowledge Gaps Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Bottom Status Bar */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950/80 px-6 py-2 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2 shrink-0">
        <p className="line-clamp-1 text-[11px]">
          <span className="text-falkor-300 font-semibold">FalkorDB Enterprise Brain: </span>
          Connecting Google Workspace meeting notes, RFC documents, GitHub PRs, and microservice infrastructure with zero-hallucination graph provenance.
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
