import { FalkorDB } from "falkordb";

// Cache on globalThis so Next.js dev reloads and warm serverless invocations reuse one connection.
const g = globalThis as unknown as { __falkor?: Promise<FalkorDB> };

function connect(): Promise<FalkorDB> {
  const url = process.env.FALKORDB_URL;
  if (url) {
    // Hosted FalkorDB Cloud: redis(s)://user:pass@host:port
    return FalkorDB.connect({ url });
  }

  const host = process.env.FALKORDB_HOST || "localhost";
  const port = Number(process.env.FALKORDB_PORT) || 6379;
  const password = process.env.FALKORDB_PASSWORD || undefined;
  const username = process.env.FALKORDB_USERNAME || undefined;

  if (process.env.NODE_ENV === "production" && host === "localhost") {
    throw new Error(
      "FALKORDB_URL or FALKORDB_HOST must be set in production (localhost is not reachable from serverless).",
    );
  }

  return FalkorDB.connect({
    socket: { host, port, tls: process.env.FALKORDB_TLS === "true" },
    username,
    password,
  });
}

export async function getFalkorClient(): Promise<FalkorDB> {
  if (!g.__falkor) {
    g.__falkor = connect().catch((err) => {
      g.__falkor = undefined; // allow retry on next request
      throw err;
    });
  }
  return g.__falkor;
}

export async function getGraph(graphId?: string) {
  const client = await getFalkorClient();
  const targetId = (graphId || process.env.FALKORDB_GRAPH || "companymind").toLowerCase();
  return client.selectGraph(targetId);
}
