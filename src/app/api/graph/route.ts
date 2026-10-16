import { NextResponse } from "next/server";
import { getGraphOverview } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getGraphOverview();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error fetching graph data:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}
