import { createRemoteJWKSet, jwtVerify } from "jose";

export interface Caller {
  /** Stable id used for the Composio user and the per-org FalkorDB graph. */
  id: string;
  /** FalkorDB graph holding this org's knowledge + agent memory. */
  graph: string;
  email?: string;
  /** false for the unauthenticated demo workspace: read-only, no connector actions. */
  authenticated: boolean;
}

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export const DEMO_CALLER: Caller = {
  id: "demo",
  graph: (process.env.FALKORDB_GRAPH || "companymind").toLowerCase(),
  authenticated: false,
};

function safe(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

/**
 * Derive the caller from a Firebase ID token. The org is never taken from
 * client-supplied fields; it is derived from the verified `sub` claim.
 * No token -> demo workspace. A token that fails verification -> null (reject).
 */
export async function resolveCaller(req: Request): Promise<Caller | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return DEMO_CALLER;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) return null;
    const id = `u_${safe(payload.sub)}`;
    return {
      id,
      graph: `org_${id}`.toLowerCase(),
      email: typeof payload.email === "string" ? payload.email : undefined,
      authenticated: true,
    };
  } catch {
    return null;
  }
}
