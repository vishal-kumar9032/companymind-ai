import { getGraph } from "@/lib/falkordb";
import type { Caller } from "./identity";

/**
 * Shared agent memory, stored in the caller's own FalkorDB graph so every agent
 * (and every later session) reads and writes the same state, isolated per org.
 *
 *   (:Memory {kind: episodic|semantic|procedural})-[:ABOUT]->(:Entity)
 *   (:AgentRun)-[:PRODUCED]->(:Memory)
 *   (:Task {from,to,goal,status})   <- hand-offs between agents
 *   (:Approval {tool,args,status})  <- human-in-the-loop gate for writes
 */

export type MemoryKind = "episodic" | "semantic" | "procedural";

const id = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

async function g(c: Caller) {
  return getGraph(c.graph);
}

export async function remember(
  c: Caller,
  agent: string,
  text: string,
  kind: MemoryKind = "semantic",
  about: string[] = [],
  runId?: string,
): Promise<string> {
  const graph = await g(c);
  const memId = id("mem");
  await graph.query(
    `CREATE (m:Memory {id: $id, kind: $kind, text: $text, agent: $agent, at: $at})`,
    { params: { id: memId, kind, text, agent, at: new Date().toISOString() } },
  );
  for (const name of about.slice(0, 8)) {
    await graph.query(
      `MATCH (m:Memory {id: $id}) MERGE (e:Entity {name: $name}) MERGE (m)-[:ABOUT]->(e)`,
      { params: { id: memId, name } },
    );
  }
  if (runId) {
    await graph.query(`MATCH (r:AgentRun {id: $r}), (m:Memory {id: $m}) CREATE (r)-[:PRODUCED]->(m)`, {
      params: { r: runId, m: memId },
    });
  }
  return memId;
}

export async function recall(c: Caller, query: string, limit = 6): Promise<any[]> {
  const graph = await g(c);
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9._-]+/)
    .filter((w) => w.length > 2)
    .slice(0, 8);
  const res = await graph.roQuery(
    `MATCH (m:Memory)
     OPTIONAL MATCH (m)-[:ABOUT]->(e:Entity)
     WITH m, collect(e.name) AS about
     WHERE size($words) = 0 OR any(w IN $words WHERE toLower(m.text) CONTAINS w OR any(a IN about WHERE toLower(a) CONTAINS w))
     RETURN m.id AS id, m.kind AS kind, m.text AS text, m.agent AS agent, m.at AS at, about
     ORDER BY m.at DESC LIMIT $limit`,
    { params: { words, limit } },
  );
  return (res.data as any[]) || [];
}

export async function startRun(c: Caller, agent: string, goal: string, parent?: string): Promise<string> {
  const graph = await g(c);
  const runId = id("run");
  await graph.query(
    `CREATE (r:AgentRun {id: $id, agent: $agent, goal: $goal, status: 'running', at: $at, parent: $parent})`,
    { params: { id: runId, agent, goal, at: new Date().toISOString(), parent: parent || "" } },
  );
  return runId;
}

export async function finishRun(c: Caller, runId: string, status: "done" | "error", answer: string) {
  const graph = await g(c);
  await graph.query(`MATCH (r:AgentRun {id: $id}) SET r.status = $status, r.answer = $answer, r.ended = $at`, {
    params: { id: runId, status, answer: answer.slice(0, 4000), at: new Date().toISOString() },
  });
}

export async function recentRuns(c: Caller, limit = 20): Promise<any[]> {
  const graph = await g(c);
  const res = await graph.roQuery(
    `MATCH (r:AgentRun) RETURN r.id AS id, r.agent AS agent, r.goal AS goal, r.status AS status, r.answer AS answer, r.at AS at, r.parent AS parent
     ORDER BY r.at DESC LIMIT $limit`,
    { params: { limit } },
  );
  return (res.data as any[]) || [];
}

// ---- hand-offs ----------------------------------------------------------

export async function createTask(c: Caller, from: string, to: string, goal: string, context: string, runId?: string) {
  const graph = await g(c);
  const taskId = id("task");
  await graph.query(
    `CREATE (t:Task {id: $id, from: $from, to: $to, goal: $goal, context: $context, status: 'open', at: $at})`,
    { params: { id: taskId, from, to, goal, context: context.slice(0, 4000), at: new Date().toISOString() } },
  );
  if (runId) {
    await graph.query(`MATCH (r:AgentRun {id: $r}), (t:Task {id: $t}) CREATE (r)-[:HANDED_OFF]->(t)`, {
      params: { r: runId, t: taskId },
    });
  }
  return taskId;
}

export async function completeTask(c: Caller, taskId: string, result: string) {
  const graph = await g(c);
  await graph.query(`MATCH (t:Task {id: $id}) SET t.status = 'done', t.result = $result`, {
    params: { id: taskId, result: result.slice(0, 4000) },
  });
}

// ---- approvals ----------------------------------------------------------

export interface Approval {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  agent: string;
  status: "pending" | "approved" | "rejected" | "executed" | "failed";
  result?: string;
  at: string;
}

export async function createApproval(c: Caller, agent: string, tool: string, args: Record<string, unknown>) {
  const graph = await g(c);
  const approvalId = id("appr");
  await graph.query(
    `CREATE (a:Approval {id: $id, tool: $tool, args: $args, agent: $agent, status: 'pending', at: $at})`,
    { params: { id: approvalId, tool, args: JSON.stringify(args), agent, at: new Date().toISOString() } },
  );
  return approvalId;
}

function toApproval(row: any): Approval {
  return { ...row, args: safeParse(row.args) };
}
function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

export async function getApproval(c: Caller, approvalId: string): Promise<Approval | null> {
  const graph = await g(c);
  const res = await graph.roQuery(
    `MATCH (a:Approval {id: $id}) RETURN a.id AS id, a.tool AS tool, a.args AS args, a.agent AS agent, a.status AS status, a.result AS result, a.at AS at`,
    { params: { id: approvalId } },
  );
  const row = (res.data as any[])?.[0];
  return row ? toApproval(row) : null;
}

export async function listApprovals(c: Caller, limit = 20): Promise<Approval[]> {
  const graph = await g(c);
  const res = await graph.roQuery(
    `MATCH (a:Approval) RETURN a.id AS id, a.tool AS tool, a.args AS args, a.agent AS agent, a.status AS status, a.result AS result, a.at AS at
     ORDER BY a.at DESC LIMIT $limit`,
    { params: { limit } },
  );
  return ((res.data as any[]) || []).map(toApproval);
}

export async function setApprovalStatus(c: Caller, approvalId: string, status: Approval["status"], result = "") {
  const graph = await g(c);
  await graph.query(`MATCH (a:Approval {id: $id}) SET a.status = $status, a.result = $result`, {
    params: { id: approvalId, status, result: result.slice(0, 4000) },
  });
}
