import { seedCompanyMindGraph } from "../src/lib/seeder";

async function main() {
  console.log("Seeding CompanyMind AI graph into FalkorDB...");
  const res = await seedCompanyMindGraph();
  console.log("Result:", res);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
