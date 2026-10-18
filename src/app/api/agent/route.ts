import { NextRequest } from "next/server";
import { resolveCaller } from "@/lib/agent/identity";
import { runAgent, type AgentEvent } from "@/lib/agent/loop";
import { listApprovals, recentRuns } from "@/lib/agent/memory";
import { storeDocument } from "@/lib/agent/documents";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 120;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Stream the agent's work as newline-delimited JSON events. */
export async function POST(req: NextRequest) {
  const caller = await resolveCaller(req);
  if (!caller) return json({ error: "Invalid or expired sign-in token" }, 401);

  const rl = rateLimit(`agent:${caller.authenticated ? caller.id : clientIp(req)}`, caller.authenticated ? 20 : 6);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Too many requests; slow down" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": String(rl.retryAfter) },
    });
  }

  const body = await req.json().catch(() => ({}));
  const rawGoal = typeof body.message === "string" ? body.message.trim() : "";
  if (!rawGoal) return json({ error: "message is required" }, 400);
  if (rawGoal.length > 4000) return json({ error: "message too long" }, 400);

  let promptGoal = rawGoal;
  if (body.attachment && typeof body.attachment === "object" && body.attachment.text) {
    const attachName = String(body.attachment.name || "knowledge-attachment").slice(0, 100);
    const attachText = String(body.attachment.text).slice(0, 50_000);
    const attachExt = String(body.attachment.ext || body.attachment.type || "txt").slice(0, 10);
    try {
      await storeDocument(caller, {
        name: attachName,
        type: attachExt,
        size: Number(body.attachment.size) || attachText.length,
        text: attachText,
      });
    } catch (e) {
      console.warn("Auto-store document notice:", e);
    }
    promptGoal = `[User Knowledge Attachment: ${attachName}]\n${attachText}\n\n[User Instruction]:\n${rawGoal}`;
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AgentEvent | { type: "done"; runId: string; steps: number }) =>
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        const r = await runAgent({ caller, goal: promptGoal, model: body.model, onEvent: send });
        send({ type: "done", runId: r.runId, steps: r.steps });
      } catch (err: any) {
        send({ type: "error", message: String(err?.message || err).slice(0, 300) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}

/** Run history and pending approvals for the signed-in workspace. */
export async function GET(req: NextRequest) {
  const caller = await resolveCaller(req);
  if (!caller) return json({ error: "Invalid or expired sign-in token" }, 401);
  try {
    const [runs, approvals] = await Promise.all([recentRuns(caller, 25), listApprovals(caller, 25)]);
    return json({ workspace: caller.authenticated ? "personal" : "demo", runs, approvals });
  } catch {
    return json({ workspace: caller.authenticated ? "personal" : "demo", runs: [], approvals: [] });
  }
}
