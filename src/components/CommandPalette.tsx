"use client";

import { PERSONAL_HERO_PROMPTS } from "@/lib/examples";
import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Network,
  FileText,
  ShieldAlert,
  Users,
  Compass,
  ArrowRight,
  Activity,
  Brain,
  BarChart2,
  Server,
  GitPullRequest,
} from "lucide-react";
import { GraphData } from "@/lib/schema";

interface CommandPaletteProps {
  personal?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: string) => void;
  onSelectSource: (sourceId: string) => void;
  onOpenProcess?: () => void;
  onOpenGraph?: () => void;
  onOpenMemory?: () => void;
  onOpenAnalytics?: () => void;
  graphData?: GraphData;
}

interface CommandItem {
  title: string;
  type: "query" | "source" | "action";
  icon: React.ComponentType<{ className?: string }>;
  query?: string;
  sourceId?: string;
  action?: () => void;
}

interface CommandGroup {
  category: string;
  items: CommandItem[];
}

export function CommandPalette({
  personal = false,
  isOpen,
  onClose,
  onSelectQuery,
  onSelectSource,
  onOpenProcess,
  onOpenGraph,
  onOpenMemory,
  onOpenAnalytics,
  graphData,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const graphServices = graphData?.nodes?.filter((n) => n.label === "Service") || [];
  const graphDocs = graphData?.nodes?.filter((n) =>
    ["Doc", "Decision", "Meeting"].includes(n.label)
  ) || [];
  const graphPRs = graphData?.nodes?.filter((n) => n.label === "GitHubPR") || [];

  const items: CommandGroup[] = [
    {
      category: "System Panels & Tools",
      items: [
        ...(onOpenGraph
          ? [
              {
                title: "Open FalkorDB Graph Topology Inspector",
                type: "action" as const,
                icon: Network,
                action: onOpenGraph,
              },
            ]
          : []),
        ...(onOpenProcess
          ? [
              {
                title: "Open Agent Workforce Telemetry & MCP Timeline",
                type: "action" as const,
                icon: Activity,
                action: onOpenProcess,
              },
            ]
          : []),
        ...(onOpenMemory
          ? [
              {
                title: "Open Cross-Session Memory Ledger & Findings",
                type: "action" as const,
                icon: Brain,
                action: onOpenMemory,
              },
            ]
          : []),
        ...(onOpenAnalytics
          ? [
              {
                title: "Open Knowledge Gaps & Graph Analytics Modal",
                type: "action" as const,
                icon: BarChart2,
                action: onOpenAnalytics,
              },
            ]
          : []),
      ],
    },
    {
      category: "Suggested Graph Queries",
      items: [
        ...(personal
          ? PERSONAL_HERO_PROMPTS.map((q) => ({ title: q, type: "query" as const, icon: Network, query: q }))
          : []),
        ...(graphServices.length > 0
          ? [
              {
                title: `What services break if ${graphServices[0].name} is shut down?`,
                type: "query" as const,
                icon: Network,
                query: `What services break if ${graphServices[0].name} is shut down?`,
              },
            ]
          : personal ? [] : [
              {
                title: "What services break if auth-v1 is shut down?",
                type: "query" as const,
                icon: Network,
                query: "What services break if auth-v1 is shut down?",
              },
            ]),
        ...(graphPRs.length > 0
          ? [
              {
                title: `Audit ${graphPRs[0].name} for architecture violations`,
                type: "query" as const,
                icon: ShieldAlert,
                query: `Audit ${graphPRs[0].name} for architecture and meeting decision violations`,
              },
            ]
          : personal ? [] : [
              {
                title: "Audit PR #214 for architecture violations",
                type: "query" as const,
                icon: ShieldAlert,
                query: "Audit PR #214 for architecture and meeting decision violations",
              },
            ]),
        ...(personal
          ? []
          : [
              {
                title: "Why did we decide to use mTLS for identity-service?",
                type: "query" as const,
                icon: Compass,
                query: "Why did we decide to use mTLS for identity-service?",
              },
            ]),
        ...(graphServices.length > 1
          ? [
              {
                title: `Who owns ${graphServices[1].name} and who are the subject matter experts?`,
                type: "query" as const,
                icon: Users,
                query: `Who owns ${graphServices[1].name} and who are the subject matter experts?`,
              },
            ]
          : personal ? [] : [
              {
                title: "Who owns payments-api and who are the subject matter experts?",
                type: "query" as const,
                icon: Users,
                query: "Who owns payments-api and who are the subject matter experts?",
              },
            ]),
      ],
    },
    ...(graphServices.length > 0
      ? [
          {
            category: "Enterprise Services",
            items: graphServices.slice(0, 8).map((svc) => ({
              title: `${svc.name} (${svc.properties?.tier ? `Tier ${svc.properties.tier}` : "Service"})`,
              type: "source" as const,
              sourceId: svc.id,
              icon: Server,
            })),
          },
        ]
      : []),
    {
      category: "Documents & RFCs",
      items:
        graphDocs.length > 0
          ? graphDocs.slice(0, 8).map((doc) => ({
              title: doc.name || doc.id,
              type: "source" as const,
              sourceId: doc.id,
              icon:
                doc.label === "Decision"
                  ? ShieldAlert
                  : doc.label === "Meeting"
                  ? Compass
                  : FileText,
            }))
          : personal ? [] : [
              {
                title: "RFC-102: Auth v1 Sunset & Gateway Migration",
                type: "source" as const,
                sourceId: "RFC-102",
                icon: FileText,
              },
              {
                title: "DEC-44: Mandatory Deprecation of Auth-v1",
                type: "source" as const,
                sourceId: "DEC-44",
                icon: ShieldAlert,
              },
              {
                title: "Q3 Global Architecture Review Meeting",
                type: "source" as const,
                sourceId: "Q3-MEETING",
                icon: Compass,
              },
            ],
    },
    ...(graphPRs.length > 0
      ? [
          {
            category: "Pull Requests",
            items: graphPRs.slice(0, 5).map((pr) => ({
              title: `${pr.name} - ${pr.properties?.title || "PR Audit"}`,
              type: "source" as const,
              sourceId: pr.id,
              icon: GitPullRequest,
            })),
          },
        ]
      : []),
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = items
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 text-slate-200">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3 bg-slate-950/80">
          <Search className="size-4 text-indigo-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, question, or document name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No matching commands, questions, or documents found.
            </div>
          ) : (
            filteredItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="px-3 text-3xs font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                  {group.category}
                </span>
                <div className="space-y-0.5">
                  {group.items.map((item, iIdx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={iIdx}
                        onClick={() => {
                          if (item.type === "query" && item.query) {
                            onSelectQuery(item.query);
                          } else if (item.type === "source" && item.sourceId) {
                            onSelectSource(item.sourceId);
                          } else if (item.type === "action" && item.action) {
                            item.action();
                          }
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="size-4 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="text-xs truncate font-medium">{item.title}</span>
                        </div>
                        <ArrowRight className="size-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-3xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400">ESC</kbd> to close</span>
          </div>
          <span>FalkorDB Company Brain</span>
        </div>
      </div>
    </div>
  );
}
