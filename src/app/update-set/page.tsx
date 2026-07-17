"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { summarizeUpdate, useCollection } from "@/lib/collection";
import { SECTIONS } from "@/lib/album";
import { UPDATE_ENTRIES, UpdateEntry } from "@/lib/update-set";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  CheckCheck,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";

type TeamFilter = "all" | "have" | "missing";

const TEAM_META = new Map(
  SECTIONS.filter((s) => s.kind === "team").map((s) => [
    s.id,
    { name: s.name, flag: s.flag ?? "", order: s.range[0] },
  ]),
);

// Entradas agrupadas por equipo, en el orden del álbum.
const GROUPED: { teamCode: string; name: string; flag: string; entries: UpdateEntry[] }[] =
  (() => {
    const byTeam = new Map<string, UpdateEntry[]>();
    for (const e of UPDATE_ENTRIES) {
      const arr = byTeam.get(e.teamCode) ?? [];
      arr.push(e);
      byTeam.set(e.teamCode, arr);
    }
    return [...byTeam.entries()]
      .map(([teamCode, entries]) => {
        const meta = TEAM_META.get(teamCode);
        return {
          teamCode,
          name: meta?.name ?? teamCode,
          flag: meta?.flag ?? "",
          order: meta?.order ?? 9999,
          entries: entries.sort(
            (a, b) =>
              Number(a.code.split(" ")[1]) - Number(b.code.split(" ")[1]),
          ),
        };
      })
      .sort((a, b) => a.order - b.order);
  })();

export default function UpdateSetPage() {
  const {
    hasUpdateSet,
    updateMode,
    updateOwned,
    counts,
    toggleUpdateOwned,
    markAllUpdate,
    clearUpdate,
  } = useCollection();
  const [filter, setFilter] = useState<TeamFilter>("all");

  const totals = summarizeUpdate(updateOwned);

  const groups = useMemo(() => {
    if (filter === "all") return GROUPED;
    return GROUPED.map((g) => ({
      ...g,
      entries: g.entries.filter((e) => {
        const have = (updateOwned[e.code] ?? 0) >= 1;
        return filter === "have" ? have : !have;
      }),
    })).filter((g) => g.entries.length > 0);
  }, [filter, updateOwned]);

  if (!hasUpdateSet) {
    return (
      <div>
        <PageHeader title="Update set" subtitle="Cromos actualizados" />
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-2xl border border-update/30 bg-update/5 p-6 text-center">
            <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-update/15 text-update">
              <RefreshCw className="h-6 w-6" />
            </span>
            <h2 className="text-base font-semibold">
              No tienes activado el update set
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Panini publicó {UPDATE_ENTRIES.length} cromos que actualizan a
              jugadores del álbum original. Si compraste el pack, actívalo en
              Ajustes.
            </p>
            <Link
              href="/ajustes"
              prefetch
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Settings className="h-4 w-4" /> Ir a Ajustes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Update set" subtitle="Cromos actualizados" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        {/* Progreso */}
        <div className="rounded-2xl border border-update/30 bg-update/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">
                {totals.owned}/{totals.total} anotados
              </div>
              <div className="text-[11px] text-muted-foreground">
                {updateMode === "substitute"
                  ? "Sustituyen al original para completar el slot"
                  : "Colección aparte del álbum de 980"}
              </div>
            </div>
            <span className="text-lg font-bold tabular-nums text-update">
              {totals.percent}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-update/15">
            <div
              className="h-full rounded-full bg-update transition-all"
              style={{ width: `${totals.percent}%` }}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={markAllUpdate}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-update/40 bg-background px-3 py-2 text-xs font-medium text-update transition-colors hover:bg-update/10"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todos
            </button>
            <button
              type="button"
              onClick={clearUpdate}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" /> Vaciar
            </button>
          </div>
        </div>

        {/* Filtro */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "all", label: "Todos" },
              { id: "missing", label: "Faltan" },
              { id: "have", label: "Tengo" },
            ] as { id: TeamFilter; label: string }[]
          ).map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setFilter(it.id)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm transition-colors",
                filter === it.id
                  ? "border-update bg-update text-white"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              {it.label}
            </button>
          ))}
        </div>

        {/* Lista por equipo */}
        {groups.length === 0 ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No hay cromos que coincidan.
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.teamCode}>
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <span className="text-lg leading-none">{g.flag}</span>
                  <span className="text-sm font-semibold">{g.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {g.entries.filter((e) => (updateOwned[e.code] ?? 0) >= 1)
                      .length}
                    /{g.entries.length}
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                  {g.entries.map((e, i) => {
                    const have = (updateOwned[e.code] ?? 0) >= 1;
                    const hasOriginal = (counts[e.code] ?? 0) >= 1;
                    return (
                      <button
                        key={e.code}
                        type="button"
                        onClick={() => toggleUpdateOwned(e.code)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          i > 0 && "border-t border-border",
                          have ? "bg-update/5" : "hover:bg-accent/40",
                        )}
                      >
                        <span className="w-12 shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
                          {e.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-medium leading-tight">
                            {e.replacementName}
                            <span className="rounded bg-muted px-1 text-[9px] font-semibold uppercase text-muted-foreground">
                              {e.position}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span className="line-through decoration-muted-foreground/40">
                              {e.originalName}
                            </span>
                            <ArrowRight className="h-3 w-3" />
                            {hasOriginal ? (
                              <span className="text-[10px] text-muted-foreground/70">
                                (tienes el original)
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                            have
                              ? "border-update bg-update text-white"
                              : "border-border bg-background text-transparent",
                          )}
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
