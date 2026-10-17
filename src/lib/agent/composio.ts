import { Composio } from "@composio/core";
import fs from "fs";
import path from "path";
import os from "os";
import type OpenAI from "openai";

export const TOOLKITS = [
  { slug: "googlesuper", label: "Google Workspace", blurb: "Connect all Google tools (Gmail, Calendar, Drive, Docs, Sheets) at once", isGoogle: true, isBundle: true },
  { slug: "gmail", label: "Gmail", blurb: "Read, search and send email", isGoogle: true },
  { slug: "googlecalendar", label: "Google Calendar", blurb: "Read and create events", isGoogle: true },
  { slug: "googledrive", label: "Google Drive", blurb: "Find and read files", isGoogle: true },
  { slug: "googledocs", label: "Google Docs", blurb: "Create and edit documents", isGoogle: true },
  { slug: "googlesheets", label: "Google Sheets", blurb: "Create sheets and append rows", isGoogle: true },
  { slug: "github", label: "GitHub", blurb: "Repos, pull requests, issues" },
] as const;

export type ToolkitSlug = (typeof TOOLKITS)[number]["slug"];

let client: Composio | null | undefined;

/** Read local user API key if available from Composio CLI session */
function getCliUserApiKey(): string | null {
  try {
    const credPath = path.join(os.homedir(), ".composio", "user_data.json");
    if (fs.existsSync(credPath)) {
      const data = JSON.parse(fs.readFileSync(credPath, "utf8"));
      return data.api_key || null;
    }
  } catch {}
  return null;
}

export function formatComposioError(err: any): string {
  const raw = String(err?.message || err || "");
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
      if (parsed?.message) {
        return parsed.message;
      }
    }
  } catch {}
  if (raw.includes("Invalid API key") || raw.includes("APIKey_InvalidAPIKey")) {
    return "Invalid Composio API key. Please verify your API key in environment configuration.";
  }
  return raw.slice(0, 200);
}

export function getComposio(): Composio | null {
  if (client !== undefined) return client;

  const projectKey = process.env.COMPOSIO_API_KEY;
  const userKey = process.env.COMPOSIO_USER_API_KEY || getCliUserApiKey();

  // If provided key is a user API key (uak_...)
  if (projectKey && projectKey.startsWith("uak_")) {
    client = new Composio({ apiKey: null as any, userApiKey: projectKey });
    return client;
  }

  // If a project key is provided, prefer it
  if (projectKey) {
    try {
      client = new Composio({ apiKey: projectKey });
      return client;
    } catch {
      // Fall through to userKey
    }
  }

  // Fall back to user key from env or CLI login
  if (userKey) {
    try {
      client = new Composio({ apiKey: null as any, userApiKey: userKey });
      return client;
    } catch {}
  }

  client = null;
  return null;
}

export function isComposioConfigured(): boolean {
  return Boolean(
    process.env.COMPOSIO_API_KEY ||
    process.env.COMPOSIO_USER_API_KEY ||
    getCliUserApiKey()
  );
}

export interface ToolkitStatus {
  slug: string;
  label: string;
  blurb: string;
  connected: boolean;
  isGoogle?: boolean;
  isBundle?: boolean;
}

/** Real connection state for this user. Never reports "connected" on error. */
export async function connectionStatus(
  userId: string,
): Promise<{ configured: boolean; error?: string; toolkits: ToolkitStatus[] }> {
  const base = TOOLKITS.map((t) => ({ ...t, connected: false }));
  let composio = getComposio();
  if (!composio) return { configured: false, toolkits: base };

  try {
    const session: any = await composio.sessions.create(userId, {
      toolkits: TOOLKITS.map((t) => t.slug) as any,
    });
    const res = await session.toolkits({ toolkits: TOOLKITS.map((t) => t.slug) });
    const active = new Set<string>(
      (res.items || [])
        .filter((i: any) => i.connection?.isActive)
        .map((i: any) => String(i.slug).toLowerCase()),
    );
    const hasGoogleSuper = active.has("googlesuper");
    const isConnected = (slug: string) => {
      if (active.has(slug)) return true;
      if (hasGoogleSuper && (slug.startsWith("google") || slug === "gmail")) {
        return true;
      }
      return false;
    };
    return {
      configured: true,
      toolkits: base.map((t) => ({ ...t, connected: isConnected(t.slug) })),
    };
  } catch (err: any) {
    // If project key gave 401 or invalid, try user key fallback
    const userKey = process.env.COMPOSIO_USER_API_KEY || getCliUserApiKey();
    if (userKey) {
      try {
        const fallbackClient = new Composio({ apiKey: null as any, userApiKey: userKey });
        const session: any = await fallbackClient.sessions.create(userId, {
          toolkits: TOOLKITS.map((t) => t.slug) as any,
        });
        const res = await session.toolkits({ toolkits: TOOLKITS.map((t) => t.slug) });
        const active = new Set<string>(
          (res.items || [])
            .filter((i: any) => i.connection?.isActive)
            .map((i: any) => String(i.slug).toLowerCase()),
        );
        client = fallbackClient;
        const hasGoogleSuper = active.has("googlesuper");
        const isConnected = (slug: string) => {
          if (active.has(slug)) return true;
          if (hasGoogleSuper && (slug.startsWith("google") || slug === "gmail")) {
            return true;
          }
          return false;
        };
        return {
          configured: true,
          toolkits: base.map((t) => ({ ...t, connected: isConnected(t.slug) })),
        };
      } catch {}
    }

    const cleanError = formatComposioError(err);
    return {
      configured: false,
      error: cleanError,
      toolkits: base,
    };
  }
}

/** Start OAuth for one toolkit; returns the URL the user must visit. */
export async function connectToolkit(
  userId: string,
  toolkit: string,
  callbackUrl?: string,
): Promise<string> {
  let composio = getComposio();
  if (!composio) throw new Error("Composio is not configured");
  if (!TOOLKITS.some((t) => t.slug === toolkit)) {
    throw new Error(`Unsupported toolkit: ${toolkit}`);
  }

  try {
    const session: any = await composio.sessions.create(userId, {
      toolkits: [toolkit] as any,
    });
    const req = await session.authorize(toolkit, callbackUrl ? { callbackUrl } : undefined);
    const url = (req as any).redirectUrl;
    if (!url) throw new Error("Composio did not return a redirect URL");
    return url;
  } catch (err: any) {
    const userKey = process.env.COMPOSIO_USER_API_KEY || getCliUserApiKey();
    if (userKey) {
      try {
        const fallbackClient = new Composio({ apiKey: null as any, userApiKey: userKey });
        const session: any = await fallbackClient.sessions.create(userId, {
          toolkits: [toolkit] as any,
        });
        const req = await session.authorize(toolkit, callbackUrl ? { callbackUrl } : undefined);
        const url = (req as any).redirectUrl;
        if (url) {
          client = fallbackClient;
          return url;
        }
      } catch {}
    }
    throw new Error(formatComposioError(err));
  }
}

/** Invalidate cached OpenAI tool definitions for a user (or all). */
export function invalidateToolCache(userId?: string) {
  if (userId) {
    for (const key of toolCache.keys()) {
      if (key.startsWith(`${userId}:`)) toolCache.delete(key);
    }
  } else {
    toolCache.clear();
  }
}

/** Disconnect one toolkit (or all Google tools if googlesuper). Revokes and deletes connected accounts. */
export async function disconnectToolkit(
  userId: string,
  toolkit: string,
): Promise<{ ok: boolean; count: number }> {
  let composio = getComposio();
  if (!composio) throw new Error("Composio is not configured");

  const target = toolkit.toLowerCase();
  const isGoogleTarget = target === "googlesuper" || target.startsWith("google") || target === "gmail";

  const shouldDeleteSlug = (slug: string) => {
    const s = slug.toLowerCase();
    if (target === "googlesuper") {
      return s === "googlesuper" || s.startsWith("google") || s === "gmail";
    }
    if (isGoogleTarget && s === "googlesuper") {
      return true;
    }
    return s === target;
  };

  const executeDelete = async (clientInstance: Composio) => {
    const accountsToDelete = new Set<string>();

    // 1. Query connected accounts list for this user
    try {
      const list = await clientInstance.connectedAccounts.list({ userIds: [userId] });
      for (const acc of list.items || []) {
        const slug = acc.toolkit?.slug || "";
        if (shouldDeleteSlug(slug)) {
          accountsToDelete.add(acc.id);
        }
      }
    } catch {}

    // 2. Query active session toolkits for this user
    try {
      const session: any = await clientInstance.sessions.create(userId, {
        toolkits: TOOLKITS.map((t) => t.slug) as any,
      });
      const res = await session.toolkits({ toolkits: TOOLKITS.map((t) => t.slug) });
      for (const item of res.items || []) {
        const slug = String(item.slug || "").toLowerCase();
        const accId = item.connection?.connectedAccount?.id;
        if (accId && shouldDeleteSlug(slug)) {
          accountsToDelete.add(accId);
        }
      }
    } catch {}

    let count = 0;
    for (const accId of accountsToDelete) {
      try {
        await clientInstance.connectedAccounts.delete(accId);
        count++;
      } catch (err: any) {
        console.error(`Failed to delete connected account ${accId}:`, err?.message || err);
      }
    }

    return count;
  };

  try {
    const count = await executeDelete(composio);
    invalidateToolCache(userId);
    return { ok: true, count };
  } catch (err: any) {
    const userKey = process.env.COMPOSIO_USER_API_KEY || getCliUserApiKey();
    if (userKey) {
      try {
        const fallbackClient = new Composio({ apiKey: null as any, userApiKey: userKey });
        const count = await executeDelete(fallbackClient);
        client = fallbackClient;
        invalidateToolCache(userId);
        return { ok: true, count };
      } catch {}
    }
    throw new Error(formatComposioError(err));
  }
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
  if (!composio) return { ok: false, error: "Composio is not configured" };
  try {
    const res: any = await composio.tools.execute(slug, {
      userId,
      arguments: args,
      dangerouslySkipVersionCheck: true,
    } as any);
    if (res?.successful === false) {
      return { ok: false, error: String(res.error || "tool failed").slice(0, 500) };
    }
    return { ok: true, data: res?.data ?? res };
  } catch (err: any) {
    return { ok: false, error: formatComposioError(err) };
  }
}
