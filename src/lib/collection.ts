"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  STICKERS,
  TOTAL_STICKERS,
  STICKER_BY_NUMBER,
  getStickerByCode,
} from "./album";

// Counts está claveado por código del cromo (ej. "MEX 1", "FWC 5", "00").
// Es estable frente a reordenaciones del array TEAMS.
export type Counts = Record<string, number>;

export type ExportPayload = {
  app: "album-2026";
  version: 2;
  exportedAt: string;
  ownerName?: string;
  counts: Counts;
};

const STORAGE_KEY = "album-2026:counts:v2";
const LEGACY_STORAGE_KEY = "album-2026:counts:v1";
const NAME_KEY = "album-2026:owner-name:v1";

const EMPTY_COUNTS: Counts = Object.freeze({}) as Counts;

const listeners = new Set<() => void>();
let memoryCounts: Counts | null = null;
let memoryName: string | null = null;

function migrateLegacy(raw: string): Counts {
  // Formato v1: claves numéricas (global sticker number).
  // Convertir a claves por código usando el mapa por número.
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Counts = {};
    for (const [k, v] of Object.entries(parsed)) {
      const n = Number(k);
      const c = Number(v);
      if (!Number.isFinite(n) || !Number.isFinite(c) || c <= 0) continue;
      const s = STICKER_BY_NUMBER.get(n);
      if (s) out[s.code] = c;
    }
    return out;
  } catch {
    return {};
  }
}

function readFromStorage(): Counts {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const out: Counts = {};
        for (const [k, v] of Object.entries(parsed)) {
          const c = Number(v);
          if (typeof k === "string" && Number.isFinite(c) && c > 0) out[k] = c;
        }
        return out;
      }
    }
    // Migración desde v1.
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const migrated = migrateLegacy(legacyRaw);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
  } catch {}
  return {};
}

function readNameFromStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeToStorage(counts: Counts) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {}
}

function writeNameToStorage(name: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAME_KEY, name);
  } catch {}
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshotCounts(): Counts {
  if (memoryCounts === null) memoryCounts = readFromStorage();
  return memoryCounts;
}

function getSnapshotName(): string {
  if (memoryName === null) memoryName = readNameFromStorage();
  return memoryName;
}

function getServerSnapshotCounts(): Counts {
  return EMPTY_COUNTS;
}

function getServerSnapshotName(): string {
  return "";
}

function setCount(code: string, value: number) {
  const current = getSnapshotCounts();
  const next: Counts = { ...current };
  if (value <= 0) delete next[code];
  else next[code] = value;
  memoryCounts = next;
  writeToStorage(next);
  emit();
}

function setName(name: string) {
  memoryName = name;
  writeNameToStorage(name);
  emit();
}

function replaceAll(counts: Counts) {
  const clean: Counts = {};
  for (const [k, v] of Object.entries(counts)) {
    const c = Number(v);
    if (typeof k === "string" && Number.isFinite(c) && c > 0) clean[k] = c;
  }
  memoryCounts = clean;
  writeToStorage(clean);
  emit();
}

export function useCollection() {
  const counts = useSyncExternalStore(
    subscribe,
    getSnapshotCounts,
    getServerSnapshotCounts,
  );
  const ownerName = useSyncExternalStore(
    subscribe,
    getSnapshotName,
    getServerSnapshotName,
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
        memoryCounts = readFromStorage();
        emit();
      }
      if (e.key === NAME_KEY) {
        memoryName = readNameFromStorage();
        emit();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const increment = useCallback((code: string) => {
    const current = getSnapshotCounts()[code] ?? 0;
    setCount(code, current + 1);
  }, []);

  const decrement = useCallback((code: string) => {
    const current = getSnapshotCounts()[code] ?? 0;
    setCount(code, Math.max(0, current - 1));
  }, []);

  const setExact = useCallback((code: string, v: number) => {
    setCount(code, Math.max(0, Math.floor(v)));
  }, []);

  const reset = useCallback(() => {
    replaceAll({});
  }, []);

  const importCounts = useCallback((next: Counts) => {
    replaceAll(next);
  }, []);

  return {
    counts,
    ownerName,
    setOwnerName: setName,
    increment,
    decrement,
    setExact,
    reset,
    importCounts,
  };
}

export function summarize(counts: Counts) {
  let owned = 0;
  let dupes = 0;
  let missing = 0;
  for (const s of STICKERS) {
    const c = counts[s.code] ?? 0;
    if (c === 0) missing += 1;
    else {
      owned += 1;
      if (c > 1) dupes += c - 1;
    }
  }
  return {
    owned,
    missing,
    dupes,
    total: TOTAL_STICKERS,
    percent: Math.round((owned / TOTAL_STICKERS) * 1000) / 10,
  };
}

export function summarizeSection(
  counts: Counts,
  range: [number, number],
) {
  let owned = 0;
  let dupes = 0;
  const total = range[1] - range[0] + 1;
  for (let n = range[0]; n <= range[1]; n++) {
    const s = STICKER_BY_NUMBER.get(n);
    if (!s) continue;
    const c = counts[s.code] ?? 0;
    if (c >= 1) owned += 1;
    if (c > 1) dupes += c - 1;
  }
  return {
    owned,
    missing: total - owned,
    dupes,
    total,
    percent: Math.round((owned / total) * 1000) / 10,
  };
}

export function buildExport(counts: Counts, ownerName?: string): ExportPayload {
  return {
    app: "album-2026",
    version: 2,
    exportedAt: new Date().toISOString(),
    ownerName: ownerName?.trim() || undefined,
    counts,
  };
}

export function parseImport(text: string): ExportPayload {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("Archivo inválido");
  if (data.app !== "album-2026")
    throw new Error("No es un archivo del álbum 2026");
  if (typeof data.counts !== "object" || data.counts === null)
    throw new Error("Archivo sin colección");

  // v1 (numérico) → v2 (códigos)
  if (data.version === 1) {
    const migrated: Counts = {};
    for (const [k, v] of Object.entries(data.counts)) {
      const n = Number(k);
      const c = Number(v);
      if (!Number.isFinite(n) || !Number.isFinite(c) || c <= 0) continue;
      const s = STICKER_BY_NUMBER.get(n);
      if (s) migrated[s.code] = c;
    }
    return {
      app: "album-2026",
      version: 2,
      exportedAt: data.exportedAt ?? new Date().toISOString(),
      ownerName: data.ownerName,
      counts: migrated,
    };
  }

  return data as ExportPayload;
}

export type TradeMatch = {
  code: string;
  myCount: number;
  theirCount: number;
};

export function compareCollections(
  mine: Counts,
  theirs: Counts,
): {
  iWantFromThem: TradeMatch[];
  iCanGiveThem: TradeMatch[];
} {
  const iWantFromThem: TradeMatch[] = [];
  const iCanGiveThem: TradeMatch[] = [];
  for (const s of STICKERS) {
    const m = mine[s.code] ?? 0;
    const t = theirs[s.code] ?? 0;
    if (m === 0 && t > 1) {
      iWantFromThem.push({ code: s.code, myCount: m, theirCount: t });
    }
    if (m > 1 && t === 0) {
      iCanGiveThem.push({ code: s.code, myCount: m, theirCount: t });
    }
  }
  return { iWantFromThem, iCanGiveThem };
}

export function buildWhatsappText(counts: Counts, ownerName?: string): string {
  const missing: string[] = [];
  const dupes: { code: string; c: number }[] = [];
  for (const s of STICKERS) {
    const c = counts[s.code] ?? 0;
    if (c === 0) missing.push(s.code);
    else if (c > 1) dupes.push({ code: s.code, c: c - 1 });
  }

  const header = ownerName
    ? `📒 Álbum Mundial 2026 — ${ownerName}`
    : "📒 Álbum Mundial 2026";

  const parts = [header, ""];

  parts.push(`🤝 ME SOBRAN (${dupes.length}):`);
  if (dupes.length === 0) parts.push("—");
  else {
    parts.push(
      dupes
        .map(({ code, c }) => (c > 1 ? `${code} ×${c}` : code))
        .join(", "),
    );
  }
  parts.push("");

  parts.push(`📌 ME FALTAN (${missing.length}):`);
  if (missing.length === 0) parts.push("—");
  else {
    parts.push(missing.join(", "));
  }

  return parts.join("\n");
}

export function buildTradeProposalText(opts: {
  ownerName?: string;
  friendName?: string;
  pido: string[];
  doy: string[];
}): string {
  const { ownerName, friendName, pido, doy } = opts;
  const me = ownerName?.trim() || "Yo";
  const them = friendName?.trim() || "Tú";

  const parts = [
    `📒 Intercambio Álbum 2026 — ${me} ↔ ${them}`,
    "",
    `🔁 Te pido (${pido.length}):`,
  ];
  if (pido.length === 0) parts.push("—");
  else {
    for (const code of pido) {
      const s = getStickerByCode(code);
      const team = s?.sectionName ? ` — ${s.sectionName}` : "";
      parts.push(`• ${code}${team}`);
    }
  }
  parts.push("");
  parts.push(`🤝 Te doy (${doy.length}):`);
  if (doy.length === 0) parts.push("—");
  else {
    for (const code of doy) {
      const s = getStickerByCode(code);
      const team = s?.sectionName ? ` — ${s.sectionName}` : "";
      parts.push(`• ${code}${team}`);
    }
  }
  parts.push("");
  parts.push(`(${pido.length} ↔ ${doy.length})`);

  return parts.join("\n");
}
