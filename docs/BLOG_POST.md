---
title: How We Built an Autonomous Company Brain & Multi-Agent Memory Engine with FalkorDB
published: false
tags: falkordb, ai, hackathon, graphdb
---

> "Why did we deprecate the v1 Auth Service, who approved it, and what breaks if we shut it down on Monday?"

Every engineering team has asked a question like this, and nobody can answer it quickly. The reasoning is in a meeting transcript. The spec is an RFC in Google Docs. The commitment is a GitHub issue. The actual change is spread across three PRs. The only thing that connects them is somebody's memory, and that person is on holiday.

For the WeMakeDevs Graph Hacks Hackathon we built **CompanyMind AI**: a living knowledge graph of a company, plus a small team of AI agents that reason over it and share memory through the same graph. Everything runs on **FalkorDB**.

- Code: https://github.com/vishal-kumar9032/companymind-ai
- Demo: https://youtu.be/FOdQao7GC4A

This post covers why we used a graph, how the agents use it, and the parts that were harder than we expected.

## Why vector RAG falls over on this question

The default way to build "chat with your company data" is to chunk documents, embed them, and retrieve the nearest chunks. That works for "what is our refund policy?". It breaks on our question, because the answer isn't in any single chunk. It's a path:

```
CTO -APPROVED-> Decision -GOVERNS-> auth-v1
RFC -PROPOSES-> Decision          Meeting -RECORDED_IN-> RFC
mobile-app, web-checkout -DEPENDS_ON-> api-gateway -DEPENDS_ON-> auth-v1
```

Nearest-neighbour search returns text that sounds related. It can't follow a variable number of hops, and it can't tell you that a link doesn't exist. SQL can model the path, but every new shape of question needs another set of joins, and the depth of the dependency chain isn't fixed.

In a graph database the path is the data. A question like "what breaks?" becomes one traversal, and every hop in the answer is an edge somebody recorded, so it can be cited.

## Why FalkorDB

FalkorDB is a graph database that runs as a Redis module, stores graphs as sparse matrices (GraphBLAS) and is queried with OpenCypher. Four things mattered to us:

1. **Variable-length traversals are one line of Cypher**, with a bounded depth so a bad edge can't make a query run away.
2. **Graph algorithms are built in.** PageRank, betweenness, label propagation and weakly connected components are `CALL algo.*` procedures. We expose them to the agent directly.
3. **Full-text search lives in the same database.** We didn't need a second system for uploaded documents.
4. **Graphs are cheap and separate.** Each signed-in user gets their own graph, `org_<uid>`, so tenant isolation is a namespace rather than a `WHERE` clause we might forget.

## The model

People, teams, meetings, docs, decisions, services, GitHub issues and PRs, connected by relationships such as `APPROVED`, `PROPOSES`, `SUPERSEDES`, `GOVERNS`, `OWNS`, `DEPENDS_ON` and `TOUCHES`.

Agent state goes in the same graph, as `Memory`, `AgentRun`, `Task` and `Approval` nodes. That decision turned out to matter, and I'll come back to it.

## Multi-hop reasoning as a tool

Our "blast radius" tool answers *what is affected if this service goes away*. The core of it is this query:

```cypher
MATCH path = (upstream:Service)-[:DEPENDS_ON*1..4]->(target:Service {name: $serviceName})
OPTIONAL MATCH (upstream)<-[:OWNS]-(t:Team)
RETURN DISTINCT upstream.name AS affected_service,
       length(path) AS hops_count,
       t.name AS owning_team, t.lead AS team_lead,
       [n IN nodes(path) | n.name] AS via
ORDER BY hops_count ASC, affected_service ASC
```

For `auth-v1` it returns the API gateway at one hop, then the mobile app and web checkout at two hops, each with the owning team and its lead and the exact chain that links them. The `via` list is what the UI uses to light up the path on screen.

Notice `$serviceName`. The query is parameterised, never built from model output.

## Graph algorithms as agent tools

Some questions don't name an entity: "what's our biggest risk?" or "which services are single points of failure?" For those we gave the agent one `graph_algorithm` tool that wraps FalkorDB's procedures:

```ts
case "pagerank":
  res = await graph.query(
    `CALL algo.pageRank($label, $rel) YIELD node, score
     RETURN ${display} AS name, score ORDER BY score DESC LIMIT 10`,
    { params: { label, rel: relationship } });
  break;
case "betweenness":
  res = await graph.query(
    `CALL algo.betweenness($cfg) YIELD node, score
     RETURN ${display} AS name, score ORDER BY score DESC LIMIT 10`,
    { params: { cfg } });
  break;
```

- **PageRank** finds the services the most other services depend on.
- **Betweenness** finds the bottlenecks that sit on the most paths. These are the single points of failure.
- **Label propagation** finds natural clusters.
- **WCC** finds disconnected islands, which are often forgotten systems.

The agent doesn't need to know how any of this is computed. It calls `graph_schema` first to learn the real labels and relationship names, picks an algorithm, and explains the result in plain language.

Alongside these there is `shortest_path`, which explains how two entities are connected hop by hop, and a read-only `graph_query` (`GRAPH.RO_QUERY`) for anything the specific tools don't cover. Because the free-form route is read-only, the model can explore freely without being able to write to the graph.

## A small team of agents with shared memory

An orchestrator hands work to three specialists:

| Agent | Job |
|---|---|
| **Researcher** | Graph lookups and web search |
| **Governance Watchdog** | Checks PRs against past decisions |
| **Scribe** | Drafts content and performs actions |

The interesting part is how they share context. We didn't pass a long transcript between agents. A hand-off is a `Task` node. What an agent learns is a `Memory` node, typed as episodic (what happened), semantic (what is true) or procedural (how to do something). Later runs `recall` what is relevant instead of re-reading everything.

Because memory is in the same graph as the company data, a memory can link to the entity it's about. "Payments team prefers a two-week deprecation window" is an edge to the payments team, not a floating string. This also keeps the context window small, since agents fetch a few relevant nodes instead of carrying the whole history.

## Bring your own documents

The Documents & Files view accepts PDF, Word, Excel, CSV, Markdown and text. Uploads are parsed, split into chunks and stored as `Chunk` nodes linked to their `Doc`, with a full-text index on the chunk text:

```cypher
CALL db.idx.fulltext.queryNodes('Chunk', $q) YIELD node, score
MATCH (node)-[:PART_OF]->(d:Doc)
RETURN d.name AS document, node.idx AS part, node.text AS text, score
ORDER BY score DESC LIMIT $limit
```

Answers cite their source as `[document, part N]`. An "Add to graph" button extracts the decisions, services and people in a document and links them into the graph, so a pasted spec becomes something you can traverse.

## Letting agents act, with a human in the loop

Through Composio the agents can reach Gmail, Calendar, Drive, Docs and GitHub, using the user's own connected accounts. We were careful here. A tool runs without approval only if its name carries a read verb and no write verb. Anything unrecognised is treated as a write. Writes are queued as `Approval` nodes and only run after the user approves. Failing closed matters more than being slightly less convenient.

## Showing the reasoning

The graph is drawn with Cytoscape.js. When the agent runs a traversal, the nodes and edges it touched are highlighted, and memory recalls, tool calls and hand-offs stream into the chat as they happen. Seeing the highlighted path is what makes people trust the answer, because they can check it against the graph themselves.

## What we learned

- **Give the model tools, not a Cypher prompt.** Parameterised tools for the common questions, plus a read-only escape hatch, gave far more reliable answers than asking the model to write Cypher from scratch.
- **Make it check the schema first.** Calling `graph_schema` before anything else removed most invented labels and relationship names.
- **Be honest when there's nothing to say.** An empty graph or an unconnected account returns "no data" or "not connected". It never returns invented content.
- **Never trust the client for identity.** The tenant graph is derived from a verified Firebase ID token on the server, not from anything the browser sends.
- **Put memory where the knowledge is.** Keeping agent memory in the company graph made it queryable, linkable and auditable.

## Stack

FalkorDB, Next.js 15 (App Router, TypeScript), React 19, Tailwind, Cytoscape.js, an OpenAI-compatible LLM gateway with a model fallback chain, Composio for Google Workspace and GitHub, and Firebase Authentication.

## Try it

Clone the repo, start FalkorDB with Docker, and run the seeded sample workspace to try the `auth-v1` question yourself.

- Code: https://github.com/vishal-kumar9032/companymind-ai
- Demo video: https://youtu.be/FOdQao7GC4A

If you're building agents on top of a graph, I'd like to hear how you handle memory and approvals. Leave a comment below.
