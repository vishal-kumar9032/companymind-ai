"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { DashboardView } from "@/components/DashboardView";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ChatPanel } from "@/components/ChatPanel";
import { AgentsTab } from "@/components/AgentsTab";
import { MemoryTab } from "@/components/MemoryTab";
import { SourceDrawer } from "@/components/SourceDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { AnalyticsModal } from "@/components/AnalyticsModal";
import { GraphData, ToolTrace } from "@/lib/schema";
import { ENTERPRISE_SOURCES, SourceDetail } from "@/lib/sources";
import { TENANTS, TenantConfig } from "@/lib/tenants";
import { EnterpriseUser, DEMO_ENTERPRISE_USERS } from "@/lib/firebase";
import {
  Activity,
  Network,
  Brain,
  X,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const [currentView, setCurrentView] = useState<"dashboard" | "chat">("dashboard");
  const [currentTenant, setCurrentTenant] = useState<TenantConfig>(TENANTS[0]);
  const [selectedModel, setSelectedModel] = useState<string>("groq/qwen-qwen3.8-27b");
  const [currentUser, setCurrentUser] = useState<EnterpriseUser | null>(null);

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [highlightHops, setHighlightHops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<SourceDetail | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(2);
  const [lastTraces, setLastTraces] = useState<ToolTrace[]>([]);
  const [lastQuery, setLastQuery] = useState("What services break if auth-v1 is shut down?");
  const [lastOutcome, setLastOutcome] = useState("answered_with_path");
  const [memoryRefreshTrigger, setMemoryRefreshTrigger] = useState(0);
  const [gatewayStatus, setGatewayStatus] = useState<any>({
    provider: "Enterprise AI Gateway",
    status: "online",
    reason: "",
    fallbackEngine: "Autonomous FalkorDB Graph Engine",
    model: "groq/qwen-qwen3.8-27b",
  });
  const [activeAgent, setActiveAgent] = useState<any>({
    name: "ArchitectureOracle",
    role: "Enterprise Knowledge & Provenance Orchestrator",
  });

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
    // Check saved user in localStorage
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("companymind_user");
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Global keyboard shortcuts (⌘K for palette, Esc to close drawers)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsProcessOpen(false);
        setIsGraphOpen(false);
        setIsMemoryOpen(false);
        setActiveSource(null);
        setIsAnalyticsOpen(false);
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleOpenSource = (sourceId: string) => {
    const src = ENTERPRISE_SOURCES[sourceId];
    if (src) {
      setActiveSource(src);
    }
  };

  const handleSelectQueryFromPalette = (query: string) => {
    setSelectedQuery(query);
    setCurrentView("chat");
  };

  const handleRunQueryFromDashboard = (query: string) => {
    setSelectedQuery(query);
    setCurrentView("chat");
  };

  const handleResponseUpdate = (data: {
    traces: ToolTrace[];
    query: string;
    outcome: string;
    hops: string[];
    latencyMs?: number;
    gatewayStatus?: any;
    agent?: any;
    mcpTools?: any;
  }) => {
    if (data.traces) setLastTraces(data.traces);
    if (data.query) setLastQuery(data.query);
    if (data.outcome) setLastOutcome(data.outcome);
    if (data.latencyMs) setLatencyMs(data.latencyMs);
    if (data.hops) setHighlightHops(data.hops);
    if (data.gatewayStatus) setGatewayStatus(data.gatewayStatus);
    if (data.agent) setActiveAgent(data.agent);

    // If an approval is required, gently offer the process drawer
    if (data.outcome === "governance_violation") {
      setIsProcessOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans select-none">
      {/* Top Navigation Bar with View Switcher, Tenant Switcher & Model Selector */}
      <Navbar
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.edges.length}
        onRefresh={fetchGraph}
        latencyMs={latencyMs}
        currentView={currentView}
        onSelectView={setCurrentView}
        currentTenant={currentTenant}
        onSelectTenant={setCurrentTenant}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          // Trigger demo login if not logged in
          if (!currentUser) {
            const demo = DEMO_ENTERPRISE_USERS[0];
            setCurrentUser(demo);
            if (typeof window !== "undefined") {
              localStorage.setItem("companymind_user", JSON.stringify(demo));
            }
          }
        }}
        isProcessOpen={isProcessOpen}
        onToggleProcess={() => {
          setIsProcessOpen(!isProcessOpen);
          setIsGraphOpen(false);
          setIsMemoryOpen(false);
        }}
        isGraphOpen={isGraphOpen}
        onToggleGraph={() => {
          setIsGraphOpen(!isGraphOpen);
          setIsProcessOpen(false);
          setIsMemoryOpen(false);
        }}
        isMemoryOpen={isMemoryOpen}
        onToggleMemory={() => {
          setIsMemoryOpen(!isMemoryOpen);
          setIsProcessOpen(false);
          setIsGraphOpen(false);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        activeOutcome={lastOutcome}
        gatewayStatus={gatewayStatus}
        agent={activeAgent}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative flex flex-col w-full h-full overflow-hidden">
        {currentView === "dashboard" ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
            <DashboardView
              currentTenant={currentTenant}
              onSelectTenant={setCurrentTenant}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              currentUser={currentUser}
              onUserChange={setCurrentUser}
              onRunQuery={handleRunQueryFromDashboard}
              onOpenSource={setActiveSource}
              onOpenGraph={() => setIsGraphOpen(true)}
              onOpenMcp={() => setIsProcessOpen(true)}
              onOpenMemory={() => setIsMemoryOpen(true)}
            />
          </div>
        ) : (
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
              selectedModel={selectedModel}
              currentTenantId={currentTenant.id}
            />
          </div>
        )}
      </main>

      {/* Small Slide-over Process Panel */}
      {isProcessOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsProcessOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] z-10 bg-white/98 backdrop-blur-2xl border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            aria-label="Agent Workforce Process Telemetry"
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
              gatewayStatus={gatewayStatus}
            />
          </aside>
        </div>
      )}

      {/* Small Slide-over Graph Panel */}
      {isGraphOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsGraphOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 w-full sm:w-[600px] md:w-[720px] z-10 bg-white/98 backdrop-blur-2xl border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            aria-label="FalkorDB Graph Topology"
          >
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Network size={15} className="text-indigo-600" />
                <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
                  FalkorDB Topology ({graphData.nodes.length} nodes · {graphData.edges.length} edges)
                </h3>
              </div>
              <button
                onClick={() => setIsGraphOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close panel"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 min-h-0 relative">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-xs font-mono text-slate-500 gap-2">
                  <span className="size-2 rounded-full bg-indigo-600 animate-ping" />
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
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsMemoryOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] z-10 bg-white/98 backdrop-blur-2xl border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
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
        onOpenProcess={() => {
          setIsProcessOpen(true);
          setIsGraphOpen(false);
          setIsMemoryOpen(false);
        }}
        onOpenGraph={() => {
          setIsGraphOpen(true);
          setIsProcessOpen(false);
          setIsMemoryOpen(false);
        }}
        onOpenMemory={() => {
          setIsMemoryOpen(true);
          setIsProcessOpen(false);
          setIsGraphOpen(false);
        }}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
      />

      {/* Analytics & Knowledge Gaps Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
}
