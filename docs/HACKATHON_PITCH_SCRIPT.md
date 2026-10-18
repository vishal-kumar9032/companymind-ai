# 🎬 The Winning Hackathon Pitch & Video Script
### Project: **CompanyMind AI — Autonomous Company Brain & Multi-Agent Harness on FalkorDB**
### Competition: *Graph Hacks: Context for AI Agents* (WeMakeDevs & FalkorDB)
### Target Length: **2 Minutes 45 Seconds** (The Goldilocks zone for hackathon judges)

---

## 🎙️ Recording Instructions
* **Screen Resolution:** 1080p (1920x1080) or 2K.
* **Audio:** Crisp microphone, quiet room. Speak with confidence, moderate pace, and enthusiasm.
* **Browser:** Chrome/Edge fullscreen (`F11`), zoom set to 100% or 110% so text is easy to read on mobile.
* **URL:** Have `http://localhost:13050` open and seeded.

---

## ⏱️ Section-by-Section Script

---

### [0:00 – 0:30] The Hook & The Fatal Flaw of Vector RAG
**On Screen:**
* Start on the **Executive Intelligence Hub** dashboard.
* Move cursor over the live telemetry metrics: `FalkorDB Cluster: Online`, `36 Graph Entities`, `61 Causal Relations`, `2 ms Latency`.

**What to Say:**
> *"Hi judges! Every engineering organization has the exact same problem: institutional knowledge is fragmented. Architecture decisions sit in Google Docs, PRs on GitHub, microservice dependencies in code, and agreements in meeting transcripts.*
>
> *Today, companies try to solve this with Vector Search RAG. **And Vector RAG fails.** Why? Because vector embeddings can only find semantic similarity — they cannot trace multi-hop causality, and they cannot calculate blast radiuses.*
>
> *This is **CompanyMind AI** — an autonomous Company Brain and Multi-Agent Harness built entirely on **FalkorDB**, designed to give AI agents deep, connected context that executes in sub-2 milliseconds with zero hallucination."*

---

### [0:30 – 1:15] Track 1: Agents Acting on Connected Data
**On Screen:**
* Click the **"Ask AI & Graph Oracle"** tab in the sidebar.
* In the top bar or starter cards, click **"Analyze Blast Radius"** (or type: `What happens if auth-v1 goes down?`).
* Watch the agent loop stream the execution steps live:
  1. `Invoked MCP Tool: service_blast_radius`
  2. `Traversed Cypher path: mobile-checkout -> payments-api -> api-gateway -> auth-v1`
  3. `Citations: [RFC-102], [DEC-44]`
* Click the button: **"Light Up Nodes in FalkorDB Graph"**.
* The Cytoscape graph canvas smoothly animates and highlights the exact 4-hop path in glowing colors.

**What to Say:**
> *"Let's look at **Track 1: Agents That Act on Connected Data**.*
>
> *When an engineer asks: 'What happens if `auth-v1` is deprecated or experiences an outage?' — a standard database requires complex recursive SQL joins that explode in latency.*
>
> *CompanyMind calls our OpenCypher tool inside FalkorDB. In just **2 milliseconds**, it traverses a 4-hop causal path: from `mobile-checkout` through `payments-api` and `api-gateway` down to `auth-v1`.*
>
> *Notice what happens next: the agent doesn't just guess an answer — it cites exact document provenance: `[RFC-102]` and `Decision DEC-44`, complete with the meeting where CTO Alex Morgan approved it.*
>
> *With one click, we light up the exact nodes on our interactive FalkorDB Cytoscape canvas, giving engineers immediate visual proof."*

---

### [1:15 – 1:55] Track 3: The Dynamic Company Brain (Document Ingestion Engine)
**On Screen:**
* Click on **"Documents & Files"** in the sidebar.
* Show the clean dropzone and stats: `Indexed Documents`, `FalkorDB Chunks`, `12+ Formats Supported`.
* Drag-and-drop or select an architectural document (e.g. `architecture-spec.md` or a PDF/Excel file).
* Watch the green status appear: `✓ architecture-spec.md: successfully indexed (16 entities extracted)`.
* Click **"Ask Agent"** next to the newly uploaded document.

**What to Say:**
> *"Now let's explore **Track 3: Company Brain**.*
>
> *A company brain can't be static — it must absorb new knowledge continuously. We built a full-stack **Document Ingestion Engine** that takes PDF, Word, Excel sheets, CSV, and Markdown.*
>
> *When you drop a new document, CompanyMind doesn't just store raw text. Our pipeline parses the document and automatically extracts `:Decision`, `:Service`, `:Person`, and `:Concept` nodes directly into FalkorDB, linking them with `:DEFINES`, `:DOCUMENTS`, and `:GOVERNS` relationships.*
>
> *The agent instantly has full prompt context and graph traversal capabilities over your newly uploaded documents, ready to answer questions and detect policy contradictions."*

---

### [1:55 – 2:30] Track 2: Agent Memory & Multi-Agent Coordination
**On Screen:**
* Click on the **"Agent Workforce"** tab in the sidebar.
* Show the 4 specialized agents: **Orchestrator**, **Researcher**, **Governance Watchdog**, and **Scribe**.
* Scroll to the **PR Governance Watchdog Interceptor**: show a pull request violating `DEC-88` (auth header change).
* Show the **Human-in-the-Loop** checkpoint card: `Approve` or `Reject`.
* Switch to the **"Episodic Memory"** tab: show the shared memory ledger where findings are persisted as `:Memory` nodes across sessions.

**What to Say:**
> *"Next is **Track 2: Agent Memory and Coordination**.*
>
> *Single-agent systems get overwhelmed. CompanyMind deploys a collaborative workforce:*
> 1. *An **Orchestrator** that plans multi-turn goals.*
> 2. *A **Researcher** that navigates the graph and external tools.*
> 3. *A **Governance Watchdog** that audits PRs against corporate policies.*
> 4. *A **Scribe** that drafts actions.*
>
> *Here, our PR Watchdog detects that PR #412 modifies an authorization header, violating Decision `DEC-88` passed in last week's Security Review. It halts execution and triggers an atomic **Human-in-the-Loop Approval**.*
>
> *Crucially, all agent findings are committed as `:Memory` nodes in FalkorDB. This gives the entire workforce persistent episodic and semantic memory across sessions, completely eliminating context window bloat."*

---

### [2:30 – 2:45] Architecture & Closing Impact
**On Screen:**
* Flash the **Knowledge Graph Explorer** full-screen view (showing the rich multi-cluster network).
* Switch to the clean GitHub repository page.

**What to Say:**
> *"CompanyMind AI is built with FalkorDB's in-memory C engine, Next.js 15, TrueFoundry LLM gateway, and Cytoscape.js, featuring full per-tenant graph isolation.*
>
> *By combining multi-hop reasoning, shared episodic memory, and a dynamic company brain, CompanyMind proves why graphs are the missing foundation for enterprise AI agents.*
>
> *All code is open-source and live on GitHub. Thank you!"*

---

## 🎯 60-Second Elevator Pitch (For Live Judge Q&A or Interviews)

If a judge asks: *"Give me the 1-minute summary of what you built and why FalkorDB is required":*

> *"Traditional enterprise AI relies on vector search RAG, which fails because vector embeddings cannot follow causal chains — if Service A depends on Service B which depends on Service C, vector search can't calculate that blast radius.*
>
> *We built **CompanyMind AI**, an autonomous Company Brain and Multi-Agent Harness powered by **FalkorDB**.*
>
> *FalkorDB performs three critical jobs:*
> 1. *It runs sub-2ms multi-hop OpenCypher traversals to calculate outage blast radiuses and trace architectural decision provenance back to meeting transcripts.*
> 2. *It acts as the shared episodic and semantic memory layer for 4 collaborative agents, allowing them to coordinate handoffs and persist findings across sessions.*
> 3. *It dynamically extracts entities and causal edges from uploaded PDFs, Word docs, and spreadsheets.*
>
> *Without FalkorDB, this product simply cannot function. The graph isn't decoration — it is the context engine the entire system runs on."*

---

## 🛡️ Judge Defense: Answers to Tough Questions

### Q1: *"Why couldn't you just use Neo4j or Postgres with pgvector?"*
**Answer:**
> *"Two reasons: **Speed and Memory Architecture**. Neo4j's JVM overhead adds significant latency for agent loops that call graph tools multiple times per turn. FalkorDB is built in C on top of Redis, executing graph traversals in **sub-2ms**. That speed makes multi-step agent reasoning feel instantaneous. And unlike pgvector, which only does cosine similarity on text chunks, FalkorDB executes graph algorithms like PageRank, betweenness centrality, and shortest path natively as agent tools."*

### Q2: *"How do you handle multi-tenancy and data isolation?"*
**Answer:**
> *"Every authenticated user or organization receives their own isolated FalkorDB graph namespace (`org_<tenant_id>`), verified through Firebase server-side JWTs. Tenants cannot query or cross-pollinate into another organization's graph, ensuring strict enterprise data boundary compliance."*

### Q3: *"How does the agent know which graph query to write?"*
**Answer:**
> *"We provide the agent with parameterized Cypher tools (`service_blast_radius`, `trace_decision_provenance`, `shortest_path`, `audit_pr_governance`) for deterministic, high-speed operations. For ad-hoc queries, the agent first calls `graph_schema` to inspect exact labels and relations, and then executes a sandboxed read-only `graph_query` (`GRAPH.RO_QUERY`)."*

### Q4: *"What happens if an external LLM fails or hits rate limits?"*
**Answer:**
> *"We built an automated circuit breaker with a fallback cascade: TrueFoundry routes from Gemini 3.1 Flash-Lite to Groq Qwen 27B, and if all cloud providers fail, our Autonomous FalkorDB Fallback Engine synthesizes direct Cypher results locally with zero downtime."*
