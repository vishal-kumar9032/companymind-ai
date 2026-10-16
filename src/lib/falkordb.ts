import { FalkorDB } from "falkordb";

let globalClient: FalkorDB | null = null;

export async function getFalkorClient(): Promise<FalkorDB> {
  if (globalClient) {
    return globalClient;
  }

  const host = process.env.FALKORDB_HOST || "localhost";
  const port = Number(process.env.FALKORDB_PORT) || 6379;
  const password = process.env.FALKORDB_PASSWORD || undefined;

  globalClient = await FalkorDB.connect({
    socket: {
      host,
      port,
      tls: process.env.FALKORDB_TLS === "true",
    },
    password,
  });

  return globalClient;
}

export async function getGraph(graphId?: string) {
  const client = await getFalkorClient();
  const targetId = (graphId || process.env.FALKORDB_GRAPH || "companymind").toLowerCase();
  return client.selectGraph(targetId);
}
