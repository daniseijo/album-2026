"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { GROUPS, SECTIONS, Section } from "@/lib/album";
import { summarize, useCollection } from "@/lib/collection";
import { TeamCard } from "@/components/team-card";
import { TeamSheet } from "@/components/team-sheet";
import { ArrowDownAZ, ArrowLeftRight, BookOpen, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type GroupFilter = "all" | "fwc" | (typeof GROUPS)[number];
type SortMode = "album" | "alpha";

export default function HomePage() {
  const { counts } = useCollection();
  const totals = summarize(counts);

  const [group, setGroup] = useState<GroupFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("album");
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = SECTIONS.filter((s) => {
      if (group === "all") {
        // mostrar todo
      } else if (group === "fwc") {
        if (s.kind !== "fwc") return false;
      } else {
        if (s.kind !== "team" || s.group !== group) return false;
      }
      if (q.length > 0) {
        return s.name.toLowerCase().includes(q);
      }
      return true;
    });
    // Mover la sección FWC al final (con col-span-full encaja como cierre
    // y deja al resto en parejas por grupo).
    const fwc = filtered.find((s) => s.kind === "fwc");
    const teams = filtered.filter((s) => s.kind !== "fwc");
    if (sort === "alpha") {
      teams.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    return fwc ? [...teams, fwc] : teams;
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
        className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight">
              Álbum Mundial 2026{" "}
              <span className="font-normal text-muted-foreground">Panini</span>
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/intercambio"
              prefetch
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full h-8 gap-1.5 px-3 text-xs",
              )}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Intercambio
            </Link>
            <Link
              href="/intercambio?to=whatsapp"
              prefetch
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full h-8 gap-1.5 px-3 text-xs",
              )}
            >
              <Send className="h-3.5 w-3.5" />
              WhatsApp
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <StatsRow
          owned={totals.owned}
          missing={totals.missing}
          dupes={totals.dupes}
          percent={totals.percent}
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
                ? "border-foreground bg-foreground text-background"
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
    </div>
  );
}

function StatsRow({
  owned,
  missing,
  dupes,
  percent,
}: {
  owned: number;
  missing: number;
  dupes: number;
  percent: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl bg-cream p-2.5">
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
        "rounded-full border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
