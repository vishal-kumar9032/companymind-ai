"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Network, FileText, ShieldAlert, Users, Compass, ArrowRight } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: string) => void;
  onSelectSource: (sourceId: string) => void;
}

interface CommandItem {
  title: string;
  type: "query" | "source";
  icon: React.ComponentType<{ className?: string }>;
  query?: string;
  sourceId?: string;
}

interface CommandGroup {
  category: string;
  items: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, onSelectQuery, onSelectSource }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const items: CommandGroup[] = [
    {
      category: "Suggested Graph Queries",
      items: [
        { title: "What services break if auth-v1 is shut down?", type: "query", icon: Network, query: "What services break if auth-v1 is shut down?" },
        { title: "Audit PR #214 for architecture violations", type: "query", icon: ShieldAlert, query: "Audit PR #214 for architecture and meeting decision violations" },
        { title: "Why did we decide to use mTLS for identity-service?", type: "query", icon: Compass, query: "Why did we decide to use mTLS for identity-service?" },
        { title: "Who owns payments-api and who are the subject matter experts?", type: "query", icon: Users, query: "Who owns payments-api and who are the subject matter experts?" },
      ],
    },
    {
      category: "Documents & RFCs",
      items: [
        { title: "RFC-102: Auth v1 Sunset & Gateway Migration", type: "source", sourceId: "RFC-102", icon: FileText },
        { title: "DEC-44: Mandatory Deprecation of Auth-v1", type: "source", sourceId: "DEC-44", icon: ShieldAlert },
        { title: "Q3 Global Architecture Review Meeting", type: "source", sourceId: "Q3-MEETING", icon: Compass },
      ],
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = items.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 gap-3 bg-zinc-900/50">
          <Search className="size-4 text-zinc-400 shrink-0" />
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
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching questions or documents found.
            </div>
          ) : (
            filteredItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
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
                          }
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="size-4 text-falkor-400 shrink-0" />
                          <span className="text-xs truncate">{item.title}</span>
                        </div>
                        <ArrowRight className="size-3.5 text-zinc-600 group-hover:text-falkor-400 transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Press ESC to close</span>
          <span>FalkorDB Company Brain</span>
        </div>
      </div>
    </div>
  );
}
