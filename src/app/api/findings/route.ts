import { NextRequest, NextResponse } from "next/server";
import { getAllAgentFindings, storeAgentFinding } from "@/lib/tools";
import { resolveCaller } from "@/lib/agent/identity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const caller = await resolveCaller(req);
    // If authenticated personal user, query their isolated personal graph
    if (caller?.authenticated) {
      const findings = await getAllAgentFindings(caller.graph);
      return NextResponse.json({ findings, workspace: "personal" });
    }

    // Default demo workspace
    const findings = await getAllAgentFindings();
    return NextResponse.json({ findings, workspace: "demo" });
  } catch (err: any) {
    console.error("GET findings error:", err);
    return NextResponse.json({ findings: [], error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await resolveCaller(req);
    const body = await req.json();
    const { targetName = "personal-service", text, severity = "HIGH", sessionId = "session-1" } = body;

    if (!text) {
      return NextResponse.json({ error: "Finding text is required" }, { status: 400 });
    }

    const graphId = caller?.authenticated ? caller.graph : undefined;
    const res = await storeAgentFinding(targetName, text, severity, sessionId, graphId);
    return NextResponse.json({ success: res.success, trace: res.trace, workspace: caller?.authenticated ? "personal" : "demo" });
  } catch (err: any) {
    console.error("POST findings error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
