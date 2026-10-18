"use client";

import React, { useState, useEffect } from "react";
import { LandingPage } from "@/components/LandingPage";
import { AuthPage } from "@/components/AuthPage";
import { SaaSSidebar, SaaSView } from "@/components/SaaSSidebar";
import { SaaSHeader } from "@/components/SaaSHeader";
import { DashboardView } from "@/components/DashboardView";
import { GraphCanvas } from "@/components/GraphCanvas";
import { AssistantView } from "@/components/AssistantView";
import { ConnectionsView } from "@/components/ConnectionsView";
import { AgentsTab } from "@/components/AgentsTab";
import { MemoryTab } from "@/components/MemoryTab";
import { RegistryTab } from "@/components/RegistryTab";
import { SourceDrawer } from "@/components/SourceDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { AnalyticsModal } from "@/components/AnalyticsModal";
import { AuthModal } from "@/components/AuthModal";
import { GraphData, ToolTrace } from "@/lib/schema";
import { ENTERPRISE_SOURCES, SourceDetail } from "@/lib/sources";
import { PERSONAL_TENANT, TENANTS, TenantConfig } from "@/lib/tenants";
import { primaryQuery } from "@/lib/examples";
import {
  EnterpriseUser,
  DEMO_ENTERPRISE_USERS,
  signOutEnterpriseUser,
  onFirebaseAuthStateChanged,
} from "@/lib/firebase";
import { authHeaders } from "@/lib/clientAuth";

export default function Home() {
  const [appStage, setAppStage] = useState<"landing" | "auth" | "dashboard">("landing");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [currentView, setCurrentView] = useState<SaaSView>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<TenantConfig>(TENANTS[0]);
  const [selectedModel, setSelectedModel] = useState<string>("google-gemini/gemini-3.1-flash-lite");
  const [currentUser, setCurrentUser] = useState<EnterpriseUser | null>(null);

  const isPersonalAccount = Boolean(
    currentUser &&
    currentUser.isFirebaseAuthenticated &&
    currentUser.uid !== "workspace-member"
  );
  const activeTenant = isPersonalAccount ? PERSONAL_TENANT : currentTenant;

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [highlightHops, setHighlightHops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<SourceDetail | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(2);
  const [lastTraces, setLastTraces] = useState<ToolTrace[]>([]);
  const [lastQuery, setLastQuery] = useState("What services break if auth-v1 is shut down?");
  const [lastOutcome, setLastOutcome] = useState("answered_with_path");
  const [memoryRefreshTrigger, setMemoryRefreshTrigger] = useState(0);
  const [findingsCount, setFindingsCount] = useState<number | undefined>(undefined);
  const [gatewayStatus, setGatewayStatus] = useState<any>({
    provider: "Enterprise AI Gateway",
    status: "online",
    reason: "",
    fallbackEngine: "Autonomous FalkorDB Graph Engine",
    model: "google-gemini/gemini-3.1-flash-lite",
  });
  const [activeAgent, setActiveAgent] = useState<any>({
    name: "ArchitectureOracle",
    role: "Enterprise Knowledge & Provenance Orchestrator",
  });

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const headers = await authHeaders();
      const res = await fetch("/api/graph", { headers });
      if (res.ok) {
        const data = await res.json();
        setGraphData({
          nodes: Array.isArray(data.nodes) ? data.nodes : [],
          edges: Array.isArray(data.edges) ? data.edges : [],
        });
      }
    } catch (err) {
      console.error("Failed to load graph data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFindingsCount = async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/findings", { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.findings)) {
          setFindingsCount(data.findings.length);
        }
      }
    } catch (err) {
      console.error("Failed to fetch findings count:", err);
    }
  };

  useEffect(() => {
    fetchFindingsCount();
    fetchGraph();
  }, [currentUser, memoryRefreshTrigger, currentView]);

  useEffect(() => {
    // Hydrate saved user session & URL search parameters
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const stageParam = urlParams.get("stage");
        const saved = localStorage.getItem("companymind_user");

        if (saved) {
          const userObj = JSON.parse(saved);
          setCurrentUser(userObj);
          if (stageParam === "landing") {
            setAppStage("landing");
          } else {
            setAppStage("dashboard");
          }
        } else if (stageParam === "login") {
          setAuthMode("login");
          setAppStage("auth");
        } else if (stageParam === "register") {
          setAuthMode("register");
          setAppStage("auth");
        } else if (stageParam === "dashboard") {
          // If explicitly requesting dashboard, use demo user
          setCurrentUser(DEMO_ENTERPRISE_USERS[0]);
          setAppStage("dashboard");
        } else {
          setAppStage("landing");
        }
      } catch {
        setAppStage("landing");
      }
    }

    // Subscribe to real-time Firebase Auth state changes
    const unsubscribe = onFirebaseAuthStateChanged((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("stage") !== "landing") {
            setAppStage("dashboard");
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Global keyboard shortcuts (⌘K for palette, Esc to close modals, 1-6 for view switching)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (appStage === "dashboard") {
          setIsCommandPaletteOpen((prev) => !prev);
        }
        return;
      }

      // Escape closes open overlays
      if (e.key === "Escape") {
        setActiveSource(null);
        setIsAnalyticsOpen(false);
        setIsCommandPaletteOpen(false);
        setIsAuthModalOpen(false);
        setIsMobileSidebarOpen(false);
        return;
      }

      // Quick numbers 1-6 to switch views in dashboard if not typing in an input
      if (appStage === "dashboard") {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const views: SaaSView[] = [
            "dashboard",
            "chat",
            "graph",
            "agents",
            "memory",
            "registry",
          ];
          const num = parseInt(e.key, 10);
          if (num >= 1 && num <= views.length) {
            setCurrentView(views[num - 1]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [appStage]);

  const handleOpenSource = (sourceId: string) => {
    const src = isPersonalAccount ? undefined : ENTERPRISE_SOURCES[sourceId];
    if (src) {
      setActiveSource(src);
      return;
    }

    const node = graphData.nodes.find(
      (n) =>
        n.id.toLowerCase() === sourceId.toLowerCase() ||
        n.name.toLowerCase() === sourceId.toLowerCase()
    );

    if (node) {
      const connectedEdges = graphData.edges.filter(
        (e) => e.source === node.id || e.target === node.id
      );
      const connectedNodeIds = new Set<string>();
      connectedEdges.forEach((e) => {
        if (e.source !== node.id) connectedNodeIds.add(e.source);
        if (e.target !== node.id) connectedNodeIds.add(e.target);
      });
      const hops = [node.name || node.id, ...Array.from(connectedNodeIds).slice(0, 5)];

      const typeMap: Record<string, SourceDetail["type"]> = {
        Doc: "rfc",
        Decision: "decision",
        Meeting: "meeting",
        GitHubPR: "pr",
        Service: "service",
      };

      const dynamicSource: SourceDetail = {
        id: node.id,
        type: typeMap[node.label] || "service",
        title: node.name || node.id,
        author: node.properties?.owner || node.properties?.author || "Enterprise Graph",
        date: node.properties?.created_at || node.properties?.updated_at || "Active in FalkorDB",
        url: node.properties?.url || node.properties?.repo || "https://falkordb.com",
        badge: `${node.label} • ${node.properties?.tier ? `Tier ${node.properties.tier}` : node.properties?.status || "Verified"}`,
        snippet:
          node.properties?.description ||
          node.properties?.summary ||
          `Active ${node.label} entity registered in ${activeTenant.name} topology. Metadata: ${JSON.stringify(node.properties, null, 2)}`,
        falkorNode: `(:${node.label} {name: '${node.name || node.id}'})`,
        graphHops: hops,
      };

      setActiveSource(dynamicSource);
    }
  };

  const handleSelectQueryAndSwitchToChat = (query: string) => {
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
  };

  const handleSignOut = async () => {
    await signOutEnterpriseUser();
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("companymind_user");
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("stage", "landing");
        window.history.replaceState({}, "", url.pathname + url.search);
      } catch {}
    }
    setAppStage("landing");
  };

  const handleUserAuthenticated = (user: EnterpriseUser) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("companymind_user", JSON.stringify(user));
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("stage");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      } catch {}
    }
    setAppStage("dashboard");
  };

  /* =========================================================================
     STAGE 1: HIGH-CONVERTING COMPANYMIND LANDING PAGE
     ========================================================================= */
  if (appStage === "landing") {
    return (
      <LandingPage
        onGetStarted={() => {
          setAuthMode("register");
          setAppStage("auth");
        }}
        onSignIn={() => {
          setAuthMode("login");
          setAppStage("auth");
        }}
        onExploreDemo={() => {
          const demoUser = DEMO_ENTERPRISE_USERS[0];
          handleUserAuthenticated(demoUser);
        }}
      />
    );
  }

  /* =========================================================================
     STAGE 2: AUTHENTICATION PAGE (LOGIN & REGISTER)
     ========================================================================= */
  if (appStage === "auth") {
    return (
      <AuthPage
        mode={authMode}
        onSuccess={handleUserAuthenticated}
        onBackToLanding={() => setAppStage("landing")}
      />
    );
  }

  /* =========================================================================
     STAGE 3: THE COMPANYMIND AGENT HARNESS DASHBOARD & WORKSPACE
     ========================================================================= */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans select-none antialiased">
      {/* 1. Desktop Enterprise Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full">
        <SaaSSidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          currentTenant={activeTenant}
          onSelectTenant={setCurrentTenant}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          onGoToLanding={() => setAppStage("landing")}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          latencyMs={latencyMs}
          nodeCount={graphData.nodes.length}
          edgeCount={graphData.edges.length}
          catalogCount={
            isPersonalAccount
              ? 0
              : graphData.nodes.filter((n) =>
                  ["Service", "Decision", "Doc", "Meeting", "GitHubPR"].includes(n.label)
                ).length
          }
          findingsCount={findingsCount}
          activeAgent={activeAgent}
          hasPolicyAlert={lastOutcome === "governance_violation"}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-[280px] max-w-[85vw] h-full bg-slate-950 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <SaaSSidebar
              currentView={currentView}
              onSelectView={(v) => {
                setCurrentView(v);
                setIsMobileSidebarOpen(false);
              }}
              currentTenant={activeTenant}
              onSelectTenant={setCurrentTenant}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              onOpenCommandPalette={() => {
                setIsMobileSidebarOpen(false);
                setIsCommandPaletteOpen(true);
              }}
              onOpenAnalytics={() => {
                setIsMobileSidebarOpen(false);
                setIsAnalyticsOpen(true);
              }}
              onGoToLanding={() => {
                setIsMobileSidebarOpen(false);
                setAppStage("landing");
              }}
              currentUser={currentUser}
              onOpenAuthModal={() => {
                setIsMobileSidebarOpen(false);
                setIsAuthModalOpen(true);
              }}
              onSignOut={handleSignOut}
              latencyMs={latencyMs}
              nodeCount={graphData.nodes.length}
              edgeCount={graphData.edges.length}
              catalogCount={
                isPersonalAccount
                  ? 0
                  : graphData.nodes.filter((n) =>
                      ["Service", "Decision", "Doc", "Meeting", "GitHubPR"].includes(n.label)
                    ).length
              }
              findingsCount={findingsCount}
              activeAgent={activeAgent}
              hasPolicyAlert={lastOutcome === "governance_violation"}
            />
          </div>
        </div>
      )}

      {/* 2. Main Application Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <SaaSHeader
          currentView={currentView}
          currentTenant={activeTenant}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onRunDemo={() =>
            handleSelectQueryAndSwitchToChat(primaryQuery(isPersonalAccount))
          }
          onRefreshGraph={fetchGraph}
          onGoToLanding={() => setAppStage("landing")}
          activeAgent={activeAgent}
          activeOutcome={lastOutcome}
          gatewayStatus={gatewayStatus}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 min-h-0 relative flex flex-col w-full h-full overflow-hidden bg-[#090d16]">
          {/* VIEW 1: Dashboard / Executive Intelligence Hub */}
          {currentView === "dashboard" && (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
              <DashboardView
                isPersonalAccount={isPersonalAccount}
                currentTenant={activeTenant}
                onSelectTenant={setCurrentTenant}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                currentUser={currentUser}
                onUserChange={setCurrentUser}
                onRunQuery={handleSelectQueryAndSwitchToChat}
                onOpenGraph={() => setCurrentView("graph")}
                onOpenMcp={() => setCurrentView("agents")}
                onOpenMemory={() => setCurrentView("memory")}
                onOpenRegistry={() => setCurrentView("registry")}
                latencyMs={latencyMs}
                nodeCount={graphData.nodes.length}
                edgeCount={graphData.edges.length}
              />
            </div>
          )}

          {/* VIEW 2: Ask AI & Graph Oracle */}
          {currentView === "chat" && (
            <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden relative">
              <AssistantView
                signedIn={Boolean(currentUser?.isFirebaseAuthenticated)}
                personal={isPersonalAccount}
                initialQuery={selectedQuery}
                onInitialQueryUsed={() => setSelectedQuery(null)}
                model={selectedModel}
                onGraphUpdate={() => {
                  fetchGraph();
                  fetchFindingsCount();
                }}
              />
            </div>
          )}

          {/* Connections: Composio-backed per-user accounts */}
          {currentView === "connections" && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ConnectionsView onRequestSignIn={() => setIsAuthModalOpen(true)} />
            </div>
          )}

          {/* VIEW 3: Knowledge Graph Topology Explorer */}
          {currentView === "graph" && (
            <div className="flex-1 min-h-0 relative flex flex-col w-full h-full overflow-hidden">
              <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-2xs">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    FalkorDB Graph Topology Explorer
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Live interactive graph with {graphData.nodes.length} nodes and{" "}
                    {graphData.edges.length} edges across {activeTenant.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isPersonalAccount && (
                    <button
                      onClick={() =>
                        handleSelectQueryAndSwitchToChat(primaryQuery(false))
                      }
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors cursor-pointer"
                    >
                      Analyze auth-v1 Path
                    </button>
                  )}
                  <button
                    onClick={fetchGraph}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Refresh Topology
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative bg-[#090d16]">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-400 gap-2">
                    <span className="size-2 rounded-full bg-indigo-600 animate-ping" />
                    <span>Hydrating FalkorDB graph topology...</span>
                  </div>
                ) : (
                  <GraphCanvas
                    data={graphData}
                    highlightHops={highlightHops}
                    onSelectNode={(nodeId: string) => {
                      handleOpenSource(nodeId);
                    }}
                    onAskAboutNode={handleSelectQueryAndSwitchToChat}
                  />
                )}
              </div>
            </div>
          )}

          {/* VIEW 4: Autonomous Agent Workforce & MCP Studio */}
          {currentView === "agents" && (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
              <div className="max-w-5xl mx-auto">
                <AgentsTab
                  traces={lastTraces}
                  lastQuery={lastQuery}
                  outcome={lastOutcome}
                  sessionId="session-1"
                  onSelectNode={(nodeId) => {
                    setHighlightHops([nodeId]);
                    handleOpenSource(nodeId);
                  }}
                  onFindingSaved={() =>
                    setMemoryRefreshTrigger((prev) => prev + 1)
                  }
                  gatewayStatus={gatewayStatus}
                />
              </div>
            </div>
          )}

          {/* VIEW 5: Institutional Episodic Memory */}
          {currentView === "memory" && (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
              <div className="max-w-5xl mx-auto">
                <MemoryTab
                  onSelectNode={(nodeId: string) => {
                    setHighlightHops([nodeId]);
                    handleOpenSource(nodeId);
                  }}
                  onSelectService={(serviceName: string) => {
                    setHighlightHops([serviceName]);
                    handleOpenSource(serviceName);
                  }}
                  onAnalyzeBlastRadius={(serviceName: string) =>
                    handleSelectQueryAndSwitchToChat(
                      `What services break if ${serviceName} is shut down?`
                    )
                  }
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                  refreshTrigger={memoryRefreshTrigger}
                  currentUser={currentUser}
                  isPersonalAccount={isPersonalAccount}
                  footerStatus={{
                    engine: isPersonalAccount
                      ? "FalkorDB Personal Isolated Memory"
                      : "FalkorDB Institutional Graph Memory",
                    syncState: isPersonalAccount
                      ? "Isolated Personal Session"
                      : "Synced across Sessions",
                    isSynced: true,
                  }}
                />
              </div>
            </div>
          )}

          {/* VIEW 6: Enterprise Document & Asset Catalog */}
          {currentView === "registry" && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <RegistryTab
                graphData={graphData}
                currentUser={currentUser}
                isPersonalAccount={isPersonalAccount}
                onNavigateToConnections={() => setCurrentView("connections")}
                onQueryService={(serviceName) =>
                  handleSelectQueryAndSwitchToChat(
                    `What services break if ${serviceName} is shut down?`
                  )
                }
                onAuditPR={(prNum) =>
                  handleSelectQueryAndSwitchToChat(
                    `Audit PR #${prNum} for architecture and meeting decision violations`
                  )
                }
                onOpenSource={handleOpenSource}
              />
            </div>
          )}
        </main>
      </div>

      {/* Global Slide-in Source Inspector Drawer */}
      <SourceDrawer
        source={activeSource}
        onClose={() => setActiveSource(null)}
        onHighlightGraph={(hops) => {
          setHighlightHops(hops);
          setCurrentView("graph");
        }}
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        personal={isPersonalAccount}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectQuery={handleSelectQueryAndSwitchToChat}
        onSelectSource={handleOpenSource}
        onOpenProcess={() => setCurrentView("agents")}
        onOpenGraph={() => setCurrentView("graph")}
        onOpenMemory={() => setCurrentView("memory")}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        graphData={graphData}
      />

      {/* Analytics & Knowledge Gaps Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        latencyMs={latencyMs}
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.edges.length}
        graphData={graphData}
        onSelectQuery={handleSelectQueryAndSwitchToChat}
      />

      {/* Enterprise Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUserAuthenticated={handleUserAuthenticated}
      />
    </div>
  );
}
