import { NextRequest, NextResponse } from "next/server";
import { getGraphOverview } from "@/lib/tools";
import { resolveCaller } from "@/lib/agent/identity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const caller = await resolveCaller(req);
    if (caller?.authenticated) {
      const data = await getGraphOverview(caller.graph);
      return NextResponse.json({ ...data, workspace: "personal" });
    }

    const data = await getGraphOverview();
    return NextResponse.json({ ...data, workspace: "demo" });
  } catch (err: any) {
    console.error("Error fetching graph data:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}
