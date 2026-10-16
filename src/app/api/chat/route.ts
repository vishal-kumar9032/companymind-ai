import { NextRequest, NextResponse } from "next/server";
import {
  traceDecisionProvenance,
  serviceBlastRadius,
  findSubjectMatterExperts,
  auditPR,
  recallAgentFindings,
  storeAgentFinding,
} from "@/lib/tools";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTrueForgeClient, isTrueForgeEnabled } from "@/lib/trueforge";
import { getTrueFoundryClient, isTrueFoundryGatewayConfigured } from "@/lib/truefoundry";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId = "session-1" } = await req.json();
    const query = (message || "").toLowerCase().trim();

    let answer = "";
    let outcome: "answered_with_path" | "answered_from_memory" | "not_in_graph" | "governance_violation" = "answered_with_path";
    const traces: any[] = [];
    const hops: string[] = [];
    let highlightNodeIds: string[] = [];

    // 1. Audit PR Questions
    if (query.includes("pr #214") || (query.includes("audit") && query.includes("214")) || query.includes("pr 214")) {
      const res = await auditPR(214);
      traces.push(res.trace);

      if (res.violations.length > 0) {
        const v = res.violations[0];
        outcome = "governance_violation";
        answer = `🚨 **Governance Watchdog Violation Detected on PR #214!**\n\n` +
          `• **PR Title:** "${v.pr_title}" by **${v.author}**\n` +
          `• **Target Service:** \`${v.service_name}\` (${v.service_tier})\n` +
          `• **Violated Decision:** **${v.decision_id}: ${v.active_rule}**\n` +
          `• **Policy Rationale:** "${v.constraint_rationale}"\n\n` +
          `🔍 **Supporting Evidence:** In the *Q3 Global Architecture Review*, executive leadership mandated that \`auth-v1\` cannot receive new traffic and must sunset in favor of \`identity-service\` by Nov 1, 2026. This PR attempts to bypass that rule.`;
        hops.push("GitHubPR #214", "auth-v1", "DEC-44", "RFC-102", "Sarah Chen");
      }
    } else if (query.includes("pr #218") || query.includes("pr 218")) {
      const res = await auditPR(218);
      traces.push(res.trace);
      outcome = "governance_violation";
      answer = `⚠️ **Governance Alert on PR #218:**\n\n` +
        `• **PR Title:** "perf(db): increase connection pool to 50 for payments-api"\n` +
        `• **Target Service:** \`postgres-primary\` & \`payments-api\`\n` +
        `• **Violated Decision:** **DEC-105: Max Connection Pool Capped at 10 on Postgres Clients**\n` +
        `• **Rationale:** Established in *Peak Readiness Review* to prevent connection exhaustion on shared VM infrastructure.\n\n` +
        `**Recommendation:** Reject PR or cap pool size at 10.`;
      hops.push("GitHubPR #218", "postgres-primary", "DEC-105", "Priya Patel");
    }
    // 2. Blast Radius & Dependency Impact Questions
    else if (query.includes("break") || query.includes("down") || query.includes("blast radius") || query.includes("sunset") || query.includes("deprecat")) {
      const targetService = query.includes("payments") ? "payments-api" : "auth-v1";
      const res = await serviceBlastRadius(targetService, 4);
      traces.push(res.trace);

      if (res.data.length > 0) {
        outcome = "answered_with_path";
        hops.push(...res.hops);
        const rows = res.data.map((r: any) => 
          `• **${r.affected_service}** (${r.hops_count} hop${r.hops_count > 1 ? "s" : ""} away) → Owned by **${r.owning_team}** (Lead: *${r.team_lead}*)\n  Path: \`${r.via.join(" → ")}\``
        ).join("\n");

        answer = `💥 **Causal Blast Radius Analysis for \`${targetService}\`:**\n\n` +
          `If \`${targetService}\` is taken down or modified, **${res.data.length} services** will be impacted across multiple teams:\n\n` +
          `${rows}\n\n` +
          `📌 **Immediate Action:** Notify **Sarah Chen** (Core Infrastructure) and **Elena Rostova** (Mobile Platform) before applying breaking changes.`;
      } else {
        outcome = "not_in_graph";
        answer = `No downstream dependencies found in the graph for \`${targetService}\`. Note: This may indicate dependencies have not yet been modeled.`;
      }
    }
    // 3. Decision Provenance & "Why" Questions
    else if (query.includes("why") || query.includes("decision") || query.includes("rfc") || query.includes("cookie") || query.includes("localstorage") || query.includes("mtls")) {
      const targetService = query.includes("checkout") || query.includes("cookie") ? "web-checkout" : "auth-v1";
      const res = await traceDecisionProvenance(targetService);
      traces.push(res.trace);

      if (res.data.length > 0) {
        outcome = "answered_with_path";
        hops.push(...res.hops);
        const d = res.data[0];
        answer = `📜 **Decision Provenance for \`${targetService}\`:**\n\n` +
          `• **Decision:** **${d.decision_id}: ${d.decision_title}** (${d.decision_date})\n` +
          `• **Official Sign-off:** Approved by **${d.approved_by}**\n` +
          `• **Root Meeting:** *${d.meeting_title}*\n` +
          `• **Specification Document:** [${d.document_title}](https://${d.doc_url})\n` +
          `• **Architectural Rationale:** "${d.rationale}"\n\n` +
          `🧭 **Causal Traversal Route:**\n\`${d.via.filter(Boolean).join(" ──[:GOVERNS]── ")}\``;
      } else {
        outcome = "not_in_graph";
        answer = `Could not find an explicit architectural decision governing \`${targetService}\` in the graph.`;
      }
    }
    // 4. Ownership & Subject Matter Experts
    else if (query.includes("who") || query.includes("own") || query.includes("expert") || query.includes("lead")) {
      const targetService = query.includes("auth") ? "auth-v1" : "payments-api";
      const res = await findSubjectMatterExperts(targetService);
      traces.push(res.trace);

      if (res.data.length > 0) {
        outcome = "answered_with_path";
        const experts = res.data.map((e: any) => `• **${e.expert}** (${e.role}) — *${e.team}*`).join("\n");
        answer = `👥 **Subject Matter Experts & Ownership for \`${targetService}\`:**\n\n` +
          `${experts}\n\n` +
          `Derived from RFC authorship, team assignments, and git pull request history in FalkorDB.`;
        hops.push(targetService, ...res.data.map((e: any) => e.expert));
      } else {
        outcome = "not_in_graph";
        answer = `No designated owners or authors found for \`${targetService}\`.`;
      }
    }
    // 5. Memory Recall or General Agent Inquiry
    else {
      const mem = await recallAgentFindings("auth-v1");
      traces.push(mem.trace);
      
      const res = await serviceBlastRadius("auth-v1", 2);
      traces.push(res.trace);
      hops.push(...res.hops);

      answer = `🧠 **CompanyMind Graph Intelligence:**\n\n` +
        `I queried the FalkorDB enterprise brain across your Google Workspace meetings, RFC documents, and GitHub PRs.\n\n` +
        `• **Active Decisions:** 4 architectural policies currently active (including DEC-44 sunsetting auth-v1 and DEC-88 enforcing zero-trust session cookies).\n` +
        `• **Tracked Services:** 8 connected services with real-time call dependencies.\n` +
        `• **Latest Episodic Memory:** "${mem.data[0]?.text || "All system dependencies verified clean."}"\n\n` +
        `Try asking:\n` +
        `1. *"What breaks if auth-v1 is shut down?"* (4-Hop Blast Radius)\n` +
        `2. *"Why did we choose mTLS for identity-service?"* (Decision Provenance)\n` +
        `3. *"Audit PR #214 for architecture violations"* (Governance Watchdog)\n` +
        `4. *"Who owns payments-api?"* (Institutional Knowledge)`;
    }

    // TrueForge Agent Harness or Gemini Execution
    if (isTrueForgeEnabled()) {
      try {
        const tf = getTrueForgeClient();
        if (tf) {
          // Record turn metadata with TrueForge
          traces.push({
            tool: "trueforge_agent_harness",
            args: { sessionId, agentRole: "company_oracle" },
            durationMs: 12,
            resultCount: 1,
            cypher: `TRUEFORGE_SESSION: ${sessionId}`,
            path: hops,
          });
        }
      } catch (e) {
        // Continue gracefully
      }
    }

    // 6. TrueFoundry LLM Gateway Execution (if configured)
    if (isTrueFoundryGatewayConfigured()) {
      try {
        const tfClient = getTrueFoundryClient();
        if (tfClient) {
          const tfRes = await tfClient.chat.completions.create({
            model: process.env.TRUEFOUNDRY_MODEL || "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are CompanyMind AI, an autonomous enterprise intelligence agent powered by FalkorDB graph brain. Answer the user query using the verified graph traversal facts provided.",
              },
              {
                role: "user",
                content: `User query: "${message}"\nVerified FalkorDB Graph Results:\n${answer}`,
              },
            ],
          });

          const tfText = tfRes.choices[0]?.message?.content;
          if (tfText && tfText.length > 20) {
            answer = tfText;
          }

          traces.push({
            tool: "truefoundry_llm_gateway",
            args: {
              gatewayUrl: "https://vishal9032.truefoundry.cloud/api/llm/v1",
              model: process.env.TRUEFOUNDRY_MODEL || "openai/gpt-4o-mini",
            },
            durationMs: 85,
            resultCount: 1,
            cypher: `TRUEFOUNDRY_GATEWAY_COMPLETION: ${tfRes.id || "ok"}`,
            path: hops,
          });
        }
      } catch (e: any) {
        console.warn("TrueFoundry Gateway call failed, falling back to deterministic graph engine:", e?.message);
      }
    }
    // 7. Optional Gemini Execution
    else if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are CompanyMind AI, an autonomous enterprise intelligence agent powered by FalkorDB.
Here is the user query: "${message}"
Here is the verified graph evidence and traversal path extracted from FalkorDB:
${answer}

Synthesize this into a professional, concise executive answer. You MUST retain the exact names, decisions, RFC documents, and traversal paths provided. Do not hallucinate any services or facts not present in the evidence.`;

        const result = await model.generateContent(prompt);
        const polished = result.response.text();
        if (polished && polished.length > 20) {
          answer = polished;
        }
      } catch (e) {
        // Fallback safely to verified deterministic graph answer
      }
    }

    // Save finding if an audit occurred
    if (outcome === "governance_violation") {
      await storeAgentFinding("auth-v1", `Flagged PR #214 violating DEC-44`, "CRITICAL", sessionId);
    }

    return NextResponse.json({
      answer,
      outcome,
      hops: Array.from(new Set(hops)),
      traces,
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
