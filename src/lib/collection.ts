"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  STICKERS,
  TOTAL_STICKERS,
  STICKER_BY_NUMBER,
  getStickerByCode,
} from "./album";
import { UPDATE_ENTRIES, TOTAL_UPDATE } from "./update-set";

// Counts está claveado por código del cromo (ej. "MEX 1", "FWC 5", "00").
// Es estable frente a reordenaciones del array TEAMS.
export type Counts = Record<string, number>;

// Cómo cuentan los cromos del update set frente a la colección original:
// - "substitute": el jugador actualizado vale para completar el mismo slot
//   (si no tenías MEX 2, marcar al alternativo lo da por conseguido).
// - "addition": colección aparte; el total de 980 no se toca.
export type UpdateMode = "substitute" | "addition";

export type ExportPayload = {
  app: "album-2026";
  version: 1;
  exportedAt: string;
  ownerName?: string;
  counts: Counts;
  hasUpdateSet?: boolean;
  updateMode?: UpdateMode;
  updateOwned?: Counts;
};

const STORAGE_KEY = "album-2026:counts:v1";
const NAME_KEY = "album-2026:owner-name:v1";
const HAS_UPDATE_KEY = "album-2026:has-update-set:v1";
const UPDATE_MODE_KEY = "album-2026:update-mode:v1";
const UPDATE_OWNED_KEY = "album-2026:update-owned:v1";
const UPDATE_BANNER_KEY = "album-2026:update-banner-dismissed:v1";

const EMPTY_COUNTS: Counts = Object.freeze({}) as Counts;
const DEFAULT_UPDATE_MODE: UpdateMode = "addition";

const listeners = new Set<() => void>();
let memoryCounts: Counts | null = null;
let memoryName: string | null = null;
let memoryHasUpdate: boolean | null = null;
let memoryUpdateMode: UpdateMode | null = null;
let memoryUpdateOwned: Counts | null = null;
let memoryUpdateBannerDismissed: boolean | null = null;

function readFromStorage(): Counts {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Counts = {};
    for (const [k, v] of Object.entries(parsed)) {
      const c = Number(v);
      if (typeof k === "string" && Number.isFinite(c) && c > 0) out[k] = c;
    }
    return out;
  } catch {
    return {};
  }
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

function readHasUpdateFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HAS_UPDATE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeHasUpdateToStorage(v: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HAS_UPDATE_KEY, v ? "1" : "0");
  } catch {}
}

function readUpdateModeFromStorage(): UpdateMode {
  if (typeof window === "undefined") return DEFAULT_UPDATE_MODE;
  try {
    const raw = window.localStorage.getItem(UPDATE_MODE_KEY);
    return raw === "substitute" || raw === "addition"
      ? raw
      : DEFAULT_UPDATE_MODE;
  } catch {
    return DEFAULT_UPDATE_MODE;
  }
}

function writeUpdateModeToStorage(mode: UpdateMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UPDATE_MODE_KEY, mode);
  } catch {}
}

function readUpdateOwnedFromStorage(): Counts {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(UPDATE_OWNED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Counts = {};
    for (const [k, v] of Object.entries(parsed)) {
      const c = Number(v);
      if (typeof k === "string" && Number.isFinite(c) && c > 0) out[k] = c;
    }
    return out;
  } catch {
    return {};
  }
}

function writeUpdateOwnedToStorage(owned: Counts) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UPDATE_OWNED_KEY, JSON.stringify(owned));
  } catch {}
}

function readUpdateBannerDismissedFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(UPDATE_BANNER_KEY) === "1";
  } catch {
    return false;
  }
}

function writeUpdateBannerDismissedToStorage(v: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UPDATE_BANNER_KEY, v ? "1" : "0");
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

function getSnapshotHasUpdate(): boolean {
  if (memoryHasUpdate === null) memoryHasUpdate = readHasUpdateFromStorage();
  return memoryHasUpdate;
}

function getServerSnapshotHasUpdate(): boolean {
  return false;
}

function getSnapshotUpdateMode(): UpdateMode {
  if (memoryUpdateMode === null)
    memoryUpdateMode = readUpdateModeFromStorage();
  return memoryUpdateMode;
}

function getServerSnapshotUpdateMode(): UpdateMode {
  return DEFAULT_UPDATE_MODE;
}

function getSnapshotUpdateOwned(): Counts {
  if (memoryUpdateOwned === null)
    memoryUpdateOwned = readUpdateOwnedFromStorage();
  return memoryUpdateOwned;
}

function getServerSnapshotUpdateOwned(): Counts {
  return EMPTY_COUNTS;
}

function getSnapshotUpdateBannerDismissed(): boolean {
  if (memoryUpdateBannerDismissed === null)
    memoryUpdateBannerDismissed = readUpdateBannerDismissedFromStorage();
  return memoryUpdateBannerDismissed;
}

function getServerSnapshotUpdateBannerDismissed(): boolean {
  return false;
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

function setHasUpdate(v: boolean) {
  memoryHasUpdate = v;
  writeHasUpdateToStorage(v);
  emit();
}

function setUpdateBannerDismissed(v: boolean) {
  memoryUpdateBannerDismissed = v;
  writeUpdateBannerDismissedToStorage(v);
  emit();
}

function setUpdateModeInternal(mode: UpdateMode) {
  memoryUpdateMode = mode;
  writeUpdateModeToStorage(mode);
  emit();
}

function setUpdateOwnedMap(owned: Counts) {
  const clean: Counts = {};
  for (const [k, v] of Object.entries(owned)) {
    const c = Number(v);
    if (typeof k === "string" && Number.isFinite(c) && c > 0) clean[k] = c;
  }
  memoryUpdateOwned = clean;
  writeUpdateOwnedToStorage(clean);
  emit();
}

function toggleUpdateOwnedInternal(code: string) {
  const current = getSnapshotUpdateOwned();
  const next: Counts = { ...current };
  if ((next[code] ?? 0) >= 1) delete next[code];
  else next[code] = 1;
  memoryUpdateOwned = next;
  writeUpdateOwnedToStorage(next);
  emit();
}

function setUpdateOwnedOne(code: string, owned: boolean) {
  const current = getSnapshotUpdateOwned();
  const has = (current[code] ?? 0) >= 1;
  if (has === owned) return;
  const next: Counts = { ...current };
  if (owned) next[code] = 1;
  else delete next[code];
  memoryUpdateOwned = next;
  writeUpdateOwnedToStorage(next);
  emit();
}

function markAllUpdateInternal() {
  const next: Counts = {};
  for (const e of UPDATE_ENTRIES) next[e.code] = 1;
  memoryUpdateOwned = next;
  writeUpdateOwnedToStorage(next);
  emit();
}

function clearUpdateInternal() {
  memoryUpdateOwned = {};
  writeUpdateOwnedToStorage({});
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

export function applyCollectionDelta(delta: Record<string, number>) {
  applyDeltaInternal(delta);
}

function applyDeltaInternal(delta: Record<string, number>) {
  const current = getSnapshotCounts();
  const next: Counts = { ...current };
  for (const [code, d] of Object.entries(delta)) {
    if (!Number.isFinite(d) || d === 0) continue;
    const v = (next[code] ?? 0) + d;
    if (v <= 0) delete next[code];
    else next[code] = v;
  }
  memoryCounts = next;
  writeToStorage(next);
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
  const hasUpdateSet = useSyncExternalStore(
    subscribe,
    getSnapshotHasUpdate,
    getServerSnapshotHasUpdate,
  );
  const updateMode = useSyncExternalStore(
    subscribe,
    getSnapshotUpdateMode,
    getServerSnapshotUpdateMode,
  );
  const updateOwned = useSyncExternalStore(
    subscribe,
    getSnapshotUpdateOwned,
    getServerSnapshotUpdateOwned,
  );
  const updateBannerDismissed = useSyncExternalStore(
    subscribe,
    getSnapshotUpdateBannerDismissed,
    getServerSnapshotUpdateBannerDismissed,
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        memoryCounts = readFromStorage();
        emit();
      }
      if (e.key === NAME_KEY) {
        memoryName = readNameFromStorage();
        emit();
      }
      if (e.key === HAS_UPDATE_KEY) {
        memoryHasUpdate = readHasUpdateFromStorage();
        emit();
      }
      if (e.key === UPDATE_MODE_KEY) {
        memoryUpdateMode = readUpdateModeFromStorage();
        emit();
      }
      if (e.key === UPDATE_OWNED_KEY) {
        memoryUpdateOwned = readUpdateOwnedFromStorage();
        emit();
      }
      if (e.key === UPDATE_BANNER_KEY) {
        memoryUpdateBannerDismissed = readUpdateBannerDismissedFromStorage();
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

  const importUpdate = useCallback(
    (s: {
      hasUpdateSet?: boolean;
      updateMode?: UpdateMode;
      updateOwned?: Counts;
    }) => {
      if (s.updateMode) setUpdateModeInternal(s.updateMode);
      setUpdateOwnedMap(s.updateOwned ?? {});
      setHasUpdate(Boolean(s.hasUpdateSet));
    },
    [],
  );

  const applyDelta = useCallback((delta: Record<string, number>) => {
    applyDeltaInternal(delta);
  }, []);

  // Activa el update set eligiendo modo y si se marcan los 118 de golpe.
  const enableUpdateSet = useCallback(
    (opts: { mode: UpdateMode; fillAll: boolean }) => {
      setUpdateModeInternal(opts.mode);
      if (opts.fillAll) markAllUpdateInternal();
      setHasUpdate(true);
    },
    [],
  );

  const disableUpdateSet = useCallback(() => {
    setHasUpdate(false);
  }, []);

  const dismissUpdateBanner = useCallback(() => {
    setUpdateBannerDismissed(true);
  }, []);

  const setUpdateMode = useCallback((mode: UpdateMode) => {
    setUpdateModeInternal(mode);
  }, []);

  const toggleUpdateOwned = useCallback((code: string) => {
    toggleUpdateOwnedInternal(code);
  }, []);

  const setUpdateOwned = useCallback((code: string, owned: boolean) => {
    setUpdateOwnedOne(code, owned);
  }, []);

  const markAllUpdate = useCallback(() => {
    markAllUpdateInternal();
  }, []);

  const clearUpdate = useCallback(() => {
    clearUpdateInternal();
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
    importUpdate,
    applyDelta,
    // Update set
    hasUpdateSet,
    updateMode,
    updateOwned,
    updateBannerDismissed,
    enableUpdateSet,
    disableUpdateSet,
    dismissUpdateBanner,
    setUpdateMode,
    toggleUpdateOwned,
    setUpdateOwned,
    markAllUpdate,
    clearUpdate,
  };
}

// Opciones de sustitución: en modo "substitute" un slot cuenta como
// conseguido si tienes el original O el jugador actualizado del update set.
export type SlotOptions = {
  updateOwned?: Counts;
  substitute?: boolean;
};

// ¿Está el slot conseguido? Fuente única de verdad para grid, tarjetas y
// resúmenes, para que todos apliquen la misma regla de sustitución.
export function isSlotOwned(
  code: string,
  counts: Counts,
  opts?: SlotOptions,
): boolean {
  if ((counts[code] ?? 0) >= 1) return true;
  if (opts?.substitute && (opts.updateOwned?.[code] ?? 0) >= 1) return true;
  return false;
}

export function summarize(counts: Counts, opts?: SlotOptions) {
  let owned = 0;
  let dupes = 0;
  let missing = 0;
  for (const s of STICKERS) {
    const c = counts[s.code] ?? 0;
    if (isSlotOwned(s.code, counts, opts)) {
      owned += 1;
      if (c > 1) dupes += c - 1;
    } else {
      missing += 1;
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
  opts?: SlotOptions,
) {
  let owned = 0;
  let dupes = 0;
  const total = range[1] - range[0] + 1;
  for (let n = range[0]; n <= range[1]; n++) {
    const s = STICKER_BY_NUMBER.get(n);
    if (!s) continue;
    const c = counts[s.code] ?? 0;
    if (isSlotOwned(s.code, counts, opts)) owned += 1;
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

export function summarizeUpdate(updateOwned: Counts) {
  let owned = 0;
  for (const e of UPDATE_ENTRIES) {
    if ((updateOwned[e.code] ?? 0) >= 1) owned += 1;
  }
  return {
    owned,
    missing: TOTAL_UPDATE - owned,
    total: TOTAL_UPDATE,
    percent: TOTAL_UPDATE
      ? Math.round((owned / TOTAL_UPDATE) * 1000) / 10
      : 0,
  };
}

export function buildExport(
  counts: Counts,
  ownerName?: string,
  update?: {
    hasUpdateSet: boolean;
    updateMode: UpdateMode;
    updateOwned: Counts;
  },
): ExportPayload {
  return {
    app: "album-2026",
    version: 1,
    exportedAt: new Date().toISOString(),
    ownerName: ownerName?.trim() || undefined,
    counts,
    hasUpdateSet: update?.hasUpdateSet || undefined,
    updateMode: update?.hasUpdateSet ? update.updateMode : undefined,
    updateOwned:
      update?.hasUpdateSet && update.updateOwned
        ? update.updateOwned
        : undefined,
  };
}

export function parseImport(text: string): ExportPayload {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("Archivo inválido");
  if (data.app !== "album-2026")
    throw new Error("No es un archivo del álbum 2026");
  if (typeof data.counts !== "object" || data.counts === null)
    throw new Error("Archivo sin colección");
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
  // El 1 está pegado en el álbum, los siguientes son repes para
  // intercambiar. Siempre mostramos ×N con N = count - 1.
  const missing: string[] = [];
  const dupes: { code: string; repes: number }[] = [];
  for (const s of STICKERS) {
    const c = counts[s.code] ?? 0;
    if (c === 0) missing.push(s.code);
    else if (c > 1) dupes.push({ code: s.code, repes: c - 1 });
  }

  const header = ownerName
    ? `📒 Álbum Mundial 2026 — ${ownerName}`
    : "📒 Álbum Mundial 2026";

  const parts = [header, ""];

  parts.push(`🤝 ME SOBRAN (${dupes.length}):`);
  if (dupes.length === 0) parts.push("—");
  else {
    parts.push(
      dupes.map(({ code, repes }) => `${code} ×${repes}`).join(", "),
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
