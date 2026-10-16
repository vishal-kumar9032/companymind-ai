import { NextResponse } from "next/server";
import { seedCompanyMindGraph } from "@/lib/seeder";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const res = await seedCompanyMindGraph();
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Error seeding graph:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to seed graph" },
      { status: 500 }
    );
  }
}
