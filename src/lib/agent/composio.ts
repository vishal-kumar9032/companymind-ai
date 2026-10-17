import { Composio } from "@composio/core";
import type OpenAI from "openai";

export const TOOLKITS = [
  { slug: "gmail", label: "Gmail", blurb: "Read, search and send email" },
  { slug: "googlecalendar", label: "Google Calendar", blurb: "Read and create events" },
  { slug: "googledrive", label: "Google Drive", blurb: "Find and read files" },
  { slug: "googledocs", label: "Google Docs", blurb: "Create and edit documents" },
  { slug: "googlesheets", label: "Google Sheets", blurb: "Create sheets and append rows" },
  { slug: "github", label: "GitHub", blurb: "Repos, pull requests, issues" },
] as const;

export type ToolkitSlug = (typeof TOOLKITS)[number]["slug"];

let client: Composio | null | undefined;

export function getComposio(): Composio | null {
  if (client !== undefined) return client;
  const apiKey = process.env.COMPOSIO_API_KEY;
  client = apiKey ? new Composio({ apiKey }) : null;
  return client;
}

export function isComposioConfigured(): boolean {
  return Boolean(process.env.COMPOSIO_API_KEY);
}

export interface ToolkitStatus {
  slug: string;
  label: string;
  blurb: string;
  connected: boolean;
}

/** Real connection state for this user. Never reports "connected" on error. */
export async function connectionStatus(
  userId: string,
): Promise<{ configured: boolean; error?: string; toolkits: ToolkitStatus[] }> {
  const base = TOOLKITS.map((t) => ({ ...t, connected: false }));
  const composio = getComposio();
  if (!composio) return { configured: false, toolkits: base };
  try {
    const session: any = await composio.sessions.create(userId, { toolkits: TOOLKITS.map((t) => t.slug) as any });
    const res = await session.toolkits({ toolkits: TOOLKITS.map((t) => t.slug) });
    const active = new Set<string>(
      (res.items || []).filter((i: any) => i.connection?.isActive).map((i: any) => String(i.slug).toLowerCase()),
    );
    return { configured: true, toolkits: base.map((t) => ({ ...t, connected: active.has(t.slug) })) };
  } catch (err: any) {
    return { configured: true, error: String(err?.message || err).slice(0, 300), toolkits: base };
  }
}

/** Start OAuth for one toolkit; returns the URL the user must visit. */
export async function connectToolkit(userId: string, toolkit: string, callbackUrl?: string): Promise<string> {
  const composio = getComposio();
  if (!composio) throw new Error("COMPOSIO_API_KEY is not configured");
  if (!TOOLKITS.some((t) => t.slug === toolkit)) throw new Error(`Unsupported toolkit: ${toolkit}`);
  const session: any = await composio.sessions.create(userId, { toolkits: [toolkit] as any });
  const req = await session.authorize(toolkit, callbackUrl ? { callbackUrl } : undefined);
  const url = (req as any).redirectUrl;
  if (!url) throw new Error("Composio did not return a redirect URL");
  return url;
}

/** Slugs that change the outside world. These go through human approval. */
const WRITE_WORDS = new Set([
  "SEND", "CREATE", "UPDATE", "DELETE", "REMOVE", "APPEND", "ADD", "INSERT", "POST", "MERGE", "COMMENT",
  "REPLY", "FORWARD", "MOVE", "TRASH", "PATCH", "WRITE", "CLEAR", "REVOKE", "INVITE", "ASSIGN", "CLOSE",
  "REOPEN", "FORK", "STAR", "LABEL", "UPLOAD", "SHARE", "RENAME", "COPY", "EDIT", "SET", "ARCHIVE",
]);

export function isWriteTool(slug: string): boolean {
  return slug.toUpperCase().split("_").some((w) => WRITE_WORDS.has(w));
}

const toolCache = new Map<string, { at: number; tools: OpenAI.Chat.Completions.ChatCompletionTool[] }>();

/** OpenAI-format tool schemas for the toolkits this user has actually connected. */
export async function getConnectedTools(
  userId: string,
  toolkits: string[],
): Promise<OpenAI.Chat.Completions.ChatCompletionTool[]> {
  const composio = getComposio();
  if (!composio || toolkits.length === 0) return [];
  const key = `${userId}:${[...toolkits].sort().join(",")}`;
  const hit = toolCache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.tools;
  const tools = (await composio.tools.get(userId, { toolkits, limit: 12 } as any)) as any;
  const list = (Array.isArray(tools) ? tools : []) as OpenAI.Chat.Completions.ChatCompletionTool[];
  toolCache.set(key, { at: Date.now(), tools: list });
  return list;
}

export async function executeComposioTool(
  userId: string,
  slug: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const composio = getComposio();
  if (!composio) return { ok: false, error: "COMPOSIO_API_KEY is not configured" };
  try {
    const res: any = await composio.tools.execute(slug, {
      userId,
      arguments: args,
      dangerouslySkipVersionCheck: true,
    } as any);
    if (res?.successful === false) return { ok: false, error: String(res.error || "tool failed").slice(0, 500) };
    return { ok: true, data: res?.data ?? res };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err).slice(0, 500) };
  }
}
