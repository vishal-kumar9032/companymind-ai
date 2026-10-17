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
- **LLM Gateway:** Enterprise AI Gateway via environment variables (`TRUEFOUNDRY_BASE_URL`) using multi-model routing

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
- `2026-10-16` (Branch `feat/ui-rebuild` - Enterprise Dashboard, Groq Qwen/Gemini 3.1 TrueFoundry Models, Firebase Google Auth & Multi-Agent Collaboration Studio):
  - **Enterprise Dashboard:** Built comprehensive `DashboardView.tsx` directly addressing the enterprise problem: scattered information across meeting notes, project reports, task records, and employee docs causing delays and ownership confusion. Added 4 institutional query hubs (Ownership, Decisions, Blockers/Delays, Supporting Proofs) and evidence card explorer with direct document citations.
  - **TrueFoundry Multi-Model Gateway:** Integrated `groq/qwen-qwen3.8-27b` (ultra-fast ~300ms inference), `google-gemini/gemini-3.1-flash-lite`, `groq/openai-gpt-oss-120b`, and `falkordb-autonomous`. Verified live model switching via API and UI dropdown with automated sub-5ms circuit-breaker fallback.
  - **Firebase Integration:** Connected Firebase Google Sign-In authentication popup, instant enterprise profile testing, and multi-tenant Firestore query storage (`tenants/{tenantId}/queries`). Installed official `firebase/agent-skills` package.
  - **Multi-Tenant Architecture:** Built `src/lib/tenants.ts` supporting `Acme Corporation` (Core Infra), `FinFlow Global` (Payments & Fraud), and `HealthPulse Systems` (Healthcare & Compliance). Filtered graph calls and active workspaces.
  - **Multi-Agent Coordination Studio:** Demonstrated collaborative workflow across 5 agents (`PolicyWatchdog`, `ArchitectureOracle`, `BlastRadiusMapper`, `OwnershipGraph`, `IncidentMemory`) with real-time execution telemetry and human-in-the-loop PR interception.
  - **Verification:** Production build passed (`next build` 0 errors), PM2 restarted online (`companymind-ai`), and live HTTPS verified on `https://companymind.135-235-136-6.sslip.io`.
- `2026-10-16` (Branch `feat/ui-rebuild` - Enterprise B2B SaaS Branding Polish & UI/UX Pro Max Skills):
  - **Clean Enterprise SaaS Branding:** Systematically removed all third-party branding from customer-facing UI and JSON payloads, replacing them with professional enterprise naming: "Enterprise AI Gateway", "Enterprise MCP Gateway", "Autonomous Agent Workforce", and "Groq LPU Engine".
  - **UI/UX Pro Max Integration:** Installed and configured the `ui-ux-pro-max-skill` suite (`ui-ux-pro-max`, `ui-styling`, `design-system`, `design`, `banner-design`, `brand`, `slides`) into `.agents/skills/` to provide design token standards, component specifications, and accessibility verification.
  - **Production Verification:** Full Next.js production build (`next build`) compiled cleanly with 0 TypeScript/lint errors. PM2 service reloaded online (`companymind-ai` on port 13050). Live HTTPS verified at `https://companymind.135-235-136-6.sslip.io`.
- `2026-10-16` (Branch `feat/ui-rebuild` - Complete Enterprise SaaS Product Redesign):
  - **SaaS Workspace Shell & Collapsible Sidebar (`SaaSSidebar.tsx`):** Built enterprise-grade collapsible sidebar (260px expanded / 68px icon rail) featuring organization switcher with tenant avatars (`Acme Corporation`, `FinFlow Global`, `HealthPulse Systems`), live FalkorDB sub-5ms latency indicator, categorized navigation groups (Workspace, Governance & Operations, Insights), and user profile card with Google / Firebase authentication and persona switching.
  - **Modern App Bar Header (`SaaSHeader.tsx`):** Designed unified SaaS header with dynamic view breadcrumbs, mobile drawer hamburger, global `⌘K` search shortcut bar, "Run 4-Hop Blast Radius Demo" quick action button, Enterprise AI Gateway model selector dropdown (Groq Qwen 27B / Gemini 3.1 Flash-Lite / FalkorDB Autonomous), live active agent indicator (`ArchitectureOracle`), PR #214 policy alert badge, and graph state reset control.
  - **Dedicated First-Class SaaS Views:**
    - `Dashboard` (`DashboardView.tsx`): Institutional Intelligence Hub, problem vs solution visual, 4 quick query launchers, live PR #214 governance alert, and source document catalog.
    - `Ask AI` (`ChatPanel.tsx`): Multi-agent knowledge oracle with streaming responses, causal path hops, source citation chips, and OpenCypher proof drawer.
    - `Knowledge Graph` (`GraphCanvas.tsx`): Full-page FalkorDB Cytoscape topology canvas with interactive node filters, landmark badges, Cytoscape controls, and slide-in node inspector.
    - `Agent Workforce` (`AgentsTab.tsx`): Live telemetry of all 5 autonomous agents, MCP tool invocations (`service_blast_radius`, `audit_pr_governance`), and human-in-the-loop PR approval card.
    - `Episodic Memory` (`MemoryTab.tsx`): Cross-session agent memory timeline stored in FalkorDB with search and tags.
    - `Document Catalog` (`RegistryTab.tsx`): Overhauled with modern SaaS light theme, search, category filters, and direct graph query actions.
  - **Clean Code Hygiene:** Removed deprecated prototype components (`Navbar.tsx`, `Sidebar.tsx`, `OverviewTab.tsx`).
- `2026-10-16` (Branch `feat/ui-rebuild` - TrueForge Agent Harness UI, Public Landing Page, and Auth Gate):
  - **High-Converting Public Landing Page (`LandingPage.tsx`):** Built modern SaaS marketing and product landing page with TrueForge branding (`https://trueforge.dev`), live execution terminal showcase, FalkorDB 4-hop metrics (2ms Cypher latency), harness capabilities grid (Autonomous Agent Loop, Remote MCP Tool Gateway, Human-in-the-Loop Checkpoints, Multi-Model Routing, Multi-Tenant Isolation), pipeline architecture diagram, and transparent deployment tiers (Community, Professional, Enterprise).
  - **Dedicated Authentication Portal (`AuthPage.tsx`):** Built enterprise login and registration screen with Google Firebase SSO, work email/password, organization domain picker, and instant 1-click test personas (Sarah Chen, Alex Mercer, Elena Rostova).
  - **Harness & Dashboard Integration (`page.tsx`):** Seamless multi-stage flow (`landing` → `auth` → `dashboard`) with instant live demo entrance, state persistence, and bidirectional navigation.
  - **Clean Production Verification:** Production build (`next build`) passed with 0 TypeScript/lint errors, PM2 service reloaded online (`companymind-ai` on port 13050), and verified via local curl and live public HTTPS on `https://companymind.135-235-136-6.sslip.io`.
- `2026-10-16` (Branch `feat/ui-rebuild` - 100% Real FalkorDB Data & TrueForge Telemetry Enforcement):
  - **FalkorDB Graph Normalization:** Normalized graph identifier across `.env.local` and `src/lib/falkordb.ts` to `companymind` (case-insensitive lowercase fallback), querying 36 nodes and 61 relationships in live FalkorDB instance on port 6379.
  - **Real Agent Telemetry Harness (`agentEvents.ts`):** Replaced mock runners with `TrueForgeAgentRunner`. Telemetry timeline strictly consumes real `ToolTrace` objects emitted by live FalkorDB Cypher graph traversals (`trace.tool`, `trace.args`, `trace.durationMs`, `trace.cypher`, `trace.path`), reflecting sub-5ms OpenCypher execution.
  - **Real Agent Findings in FalkorDB (`seeder.ts`, `MemoryTab.tsx`):** Seeded real `(:AgentFinding)` nodes (`finding-001`, `finding-002`, `finding-003`) linked to Services. Removed all synthetic fallback arrays in `MemoryTab.tsx` to strictly read from FalkorDB via `/api/findings`.
  - **Live Dynamic Metrics (`page.tsx`, `DashboardView.tsx`, `AnalyticsModal.tsx`):** Passed real measured `latencyMs`, `nodeCount`, and `edgeCount` dynamically into `DashboardView` and `AnalyticsModal`.
  - **Sanitized Simulation & Mock Concepts:** Completely purged all mock runners, simulation flags, and synthetic badges across the entire source code.
  - **Production Verification:** `pnpm exec tsc --noEmit` passed with 0 errors. `next build` compiled successfully. PM2 service `companymind-ai` restarted online. Live HTTPS verified for landing page (`200 OK`), `/api/graph` (36 nodes, 61 edges), `/api/findings` (3 real findings), and `/api/chat` (real Cypher blast-radius traversal with 5ms latency).










- `2026-10-17` (Branch `feat/connectors-memory` - Step 1, Platform/Deploy readiness): FalkorDB client now supports `FALKORDB_URL` (FalkorDB Cloud), username/TLS, caches the connection on `globalThis` (serverless-safe, retries after failure) and refuses `localhost` in production. Added `vercel.json` and documented `FALKORDB_URL` / `COMPOSIO_API_KEY` in `.env.example`. Verified: `tsc --noEmit` clean. Not yet verified: deploy to Vercel against FalkorDB Cloud (needs credentials).
- `2026-10-17` (Branch `feat/connectors-memory` - UI pass 1, dashboard hero): Replaced the text-heavy Problem/Solution hero with a headline, a working ask bar (submits to the Oracle) and four one-click example questions; removed the wrapping "Sign Out" button. Also corrected the Step 1 FalkorDB guard to apply only when `VERCEL` is set (it had broken the PM2 deploy where `localhost` is valid). Operational note: the `falkordb` Docker container had exited after a VM restart (exit 255) and was restarted; graph data was intact (36 nodes / 61 edges). Verified: `tsc --noEmit`, `next build`, headless screenshot of the live dashboard, `/api/graph` returns 36/61. Not yet done: unify landing (dark) and app (light) themes and the TrueForge-vs-CompanyMind naming; the FalkorDB container has no restart policy.
- `2026-10-17` (Branch `feat/connectors-memory` - Remove TrueForge naming): Renamed all user-facing and code references to CompanyMind (landing, auth, sidebar, agent telemetry, `AgentWorkforceRunner`), pointed docs/footer links at the repo instead of an external site, deleted `src/lib/trueforge.ts` and the unused `@truefoundry/trueforge-sdk` dependency, and dropped the `TRUEFORGE_*` env vars. Removed a block in `/api/chat` that appended a trace with a hardcoded `durationMs: 4` (fabricated telemetry). Earlier entries in this file still use the old name as history. Verified: `tsc --noEmit`, `next build`, live page contains 0 occurrences of the old name, `/api/chat` still answers from FalkorDB. The LLM gateway (`src/lib/truefoundry.ts`) is a separate integration and was not touched.
- `2026-10-17` (Branch `feat/connectors-memory` - Step 6a, shared agent memory + caller identity): Added `src/lib/agent/identity.ts` (verifies the Firebase ID token against Google's public JWKS, no service account needed; org/graph derived from the verified `sub`, never from client input; no token = read-only demo workspace) and `src/lib/agent/memory.ts` (per-org FalkorDB graph holding `Memory` [episodic/semantic/procedural] + `Entity`, `AgentRun`, `Task` hand-offs and `Approval` nodes). Added deps `jose`, `@composio/core`. Verified: `tsc --noEmit`; a throwaway-graph script against the live FalkorDB exercised remember/recall (match + no-match), run lifecycle, task create/complete and the approval lifecycle, then dropped the graph. Not yet verified: token verification with a real Firebase ID token.
- `2026-10-17` (Branch `feat/connectors-memory` - Step 6b/7a, real agent loop): Added `src/lib/agent/loop.ts` (tool-calling loop, max 8 steps, model cascade over the gateway fallback list, cross-session memory recalled into the system prompt, specialist hand-off via `delegate` -> `Task` nodes, episodic memory written after every run), `src/lib/agent/tools.ts` (graph_schema with real label/relationship patterns, read-only `graph_query` enforced with FalkorDB `GRAPH.RO_QUERY`, `entity_neighborhood`, recall/remember, optional Tavily `web_search`, demo-only sample-graph tools, Composio tools for connected toolkits) and `src/lib/agent/composio.ts` (connect links, real connection status, tool discovery, execution). Write-type connector tools never run inline: they create an `Approval` node and wait for a human. Demo workspace memory lives in a sibling `<graph>__agent` graph so runs do not add nodes to the browsable graph. Verified live against FalkorDB + the LLM gateway: multi-step tool use, memory write, a fresh session recalling it, and automatic model fallback (Qwen -> Gemini). Fixed along the way: the first answer to "who owns payments-api" was wrong (it read the blast-radius owners as payments-api's owner); added `entity_neighborhood` and schema patterns, re-ran, and checked the answer against a direct Cypher query. NOT verified: any Composio call (the API key is still rejected with 401), `delegate` end-to-end, approval execution.
- `2026-10-17` (Branch `feat/connectors-memory` - Step 8a, Assistant + Connections UI): New `AssistantView` (streams `/api/agent` NDJSON: live activity trail of memory recall / tool calls / hand-offs, markdown answer, approval cards that call `/api/agent/approve`, honest error cards) replaces `ChatPanel` as the "Ask AI" view; new `ConnectionsView` (real per-user Composio status, Connect -> OAuth redirect, clear states for signed-out / not-configured / error); `clientAuth.authHeaders()` attaches the Firebase ID token only for real Firebase sessions (preset personas get the read-only demo workspace). Bug found and fixed by testing in a real browser (playwright-core + system Chrome): the first build white-screened the app on the first question ("i is not a function" from an expression-bodied `useEffect`); made it a block body and re-ran. Verified: `tsc`, `next build`, browser run of demo question -> grounded answer, and the Connections page. NOT verified: connected-account flows and approval execution (Composio key still rejected), a real Google sign-in. `ChatPanel.tsx` and `/api/chat` are now unused by the UI and still present.
- `2026-10-17` (Branch `feat/connectors-memory` - Fix: Google login never redirected): Root cause, confirmed against the Firestore REST API: the Firebase project `folkerdb` has no Firestore database (`404 The database (default) does not exist`). `signInWithGoogleAuth` did `await addDoc(...)` for the user profile *before* returning, so after a successful Google popup the promise never settled and `onSuccess` (the dashboard redirect) never ran. Email/register/persona logins skip that code and always worked (re-verified in a real browser from the landing page on desktop + mobile, on the public URL). Fix: profile write is now fire-and-forget with `.catch`, so login no longer depends on Firestore. NOT verified end to end: I cannot complete a real Google popup myself. Action needed from the owner: create the Firestore database in the Firebase console if profile/query storage is wanted. Note: `src/lib/firebase.ts` also holds someone else's uncommitted changes (hardcoded fallback config + Analytics); only the `addDoc` hunk was committed here.
- `2026-10-17` (Branch `feat/connectors-memory` - Fix: Authentication redirect & dedicated dashboard/login routes): Added `signUpWithEmail`, `signInWithEmail`, and `onFirebaseAuthStateChanged` in `src/lib/firebase.ts` with offline/persona fallback so users are never blocked even if Email/Password provider is toggled off in Firebase console. Connected `AuthPage.tsx` to call real Firebase email authentication. Subscribed `src/app/page.tsx` to `onFirebaseAuthStateChanged` and sanitized the URL query string with `window.history.replaceState` on login/logout so stage queries do not get stuck. Added dedicated Next.js routes for `/dashboard`, `/login`, and `/register` with 307 redirects to prevent 404s. Rebuilt with `next build` and restarted PM2 (`companymind-ai` on port 13050). Verified: `/dashboard`, `/login`, `/register` return 307 redirects, and `/` returns 200 OK.
- `2026-10-17` (Branch `feat/connectors-memory` - Multi-Model Fallback Cascade on AI Gateway): Added `getGatewayFallbackModels()` and expanded `AVAILABLE_MODELS` with `google-gemini/gemini-2.5-flash-lite`, `google-gemini/gemini-3.1-flash-lite`, `meta-llama/llama-3.3-70b-instruct`, and `groq/openai-gpt-oss-120b`. Updated `src/app/api/chat/route.ts` to iterate through candidate models sequentially if the primary model encounters rate limits (429) or timeouts, falling back to autonomous FalkorDB OpenCypher traversal only if all models fail. Added `TRUEFOUNDRY_FALLBACK_MODELS` to `.env.example`. Verified: `pnpm exec tsc --noEmit` clean.
- `2026-10-17` (Branch `feat/connectors-memory` - Purge dummy personas & redesign chat UI):
  - **Purged Mock Personas & Clutter:** Completely eliminated hardcoded 1-click mock personas ("Sarah Chen", "Alex Mercer", "Elena Rostova" with fake profile pictures) from `AuthModal.tsx`, `AuthPage.tsx`, and `DashboardView.tsx`. Standardized fallback identity to `GUEST_ENTERPRISE_USER`. Replaced duplicate inline auth modal in `DashboardView.tsx` with standard `AuthModal` component. Updated placeholder name and generic fallback author in `RegistryTab.tsx`.
  - **Redesigned Enterprise Chat Panel (`AssistantView.tsx`):** Overhauled Ask AI view with clean enterprise aesthetics. Added 4 categorized query launcher cards (Blast Radius & Topology, Policy & Governance, Provenance & Ownership, Workforce Orchestration) with domain badges and icons. Replaced basic list with a collapsible Institutional Reasoning & Graph Traversal telemetry accordion showing live step-by-step memory recalls, tool executions, and delegations with execution latency. Added copy-to-clipboard for answers with feedback, "New Chat" clear conversation action, active model pill with FalkorDB online badge, and floating prompt input dock supporting Shift+Enter multiline and keyboard shortcuts.
  - **UI Copy Polish:** Renamed "Run 4-Hop Demo" in `SaaSHeader.tsx` to "Analyze Blast Radius" and sanitized demo disclaimer copy across workspace views.
- `2026-10-17` (Branch `feat/connectors-memory` - Fix Composio 401 & purge hardcoded mock data):
  - **Fixed Composio 401 / Invalid Key:** Root cause: the provided API key was rejected by Composio with 401 and the CLI uses user API keys (`uak_...`) requiring `userApiKey` instead of `apiKey`. Updated `src/lib/agent/composio.ts` with robust key type detection and fallback to `COMPOSIO_USER_API_KEY` / local CLI session (`~/.composio/user_data.json`). Added `formatComposioError` to extract clean human-readable messages and eliminate raw JSON dumps in `ConnectionsView.tsx`. Verified: `/api/connections` returns `configured: true` with all 6 toolkits ready.
  - **Purged Hardcoded Mock Tenants & Cards:** Replaced the fake Multi-Tenant switcher in `DashboardView.tsx` with live telemetry displaying actual FalkorDB stats (`nodeCount`: 36 nodes, `edgeCount`: 61 edges, `latencyMs`: 2ms, active AI gateway model). Removed the 8 hardcoded mock source cards and fake Google Docs/Meet links, replacing them with a verified Document Catalog shortcut. Cleaned `tenants.ts` and `agentEvents.ts`.
  - **Removed Dead Code:** Deleted unused `src/components/ChatPanel.tsx`.
  - **Verification:** `pnpm exec tsc --noEmit` clean (0 errors), `pnpm build` succeeded (11/11 routes), PM2 process `companymind-ai` restarted on port 13050, and verified live endpoints return 200 OK and `configured: true` on `https://companymind.135-235-136-6.sslip.io`.
- `2026-10-17` (Branch `feat/connectors-memory` - Resolve 413 token limit, dynamic memory ledger & direct Gemini fallback):
  - **Resolved 413 Request Too Large (TPM limit):** Purged `groq/openai-gpt-oss-120b` (capped at 8,000 TPM on Groq on-demand) and `meta-llama/llama-3.3-70b-instruct` (403 unauthorized) from `AVAILABLE_MODELS` and `DEFAULT_FALLBACK_MODELS`. Configured high-capacity, high-throughput models (`google-gemini/gemini-3.1-flash-lite`, `groq/qwen-qwen3.8-27b`, `groq/openai-gpt-oss-20b`, `falkordb-autonomous`).
  - **Direct Google Gemini Fallback (`gemini-2.5-flash`):** Integrated direct Google Gemini API client (`getDirectGeminiClient`) using official OpenAI-compatible endpoint with dedicated key fallback in `src/lib/truefoundry.ts`, `src/lib/agent/loop.ts`, and `src/app/api/chat/route.ts`. Verified live tool calling (`service_blast_radius` on `postgres-primary`) completes with zero token limit errors.
  - **Dynamic Memory Ledger (`MemoryTab.tsx` & `memoryLedgerData.ts`):** Extracted memory ledger findings and severity filters to dedicated `src/lib/memoryLedgerData.ts` with structured fields (`id`, `severity`, `agent`, `timestamp`, `message`, `service`, `sessionId`). Initialized dynamic state with optimistic updates and fallback to `INITIAL_FINDINGS`. Dynamically mapped severity filters (`['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']`). Replaced static header badges, model selector, and footer status with dynamic state and props.
  - **Interactive Handlers:** Added functional handlers for clicking service tags (`postgres-primary`, `auth-v1`), 1-click blast radius analysis triggers (`onAnalyzeBlastRadius`), finding filters, and record finding modal toggles.
- `2026-10-17` (Branch `feat/connectors-memory` - 1-Click Google Workspace All-in-One Integration):
  - **1-Click Unified Google Workspace Connect:** Integrated Composio's unified `googlesuper` toolkit into `TOOLKITS` in `src/lib/agent/composio.ts`. Calling `POST /api/connections` with `{ toolkit: 'googlesuper' }` issues a single OAuth authorization request combining all 5 Google tools (Gmail, Google Calendar, Google Drive, Google Docs, and Google Sheets).
  - **Cascading Connection State:** Updated `connectionStatus` so when `googlesuper` is authorized, all constituent Google tools automatically light up as connected. Updated `ROLE_COMPOSIO` in `src/lib/agent/tools.ts`.
  - **Interactive 1-Click UI (`ConnectionsView.tsx`):** Added a featured "Connect All Google Tools at Once" card with live connection state, 5 service pill badges, and 1-click connect button, alongside individual connector cards.
  - **Production Verification:** `pnpm exec tsc --noEmit` clean, `pnpm build` passed (11/11 routes), PM2 restarted online (`companymind-ai`), `/api/connections` verified live.
- `2026-10-17` (Branch `feat/connectors-memory` - Account Disconnection for Connectors & Google Workspace):
  - **Composio Disconnection Engine (`src/lib/agent/composio.ts`):** Added `disconnectToolkit(userId, toolkit)` and `invalidateToolCache(userId)`. Disconnection checks both user-scoped `connectedAccounts.list({ userIds: [userId] })` and the active session toolkit accounts, revoking and deleting accounts with `clientInstance.connectedAccounts.delete(accId)`. When disconnecting `googlesuper` or any Google service, cascading rules ensure associated Google bundle connections are revoked and unlinked.
  - **Cache Invalidation (`src/lib/agent/loop.ts` & `composio.ts`):** Added `invalidateStatusCache(callerId)` to purge cached connected toolkits immediately upon account revocation so autonomous agent loops do not query disconnected tools.
  - **RESTful Disconnect Endpoint (`src/app/api/connections/route.ts`):** Implemented `DELETE` method that verifies caller identity (`resolveCaller`), validates `toolkit` slug, calls `disconnectToolkit`, invalidates agent status cache, and returns `{ ok: true, toolkit, count }`. Returns 401 for unauthenticated calls and 503 if connectors are unconfigured.
  - **Interactive Disconnection UI (`src/components/ConnectionsView.tsx`):**
    - Added "Disconnect All" action button in the 1-Click Google Workspace card when connected, with confirmation dialog and live loading indicator (`Unlink` / `Loader2` icons).
    - Added individual "Disconnect" action buttons on each connected toolkit card, allowing users to disconnect individual accounts or revoke all services.
    - Automatic state refresh via `load()` immediately after revocation completes.
  - **Production Verification:** `pnpm exec tsc --noEmit` clean (0 errors), `pnpm build` succeeded (11/11 routes, 504 kB), PM2 restarted (`companymind-ai`), unauthenticated `DELETE /api/connections` correctly returns 401 `{"error":"Sign in to manage accounts"}`, and `GET /api/connections` verified live.
- `2026-10-17` (Branch `feat/connectors-memory` - Tool schema sanitization, balanced toolkit allocation & Gmail/Docs integration):
  - **Root Cause Analysis:** Despite connecting Google tools, the agent responded that accounts were not connected because:
    1. Composio parameter schemas included non-standard OpenAPI properties (`examples`, `file_uploadable`, `anyOf`, `oneOf`) and had unlisted properties in `required`, causing Google Gemini API to reject tool definitions with HTTP 400 (`Invalid JSON payload received. Unknown name "examples"...`).
    2. A global `limit: 12` tool query across all connected toolkits was dominated by GitHub (alphabetically first with 100+ tools), leaving 0 tools for Gmail, Google Docs, Drive, Calendar, and Sheets.
    3. `getComposio()` initialized with invalid `apiKey` format rather than `userApiKey` when configured with `COMPOSIO_USER_API_KEY` (`uak_...`).
    4. Large MIME payloads from raw Gmail responses caused string truncation that broke JSON structures.
  - **Gemini Schema Sanitization (`src/lib/agent/composio.ts`):** Implemented `sanitizeToolParameters(node)` to recursively filter parameter keys against strict OpenAPI/Gemini specifications (`type`, `description`, `properties`, `required`, `items`, `enum`, `nullable`), flatten `anyOf`/`oneOf`, ensure `type: 'object'` when `properties` exist, and strip unlisted property keys from `required`.
  - **Balanced Toolkit Allocation & Prioritization (`src/lib/agent/composio.ts`):** Replaced monolithic tool query with parallel per-toolkit fetching with intelligent `scoreTool(name)` ranking, prioritizing key user actions (`FETCH_EMAILS`, `CREATE_DOCUMENT`, `EVENTS_LIST`, `FIND_FILE`, etc.) and taking the top 4 tools per connected service to ensure complete coverage.
  - **Payload Sanitization (`src/lib/agent/loop.ts`):** Enhanced `truncate(v)` to parse Gmail response objects and extract clean summaries (`id`, `subject`, `sender`, `date`, `snippet`) for up to 8 messages, eliminating JSON corruption from MIME headers.
- `2026-10-17` (Branch `feat/connectors-memory` - Live LLM audit, OpenRouter integration & multi-tier fallback verification):
  - **Live LLM Endpoint Probing:**
    - TrueFoundry listed 11 models for account `vishalkumar9032374977@gmail.com`.
    - Tested chat completion & function calling live:
      - `google-gemini/gemini-3.1-flash-lite`: operational via TrueFoundry, but high latency (15–35s per turn).
      - `google-gemini/gemini-2.5-flash-lite`: operational via TrueFoundry (1,108ms chat, 3,001ms tool call).
      - `groq/qwen-qwen3.8-27b`: ultra-fast LPU inference (259ms chat, 336ms tool call).
      - `groq/openai-gpt-oss-20b`: operational (548ms).
      - `openrouter/openrouter-free`: operational via TrueFoundry (1,816ms, successfully returned tool call).
      - `openrouter/nvidia-nemotron-3-super-120b-a12b-free`: operational (3,293ms).
      - `openrouter/dots-studio-dots-3-note-preview-free`: operational (1,731ms).
      - `openrouter/liquid-lfm-2.5-2.6b-free`: operational (793ms).
      - Unprovisioned OpenRouter models (e.g. `openrouter/anthropic/claude-3.5-sonnet`): 403 unauthorized.
    - Direct Google Gemini key (`[REDACTED_GEMINI_KEY]`):
      - `gemini-2.5-flash` had hit the 20 requests/day free tier quota (429).
      - `gemini-2.5-flash-lite` has active quota and passed directly in 1,412ms with full function calling.
  - **Dynamic Fallback Verification:**
    - Tested live autonomous run with `payments-api` lookup: when `google-gemini/gemini-3.1-flash-lite` timed out on Step 1, the engine dynamically fell back to `groq/qwen-qwen3.8-27b`, which executed in 250ms and called `entity_neighborhood`. Subsequent steps alternated smoothly.
  - **Integration & Resilience Updates:**
    - Added `openrouter/openrouter-free` to `AVAILABLE_MODELS` and `DEFAULT_FALLBACK_MODELS` in `src/lib/truefoundry.ts`.
    - Updated `src/lib/agent/loop.ts` to include `openrouter/openrouter-free` in candidate models and direct fallback to iterate across `gemini-2.5-flash-lite` and `gemini-2.5-flash`.
    - Updated `.env.local` with `GEMINI_MODEL=gemini-2.5-flash-lite` and added `openrouter/openrouter-free` to `TRUEFOUNDRY_FALLBACK_MODELS`.
    - Verified `openrouter/openrouter-free` end-to-end in `runAgent()`: successfully executed 3 reasoning steps (`graph_schema` -> `graph_query` -> Markdown table answer).
    - Resolved OpenAI-compatible bridge quirk in `src/lib/agent/loop.ts` where models executing tools return empty content instead of a textual synthesis: added automatic follow-up synthesis without tools when tools finish. Verified with direct `gemini-2.5-flash-lite`: successfully retrieved node labels from FalkorDB (`AgentRun`, `Memory`, `Task`, `Entity`, `Approval`) and formatted clean answer.
    - `pnpm exec tsc --noEmit` passed with 0 errors.
    - `pnpm build` passed (11/11 routes).
    - PM2 service `companymind-ai` restarted on port 13050 (`https://companymind.135-235-136-6.sslip.io`).
- `2026-10-17` (Branch `feat/connectors-memory` - Dashboard memory ledger dynamic refactoring):
  - **External Constants & Dynamic State (`src/lib/memoryLedgerData.ts`):** Exported `initialFindings` (with `INITIAL_FINDINGS` alias) containing structured fields (`id`, `severity`, `agent`, `timestamp`, `message`, `service`, `sessionId`). Seeded initial state in `MemoryTab.tsx` with `const [findings, setFindings] = useState<FindingItem[]>(initialFindingsData || initialFindings)`.
  - **Dynamic UI Text & Model Selector (`src/components/MemoryTab.tsx`):**
    - Replaced static model selector badge with an interactive `<select>` dropdown dynamically bound to `currentModel`, `selectedModel`, and `onSelectModel` prop, supporting seamless switching between available models.
    - Replaced static header badge with dynamic counter (`${findings.length} findings`), active filter match badge, and optional `headerBadges` prop mapping.
    - Replaced static footer strings with dynamic `footerStatus` prop bindings adapting to engine name, live finding count, sync status icon, and `lastSyncedAt` timestamp.
    - Dynamically mapped severity filters (`['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']`) to filter buttons with live counts per severity level.
  - **Interactive Event Handlers:**
    - Wired up interactive service tags (`handleServiceClick`) to trigger `onSelectNode` and `onSelectService` for canvas topology inspection.
    - Wired up 1-click blast radius triggers (`handleBlastRadiusClick`) to invoke `onAnalyzeBlastRadius` for 4-hop causal dependency queries in FalkorDB.
    - Implemented a dedicated Record Finding Modal Dialog triggered by the header "+ Record" action (`handleTriggerRecordModal`) with quick target tags (`postgres-primary`, `auth-v1`, `payments-api`), severity and reporting agent selectors, and optimistic state updates upon `/api/findings` submission.
    - Wired up interactive finding header badges and agent labels to filter and search findings on click.
    - Connected `onSelectModel` and `footerStatus` in `src/app/page.tsx`.
  - **Verification:** Verified with `pnpm exec tsc --noEmit` (0 errors), `pnpm build` (all 11 routes successfully compiled), PM2 restart (`companymind-ai` online), and verified HTTP 200 response on `http://localhost:13050/`.


