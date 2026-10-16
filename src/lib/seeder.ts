import { getGraph } from "./falkordb";

export async function seedCompanyMindGraph(graphId = "companymind") {
  const graph = await getGraph(graphId);

  // Clear existing graph data cleanly
  try {
    await graph.query("MATCH (n) DETACH DELETE n");
  } catch (e) {
    // If graph doesn't exist yet, continue
  }

  // Helper to run list of single Cypher statements
  const runQueries = async (queries: string[]) => {
    for (const q of queries) {
      const trimmed = q.trim();
      if (trimmed) {
        await graph.query(trimmed);
      }
    }
  };

  // 1. Create Teams
  await runQueries([
    "CREATE (:Team {name: 'Core Infrastructure', department: 'Platform Engineering', lead: 'Sarah Chen'})",
    "CREATE (:Team {name: 'Checkout & Payments', department: 'Product Engineering', lead: 'Alex Mercer'})",
    "CREATE (:Team {name: 'Identity & Security', department: 'InfoSec', lead: 'Marcus Vance'})",
    "CREATE (:Team {name: 'Mobile Platform', department: 'Consumer Apps', lead: 'Elena Rostova'})",
  ]);

  // 2. Create People
  await runQueries([
    "CREATE (:Person {name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'Staff Principal Engineer', team: 'Core Infrastructure'})",
    "CREATE (:Person {name: 'Alex Mercer', email: 'alex.mercer@company.com', role: 'Staff Engineer', team: 'Checkout & Payments'})",
    "CREATE (:Person {name: 'Priya Patel', email: 'priya.patel@company.com', role: 'Senior SRE', team: 'Core Infrastructure'})",
    "CREATE (:Person {name: 'Marcus Vance', email: 'marcus.vance@company.com', role: 'Head of Security & CISO', team: 'Identity & Security'})",
    "CREATE (:Person {name: 'Elena Rostova', email: 'elena.rostova@company.com', role: 'Lead Mobile Architect', team: 'Mobile Platform'})",
    "CREATE (:Person {name: 'David Kim', email: 'david.kim@company.com', role: 'VP of Engineering', team: 'Executive'})",
  ]);

  // Connect People to Teams
  await runQueries([
    "MATCH (p:Person {name: 'Sarah Chen'}), (t:Team {name: 'Core Infrastructure'}) CREATE (p)-[:MEMBER_OF]->(t)",
    "MATCH (p:Person {name: 'Priya Patel'}), (t:Team {name: 'Core Infrastructure'}) CREATE (p)-[:MEMBER_OF]->(t)",
    "MATCH (p:Person {name: 'Alex Mercer'}), (t:Team {name: 'Checkout & Payments'}) CREATE (p)-[:MEMBER_OF]->(t)",
    "MATCH (p:Person {name: 'Marcus Vance'}), (t:Team {name: 'Identity & Security'}) CREATE (p)-[:MEMBER_OF]->(t)",
    "MATCH (p:Person {name: 'Elena Rostova'}), (t:Team {name: 'Mobile Platform'}) CREATE (p)-[:MEMBER_OF]->(t)",
  ]);

  // 3. Create Services (Microservices & Databases)
  await runQueries([
    "CREATE (:Service {name: 'mobile-app', tier: 'Tier 1', repo_url: 'github.com/company/mobile-client', language: 'Kotlin/Swift'})",
    "CREATE (:Service {name: 'web-checkout', tier: 'Tier 1', repo_url: 'github.com/company/web-checkout', language: 'TypeScript/Next.js'})",
    "CREATE (:Service {name: 'payments-api', tier: 'Tier 1', repo_url: 'github.com/company/payments-api', language: 'Go'})",
    "CREATE (:Service {name: 'api-gateway', tier: 'Tier 0', repo_url: 'github.com/company/api-gateway', language: 'Envoy/Rust'})",
    "CREATE (:Service {name: 'auth-v1', tier: 'Tier 2 (Deprecated)', repo_url: 'github.com/company/auth-legacy', language: 'Node.js'})",
    "CREATE (:Service {name: 'identity-service', tier: 'Tier 1', repo_url: 'github.com/company/identity-service', language: 'Go/mTLS'})",
    "CREATE (:Service {name: 'fraud-detector', tier: 'Tier 2', repo_url: 'github.com/company/fraud-detector', language: 'Python/FastAPI'})",
    "CREATE (:Service {name: 'postgres-primary', tier: 'Tier 0', repo_url: 'internal://db-cluster', language: 'PostgreSQL 16'})",
  ]);

  // Connect Services ownership to Teams
  await runQueries([
    "MATCH (t:Team {name: 'Mobile Platform'}), (s:Service {name: 'mobile-app'}) CREATE (t)-[:OWNS]->(s)",
    "MATCH (t:Team {name: 'Checkout & Payments'}), (s:Service {name: 'web-checkout'}) CREATE (t)-[:OWNS]->(s)",
    "MATCH (t:Team {name: 'Checkout & Payments'}), (s:Service {name: 'payments-api'}) CREATE (t)-[:OWNS]->(s)",
    "MATCH (t:Team {name: 'Core Infrastructure'}), (s:Service {name: 'api-gateway'}) CREATE (t)-[:OWNS]->(s)",
    "MATCH (t:Team {name: 'Identity & Security'}), (s:Service {name: 'auth-v1'}) CREATE (t)-[:OWNS]->(s)",
    "MATCH (t:Team {name: 'Identity & Security'}), (s:Service {name: 'identity-service'}) CREATE (t)-[:OWNS]->(s)",
    "MATCH (t:Team {name: 'Checkout & Payments'}), (s:Service {name: 'fraud-detector'}) CREATE (t)-[:OWNS]->(s)",
    "MATCH (t:Team {name: 'Core Infrastructure'}), (s:Service {name: 'postgres-primary'}) CREATE (t)-[:OWNS]->(s)",
  ]);

  // Connect Service Dependencies (Call graph)
  await runQueries([
    "MATCH (m:Service {name: 'mobile-app'}), (gw:Service {name: 'api-gateway'}) CREATE (m)-[:DEPENDS_ON {protocol: 'HTTPS'}]->(gw)",
    "MATCH (w:Service {name: 'web-checkout'}), (gw:Service {name: 'api-gateway'}) CREATE (w)-[:DEPENDS_ON {protocol: 'HTTPS'}]->(gw)",
    "MATCH (gw:Service {name: 'api-gateway'}), (p:Service {name: 'payments-api'}) CREATE (gw)-[:DEPENDS_ON {protocol: 'gRPC'}]->(p)",
    "MATCH (gw:Service {name: 'api-gateway'}), (a:Service {name: 'auth-v1'}) CREATE (gw)-[:DEPENDS_ON {protocol: 'HTTP/REST', deprecated: true}]->(a)",
    "MATCH (p:Service {name: 'payments-api'}), (f:Service {name: 'fraud-detector'}) CREATE (p)-[:DEPENDS_ON {protocol: 'Async'}]->(f)",
    "MATCH (p:Service {name: 'payments-api'}), (i:Service {name: 'identity-service'}) CREATE (p)-[:DEPENDS_ON {protocol: 'mTLS'}]->(i)",
    "MATCH (p:Service {name: 'payments-api'}), (db:Service {name: 'postgres-primary'}) CREATE (p)-[:DEPENDS_ON {protocol: 'TCP Pool'}]->(db)",
    "MATCH (i:Service {name: 'identity-service'}), (db:Service {name: 'postgres-primary'}) CREATE (i)-[:DEPENDS_ON {protocol: 'TCP Pool'}]->(db)",
  ]);

  // 4. Create Google Workspace Meetings
  await runQueries([
    `CREATE (:Meeting {
      id: 'meet-q3-arch', 
      title: 'Q3 Global Architecture Review', 
      date: '2026-08-14', 
      summary: 'Reviewed legacy authentication vulnerabilities and approved sunset of auth-v1 in favor of identity-service.'
    })`,
    `CREATE (:Meeting {
      id: 'meet-sec-allhands', 
      title: 'InfoSec All-Hands: Zero-Trust Mandate', 
      date: '2026-09-02', 
      summary: 'Mandated strict session token isolation; banned token storage in localStorage and unvalidated API keys.'
    })`,
    `CREATE (:Meeting {
      id: 'meet-blackfriday', 
      title: 'Peak Readiness: DB Pool Safeguards', 
      date: '2026-09-28', 
      summary: 'Enforced maximum connection pool size of 10 per service instance on postgres-primary to prevent pool deadlocks.'
    })`,
  ]);

  // Connect People attendance to Meetings
  await runQueries([
    "MATCH (m:Meeting {id: 'meet-q3-arch'}), (p:Person {name: 'Sarah Chen'}) CREATE (p)-[:ATTENDED]->(m)",
    "MATCH (m:Meeting {id: 'meet-q3-arch'}), (p:Person {name: 'David Kim'}) CREATE (p)-[:ATTENDED]->(m)",
    "MATCH (m:Meeting {id: 'meet-q3-arch'}), (p:Person {name: 'Marcus Vance'}) CREATE (p)-[:ATTENDED]->(m)",
    "MATCH (m:Meeting {id: 'meet-sec-allhands'}), (p:Person {name: 'Marcus Vance'}) CREATE (p)-[:ATTENDED]->(m)",
    "MATCH (m:Meeting {id: 'meet-sec-allhands'}), (p:Person {name: 'Alex Mercer'}) CREATE (p)-[:ATTENDED]->(m)",
    "MATCH (m:Meeting {id: 'meet-blackfriday'}), (p:Person {name: 'Priya Patel'}) CREATE (p)-[:ATTENDED]->(m)",
    "MATCH (m:Meeting {id: 'meet-blackfriday'}), (p:Person {name: 'Sarah Chen'}) CREATE (p)-[:ATTENDED]->(m)",
  ]);

  // 5. Create Google Docs / RFCs
  await runQueries([
    `CREATE (:Doc {
      id: 'doc-rfc-102', 
      title: 'RFC-102: Auth v1 Sunset & Gateway Migration', 
      url: 'docs.google.com/document/d/rfc-102', 
      type: 'RFC'
    })`,
    `CREATE (:Doc {
      id: 'doc-sec-404', 
      title: 'SEC-404: Zero-Trust Token Governance Spec', 
      url: 'docs.google.com/document/d/sec-404', 
      type: 'Security Policy'
    })`,
    `CREATE (:Doc {
      id: 'doc-sre-88', 
      title: 'SRE-88: Postgres Connection Pooling Guardrails', 
      url: 'docs.google.com/document/d/sre-88', 
      type: 'Infrastructure Standard'
    })`,
  ]);

  // Connect Meetings to Docs, and Authors to Docs
  await runQueries([
    "MATCH (m:Meeting {id: 'meet-q3-arch'}), (d:Doc {id: 'doc-rfc-102'}) CREATE (m)-[:RECORDED_IN]->(d)",
    "MATCH (p:Person {name: 'Sarah Chen'}), (d:Doc {id: 'doc-rfc-102'}) CREATE (p)-[:AUTHORED]->(d)",
    "MATCH (m:Meeting {id: 'meet-sec-allhands'}), (d:Doc {id: 'doc-sec-404'}) CREATE (m)-[:RECORDED_IN]->(d)",
    "MATCH (p:Person {name: 'Marcus Vance'}), (d:Doc {id: 'doc-sec-404'}) CREATE (p)-[:AUTHORED]->(d)",
    "MATCH (m:Meeting {id: 'meet-blackfriday'}), (d:Doc {id: 'doc-sre-88'}) CREATE (m)-[:RECORDED_IN]->(d)",
    "MATCH (p:Person {name: 'Priya Patel'}), (d:Doc {id: 'doc-sre-88'}) CREATE (p)-[:AUTHORED]->(d)",
  ]);

  // 6. Create Architectural Decisions
  await runQueries([
    `CREATE (:Decision {
      id: 'DEC-44', 
      title: 'Deprecate Auth-v1 and Enforce mTLS via Identity-Service', 
      rationale: 'Auth-v1 lacks granular scopes and fails SOC2 compliance. All new traffic must route to identity-service by Nov 1, 2026.', 
      status: 'ACTIVE', 
      date: '2026-08-15'
    })`,
    `CREATE (:Decision {
      id: 'DEC-88', 
      title: 'Prohibit Client-Side API Keys and Enforce HttpOnly Cookies', 
      rationale: 'Prevents XSS token exfiltration on mobile and web checkout.', 
      status: 'ACTIVE', 
      date: '2026-09-03'
    })`,
    `CREATE (:Decision {
      id: 'DEC-12', 
      title: 'Allow Bearer Tokens in LocalStorage (Legacy)', 
      rationale: 'Temporary stopgap during early MVP phase.', 
      status: 'SUPERSEDED', 
      date: '2024-03-10'
    })`,
    `CREATE (:Decision {
      id: 'DEC-105', 
      title: 'Max Connection Pool Capped at 10 on Postgres Clients', 
      rationale: 'Shared Azure spot VM limits require max 10 pooled clients per service to prevent connection exhaustion.', 
      status: 'ACTIVE', 
      date: '2026-09-29'
    })`,
  ]);

  // Connect Docs to Decisions, Approvers to Decisions, Decisions to Services, and Supersedes
  await runQueries([
    "MATCH (doc:Doc {id: 'doc-rfc-102'}), (dec:Decision {id: 'DEC-44'}) CREATE (doc)-[:PROPOSES]->(dec)",
    "MATCH (p:Person {name: 'David Kim'}), (dec:Decision {id: 'DEC-44'}) CREATE (p)-[:APPROVED]->(dec)",
    "MATCH (dec:Decision {id: 'DEC-44'}), (s:Service {name: 'auth-v1'}) CREATE (dec)-[:GOVERNS]->(s)",
    "MATCH (dec:Decision {id: 'DEC-44'}), (s:Service {name: 'identity-service'}) CREATE (dec)-[:GOVERNS]->(s)",
    "MATCH (doc:Doc {id: 'doc-sec-404'}), (dec:Decision {id: 'DEC-88'}) CREATE (doc)-[:PROPOSES]->(dec)",
    "MATCH (p:Person {name: 'Marcus Vance'}), (dec:Decision {id: 'DEC-88'}) CREATE (p)-[:APPROVED]->(dec)",
    "MATCH (dec:Decision {id: 'DEC-88'}), (s:Service {name: 'web-checkout'}) CREATE (dec)-[:GOVERNS]->(s)",
    "MATCH (dec:Decision {id: 'DEC-88'}), (s:Service {name: 'mobile-app'}) CREATE (dec)-[:GOVERNS]->(s)",
    "MATCH (d88:Decision {id: 'DEC-88'}), (d12:Decision {id: 'DEC-12'}) CREATE (d88)-[:SUPERSEDES]->(d12)",
    "MATCH (doc:Doc {id: 'doc-sre-88'}), (dec:Decision {id: 'DEC-105'}) CREATE (doc)-[:PROPOSES]->(dec)",
    "MATCH (p:Person {name: 'Sarah Chen'}), (dec:Decision {id: 'DEC-105'}) CREATE (p)-[:APPROVED]->(dec)",
    "MATCH (dec:Decision {id: 'DEC-105'}), (s:Service {name: 'postgres-primary'}) CREATE (dec)-[:GOVERNS]->(s)",
  ]);

  // 7. Create GitHub Issues & Pull Requests
  await runQueries([
    `CREATE (:GitHubIssue {
      number: 89, 
      title: '[P0] Sunset auth-v1 legacy endpoints from api-gateway', 
      status: 'IN_PROGRESS', 
      priority: 'CRITICAL'
    })`,
    `CREATE (:GitHubIssue {
      number: 94, 
      title: 'Enforce HttpOnly cookie handling in mobile webview', 
      status: 'COMPLETED', 
      priority: 'HIGH'
    })`,
    `CREATE (:GitHubPR {
      number: 214, 
      title: 'feat(gateway): re-enable fallback to auth-v1 for mobile-app', 
      author: 'Alex Mercer', 
      state: 'OPEN', 
      merged_at: ''
    })`,
    `CREATE (:GitHubPR {
      number: 218, 
      title: 'perf(db): increase connection pool to 50 for payments-api', 
      author: 'Alex Mercer', 
      state: 'OPEN', 
      merged_at: ''
    })`,
    `CREATE (:GitHubPR {
      number: 202, 
      title: 'sec(auth): implement secure HttpOnly session storage', 
      author: 'Elena Rostova', 
      state: 'MERGED', 
      merged_at: '2026-09-15'
    })`,
  ]);

  // Connect Issues to Decisions, PRs to Issues, PRs to Services, and Authors to PRs
  await runQueries([
    "MATCH (iss:GitHubIssue {number: 89}), (dec:Decision {id: 'DEC-44'}) CREATE (iss)-[:TRACKS]->(dec)",
    "MATCH (iss:GitHubIssue {number: 94}), (dec:Decision {id: 'DEC-88'}) CREATE (iss)-[:TRACKS]->(dec)",
    "MATCH (pr:GitHubPR {number: 214}), (s:Service {name: 'auth-v1'}) CREATE (pr)-[:TOUCHES]->(s)",
    "MATCH (pr:GitHubPR {number: 214}), (s:Service {name: 'api-gateway'}) CREATE (pr)-[:TOUCHES]->(s)",
    "MATCH (pr:GitHubPR {number: 214}), (iss:GitHubIssue {number: 89}) CREATE (pr)-[:RESOLVES]->(iss)",
    "MATCH (p:Person {name: 'Alex Mercer'}), (pr:GitHubPR {number: 214}) CREATE (p)-[:AUTHORED_PR]->(pr)",
    "MATCH (pr:GitHubPR {number: 218}), (s:Service {name: 'postgres-primary'}) CREATE (pr)-[:TOUCHES]->(s)",
    "MATCH (pr:GitHubPR {number: 218}), (s:Service {name: 'payments-api'}) CREATE (pr)-[:TOUCHES]->(s)",
    "MATCH (p:Person {name: 'Alex Mercer'}), (pr:GitHubPR {number: 218}) CREATE (p)-[:AUTHORED_PR]->(pr)",
    "MATCH (pr:GitHubPR {number: 202}), (iss:GitHubIssue {number: 94}) CREATE (pr)-[:RESOLVES]->(iss)",
    "MATCH (pr:GitHubPR {number: 202}), (s:Service {name: 'mobile-app'}) CREATE (pr)-[:TOUCHES]->(s)",
    "MATCH (p:Person {name: 'Elena Rostova'}), (pr:GitHubPR {number: 202}) CREATE (p)-[:AUTHORED_PR]->(pr)",
  ]);

  // 8. Create Initial Episodic Agent Memory (Track 2)
  await runQueries([
    `CREATE (:AgentFinding {
      id: 'finding-001',
      text: 'Verified that payments-api has high cyclomatic dependency on auth-v1; scheduled for migration in Sprint 42.',
      at: '2026-10-15 14:30:00',
      session_id: 'session-arch-audit-1',
      severity: 'WARNING'
    })`,
    "MATCH (f:AgentFinding {id: 'finding-001'}), (s:Service {name: 'auth-v1'}) CREATE (f)-[:ABOUT]->(s)",
  ]);

  return { success: true, message: "CompanyMind graph seeded with full enterprise dataset." };
}
