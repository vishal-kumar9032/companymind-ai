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
  ChevronDown,
  Filter,
  RotateCcw,
} from "lucide-react";
import {
  FindingItem,
  initialFindings,
  INITIAL_FINDINGS,
  SEVERITY_FILTERS,
  SeverityFilter,
} from "@/lib/memoryLedgerData";
import { AVAILABLE_MODELS } from "@/lib/truefoundry";
import { EnterpriseUser } from "@/lib/firebase";
import { authHeaders } from "@/lib/clientAuth";

export type { FindingItem, SeverityFilter };
export { SEVERITY_FILTERS };

export interface HeaderBadgeItem {
  label: string;
  count?: number | string;
  variant?: "default" | "success" | "warning" | "danger" | "rose" | "indigo" | "purple";
}

export interface MemoryTabFooterStatus {
  engine?: string;
  syncState?: string;
  isSynced?: boolean;
  itemCount?: number;
  lastSyncTime?: string;
}

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
  headerBadges?: HeaderBadgeItem[];
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  availableModels?: Array<{ id: string; name: string; provider?: string }>;
  severityFilters?: readonly string[] | string[];
  initialFindingsData?: FindingItem[];
  footerStatus?: MemoryTabFooterStatus;
  currentUser?: EnterpriseUser | null;
  isPersonalAccount?: boolean;
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
  headerBadges,
  selectedModel = "google-gemini/gemini-3.1-flash-lite",
  onSelectModel,
  availableModels = AVAILABLE_MODELS,
  severityFilters = SEVERITY_FILTERS,
  initialFindingsData,
  footerStatus,
  currentUser,
  isPersonalAccount,
}: MemoryTabProps) {
  const isPersonal =
    isPersonalAccount ??
    Boolean(currentUser?.isFirebaseAuthenticated && currentUser?.uid !== "workspace-member");

  // Dynamically initialize findings state
  const [findings, setFindings] = useState<FindingItem[]>(
    isPersonal ? [] : (initialFindingsData || initialFindings)
  );
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>(selectedModel);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  // Form states for recording finding
  const [newTarget, setNewTarget] = useState(isPersonal ? "" : "postgres-primary");
  const [newText, setNewText] = useState("");
  const [newSeverity, setNewSeverity] = useState<string>("CRITICAL");
  const [newAgent, setNewAgent] = useState("PolicyWatchdog");
  const [newSessionId, setNewSessionId] = useState("manual-input");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize internal currentModel with selectedModel prop
  useEffect(() => {
    if (selectedModel) {
      setCurrentModel(selectedModel);
    }
  }, [selectedModel]);

  const handleModelChange = (newModelId: string) => {
    setCurrentModel(newModelId);
    onSelectModel?.(newModelId);
  };

  const activeModelObj =
    availableModels.find((m) => m.id === currentModel) ||
    availableModels.find((m) => m.id === selectedModel) ||
    availableModels[0] || { id: "google-gemini/gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite" };

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/findings", { headers });
      const data = await res.json();
      if (data.findings && Array.isArray(data.findings) && data.findings.length > 0) {
        const rawList = data.findings;

        const mapped: FindingItem[] = rawList.map((f: any) => ({
          id: f.id || `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          severity: f.severity || "MEDIUM",
          agent: f.agent || "PolicyWatchdog",
          timestamp: f.created_at || f.at || new Date().toISOString(),
          message: f.text || f.message || "",
          service: f.target_name || f.service || (isPersonal ? "service" : "postgres-primary"),
          sessionId: f.session_id || f.sessionId || "session-1",
          text: f.text || f.message || "",
          created_at: f.created_at || f.at || new Date().toISOString(),
          target_name: f.target_name || f.service || (isPersonal ? "service" : "postgres-primary"),
          target_type: f.target_type || "service",
        }));
        setFindings(mapped);
      } else {
        setFindings([]);
      }
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.error("Failed to fetch findings from FalkorDB:", err);
      setFindings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [refreshTrigger, isPersonal]);

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

  const handleTriggerRecordModal = () => {
    setIsRecordModalOpen(true);
    onTriggerRecordModal?.();
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const createdItem: FindingItem = {
      id: `finding-${Date.now()}`,
      severity: newSeverity,
      agent: newAgent,
      timestamp: new Date().toISOString(),
      message: newText.trim(),
      service: newTarget.trim(),
      sessionId: newSessionId.trim() || "manual-input",
      text: newText.trim(),
      created_at: new Date().toISOString(),
      target_name: newTarget.trim(),
      target_type: "service",
    };

    try {
      const authHead = await authHeaders();
      const res = await fetch("/api/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHead },
        body: JSON.stringify({
          targetName: newTarget.trim(),
          text: newText.trim(),
          severity: newSeverity,
          sessionId:
            newSessionId.trim() ||
            (isPersonal ? `personal-${currentUser?.uid || "session"}` : "manual-input"),
        }),
      });

      if (res.ok) {
        setFindings((prev) => [createdItem, ...prev]);
        setNewText("");
        setIsRecordModalOpen(false);
      } else {
        // Optimistic local fallback
        setFindings((prev) => [createdItem, ...prev]);
        setNewText("");
        setIsRecordModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to add finding to FalkorDB:", err);
      setFindings((prev) => [createdItem, ...prev]);
      setNewText("");
      setIsRecordModalOpen(false);
    } finally {
      setIsSubmitting(false);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "CRITICAL":
        return (
          <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
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
    <div className="flex flex-col h-full bg-[#090d16] overflow-hidden text-slate-200 rounded-2xl border border-slate-800 shadow-sm">
      {/* Toast Alert when a finding is recalled */}
      {recalledFindingToast && (
        <div className="p-3 bg-indigo-950/60 border-b border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200 font-mono animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span>
              <strong>Recalled finding from memory:</strong> "{recalledFindingToast}"
            </span>
          </div>
          <button
            type="button"
            onClick={onClearToast}
            className="text-2xs text-indigo-400 hover:text-indigo-200 transition-colors cursor-pointer font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with dynamic badges, dynamic model selector, and interactive actions */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Brain size={15} strokeWidth={1.75} className="text-purple-400 shrink-0" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
            {isPersonal ? "Personal Memory Ledger" : headerTitle}
          </h2>

          {/* Dynamic Header Badges */}
          <span className="text-3xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shadow-xs">
            {headerBadge || (isPersonal ? `${findings.length} personal findings` : `${findings.length} findings`)}
          </span>

          {filterSeverity !== "ALL" && (
            <span className="text-3xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shadow-xs">
              {filtered.length} matching
            </span>
          )}

          {headerBadges?.map((b, idx) => (
            <span
              key={idx}
              className={`text-3xs font-mono px-2 py-0.5 rounded border shadow-xs ${
                b.variant === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : b.variant === "warning"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : b.variant === "danger" || b.variant === "rose"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-slate-900 text-slate-300 border-slate-800"
              }`}
            >
              {b.label}
              {b.count !== undefined ? `: ${b.count}` : ""}
            </span>
          ))}

          {/* Dynamic Model Selector: Binds to currentModel/selectedModel state & props */}
          <div className="relative hidden sm:inline-flex items-center">
            <select
              value={currentModel}
              onChange={(e) => handleModelChange(e.target.value)}
              aria-label="Active Model Selector"
              className="appearance-none bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-700/80 text-3xs font-mono rounded-full pl-6 pr-6 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors shadow-2xs font-medium"
              title="Switch Active AI Engine Model"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <Cpu size={10} className="text-indigo-400 absolute left-2 pointer-events-none" />
            <ChevronDown size={10} className="text-indigo-400/70 absolute right-2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Functional Trigger Record Modal */}
          <button
            type="button"
            onClick={handleTriggerRecordModal}
            className="flex items-center gap-1 text-2xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-xs"
            title="Record new architecture or policy finding"
          >
            <Plus size={11} />
            <span>Record</span>
          </button>
          <button
            type="button"
            onClick={fetchFindings}
            disabled={loading}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh memory store from FalkorDB"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close panel"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Record Finding Modal Dialog */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsRecordModalOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Record Finding to Shared Memory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddFinding} className="space-y-4">
              <div>
                <label className="text-2xs font-mono font-medium text-slate-400 block mb-1">
                  Target Service or Component
                </label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder={
                    isPersonal
                      ? "Name of a service, project or document"
                      : "e.g. postgres-primary, auth-v1, payments-api"
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-3xs text-slate-500 font-mono">Quick:</span>
                  {(isPersonal
                    ? []
                    : ["postgres-primary", "auth-v1", "payments-api", "identity-service"]
                  ).map((svc) => (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => setNewTarget(svc)}
                      className="text-3xs font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 cursor-pointer transition-colors"
                    >
                      {svc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs font-mono font-medium text-slate-400 block mb-1">
                    Severity Level
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs font-mono font-medium text-slate-400 block mb-1">
                    Reporting Agent
                  </label>
                  <select
                    value={newAgent}
                    onChange={(e) => setNewAgent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="PolicyWatchdog">PolicyWatchdog</option>
                    <option value="ArchitectureOracle">ArchitectureOracle</option>
                    <option value="IncidentMemory">IncidentMemory</option>
                    <option value="OwnershipGraph">OwnershipGraph</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-2xs font-mono font-medium text-slate-400 block mb-1">
                  Observation / Rule Summary
                </label>
                <textarea
                  rows={3}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Describe the governance violation, performance anomaly, or architecture rule..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? "Persisting to FalkorDB..." : "Save to Memory Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar: dynamically mapped severity filters */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search
            size={12}
            className="absolute left-2.5 top-2.5 text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search findings, services, agents..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-2xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Severity Filters dynamically rendered by mapping over severityFilters */}
        <div className="flex items-center gap-1 text-2xs font-mono flex-wrap">
          {severityFilters.map((sev) => {
            const isSelected = filterSeverity === sev;
            const count =
              sev === "ALL"
                ? findings.length
                : findings.filter((f) => (f.severity || "").toUpperCase() === sev).length;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => handleFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold shadow-2xs"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <span>{sev}</span>
                <span
                  className={`text-3xs px-1 rounded-full font-sans ${
                    isSelected ? "bg-indigo-500/30 text-indigo-200" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#090d16]">
        {loading && findings.length === 0 ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-slate-800 rounded" />
                  <div className="h-3 w-16 bg-slate-800 rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-800 rounded" />
                  <div className="h-3 w-3/4 bg-slate-800 rounded" />
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                  <div className="h-3 w-16 bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          findings.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xs space-y-3">
              <div className="size-12 rounded-2xl bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xs">
                <Brain size={24} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-white">
                  {isPersonal
                    ? "Personal Episodic Memory Clean"
                    : "No Memory Findings Recorded Yet"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isPersonal
                    ? "Welcome to your personal workspace. All demo memory findings have been removed. As you interact with AI agents or record manual findings, your cross-session memory will populate here."
                    : "FalkorDB stores episodic findings and governance reviews across sessions. Record your first architecture observation or policy finding."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleTriggerRecordModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Record First Finding</span>
              </button>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2.5">
              <Brain size={28} className="stroke-1 opacity-40 text-purple-400" />
              <p className="text-xs text-slate-300 font-medium">No findings match your active filter.</p>
              <button
                type="button"
                onClick={() => {
                  setFilterSeverity("ALL");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1 text-2xs font-mono text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition-colors cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset search & filters</span>
              </button>
            </div>
          )
        ) : (
          filtered.map((item) => {
            const serviceName = item.service || item.target_name || "postgres-primary";
            const displayText = item.message || item.text || "";
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 transition-all space-y-2.5 shadow-sm"
              >
                {/* Finding Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFilterSeverity((item.severity || "MEDIUM").toUpperCase())}
                      className="cursor-pointer transition-transform hover:scale-105"
                      title={`Filter by ${item.severity} severity`}
                    >
                      {getSeverityBadge(item.severity)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery(item.agent || "")}
                      className="text-2xs font-mono text-slate-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                      title={`Search findings by agent ${item.agent}`}
                    >
                      {item.agent || "PolicyWatchdog"}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-3xs font-mono text-slate-500">
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
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {displayText}
                </p>

                {/* Target Node & Interactive Handlers */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-2xs font-mono flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-slate-400 flex-wrap">
                    <span>Attached:</span>
                    {/* Functional service tag click handler */}
                    <button
                      type="button"
                      onClick={() => handleServiceClick(serviceName)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer font-medium"
                      title={`Inspect ${serviceName} topology in graph canvas`}
                    >
                      {getTargetIcon(item.target_type)}
                      <span>{serviceName}</span>
                      <ExternalLink size={10} className="opacity-60" />
                    </button>

                    {/* Functional blast radius analyzer trigger */}
                    <button
                      type="button"
                      onClick={() => handleBlastRadiusClick(serviceName)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 transition-colors cursor-pointer font-medium shadow-2xs hover:shadow-xs"
                      title={`Calculate 4-hop blast radius for ${serviceName}`}
                    >
                      <Sparkles size={10} className="text-violet-400" />
                      <span>Blast Radius</span>
                    </button>
                  </div>

                  <span className="text-3xs text-slate-500 font-mono">
                    {item.sessionId || item.session_id || "session-1"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Footer Status: adapts to props, loading, and connection state */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-2xs font-mono text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span>{footerStatus?.engine || "FalkorDB Institutional Graph Memory"}</span>
          <span className="text-slate-700">·</span>
          <span className="text-3xs text-slate-500">
            {footerStatus?.itemCount !== undefined
              ? `${footerStatus.itemCount} findings`
              : `${findings.length} findings synced`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {footerStatus?.lastSyncTime || lastSyncedAt ? (
            <span className="text-3xs text-slate-500 hidden sm:inline">
              Synced {footerStatus?.lastSyncTime || lastSyncedAt}
            </span>
          ) : null}
          <span
            className={`flex items-center gap-1 font-medium ${
              footerStatus?.isSynced !== false && !loading ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {footerStatus?.isSynced !== false && !loading ? (
              <CheckCircle2 size={11} className="text-emerald-400" />
            ) : (
              <Clock size={11} className="text-amber-400" />
            )}
            <span>
              {footerStatus?.syncState || (loading ? "Syncing memory..." : "Synced across Sessions")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
