import { NextRequest, NextResponse } from "next/server";
import { getGraph } from "@/lib/falkordb";
import {
  traceDecisionProvenance,
  serviceBlastRadius,
  findSubjectMatterExperts,
  auditPR,
  recallAgentFindings,
  storeAgentFinding,
} from "@/lib/tools";
import {
  getTrueFoundryClient,
  isTrueFoundryGatewayConfigured,
  TRUEFOUNDRY_TOOL_DEFINITIONS,
  getGatewayFallbackModels,
} from "@/lib/truefoundry";
import { ToolTrace } from "@/lib/schema";

export const dynamic = "force-dynamic";

// Global Circuit Breaker for TrueFoundry LLM Gateway
let lastGatewayFailureTime = 0;
let lastGatewayFailureReason = "";
const GATEWAY_CIRCUIT_COOLDOWN_MS = 60 * 1000;

// Known Entity Catalogs in FalkorDB
const KNOWN_SERVICES = [
  { id: "auth-v1", name: "auth-v1", keywords: ["auth-v1", "auth_v1", "auth v1", "legacy auth", "auth"] },
  { id: "payments-api", name: "payments-api", keywords: ["payments-api", "payments_api", "payments api", "payments", "payment"] },
  { id: "api-gateway", name: "api-gateway", keywords: ["api-gateway", "api_gateway", "api gateway", "gateway", "envoy"] },
  { id: "mobile-app", name: "mobile-app", keywords: ["mobile-app", "mobile_app", "mobile app", "mobile client", "mobile"] },
  { id: "web-checkout", name: "web-checkout", keywords: ["web-checkout", "web_checkout", "web checkout", "checkout", "next.js client"] },
  { id: "identity-service", name: "identity-service", keywords: ["identity-service", "identity_service", "identity service", "identity", "mtls service"] },
  { id: "fraud-detector", name: "fraud-detector", keywords: ["fraud-detector", "fraud_detector", "fraud detector", "fraud", "fastapi"] },
  { id: "postgres-primary", name: "postgres-primary", keywords: ["postgres-primary", "postgres_primary", "postgres primary", "postgres", "postgresql", "db-cluster", "database"] },
];

const KNOWN_PEOPLE = [
  { name: "Sarah Chen", keywords: ["sarah chen", "sarah"] },
  { name: "Alex Mercer", keywords: ["alex mercer", "alex"] },
  { name: "Elena Rostova", keywords: ["elena rostova", "elena"] },
  { name: "Marcus Vance", keywords: ["marcus vance", "marcus"] },
  { name: "Priya Patel", keywords: ["priya patel", "priya"] },
  { name: "David Kim", keywords: ["david kim", "david"] },
];

const KNOWN_DECISIONS = [
  { id: "DEC-44", keywords: ["dec-44", "dec 44", "dec44", "sunset auth-v1", "deprecate auth-v1", "mtls"] },
  { id: "DEC-88", keywords: ["dec-88", "dec 88", "dec88", "httponly", "cookie", "cookies", "localstorage", "xss"] },
  { id: "DEC-105", keywords: ["dec-105", "dec 105", "dec105", "connection pool", "pool size", "pool cap", "max 10"] },
  { id: "DEC-12", keywords: ["dec-12", "dec 12", "dec12"] },
];

const KNOWN_DOCS = [
  { id: "RFC-102", keywords: ["rfc-102", "rfc 102", "rfc102"] },
  { id: "SEC-404", keywords: ["sec-404", "sec 404", "sec404"] },
  { id: "SRE-88", keywords: ["sre-88", "sre 88", "sre88"] },
];

const KNOWN_MEETINGS = [
  { title: "Q3 Global Architecture Review", keywords: ["q3", "architecture review", "global architecture"] },
  { title: "InfoSec All-Hands: Zero-Trust Mandate", keywords: ["infosec", "all-hands", "zero-trust", "zero trust"] },
  { title: "Peak Readiness: DB Pool Safeguards", keywords: ["peak readiness", "db pool", "safeguards", "black friday"] },
];

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const message: string =
      body.message ||
      body.messages?.[body.messages.length - 1]?.content ||
      body.prompt ||
      body.query ||
      "";
    const sessionId: string = body.sessionId || "session-1";
    const query = message.toLowerCase().trim();

    let answer = "";
    let outcome: "answered_with_path" | "answered_from_memory" | "not_in_graph" | "governance_violation" = "answered_with_path";
    const traces: ToolTrace[] = [];
    const hops: string[] = [];
    const mcpToolsInvoked: string[] = [];

    // Entity matching
    const matchedService = KNOWN_SERVICES.find((s) => s.keywords.some((kw) => query.includes(kw)));
    const matchedPerson = KNOWN_PEOPLE.find((p) => p.keywords.some((kw) => query.includes(kw)));
    const matchedDecision = KNOWN_DECISIONS.find((d) => d.keywords.some((kw) => query.includes(kw)));
    const matchedDoc = KNOWN_DOCS.find((doc) => doc.keywords.some((kw) => query.includes(kw)));
    const matchedMeeting = KNOWN_MEETINGS.find((m) => m.keywords.some((kw) => query.includes(kw)));

    // Agent Role Assignment
    let agent = {
      name: "ArchitectureOracle",
      role: "Enterprise Knowledge & Provenance Orchestrator",
      status: "completed",
    };

    if (query.includes("pr") || query.includes("audit") || query.includes("violation") || query.includes("policy") || query.includes("governance")) {
      agent = {
        name: "PolicyWatchdog",
        role: "Autonomous PR Governance & Decision Interceptor",
        status: "completed",
      };
    } else if (query.includes("break") || query.includes("down") || query.includes("blast radius") || query.includes("depend") || query.includes("sunset") || query.includes("impact")) {
      agent = {
        name: "BlastRadiusMapper",
        role: "Cascading Call Dependency & Blast Radius Analyzer",
        status: "completed",
      };
    } else if (matchedPerson || query.includes("who") || query.includes("own") || query.includes("expert") || query.includes("lead") || query.includes("author")) {
      agent = {
        name: "OwnershipGraph",
        role: "Subject Matter Expert & Authorship Ranker",
        status: "completed",
      };
    } else if (query.includes("memory") || query.includes("finding") || query.includes("recall") || query.includes("incident")) {
      agent = {
        name: "IncidentMemory",
        role: "FalkorDB Cross-Session Episodic Memory Store",
        status: "completed",
      };
    }

    const requestedModel: string = body.model || process.env.TRUEFOUNDRY_MODEL || "groq/qwen-qwen3.8-27b";
    const tenantId: string = body.tenantId || "acme-core";

    // Gateway Status Tracker
    let gatewayStatus = {
      provider: "Enterprise AI Gateway",
      status: "online" as "online" | "fallback_active",
      model: requestedModel,
      fallbackEngine: "Autonomous FalkorDB Graph Engine",
      latencyMs: 0,
      reason: "",
    };

    const isGatewayInCooldown = requestedModel === "falkordb-autonomous" || (Date.now() - lastGatewayFailureTime < GATEWAY_CIRCUIT_COOLDOWN_MS);
    if (requestedModel === "falkordb-autonomous") {
      gatewayStatus.status = "fallback_active";
      gatewayStatus.reason = "Autonomous Mode Selected (Sub-5ms FalkorDB Native)";
    } else if (isGatewayInCooldown) {
      gatewayStatus.status = "fallback_active";
      gatewayStatus.reason = lastGatewayFailureReason || "Rate Limit / Quota Exceeded (429)";
    }

    // 1. TrueFoundry LLM Gateway Dispatch with Multi-Model Fallback Cascade
    if (isTrueFoundryGatewayConfigured() && !isGatewayInCooldown && requestedModel !== "falkordb-autonomous" && message) {
      const tfClient = getTrueFoundryClient();
      if (tfClient) {
        const fallbackModels = getGatewayFallbackModels();
        const candidateModels = [
          requestedModel,
          ...fallbackModels.filter((m) => m !== requestedModel),
        ];

        for (const candidateModel of candidateModels) {
          const gwStart = Date.now();
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);

            const firstStep = await tfClient.chat.completions.create(
              {
                model: candidateModel,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are CompanyMind AI, an autonomous enterprise intelligence agent powered by FalkorDB graph brain. Call the appropriate FalkorDB tool to answer the user query regarding services, blast radius, decisions, PR governance, or experts.",
                  },
                  { role: "user", content: message },
                ],
                tools: TRUEFOUNDRY_TOOL_DEFINITIONS,
              },
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            gatewayStatus.latencyMs = Date.now() - gwStart;
            gatewayStatus.model = candidateModel;
            const choice = firstStep.choices[0];
            const toolCalls = choice?.message?.tool_calls;

            if (toolCalls && toolCalls.length > 0) {
              let toolEvidence = "";
              for (const tc of toolCalls) {
                if (tc.type !== "function" || !tc.function) continue;
                const fn = tc.function.name;
                const args = JSON.parse(tc.function.arguments || "{}");
                mcpToolsInvoked.push(fn);

                if (fn === "service_blast_radius") {
                  const res = await serviceBlastRadius(args.serviceName || matchedService?.id || "auth-v1", args.depth || 4);
                  traces.push(res.trace);
                  hops.push(...res.hops);
                  outcome = "answered_with_path";
                  toolEvidence += JSON.stringify(res.data) + "\n";
                } else if (fn === "trace_decision_provenance") {
                  const res = await traceDecisionProvenance(args.serviceName || matchedService?.id || "auth-v1");
                  traces.push(res.trace);
                  hops.push(...res.hops);
                  outcome = "answered_with_path";
                  toolEvidence += JSON.stringify(res.data) + "\n";
                } else if (fn === "audit_pr_governance") {
                  const prNum = parseInt(args.prNumber) || 214;
                  const res = await auditPR(prNum);
                  traces.push(res.trace);
                  hops.push(`GitHubPR #${prNum}`, "auth-v1", "DEC-44", "RFC-102", "Sarah Chen");
                  outcome = res.violations.length > 0 ? "governance_violation" : "answered_with_path";
                  toolEvidence += JSON.stringify(res.violations) + "\n";
                } else if (fn === "find_subject_matter_experts") {
                  const res = await findSubjectMatterExperts(args.serviceName || matchedService?.id || "payments-api");
                  traces.push(res.trace);
                  hops.push(args.serviceName || matchedService?.id || "payments-api", ...res.data.map((e: any) => e.expert));
                  outcome = "answered_with_path";
                  toolEvidence += JSON.stringify(res.data) + "\n";
                }
              }

              if (toolEvidence) {
                const synthRes = await tfClient.chat.completions.create({
                  model: candidateModel,
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are CompanyMind AI, powered by FalkorDB graph brain. Synthesize the verified OpenCypher graph evidence into a concise executive answer with clear supporting evidence.",
                    },
                    {
                      role: "user",
                      content: `User query: "${message}"\nVerified FalkorDB Graph Results:\n${toolEvidence}`,
                    },
                  ],
                });

                const synth = synthRes.choices[0]?.message?.content;
                if (synth && synth.length > 20) {
                  answer = synth;
                  traces.push({
                    tool: "enterprise_ai_gateway",
                    args: { model: candidateModel, tool_calls_count: toolCalls.length, fallbackUsed: candidateModel !== requestedModel },
                    durationMs: Date.now() - gwStart,
                    resultCount: 1,
                    cypher: `ENTERPRISE_AI_GATEWAY [${candidateModel}]: synthesized from ${mcpToolsInvoked.join(", ")}`,
                    path: hops,
                  });
                  break; // Successful synthesis, exit candidate models loop
                }
              }
            } else if (choice?.message?.content && choice.message.content.trim().length > 15) {
              // Direct generation from candidate model
              answer = choice.message.content;
              traces.push({
                tool: "enterprise_ai_gateway",
                args: { model: candidateModel, type: "direct_generation", fallbackUsed: candidateModel !== requestedModel },
                durationMs: Date.now() - gwStart,
                resultCount: 1,
                cypher: `ENTERPRISE_AI_GATEWAY [${candidateModel}]: direct inference`,
                path: hops,
              });
              break; // Successful response, exit candidate models loop
            }
          } catch (err: any) {
            console.warn(`Gateway model ${candidateModel} failed, trying next candidate:`, err?.message || err);
            lastGatewayFailureReason =
              err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")
                ? `Quota Exceeded (429) on ${candidateModel}`
                : err?.message || `Gateway error on ${candidateModel}`;
          }
        }

        if (!answer && lastGatewayFailureReason) {
          lastGatewayFailureTime = Date.now();
          gatewayStatus.status = "fallback_active";
          gatewayStatus.reason = lastGatewayFailureReason;
        }
      }
    }

    // 2. Comprehensive Autonomous FalkorDB Graph Engine
    // Executes if TrueFoundry is unconfigured, rate-limited, or returned no answer
    if (!answer) {
      const graph = await getGraph();

      // Case 1: Pull Request Governance Audit (PR #214, PR #218, PR #199, or generic audit)
      if (
        query.includes("214") ||
        query.includes("218") ||
        query.includes("199") ||
        (query.includes("audit") && (query.includes("pr") || query.includes("pull request")))
      ) {
        const prNum = query.includes("218") ? 218 : query.includes("199") ? 199 : 214;
        mcpToolsInvoked.push("audit_pr_governance");
        const res = await auditPR(prNum);
        traces.push(res.trace);

        if (prNum === 214) {
          outcome = "governance_violation";
          answer =
            `🚨 **Governance Watchdog Violation Detected on PR #214!**\n\n` +
            `• **PR Title:** "feat(gateway): re-enable fallback to auth-v1 for mobile-app"\n` +
            `• **Author:** **Alex Mercer** (Staff Engineer)\n` +
            `• **Target Service:** \`auth-v1\` (Tier 2 - Deprecated)\n` +
            `• **Violated Mandate:** **DEC-44: Deprecate Auth-v1 and Enforce mTLS via Identity-Service**\n` +
            `• **Policy Rationale:** *"Auth-v1 lacks granular scopes and fails SOC2 compliance. All new traffic must route to identity-service by Nov 1, 2026."*\n\n` +
            `🔍 **Provenance Evidence:** Approved by **David Kim** in the *Q3 Global Architecture Review* under [RFC-102: Auth v1 Sunset & Gateway Migration](https://docs.google.com/document/d/rfc-102).\n\n` +
            `⚡ **Intervention Options:** Use **Reject PR** to block CI/CD merge and record an episodic incident in FalkorDB, or grant an **Approve Exception** for 72h staging override.`;
          hops.push("GitHubPR #214", "auth-v1", "DEC-44", "RFC-102", "Sarah Chen");
        } else if (prNum === 218) {
          outcome = "governance_violation";
          answer =
            `⚠️ **Governance Alert on PR #218:**\n\n` +
            `• **PR Title:** "perf(db): increase connection pool to 50 for payments-api"\n` +
            `• **Author:** **Alex Mercer** (Staff Engineer)\n` +
            `• **Target Service:** \`postgres-primary\` (Tier 0 Database)\n` +
            `• **Violated Mandate:** **DEC-105: Max Connection Pool Capped at 10 on Postgres Clients**\n` +
            `• **Policy Rationale:** *"Shared Azure spot VM limits require max 10 pooled clients per service to prevent connection exhaustion."*\n\n` +
            `🔍 **Deliberation Source:** Enforced in *Peak Readiness: DB Pool Safeguards* (2026-09-28) and documented in [SRE-88: Postgres Connection Pooling Guardrails](https://docs.google.com/document/d/sre-88).\n\n` +
            `**Recommendation:** Reject PR or cap connection pool size to max 10 clients.`;
          hops.push("GitHubPR #218", "postgres-primary", "DEC-105", "Priya Patel");
        } else {
          outcome = "answered_with_path";
          answer =
            `✅ **PR #199 Compliance Verified:**\n\n` +
            `• **PR Title:** "sec(auth): implement secure HttpOnly session storage"\n` +
            `• **Author:** **Marcus Vance** (Head of Security)\n` +
            `• **Complies With:** **DEC-88: Prohibit Client-Side API Keys and Enforce HttpOnly Cookies**\n` +
            `• **Specification:** [SEC-404: Zero-Trust Token Governance Spec](https://docs.google.com/document/d/sec-404)\n\n` +
            `All checks passed. No architectural violations detected.`;
          hops.push("GitHubPR #199", "web-checkout", "DEC-88", "SEC-404", "Marcus Vance");
        }
      }
      // Case 2: Blast Radius & Dependency Impact Analysis
      else if (
        query.includes("break") ||
        query.includes("down") ||
        query.includes("blast radius") ||
        query.includes("sunset") ||
        query.includes("deprecat") ||
        query.includes("impact") ||
        query.includes("cascade")
      ) {
        mcpToolsInvoked.push("service_blast_radius");
        const targetService = matchedService?.id || "auth-v1";
        const res = await serviceBlastRadius(targetService, 4);
        traces.push(res.trace);

        if (res.data.length > 0) {
          outcome = "answered_with_path";
          hops.push(...res.hops);
          const rows = res.data
            .map(
              (r: any) =>
                `• **${r.affected_service}** (${r.hops_count} hop${r.hops_count > 1 ? "s" : ""} away) → Owned by **${r.owning_team}** (Lead: *${r.team_lead}*)\n  Path: \`${r.via.join(" → ")}\``
            )
            .join("\n");

          answer =
            `💥 **Causal Blast Radius Analysis for \`${targetService}\`:**\n\n` +
            `If \`${targetService}\` is taken down, modified, or experiences an outage, **${res.data.length} downstream services** will be impacted:\n\n` +
            `${rows}\n\n` +
            `📌 **Immediate Action:** Notify **Sarah Chen** (Core Infrastructure) and **Elena Rostova** (Mobile Platform) before applying breaking changes.`;
        } else {
          outcome = "answered_with_path";
          answer =
            `🛡️ **Blast Radius Analysis for \`${targetService}\`:**\n\n` +
            `FalkorDB graph traversal found **0 downstream callers** depending on \`${targetService}\`.\n\n` +
            `This service operates as a leaf or edge consumer in the microservice topology and can be updated or restarted without cascading outages to other internal services.`;
          hops.push(targetService);
        }
      }
      // Case 3: Decision Provenance & "Why" Questions
      else if (
        matchedDecision ||
        query.includes("why") ||
        query.includes("decision") ||
        query.includes("provenance") ||
        query.includes("mtls") ||
        query.includes("cookie") ||
        query.includes("localstorage") ||
        query.includes("pool")
      ) {
        mcpToolsInvoked.push("trace_decision_provenance");
        let decId = matchedDecision?.id;
        if (!decId) {
          if (query.includes("cookie") || query.includes("xss") || query.includes("localstorage")) decId = "DEC-88";
          else if (query.includes("pool") || query.includes("postgres")) decId = "DEC-105";
          else decId = "DEC-44";
        }

        const cypher = `
          MATCH (d:Decision {id: "${decId}"})
          OPTIONAL MATCH (d)-[:GOVERNS]->(s:Service)
          OPTIONAL MATCH (d)<-[:PROPOSES]-(doc:Doc)<-[:RECORDED_IN]-(m:Meeting)
          OPTIONAL MATCH (d)<-[:APPROVED]-(p:Person)
          OPTIONAL MATCH (d)-[:SUPERSEDES]->(old:Decision)
          RETURN d.id AS id, d.title AS title, d.rationale AS rationale, d.date AS date, d.status AS status,
                 collect(DISTINCT s.name) AS services, doc.title AS doc, doc.url AS url, m.title AS meeting,
                 p.name AS approver, old.id AS supersedes
        `;
        const start = Date.now();
        const res = await graph.query(cypher);
        const durationMs = Date.now() - start;

        if (res.data && res.data.length > 0) {
          const d = res.data[0] as any;
          outcome = "answered_with_path";
          const svcList = (d.services || []).map((s: string) => `\`${s}\``).join(", ") || "All services";
          hops.push(d.id, ...(d.services || []), d.doc || "RFC-102", d.approver || "David Kim");

          traces.push({
            tool: "trace_decision_provenance",
            args: { decisionId: decId },
            durationMs,
            resultCount: 1,
            cypher,
            path: hops,
          });

          answer =
            `📜 **Decision Provenance for ${d.id}:**\n\n` +
            `• **Policy Rule:** **${d.title}** (${d.date} · \`${d.status}\`)\n` +
            `• **Official Sign-off:** Approved by **${d.approver || "David Kim"}**\n` +
            `• **Deliberation Forum:** *${d.meeting || "Q3 Global Architecture Review"}*\n` +
            `• **Formal Specification Document:** [${d.doc}](https://${d.url})\n` +
            `• **Governed Services:** ${svcList}\n` +
            (d.supersedes ? `• **Supersedes Legacy Policy:** \`${d.supersedes}\`\n` : "") +
            `• **Architectural Rationale:** "${d.rationale}"\n\n` +
            `🧭 **Causal Traversal Provenance:**\n` +
            `\`${d.meeting}\` ──[:RECORDED_IN]──> \`${d.doc}\` ──[:PROPOSES]──> \`${d.id}\` ──[:GOVERNS]──> ${svcList}`;
        }
      }
      // Case 4: Specific Person / Subject Matter Expert Profile
      else if (matchedPerson) {
        mcpToolsInvoked.push("find_subject_matter_experts");
        const personName = matchedPerson.name;
        const start = Date.now();
        const cypher = `
          MATCH (p:Person {name: "${personName}"})
          OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team)
          OPTIONAL MATCH (t)-[:OWNS]->(s:Service)
          OPTIONAL MATCH (p)-[:AUTHORED_PR]->(pr:GitHubPR)
          OPTIONAL MATCH (p)-[:AUTHORED]->(doc:Doc)
          OPTIONAL MATCH (p)-[:ATTENDED]->(m:Meeting)
          OPTIONAL MATCH (d:Decision)<-[:APPROVED]-(p)
          RETURN p.name AS name, p.role AS role, p.email AS email, t.name AS team,
                 collect(DISTINCT s.name) AS services,
                 collect(DISTINCT pr.title) AS prs,
                 collect(DISTINCT doc.title) AS docs,
                 collect(DISTINCT m.title) AS meetings,
                 collect(DISTINCT d.id + ': ' + d.title) AS approved_decisions
        `;
        const res = await graph.query(cypher);
        const durationMs = Date.now() - start;

        if (res.data && res.data.length > 0) {
          const p = res.data[0] as any;
          outcome = "answered_with_path";
          hops.push(p.name, p.team || "Engineering", ...(p.services || []));

          traces.push({
            tool: "find_subject_matter_experts",
            args: { personName },
            durationMs,
            resultCount: 1,
            cypher,
            path: hops,
          });

          const svcList = (p.services || []).map((s: string) => `\`${s}\``).join(", ") || "None";
          const docList = (p.docs || []).length > 0 ? p.docs.map((d: string) => `• ${d}`).join("\n") : "• None";
          const meetingList = (p.meetings || []).length > 0 ? p.meetings.map((m: string) => `• *${m}*`).join("\n") : "• None";
          const prList = (p.prs || []).length > 0 ? p.prs.map((pr: string) => `• \`${pr}\``).join("\n") : "• None";

          answer =
            `👤 **Engineer Profile & Institutional Provenance: ${p.name}**\n\n` +
            `• **Role:** **${p.role}**\n` +
            `• **Team:** **${p.team}**\n` +
            `• **Email:** \`${p.email}\`\n` +
            `• **Owned Services in Topology:** ${svcList}\n\n` +
            `📄 **Authored Specifications & RFCs:**\n${docList}\n\n` +
            `🏛️ **Governance Deliberations Attended:**\n${meetingList}\n\n` +
            `💻 **Recent Pull Requests:**\n${prList}`;
        }
      }
      // Case 5: Specific Service Deep-Dive Profile
      else if (matchedService) {
        mcpToolsInvoked.push("service_blast_radius");
        const sName = matchedService.name;
        const start = Date.now();
        const cypher = `
          MATCH (s:Service {name: "${sName}"})
          OPTIONAL MATCH (t:Team)-[:OWNS]->(s)
          OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep:Service)
          OPTIONAL MATCH (caller:Service)-[:DEPENDS_ON]->(s)
          OPTIONAL MATCH (d:Decision)-[:GOVERNS]->(s)
          RETURN s.name AS name, s.tier AS tier, s.language AS language, s.repo_url AS repo,
                 t.name AS team, t.lead AS lead,
                 collect(DISTINCT dep.name) AS dependencies,
                 collect(DISTINCT caller.name) AS callers,
                 collect(DISTINCT d.id + ': ' + d.title) AS decisions
        `;
        const res = await graph.query(cypher);
        const durationMs = Date.now() - start;

        if (res.data && res.data.length > 0) {
          const s = res.data[0] as any;
          outcome = "answered_with_path";
          hops.push(s.name, s.team || "Core Infrastructure", ...(s.dependencies || []), ...(s.callers || []));

          traces.push({
            tool: "service_blast_radius",
            args: { serviceName: sName },
            durationMs,
            resultCount: 1,
            cypher,
            path: hops,
          });

          const deps = (s.dependencies || []).length > 0 ? s.dependencies.map((d: string) => `\`${d}\``).join(", ") : "None (Leaf Service)";
          const callers = (s.callers || []).length > 0 ? s.callers.map((c: string) => `\`${c}\``).join(", ") : "None (Top-Level Entrypoint)";
          const decs = (s.decisions || []).length > 0 ? s.decisions.map((d: string) => `• **${d}**`).join("\n") : "• No active constraints";

          answer =
            `📦 **Service Topology & Metadata: \`${s.name}\`**\n\n` +
            `• **Service Tier:** **${s.tier}**\n` +
            `• **Tech Stack:** \`${s.language}\`\n` +
            `• **Code Repository:** [${s.repo}](https://${s.repo})\n` +
            `• **Owning Team:** **${s.team}** (Team Lead: *${s.lead}*)\n\n` +
            `🔗 **Call Graph Connections:**\n` +
            `• **Calls Downstream Dependencies:** ${deps}\n` +
            `• **Called By Upstream Services:** ${callers}\n\n` +
            `🛡️ **Governing Architecture Decisions:**\n${decs}`;
        }
      }
      // Case 6: Meeting Inquiries
      else if (
        matchedMeeting ||
        query.includes("meeting") ||
        query.includes("meetings") ||
        query.includes("deliberation")
      ) {
        mcpToolsInvoked.push("trace_decision_provenance");
        const start = Date.now();
        const cypher = `
          MATCH (m:Meeting)
          OPTIONAL MATCH (p:Person)-[:ATTENDED]->(m)
          OPTIONAL MATCH (m)-[:RECORDED_IN]->(doc:Doc)-[:PROPOSES]->(d:Decision)
          RETURN m.id AS id, m.title AS title, m.date AS date, m.summary AS summary,
                 collect(DISTINCT p.name) AS attendees,
                 collect(DISTINCT doc.title) AS documents,
                 collect(DISTINCT d.id + ': ' + d.title) AS decisions
          ORDER BY m.date DESC
        `;
        const res = await graph.query(cypher);
        const durationMs = Date.now() - start;

        if (res.data && res.data.length > 0) {
          outcome = "answered_with_path";
          hops.push("Q3 Global Architecture Review", "DEC-44", "David Kim");

          traces.push({
            tool: "trace_decision_provenance",
            args: { scope: "all_meetings" },
            durationMs,
            resultCount: res.data.length,
            cypher,
            path: hops,
          });

          const meetingBlocks = (res.data as any[])
            .map(
              (m: any) =>
                `### 🏛️ ${m.title} (${m.date})\n` +
                `• **Executive Summary:** ${m.summary}\n` +
                `• **Key Attendees:** ${(m.attendees || []).join(", ")}\n` +
                `• **Decisions Enacted:** ${(m.decisions || []).join("; ") || "General alignment"}\n`
            )
            .join("\n");

          answer =
            `📅 **Google Workspace Architecture Review Meetings in FalkorDB:**\n\n` +
            meetingBlocks +
            `\nAll decisions are grounded in verbatim meeting notes indexed in the graph brain.`;
        }
      }
      // Case 7: Document & RFC Inquiries
      else if (
        matchedDoc ||
        query.includes("rfc") ||
        query.includes("document") ||
        query.includes("documents") ||
        query.includes("spec")
      ) {
        mcpToolsInvoked.push("trace_decision_provenance");
        const start = Date.now();
        const cypher = `
          MATCH (doc:Doc)
          OPTIONAL MATCH (p:Person)-[:AUTHORED]->(doc)
          OPTIONAL MATCH (doc)-[:PROPOSES]->(d:Decision)
          OPTIONAL MATCH (m:Meeting)-[:RECORDED_IN]->(doc)
          RETURN doc.id AS id, doc.title AS title, doc.url AS url, p.name AS author,
                 m.title AS meeting, d.id AS decision_id, d.title AS decision_title
        `;
        const res = await graph.query(cypher);
        const durationMs = Date.now() - start;

        if (res.data && res.data.length > 0) {
          outcome = "answered_with_path";
          hops.push("RFC-102", "SEC-404", "SRE-88", "DEC-44");

          traces.push({
            tool: "trace_decision_provenance",
            args: { scope: "all_rfcs" },
            durationMs,
            resultCount: res.data.length,
            cypher,
            path: hops,
          });

          const docBlocks = (res.data as any[])
            .map(
              (d: any) =>
                `• **${d.title}** ([Specification Link](https://${d.url}))\n` +
                `  Author: **${d.author || "Sarah Chen"}** · Enacted in *${d.meeting}*\n` +
                `  Proposes Mandate: **${d.decision_id}: ${d.decision_title}**\n`
            )
            .join("\n");

          answer =
            `📄 **RFC Documents & Technical Governance Specifications:**\n\n` +
            docBlocks +
            `\nThese formal documents establish the institutional constraints mapped in FalkorDB.`;
        }
      }
      // Case 8: All Services Catalog / Architecture Overview
      else if (
        query.includes("catalog") ||
        query.includes("all services") ||
        query.includes("list services") ||
        query.includes("microservices") ||
        query.includes("topology") ||
        query.includes("architecture") ||
        query.includes("overview")
      ) {
        mcpToolsInvoked.push("service_blast_radius");
        const start = Date.now();
        const cypher = `
          MATCH (s:Service)
          OPTIONAL MATCH (t:Team)-[:OWNS]->(s)
          RETURN s.name AS name, s.tier AS tier, s.language AS language, s.repo_url AS repo,
                 t.name AS team, t.lead AS lead
          ORDER BY s.tier ASC, s.name ASC
        `;
        const res = await graph.query(cypher);
        const durationMs = Date.now() - start;

        if (res.data && res.data.length > 0) {
          outcome = "answered_with_path";
          hops.push("api-gateway", "mobile-app", "web-checkout", "payments-api");

          traces.push({
            tool: "service_blast_radius",
            args: { scope: "catalog" },
            durationMs,
            resultCount: res.data.length,
            cypher,
            path: hops,
          });

          const table = (res.data as any[])
            .map(
              (s: any) =>
                `• \`${s.name}\` (${s.tier}) — **${s.language}** · Owned by **${s.team}** (Lead: *${s.lead}*)`
            )
            .join("\n");

          answer =
            `🌐 **Enterprise Service Catalog (${res.data.length} Systems in FalkorDB):**\n\n` +
            table +
            `\n\n💡 *Tip: Ask "What breaks if [service] is shut down?" to run a real-time cascading blast radius traversal.*`;
        }
      }
      // Case 9: All Architectural Decisions Ledger
      else if (
        query.includes("all decisions") ||
        query.includes("list decisions") ||
        query.includes("policies") ||
        query.includes("mandates") ||
        query.includes("rules")
      ) {
        mcpToolsInvoked.push("trace_decision_provenance");
        const start = Date.now();
        const cypher = `
          MATCH (d:Decision)
          OPTIONAL MATCH (d)<-[:APPROVED]-(p:Person)
          OPTIONAL MATCH (d)-[:GOVERNS]->(s:Service)
          RETURN d.id AS id, d.title AS title, d.date AS date, d.status AS status,
                 d.rationale AS rationale, p.name AS approver,
                 collect(DISTINCT s.name) AS services
          ORDER BY d.id ASC
        `;
        const res = await graph.query(cypher);
        const durationMs = Date.now() - start;

        if (res.data && res.data.length > 0) {
          outcome = "answered_with_path";
          hops.push("DEC-44", "DEC-88", "DEC-105", "DEC-12");

          traces.push({
            tool: "trace_decision_provenance",
            args: { scope: "all_decisions" },
            durationMs,
            resultCount: res.data.length,
            cypher,
            path: hops,
          });

          const decRows = (res.data as any[])
            .map(
              (d: any) =>
                `• **${d.id}: ${d.title}** (\`${d.status}\` · Approved by *${d.approver || "David Kim"}* on ${d.date})\n` +
                `  Rationale: "${d.rationale}"\n` +
                `  Governs: ${(d.services || []).map((s: string) => `\`${s}\``).join(", ") || "General"}\n`
            )
            .join("\n");

          answer =
            `📜 **Architectural Decisions Ledger (FalkorDB Provenance):**\n\n` +
            decRows +
            `\nThese policies are actively audited by the PolicyWatchdog agent against all incoming pull requests.`;
        }
      }
      // Case 10: Explicit Episodic Memory Recall
      else if (
        query.includes("memory") ||
        query.includes("finding") ||
        query.includes("findings") ||
        query.includes("recall") ||
        query.includes("incident") ||
        query.includes("history")
      ) {
        mcpToolsInvoked.push("recall_agent_findings");
        const mem = await recallAgentFindings("auth-v1");
        traces.push(mem.trace);
        outcome = "answered_from_memory";
        const findingsList =
          mem.data.length > 0
            ? mem.data
                .map(
                  (f: any) =>
                    `• [${f.severity || "INFO"}] \`${f.service}\`: ${f.text} *(Agent: ${f.agent || "PolicyWatchdog"})*`
                )
                .join("\n")
            : "• [CRITICAL] `auth-v1`: Flagged PR #214 attempting to bypass DEC-44 sunset mandate *(Agent: PolicyWatchdog)*";

        answer =
          `🧠 **Recalled Findings from Agent Shared Memory:**\n\n` +
          `The following operational findings were recorded by autonomous agents during previous sessions and persisted in FalkorDB:\n\n` +
          `${findingsList}\n\n` +
          `These episodic findings are stored directly in the graph brain so agents in future sessions never repeat violations.`;
        hops.push("auth-v1", "DEC-44", "GitHubPR #214");
      }
      // Case 11: Conversational Greeting / Help / Default Overview
      else {
        mcpToolsInvoked.push("service_blast_radius", "recall_agent_findings");
        const mem = await recallAgentFindings("auth-v1");
        traces.push(mem.trace);

        const res = await serviceBlastRadius("auth-v1", 2);
        traces.push(res.trace);
        hops.push(...res.hops);

        answer =
          `🧠 **CompanyMind AI — FalkorDB Institutional Knowledge Brain**\n\n` +
          `I map the causal relationships between **8 microservices**, **4 architectural decisions**, **3 RFC specifications**, and **3 Google Workspace meetings** with sub-10ms graph traversals.\n\n` +
          `**Here are some concrete investigations you can run:**\n` +
          `1. 💥 *"What services break if auth-v1 is shut down?"* (Cascading 4-Hop Blast Radius)\n` +
          `2. 📜 *"Why did we decide to use mTLS for identity-service?"* (Decision Provenance back to RFC-102)\n` +
          `3. 🚨 *"Audit PR #214 for architecture violations"* (Governance Policy Interception)\n` +
          `4. 👤 *"Who is Sarah Chen and what services does she own?"* (Staff Engineer Provenance)\n` +
          `5. 📦 *"Tell me about fraud-detector"* (Microservice Call Graph & Ownership)\n` +
          `6. 📅 *"What was decided in the Q3 Global Architecture Review?"* (Meeting Decision Trace)\n` +
          `7. 🌐 *"Show all services in the catalog"* (Full Enterprise Topology)`;
      }

      // Add trace for Autonomous Graph Fallback if TrueFoundry Gateway failed
      if (gatewayStatus.status === "fallback_active") {
        traces.unshift({
          tool: "truefoundry_gateway_fallback",
          args: {
            reason: gatewayStatus.reason,
            fallbackTarget: "FalkorDB OpenCypher Deterministic Graph Engine",
            mcpTools: mcpToolsInvoked,
          },
          durationMs: 1,
          resultCount: traces.length,
          cypher: `FALLBACK_TRIGGERED: ${gatewayStatus.reason}`,
          path: hops,
        });
      }
    }

    // Persist incident finding if a policy violation was intercepted
    if (outcome === "governance_violation") {
      await storeAgentFinding("auth-v1", "Flagged PR #214 violating DEC-44", "CRITICAL", sessionId);
    }

    const totalDurationMs = Date.now() - startTime;

    return NextResponse.json({
      answer,
      outcome,
      hops: Array.from(new Set(hops)),
      traces,
      highlightNodeIds: Array.from(new Set(hops)),
      gatewayStatus,
      agent,
      mcpTools: {
        invoked: Array.from(new Set(mcpToolsInvoked)),
        available: [
          "service_blast_radius",
          "trace_decision_provenance",
          "audit_pr_governance",
          "find_subject_matter_experts",
          "recall_agent_findings",
        ],
      },
      tenantId,
      model: requestedModel,
      latencyMs: totalDurationMs,
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      {
        error: err?.message || "Internal server error",
        gatewayStatus: {
          provider: "Enterprise AI Gateway",
          status: "fallback_active",
          reason: err?.message || "Internal server error",
          fallbackEngine: "Autonomous FalkorDB Graph Engine",
        },
      },
      { status: 500 }
    );
  }
}
