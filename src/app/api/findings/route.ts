import { NextRequest, NextResponse } from "next/server";
import { getAllAgentFindings, storeAgentFinding } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const findings = await getAllAgentFindings();
    return NextResponse.json({ findings });
  } catch (err: any) {
    console.error("GET findings error:", err);
    return NextResponse.json({ findings: [], error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetName = "auth-v1", text, severity = "HIGH", sessionId = "session-1" } = body;

    if (!text) {
      return NextResponse.json({ error: "Finding text is required" }, { status: 400 });
    }

    const res = await storeAgentFinding(targetName, text, severity, sessionId);
    return NextResponse.json({ success: res.success, trace: res.trace });
  } catch (err: any) {
    console.error("POST findings error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
