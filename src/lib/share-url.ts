import { STICKERS, STICKER_BY_NUMBER, TOTAL_STICKERS } from "./album";
import type { Counts } from "./collection";

const VERSION = 1;

async function gzipEncode(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    throw new Error(
      "Tu navegador no soporta CompressionStream. Comparte el archivo .json en su lugar.",
    );
  }
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const ab = await new Response(stream).arrayBuffer();
  return new Uint8Array(ab);
}

async function gzipDecode(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Tu navegador no soporta DecompressionStream.");
  }
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  const ab = await new Response(stream).arrayBuffer();
  return new Uint8Array(ab);
}

function toBase64Url(data: Uint8Array): string {
  let s = "";
  for (let i = 0; i < data.length; i++) s += String.fromCharCode(data[i]);
  return btoa(s)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  let str = s.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Formato binario v1:
 *   byte 0:    versión (1)
 *   byte 1:    longitud del nombre en bytes UTF-8 (0..255)
 *   bytes 2..: nombre UTF-8
 *   resto:     980 bytes, uno por sticker, indexados por sticker.number - 1.
 *              Cada byte = count (clamp 0..255).
 *
 * Después: gzip + base64url. Va en el fragmento `#d=...` para que no
 * llegue al servidor.
 */
export async function encodeSharePayload(
  counts: Counts,
  ownerName?: string,
): Promise<string> {
  const name = (ownerName ?? "").trim().slice(0, 64);
  const nameBytes = new TextEncoder().encode(name);
  if (nameBytes.length > 255) {
    throw new Error("El nombre es demasiado largo");
  }
  const buf = new Uint8Array(2 + nameBytes.length + TOTAL_STICKERS);
  buf[0] = VERSION;
  buf[1] = nameBytes.length;
  buf.set(nameBytes, 2);
  const offset = 2 + nameBytes.length;
  for (const s of STICKERS) {
    const c = counts[s.code] ?? 0;
    if (c > 0) buf[offset + s.number - 1] = Math.min(255, c);
  }
  const gz = await gzipEncode(buf);
  return toBase64Url(gz);
}

export async function decodeSharePayload(
  b64: string,
): Promise<{ counts: Counts; ownerName?: string }> {
  let gz: Uint8Array;
  try {
    gz = fromBase64Url(b64);
  } catch {
    throw new Error("El enlace está corrupto");
  }
  const buf = await gzipDecode(gz);
  if (buf.length < 2) throw new Error("Datos inválidos");
  const version = buf[0];
  if (version !== VERSION) {
    throw new Error(`Versión ${version} no soportada por esta app`);
  }
  const nameLen = buf[1];
  const offset = 2 + nameLen;
  if (buf.length < offset + TOTAL_STICKERS) {
    throw new Error("Datos truncados");
  }
  const name = new TextDecoder().decode(buf.slice(2, 2 + nameLen));
  const counts: Counts = {};
  for (let i = 0; i < TOTAL_STICKERS; i++) {
    const c = buf[offset + i];
    if (c > 0) {
      const s = STICKER_BY_NUMBER.get(i + 1);
      if (s) counts[s.code] = c;
    }
  }
  return { counts, ownerName: name || undefined };
}

export async function buildShareUrl(
  counts: Counts,
  ownerName?: string,
): Promise<string> {
  const payload = await encodeSharePayload(counts, ownerName);
  const base =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/#d=${payload}`;
}

export function readSharePayloadFromHash(hash: string): string | null {
  const trimmed = hash.replace(/^#/, "");
  if (!trimmed) return null;
  const params = new URLSearchParams(trimmed);
  const d = params.get("d");
  return d && d.length > 0 ? d : null;
}

export const SESSION_INCOMING_FRIEND_KEY = "album-2026:incoming-friend";
