import { NextRequest } from "next/server";
import { resolveCaller } from "@/lib/agent/identity";
import {
  ALLOWED_EXTENSIONS,
  MAX_DOCS,
  MAX_FILE_BYTES,
  deleteDocument,
  extensionOf,
  extractText,
  listDocuments,
  matchesMagic,
  storeDocument,
} from "@/lib/agent/documents";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function signedIn(req: NextRequest) {
  const caller = await resolveCaller(req);
  if (!caller) return { error: json({ error: "Invalid or expired sign-in token" }, 401) };
  if (!caller.authenticated) return { error: json({ error: "Sign in to upload documents" }, 401) };
  return { caller };
}

export async function GET(req: NextRequest) {
  const auth = await signedIn(req);
  if (auth.error) return auth.error;
  return json({ documents: await listDocuments(auth.caller!), limit: MAX_DOCS });
}

/** multipart/form-data with one or more `files`. Each file is parsed to text, chunked and stored in the user's graph. */
export async function POST(req: NextRequest) {
  const auth = await signedIn(req);
  if (auth.error) return auth.error;
  const caller = auth.caller!;

  const rl = rateLimit(`upload:${caller.id}`, 10);
  if (!rl.ok) return json({ error: "Too many uploads; slow down" }, 429);

  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("files") || []).filter((f): f is File => typeof f !== "string");
  if (!files.length) return json({ error: "Attach at least one file as `files`" }, 400);
  if (files.length > 5) return json({ error: "Upload at most 5 files at a time" }, 400);

  let existing = (await listDocuments(caller)).length;
  const results: Record<string, unknown>[] = [];
  for (const file of files) {
    const name = file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "document";
    const ext = extensionOf(name);
    const fail = (error: string) => results.push({ name, ok: false, error });
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      fail(`Unsupported type .${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      fail(`Larger than ${MAX_FILE_BYTES / 1024 / 1024} MB`);
      continue;
    }
    if (existing >= MAX_DOCS) {
      fail(`Document limit reached (${MAX_DOCS}). Delete one first.`);
      continue;
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      if (!matchesMagic(ext, buf)) {
        fail(`File content does not look like a .${ext}`);
        continue;
      }
      const text = await extractText(ext, buf);
      if (text.length < 20) {
        fail("No readable text found (a scanned PDF or an empty file?)");
        continue;
      }
      const stored = await storeDocument(caller, { name, type: ext, size: file.size, text });
      existing++;
      results.push({ name, ok: true, id: stored.id, chunks: stored.chunks, chars: text.length });
    } catch (err: any) {
      fail(`Could not read the file: ${String(err?.message || err).slice(0, 120)}`);
    }
  }
  return json({ results });
}

export async function DELETE(req: NextRequest) {
  const auth = await signedIn(req);
  if (auth.error) return auth.error;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return json({ error: "id is required" }, 400);
  return (await deleteDocument(auth.caller!, id)) ? json({ deleted: id }) : json({ error: "Document not found" }, 404);
}
