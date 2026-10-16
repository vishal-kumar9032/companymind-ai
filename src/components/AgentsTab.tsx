"use client";

import React, { useState, useEffect } from "react";
import {
  AgentEvent,
  AgentRole,
  getAgentRunner,
  ApprovalPayload,
} from "@/lib/agentEvents";
import { ToolTrace } from "@/lib/schema";
import {
  ShieldAlert,
  Bot,
  Terminal,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Lock,
  Radio,
  X,
} from "lucide-react";

interface AgentsTabProps {
  traces?: ToolTrace[];
  lastQuery?: string;
  outcome?: string;
  sessionId?: string;
  onSelectNode?: (nodeId: string) => void;
  onFindingSaved?: () => void;
  onClose?: () => void;
  gatewayStatus?: {
    provider: string;
    status: "online" | "fallback_active";
    reason?: string;
    fallbackEngine?: string;
    model?: string;
  };
}

export function AgentsTab({
  traces = [],
  lastQuery = "Audit PR #214 for architecture and meeting decision violations",
  outcome = "governance_violation",
  sessionId = "session-1",
  onSelectNode,
  onFindingSaved,
  onClose,
  gatewayStatus,
}: AgentsTabProps) {
  const runner = getAgentRunner();
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [expandedJsonId, setExpandedJsonId] = useState<string | null>(null);
  const [resolvingApprovalId, setResolvingApprovalId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize or re-run events when traces change
  useEffect(() => {
    const generated = runner.createSessionEvents(lastQuery, traces, outcome, sessionId);
    setEvents(generated);
  }, [traces, lastQuery, outcome, sessionId]);

  const handleRunPipeline = () => {
    setIsRunning(true);
    setEvents([]);
    const generated = runner.createSessionEvents(lastQuery, traces, outcome, sessionId);

    // Progressive animation of events appearing
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < generated.length) {
        const item = generated[idx];
        setEvents((prev) => [...prev, item]);
        idx++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 280);
  };

  const handleResolveApproval = async (
    approval: ApprovalPayload,
    decision: "allowed" | "denied"
  ) => {
    setResolvingApprovalId(approval.id);

    try {
      // Record finding to FalkorDB
      await fetch("/api/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetName: approval.target.split("/")[0].trim() || "auth-v1",
          text: `[${decision.toUpperCase()}] ${approval.action}: ${approval.reason}`,
          severity: approval.riskLevel,
          sessionId,
        }),
      });

      // Update event state in timeline
      setEvents((prev) =>
        prev.map((e) => {
          if (e.approvalData && e.approvalData.id === approval.id) {
            return {
              ...e,
              approvalData: {
                ...e.approvalData,
                status: decision,
              },
            };
          }
          return e;
        })
      );

      onFindingSaved?.();
    } catch (err) {
      console.error("Failed to store finding upon approval resolution:", err);
    } finally {
      setResolvingApprovalId(null);
    }
  };

  const getRoleBadge = (role: AgentRole) => {
    switch (role) {
      case "PolicyWatchdog":
      case "Watchdog":
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
            <ShieldAlert size={10} />
            PolicyWatchdog
          </span>
        );
      case "BlastRadiusMapper":
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
            <Radio size={10} />
            BlastRadiusMapper
          </span>
        );
      case "OwnershipGraph":
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            <CheckCircle2 size={10} />
            OwnershipGraph
          </span>
        );
      case "IncidentMemory":
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-semibold">
            <Sparkles size={10} />
            IncidentMemory
          </span>
        );
      case "Ingestor":
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
            <Terminal size={10} />
            Ingestor
          </span>
        );
      case "ArchitectureOracle":
      case "Oracle":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
            <Sparkles size={10} />
            ArchitectureOracle
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden text-slate-800">
      {/* Header Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={15} strokeWidth={1.75} className="text-indigo-600" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
            Process Telemetry
          </h2>
          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
            <Radio size={9} className="animate-pulse" />
            Live TrueForge Harness
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-3xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
            {sessionId}
          </span>
          <button
            onClick={handleRunPipeline}
            disabled={isRunning}
            className="flex items-center gap-1 text-2xs font-mono px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            title="Execute live agent autonomous loop"
          >
            {isRunning ? (
              <RotateCcw size={11} className="animate-spin" />
            ) : (
              <Play size={11} />
            )}
            <span>{isRunning ? "Running..." : "Run Pipeline"}</span>
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

      {/* Enterprise MCP Tools & Multi-Agent Architecture Overview */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2.5 shrink-0 text-xs shadow-xs">
        {/* Gateway & Fallback Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 font-mono text-2xs">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800">Autonomous Agent Harness:</span>
            <span className="text-slate-600">Online</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-2xs">
            {gatewayStatus?.status === "fallback_active" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>AI Gateway: Fallback Engine Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Enterprise AI Gateway: Online</span>
              </span>
            )}
          </div>
        </div>

        {/* Registered Enterprise MCP Tools */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-3xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
            <span>Registered Enterprise MCP Tools (5)</span>
            <span className="text-indigo-600 font-medium">Zero-Shot OpenCypher</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { name: "service_blast_radius", desc: "Downstream call dependencies" },
              { name: "trace_decision_provenance", desc: "RFC, meeting & sign-off trace" },
              { name: "audit_pr_governance", desc: "PR compliance interceptor" },
              { name: "find_subject_matter_experts", desc: "SME & authorship ranker" },
              { name: "recall_agent_findings", desc: "Episodic cross-session memory" },
            ].map((tool) => (
              <span
                key={tool.name}
                className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700"
                title={`${tool.name}: ${tool.desc}`}
              >
                <span className="size-1 rounded-full bg-indigo-500" />
                <span>{tool.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Coordinated Multi-Agent Roster */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-3xs font-mono text-slate-500">
          <span className="uppercase font-semibold text-slate-400">Roster:</span>
          <span className="text-rose-700 font-medium">🛡️ PolicyWatchdog</span>
          <span>·</span>
          <span className="text-indigo-700 font-medium">🔮 ArchitectureOracle</span>
          <span>·</span>
          <span className="text-sky-700 font-medium">💥 BlastRadiusMapper</span>
          <span>·</span>
          <span className="text-purple-700 font-medium">🧠 IncidentMemory</span>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
        {events.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <Bot size={28} className="stroke-1 opacity-40 text-indigo-500" />
            <p className="text-xs">No active agent run recorded for this session.</p>
            <button
              onClick={handleRunPipeline}
              className="text-xs font-mono text-indigo-600 hover:underline cursor-pointer font-medium"
            >
              Execute live autonomous workflow
            </button>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 ml-3.5 space-y-6">
            {events.map((evt) => {
              const isExpanded = expandedJsonId === evt.id;

              return (
                <div key={evt.id} className="relative pl-6 group">
                  {/* Timeline Dot Indicator */}
                  <div
                    className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full border ${
                      evt.type === "approval_requested"
                        ? "bg-rose-500 border-rose-300 ring-4 ring-rose-100 animate-pulse"
                        : evt.type === "done"
                        ? "bg-emerald-500 border-emerald-300"
                        : evt.type === "tool_call" || evt.type === "tool_result"
                        ? "bg-indigo-500 border-indigo-300"
                        : "bg-slate-400 border-slate-300"
                    }`}
                  />

                  {/* Card Body */}
                  <div className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all space-y-2">
                    {/* Event Header */}
                    <div className="flex items-center justify-between text-2xs font-mono">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(evt.agentRole)}
                        <span className="text-slate-500 capitalize">
                          {evt.type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock size={11} />
                        <span>
                          {new Date(evt.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        {evt.durationMs !== undefined && (
                          <span className="text-emerald-600 font-semibold ml-1">
                            {evt.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step Name / Tool Details */}
                    {evt.stepName && (
                      <div className="text-xs font-semibold text-slate-900">
                        {evt.stepName}
                      </div>
                    )}

                    {evt.toolName && (
                      <div className="text-xs font-mono text-slate-700 flex items-center justify-between">
                        <span className="text-indigo-600 font-semibold">
                          {evt.toolName}()
                        </span>
                        {evt.resultSummary && (
                          <span className="text-2xs text-slate-500">
                            {evt.resultSummary}
                          </span>
                        )}
                      </div>
                    )}

                    {evt.argsSummary && (
                      <div className="text-2xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate">
                        args: {evt.argsSummary}
                      </div>
                    )}

                    {/* Prominent Approval Card */}
                    {evt.type === "approval_requested" && evt.approvalData && (
                      <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-mono text-rose-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Lock size={12} />
                            Human-in-the-Loop Approval Required
                          </span>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-rose-200 text-rose-900 border border-rose-300 font-bold">
                            {evt.approvalData.riskLevel} RISK
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-800">
                          <div>
                            <span className="text-slate-500 font-mono text-2xs uppercase">Action: </span>
                            <span className="font-semibold text-slate-900">
                              {evt.approvalData.action}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-mono text-2xs uppercase">Target: </span>
                            <button
                              onClick={() => onSelectNode?.(evt.approvalData?.target.split("/")[0].trim() || "auth-v1")}
                              className="text-indigo-600 hover:underline font-mono text-2xs cursor-pointer font-medium"
                            >
                              {evt.approvalData.target}
                            </button>
                          </div>
                          <div>
                            <span className="text-slate-500 font-mono text-2xs uppercase">Rationale: </span>
                            <span className="text-slate-700 italic">
                              "{evt.approvalData.reason}"
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-rose-200">
                          {evt.approvalData.status !== "pending" ? (
                            <div
                              className={`py-1.5 px-3 rounded-lg text-2xs font-mono flex items-center gap-2 ${
                                evt.approvalData.status === "allowed"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-rose-100 text-rose-800 border border-rose-300"
                              }`}
                            >
                              <CheckCircle2 size={13} />
                              <span>
                                Resolution:{" "}
                                <strong className="uppercase">
                                  {evt.approvalData.status}
                                </strong>{" "}
                                • Synced to FalkorDB Memory
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleResolveApproval(evt.approvalData!, "allowed")
                                }
                                disabled={resolvingApprovalId === evt.approvalData.id}
                                className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
                              >
                                <CheckCircle2 size={13} />
                                <span>Allow & Store Finding</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleResolveApproval(evt.approvalData!, "denied")
                                }
                                disabled={resolvingApprovalId === evt.approvalData.id}
                                className="flex-1 py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <AlertCircle size={13} />
                                <span>Deny Action</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON Expandable View */}
                    {evt.rawJson && (
                      <div className="pt-1">
                        <button
                          onClick={() =>
                            setExpandedJsonId(isExpanded ? null : evt.id)
                          }
                          className="flex items-center gap-1 text-3xs font-mono text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown size={11} />
                          ) : (
                            <ChevronRight size={11} />
                          )}
                          <span>{isExpanded ? "Hide Telemetry JSON" : "Expand Telemetry JSON"}</span>
                        </button>
                        {isExpanded && (
                          <pre className="mt-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-3xs font-mono text-slate-200 overflow-x-auto max-h-40 shadow-inner">
                            {JSON.stringify(evt.rawJson, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
