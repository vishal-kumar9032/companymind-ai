<div align="center">

# 🧠 CompanyMind AI
### Autonomous Enterprise Graph Brain & Cross-Agent Shared Memory

[![Powered by FalkorDB](https://img.shields.io/badge/Powered%20By-FalkorDB-6B46C1?style=for-the-badge&logo=redis&logoColor=white)](https://falkordb.com)
[![Hackathon](https://img.shields.io/badge/WeMakeDevs-Graph%20Hacks%202026-FF4088?style=for-the-badge)](https://www.wemakedevs.org/hackathons/falkordb)
[![Tracks](https://img.shields.io/badge/Tracks-Company%20Brain%20%7C%20Agent%20Memory-00B4D8?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-Apache%202.0-green?style=for-the-badge)]()

[![Live Demo](https://img.shields.io/badge/Live%20Demo-HTTPS%20Online-00C853?style=for-the-badge)](https://companymind.135-235-136-6.sslip.io)

**Give your AI agents real company context.**  
CompanyMind AI connects Google Workspace meeting notes & RFC docs with GitHub PRs, issues, and microservice infrastructure into an ultra-fast, queryable graph brain powered by **FalkorDB**.

**🚀 [Launch Live App (HTTPS)](https://companymind.135-235-136-6.sslip.io)** • [Architecture Specification](docs/ARCHITECTURE.md) • [Getting Started](#-quickstart) • [Graph Model](#-graph-data-model) • [Demo Scenarios](#-demo-scenarios)

</div>

---

## 📌 Executive Summary

Modern companies suffer from **knowledge fragmentation**:
- **Why decisions were made** sits in Google Meet transcripts and executive meeting notes.
- **Architectural specifications** sit in Google Docs RFCs.
- **Tasks & bug tickets** sit in GitHub / Jira issues.
- **Code implementation** sits in GitHub PRs and commits.
- **Production dependencies** sit in microservice architectures.

When an engineer or leader asks:  
> *"Why did we deprecate the v1 Auth Service, who approved it, and what downstream services break if we shut it down?"*

Standard **Vector Search (RAG)** fails because text embeddings cannot follow causal chains or calculate variable-depth blast radiuses.  
Standard **SQL** fails because recursive traversals across dynamic entity graphs require unmaintainable multi-table joins.

**CompanyMind AI solves this by turning corporate memory into a directed graph inside FalkorDB.** The graph shapes what agents do, serves as cross-agent shared memory, and returns auditable traversal paths for every answer.

---

## 🎯 Hackathon Tracks Entered

1. **Track 03: Company Brain (Primary)**  
   * Connects people, teams, projects, documents, decisions, and code into one unified graph.
   * Full decision provenance: traces any technical rule back to the exact meeting and author.
   * Cross-team blast-radius impact analysis across microservices.
2. **Track 02: Agent Memory and Coordination (Secondary)**  
   * Acts as a persistent episodic, semantic and procedural memory layer shared by the orchestrator and its specialist agents (Researcher, Governance Watchdog, Scribe), with hand-offs recorded as `Task` nodes.
   * Agents write newly verified findings into the graph to preserve context across sessions without context window bloat.

---

## 📊 Graph Data Model

```mermaid
graph LR
    Person([:Person]) -->|MEMBER_OF| Team([:Team])
    Person -->|ATTENDED| Meeting([:Meeting])
    Person -->|AUTHORED| Doc([:Doc])
    Person -->|APPROVED| Decision([:Decision])
    
    Meeting -->|RECORDED_IN| Doc
    Doc -->|PROPOSES| Decision
    Decision -->|SUPERSEDES| OldDecision([:Decision])
    Decision -->|GOVERNS| Service([:Service])
    
    GitHubIssue([:GitHubIssue]) -->|TRACKS| Decision
    GitHubPR([:GitHubPR]) -->|RESOLVES| GitHubIssue
    GitHubPR -->|TOUCHES| Service
    Person -->|AUTHORED_PR| GitHubPR
    
    Team -->|OWNS| Service
    Service -->|DEPENDS_ON| DownstreamService([:Service])
    
    AgentFinding([:AgentFinding]) -->|ABOUT| Service
    AgentFinding -->|ABOUT| Decision
```

---

## ⚡ What It Does

The Ask AI chat is a tool-calling agent loop (`src/lib/agent/loop.ts`) that answers from the graph and shows its work: every memory recall, tool call and hand-off streams to the UI as it happens.

* **Multi-hop reasoning with Cypher tools.** Blast radius (`DEPENDS_ON*1..4`), decision provenance (service → decision → RFC → meeting → approver), PR governance audit, expert ranking, and a read-only `graph_query` for anything else. `graph_schema` tells the model the exact labels, relationships and properties first.
* **Graph algorithms as agent tools.** `graph_algorithm` runs FalkorDB PageRank, betweenness (single points of failure), label-propagation communities and connected components. `shortest_path` explains how two entities are connected, hop by hop.
* **Shared agent memory in the graph.** `Memory` (episodic / semantic / procedural), `AgentRun`, `Task` (hand-offs between agents) and `Approval` nodes live in the same FalkorDB graph and are recalled into later sessions.
* **A small agent team.** An orchestrator delegates to a Researcher (graph + web), a Governance Watchdog (decisions vs. PRs) and a Scribe (drafts and performs actions). Hand-offs are recorded as `Task` nodes.
* **Bring your own documents.** Signed-in users can upload PDF, Word, Excel, CSV, text and Markdown on the Connections page. Files are chunked into the user's own graph, searched with FalkorDB full-text search (`search_documents`, `read_document`), cited as `[document, part N]`, and can be turned into graph entities with one click ("Add to graph").
* **Per-tenant isolation.** Each signed-in user gets their own graph (`org_<uid>`), derived from the verified Firebase token, never from client input. Anonymous visitors use the read-only sample workspace with their own private memory.
* **Human-in-the-loop writes.** Any connector tool that is not clearly read-only (send email, create event, comment on a PR...) is queued as an `Approval` and only runs when the user approves it.
* **Honest by default.** Empty graph, unconnected account or missing config returns a plain "no data / not connected" result instead of invented answers.

### Agent tools

| Tool | What it does |
| :--- | :--- |
| `graph_schema`, `graph_query`, `entity_neighborhood` | Discover the schema, run read-only OpenCypher (`GRAPH.RO_QUERY`), list everything connected to one entity |
| `service_blast_radius`, `trace_decision_provenance`, `audit_pr_governance`, `find_subject_matter_experts` | Parameterised multi-hop Cypher tools |
| `graph_algorithm`, `shortest_path` | PageRank, betweenness, communities, components; path explainer |
| `list_documents`, `search_documents`, `read_document` | Search and read the user's uploaded files |
| `graph_upsert` | Record sourced entities and relationships into the user's own graph |
| `recall`, `remember` | Read / write shared memory |
| `delegate` | Hand a sub-task to a specialist agent |
| `web_search` | Public web (Tavily, optional) |
| Composio tools | Gmail, Calendar, Drive, Docs, Sheets, GitHub for the user's connected accounts (writes need approval) |

---

## 🛠️ Tech Stack

- **Graph database:** [FalkorDB](https://falkordb.com) (`falkordb` Node client, OpenCypher)
- **App:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS, Cytoscape.js graph canvas
- **Agent loop & API routes:** TypeScript, streaming NDJSON from `/api/agent`
- **LLMs:** OpenAI-compatible gateway (TrueFoundry) with a model fallback cascade, plus an optional direct Gemini key
- **Connectors:** Composio (OAuth for Google Workspace and GitHub)
- **Auth:** Firebase Authentication (ID tokens verified server-side with `jose`)

---

## 🚀 Quickstart

### 1. Prerequisites
- Docker
- Node.js 20+ and [pnpm](https://pnpm.io)

### 2. Start FalkorDB
```bash
# FalkorDB on 6379, FalkorDB Browser on 3000
docker run -d --name falkordb -p 6379:6379 -p 3000:3000 falkordb/falkordb:latest
```

### 3. Configure
```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
```

| Variable | Needed for |
| :--- | :--- |
| `FALKORDB_HOST` / `FALKORDB_PORT` (or `FALKORDB_URL` for FalkorDB Cloud) | Everything |
| `TRUEFOUNDRY_API_KEY`, `TRUEFOUNDRY_BASE_URL` (or `GEMINI_API_KEY`) | The agent (an LLM is required) |
| `NEXT_PUBLIC_FIREBASE_*` | Sign-in and per-user workspaces (without it everyone uses the demo workspace) |
| `COMPOSIO_USER_API_KEY` or `COMPOSIO_API_KEY` | Connecting Google Workspace / GitHub |
| `TAVILY_API_KEY` | `web_search` (optional) |
| `ALLOW_DEMO_RESEED=true` | Lets the in-app "Reset" button re-seed the demo graph in production |

### 4. Seed the sample graph and run
```bash
pnpm seed      # loads the sample company graph into FalkorDB
pnpm dev       # http://localhost:3000 (use `pnpm build && pnpm start -p 13050` for production)
```
Open the app and try a demo question below.

---

## ✅ Status & Known Gaps

Verified (see `BUILD_STATE.md` for dated evidence): multi-step tool use, memory write and cross-session recall, model fallback, graph algorithms, per-tenant graphs, atomic approvals.

Not yet proven end to end: connecting a real Google / GitHub account and approving a queued write; the Researcher/Governance/Scribe hand-offs against live connectors. The sample company is synthetic seed data.

---

## 🎬 Demo Scenarios: 1-Hop vs. 4-Hop Reasoning

| Scenario | 1-Hop Query (What standard DBs do) | 4-Hop Graph Traversal (CompanyMind Power) |
| :--- | :--- | :--- |
| **Service Deprecation** | Shows direct callers of `auth-v1`. | Traces `mobile-checkout → payments-api → api-gateway → auth-v1`, while linking backward to `RFC-102`, `Q3 Arch Review`, and the approving CTO. |
| **PR Governance** | Shows the file modified in the PR. | Detects that the modified auth header violates `Decision DEC-88` passed in last week's Security All-Hands. |
| **Expertise Finder** | Shows who submitted the latest commit. | Weighted ranking based on RFC authorship, PR merges, and incident triage history. |

---

## 📄 License
This project is licensed under the Apache 2.0 License.
