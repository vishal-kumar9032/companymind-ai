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
  Activity,
  Network,
  Brain,
  X,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [highlightHops, setHighlightHops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<SourceDetail | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(4);
  const [lastTraces, setLastTraces] = useState<ToolTrace[]>([]);
  const [lastQuery, setLastQuery] = useState("What services break if auth-v1 is shut down?");
  const [lastOutcome, setLastOutcome] = useState("answered_with_path");
  const [memoryRefreshTrigger, setMemoryRefreshTrigger] = useState(0);

  // Small slide-over panels state
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

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

    // If an approval is required, gently offer the process drawer
    if (data.outcome === "governance_violation") {
      setIsProcessOpen(true);
    }
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

      {/* Main Agent Workspace (Full Screen TrueForge UI) */}
      <main className="flex-1 min-h-0 relative flex flex-col w-full h-full overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden relative">
          <ChatPanel
            onHopsChange={setHighlightHops}
            externalTriggerQuery={selectedQuery}
            onClearExternalTrigger={() => setSelectedQuery(null)}
            onOpenSourceDrawer={handleOpenSource}
            onSelectNode={(nodeId: string) => {
              setHighlightHops([nodeId]);
              handleOpenSource(nodeId);
            }}
            onResponseUpdate={handleResponseUpdate}
            onToggleProcess={() => {
              setIsProcessOpen(!isProcessOpen);
              setIsGraphOpen(false);
              setIsMemoryOpen(false);
            }}
            isProcessOpen={isProcessOpen}
            onToggleGraph={() => {
              setIsGraphOpen(!isGraphOpen);
              setIsProcessOpen(false);
              setIsMemoryOpen(false);
            }}
            isGraphOpen={isGraphOpen}
            onToggleMemory={() => {
              setIsMemoryOpen(!isMemoryOpen);
              setIsProcessOpen(false);
              setIsGraphOpen(false);
            }}
            isMemoryOpen={isMemoryOpen}
            activeOutcome={lastOutcome}
          />
        </div>
      </main>

      {/* Small Slide-over Process Panel */}
      {isProcessOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsProcessOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] z-10 bg-[#08080c]/98 backdrop-blur-2xl border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            aria-label="TrueForge Agent Process Telemetry"
          >
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
              onClose={() => setIsProcessOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Small Slide-over Graph Panel */}
      {isGraphOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsGraphOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 w-full sm:w-[560px] md:w-[680px] z-10 bg-[#08080c]/98 backdrop-blur-2xl border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            aria-label="FalkorDB Graph Topology"
          >
            <div className="p-3.5 border-b border-border bg-surface/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Network size={15} className="text-cyan-400" />
                <h3 className="text-xs font-semibold text-zinc-100 font-mono uppercase tracking-wider">
                  FalkorDB Topology ({graphData.nodes.length} nodes · {graphData.edges.length} edges)
                </h3>
              </div>
              <button
                onClick={() => setIsGraphOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-surface transition-colors cursor-pointer"
                title="Close panel"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 min-h-0 relative">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-bg/50 text-xs font-mono text-zinc-400 gap-2">
                  <span className="size-2 rounded-full bg-accent animate-ping" />
                  <span>Hydrating FalkorDB topology...</span>
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
            </div>
          </aside>
        </div>
      )}

      {/* Small Slide-over Memory Panel */}
      {isMemoryOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsMemoryOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] z-10 bg-[#08080c]/98 backdrop-blur-2xl border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            aria-label="Agent Shared Memory"
          >
            <MemoryTab
              onSelectNode={(nodeId: string) => {
                setHighlightHops([nodeId]);
                handleOpenSource(nodeId);
              }}
              refreshTrigger={memoryRefreshTrigger}
              onClose={() => setIsMemoryOpen(false)}
            />
          </aside>
        </div>
      )}

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
