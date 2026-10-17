import type OpenAI from "openai";
import { getGatewayFallbackModels, getTrueFoundryClient, getDirectGeminiClient } from "@/lib/truefoundry";
import type { Caller } from "./identity";
import { connectionStatus } from "./composio";
import { finishRun, recall, remember, startRun, createTask, completeTask } from "./memory";
import { buildToolbox, type Role, type Toolbox } from "./tools";

export type AgentEvent =
  | { type: "run_start"; runId: string; role: Role; goal: string; depth: number }
  | { type: "memory_recalled"; count: number }
  | { type: "model"; model: string; step: number }
  | { type: "tool_call"; runId: string; role: Role; name: string; args: unknown }
  | { type: "tool_result"; runId: string; role: Role; name: string; ms: number; ok: boolean; preview: string }
  | { type: "approval"; approvalId: string; tool: string; args: Record<string, unknown> }
  | { type: "delegate"; from: Role; to: Role; goal: string; taskId: string }
  | { type: "answer"; runId: string; role: Role; text: string }
  | { type: "error"; message: string };

export interface RunOptions {
  caller: Caller;
  goal: string;
  role?: Role;
  model?: string;
  context?: string;
  depth?: number;
  parentRunId?: string;
  onEvent?: (e: AgentEvent) => void;
}

export interface RunResult {
  runId: string;
  answer: string;
  steps: number;
}

const MAX_STEPS = 8;
const MAX_DEPTH = 1;
const MAX_TOOL_CHARS = 4000;

const ROLE_PROMPT: Record<Role, string> = {
  orchestrator:
    "You are CompanyMind, the lead agent of an autonomous workforce. Plan, use tools, delegate to specialists when a sub-task fits them, and finish with a clear answer.",
  researcher:
    "You are the Researcher. Find facts in the knowledge graph, connected sources and the web. Return findings with sources.",
  governance:
    "You are the Governance Watchdog. Check pull requests and changes against recorded decisions and policies. Report violations with the decision and who approved it.",
  scribe:
    "You are the Scribe. Prepare and perform actions (emails, calendar events, docs, sheet rows, GitHub changes) using the connected tools. Writes are queued for human approval; say exactly what you queued.",
};

let statusCache = new Map<string, { at: number; connected: string[] }>();

export function invalidateStatusCache(callerId?: string) {
  if (callerId) {
    statusCache.delete(callerId);
  } else {
    statusCache.clear();
  }
}

async function connectedToolkits(caller: Caller): Promise<string[]> {
  if (!caller.authenticated) return [];
  const hit = statusCache.get(caller.id);
  if (hit && Date.now() - hit.at < 60_000) return hit.connected;
  const s = await connectionStatus(caller.id);
  const connected = s.toolkits.filter((t) => t.connected).map((t) => t.slug);
  statusCache.set(caller.id, { at: Date.now(), connected });
  return connected;
}

const UNSUPPORTED_MODELS = new Set([
  "groq/openai-gpt-oss-120b",
  "meta-llama/llama-3.3-70b-instruct",
]);

function allowedModels(): string[] {
  const extraModels = [
    "google-gemini/gemini-3.1-flash-lite",
    "groq/qwen-qwen3.8-27b",
    "google-gemini/gemini-2.5-flash-lite",
    "openrouter/openrouter-free",
  ];
  if (process.env.GEMINI_API_KEY) {
    extraModels.push("gemini-2.5-flash-lite");
    extraModels.push("gemini-2.5-flash");
  }
  const env = process.env.TRUEFOUNDRY_MODEL || "google-gemini/gemini-3.1-flash-lite";
  return Array.from(new Set([env, ...getGatewayFallbackModels(), ...extraModels])).filter((m) => !UNSUPPORTED_MODELS.has(m));
}

/** A client-requested model is honoured only if it is one the server already offers. */
function candidateModels(requested?: string): string[] {
  const allowed = allowedModels();
  if (requested && allowed.includes(requested)) {
    return [requested, ...allowed.filter((m) => m !== requested)];
  }
  return allowed;
}

function truncate(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") {
    return v.length > MAX_TOOL_CHARS ? v.slice(0, MAX_TOOL_CHARS) + "…[truncated]" : v;
  }
  let s: string;
  try {
    if (typeof v === "object" && v !== null) {
      const dataObj = (v as any).data || v;
      // If result contains Gmail messages, clean and extract essential fields without huge MIME payloads
      if (Array.isArray(dataObj.messages)) {
        const msgs = dataObj.messages.slice(0, 8).map((m: any) => ({
          id: m.messageId || m.id,
          subject: m.subject || "No Subject",
          sender: m.sender || m.from,
          date: m.messageTimestamp || m.date,
          snippet: String(m.preview?.body || m.preview || m.messageText || m.snippet || "").slice(0, 300),
        }));
        return JSON.stringify({ messages: msgs, total: dataObj.messages.length });
      }
    }
    s = JSON.stringify(v);
  } catch {
    s = String(v);
  }
  return s.length > MAX_TOOL_CHARS ? s.slice(0, MAX_TOOL_CHARS) + `…[truncated]` : s;
}

const MODEL_COOLDOWN_MS = 60_000;
const RUN_BUDGET_MS = 100_000;
const modelCooldown = new Map<string, number>();

/** Models that failed recently go to the back of the line instead of being retried first on every step. */
function orderByHealth(models: string[]): string[] {
  const now = Date.now();
  const healthy = models.filter((m) => (modelCooldown.get(m) || 0) <= now);
  const cooling = models.filter((m) => (modelCooldown.get(m) || 0) > now);
  return [...healthy, ...cooling];
}

async function chat(
  client: OpenAI,
  models: string[],
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
) {
  let lastErr: unknown;
  const directGemini = getDirectGeminiClient();

  for (const model of orderByHealth(models)) {
    try {
      const activeClient = (model === "gemini-2.5-flash" || model === "gemini-2.5-flash-lite")
        ? (directGemini || client)
        : client;

      const res = await activeClient.chat.completions.create(
        { model, messages, ...(tools.length ? { tools } : {}) },
        { signal: AbortSignal.timeout(30_000) },
      );
      return { model, message: res.choices[0].message };
    } catch (err: any) {
      console.warn(`[Agent Gateway] Model ${model} failed (${err?.status || err?.code || "error"}):`, err?.message || err);
      lastErr = err;
      modelCooldown.set(model, Date.now() + MODEL_COOLDOWN_MS);
    }
  }

  // Fallback to direct Gemini endpoint if all candidate models failed
  if (directGemini) {
    const directCandidates = [
      process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
    ];
    for (const fallbackModel of Array.from(new Set(directCandidates))) {
      try {
        console.warn(`[Agent Gateway] Falling back to direct Google Gemini key (${fallbackModel})`);
        const res = await directGemini.chat.completions.create(
          { model: fallbackModel, messages, ...(tools.length ? { tools } : {}) },
          { signal: AbortSignal.timeout(30_000) },
        );
        return { model: fallbackModel, message: res.choices[0].message };
      } catch (directErr: any) {
        console.warn(`[Agent Gateway] Direct Gemini (${fallbackModel}) fallback failed:`, directErr?.message || directErr);
      }
    }
  }

  throw new Error(`All models failed: ${String((lastErr as any)?.message || lastErr).slice(0, 200)}`);
}

export async function runAgent(opts: RunOptions): Promise<RunResult> {
  const { caller, goal, model, context = "", depth = 0, onEvent = () => {} } = opts;
  const role: Role = opts.role || "orchestrator";

  const client = getTrueFoundryClient();
  if (!client) throw new Error("LLM gateway is not configured (TRUEFOUNDRY_API_KEY / TRUEFOUNDRY_BASE_URL)");

  const runId = await startRun(caller, role, goal, opts.parentRunId);
  onEvent({ type: "run_start", runId, role, goal, depth });

  try {
    const connected = await connectedToolkits(caller);
    const toolbox: Toolbox = await buildToolbox(caller, role, connected);

    // Cross-session memory: surface what agents already learned about this topic.
    const memories = await recall(caller, goal, 4).catch(() => []);
    onEvent({ type: "memory_recalled", count: memories.length });

    const system = [
      ROLE_PROMPT[role],
      `Today is ${new Date().toISOString().slice(0, 10)}.`,
      caller.authenticated
        ? `Connected accounts: ${connected.length ? connected.join(", ") : "none yet"}. If the task needs an account that is not connected, say so and tell the user to connect it in Connections. Never invent data from an unconnected source.`
        : "This is the read-only demo workspace: only the sample knowledge graph is available, no accounts are connected, and no actions can be taken.",
      "Rules: use tools to get facts, never guess. For \"how is X connected to Y\" use shortest_path (never conclude two entities are unrelated from one entity_neighborhood); for \"what matters most / biggest risk / clusters\" use graph_algorithm. Cite where each fact came from (graph entity, document, email, PR). If you cannot find something, say so plainly. Keep answers concise and structured.",
      "Connector rules: only call tools that appear in your tool list and never guess a tool name (for example, do not invent a calendar-listing tool). If you cannot view or list something with the tools you have, tell the user your limitation plainly instead of trying unverified calls. Never create, modify or delete anything (such as a test calendar event) as a workaround to check access or to see what exists. If a tool call fails or is missing required parameters (for example start_datetime for event creation), stop, explain the error, and ask the user for the missing details or explicit confirmation before trying again.",
      memories.length
        ? "Relevant shared memory from earlier work:\n" + memories.map((m: any) => `- [${m.kind}] ${String(m.text || "").slice(0, 240)}`).join("\n")
        : "",
      context ? `Context from the delegating agent:\n${context}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      { role: "user", content: goal },
    ];

    const delegate =
      role === "orchestrator" && depth < MAX_DEPTH
        ? async (to: Role, subGoal: string, subContext: string) => {
            const taskId = await createTask(caller, role, to, subGoal, subContext, runId);
            onEvent({ type: "delegate", from: role, to, goal: subGoal, taskId });
            const sub = await runAgent({ ...opts, role: to, goal: subGoal, context: subContext, depth: depth + 1, parentRunId: runId });
            await completeTask(caller, taskId, sub.answer);
            return sub.answer;
          }
        : undefined;

    const ctx = {
      caller,
      role,
      runId,
      connected,
      delegate,
      emit: (e: { type: "approval"; approvalId: string; tool: string; args: Record<string, unknown> }) => onEvent(e),
    };

    let models = candidateModels(model);
    let answer = "";
    let steps = 0;
    const deadline = Date.now() + RUN_BUDGET_MS;

    for (; steps < MAX_STEPS && Date.now() < deadline; steps++) {
      const { model: used, message } = await chat(client, models, messages, toolbox.definitions);
      models = [used, ...models.filter((m) => m !== used)];
      onEvent({ type: "model", model: used, step: steps + 1 });
      const calls = (message.tool_calls || []).filter((c) => c.type === "function") as any[];

      if (!calls.length) {
        answer = (message.content || "").trim();
        if (!answer && messages.some((m) => m.role === "tool")) {
          try {
            const synth = await chat(client, [used, ...models], messages, []);
            answer = (synth.message.content || "").trim();
          } catch {}
        }
        break;
      }

      messages.push({ role: "assistant", content: message.content ?? "", tool_calls: message.tool_calls });
      const results = await Promise.all(
        calls.map(async (c) => {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(c.function.arguments || "{}");
          } catch {
            /* malformed args from the model: run with {} and let the tool report what is missing */
          }
          onEvent({ type: "tool_call", runId, role, name: c.function.name, args });
          const started = Date.now();
          let out: unknown;
          let ok = true;
          try {
            out = await toolbox.call(c.function.name, args, ctx);
            if (out && typeof out === "object" && "error" in (out as any)) ok = false;
          } catch (err: any) {
            ok = false;
            out = { error: String(err?.message || err).slice(0, 300) };
          }
          const text = truncate(out);
          onEvent({ type: "tool_result", runId, role, name: c.function.name, ms: Date.now() - started, ok, preview: text.slice(0, 240) });
          return { id: c.id as string, text };
        }),
      );
      for (const r of results) messages.push({ role: "tool", tool_call_id: r.id, content: r.text });
    }

    if (!answer) {
      // Out of steps or time: ask once, without tools, for an answer from what was gathered.
      try {
        const synth = await chat(client, models, [
          ...messages,
          { role: "user", content: "You are out of steps. Using only the tool results above, give the best answer you can now. State clearly what you found, what is still missing, and cite sources. Do not call tools." },
        ], []);
        answer = (synth.message.content || "").trim();
      } catch {}
    }
    if (!answer) answer = "I ran out of steps before finishing and could not summarise what I found. Please narrow the request and try again.";

    onEvent({ type: "answer", runId, role, text: answer });
    await remember(caller, role, `Q: ${goal.slice(0, 300)} -> A: ${answer.slice(0, 600)}`, "episodic", [], runId).catch(() => {});
    await finishRun(caller, runId, "done", answer);
    return { runId, answer, steps: steps + 1 };
  } catch (err: any) {
    await finishRun(caller, runId, "error", String(err?.message || err)).catch(() => {});
    throw err;
  }
}
