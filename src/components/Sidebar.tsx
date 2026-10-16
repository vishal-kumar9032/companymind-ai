"use client";

import React from "react";
import {
  Database,
  FileText,
  Calendar,
  GitPullRequest,
  MessageSquare,
  Shield,
  Activity,
  UserCheck,
  Search,
  Sparkles,
  ChevronRight,
  HelpCircle,
  BarChart2,
  PlayCircle,
  Command,
} from "lucide-react";

export type UserRole = "eng_lead" | "vp_eng" | "new_hire" | "compliance";

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSelectQuery: (query: string) => void;
  onOpenAnalytics: () => void;
  onOpenCommandPalette: () => void;
  onStartDemoWalkthrough: () => void;
  isGraphView: boolean;
  onToggleGraphView: () => void;
}

export function Sidebar({
  currentRole,
  onRoleChange,
  onSelectQuery,
  onOpenAnalytics,
  onOpenCommandPalette,
  onStartDemoWalkthrough,
  isGraphView,
  onToggleGraphView,
}: SidebarProps) {
  const roles = [
    { id: "new_hire", label: "New Hire Onboarding", icon: UserCheck, desc: "Explains context & documentation" },
    { id: "eng_lead", label: "Engineering Lead", icon: Activity, desc: "Focuses on blast radius & code PRs" },
    { id: "vp_eng", label: "VP of Engineering", icon: Shield, desc: "Focuses on sign-offs & policy risks" },
    { id: "compliance", label: "Compliance & SOC2", icon: FileText, desc: "Monitors policy violations" },
  ];

  const recentTrails = [
    { label: "💥 auth-v1 Outage Blast Radius", query: "What services break if auth-v1 is shut down?" },
    { label: "🚨 Audit PR #214 against DEC-44", query: "Audit PR #214 for architecture violations" },
    { label: "📜 Why mTLS for identity-service?", query: "Why did we decide to use mTLS for identity-service?" },
    { label: "👥 Payments-API SME Knowledge", query: "Who owns payments-api and who are the subject matter experts?" },
  ];

  const connectedSources = [
    { name: "Google Drive (RFCs)", count: "14 docs", status: "Synced", icon: FileText, color: "text-emerald-400" },
    { name: "Google Meet", count: "6 transcripts", status: "Synced", icon: Calendar, color: "text-amber-400" },
    { name: "GitHub Repos & PRs", count: "4 PRs, 8 repos", status: "Synced", icon: GitPullRequest, color: "text-cyan-400" },
    { name: "Slack Channels", count: "#eng-arch, #core", status: "Active", icon: MessageSquare, color: "text-purple-400" },
    { name: "FalkorDB Engine", count: "59 edges", status: "Connected", icon: Database, color: "text-falkor-400" },
  ];

  return (
    <aside className="w-64 sm:w-72 h-full bg-zinc-950/95 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 text-xs">
      {/* Top Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Search & Cmd+K Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-zinc-500" />
            <span className="text-[11px]">Quick search...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60 text-zinc-400">
            <Command className="size-2.5" />
            <span>K</span>
          </div>
        </button>

        {/* 90-Second Walkthrough Card (Requirement #7) */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-falkor-950/60 to-zinc-900 border border-falkor-500/30 space-y-2.5 shadow-lg shadow-falkor-950/20">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-falkor-400 animate-pulse" />
            <span className="font-bold text-zinc-200 text-xs">Judge 90s Demo Story</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Follow Staff Engineer Alex Mercer on day 1 as he investigates auth-v1, inspects RFC-102, and gets caught by the PR Watchdog.
          </p>
          <button
            onClick={onStartDemoWalkthrough}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-falkor-600 hover:bg-falkor-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <PlayCircle className="size-3.5" />
            <span>Play Onboarding Flow</span>
          </button>
        </div>

        {/* Role Selector (Requirement #6: Role-Based Views) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
            <span>Viewing Role:</span>
            <span className="text-falkor-400 font-semibold">{currentRole.replace("_", " ")}</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onRoleChange(r.id as UserRole)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-medium"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
                  }`}
                >
                  <Icon className={`size-3.5 ${isSelected ? "text-falkor-400" : "text-zinc-500"}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] truncate">{r.label}</span>
                    <span className="text-[9px] text-zinc-500 truncate">{r.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Investigation Trails */}
        <div className="space-y-2">
          <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block">
            Investigation Trails:
          </span>
          <div className="space-y-1">
            {recentTrails.map((trail, idx) => (
              <button
                key={idx}
                onClick={() => onSelectQuery(trail.query)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white border border-zinc-800/60 text-left transition-colors cursor-pointer"
              >
                <span className="text-[11px] truncate">{trail.label}</span>
                <ChevronRight className="size-3 text-zinc-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Connected Enterprise Data Sources (Requirement #4) */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
              Connected Brain Sources:
            </span>
            <span className="text-[9px] font-mono text-emerald-400">All Synced</span>
          </div>
          <div className="space-y-1.5">
            {connectedSources.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`size-3.5 ${s.color} shrink-0`} />
                    <span className="text-zinc-300 truncate">{s.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Bar Controls */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between gap-2">
        <button
          onClick={onOpenAnalytics}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium transition-colors cursor-pointer"
        >
          <BarChart2 className="size-3 text-falkor-400" />
          <span>Knowledge Gaps</span>
        </button>

        <button
          onClick={onToggleGraphView}
          className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            isGraphView
              ? "bg-falkor-600/20 text-falkor-300 border-falkor-500/40"
              : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800"
          }`}
          title="Toggle FalkorDB Graph Canvas View"
        >
          <Database className="size-3" />
          <span>Graph</span>
        </button>
      </div>
    </aside>
  );
}
