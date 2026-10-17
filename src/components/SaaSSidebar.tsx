"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Network,
  Cpu,
  Brain,
  FileText,
  Search,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  BarChart2,
  Lock,
  LogOut,
  Building2,
  CheckCircle2,
  ExternalLink,
  Layers,
  Database,
  Activity,
  Zap,
} from "lucide-react";
import { TenantConfig, TENANTS } from "@/lib/tenants";
import { EnterpriseUser } from "@/lib/firebase";

export type SaaSView =
  | "dashboard"
  | "chat"
  | "graph"
  | "agents"
  | "memory"
  | "registry";

interface SaaSSidebarProps {
  currentView: SaaSView;
  onSelectView: (view: SaaSView) => void;
  currentTenant: TenantConfig;
  onSelectTenant: (tenant: TenantConfig) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
  onOpenAnalytics: () => void;
  onGoToLanding?: () => void;
  currentUser: EnterpriseUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  latencyMs?: number;
  nodeCount: number;
  edgeCount: number;
  activeAgent?: {
    name: string;
    role: string;
  };
  hasPolicyAlert?: boolean;
}

export function SaaSSidebar({
  currentView,
  onSelectView,
  currentTenant,
  onSelectTenant,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  onOpenAnalytics,
  onGoToLanding,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  latencyMs = 2,
  nodeCount,
  edgeCount,
  activeAgent,
  hasPolicyAlert = true,
}: SaaSSidebarProps) {
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);

  const navGroups = [
    {
      group: "Workspace",
      items: [
        {
          id: "dashboard" as SaaSView,
          label: "Intelligence Hub",
          icon: LayoutDashboard,
          badge: null,
          description: "KPIs, silos & health score",
        },
        {
          id: "chat" as SaaSView,
          label: "Ask AI & Oracle",
          icon: MessageSquare,
          badge: "Active",
          description: "Multi-agent knowledge synthesis",
        },
        {
          id: "graph" as SaaSView,
          label: "Knowledge Graph",
          icon: Network,
          badge: `${nodeCount} nodes`,
          description: "FalkorDB topology canvas",
        },
      ],
    },
    {
      group: "Governance & Operations",
      items: [
        {
          id: "agents" as SaaSView,
          label: "Agent Workforce",
          icon: Cpu,
          badge: "5 Active",
          description: "MCP tools & PR governance",
          alert: hasPolicyAlert,
        },
        {
          id: "memory" as SaaSView,
          label: "Episodic Memory",
          icon: Brain,
          badge: null,
          description: "Cross-session shared findings",
        },
        {
          id: "registry" as SaaSView,
          label: "Document Catalog",
          icon: FileText,
          badge: "24 items",
          description: "RFCs, PRs & Architecture specs",
        },
      ],
    },
  ];

  return (
    <aside
      className={`h-screen bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none transition-all duration-200 z-30 ${
        isCollapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* 1. Header: Brand + Tenant Selector */}
      <div className="flex flex-col border-b border-slate-200/80">
        {/* Brand Bar */}
        <div className="h-14 px-3.5 flex items-center justify-between gap-2">
          <button
            onClick={onGoToLanding}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
            title="Return to CompanyMind Public Portal"
          >
            <div className="size-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Brain size={18} strokeWidth={2} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    CompanyMind
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold uppercase">
                    Harness
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium truncate">
                  FalkorDB Graph Engine
                </span>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Tenant Organization Switcher */}
        {!isCollapsed ? (
          <div className="px-3 pb-3 relative">
            <button
              onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                  {currentTenant.name.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                    {currentTenant.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {currentTenant.badge}
                  </span>
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${
                  tenantDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Tenant Dropdown Menu */}
            {tenantDropdownOpen && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Select Organization
                </div>
                {TENANTS.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => {
                      onSelectTenant(tenant);
                      setTenantDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      currentTenant.id === tenant.id
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs truncate">{tenant.name}</span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {tenant.domain}
                      </span>
                    </div>
                    {currentTenant.id === tenant.id && (
                      <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center pb-2 pt-1">
            <button
              onClick={onToggleCollapse}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-600 flex items-center justify-center font-bold text-xs cursor-pointer border border-slate-200"
              title={`Active: ${currentTenant.name} (Click to expand)`}
            >
              {currentTenant.name.charAt(0)}
            </button>
          </div>
        )}
      </div>

      {/* 2. Middle Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {/* Quick Search Button */}
        {!isCollapsed ? (
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 text-slate-500 hover:text-slate-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-slate-400 group-hover:text-indigo-600" />
              <span className="text-xs font-medium">Quick search...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-xs">
              ⌘K
            </kbd>
          </button>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onOpenCommandPalette}
              className="size-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 flex items-center justify-center cursor-pointer transition-colors"
              title="Quick Search (⌘K)"
            >
              <Search size={16} />
            </button>
          </div>
        )}

        {/* Navigation Groups */}
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                {group.group}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer relative group ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      size={17}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="text-xs truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              isActive
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.alert && (
                          <span className="size-2 rounded-full bg-rose-500 ring-2 ring-rose-200 animate-pulse" />
                        )}
                      </div>
                    )}
                    {isCollapsed && item.alert && (
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* System & Analytics Navigation */}
        <div className="space-y-1 pt-1 border-t border-slate-100">
          {!isCollapsed && (
            <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Insights & Health
            </div>
          )}
          <button
            onClick={onOpenAnalytics}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer group"
            title={isCollapsed ? "Knowledge Gaps & Silo Audit" : undefined}
          >
            <BarChart2
              size={17}
              className="text-slate-400 group-hover:text-indigo-600 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="text-xs truncate">Silo & Gap Analytics</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Audit
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 3. Footer: System Health + User Profile */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 space-y-2.5">
        {/* System Connection Live Indicator */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-800 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FalkorDB Online</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 font-semibold">
              {latencyMs}ms
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title={`FalkorDB Online (${latencyMs}ms)`}>
            <span className="size-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          </div>
        )}

        {/* User Profile Card */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            {currentUser ? (
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="size-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Lock size={13} className="text-indigo-400" />
                <span>Enterprise Sign In</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            {currentUser ? (
              <button
                onClick={onSignOut}
                className="size-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs"
                title={`${currentUser.displayName} (${currentUser.role}) - Click to sign out`}
              >
                {currentUser.displayName.charAt(0)}
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center cursor-pointer"
                title="Enterprise Sign In"
              >
                <Lock size={14} />
              </button>
            )}
          </div>
        )}

        {/* Expand Sidebar trigger when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center pt-1">
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
