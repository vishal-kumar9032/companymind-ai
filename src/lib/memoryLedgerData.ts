export interface FindingItem {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  agent: string;
  timestamp: string;
  message: string;
  service: string;
  sessionId: string;
  // Backward compatibility fields
  text?: string;
  created_at?: string;
  session_id?: string;
  target_name?: string;
  target_type?: string;
}

export const SEVERITY_FILTERS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type SeverityFilter = (typeof SEVERITY_FILTERS)[number];

export const initialFindings: FindingItem[] = [
  {
    id: "finding-001",
    severity: "CRITICAL",
    agent: "PolicyWatchdog",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    message: "Flagged PR #214 by Alex Mercer attempting to modify deprecated auth-v1 service, directly violating DEC-44 sunset mandate.",
    service: "auth-v1",
    sessionId: "session-governance-01",
    text: "Flagged PR #214 by Alex Mercer attempting to modify deprecated auth-v1 service, directly violating DEC-44 sunset mandate.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    target_name: "auth-v1",
    target_type: "service",
  },
  {
    id: "finding-002",
    severity: "HIGH",
    agent: "ArchitectureOracle",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    message: "Downstream blast radius traversal reveals payments-api and web-checkout depend on single-point-of-failure database tier postgres-primary.",
    service: "postgres-primary",
    sessionId: "session-topology-02",
    text: "Downstream blast radius traversal reveals payments-api and web-checkout depend on single-point-of-failure database tier postgres-primary.",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    target_name: "postgres-primary",
    target_type: "service",
  },
  {
    id: "finding-003",
    severity: "MEDIUM",
    agent: "IncidentMemory",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    message: "Connection pool exhaustion observed during peak checkout traffic; pool size constrained by DEC-105 to max 10 per instance.",
    service: "payments-api",
    sessionId: "session-audit-03",
    text: "Connection pool exhaustion observed during peak checkout traffic; pool size constrained by DEC-105 to max 10 per instance.",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    target_name: "payments-api",
    target_type: "service",
  },
  {
    id: "finding-004",
    severity: "LOW",
    agent: "OwnershipGraph",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    message: "Discovered unlinked documentation spec: RFC-102 author David Kim verified as primary point-of-contact for identity-service.",
    service: "identity-service",
    sessionId: "session-ownership-04",
    text: "Discovered unlinked documentation spec: RFC-102 author David Kim verified as primary point-of-contact for identity-service.",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    target_name: "identity-service",
    target_type: "service",
  },
];

// Backwards compatibility alias
export const INITIAL_FINDINGS = initialFindings;
