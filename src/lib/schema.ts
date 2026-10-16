export interface GraphNode {
  id: string;
  label: string;
  name: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ToolTrace {
  tool: string;
  args: Record<string, any>;
  durationMs: number;
  resultCount: number;
  cypher: string;
  path?: string[];
}

export interface AgentResponse {
  answer: string;
  outcome: "answered_with_path" | "answered_from_memory" | "not_in_graph" | "unknown_entity" | "governance_violation";
  hops?: string[];
  traces: ToolTrace[];
  highlightNodeIds?: string[];
}
