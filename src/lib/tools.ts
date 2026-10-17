import { getGraph } from "./falkordb";
import { GraphData, ToolTrace } from "./schema";

/**
 * Pre-flight entity resolution:
 * Checks if the entity exists in the graph to avoid hallucinations or injection.
 */
export async function resolveEntity(name: string): Promise<string | null> {
  const graph = await getGraph();
  const res = await graph.query("MATCH (n {name: $name}) RETURN n.name AS name LIMIT 1", {
    params: { name },
  });
  if (res.data && res.data.length > 0) {
    return (res.data[0] as any).name;
  }
  return null;
}

/**
 * Tool 1: Trace Decision Provenance
 * Traces why a service is constrained, what RFC proposed it, which meeting approved it, and who signed off.
 */
export async function traceDecisionProvenance(serviceName: string, graphId?: string): Promise<{
  data: any[];
  trace: ToolTrace;
  hops: string[];
}> {
  const start = Date.now();
  const graph = await getGraph(graphId);
  const cypher = `
    MATCH path = (s:Service {name: $serviceName})<-[:GOVERNS]-(d:Decision)<-[:PROPOSES]-(doc:Doc)<-[:RECORDED_IN]-(m:Meeting)
    OPTIONAL MATCH (d)<-[:APPROVED]-(approver:Person)
    RETURN d.id AS decision_id, d.title AS decision_title, d.rationale AS rationale, d.date AS decision_date,
           approver.name AS approved_by, doc.title AS document_title, doc.url AS doc_url, m.title AS meeting_title,
           [n IN nodes(path) | n.name] AS via
  `;

  const res = await graph.query(cypher, { params: { serviceName } });
  const durationMs = Date.now() - start;

  const hops: string[] = [];
  if (res.data && res.data.length > 0) {
    for (const row of res.data as any[]) {
      if (row.via) {
        hops.push(...row.via.filter(Boolean));
      }
    }
  }

  return {
    data: res.data || [],
    trace: {
      tool: "trace_decision_provenance",
      args: { serviceName },
      durationMs,
      resultCount: res.data?.length || 0,
      cypher,
      path: hops,
    },
    hops: Array.from(new Set(hops)),
  };
}

/**
 * Tool 2: Service Blast Radius
 * Calculates variable-depth downstream impact and owning teams if a service fails or is sunset.
 */
export async function serviceBlastRadius(serviceName: string, depth = 4, graphId?: string): Promise<{
  data: any[];
  trace: ToolTrace;
  hops: string[];
}> {
  const start = Date.now();
  const graph = await getGraph(graphId);
  
  // Notice: FalkorDB variable-length pattern with bounded depth
  const cypher = `
    MATCH path = (upstream:Service)-[:DEPENDS_ON*1..${Math.min(depth, 4)}]->(target:Service {name: $serviceName})
    OPTIONAL MATCH (upstream)<-[:OWNS]-(t:Team)
    RETURN DISTINCT upstream.name AS affected_service, length(path) AS hops_count,
           t.name AS owning_team, t.lead AS team_lead,
           [n IN nodes(path) | n.name] AS via
    ORDER BY hops_count ASC, affected_service ASC
  `;

  const res = await graph.query(cypher, { params: { serviceName } });
  const durationMs = Date.now() - start;

  const hops: string[] = [];
  if (res.data) {
    for (const row of res.data as any[]) {
      if (row.via) {
        hops.push(...row.via.filter(Boolean));
      }
    }
  }

  return {
    data: res.data || [],
    trace: {
      tool: "service_blast_radius",
      args: { serviceName, depth },
      durationMs,
      resultCount: res.data?.length || 0,
      cypher,
      path: hops,
    },
    hops: Array.from(new Set(hops)),
  };
}

/**
 * Tool 3: Find Subject Matter Experts
 * Ranks engineers by RFC authorship, team lead status, and PR contributions touching a service.
 */
export async function findSubjectMatterExperts(serviceName: string, graphId?: string): Promise<{
  data: any[];
  trace: ToolTrace;
}> {
  const start = Date.now();
  const graph = await getGraph(graphId);
  const cypher = `
    MATCH (s:Service {name: $serviceName})
    OPTIONAL MATCH (s)<-[:OWNS]-(t:Team)<-[:MEMBER_OF]-(lead:Person {name: t.lead})
    OPTIONAL MATCH (p:Person)-[:AUTHORED]->(doc:Doc)-[:PROPOSES]->(:Decision)-[:GOVERNS]->(s)
    OPTIONAL MATCH (author:Person)-[:AUTHORED_PR]->(pr:GitHubPR)-[:TOUCHES]->(s)
    WITH s, lead, p, author, count(DISTINCT pr) AS pr_count
    RETURN coalesce(p.name, author.name, lead.name) AS expert,
           coalesce(p.role, author.role, lead.role) AS role,
           coalesce(p.team, author.team, lead.team) AS team,
           pr_count
    LIMIT 5
  `;

  const res = await graph.query(cypher, { params: { serviceName } });
  const durationMs = Date.now() - start;

  return {
    data: res.data || [],
    trace: {
      tool: "find_subject_matter_experts",
      args: { serviceName },
      durationMs,
      resultCount: res.data?.length || 0,
      cypher,
    },
  };
}

/**
 * Tool 4: PR Governance Audit Watchdog
 * Audits incoming GitHub PRs to see if modified services violate active or superseded architectural decisions.
 */
export async function auditPR(prNumber: number, graphId?: string): Promise<{
  violations: any[];
  trace: ToolTrace;
}> {
  const start = Date.now();
  const graph = await getGraph(graphId);
  const cypher = `
    MATCH (pr:GitHubPR {number: $prNumber})-[:TOUCHES]->(s:Service)<-[:GOVERNS]-(d:Decision)
    OPTIONAL MATCH (d)-[:SUPERSEDES]->(old:Decision)
    RETURN pr.number AS pr_number, pr.title AS pr_title, pr.author AS author,
           s.name AS service_name, s.tier AS service_tier,
           d.id AS decision_id, d.title AS active_rule, d.rationale AS constraint_rationale, d.status AS decision_status,
           old.id AS superseded_decision_id, old.title AS superseded_rule
  `;

  const res = await graph.query(cypher, { params: { prNumber } });
  const durationMs = Date.now() - start;

  return {
    violations: res.data || [],
    trace: {
      tool: "audit_pr_governance",
      args: { prNumber },
      durationMs,
      resultCount: res.data?.length || 0,
      cypher,
    },
  };
}

/**
 * Tool 5: Agent Episodic Memory (Read / Write)
 * Shared memory nodes for cross-session recall across multiple agents.
 */
export async function storeAgentFinding(
  targetName: string,
  text: string,
  severity = "INFO",
  sessionId = "session-current",
  graphId?: string
): Promise<{ success: boolean; trace: ToolTrace }> {
  const start = Date.now();
  const graph = await getGraph(graphId);
  const id = `finding-${Date.now()}`;
  const cypher = `
    MERGE (target:Service {name: $targetName})
    CREATE (f:AgentFinding {
      id: $id,
      text: $text,
      severity: $severity,
      session_id: $sessionId,
      at: $timestamp
    })
    CREATE (f)-[:ABOUT]->(target)
    RETURN f.id AS finding_id
  `;

  try {
    const res = await graph.query(cypher, {
      params: {
        targetName,
        id,
        text,
        severity,
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
    const durationMs = Date.now() - start;

    return {
      success: (res.data?.length || 0) > 0,
      trace: {
        tool: "store_agent_finding",
        args: { targetName, text, severity, sessionId },
        durationMs,
        resultCount: res.data?.length || 0,
        cypher,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      trace: {
        tool: "store_agent_finding",
        args: { targetName, text, severity, sessionId },
        durationMs: Date.now() - start,
        resultCount: 0,
        cypher,
      },
    };
  }
}

export async function recallAgentFindings(targetName: string, graphId?: string): Promise<{
  data: any[];
  trace: ToolTrace;
}> {
  const start = Date.now();
  const graph = await getGraph(graphId);
  const cypher = `
    MATCH (f:AgentFinding)-[:ABOUT]->(target {name: $targetName})
    RETURN f.id AS id, f.text AS text, f.severity AS severity, f.at AS learned_at, f.session_id AS session_id
    ORDER BY f.at DESC
    LIMIT 5
  `;

  try {
    const res = await graph.query(cypher, { params: { targetName } });
    const durationMs = Date.now() - start;

    return {
      data: res.data || [],
      trace: {
        tool: "recall_agent_findings",
        args: { targetName },
        durationMs,
        resultCount: res.data?.length || 0,
        cypher,
      },
    };
  } catch {
    return {
      data: [],
      trace: {
        tool: "recall_agent_findings",
        args: { targetName },
        durationMs: Date.now() - start,
        resultCount: 0,
        cypher,
      },
    };
  }
}

export async function getAllAgentFindings(graphId?: string): Promise<any[]> {
  try {
    const graph = await getGraph(graphId);
    const cypher = `
      MATCH (f:AgentFinding)
      OPTIONAL MATCH (f)-[:ABOUT]->(target)
      RETURN f.id AS id, f.text AS text, f.severity AS severity, f.at AS created_at, f.session_id AS session_id,
             coalesce(target.name, target.title, toString(target.number), target.id, 'service') AS target_name,
             labels(target)[0] AS target_type
      ORDER BY f.at DESC
      LIMIT 50
    `;
    const res = await graph.query(cypher);
    return res.data || [];
  } catch {
    return [];
  }
}

/**
 * Full Graph Snapshot for Cytoscape.js Canvas
 */
export async function getGraphOverview(graphId?: string): Promise<GraphData> {
  try {
    const graph = await getGraph(graphId);
    const nodesRes = await graph.query(`
      MATCH (n) WHERE NOT n:Chunk
      RETURN id(n) AS id, labels(n)[0] AS label, 
             coalesce(n.name, n.title, toString(n.number), n.id) AS name,
             properties(n) AS props
    `);

    const edgesRes = await graph.query(`
      MATCH (a)-[r]->(b) WHERE NOT a:Chunk AND NOT b:Chunk
      RETURN id(r) AS id, id(a) AS source, id(b) AS target, type(r) AS label, properties(r) AS props
    `);

    const nodes = (nodesRes.data || []).map((row: any) => ({
      id: String(row.id),
      label: row.label || "Entity",
      name: String(row.name || "Unnamed"),
      properties: row.props || {},
    }));

    const edges = (edgesRes.data || []).map((row: any) => ({
      id: String(row.id),
      source: String(row.source),
      target: String(row.target),
      label: row.label || "CONNECTED_TO",
      properties: row.props || {},
    }));

    return { nodes, edges };
  } catch {
    return { nodes: [], edges: [] };
  }
}
