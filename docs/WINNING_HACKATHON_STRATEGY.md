# 🏆 CompanyMind AI — Winning Submission Blueprint
### *Graph Hacks: Context for AI Agents* (WeMakeDevs & FalkorDB Hackathon)

---

## 🎯 1. The Tri-Track Strategy (Enter All 3 Tracks)
The official rules state:
> *"The challenge is open-ended within the three tracks... You may enter any or all of them, and you must name every track you are entering when you submit."*

By entering **all 3 tracks**, you maximize your chances of winning across the **$20,000 prize pool**:

| Track | Prize | How CompanyMind AI Dominates It |
| :--- | :--- | :--- |
| **Track 01: Agents That Act on Connected Data** | **iPhone 18 Pro** | • **Sub-2ms Multi-Hop Cypher Traversals** (`DEPENDS_ON*1..4` blast radius).<br>• **Graph algorithms as agent tools**: PageRank, Betweenness Centrality, Community Detection, Shortest Path.<br>• **Autonomous PR Governance Watchdog**: Intercepts breaking PRs before merge with OpenCypher proofs.<br>• **Remote MCP Tools** with live execution telemetry. |
| **Track 02: Agent Memory and Coordination** | **PS5 with GTA VI** | • **Persistent Shared Graph Memory**: Episodic, Semantic, and Procedural memory stored as `:Memory` nodes in FalkorDB.<br>• **Specialist Agent Coordination**: Orchestrator delegates to Researcher, Governance Watchdog, and Scribe, tracking state via `:Task` and `:AgentRun` nodes.<br>• **Per-Tenant Graph Isolation**: Every user gets an isolated graph (`org_<uid>`).<br>• **Atomic Human-in-the-Loop Approvals** (`:Approval` nodes). |
| **Track 03: Company Brain (Primary)** | **M6 Mac Mini** | • **Unified Corporate Knowledge Graph**: Links microservices, decisions, Google Docs RFCs, meeting notes, PRs, and engineers.<br>• **Multi-Format Document Ingestion Engine**: Automatically parses PDF, Word, Excel, CSV, and Markdown into FalkorDB entities and relationships (`:DEFINES`, `:DOCUMENTS`, `:AUTHORED`, `:GOVERNS`).<br>• **Zero-Hallucination Citations**: Every answer provides clickable source provenance (`[RFC-102]`, `[DEC-44]`). |
| **Side Prize: Best Blog Post** | **AirPods 5** | • A published deep-dive blog post titled *"How We Built an Autonomous Company Brain with FalkorDB & Multi-Agent Memory"*. |

---

## 📋 2. What Judges Look For (And Why We Win)

Judges evaluate submissions against one core question:
> **"Does the graph do real work, or is it just decoration?"**

In the video and README, you must highlight the **"Why Vector RAG & SQL Fail"** principle:
1. **Vector RAG fails:** Text embeddings cannot follow causal chains or compute variable-depth blast radiuses (`Service A -> Service B -> Service C`).
2. **SQL fails:** Recursive joins across dynamic entity relationships require unmaintainable, slow multi-table joins.
3. **FalkorDB wins:** In-memory C-based Redis graph engine executes 4-hop causal traversals in **sub-2ms** with exact OpenCypher proofs.

---

## 🎬 3. The 2-to-3 Minute Video Demo Script

> [!IMPORTANT]
> The video is the single most influential asset for hackathon judges. Keep it fast-paced, crisp, and demonstrate live product features with sound on.

### Minute 0:00 – 0:35: The Hook & The Problem
* **Visual:** Open on the CompanyMind AI Executive Intelligence Hub. Show the live FalkorDB metrics (36 entities, 61 relations, 2ms latency).
* **Voiceover:**
  > *"Meet CompanyMind AI — the autonomous Company Brain and Multi-Agent Harness built on FalkorDB. In fast-moving engineering teams, knowledge lives in silos: architecture decisions in Google Docs, PRs on GitHub, service dependencies in code, and meeting agreements in transcripts. Vector search fails because embeddings cannot traverse multi-hop causal chains. CompanyMind solves this by putting corporate memory into an in-memory FalkorDB knowledge graph."*

### Minute 0:35 – 1:20: Track 1 & Track 3 (Connected Data & Company Brain)
* **Visual:**
  1. Click **"Analyze Blast Radius"** in the top header or Ask AI.
  2. Watch the agent loop stream Cypher tool calls in real-time, compute the 4-hop blast radius of `auth-v1`, and return verifiable citations (`[RFC-102]`, `[DEC-44]`).
  3. Click **"Light Up Nodes in FalkorDB Graph"** to reveal the Cytoscape canvas lighting up the exact dependency path.
  4. Navigate to **"Documents & Files"**, drag-and-drop an architectural document (`architecture-spec.md` or PDF), and watch FalkorDB instantly create `:Decision`, `:Service`, and `:Concept` nodes.
* **Voiceover:**
  > *"When an engineer asks what breaks if `auth-v1` is shut down, CompanyMind executes OpenCypher graph traversals in 2ms, tracing from payments-api to checkout and citing the approving CTO. With our new Document Ingestion engine, you can drop any PDF, Word spec, or spreadsheet, and FalkorDB immediately extracts entities, links governing policies, and injects context into the agent."*

### Minute 1:20 – 2:05: Track 2 (Agent Memory & Coordination)
* **Visual:**
  1. Switch to **"Agent Workforce"** tab. Show the 4 specialized agents: Orchestrator, Researcher, Governance Watchdog, Scribe.
  2. Show the MCP tool telemetry stream and PR Watchdog intercepting a non-compliant pull request violating Decision `DEC-88`.
  3. Show the **"Episodic Memory"** tab with persistent findings stored as `:Memory` nodes across sessions.
  4. Demonstrate the Human-in-the-Loop approval modal for write actions.
* **Voiceover:**
  > *"For Track 2, CompanyMind features persistent episodic, semantic, and procedural memory in FalkorDB. When our Governance Watchdog detects a pull request that violates an architectural decision, it flags the violation and queues an atomic Human-in-the-Loop approval. If an agent discovers a new dependency, it commits a `:Memory` node to FalkorDB so future sessions retain that context without context window bloat."*

### Minute 2:05 – 2:30: Architecture & Wrap-Up
* **Visual:** Flash the Mermaid architecture diagram from the README, show the clean light Enterprise Slate UI, and conclude with the live GitHub repo.
* **Voiceover:**
  > *"Built with FalkorDB, Next.js 15, TrueFoundry LLM gateway, and Cytoscape.js. CompanyMind AI enters Track 1, Track 2, and Track 3 of Graph Hacks. Try the live demo at our repo. Thank you!"*

---

## 📝 4. Submission Form Text (Copy-Paste Ready)

When filling out the submission on `https://www.wemakedevs.org/hackathons/falkordb`:

### Project Name
`CompanyMind AI — Autonomous Company Brain & Multi-Agent Harness on FalkorDB`

### Short Description (1–2 sentences)
`An autonomous multi-agent workforce and institutional memory engine that unifies microservices, RFCs, GitHub PRs, and document knowledge into FalkorDB, executing sub-2ms multi-hop traversals with zero-hallucination citations.`

### Tracks Entered
`Track 01: Agents That Act on Connected Data, Track 02: Agent Memory and Coordination, Track 03: Company Brain`

### GitHub Repository
`https://github.com/vishal-kumar9032/companymind-ai` (Branch: `feat/connectors-memory` or merged to `main`)

### Live Demo URL
`http://<your-vm-ip-or-domain>:13050` (or Vercel / Railway deployment)

### Video Demo Link
`https://youtu.be/...` (or Loom / Google Drive link set to public view)

### Project Overview & Technical Write-Up
```markdown
### What We Built
CompanyMind AI is an enterprise multi-agent harness and institutional knowledge graph powered by FalkorDB. It solves the critical limitation of modern enterprise AI: vector embeddings cannot trace multi-hop causality, and relational SQL cannot handle variable-depth graph traversals.

### How FalkorDB is Used
FalkorDB is the foundational context and memory layer of CompanyMind AI:
1. **Multi-Hop Traversal Engine:** Executes parameterised OpenCypher queries in sub-2ms to calculate 4-hop blast radiuses (`(:Service)-[:DEPENDS_ON*1..4]->(:Service)`), decision provenance, and subject matter expert rankings.
2. **Graph Algorithms as Agent Tools:** Exposes PageRank, betweenness centrality (single points of failure), and shortest-path graph algorithms directly to the LLM agent loop.
3. **Institutional Episodic & Semantic Memory:** Stores cross-session findings, agent handoffs (`:Task`), and execution traces (`:AgentRun`) directly as graph nodes.
4. **Document Knowledge Ingestion:** Automatically ingests multi-format documents (PDF, DOCX, XLSX, CSV, MD), chunks text with full-text indexing (`db.idx.fulltext.createNodeIndex`), and extracts `:Decision`, `:Service`, `:Person`, and `:Concept` entities with causal edges (`:DEFINES`, `:DOCUMENTS`, `:AUTHORED`, `:GOVERNS`).
5. **Per-Tenant Graph Isolation:** Every authenticated organization gets an isolated FalkorDB graph (`org_<uid>`), ensuring strict multi-tenant boundary compliance.
```

---

## ✍️ 5. Side Prize: 1-Click Blog Post Draft (AirPods 5)

Publish this post on **Dev.to**, **Hashnode**, or **Medium** with tags `#falkordb`, `#ai`, `#hackathon`, `#graphdb`:

* **Title:** *How We Built an Autonomous Company Brain & Multi-Agent Memory Engine with FalkorDB*
* **Key Talking Points:**
  1. Why traditional RAG (vector search) fails at enterprise architecture questions.
  2. How FalkorDB's in-memory C Redis graph delivers sub-2ms Cypher traversals.
  3. Graph algorithms as agent tools: PageRank and betweenness centrality.
  4. Multi-agent coordination: Orchestrator, Researcher, Governance Watchdog, and Scribe sharing memory nodes.
  5. The interactive Cytoscape visualization and document upload pipeline.
* **Link:** Include your GitHub repository and YouTube video demo link at the end!
