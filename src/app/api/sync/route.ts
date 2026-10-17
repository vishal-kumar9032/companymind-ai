import { NextRequest } from "next/server";
import { resolveCaller } from "@/lib/agent/identity";
import { runAgent, type AgentEvent } from "@/lib/agent/loop";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 120;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const SYNC_GOAL = [
  "Sync run. For every connected account, read recent items using read tools only, then record what you actually found in my knowledge graph with graph_upsert.",
  "Read: up to 10 recent emails (Gmail), events in the next 7 days (Calendar), up to 10 recently modified files or docs (Drive/Docs), open pull requests and issues in my repositories (GitHub).",
  "Record people (Person), meetings (Meeting), documents (Doc), pull requests (GitHubPR), issues (GitHubIssue) and any explicit decisions (Decision), each with its source id, and connect them (ATTENDED, AUTHORED, AUTHORED_PR, RESOLVES, PROPOSES...).",
  "Use the person's real name or email as the entity name, consistently across sources. Do not invent anything. Do not create or change anything in my accounts.",
  "Finish with counts per source and say clearly which sources you could not read and why.",
].join(" ");

/** Pull recent data from the signed-in user's connected accounts into their own graph, streaming progress as NDJSON. */
export async function POST(req: NextRequest) {
  const caller = await resolveCaller(req);
  if (!caller) return json({ error: "Invalid or expired sign-in token" }, 401);
  if (!caller.authenticated) return json({ error: "Sign in and connect an account to sync it" }, 401);

  const rl = rateLimit(`sync:${caller.id}`, 2);
  if (!rl.ok) return json({ error: "Sync was just run; try again shortly" }, 429);

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AgentEvent | { type: "done"; runId: string; steps: number }) =>
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        const r = await runAgent({ caller, goal: SYNC_GOAL, role: "researcher", readOnly: true, maxSteps: 14, onEvent: send });
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
