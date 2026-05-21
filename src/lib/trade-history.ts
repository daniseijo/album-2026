"use client";

import { useEffect, useSyncExternalStore } from "react";

export type TradeDirection = "sent" | "received";

export type TradeHistoryEntry = {
  id: string;
  tradeId: string;
  at: string;
  partner: string;
  direction: TradeDirection;
  // Siempre desde la perspectiva del dueño del dispositivo (yo):
  //   gave:     cromos que entregué (-1 a cada uno)
  //   received: cromos que recibí (+1 a cada uno)
  gave: string[];
  received: string[];
  undoneAt?: string;
};

const STORAGE_KEY = "album-2026:trade-history:v1";
const EMPTY: TradeHistoryEntry[] = Object.freeze(
  [] as TradeHistoryEntry[],
) as TradeHistoryEntry[];

const listeners = new Set<() => void>();
let memory: TradeHistoryEntry[] | null = null;

function read(): TradeHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: unknown): e is TradeHistoryEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as TradeHistoryEntry).id === "string" &&
        typeof (e as TradeHistoryEntry).tradeId === "string" &&
        typeof (e as TradeHistoryEntry).at === "string" &&
        typeof (e as TradeHistoryEntry).partner === "string" &&
        ((e as TradeHistoryEntry).direction === "sent" ||
          (e as TradeHistoryEntry).direction === "received") &&
        Array.isArray((e as TradeHistoryEntry).gave) &&
        Array.isArray((e as TradeHistoryEntry).received),
    );
  } catch {
    return [];
  }
}

function write(entries: TradeHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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

function getSnapshot(): TradeHistoryEntry[] {
  if (memory === null) memory = read();
  return memory;
}

function getServerSnapshot(): TradeHistoryEntry[] {
  return EMPTY;
}

export function newEntryId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addTradeEntry(entry: TradeHistoryEntry) {
  const list = [entry, ...getSnapshot()];
  memory = list;
  write(list);
  emit();
}

export function markTradeUndone(id: string) {
  const next = getSnapshot().map((e) =>
    e.id === id ? { ...e, undoneAt: new Date().toISOString() } : e,
  );
  memory = next;
  write(next);
  emit();
}

export function markTradeRedone(id: string) {
  const next = getSnapshot().map((e) =>
    e.id === id ? { ...e, undoneAt: undefined } : e,
  );
  memory = next;
  write(next);
  emit();
}

export function deleteTradeEntry(id: string) {
  const next = getSnapshot().filter((e) => e.id !== id);
  memory = next;
  write(next);
  emit();
}

export function findActiveByTradeId(
  tradeId: string,
): TradeHistoryEntry | undefined {
  return getSnapshot().find((e) => e.tradeId === tradeId && !e.undoneAt);
}

export function useTradeHistory(): TradeHistoryEntry[] {
  const entries = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        memory = read();
        emit();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return entries;
}
