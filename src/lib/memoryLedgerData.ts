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

// Real data is dynamically synchronized from FalkorDB via /api/findings.
// Default initial state is cleanly initialized without hardcoded mock records.
export const initialFindings: FindingItem[] = [];

// Backwards compatibility alias
export const INITIAL_FINDINGS = initialFindings;
