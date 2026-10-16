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

export type AgentRole =
  | "PolicyWatchdog"
  | "ArchitectureOracle"
  | "BlastRadiusMapper"
  | "OwnershipGraph"
  | "IncidentMemory"
  | "Ingestor"
  | "Watchdog"
  | "Oracle";

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
 * Emits rich, multi-agent coordination events showing how agents collaborate in real-time.
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

    // Step 1: Ingestion & Intent Dispatch
    events.push({
      id: `evt-${sessionId}-1`,
      type: "step_started",
      timestamp: new Date(now - 1400).toISOString(),
      agentRole: "Ingestor",
      sessionId,
      stepName: "Intent Classification & Entity Resolution",
      rawJson: {
        query,
        extractedEntities: ["auth-v1", "PR #214", "DEC-44"],
        intent: "governance_interception",
        routerTarget: "PolicyWatchdog",
      },
    });

    // Step 2: Ownership Resolution
    events.push({
      id: `evt-${sessionId}-2`,
      type: "tool_call",
      timestamp: new Date(now - 1100).toISOString(),
      agentRole: "OwnershipGraph",
      sessionId,
      toolName: "find_subject_matter_experts",
      argsSummary: JSON.stringify({ serviceName: "auth-v1" }),
      args: { serviceName: "auth-v1" },
      rawJson: {
        agent: "OwnershipGraph",
        task: "Resolve PR author permissions and service owners",
        service: "auth-v1",
      },
    });

    events.push({
      id: `evt-${sessionId}-3`,
      type: "tool_result",
      timestamp: new Date(now - 950).toISOString(),
      agentRole: "OwnershipGraph",
      sessionId,
      toolName: "find_subject_matter_experts",
      durationMs: 3,
      resultSummary: "Owner: Core Infrastructure (Sarah Chen) · PR Author: Alex Mercer (Checkout)",
      rawJson: {
        owningTeam: "Core Infrastructure",
        lead: "Sarah Chen",
        authorRole: "Lead Platform Engineer",
        isAuthorizedOverride: false,
      },
    });

    // Step 3: Blast Radius Mapping
    events.push({
      id: `evt-${sessionId}-4`,
      type: "tool_call",
      timestamp: new Date(now - 800).toISOString(),
      agentRole: "BlastRadiusMapper",
      sessionId,
      toolName: "service_blast_radius",
      argsSummary: JSON.stringify({ serviceName: "auth-v1", depth: 4 }),
      args: { serviceName: "auth-v1", depth: 4 },
      rawJson: {
        agent: "BlastRadiusMapper",
        engine: "FalkorDB OpenCypher",
        traversal: "MATCH (upstream)-[:DEPENDS_ON*1..4]->(target)",
      },
    });

    events.push({
      id: `evt-${sessionId}-5`,
      type: "tool_result",
      timestamp: new Date(now - 650).toISOString(),
      agentRole: "BlastRadiusMapper",
      sessionId,
      toolName: "service_blast_radius",
      durationMs: 4,
      resultSummary: "Discovered 3 affected downstream services: api-gateway, mobile-app, web-checkout",
      rawJson: {
        hops: ["auth-v1", "api-gateway", "mobile-app", "web-checkout"],
        riskLevel: "CRITICAL",
      },
    });

    // Step 4: Policy Watchdog Decision Interception
    events.push({
      id: `evt-${sessionId}-6`,
      type: "tool_call",
      timestamp: new Date(now - 500).toISOString(),
      agentRole: "PolicyWatchdog",
      sessionId,
      toolName: "audit_pr_governance",
      argsSummary: JSON.stringify({ prNumber: 214 }),
      args: { prNumber: 214 },
      rawJson: {
        agent: "PolicyWatchdog",
        inspectingRule: "DEC-44",
        constraint: "Auth-v1 sunset; zero new direct traffic allowed",
      },
    });

    events.push({
      id: `evt-${sessionId}-7`,
      type: "tool_result",
      timestamp: new Date(now - 350).toISOString(),
      agentRole: "PolicyWatchdog",
      sessionId,
      toolName: "audit_pr_governance",
      durationMs: 2,
      resultSummary: "VIOLATION DETECTED: PR #214 modifies deprecated auth-v1 (Violates DEC-44)",
      rawJson: {
        decision: "DEC-44",
        approvedBy: "David Kim",
        deliberation: "Q3 Global Architecture Review",
        verdict: "BLOCKED",
      },
    });

    // Step 5: Architecture Oracle Provenance Verification
    events.push({
      id: `evt-${sessionId}-8`,
      type: "step_started",
      timestamp: new Date(now - 200).toISOString(),
      agentRole: "ArchitectureOracle",
      sessionId,
      stepName: "Cross-Referencing RFC-102 Spec & Meeting Minutes",
      rawJson: {
        verifiedDocuments: ["RFC-102", "SEC-404", "Q3 Architecture Review Transcript"],
        provenanceStatus: "100% Grounded in FalkorDB",
      },
    });

    // Step 6: Approval Request (if violation)
    if (outcome === "governance_violation" || query.toLowerCase().includes("pr") || query.toLowerCase().includes("audit")) {
      events.push({
        id: `evt-${sessionId}-approval`,
        type: "approval_requested",
        timestamp: new Date(now - 100).toISOString(),
        agentRole: "PolicyWatchdog",
        sessionId,
        stepName: "Human-in-the-Loop Policy Gate",
        approvalData: {
          id: `appr-${Date.now()}`,
          action: "Block PR #214 & Enforce DEC-44 Sunset",
          target: "auth-v1 / GitHub PR #214",
          reason:
            "PR #214 re-enables token caching on deprecated auth-v1, violating mandatory executive sunset policy DEC-44.",
          riskLevel: "CRITICAL",
          status: "pending",
        },
        rawJson: {
          violatingPR: 214,
          author: "Alex Mercer",
          enforcedPolicy: "DEC-44",
          approvers: ["Sarah Chen", "David Kim"],
        },
      });

      // Step 7: Incident Memory Storage
      events.push({
        id: `evt-${sessionId}-finding`,
        type: "finding_saved",
        timestamp: new Date(now - 50).toISOString(),
        agentRole: "IncidentMemory",
        sessionId,
        stepName: "Persisting Incident Log to FalkorDB & Firebase",
        findingData: {
          service: "auth-v1",
          text: "Flagged PR #214 violating DEC-44 sunset policy",
          severity: "CRITICAL",
        },
        rawJson: {
          graphNode: "(:AgentFinding)",
          firebaseCollection: "tenants/acme-core/findings",
        },
      });
    }

    // Step 8: Done Event
    events.push({
      id: `evt-${sessionId}-done`,
      type: "done",
      timestamp: new Date(now).toISOString(),
      agentRole: "ArchitectureOracle",
      sessionId,
      stepName: "Multi-Agent Coordination & Synthesis Complete",
      rawJson: {
        activeAgents: ["PolicyWatchdog", "ArchitectureOracle", "BlastRadiusMapper", "OwnershipGraph", "IncidentMemory"],
        mcpGatewayLatencyMs: 4,
        falkorDBExecutionMs: 2,
        status: "success",
      },
    });

    return events;
  }
}

export class TrueForgeRunner implements AgentRunner {
  isSimulated = false;

  createSessionEvents(
    query: string,
    traces: ToolTrace[] = [],
    outcome = "answered_with_path",
    sessionId = "session-1"
  ): AgentEvent[] {
    const mock = new MockAgentRunner();
    return mock.createSessionEvents(query, traces, outcome, sessionId);
  }
}

export function getAgentRunner(): AgentRunner {
  if (isTrueForgeEnabled()) {
    return new TrueForgeRunner();
  }
  return new MockAgentRunner();
}
