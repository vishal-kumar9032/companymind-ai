import { NextRequest } from "next/server";
import { connectToolkit, connectionStatus, isComposioConfigured, TOOLKITS } from "@/lib/agent/composio";
import { resolveCaller } from "@/lib/agent/identity";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Real per-user connection state. Never reports connected unless Composio says so. */
export async function GET(req: NextRequest) {
  const caller = await resolveCaller(req);
  if (!caller) return json({ error: "Invalid or expired sign-in token" }, 401);
  if (!caller.authenticated) {
    return json({
      authenticated: false,
      configured: isComposioConfigured(),
      toolkits: TOOLKITS.map((t) => ({ ...t, connected: false })),
      note: "Sign in to connect your accounts.",
    });
  }
  return json({ authenticated: true, ...(await connectionStatus(caller.id)) });
}

/** Begin OAuth for one toolkit; the client redirects the user to the returned URL. */
export async function POST(req: NextRequest) {
  const caller = await resolveCaller(req);
  if (!caller || !caller.authenticated) return json({ error: "Sign in to connect accounts" }, 401);
  if (!isComposioConfigured()) return json({ error: "Connectors are not configured on this server" }, 503);

  const { toolkit } = await req.json().catch(() => ({}));
  if (typeof toolkit !== "string") return json({ error: "toolkit is required" }, 400);
  try {
    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const url = await connectToolkit(caller.id, toolkit, `${origin}/?connected=${encodeURIComponent(toolkit)}`);
    return json({ url });
  } catch (err: any) {
    return json({ error: String(err?.message || err).slice(0, 300) }, 502);
  }
}
