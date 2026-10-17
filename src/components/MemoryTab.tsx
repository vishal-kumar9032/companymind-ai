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
  Cpu,
} from "lucide-react";
import {
  FindingItem,
  INITIAL_FINDINGS,
  SEVERITY_FILTERS,
  SeverityFilter,
} from "@/lib/memoryLedgerData";
import { AVAILABLE_MODELS } from "@/lib/truefoundry";

export type { FindingItem, SeverityFilter };
export { SEVERITY_FILTERS };

export interface MemoryTabProps {
  onSelectNode?: (nodeId: string) => void;
  onSelectService?: (serviceName: string) => void;
  onAnalyzeBlastRadius?: (serviceName: string) => void;
  onTriggerRecordModal?: () => void;
  recalledFindingToast?: string | null;
  onClearToast?: () => void;
  refreshTrigger?: number;
  onClose?: () => void;
  headerTitle?: string;
  headerBadge?: string;
  selectedModel?: string;
  footerStatus?: {
    engine?: string;
    syncState?: string;
    isSynced?: boolean;
  };
}

export function MemoryTab({
  onSelectNode,
  onSelectService,
  onAnalyzeBlastRadius,
  onTriggerRecordModal,
  recalledFindingToast,
  onClearToast,
  refreshTrigger = 0,
  onClose,
  headerTitle = "Memory Ledger",
  headerBadge,
  selectedModel = "google-gemini/gemini-3.1-flash-lite",
  footerStatus,
}: MemoryTabProps) {
  const [findings, setFindings] = useState<FindingItem[]>(INITIAL_FINDINGS);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTarget, setNewTarget] = useState("postgres-primary");
  const [newText, setNewText] = useState("");
  const [newSeverity, setNewSeverity] = useState<string>("CRITICAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeModelObj =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/findings");
      const data = await res.json();
      if (data.findings && Array.isArray(data.findings) && data.findings.length > 0) {
        const mapped: FindingItem[] = data.findings.map((f: any) => ({
          id: f.id || `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          severity: f.severity || "MEDIUM",
          agent: f.agent || "PolicyWatchdog",
          timestamp: f.created_at || f.at || new Date().toISOString(),
          message: f.text || f.message || "",
          service: f.target_name || f.service || "postgres-primary",
          sessionId: f.session_id || f.sessionId || "session-1",
          text: f.text || f.message || "",
          created_at: f.created_at || f.at || new Date().toISOString(),
          target_name: f.target_name || f.service || "postgres-primary",
          target_type: f.target_type || "service",
        }));
        setFindings(mapped);
      } else {
        setFindings(INITIAL_FINDINGS);
      }
    } catch (err) {
      console.error("Failed to fetch findings from FalkorDB, retaining dynamic initial state:", err);
      setFindings(INITIAL_FINDINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [refreshTrigger]);

  const handleFilterSeverity = (sev: string) => {
    setFilterSeverity(sev);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleServiceClick = (serviceName: string) => {
    onSelectNode?.(serviceName);
    onSelectService?.(serviceName);
  };

  const handleBlastRadiusClick = (serviceName: string) => {
    onAnalyzeBlastRadius?.(serviceName);
  };

  const handleToggleRecord = () => {
    const nextState = !showAddForm;
    setShowAddForm(nextState);
    if (nextState) {
      onTriggerRecordModal?.();
    }
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const createdItem: FindingItem = {
      id: `finding-${Date.now()}`,
      severity: newSeverity,
      agent: "PolicyWatchdog",
      timestamp: new Date().toISOString(),
      message: newText.trim(),
      service: newTarget.trim(),
      sessionId: "manual-input",
      text: newText.trim(),
      created_at: new Date().toISOString(),
      target_name: newTarget.trim(),
      target_type: "service",
    };

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
        setFindings((prev) => [createdItem, ...prev]);
        setNewText("");
        setShowAddForm(false);
      } else {
        // Optimistic local fallback
        setFindings((prev) => [createdItem, ...prev]);
        setNewText("");
        setShowAddForm(false);
      }
    } catch (err) {
      console.error("Failed to add finding to FalkorDB:", err);
      setFindings((prev) => [createdItem, ...prev]);
      setNewText("");
      setShowAddForm(false);
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
    const itemText = f.message || f.text || "";
    const itemService = f.service || f.target_name || "";
    const itemAgent = f.agent || "";
    const matchesSearch =
      !searchQuery.trim() ||
      itemText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemService.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemAgent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden text-slate-800 rounded-2xl border border-slate-200/90 shadow-sm">
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
            {headerTitle}
          </h2>
          <span className="text-3xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
            {headerBadge || `${findings.length} findings`}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Cpu size={10} className="text-indigo-500" />
            <span>{activeModelObj.name}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleRecord}
            className="flex items-center gap-1 text-2xs font-mono px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
            title="Record new architecture or policy finding"
          >
            <Plus size={11} />
            <span>Record</span>
          </button>
          <button
            onClick={fetchFindings}
            disabled={loading}
            className="p-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-xs"
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
                placeholder="e.g. postgres-primary, auth-v1"
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
            onChange={handleSearchChange}
            placeholder="Search findings, services, agents..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2.5 py-1 text-2xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Severity Filters mapped dynamically */}
        <div className="flex items-center gap-1 text-2xs font-mono">
          {SEVERITY_FILTERS.map((sev) => (
            <button
              key={sev}
              onClick={() => handleFilterSeverity(sev)}
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
          filtered.map((item) => {
            const serviceName = item.service || item.target_name || "postgres-primary";
            const displayText = item.message || item.text || "";
            return (
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
                      {new Date(item.timestamp || item.created_at || Date.now()).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                </div>

                {/* Finding Summary */}
                <p className="text-xs text-slate-800 leading-relaxed font-sans">
                  {displayText}
                </p>

                {/* Target Node & Interactive Handlers */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>Attached:</span>
                    {/* Functional service tag click handler */}
                    <button
                      onClick={() => handleServiceClick(serviceName)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer font-medium"
                      title={`Inspect ${serviceName} topology in graph canvas`}
                    >
                      {getTargetIcon(item.target_type)}
                      <span>{serviceName}</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </button>

                    {/* Functional blast radius analyzer trigger */}
                    {onAnalyzeBlastRadius && (
                      <button
                        onClick={() => handleBlastRadiusClick(serviceName)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-colors cursor-pointer font-medium"
                        title={`Calculate blast radius for ${serviceName}`}
                      >
                        <Sparkles size={10} className="text-violet-600" />
                        <span>Blast Radius</span>
                      </button>
                    )}
                  </div>

                  <span className="text-3xs text-slate-400 font-mono">
                    {item.sessionId || item.session_id || "session-1"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Footer Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-2xs font-mono text-slate-500">
        <span>{footerStatus?.engine || "FalkorDB Institutional Graph Memory"}</span>
        <span
          className={`flex items-center gap-1 font-medium ${
            footerStatus?.isSynced !== false ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {footerStatus?.isSynced !== false ? (
            <CheckCircle2 size={11} className="text-emerald-600" />
          ) : (
            <Clock size={11} className="text-amber-600" />
          )}
          <span>{footerStatus?.syncState || (loading ? "Syncing memory..." : "Synced across Sessions")}</span>
        </span>
      </div>
    </div>
  );
}
