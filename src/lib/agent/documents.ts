import { getGraph } from "@/lib/falkordb";
import type { Caller } from "./identity";

/**
 * User-uploaded documents, stored in the caller's own FalkorDB graph so the agent can search and cite them:
 *
 *   (:Doc {id, name, source: 'upload:<id>', kind: 'upload', type, size, chars, uploaded_at})
 *   (:Chunk {id, doc_id, idx, text})-[:PART_OF]->(:Doc)      <- full-text indexed
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCS = 30;
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "doc",
  "xlsx",
  "xls",
  "csv",
  "tsv",
  "txt",
  "md",
  "markdown",
  "json",
  "yaml",
  "yml",
  "xml",
  "html",
  "htm",
  "rtf",
  "log",
] as const;
export type DocType = (typeof ALLOWED_EXTENSIONS)[number];

const MAX_TEXT_CHARS = 400_000;
const CHUNK_CHARS = 1500;
const CHUNK_OVERLAP = 200;
const MAX_CHUNKS = 300;

const id = () => `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function extensionOf(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase();
}

/** Cheap content check so a renamed binary is not parsed as the type its name claims. */
export function matchesMagic(ext: string, buf: Buffer): boolean {
  const e = ext.toLowerCase();
  if (e === "pdf") return buf.subarray(0, 5).toString("latin1") === "%PDF-";
  if (e === "docx" || e === "xlsx") return buf[0] === 0x50 && buf[1] === 0x4b; // zip container
  if (e === "doc" || e === "xls") {
    // OLE2 Compound File Binary Format or printable text
    return (buf[0] === 0xd0 && buf[1] === 0xcf) || !buf.subarray(0, 4096).includes(0);
  }
  return !buf.subarray(0, 4096).includes(0); // text formats must not contain NUL bytes
}

function extractPrintableText(buf: Buffer): string {
  const str = buf.toString("latin1");
  const matches = str.match(/[A-Za-z0-9\s.,!?:;\-_@#%&*()\[\]{}]{4,}/g) || [];
  return matches.join(" ");
}

export async function extractText(ext: string, buf: Buffer): Promise<string> {
  let text = "";
  const normalizedExt = ext.toLowerCase();

  if (normalizedExt === "pdf") {
    const { getDocumentProxy, extractText: pdfText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const out = await pdfText(pdf, { mergePages: true });
    text = Array.isArray(out.text) ? out.text.join("\n") : out.text;
  } else if (normalizedExt === "docx") {
    const mammoth = await import("mammoth");
    text = (await mammoth.extractRawText({ buffer: buf })).value;
  } else if (normalizedExt === "doc") {
    try {
      const mammoth = await import("mammoth");
      const res = await mammoth.extractRawText({ buffer: buf });
      text = res.value || extractPrintableText(buf);
    } catch {
      text = extractPrintableText(buf);
    }
  } else if (normalizedExt === "xlsx") {
    const { default: readXlsx } = await import("read-excel-file/node");
    const sheets: any[] = (await readXlsx(buf)) as any;
    text = sheets
      .map((s) => `## Sheet: ${s.sheet}\n` + (s.data as any[][]).map((row) => row.map((c) => (c ?? "") + "").join(" | ")).join("\n"))
      .join("\n\n");
  } else if (normalizedExt === "xls") {
    try {
      const { default: readXlsx } = await import("read-excel-file/node");
      const sheets: any[] = (await readXlsx(buf)) as any;
      text = sheets
        .map((s) => `## Sheet: ${s.sheet}\n` + (s.data as any[][]).map((row) => row.map((c) => (c ?? "") + "").join(" | ")).join("\n"))
        .join("\n\n");
    } catch {
      text = extractPrintableText(buf);
    }
  } else if (normalizedExt === "json") {
    try {
      const parsed = JSON.parse(buf.toString("utf8"));
      text = JSON.stringify(parsed, null, 2);
    } catch {
      text = buf.toString("utf8");
    }
  } else if (normalizedExt === "html" || normalizedExt === "htm") {
    const raw = buf.toString("utf8");
    text = raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');
  } else if (normalizedExt === "csv" || normalizedExt === "tsv") {
    const delimiter = normalizedExt === "tsv" ? "\t" : ",";
    const raw = buf.toString("utf8");
    text = raw
      .split("\n")
      .map((line) => line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, "")).join(" | "))
      .join("\n");
  } else {
    text = buf.toString("utf8");
  }

  text = text.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text.slice(0, MAX_TEXT_CHARS);
}

/** Split on paragraph breaks where possible, with a small overlap so a fact cut at a boundary is still found. */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(start + CHUNK_CHARS, text.length);
    if (end < text.length) {
      const brk = text.lastIndexOf("\n", end);
      if (brk > start + CHUNK_CHARS / 2) end = brk;
    }
    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return chunks;
}

const indexed = new Set<string>();
async function ensureIndex(graphId: string) {
  if (indexed.has(graphId)) return;
  const graph = await getGraph(graphId);
  try {
    await graph.query("CALL db.idx.fulltext.createNodeIndex('Chunk', 'text')");
  } catch {
    /* already exists */
  }
  indexed.add(graphId);
}

export interface DocInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  chars: number;
  chunks: number;
  uploaded_at: string;
}

export async function listDocuments(c: Caller): Promise<DocInfo[]> {
  const graph = await getGraph(c.graph);
  try {
    const res = await graph.roQuery(
      `MATCH (d:Doc {kind: 'upload'})
       OPTIONAL MATCH (k:Chunk)-[:PART_OF]->(d)
       RETURN d.id AS id, d.name AS name, d.type AS type, d.size AS size, d.chars AS chars, d.uploaded_at AS uploaded_at, count(k) AS chunks
       ORDER BY d.uploaded_at DESC`,
    );
    return (res.data as any[]) || [];
  } catch {
    return []; // graph does not exist yet
  }
}

export async function storeDocument(
  c: Caller,
  doc: { name: string; type: string; size: number; text: string },
): Promise<{ id: string; chunks: number }> {
  await ensureIndex(c.graph);
  const graph = await getGraph(c.graph);
  const docId = id();
  const chunks = chunkText(doc.text);
  await graph.query(
    `CREATE (d:Doc {id: $id, name: $name, source: $source, kind: 'upload', type: $type, size: $size, chars: $chars, uploaded_at: $at})`,
    { params: { id: docId, name: doc.name, source: `upload:${docId}`, type: doc.type, size: doc.size, chars: doc.text.length, at: new Date().toISOString() } },
  );
  for (let i = 0; i < chunks.length; i++) {
    await graph.query(
      `MATCH (d:Doc {id: $doc}) CREATE (k:Chunk {id: $cid, doc_id: $doc, idx: $idx, text: $text})-[:PART_OF]->(d)`,
      { params: { doc: docId, cid: `${docId}-${i}`, idx: i, text: chunks[i] } },
    );
  }
  return { id: docId, chunks: chunks.length };
}

export async function deleteDocument(c: Caller, id: string): Promise<boolean> {
  const graph = await getGraph(c.graph);
  const found = await graph.roQuery(`MATCH (d:Doc {id: $id, kind: 'upload'}) RETURN count(d) AS n`, { params: { id } });
  if (!Number((found.data as any[])?.[0]?.n)) return false;
  await graph.query(`MATCH (k:Chunk {doc_id: $id}) DELETE k`, { params: { id } });
  await graph.query(`MATCH (d:Doc {id: $id, kind: 'upload'}) DELETE d`, { params: { id } });
  return true;
}

export async function searchDocuments(c: Caller, query: string, limit = 6) {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2)
    .slice(0, 8);
  if (!words.length) return [];
  const graph = await getGraph(c.graph);
  try {
    await ensureIndex(c.graph);
    const res = await graph.roQuery(
      `CALL db.idx.fulltext.queryNodes('Chunk', $q) YIELD node, score
       MATCH (node)-[:PART_OF]->(d:Doc)
       RETURN d.name AS document, d.id AS documentId, node.idx AS part, node.text AS text, score
       ORDER BY score DESC LIMIT $limit`,
      { params: { q: words.join("|"), limit } },
    );
    if ((res.data as any[])?.length) return res.data as any[];
  } catch {
    /* fall through to substring search */
  }
  try {
    const res = await graph.roQuery(
      `MATCH (node:Chunk)-[:PART_OF]->(d:Doc)
       WHERE any(w IN $words WHERE toLower(node.text) CONTAINS w)
       RETURN d.name AS document, d.id AS documentId, node.idx AS part, node.text AS text LIMIT $limit`,
      { params: { words, limit } },
    );
    return (res.data as any[]) || [];
  } catch {
    return [];
  }
}

export async function readDocument(c: Caller, ref: string, part = 0, count = 3) {
  const graph = await getGraph(c.graph);
  const res = await graph.roQuery(
    `MATCH (d:Doc {kind: 'upload'}) WHERE d.id = $ref OR toLower(d.name) = toLower($ref)
     WITH d LIMIT 1
     OPTIONAL MATCH (k:Chunk)-[:PART_OF]->(d) WHERE k.idx >= $part AND k.idx < $part + $count
     RETURN d.name AS document, d.id AS documentId, d.chars AS chars, k.idx AS part, k.text AS text ORDER BY k.idx`,
    { params: { ref, part, count } },
  );
  const rows = (res.data as any[]) || [];
  if (!rows.length) return null;
  return { document: rows[0].document, documentId: rows[0].documentId, parts: rows.filter((r) => r.text != null).map((r) => ({ part: r.part, text: r.text })) };
}
