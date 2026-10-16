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
}

export function AgentsTab({
  traces = [],
  lastQuery = "Audit PR #214 for architecture and meeting decision violations",
  outcome = "governance_violation",
  sessionId = "session-1",
  onSelectNode,
  onFindingSaved,
  onClose,
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

  const handleSimulateRun = () => {
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
      case "Watchdog":
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30 font-medium">
            <ShieldAlert size={10} />
            Watchdog
          </span>
        );
      case "Ingestor":
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-medium">
            <Terminal size={10} />
            Ingestor
          </span>
        );
      case "Oracle":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-medium">
            <Sparkles size={10} />
            Oracle
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header Bar */}
      <div className="p-3.5 border-b border-border bg-surface/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={15} strokeWidth={1.75} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-100 font-mono">
            Process Telemetry
          </h2>
          {runner.isSimulated ? (
            <span className="text-3xs font-mono px-2 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">
              Simulated
            </span>
          ) : (
            <span className="text-3xs font-mono px-2 py-0.5 rounded bg-success/15 text-success border border-success/30 flex items-center gap-1 font-medium">
              <Radio size={9} className="animate-pulse" />
              Live Harness
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-3xs font-mono text-zinc-400 bg-surface px-2 py-0.5 rounded border border-border">
            {sessionId}
          </span>
          <button
            onClick={handleSimulateRun}
            disabled={isRunning}
            className="flex items-center gap-1 text-2xs font-mono px-2 py-1 rounded bg-accent hover:bg-accent-hover text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Re-run agent autonomous pipeline"
          >
            {isRunning ? (
              <RotateCcw size={11} className="animate-spin" />
            ) : (
              <Play size={11} />
            )}
            <span>{isRunning ? "Running..." : "Run"}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-surface transition-colors cursor-pointer ml-1"
              title="Close panel"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {events.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
            <Bot size={28} className="stroke-1 opacity-40 text-accent" />
            <p className="text-xs">No active agent run recorded for this session.</p>
            <button
              onClick={handleSimulateRun}
              className="text-xs font-mono text-accent hover:underline cursor-pointer"
            >
              Simulate autonomous workflow
            </button>
          </div>
        ) : (
          <div className="relative border-l border-border/80 ml-3.5 space-y-6">
            {events.map((evt) => {
              const isExpanded = expandedJsonId === evt.id;

              return (
                <div key={evt.id} className="relative pl-6 group">
                  {/* Timeline Dot Indicator */}
                  <div
                    className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full border ${
                      evt.type === "approval_requested"
                        ? "bg-danger border-danger/60 ring-4 ring-danger/10 animate-pulse"
                        : evt.type === "done"
                        ? "bg-success border-success/60"
                        : evt.type === "tool_call" || evt.type === "tool_result"
                        ? "bg-accent border-accent/60"
                        : "bg-zinc-500 border-zinc-400"
                    }`}
                  />

                  {/* Card Body */}
                  <div className="p-3 rounded-xl bg-surface/70 hover:bg-surface border border-border transition-all space-y-2">
                    {/* Event Header */}
                    <div className="flex items-center justify-between text-2xs font-mono">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(evt.agentRole)}
                        <span className="text-zinc-400 capitalize">
                          {evt.type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-500">
                        <Clock size={11} />
                        <span>
                          {new Date(evt.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        {evt.durationMs !== undefined && (
                          <span className="text-success ml-1">
                            {evt.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step Name / Tool Details */}
                    {evt.stepName && (
                      <div className="text-xs font-medium text-zinc-200">
                        {evt.stepName}
                      </div>
                    )}

                    {evt.toolName && (
                      <div className="text-xs font-mono text-zinc-300 flex items-center justify-between">
                        <span className="text-accent font-semibold">
                          {evt.toolName}()
                        </span>
                        {evt.resultSummary && (
                          <span className="text-2xs text-zinc-400">
                            {evt.resultSummary}
                          </span>
                        )}
                      </div>
                    )}

                    {evt.argsSummary && (
                      <div className="text-2xs font-mono text-zinc-400 bg-black/40 px-2 py-1 rounded border border-border/50 truncate">
                        args: {evt.argsSummary}
                      </div>
                    )}

                    {/* Prominent Approval Card */}
                    {evt.type === "approval_requested" && evt.approvalData && (
                      <div className="mt-3 p-3.5 rounded-xl bg-danger/10 border border-danger/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-mono text-danger font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Lock size={12} />
                            Human-in-the-Loop Approval Required
                          </span>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-danger/20 text-danger border border-danger/30 font-semibold">
                            {evt.approvalData.riskLevel} RISK
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-zinc-300">
                          <div>
                            <span className="text-zinc-400 font-mono text-2xs uppercase">Action: </span>
                            <span className="font-semibold text-zinc-100">
                              {evt.approvalData.action}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-mono text-2xs uppercase">Target: </span>
                            <button
                              onClick={() => onSelectNode?.(evt.approvalData?.target.split("/")[0].trim() || "auth-v1")}
                              className="text-accent hover:underline font-mono text-2xs cursor-pointer"
                            >
                              {evt.approvalData.target}
                            </button>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-mono text-2xs uppercase">Rationale: </span>
                            <span className="text-zinc-300 italic">
                              "{evt.approvalData.reason}"
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-danger/20">
                          {evt.approvalData.status !== "pending" ? (
                            <div
                              className={`py-1.5 px-3 rounded-lg text-2xs font-mono flex items-center gap-2 ${
                                evt.approvalData.status === "allowed"
                                  ? "bg-success/20 text-success border border-success/40"
                                  : "bg-danger/20 text-danger border border-danger/40"
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
                                className="flex-1 py-1.5 px-3 rounded-lg bg-success hover:bg-success/90 text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} />
                                <span>Allow & Store Finding</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleResolveApproval(evt.approvalData!, "denied")
                                }
                                disabled={resolvingApprovalId === evt.approvalData.id}
                                className="flex-1 py-1.5 px-3 rounded-lg bg-surface hover:bg-surface-hover border border-border text-zinc-300 hover:text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                          className="flex items-center gap-1 text-3xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown size={11} />
                          ) : (
                            <ChevronRight size={11} />
                          )}
                          <span>{isExpanded ? "Hide Telemetry JSON" : "Expand Telemetry JSON"}</span>
                        </button>
                        {isExpanded && (
                          <pre className="mt-1.5 p-2 rounded bg-black/60 border border-border/60 text-3xs font-mono text-zinc-300 overflow-x-auto max-h-40">
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

      {/* Footer Info */}
      <div className="p-3 border-t border-border bg-surface/40 flex items-center justify-between text-2xs font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success inline-block" />
          <span>FalkorDB OpenCypher Pipeline Active</span>
        </div>
        <span>Agent Memory Synced</span>
      </div>
    </div>
  );
}
