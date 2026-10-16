"use client";

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
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: string) => void;
  onSelectSource: (sourceId: string) => void;
  onOpenProcess?: () => void;
  onOpenGraph?: () => void;
  onOpenMemory?: () => void;
  onOpenAnalytics?: () => void;
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
  isOpen,
  onClose,
  onSelectQuery,
  onSelectSource,
  onOpenProcess,
  onOpenGraph,
  onOpenMemory,
  onOpenAnalytics,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

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
                title: "Open TrueForge Process Telemetry & Agent Timeline",
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
        {
          title: "What services break if auth-v1 is shut down?",
          type: "query",
          icon: Network,
          query: "What services break if auth-v1 is shut down?",
        },
        {
          title: "Audit PR #214 for architecture violations",
          type: "query",
          icon: ShieldAlert,
          query: "Audit PR #214 for architecture and meeting decision violations",
        },
        {
          title: "Why did we decide to use mTLS for identity-service?",
          type: "query",
          icon: Compass,
          query: "Why did we decide to use mTLS for identity-service?",
        },
        {
          title: "Who owns payments-api and who are the subject matter experts?",
          type: "query",
          icon: Users,
          query: "Who owns payments-api and who are the subject matter experts?",
        },
      ],
    },
    {
      category: "Documents & RFCs",
      items: [
        {
          title: "RFC-102: Auth v1 Sunset & Gateway Migration",
          type: "source",
          sourceId: "RFC-102",
          icon: FileText,
        },
        {
          title: "DEC-44: Mandatory Deprecation of Auth-v1",
          type: "source",
          sourceId: "DEC-44",
          icon: ShieldAlert,
        },
        {
          title: "Q3 Global Architecture Review Meeting",
          type: "source",
          sourceId: "Q3-MEETING",
          icon: Compass,
        },
      ],
    },
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
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="w-full max-w-xl bg-[#0f0f16] border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-surface/30">
          <Search className="size-4 text-accent shrink-0" />
          <input
            type="text"
            placeholder="Type a command, question, or document name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              No matching commands, questions, or documents found.
            </div>
          ) : (
            filteredItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="px-3 text-3xs font-mono uppercase tracking-wider text-zinc-500 block">
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
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface text-zinc-300 hover:text-white transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="size-4 text-accent group-hover:scale-110 transition-transform shrink-0" />
                          <span className="text-xs truncate">{item.title}</span>
                        </div>
                        <ArrowRight className="size-3.5 text-zinc-600 group-hover:text-accent transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-surface/20 flex items-center justify-between text-3xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-surface border border-border text-zinc-400">ESC</kbd> to close</span>
          </div>
          <span>FalkorDB Company Brain</span>
        </div>
      </div>
    </div>
  );
}
