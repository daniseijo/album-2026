"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { GROUPS, SECTIONS, Section } from "@/lib/album";
import { summarize, useCollection } from "@/lib/collection";
import { TeamCard } from "@/components/team-card";
import { TeamSheet } from "@/components/team-sheet";
import { AlbumCompleteCelebration } from "@/components/album-complete-celebration";
import {
  ArrowDownAZ,
  ArrowLeftRight,
  BookOpen,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GroupFilter = "all" | "fwc" | (typeof GROUPS)[number];
type SortMode = "album" | "alpha";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function HomePage() {
  const { counts, ownerName } = useCollection();
  const totals = summarize(counts);
  const complete = totals.missing === 0;

  const [group, setGroup] = useState<GroupFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("album");
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sections = useMemo(() => {
    const q = normalize(query);
    const filtered = SECTIONS.filter((s) => {
      if (group === "all") {
        // mostrar todo
      } else if (group === "fwc") {
        if (s.kind !== "fwc") return false;
      } else {
        if (s.kind !== "team" || s.group !== group) return false;
      }
      if (q.length > 0) {
        return normalize(s.name).includes(q);
      }
      return true;
    });
    // FWC siempre al principio (full-width, hace de cabecera).
    // El resto de equipos a continuación, en orden del álbum o A-Z.
    const fwc = filtered.find((s) => s.kind === "fwc");
    const teams = filtered.filter((s) => s.kind !== "fwc");
    if (sort === "alpha") {
      teams.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    return fwc ? [fwc, ...teams] : teams;
  }, [group, query, sort]);

  const openTeam = (s: Section) => {
    setOpenSection(s);
    // Defer one tick so base-ui's outside-click detector no toma el mismo
    // tap que abre el sheet como un click fuera y lo cierra al instante.
    requestAnimationFrame(() => setSheetOpen(true));
  };

  return (
    <div>
      <header
        className="sticky top-0 z-30 border-b border-warning/30 bg-primary text-primary-foreground"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight">
              Álbum Mundial{" "}
              <span className="text-warning">2026</span>{" "}
              <span className="font-normal text-primary-foreground/60">
                Panini
              </span>
            </h1>
          </div>
          <Link
            href="/intercambio"
            prefetch
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-primary-foreground/30 bg-primary-foreground/5 px-3 text-xs font-medium text-primary-foreground hover:bg-primary-foreground/15 transition-colors"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Intercambio
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        {complete ? <CompleteBanner ownerName={ownerName} /> : null}
        <StatsRow
          owned={totals.owned}
          missing={totals.missing}
          dupes={totals.dupes}
          percent={totals.percent}
          complete={complete}
        />

        <div className="flex flex-wrap gap-1.5">
          <GroupChip
            label="Todas"
            active={group === "all"}
            onClick={() => setGroup("all")}
          />
          <GroupChip
            label="🏆 FWC"
            active={group === "fwc"}
            onClick={() => setGroup("fwc")}
          />
          {GROUPS.map((g) => (
            <GroupChip
              key={g}
              label={`Grupo ${g}`}
              active={group === g}
              onClick={() => setGroup(g)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar selección…"
              className="h-11 rounded-xl pl-10 bg-card"
              inputMode="search"
            />
          </div>
          <button
            type="button"
            onClick={() => setSort((s) => (s === "album" ? "alpha" : "album"))}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors",
              sort === "album"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent",
            )}
            aria-label={
              sort === "album" ? "Cambiar a orden A-Z" : "Cambiar a orden del álbum"
            }
            title={
              sort === "album"
                ? "Orden del álbum (toca para cambiar a A-Z)"
                : "Orden A-Z (toca para cambiar a orden del álbum)"
            }
          >
            {sort === "album" ? (
              <>
                <BookOpen className="h-3.5 w-3.5" />
                Álbum
              </>
            ) : (
              <>
                <ArrowDownAZ className="h-3.5 w-3.5" />
                A-Z
              </>
            )}
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No hay equipos que coincidan.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {sections.map((s) => (
              <div
                key={s.id}
                className={cn(s.kind === "fwc" && "col-span-full")}
              >
                <TeamCard
                  section={s}
                  counts={counts}
                  onClick={() => openTeam(s)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <TeamSheet
        section={openSection}
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setTimeout(() => setOpenSection(null), 200);
        }}
      />

      <AlbumCompleteCelebration complete={complete} ownerName={ownerName} />
    </div>
  );
}

function CompleteBanner({ ownerName }: { ownerName?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning-soft via-warning to-warning-strong px-4 py-3.5 shadow-lg shadow-warning/30 ring-1 ring-warning-strong/40">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -inset-x-1/3 bg-[linear-gradient(110deg,transparent_38%,rgba(255,255,255,0.55)_50%,transparent_62%)]"
        style={{ animation: "champion-shimmer 3.6s ease-in-out infinite" }}
      />
      <div className="relative flex items-center gap-3.5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background p-2 shadow-md ring-2 ring-primary/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/fwc26-emblem.svg"
            alt=""
            aria-hidden
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">
            FIFA World Cup 2026 · Campeón
          </div>
          <div className="font-heading text-[19px] font-bold leading-tight tracking-tight text-primary">
            ¡Álbum completado!
          </div>
          <div className="mt-0.5 text-xs font-medium text-primary/80">
            {ownerName ? `${ownerName} · ` : ""}980 cromos pegados, ni uno menos
          </div>
        </div>
        <Sparkles className="h-5 w-5 shrink-0 text-primary/70" />
      </div>
    </div>
  );
}

function StatsRow({
  owned,
  missing,
  dupes,
  percent,
  complete,
}: {
  owned: number;
  missing: number;
  dupes: number;
  percent: number;
  complete: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-2 rounded-2xl p-2.5 transition-colors",
        complete
          ? "bg-success-soft ring-1 ring-success/30"
          : "bg-cream",
      )}
    >
      <Stat label="Pegados" value={owned} />
      <Stat label="Faltan" value={missing} />
      <Stat label="Repetidos" value={dupes} />
      <Stat label="Completado" value={`${percent}%`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl px-1 py-2 text-center">
      <div className="text-lg font-bold tabular-nums leading-none">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function GroupChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
