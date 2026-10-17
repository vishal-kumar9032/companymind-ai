import type OpenAI from "openai";
import { getGraph } from "@/lib/falkordb";
import {
  auditPR,
  findSubjectMatterExperts,
  serviceBlastRadius,
  traceDecisionProvenance,
} from "@/lib/tools";
import type { Caller } from "./identity";
import { createApproval, recall, remember } from "./memory";
import { executeComposioTool, getConnectedTools, isWriteTool } from "./composio";

export type Role = "orchestrator" | "researcher" | "governance" | "scribe";

export interface ToolEvent {
  type: "approval";
  approvalId: string;
  tool: string;
  args: Record<string, unknown>;
}

export interface ToolContext {
  caller: Caller;
  role: Role;
  runId: string;
  connected: string[];
  delegate?: (role: Role, goal: string, context: string) => Promise<string>;
  emit: (e: ToolEvent) => void;
}

type Def = OpenAI.Chat.Completions.ChatCompletionTool;
type Handler = (args: any, ctx: ToolContext) => Promise<unknown>;

const fn = (name: string, description: string, properties: Record<string, unknown>, required: string[] = []): Def => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const MAX_ROWS = 50;

/** An empty result is stated outright so the model reports it instead of inventing an answer. */
const orEmpty = (rows: unknown[] | undefined, what: string) =>
  rows && rows.length
    ? rows
    : { results: [], note: `No ${what} found in this workspace's graph. It may not contain that data yet (connect and sync sources in Connections), or the name may differ; try entity_neighborhood or graph_query.` };

const BUILTIN: { def: Def; run: Handler; roles?: Role[] }[] = [
  {
    def: fn("graph_schema", "List node labels, relationship types and node counts in this organization's knowledge graph.", {}),
    run: async (_a, ctx) => {
      const graph = await getGraph(ctx.caller.graph);
      const labels = ((await graph.roQuery("CALL db.labels()")).data as any[]).map((r) => Object.values(r)[0]);
      const rels = ((await graph.roQuery("CALL db.relationshipTypes()")).data as any[]).map((r) => Object.values(r)[0]);
      const counts: Record<string, unknown> = {};
      for (const l of (labels as string[]).slice(0, 30)) {
        const r = await graph.roQuery(`MATCH (n:\`${String(l).replace(/`/g, "")}\`) RETURN count(n) AS c`);
        counts[String(l)] = (r.data as any[])?.[0]?.c;
      }
      const shape = await graph.roQuery(
        "MATCH (a)-[r]->(b) RETURN DISTINCT labels(a)[0] AS from, type(r) AS rel, labels(b)[0] AS to LIMIT 60",
      );
      const props = await graph.roQuery(
        "MATCH (n) WITH labels(n)[0] AS label, keys(n) AS k UNWIND k AS key RETURN label, collect(DISTINCT key) AS properties LIMIT 40",
      );
      return {
        labels: counts,
        relationshipTypes: rels,
        patterns: ((shape.data as any[]) || []).map((r) => `(${r.from})-[:${r.rel}]->(${r.to})`),
        properties: Object.fromEntries(((props.data as any[]) || []).map((r) => [r.label, r.properties])),
      };
    },
  },
  {
    def: fn(
      "graph_query",
      "Run a READ-ONLY OpenCypher query on the company knowledge graph (people, projects, documents, decisions, PRs, emails, events). ALWAYS call graph_schema first: it returns the exact (Label)-[:REL]->(Label) patterns and property names to use. Max 50 rows.",
      { cypher: { type: "string", description: "OpenCypher query, e.g. MATCH (p:Person)-[:AUTHORED]->(d) RETURN p.name, d.title LIMIT 10" } },
      ["cypher"],
    ),
    run: async ({ cypher }, ctx) => {
      const graph = await getGraph(ctx.caller.graph);
      const started = Date.now();
      const res = await graph.roQuery(String(cypher)); // read-only enforced by the database
      const rows = ((res.data as any[]) || []).slice(0, MAX_ROWS);
      return { rows, rowCount: rows.length, ms: Date.now() - started };
    },
  },
  {
    def: fn(
      "entity_neighborhood",
      "Everything directly connected to one entity (any label), in both directions, with relationship types. Best first step for 'who owns X', 'what is X connected to', 'what governs X'.",
      { name: { type: "string", description: "Exact entity name or id, e.g. payments-api, DEC-44, Sarah Chen" } },
      ["name"],
    ),
    run: async ({ name }, ctx) => {
      const graph = await getGraph(ctx.caller.graph);
      const res = await graph.roQuery(
        `MATCH (n) WHERE toLower(n.name) = toLower($name) OR toLower(n.id) = toLower($name) OR toLower(n.title) = toLower($name)
         OPTIONAL MATCH (n)-[r]-(m)
         RETURN labels(n)[0] AS entityLabel, properties(n) AS entity,
                CASE WHEN startNode(r) = n THEN 'out' ELSE 'in' END AS direction,
                type(r) AS rel, labels(m)[0] AS otherLabel, coalesce(m.name, m.title, m.id) AS other, properties(m) AS otherProps
         LIMIT 60`,
        { params: { name: String(name) } },
      );
      const rows = (res.data as any[]) || [];
      if (!rows.length) return { error: `No entity named "${name}" found. Try graph_query with CONTAINS.` };
      return {
        entity: rows[0].entity,
        label: rows[0].entityLabel,
        connections: rows
          .filter((r) => r.rel)
          .map((r) => `${r.direction === "out" ? "->" : "<-"} [${r.rel}] ${r.otherLabel}: ${r.other}`),
      };
    },
  },
  {
    def: fn("service_blast_radius", "Downstream services/teams affected if a service fails or is sunset (multi-hop DEPENDS_ON traversal).", {
      serviceName: { type: "string" },
      depth: { type: "integer", default: 4 },
    }, ["serviceName"]),
    run: async (a, ctx) =>
      orEmpty((await serviceBlastRadius(a.serviceName, a.depth || 4, ctx.caller.graph)).data, "dependent services"),
  },
  {
    def: fn("trace_decision_provenance", "Trace which decision governs a service, the RFC behind it, the meeting that approved it and who signed off.", {
      serviceName: { type: "string" },
    }, ["serviceName"]),
    run: async (a, ctx) =>
      orEmpty((await traceDecisionProvenance(a.serviceName, ctx.caller.graph)).data, "governing decision"),
  },
  {
    def: fn("audit_pr_governance", "Check whether a pull request touches services governed by active architectural decisions.", {
      prNumber: { type: "integer" },
    }, ["prNumber"]),
    run: async (a, ctx) =>
      orEmpty((await auditPR(Number(a.prNumber), ctx.caller.graph)).violations, "governance violations or that pull request"),
  },
  {
    def: fn("find_subject_matter_experts", "Rank people who know a service best (owners, RFC authors, PR contributors).", {
      serviceName: { type: "string" },
    }, ["serviceName"]),
    run: async (a, ctx) =>
      orEmpty((await findSubjectMatterExperts(a.serviceName, ctx.caller.graph)).data, "experts"),
  },
  {
    def: fn(
      "graph_algorithm",
      "Run a graph algorithm over one node label and one relationship type to find what matters structurally. pagerank = most depended-on / most influential nodes; betweenness = bottlenecks that sit on many paths between others (single points of failure); communities = clusters of tightly connected nodes; components = disconnected islands. Call graph_schema first and use its exact label and relationship names.",
      {
        algorithm: { type: "string", enum: ["pagerank", "betweenness", "communities", "components"] },
        label: { type: "string", description: "Node label, e.g. Service" },
        relationship: { type: "string", description: "Relationship type, e.g. DEPENDS_ON" },
      },
      ["algorithm", "label", "relationship"],
    ),
    run: async ({ algorithm, label, relationship }, ctx) => {
      const graph = await getGraph(ctx.caller.graph);
      const names = async (proc: string) => ((await graph.roQuery(`CALL ${proc}()`)).data as any[]).map((r) => String(Object.values(r)[0]));
      const [labels, rels] = await Promise.all([names("db.labels"), names("db.relationshipTypes")]);
      if (!labels.includes(label)) return { error: `Unknown label "${label}". Labels: ${labels.join(", ") || "none"}` };
      if (!rels.includes(relationship)) return { error: `Unknown relationship "${relationship}". Relationships: ${rels.join(", ") || "none"}` };

      const cfg = { nodeLabels: [label], relationshipTypes: [relationship] };
      const display = "coalesce(node.name, node.title, node.id)";
      const started = Date.now();
      let res;
      switch (algorithm) {
        case "pagerank":
          res = await graph.query(
            `CALL algo.pageRank($label, $rel) YIELD node, score RETURN ${display} AS name, score ORDER BY score DESC LIMIT 10`,
            { params: { label, rel: relationship } },
          );
          break;
        case "betweenness":
          res = await graph.query(
            `CALL algo.betweenness($cfg) YIELD node, score RETURN ${display} AS name, score ORDER BY score DESC LIMIT 10`,
            { params: { cfg } },
          );
          break;
        case "communities":
          res = await graph.query(
            `CALL algo.labelPropagation($cfg) YIELD node, communityId RETURN communityId AS community, collect(${display}) AS members ORDER BY size(members) DESC LIMIT 10`,
            { params: { cfg } },
          );
          break;
        case "components":
          res = await graph.query(
            `CALL algo.WCC($cfg) YIELD node, componentId RETURN componentId AS component, collect(${display}) AS members ORDER BY size(members) DESC LIMIT 10`,
            { params: { cfg } },
          );
          break;
        default:
          return { error: "algorithm must be pagerank, betweenness, communities or components" };
      }
      const rows = ((res.data as any[]) || []).slice(0, MAX_ROWS);
      return rows.length
        ? { algorithm, label, relationship, rows, ms: Date.now() - started }
        : { algorithm, label, relationship, rows: [], note: `No ${label} nodes connected by ${relationship}.` };
    },
  },
  {
    def: fn(
      "shortest_path",
      "Shortest chain of relationships between two entities, in either direction. Use it to explain HOW two things are connected (e.g. a person and a service, a decision and a PR). Returns each hop with its relationship type.",
      {
        from: { type: "string", description: "Exact entity name, title or id" },
        to: { type: "string", description: "Exact entity name, title or id" },
        maxHops: { type: "integer", description: "Maximum hops, default 6, max 8" },
      },
      ["from", "to"],
    ),
    run: async ({ from, to, maxHops }, ctx) => {
      const graph = await getGraph(ctx.caller.graph);
      const hops = Math.min(Math.max(Number(maxHops) || 6, 1), 8);
      const match = (v: string) => `toLower(${v}.name) = toLower($${v}) OR toLower(${v}.id) = toLower($${v}) OR toLower(${v}.title) = toLower($${v})`;
      // FalkorDB has no undirected shortestPath, so search exact lengths 1, 2, 3... and stop at the first hit.
      let row: any;
      for (let k = 1; k <= hops && !row; k++) {
        const res = await graph.roQuery(
          `MATCH (a), (b) WHERE (${match("a")}) AND (${match("b")}) AND a <> b
           MATCH p = (a)-[*${k}]-(b)
           RETURN [n IN nodes(p) | coalesce(n.name, n.title, n.id)] AS entities,
                  [n IN nodes(p) | labels(n)[0]] AS labels,
                  [r IN relationships(p) | type(r)] AS relationships, length(p) AS hops
           LIMIT 1`,
          { params: { a: String(from), b: String(to) } },
        );
        row = (res.data as any[])?.[0];
      }
      if (!row) return { error: `No path of up to ${hops} hops between "${from}" and "${to}" (or one of them does not exist).` };
      const steps = row.entities.map((e: string, i: number) => `${e} (${row.labels[i]})${i < row.relationships.length ? ` -[${row.relationships[i]}]-` : ""}`);
      return { hops: row.hops, path: steps.join(" "), entities: row.entities, relationships: row.relationships };
    },
  },
  {
    def: fn("recall", "Search shared agent memory (what any agent learned in earlier sessions).", {
      query: { type: "string" },
      limit: { type: "integer", default: 6 },
    }, ["query"]),
    run: async (a, ctx) => recall(ctx.caller, String(a.query), Math.min(Number(a.limit) || 6, 15)),
  },
  {
    def: fn("remember", "Save a durable fact, finding or procedure to shared memory so other agents and future sessions can use it.", {
      text: { type: "string" },
      kind: { type: "string", enum: ["semantic", "episodic", "procedural"] },
      about: { type: "array", items: { type: "string" }, description: "Entity names this is about" },
    }, ["text"]),
    run: async (a, ctx) => ({
      id: await remember(ctx.caller, ctx.role, String(a.text), a.kind || "semantic", a.about || [], ctx.runId),
    }),
  },
  {
    def: fn(
      "web_search",
      "Search the public web for current information. Returns titles, URLs and snippets.",
      { query: { type: "string" } },
      ["query"],
    ),
    run: async ({ query }) => {
      const key = process.env.TAVILY_API_KEY;
      if (!key) return { error: "web search is not configured (TAVILY_API_KEY missing)" };
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ query, max_results: 5, include_answer: true }),
      });
      if (!res.ok) return { error: `search failed (${res.status})` };
      const j: any = await res.json();
      return {
        answer: j.answer,
        results: (j.results || []).map((r: any) => ({ title: r.title, url: r.url, snippet: String(r.content).slice(0, 400) })),
      };
    },
    roles: ["orchestrator", "researcher"],
  },
  {
    def: fn(
      "delegate",
      "Hand a sub-task to a specialist agent and get its result. researcher = graph + web research; governance = decisions/PR policy checks; scribe = drafts and performs actions in Gmail/Calendar/Docs/Sheets/GitHub (writes need human approval).",
      {
        role: { type: "string", enum: ["researcher", "governance", "scribe"] },
        goal: { type: "string" },
        context: { type: "string", description: "Everything the specialist needs; it cannot see this conversation." },
      },
      ["role", "goal"],
    ),
    run: async (a, ctx) => {
      if (!ctx.delegate) return { error: "delegation unavailable" };
      return { result: await ctx.delegate(a.role as Role, String(a.goal), String(a.context || "")) };
    },
    roles: ["orchestrator"],
  },
];

const ROLE_COMPOSIO: Record<Role, string[] | "all"> = {
  orchestrator: "all",
  researcher: ["googledrive", "gmail", "googlecalendar", "github", "googlesheets", "googledocs", "googlesuper"],
  governance: ["github", "googledrive", "googlesuper"],
  scribe: "all",
};

export interface Toolbox {
  definitions: Def[];
  call: (name: string, args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
}

export async function buildToolbox(caller: Caller, role: Role, connected: string[]): Promise<Toolbox> {
  const handlers = new Map<string, Handler>();
  const definitions: Def[] = [];

  for (const t of BUILTIN) {
    if (t.roles && !t.roles.includes(role)) continue;
    if (t.def.type === "function") {
      handlers.set(t.def.function.name, t.run);
      definitions.push(t.def);
    }
  }

  const allowed = ROLE_COMPOSIO[role];
  const toolkits = connected.filter((c) => allowed === "all" || allowed.includes(c));
  const composioNames = new Set<string>();
  if (caller.authenticated && toolkits.length) {
    try {
      for (const def of await getConnectedTools(caller.id, toolkits)) {
        if (def.type !== "function") continue;
        const slug = def.function.name;
        composioNames.add(slug);
        const write = isWriteTool(slug);
        definitions.push({
          type: "function",
          function: {
            ...def.function,
            description: `${def.function.description || slug}${write ? " [WRITE: queued for human approval before it runs]" : ""}`,
          },
        });
      }
    } catch {
      // Connected-tool discovery failed: continue with built-ins only; the agent is told what it has.
    }
  }

  return {
    definitions,
    call: async (name, args, ctx) => {
      const h = handlers.get(name);
      if (h) return h(args, ctx);
      if (composioNames.has(name)) {
        if (isWriteTool(name)) {
          const approvalId = await createApproval(ctx.caller, ctx.role, name, args);
          ctx.emit({ type: "approval", approvalId, tool: name, args });
          return { status: "pending_approval", approvalId, note: "Queued. The user must approve before this runs. Tell them what you prepared." };
        }
        const res = await executeComposioTool(ctx.caller.id, name, args);
        return res.ok ? res.data : { error: res.error };
      }
      return { error: `unknown tool: ${name}` };
    },
  };
}
