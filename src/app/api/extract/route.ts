import { NextRequest, NextResponse } from "next/server";
import { resolveCaller } from "@/lib/agent/identity";
import { ALLOWED_EXTENSIONS, extensionOf, extractText, matchesMagic, MAX_FILE_BYTES } from "@/lib/agent/documents";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status });

/**
 * Ephemeral document knowledge extraction endpoint.
 * Extracts plain text from multi-format files (PDF, DOCX, XLSX, CSV, JSON, MD, TXT, etc.)
 * directly in memory for chat prompts, without saving to permanent FalkorDB Doc catalog.
 */
export async function POST(req: NextRequest) {
  try {
    const caller = await resolveCaller(req);
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return json({ error: "A valid file is required" }, 400);
    }

    const blob = file as Blob & { name?: string };
    const name = blob.name || "knowledge-attachment";

    if (blob.size > MAX_FILE_BYTES) {
      return json({ error: `File exceeds maximum size of ${Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB` }, 400);
    }

    const ext = extensionOf(name);
    if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
      return json(
        {
          error: `Unsupported file type (.${ext}). Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        400,
      );
    }

    const arrayBuf = await blob.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    if (!matchesMagic(ext, buf)) {
      return json({ error: `File content does not match the .${ext} format` }, 400);
    }

    const text = await extractText(ext, buf);

    return json({
      ok: true,
      name,
      ext,
      size: blob.size,
      chars: text.length,
      text: text.slice(0, 50_000), // Cap ephemeral prompt payload to safe size
    });
  } catch (err: any) {
    console.error("Ephemeral extraction error:", err);
    return json({ error: err?.message || "Failed to extract text from file" }, 500);
  }
}
