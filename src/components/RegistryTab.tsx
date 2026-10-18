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
  FolderGit2,
  Plug,
} from "lucide-react";
import { GraphData } from "@/lib/schema";
import { EnterpriseUser } from "@/lib/firebase";

interface RegistryTabProps {
  graphData: GraphData;
  onQueryService: (serviceName: string) => void;
  onAuditPR: (prNum: number) => void;
  onOpenSource?: (sourceId: string) => void;
  currentUser?: EnterpriseUser | null;
  isPersonalAccount?: boolean;
  onNavigateToConnections?: () => void;
}

export function RegistryTab({
  graphData,
  onQueryService,
  onAuditPR,
  onOpenSource,
  currentUser,
  isPersonalAccount,
  onNavigateToConnections,
}: RegistryTabProps) {
  const [filter, setFilter] = useState<
    "all" | "services" | "decisions" | "docs" | "meetings" | "prs"
  >("all");
  const [search, setSearch] = useState("");

  const isPersonal =
    isPersonalAccount ??
    Boolean(currentUser?.isFirebaseAuthenticated && currentUser?.uid !== "workspace-member");

  // Signed-in workspaces only ever contain what the user connected, so nothing is filtered out here.
  const activeNodes = graphData.nodes || [];

  // Group nodes by categories
  const services = activeNodes.filter((n) => n.label === "Service");
  const decisions = activeNodes.filter((n) => n.label === "Decision");
  const docs = activeNodes.filter((n) => n.label === "Doc");
  const meetings = activeNodes.filter((n) => n.label === "Meeting");
  const prs = activeNodes.filter((n) => n.label === "GitHubPR");

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
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Server size={13} />
            <span>{isPersonal ? "Personal Knowledge Catalog" : "FalkorDB Synchronized Knowledge Catalog"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isPersonal ? "Personal Document & Asset Catalog" : "Enterprise Document & Asset Catalog"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isPersonal
              ? "Your isolated personal workspace catalog synchronized with authorized repositories and Google Workspace docs."
              : "Unified registry of institutional assets synchronized across Google Workspace RFCs, executive architecture review meetings, GitHub PRs, and microservice definitions."}
          </p>
        </div>

        {/* Quick Counts Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[70px]">
            <span className="block text-base font-bold text-white">{services.length}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Services</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[70px]">
            <span className="block text-base font-bold text-indigo-400">{decisions.length}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">ADRs</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[70px]">
            <span className="block text-base font-bold text-emerald-400">{docs.length}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">RFCs</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[70px]">
            <span className="block text-base font-bold text-cyan-400">{prs.length}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">PRs</span>
          </div>
        </div>
      </div>

      {/* If personal account with no synced docs or assets */}
      {isPersonal && activeNodes.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 sm:p-14 text-center shadow-sm space-y-4 max-w-2xl mx-auto my-8">
          <div className="size-14 rounded-2xl bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto shadow-xs">
            <FileText size={26} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Personal Catalog Empty
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Welcome, <span className="font-semibold text-slate-200">{currentUser?.displayName || "Personal Account"}</span>. All demo documents, ADRs, and PRs have been cleared for your personal account. Connect your GitHub or Google Workspace in Connections to sync your repositories, RFCs, and architecture specs.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onNavigateToConnections && (
              <button
                type="button"
                onClick={onNavigateToConnections}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plug size={14} />
                <span>Connect Google Workspace &amp; GitHub</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. Search & Category Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search catalog by name, title, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 gap-1 overflow-x-auto">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Assets
              </button>
              <button
                onClick={() => setFilter("services")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "services"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Services ({services.length})
              </button>
              <button
                onClick={() => setFilter("decisions")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "decisions"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Decisions ({decisions.length})
              </button>
              <button
                onClick={() => setFilter("docs")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "docs"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                RFCs ({docs.length})
              </button>
              <button
                onClick={() => setFilter("prs")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter === "prs"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
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
                <Server size={16} className="text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Production Microservices ({filteredServices.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredServices.map((s) => {
                  const isDeprecated = (s.properties?.tier || "").includes("Deprecated");
                  return (
                    <div
                      key={s.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-500/40 hover:bg-slate-850 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {s.name}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                              isDeprecated
                                ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            }`}
                          >
                            {s.properties?.tier || "Tier 1"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {s.properties?.description ||
                            "Production service indexed in the FalkorDB topology."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">
                          {s.properties?.protocol || "gRPC / HTTPS"}
                        </span>
                        <button
                          onClick={() => onQueryService(s.name)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
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
                <ShieldCheck size={16} className="text-rose-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Governing Architectural Decisions ({filteredDecisions.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredDecisions.map((d) => (
                  <div
                    key={d.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-rose-500/40 hover:bg-slate-850 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {d.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                        {d.properties?.status || "Active Policy"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-white">{d.properties?.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 italic bg-slate-950 p-2 rounded-lg border border-slate-800">
                        "{d.properties?.rationale || "Mandated executive architectural policy."}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span>Sign-off: {d.properties?.date || d.properties?.created_at || "Recorded in Knowledge Graph"}</span>
                      <button
                        onClick={() => onOpenSource?.(d.name)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
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
                <FileText size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Google Workspace RFC Specifications ({filteredDocs.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-emerald-500/40 hover:bg-slate-850 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {doc.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                        Google Docs RFC
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-white">{doc.properties?.title}</h4>
                    <div className="text-xs text-slate-400">
                      Target Service:{" "}
                      <span className="font-mono font-medium text-slate-200">
                        {doc.properties?.targetService || doc.properties?.target || "General Architecture"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Status: {doc.properties?.status || "Approved"}
                      </span>
                      <button
                        onClick={() => onOpenSource?.(doc.name)}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
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
                <GitPullRequest size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
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
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-cyan-500/40 hover:bg-slate-850 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {pr.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                            isViolation
                              ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          }`}
                        >
                          {isViolation ? "Policy Violation" : "Compliant"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-white">
                        {pr.properties?.title || "Pull Request"}
                      </h4>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-[10px] text-slate-400">
                          Author: {pr.properties?.author || "Platform Engineering"}
                        </span>
                        <button
                          onClick={() => onAuditPR(prNum)}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
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
        </>
      )}
    </div>
  );
}
