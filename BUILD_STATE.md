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
