"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  ShieldAlert,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  Plus,
  Server,
  FileText,
  GitPullRequest,
  Sparkles,
  X,
} from "lucide-react";

export interface FindingItem {
  id: string;
  text: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  created_at: string;
  session_id: string;
  target_name?: string;
  target_type?: string;
  agent?: string;
}

interface MemoryTabProps {
  onSelectNode?: (nodeId: string) => void;
  recalledFindingToast?: string | null;
  onClearToast?: () => void;
  refreshTrigger?: number;
  onClose?: () => void;
}

export function MemoryTab({
  onSelectNode,
  recalledFindingToast,
  onClearToast,
  refreshTrigger = 0,
  onClose,
}: MemoryTabProps) {
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTarget, setNewTarget] = useState("auth-v1");
  const [newText, setNewText] = useState("");
  const [newSeverity, setNewSeverity] = useState<string>("CRITICAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/findings");
      const data = await res.json();
      if (data.findings && Array.isArray(data.findings)) {
        setFindings(data.findings);
      } else {
        // Fallback default enterprise memory findings
        setFindings([
          {
            id: "find-1",
            text: "PR #214 blocked: Attempts to revive legacy auth-v1 in violation of DEC-44 sunset mandate.",
            severity: "CRITICAL",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            session_id: "session-1",
            target_name: "auth-v1",
            target_type: "Service",
            agent: "GovernanceWatchdog",
          },
          {
            id: "find-2",
            text: "Database pool exhaustion risk: PR #218 requested pool size 50 exceeding DEC-105 VM limits.",
            severity: "HIGH",
            created_at: new Date(Date.now() - 7200000).toISOString(),
            session_id: "session-1",
            target_name: "postgres-primary",
            target_type: "Service",
            agent: "SREWatchdog",
          },
          {
            id: "find-3",
            text: "Cross-service dependency verified: web-checkout depends on api-gateway with HTTPS zero-trust tokens.",
            severity: "LOW",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            session_id: "session-0",
            target_name: "web-checkout",
            target_type: "Service",
            agent: "ArchitectureOracle",
          },
        ]);
      }
    } catch (err) {
      console.warn("Failed to fetch findings, using memory baseline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [refreshTrigger]);

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName: newTarget.trim(),
          text: newText.trim(),
          severity: newSeverity,
          sessionId: "manual-input",
        }),
      });

      if (res.ok) {
        setNewText("");
        setShowAddForm(false);
        fetchFindings();
      }
    } catch (err) {
      console.error("Failed to add finding:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "CRITICAL":
        return (
          <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  const getTargetIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "githubpr":
        return <GitPullRequest size={12} className="text-indigo-600" />;
      case "doc":
        return <FileText size={12} className="text-purple-600" />;
      default:
        return <Server size={12} className="text-blue-600" />;
    }
  };

  const filtered = findings.filter((f) => {
    const matchesSev =
      filterSeverity === "ALL" ||
      (f.severity || "").toUpperCase() === filterSeverity;
    const matchesSearch =
      !searchQuery.trim() ||
      f.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.target_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.agent || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden text-slate-800">
      {/* Toast Alert when a finding is recalled */}
      {recalledFindingToast && (
        <div className="p-3 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between text-xs text-indigo-900 font-mono animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-600" />
            <span>
              <strong>Recalled finding from memory:</strong> "{recalledFindingToast}"
            </span>
          </div>
          <button
            onClick={onClearToast}
            className="text-2xs text-indigo-600 hover:text-indigo-900 transition-colors cursor-pointer font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Brain size={15} strokeWidth={1.75} className="text-purple-600" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
            Memory Ledger
          </h2>
          <span className="text-3xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
            {findings.length} findings
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-2xs font-mono px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={11} />
            <span>Record</span>
          </button>
          <button
            onClick={fetchFindings}
            disabled={loading}
            className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-xs"
            title="Refresh memory store from FalkorDB"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer ml-1"
              title="Close panel"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* New Finding Drawer / Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddFinding}
          className="p-4 border-b border-slate-200 bg-slate-50 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 font-mono text-2xs uppercase">
              Save New Agent Finding to Graph
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-3xs font-mono text-slate-500 block mb-1">
                Target Node
              </label>
              <input
                type="text"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="e.g. auth-v1, payments-api"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-3xs font-mono text-slate-500 block mb-1">
                Severity
              </label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-3xs font-mono text-slate-500 block mb-1">
              Observation / Rule Summary
            </label>
            <textarea
              rows={2}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Describe the governance violation, performance anomaly, or architecture rule..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newText.trim()}
            className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isSubmitting ? "Persisting to FalkorDB..." : "Persist to Agent Memory"}
          </button>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search
            size={12}
            className="absolute left-2.5 top-2.5 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, services, agents..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2.5 py-1 text-2xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 text-2xs font-mono">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                filterSeverity === sev
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
        {filtered.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <Brain size={28} className="stroke-1 opacity-40 text-purple-500" />
            <p className="text-xs">No agent findings match your search filter.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all space-y-2.5 shadow-xs"
            >
              {/* Finding Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(item.severity)}
                  <span className="text-2xs font-mono text-slate-500 font-medium">
                    {item.agent || "PolicyWatchdog"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-3xs font-mono text-slate-400">
                  <Clock size={11} />
                  <span>
                    {new Date(item.created_at || Date.now()).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                </div>
              </div>

              {/* Finding Summary */}
              <p className="text-xs text-slate-800 leading-relaxed font-sans">
                {item.text}
              </p>

              {/* Target Node Chip */}
              {item.target_name && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>Attached to:</span>
                    <button
                      onClick={() => onSelectNode?.(item.target_name!)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer font-medium"
                      title="Focus node in FalkorDB graph canvas"
                    >
                      {getTargetIcon(item.target_type)}
                      <span>{item.target_name}</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </button>
                  </div>

                  <span className="text-3xs text-slate-400 font-mono">
                    {item.session_id || "session-1"}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-2xs font-mono text-slate-500">
        <span>Persistent Epistemic Graph Storage</span>
        <span className="text-emerald-700 flex items-center gap-1 font-medium">
          <CheckCircle2 size={11} />
          Synced across Sessions
        </span>
      </div>
    </div>
  );
}
