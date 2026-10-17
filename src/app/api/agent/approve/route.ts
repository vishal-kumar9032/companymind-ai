import { NextRequest } from "next/server";
import { executeComposioTool } from "@/lib/agent/composio";
import { resolveCaller } from "@/lib/agent/identity";
import { claimApproval, getApproval, remember, setApprovalStatus } from "@/lib/agent/memory";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Human-in-the-loop gate: the only place a queued write action actually runs. */
export async function POST(req: NextRequest) {
  const caller = await resolveCaller(req);
  if (!caller || !caller.authenticated) return json({ error: "Sign in to approve actions" }, 401);

  const { id, decision } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || (decision !== "approve" && decision !== "reject")) {
    return json({ error: "id and decision (approve|reject) are required" }, 400);
  }

  const approval = await getApproval(caller, id);
  if (!approval) return json({ error: "Approval not found" }, 404);
  if (approval.status !== "pending") return json({ error: `Already ${approval.status}` }, 409);

  if (!(await claimApproval(caller, id, decision === "reject" ? "rejected" : "approved"))) {
    return json({ error: "Already decided" }, 409);
  }

  if (decision === "reject") {
    await remember(caller, "user", `Rejected ${approval.tool}`, "procedural", [], undefined).catch(() => {});
    return json({ status: "rejected" });
  }

  const res = await executeComposioTool(caller.id, approval.tool, approval.args);
  if (!res.ok) {
    await setApprovalStatus(caller, id, "failed", res.error || "failed");
    return json({ status: "failed", error: res.error }, 502);
  }
  await setApprovalStatus(caller, id, "executed", JSON.stringify(res.data).slice(0, 1000));
  return json({ status: "executed", result: res.data });
}
