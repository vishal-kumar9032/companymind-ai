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
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Building2,
  Tag,
} from "lucide-react";
import { GraphData } from "@/lib/schema";

interface RegistryTabProps {
  graphData: GraphData;
  onQueryService: (serviceName: string) => void;
  onAuditPR: (prNum: number) => void;
  onOpenSource?: (sourceId: string) => void;
}

export function RegistryTab({
  graphData,
  onQueryService,
  onAuditPR,
  onOpenSource,
}: RegistryTabProps) {
  const [filter, setFilter] = useState<
    "all" | "services" | "decisions" | "docs" | "meetings" | "prs"
  >("all");
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
  const filteredDecisions = decisions.filter(
    (d) =>
      (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.properties?.title || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredDocs = docs.filter((doc) =>
    (doc.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredMeetings = meetings.filter((m) =>
    (m.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredPrs = prs.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Stats */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Server size={13} />
            <span>FalkorDB Synchronized Knowledge Catalog</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Enterprise Document & Asset Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Unified registry of institutional assets synchronized across Google Workspace RFCs, executive architecture review meetings, GitHub PRs, and microservice definitions.
          </p>
        </div>

        {/* Quick Counts Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[70px]">
            <span className="block text-base font-bold text-slate-900">{services.length}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Services</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[70px]">
            <span className="block text-base font-bold text-indigo-600">{decisions.length}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">ADRs</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[70px]">
            <span className="block text-base font-bold text-emerald-600">{docs.length}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">RFCs</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[70px]">
            <span className="block text-base font-bold text-cyan-600">{prs.length}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">PRs</span>
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search catalog by name, title, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === "all"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Assets
          </button>
          <button
            onClick={() => setFilter("services")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === "services"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setFilter("decisions")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === "decisions"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Decisions ({decisions.length})
          </button>
          <button
            onClick={() => setFilter("docs")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === "docs"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            RFCs ({docs.length})
          </button>
          <button
            onClick={() => setFilter("prs")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === "prs"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            PRs ({prs.length})
          </button>
        </div>
      </div>

      {/* 3. Services Grid */}
      {(filter === "all" || filter === "services") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Production Microservices ({filteredServices.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredServices.map((s) => {
              const isDeprecated = (s.properties?.tier || "").includes("Deprecated");
              return (
                <div
                  key={s.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          isDeprecated
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {s.properties?.tier || "Tier 1"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {s.properties?.description ||
                        "Production service indexed in the FalkorDB topology."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      {s.properties?.protocol || "gRPC / HTTPS"}
                    </span>
                    <button
                      onClick={() => onQueryService(s.name)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <span>Analyze Blast Radius</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Architectural Decisions Grid */}
      {(filter === "all" || filter === "decisions") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-rose-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Governing Architectural Decisions ({filteredDecisions.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredDecisions.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-rose-200 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {d.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    {d.properties?.status || "Active Policy"}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900">{d.properties?.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "{d.properties?.rationale || "Mandated executive architectural policy."}"
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Sign-off: {d.properties?.date || d.properties?.created_at || "Recorded in Knowledge Graph"}</span>
                  <button
                    onClick={() => onOpenSource?.(d.name)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    View Policy Proof →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. RFC Specifications */}
      {(filter === "all" || filter === "docs") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Google Workspace RFC Specifications ({filteredDocs.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-200 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {doc.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Google Docs RFC
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-slate-900">{doc.properties?.title}</h4>
                <div className="text-xs text-slate-600">
                  Target Service:{" "}
                  <span className="font-mono font-medium text-slate-800">
                    {doc.properties?.targetService || doc.properties?.target || "General Architecture"}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Status: {doc.properties?.status || "Approved"}
                  </span>
                  <button
                    onClick={() => onOpenSource?.(doc.name)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    Inspect Document →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. GitHub Pull Requests */}
      {(filter === "all" || filter === "prs") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <GitPullRequest size={16} className="text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              GitHub Pull Requests ({filteredPrs.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredPrs.map((pr) => {
              const prNum =
                parseInt(pr.name.replace(/\D/g, ""), 10) ||
                (typeof pr.properties?.number === "number" ? pr.properties.number : 214);
              const isViolation =
                (pr.properties?.status || "").toLowerCase().includes("violation") ||
                pr.properties?.blocked === true ||
                pr.name.includes("214");
              return (
                <div
                  key={pr.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-cyan-200 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {pr.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        isViolation
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isViolation ? "Policy Violation" : "Compliant"}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900">
                    {pr.properties?.title || "Pull Request"}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500">
                      Author: {pr.properties?.author || "Platform Engineering"}
                    </span>
                    <button
                      onClick={() => onAuditPR(prNum)}
                      className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer"
                    >
                      Run Governance Audit →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
