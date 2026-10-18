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

/** Read organization and project ID from environment or Composio CLI configuration */
function getCliProjectScope(): { orgId?: string; projectId?: string } {
  try {
    if (process.env.COMPOSIO_ORG_ID && process.env.COMPOSIO_PROJECT_ID) {
      return { orgId: process.env.COMPOSIO_ORG_ID, projectId: process.env.COMPOSIO_PROJECT_ID };
    }
    const localProj = path.join(process.cwd(), ".composio", "project.json");
    if (fs.existsSync(localProj)) {
      const data = JSON.parse(fs.readFileSync(localProj, "utf8"));
      if (data.org_id && data.project_id) {
        return { orgId: data.org_id, projectId: data.project_id };
      }
    }
    const userJson = path.join(os.homedir(), ".composio", "user_data.json");
    if (fs.existsSync(userJson)) {
      const data = JSON.parse(fs.readFileSync(userJson, "utf8"));
      if (data.org_id) {
        return { orgId: data.org_id, projectId: data.project_id };
      }
    }
  } catch {}
  return {};
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

/** Create a fully scoped Composio client supporting both userApiKey and project apiKey */
export function createComposioClient(): Composio | null {
  const projectKey = process.env.COMPOSIO_API_KEY;
  const userKey = process.env.COMPOSIO_USER_API_KEY || getCliUserApiKey();
  const scope = getCliProjectScope();

  // 1. Try userKey with project & org scope (required for uak_... keys)
  if (userKey) {
    try {
      return new Composio({
        apiKey: null as any,
        userApiKey: userKey,
        orgId: scope.orgId,
        projectId: scope.projectId,
        dangerouslyAllowAutoUploadDownloadFiles: true,
      });
    } catch {}
  }

  // 2. Try project key if available and not a uak key
  if (projectKey && !projectKey.startsWith("uak_")) {
    try {
      return new Composio({
        apiKey: projectKey,
        orgId: scope.orgId,
        projectId: scope.projectId,
        dangerouslyAllowAutoUploadDownloadFiles: true,
      });
    } catch {}
  }

  return null;
}

export function getComposio(): Composio | null {
  if (client !== undefined) return client;
  client = createComposioClient();
  return client;
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
    const fallbackClient = createComposioClient();
    if (fallbackClient) {
      try {
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
    const fallbackClient = createComposioClient();
    if (fallbackClient) {
      try {
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
    const fallbackClient = createComposioClient();
    if (fallbackClient) {
      try {
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

/** Verbs that only read. A tool must carry one of these to skip approval (fail closed). */
const READ_WORDS = new Set([
  "GET", "LIST", "FETCH", "SEARCH", "READ", "FIND", "QUERY", "LOOKUP", "RETRIEVE", "CHECK",
  "DESCRIBE", "VIEW", "SHOW", "COUNT", "DOWNLOAD", "EXPORT",
]);

/** A tool runs without approval only if it has a read verb and no write verb; anything unrecognised is gated. */
export function isWriteTool(slug: string): boolean {
  const words = slug.toUpperCase().split("_");
  return words.some((w) => WRITE_WORDS.has(w)) || !words.some((w) => READ_WORDS.has(w));
}

/**
 * Recursively sanitize a JSON Schema node so it strictly adheres to Google Gemini / OpenAPI 3.0 specification.
 * Strips unsupported properties ('examples', 'default', 'additionalProperties', etc.), flattens anyOf/oneOf,
 * and preserves parameter property dictionaries without treating property names as schema keywords.
 */
export function sanitizeSchemaNode(node: any): any {
  if (!node) return { type: "string" };
  if (typeof node === "string") {
    const lower = node.toLowerCase();
    if (["string", "number", "integer", "boolean", "array", "object"].includes(lower)) {
      return { type: lower, ...(lower === "object" ? { properties: {} } : {}) };
    }
    return { type: "string" };
  }
  if (typeof node !== "object") return { type: "string" };
  if (Array.isArray(node)) return node.map(sanitizeSchemaNode);

  // Flatten anyOf / oneOf to first non-null variant
  const variants = node.anyOf || node.oneOf;
  if (Array.isArray(variants) && variants.length > 0) {
    const nonNull = variants.find((x: any) => x && x.type !== "null") || variants[0];
    const isNullable = variants.some((x: any) => x && x.type === "null");
    return sanitizeSchemaNode({
      ...nonNull,
      description: node.description || nonNull.description,
      nullable: Boolean(isNullable || node.nullable || nonNull.nullable),
    });
  }

  // Normalize type
  let type = node.type;
  let nullable = Boolean(node.nullable);
  if (Array.isArray(type)) {
    const nonNullType = type.find((t: string) => t !== "null");
    type = nonNullType || "string";
    nullable = nullable || type.includes("null");
  } else if (typeof type === "string") {
    type = type.toLowerCase();
  }

  const clean: any = {};
  if (type && ["string", "number", "integer", "boolean", "array", "object"].includes(type)) {
    clean.type = type;
  }
  if (nullable) clean.nullable = true;
  if (typeof node.description === "string") clean.description = node.description.slice(0, 300);
  if (typeof node.format === "string") clean.format = node.format;

  if (Array.isArray(node.enum) && node.enum.length > 0) {
    clean.enum = node.enum.map((e: any) => String(e));
    if (!clean.type) clean.type = "string";
  }

  // Handle properties map: each key must be valid parameter name; sanitize each value as a schema node object
  if (node.properties && typeof node.properties === "object" && !Array.isArray(node.properties)) {
    clean.properties = {};
    for (const [propName, propSchema] of Object.entries(node.properties)) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(propName)) continue;
      const sanitizedProp = sanitizeSchemaNode(propSchema);
      clean.properties[propName] = typeof sanitizedProp === "object" && !Array.isArray(sanitizedProp)
        ? sanitizedProp
        : { type: "string" };
    }
  }

  if (node.items) {
    const sanitizedItems = sanitizeSchemaNode(node.items);
    clean.items = typeof sanitizedItems === "object" && !Array.isArray(sanitizedItems)
      ? sanitizedItems
      : { type: "string" };
  }

  // Default missing types
  if (!clean.type) {
    if (clean.properties) clean.type = "object";
    else if (clean.items) clean.type = "array";
    else clean.type = "string";
  }

  // Ensure object types have a valid properties dictionary
  if (clean.type === "object" && !clean.properties) {
    clean.properties = {};
  }

  // Ensure array types have items
  if (clean.type === "array" && !clean.items) {
    clean.items = { type: "string" };
  }

  // Ensure required only contains property names that exist in clean.properties
  if (Array.isArray(node.required) && clean.properties) {
    const validRequired = node.required.filter(
      (p: unknown) => typeof p === "string" && Object.prototype.hasOwnProperty.call(clean.properties, p),
    );
    if (validRequired.length > 0) {
      clean.required = validRequired;
    }
  }

  return clean;
}

export function sanitizeToolParameters(node: any): any {
  if (!node || typeof node !== "object") {
    return { type: "object", properties: {} };
  }
  const clean = sanitizeSchemaNode(node);
  if (clean.type !== "object") {
    return { type: "object", properties: {} };
  }
  if (!clean.properties) {
    clean.properties = {};
  }
  return clean;
}

const PRIORITY_KEYWORDS = [
  "FETCH_EMAILS", "LIST_MESSAGES", "FETCH_MESSAGE", "SEND_EMAIL", "CREATE_EMAIL", "REPLY",
  "CREATE_DOCUMENT", "GET_DOCUMENT", "DOCUMENT_CONTENT",
  "EVENTS_LIST", "FIND_EVENT", "CREATE_EVENT", "GET_CALENDAR",
  "FIND_FILE", "SEARCH_FILES", "GET_FILE", "CREATE_FILE",
  "GET_SPREADSHEET", "CREATE_SPREADSHEET", "APPEND",
  "GET_A_REPOSITORY", "LIST_ISSUES", "CREATE_AN_ISSUE", "LIST_PULL", "GET_A_PULL", "SEARCH_REPOSITORIES",
  "ADD_ASSIGNEES", "CLOSE_ISSUE", "CLOSE_PULL_REQUEST",
];

function scoreTool(name: string): number {
  const upper = name.toUpperCase();
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    if (upper.includes(PRIORITY_KEYWORDS[i])) return -100 + i;
  }
  // Demote administrative ACL / migration tools
  if (upper.includes("ACL") || upper.includes("MIGRATION") || upper.includes("CSE_") || upper.includes("SMIME")) {
    return 100;
  }
  if (upper.includes("FETCH") || upper.includes("LIST") || upper.includes("GET") || upper.includes("FIND") || upper.includes("SEARCH")) {
    return -10;
  }
  if (upper.includes("CREATE") || upper.includes("SEND") || upper.includes("REPLY")) {
    return -5;
  }
  return 0;
}

/**
 * Hand-picked tools per toolkit: the read tools an agent needs to answer questions and sync data, plus a
 * few writes (always queued for approval). Ranking a toolkit's whole catalogue and keeping the top few
 * returned irrelevant admin tools (no calendar event listing, no PR listing, no Drive file listing).
 */
const CURATED_TOOLS: Record<string, string[]> = {
  gmail: [
    "GMAIL_FETCH_EMAILS", "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID", "GMAIL_CREATE_EMAIL_DRAFT", "GMAIL_SEND_EMAIL",
  ],
  googlecalendar: [
    "GOOGLECALENDAR_EVENTS_LIST", "GOOGLECALENDAR_FIND_EVENT", "GOOGLECALENDAR_CREATE_EVENT",
  ],
  googledrive: [
    "GOOGLEDRIVE_LIST_FILES", "GOOGLEDRIVE_FIND_FILE", "GOOGLEDRIVE_DOWNLOAD_FILE", "GOOGLEDRIVE_CREATE_FILE_FROM_TEXT",
  ],
  googledocs: [
    "GOOGLEDOCS_SEARCH_DOCUMENTS", "GOOGLEDOCS_GET_DOCUMENT_PLAINTEXT", "GOOGLEDOCS_CREATE_DOCUMENT_MARKDOWN",
  ],
  googlesheets: [
    "GOOGLESHEETS_CREATE_GOOGLE_SHEET1", "GOOGLESHEETS_GET_SPREADSHEET_INFO", "GOOGLESHEETS_VALUES_GET", "GOOGLESHEETS_VALUES_UPDATE",
  ],
  github: [
    "GITHUB_LIST_PULL_REQUESTS", "GITHUB_GET_A_PULL_REQUEST", "GITHUB_LIST_REPOSITORY_ISSUES", "GITHUB_GET_AN_ISSUE", "GITHUB_CREATE_AN_ISSUE_COMMENT",
  ],
};

CURATED_TOOLS.googlesuper = Array.from(new Set([
  ...CURATED_TOOLS.gmail,
  ...CURATED_TOOLS.googlecalendar,
  ...CURATED_TOOLS.googledrive,
  ...CURATED_TOOLS.googledocs,
  ...CURATED_TOOLS.googlesheets,
]));

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

  const fetchTools = async (c: Composio) => {
    // If multiple toolkits are connected, fetch per toolkit to guarantee each service has tools available
    const perToolkit = await Promise.all(
      toolkits.map(async (toolkitSlug) => {
        try {
          const curated = CURATED_TOOLS[toolkitSlug];
          const raw = (await c.tools.get(
            userId,
            (curated ? { tools: curated } : { toolkits: [toolkitSlug], limit: 25 }) as any,
          )) as any;
          const list = (Array.isArray(raw) ? raw : []) as any[];
          const usable = list.filter((t: any) => t?.type === "function" && t?.function?.name);
          return curated
            ? usable
            : usable.sort((a: any, b: any) => scoreTool(a.function?.name || "") - scoreTool(b.function?.name || "")).slice(0, 4);
        } catch {
          return [];
        }
      })
    );
    const combined = perToolkit.flat();
    return combined.map((t: any) => ({
      type: "function" as const,
      function: {
        name: t.function.name,
        description: t.function.description || t.function.name,
        parameters: sanitizeToolParameters(t.function.parameters),
      },
    }));
  };

  try {
    const list = await fetchTools(composio);
    toolCache.set(key, { at: Date.now(), tools: list });
    return list;
  } catch (err: any) {
    const fallbackClient = createComposioClient();
    if (fallbackClient) {
      try {
        const list = await fetchTools(fallbackClient);
        client = fallbackClient;
        toolCache.set(key, { at: Date.now(), tools: list });
        return list;
      } catch {}
    }
    console.error("Failed to get connected tools:", formatComposioError(err));
    return [];
  }
}

async function enrichDownloadedContent(resultData: any): Promise<any> {
  if (!resultData || typeof resultData !== "object") return resultData;
  const fileObj =
    resultData.downloaded_file_content ||
    resultData.file ||
    resultData.data?.downloaded_file_content ||
    resultData;
  const s3url =
    fileObj?.s3url ||
    fileObj?.s3_url ||
    resultData?.s3url ||
    resultData?.s3_url ||
    fileObj?.downloadUrl ||
    fileObj?.download_url ||
    resultData?.downloadUrl ||
    resultData?.download_url ||
    (typeof fileObj?.url === "string" && fileObj.url.startsWith("http") ? fileObj.url : undefined) ||
    (typeof resultData?.url === "string" && resultData.url.startsWith("http") ? resultData.url : undefined);
  const filename =
    fileObj?.name ||
    fileObj?.filename ||
    resultData?.name ||
    "downloaded-file";
  const ext = (filename.split(".").pop() || "").toLowerCase();

  if (typeof s3url === "string" && s3url.startsWith("http")) {
    try {
      const res = await fetch(s3url, { signal: AbortSignal.timeout(20_000) });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const { extractText } = await import("./documents");
        const extracted = await extractText(ext || "pdf", buf);
        return {
          ...resultData,
          file_name: filename,
          extracted_text: extracted.slice(0, 15_000),
          extracted_chars: extracted.length,
          note: "File content was successfully downloaded and extracted from Google Drive.",
        };
      }
    } catch (err: any) {
      console.warn("Could not enrich downloaded file content:", err?.message || err);
    }
  }
  return resultData;
}

export async function executeComposioTool(
  userId: string,
  slug: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  let composio = getComposio();
  if (!composio) return { ok: false, error: "Composio is not configured" };

  const doExecute = async (c: Composio) => {
    const res: any = await c.tools.execute(slug, {
      userId,
      arguments: args,
      dangerouslySkipVersionCheck: true,
    } as any);
    if (res?.successful === false) {
      return { ok: false, error: String(res.error || "tool failed").slice(0, 500) };
    }
    const rawData = res?.data ?? res;
    const enriched = await enrichDownloadedContent(rawData);
    return { ok: true, data: enriched };
  };

  try {
    return await doExecute(composio);
  } catch (err: any) {
    const fallbackClient = createComposioClient();
    if (fallbackClient) {
      try {
        const res = await doExecute(fallbackClient);
        client = fallbackClient;
        return res;
      } catch {}
    }
    return { ok: false, error: formatComposioError(err) };
  }
}


export interface AppToolInfo {
  tool: string;
  app: string;
  description: string;
  write: boolean;
  required: string[];
  params: Record<string, string>;
}

const summarize = (t: any): AppToolInfo => {
  const props = (t.inputParameters?.properties || {}) as Record<string, any>;
  const required: string[] = (t.inputParameters?.required || []).filter((k: string) => k in props);
  const names = [...required, ...Object.keys(props).filter((k) => !required.includes(k))].slice(0, 14);
  return {
    tool: t.slug,
    app: t.toolkit?.slug || "",
    description: String(t.description || "").slice(0, 220),
    write: isWriteTool(t.slug),
    required,
    params: Object.fromEntries(
      names.map((k) => [k, `${props[k]?.type || "any"}${required.includes(k) ? " (required)" : ""}: ${String(props[k]?.description || "").slice(0, 90)}`]),
    ),
  };
};

const READ_QUERY = /\b(list|find|get|search|read|fetch|show|view|look|check|retrieve)\b/i;

/** Composio's own ranking is loose, so over-fetch and re-rank by how well the name and description match the query. */
function rank(tools: AppToolInfo[], query: string): AppToolInfo[] {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const wantsRead = READ_QUERY.test(query);
  const score = (t: AppToolInfo) => {
    const name = t.tool.toLowerCase().split("_");
    const desc = t.description.toLowerCase();
    let sc = 0;
    for (const w of words) {
      if (name.includes(w) || name.includes(w.replace(/s$/, ""))) sc += 3;
      else if (desc.includes(w)) sc += 1;
    }
    if (wantsRead && !t.write) sc += 2;
    if (wantsRead && t.write) sc -= 2;
    return sc;
  };
  return tools.map((t) => ({ t, s: score(t) })).sort((x, y) => y.s - x.s).map((x) => x.t);
}

/** Search the FULL tool catalogue of the given apps (hundreds per app), not just the few offered directly. */
export async function searchAppTools(toolkits: string[], query: string, limit = 8): Promise<AppToolInfo[]> {
  const composio: any = getComposio();
  if (!composio) return [];
  const perApp = await Promise.all(
    toolkits.map(async (toolkit) => {
      try {
        const raw: any = await composio.tools.getRawComposioTools({ toolkits: [toolkit], search: query, limit: 40 });
        const list = ((Array.isArray(raw) ? raw : raw?.items || []) as any[]).filter((t) => !t.isDeprecated).map(summarize);
        return rank(list, query).slice(0, limit);
      } catch {
        return [];
      }
    }),
  );
  return perApp.flat();
}

/** One tool's metadata straight from the catalogue; null if the slug does not exist. */
export async function getAppTool(slug: string): Promise<AppToolInfo | null> {
  const composio: any = getComposio();
  if (!composio) return null;
  try {
    const t: any = await composio.tools.getRawComposioToolBySlug(slug);
    return t?.slug ? summarize(t) : null;
  } catch {
    return null;
  }
}
