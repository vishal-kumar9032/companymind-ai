# CompanyMind AI — System Build State & Verification Record

## 1. System Overview
- **Project Name:** CompanyMind AI
- **Repository:** `https://github.com/vishal-kumar9032/companymind-ai`
- **Hackathon:** WeMakeDevs Graph Hacks (Powered by FalkorDB)
- **Tracks Targeted:**
  - Track 3: The "Company Brain" / Institutional Knowledge Graph
  - Track 2: Autonomous Agent Memory and Multi-Agent Coordination

---

## 2. Live Deployment
- **Public URL (HTTPS):** `https://companymind.135-235-136-6.sslip.io`
- **Process Manager:** PM2 (`companymind-ai`, process ID 1, port 13050)
- **Reverse Proxy:** Caddy 2 with automatic Let's Encrypt TLS certificate
- **Database Engine:** FalkorDB Docker container (`falkordb/falkordb:latest` on ports 6379 / 3000)
- **LLM Gateway:** TrueFoundry LLM Gateway (`https://vishal9032.truefoundry.cloud/api/llm/v1`) using `google-gemini/gemini-2.5-flash-lite`

---

## 3. Verified Graph Traversals & Latency

### A. 4-Hop Blast Radius
- **Query:** `service_blast_radius("auth-v1", 4)`
- **OpenCypher Query:**
  ```cypher
  MATCH path = (upstream:Service)-[:DEPENDS_ON*1..4]->(target:Service {name: $serviceName})
  OPTIONAL MATCH (upstream)<-[:OWNS]-(t:Team)
  RETURN DISTINCT upstream.name AS affected_service, length(path) AS hops_count,
         t.name AS owning_team, t.lead AS team_lead,
         [n IN nodes(path) | n.name] AS via
  ORDER BY hops_count ASC, affected_service ASC
  ```
- **Execution Latency:** 97ms on FalkorDB
- **Discovered Impact:**
  - `api-gateway` (1 hop) → Core Infrastructure (Sarah Chen)
  - `mobile-app` (2 hops) → Mobile Platform (Elena Rostova)
  - `web-checkout` (2 hops) → Checkout & Payments (Alex Mercer)

### B. PR Governance Watchdog (PR #214 Audit)
- **Query:** `audit_pr_governance(214)`
- **OpenCypher Query:**
  ```cypher
  MATCH (pr:GitHubPR {number: $prNumber})-[:TOUCHES]->(s:Service)<-[:GOVERNS]-(d:Decision)
  OPTIONAL MATCH (d)-[:SUPERSEDES]->(old:Decision)
  RETURN pr.number AS pr_number, pr.title AS pr_title, pr.author AS author,
         s.name AS service_name, s.tier AS service_tier,
         d.id AS decision_id, d.title AS active_rule, d.rationale AS constraint_rationale
  ```
- **Execution Latency:** 3ms on FalkorDB
- **Outcome:** Catches PR #214 by Alex Mercer attempting to modify deprecated `auth-v1`, violating architectural decision `DEC-44`.

### C. Decision Provenance Trace
- **Query:** `trace_decision_provenance("identity-service")`
- **Execution Latency:** 3ms on FalkorDB
- **Outcome:** Traces `identity-service` through DEC-44 to RFC-102 approved by David Kim in the Q3 Global Architecture Review.

---

## 4. Verification History
- `2026-10-16`: Verified production build (`next build` compiled with 0 errors).
- `2026-10-16`: Configured Caddy reverse proxy for `companymind.135-235-136-6.sslip.io` with valid SSL certificate.
- `2026-10-16`: Live public verification completed via HTTPS POST to `/api/chat` and `/api/graph`.
- `2026-10-16`: Enhanced UI architecture with dedicated Overview Landing Page (`OverviewTab.tsx`), Enterprise Registry (`RegistryTab.tsx`), segmented view switcher, category filtering pills on Cytoscape canvas, and technical trace abstraction ("OpenCypher Graph Proof" drawer). PM2 reloaded cleanly.
- `2026-10-16`: Implemented 7-point Hackathon UX overhaul: 3-part layout (Sidebar with synced data sources, Main Stage with Graph/Chat, Collapsible Source Inspector Drawer), interactive source citation chips (`[RFC-102]`, `[DEC-44]`, `[PR-214]`), visible AI stepping state (`FalkorDB → RFC Correlation → TrueFoundry Synthesis`), skeleton loaders, thumbs up/down feedback buttons, suggested follow-ups row, role-based viewing switcher (`Engineering Lead`, `VP Eng`, `New Hire`, `Compliance`), Command Palette (`⌘K`), Knowledge Gaps Analytics modal, and 90-second Alex Mercer onboarding demo walkthrough. Verified on live HTTPS.
- `2026-10-16` (Branch `feat/ui-rebuild` - Step 1): Design tokens, typography (Inter + JetBrains Mono), radial gradient background, surface tokens (1px inner highlight, box-shadow), tailwindcss-animate integration, and slim Navbar with real latency chip ("Connected · 4 ms") and Track chips. Verified with `next build`.
- `2026-10-16` (Branch `feat/ui-rebuild` - Step 2): Implemented react-markdown + remark-gfm rendering (fixing raw asterisks/backticks), word-by-word streaming with Stop generation control, 5-stage live step loader with tick marks and skeleton bars, keyboard shortcuts ('/' to focus, 'Escape' to clear highlights), and accessible typography (14px body, 11px min). Verified with `next build`.
- `2026-10-16` (Branch `feat/ui-rebuild` - Step 3): Rebuilt GraphCanvas with dot-grid canvas, distinct node shapes (diamond Decision, round-square Service, ellipse Person, etc.), landmark labels for top 8 nodes, sequential 300ms path animation with dimming, position caching in localStorage, interactive filter legend, floating replay/clear controls, and slide-in node drawer. Verified with `next build`.
- `2026-10-16` (Branch `feat/ui-rebuild` - Step 4): Specialized outcome cards (`governance_violation` with Accept/Reject PR buttons and FalkorDB policy interception, `answered_with_path` with clickable source cards and arrow hops, `not_in_graph` amber helpful empty state with preset rephrasings, `answered_from_memory` badge). Verified with `next build` and live API tests.
- `2026-10-16` (Branch `feat/ui-rebuild` - Step 5): TrueForge agent telemetry timeline (`AgentsTab.tsx`) with typed adapter (`src/lib/agentEvents.ts`), `ApprovalCard` human-in-the-loop blocking flow with Allow/Deny buttons, FalkorDB cross-session memory timeline (`MemoryTab.tsx`), and persistent `/api/findings` API. Verified with `next build` and live FalkorDB queries.
- `2026-10-16` (Branch `feat/ui-rebuild` - Step 6): Two floating rounded cards layout (7 cols left graph, 5 cols right tabs: Oracle, Agents, Memory), responsive mobile bottom navigation ("Graph | Ask | Agents | Memory"), first-load Hero strip ("Ask why a decision was made, what breaks, or who owns it"), 4 large preset scenario cards, "Play Demo (4-Hop)" with live step-by-step captions, and app icon + favicon assets. Production verified and live at `https://companymind.135-235-136-6.sslip.io`.
- `2026-10-16` (Branch `feat/ui-rebuild` - TrueForge UI Centering): Centered the TrueForge Agent Workbench as the primary view, eliminated the permanent 7-column graph canvas, and added small header toggle buttons ("Process", "Graph", "Memory") that slide out small inspector panels on demand. Verified live on HTTPS.
- `2026-10-16` (Branch `feat/ui-rebuild` - Slide-Over Panels Clean Rebuild): Eliminated clumsy duplicate stacked headers in `AgentsTab` and `MemoryTab`, wrapped all slide-over drawers (`SourceDrawer`, `AgentsTab`, `MemoryTab`, `GraphCanvas`) in proper full-screen backdrop overlays (`bg-black/60 backdrop-blur-sm`) with click-to-dismiss and Escape support, and fixed `SourceDrawer` positioning to slide in smoothly without disrupting flex page flow. Verified with `tsc --noEmit`.
- `2026-10-16` (Branch `feat/ui-rebuild` - Navbar & Command Palette Rebuild): Rebuilt Navbar with clean segmented view toggles (`Process`, `Graph`, `Memory`, `Analytics`), global `⌘K` keyboard shortcut listener, unified command palette with direct panel actions and document searches, and accessible knowledge gaps analytics modal. Verified with `tsc --noEmit`.
- `2026-10-16` (Branch `feat/ui-rebuild` - ChatPanel Clean Polish): Rebuilt `ChatPanel` with a clean, focused Hero state (eliminating the clumsy duplicate mock assistant bubble on first load), sleek response cards with compact evidence source chips, clean causal path breadcrumbs (`auth-v1 → api-gateway → mobile-app`), refined developer OpenCypher proof drawer, and an elevated input bar with single clean footnote. Verified with `tsc --noEmit`.
- `2026-10-16` (Branch `feat/ui-rebuild` - Complete Light Theme & Visual Polish): Overhauled the entire application color scheme from dark to modern, clean light palette (Stripe/Linear-inspired `#f8fafc` canvas, crisp `#ffffff` cards, `#e2e8f0` borders, `#0f172a` slate typography, vibrant `#4f46e5` indigo accents, and soft elevation shadows). Updated Cytoscape graph canvas styling with dark labels, white text outlines, clear edge colors, and light floating controls/legend. Production build (`next build`) compiled with 0 errors. Live PM2 service reloaded.
- `2026-10-16` (Branch `feat/ui-rebuild` - TrueForge MCPs, LLM Gateway Quota Circuit Breaker & Resilient Fallback): Resolved TrueFoundry 429 quota exhaustion delay by implementing an intelligent 60-second gateway circuit breaker and instant deterministic FalkorDB OpenCypher engine fallback (sub-5ms execution). Upgraded `src/app/api/chat/route.ts` to surface multi-agent roles (`PolicyWatchdog`, `ArchitectureOracle`, `BlastRadiusMapper`, `OwnershipGraph`, `IncidentMemory`) and tracked 5 TrueForge MCP tools (`service_blast_radius`, `trace_decision_provenance`, `audit_pr_governance`, `find_subject_matter_experts`, `recall_agent_findings`). Surfaced real-time gateway status pills and MCP badges in Navbar, ChatPanel message headers, and the Agent Telemetry Workbench. Production build verified and PM2 reloaded.
- `2026-10-16` (Branch `feat/ui-rebuild` - Comprehensive Semantic Graph Router & Dynamic Non-Repetitive Responses): Resolved repetitive/canned response issue by expanding the deterministic graph fallback in `src/app/api/chat/route.ts` into a complete semantic router. Directly handles all 8 services (`auth-v1`, `api-gateway`, `mobile-app`, `web-checkout`, `payments-api`, `identity-service`, `fraud-detector`, `postgres-primary`), all 6 engineers (`Sarah Chen`, `Alex Mercer`, `Elena Rostova`, `Marcus Vance`, `Priya Patel`, `David Kim`), all 4 decisions (`DEC-44`, `DEC-88`, `DEC-105`, `DEC-12`), RFCs, architecture review meetings, PRs, catalog requests, and episodic agent memory. Verified via live API testing across distinct queries (`fraud-detector`, `Sarah Chen`, `DEC-88`, `Q3 meeting`, `service catalog`, `blast radius postgres-primary`, `Priya Patel`), confirming dynamic entity-specific responses, accurate graph traversal hops, and sub-5ms latency. Production build passed (`next build` 0 errors) and PM2 reloaded.




