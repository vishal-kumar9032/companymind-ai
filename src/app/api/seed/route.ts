import { NextResponse } from "next/server";
import { seedCompanyMindGraph } from "@/lib/seeder";

export const dynamic = "force-dynamic";

const COOLDOWN_MS = 30_000;
let lastSeedAt = 0;

/**
 * Wipes and re-seeds the shared demo graph. Unauthenticated by design (it only touches the
 * demo workspace), so it is off in production unless ALLOW_DEMO_RESEED=true, and rate limited.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESEED !== "true") {
    return NextResponse.json({ error: "Demo reseed is disabled" }, { status: 403 });
  }
  if (Date.now() - lastSeedAt < COOLDOWN_MS) {
    return NextResponse.json({ error: "Reseed was just run; try again shortly" }, { status: 429 });
  }
  lastSeedAt = Date.now();
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
