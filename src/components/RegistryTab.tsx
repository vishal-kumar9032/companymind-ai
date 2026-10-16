"use client";

import React, { useState } from "react";
import {
  Server,
  FileText,
  Calendar,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { GraphData } from "@/lib/schema";

interface RegistryTabProps {
  graphData: GraphData;
  onQueryService: (serviceName: string) => void;
  onAuditPR: (prNum: number) => void;
}

export function RegistryTab({ graphData, onQueryService, onAuditPR }: RegistryTabProps) {
  const [filter, setFilter] = useState<"all" | "services" | "decisions" | "docs" | "meetings">("all");
  const [search, setSearch] = useState("");

  // Group nodes by categories
  const services = graphData.nodes.filter((n) => n.label === "Service");
  const decisions = graphData.nodes.filter((n) => n.label === "Decision");
  const docs = graphData.nodes.filter((n) => n.label === "Doc");
  const meetings = graphData.nodes.filter((n) => n.label === "Meeting");
  const prs = graphData.nodes.filter((n) => n.label === "GitHubPR");

  const filteredServices = services.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredDecisions = decisions.filter((d) =>
    (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.properties?.title || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredDocs = docs.filter((doc) =>
    (doc.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredMeetings = meetings.filter((m) =>
    (m.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Enterprise Knowledge Registry</h2>
          <p className="text-xs text-zinc-400">
            Abstracted catalog of unified company assets synchronized across Google Workspace and GitHub into FalkorDB.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === "all" ? "bg-falkor-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Assets
          </button>
          <button
            onClick={() => setFilter("services")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === "services" ? "bg-falkor-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setFilter("decisions")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === "decisions" ? "bg-falkor-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Decisions ({decisions.length})
          </button>
          <button
            onClick={() => setFilter("docs")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === "docs" ? "bg-falkor-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            RFCs ({docs.length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="size-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter assets by name, title, or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-falkor-500 transition-colors"
        />
      </div>

      {/* Services Section */}
      {(filter === "all" || filter === "services") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-300">
            <Server className="size-4 text-purple-400" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Connected Microservices</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredServices.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-200">{s.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        (s.properties?.tier || "").includes("Deprecated")
                          ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {s.properties?.tier || "Tier 1"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                    {s.properties?.description || "Production service linked in graph topology."}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500">
                    Protocol: {s.properties?.protocol || "gRPC / HTTPS"}
                  </span>
                  <button
                    onClick={() => onQueryService(s.name)}
                    className="flex items-center gap-1 text-[11px] font-medium text-falkor-400 hover:text-falkor-300 transition-colors cursor-pointer"
                  >
                    <span>Analyze Blast Radius</span>
                    <ChevronRight className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions Section */}
      {(filter === "all" || filter === "decisions") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-zinc-300">
            <ShieldCheck className="size-4 text-rose-400" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Governing Architectural Decisions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredDecisions.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-falkor-300">{d.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-falkor-500/10 text-falkor-300 border border-falkor-500/30">
                    {d.properties?.status || "Active"}
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-zinc-200">{d.properties?.title}</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                  "{d.properties?.rationale || "Mandated executive policy."}"
                </p>
                <div className="text-[10px] font-mono text-zinc-500 pt-1">
                  Approved on: {d.properties?.date || "2026-08-15"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RFCs & Meetings Section */}
      {(filter === "all" || filter === "docs") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-zinc-300">
            <FileText className="size-4 text-emerald-400" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Google Workspace RFC Specifications</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-300">{doc.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500">Google Docs</span>
                </div>
                <h4 className="font-semibold text-xs text-zinc-200">{doc.properties?.title}</h4>
                <div className="text-[10px] font-mono text-zinc-400">
                  Target Service: <span className="text-zinc-200">{doc.properties?.targetService || "auth-v1"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
