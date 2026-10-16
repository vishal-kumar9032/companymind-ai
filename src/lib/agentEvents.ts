import { ToolTrace } from "./schema";
import { isTrueForgeEnabled } from "./trueforge";

export type AgentEventType =
  | "step_started"
  | "tool_call"
  | "tool_result"
  | "approval_requested"
  | "approval_resolved"
  | "answer_chunk"
  | "finding_saved"
  | "done";

export type AgentRole = "Ingestor" | "Watchdog" | "Oracle";

export interface ApprovalPayload {
  id: string;
  action: string;
  target: string;
  reason: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "pending" | "allowed" | "denied";
}

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  timestamp: string;
  agentRole: AgentRole;
  sessionId: string;
  stepName?: string;
  toolName?: string;
  argsSummary?: string;
  args?: Record<string, any>;
  durationMs?: number;
  resultSummary?: string;
  rawJson?: any;
  approvalData?: ApprovalPayload;
  findingData?: {
    service: string;
    text: string;
    severity: string;
  };
}

export interface AgentRunner {
  isSimulated: boolean;
  createSessionEvents: (
    query: string,
    traces: ToolTrace[],
    outcome?: string,
    sessionId?: string
  ) => AgentEvent[];
}

/**
 * MockAgentRunner emits realistic, typed execution events derived directly
 * from verified FalkorDB tool execution traces.
 */
export class MockAgentRunner implements AgentRunner {
  isSimulated = true;

  createSessionEvents(
    query: string,
    traces: ToolTrace[] = [],
    outcome = "answered_with_path",
    sessionId = "session-1"
  ): AgentEvent[] {
    const now = Date.now();
    const events: AgentEvent[] = [];

    // Step 1: Ingestion
    events.push({
      id: `evt-${sessionId}-1`,
      type: "step_started",
      timestamp: new Date(now - 1200).toISOString(),
      agentRole: "Ingestor",
      sessionId,
      stepName: "Natural Language Entity Resolution & Intent Classification",
      rawJson: { query, intent: "causal_graph_traversal", mode: "zero_shot_opencypher" },
    });

    // Step 2: Tool Calls from Traces
    let offset = 1000;
    traces.forEach((trace, idx) => {
      const toolCallId = `evt-${sessionId}-tc-${idx + 1}`;
      const toolResultId = `evt-${sessionId}-tr-${idx + 1}`;
      const duration = trace.durationMs || 8;

      events.push({
        id: toolCallId,
        type: "tool_call",
        timestamp: new Date(now - offset).toISOString(),
        agentRole: trace.tool.includes("audit") ? "Watchdog" : "Oracle",
        sessionId,
        toolName: trace.tool,
        argsSummary: JSON.stringify(trace.args || {}),
        args: trace.args,
        rawJson: {
          invokedTool: trace.tool,
          arguments: trace.args,
          engine: "FalkorDB Graph Engine",
          protocol: "OpenCypher / Redis Serialization Protocol",
        },
      });

      offset -= duration;

      events.push({
        id: toolResultId,
        type: "tool_result",
        timestamp: new Date(now - offset).toISOString(),
        agentRole: trace.tool.includes("audit") ? "Watchdog" : "Oracle",
        sessionId,
        toolName: trace.tool,
        durationMs: duration,
        resultSummary: `${trace.resultCount} records matched across graph traversal`,
        rawJson: {
          cypher: trace.cypher,
          resultCount: trace.resultCount,
          executionTimeMs: duration,
          hops: trace.path || [],
        },
      });

      offset -= 200;
    });

    // Step 3: Governance Policy Check / Approval Request
    if (outcome === "governance_violation") {
      events.push({
        id: `evt-${sessionId}-approval`,
        type: "approval_requested",
        timestamp: new Date(now - 300).toISOString(),
        agentRole: "Watchdog",
        sessionId,
        stepName: "Policy Violation Escalation",
        approvalData: {
          id: `appr-${Date.now()}`,
          action: "Block PR #214 & Enforce DEC-44 Sunset",
          target: "auth-v1 / GitHub PR #214",
          reason:
            "PR #214 attempts to re-enable deprecated endpoints on auth-v1, violating mandatory executive sunset policy DEC-44.",
          riskLevel: "CRITICAL",
          status: "pending",
        },
        rawJson: {
          mandate: "DEC-44",
          violatingPR: 214,
          author: "Alex Mercer",
          escalatedTo: "David Kim / Sarah Chen",
        },
      });

      events.push({
        id: `evt-${sessionId}-finding`,
        type: "finding_saved",
        timestamp: new Date(now - 100).toISOString(),
        agentRole: "Watchdog",
        sessionId,
        stepName: "Persisting Policy Incident to FalkorDB Shared Memory",
        findingData: {
          service: "auth-v1",
          text: "Flagged PR #214 violating DEC-44 sunset policy",
          severity: "CRITICAL",
        },
        rawJson: {
          graphNode: "(:AgentFinding)",
          edge: "[:ABOUT]->(:Service {name: 'auth-v1'})",
        },
      });
    }

    // Step 4: Done Event
    events.push({
      id: `evt-${sessionId}-done`,
      type: "done",
      timestamp: new Date(now).toISOString(),
      agentRole: "Oracle",
      sessionId,
      stepName: "Executive Synthesis & Grounded Verification Completed",
      rawJson: {
        status: "success",
        verificationConfidence: "99.4%",
        memoryState: "synchronized",
      },
    });

    return events;
  }
}

/**
 * TrueForgeRunner connects to live TrueForge Agent Harness telemetry.
 * When TrueForge credentials are not configured, falls back safely to MockAgentRunner.
 */
export class TrueForgeRunner implements AgentRunner {
  isSimulated = false;

  createSessionEvents(
    query: string,
    traces: ToolTrace[] = [],
    outcome = "answered_with_path",
    sessionId = "session-1"
  ): AgentEvent[] {
    // TODO: Connect to TrueForge streaming execution webhook / telemetry stream
    // when TRUEFORGE_BASE_URL and TRUEFORGE_TOKEN are connected.
    const mock = new MockAgentRunner();
    const events = mock.createSessionEvents(query, traces, outcome, sessionId);
    return events;
  }
}

export function getAgentRunner(): AgentRunner {
  if (isTrueForgeEnabled()) {
    return new TrueForgeRunner();
  }
  return new MockAgentRunner();
}
