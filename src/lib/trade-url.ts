// Formato de enlace de intercambio: hash `#t=<base64url(gzip(json))>`.
// El payload describe la propuesta desde la perspectiva del que la envía:
//   - pido: cromos que pido al receptor (los entregará)
//   - doy:  cromos que regalo al receptor (los recibirá)
// El receptor invierte la perspectiva al aceptar.

const VERSION = 1;

export type TradePayload = {
  v: 1;
  id: string;
  from?: string;
  pido: string[];
  doy: string[];
};

async function gzipEncode(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    throw new Error(
      "Tu navegador no soporta CompressionStream. Comparte el intercambio como texto.",
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

export function newTradeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  }
  return Math.random().toString(36).slice(2, 12);
}

export async function encodeTradePayload(payload: TradePayload): Promise<string> {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const gz = await gzipEncode(bytes);
  return toBase64Url(gz);
}

export async function decodeTradePayload(b64: string): Promise<TradePayload> {
  let gz: Uint8Array;
  try {
    gz = fromBase64Url(b64);
  } catch {
    throw new Error("El enlace está corrupto");
  }
  const buf = await gzipDecode(gz);
  const json = new TextDecoder().decode(buf);
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("El enlace no contiene un intercambio");
  }
  if (
    !data ||
    typeof data !== "object" ||
    (data as { v?: unknown }).v !== VERSION ||
    typeof (data as { id?: unknown }).id !== "string" ||
    !Array.isArray((data as { pido?: unknown }).pido) ||
    !Array.isArray((data as { doy?: unknown }).doy)
  ) {
    throw new Error("Intercambio inválido o de una versión no soportada");
  }
  return data as TradePayload;
}

export async function buildTradeUrl(payload: TradePayload): Promise<string> {
  const b64 = await encodeTradePayload(payload);
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/#t=${b64}`;
}

export function readTradePayloadFromHash(hash: string): string | null {
  const trimmed = hash.replace(/^#/, "");
  if (!trimmed) return null;
  const params = new URLSearchParams(trimmed);
  const t = params.get("t");
  return t && t.length > 0 ? t : null;
}

/**
 * Acepta texto del portapapeles en cualquier formato razonable:
 *   - URL completa con `#t=PAYLOAD`
 *   - `#t=PAYLOAD` literal
 *   - `t=PAYLOAD` literal
 * Devuelve el payload base64url o null si no es un enlace de intercambio.
 */
export function extractTradePayload(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const fromHash = readTradePayloadFromHash(url.hash);
    if (fromHash) return fromHash;
    const fromQuery = url.searchParams.get("t");
    if (fromQuery && fromQuery.length > 0) return fromQuery;
  } catch {}
  if (trimmed.startsWith("#") || trimmed.startsWith("?")) {
    const params = new URLSearchParams(trimmed.slice(1));
    const t = params.get("t");
    if (t && t.length > 0) return t;
  }
  if (trimmed.startsWith("t=")) {
    const params = new URLSearchParams(trimmed);
    const t = params.get("t");
    if (t && t.length > 0) return t;
  }
  return null;
}
