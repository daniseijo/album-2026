"use client";

import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Section, STICKERS, Sticker, formatStickerCode } from "@/lib/album";
import { useCollection } from "@/lib/collection";
import { cn } from "@/lib/utils";
import { Eraser, Plus } from "lucide-react";

type Filter = "all" | "missing" | "owned" | "dupes";

export function TeamSheet({
  section,
  open,
  onOpenChange,
}: {
  section: Section | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      disablePointerDismissal
    >
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[92dvh] flex flex-col gap-0"
      >
        {section ? <TeamSheetBody key={section.id} section={section} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function TeamSheetBody({ section }: { section: Section }) {
  const { counts, setExact } = useCollection();
  const [erase, setErase] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const stickers = useMemo<Sticker[]>(() => {
    return STICKERS.filter(
      (s) => s.number >= section.range[0] && s.number <= section.range[1],
    );
  }, [section]);

  const owned = stickers.filter((s) => (counts[s.code] ?? 0) >= 1).length;
  const dupes = stickers.reduce(
    (acc, s) => acc + Math.max(0, (counts[s.code] ?? 0) - 1),
    0,
  );

  const visible = stickers.filter((s) => {
    const c = counts[s.code] ?? 0;
    if (filter === "owned" && c === 0) return false;
    if (filter === "missing" && c > 0) return false;
    if (filter === "dupes" && c <= 1) return false;
    return true;
  });

  const onTileTap = (code: string) => {
    const c = counts[code] ?? 0;
    if (erase) setExact(code, Math.max(0, c - 1));
    else setExact(code, c + 1);
  };

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3">
        <div className="flex items-start gap-3 pr-20">
          <span className="text-3xl leading-none mt-1">
            {section.flag ?? ""}
          </span>
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-lg leading-tight">
              {section.name}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {owned}/{stickers.length} cromos
              {dupes > 0 ? ` · ${dupes} repes` : ""}
            </SheetDescription>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setErase((e) => !e)}
          aria-pressed={erase}
          aria-label={erase ? "Salir de modo borrar" : "Modo borrar"}
          className={cn(
            "absolute top-3 right-12 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
            erase
              ? "border-destructive/50 bg-destructive/15 text-destructive"
              : "border-border bg-background text-muted-foreground hover:bg-accent",
          )}
        >
          <Eraser className="h-4 w-4" />
        </button>
      </SheetHeader>

      <div className="px-5 pb-3">
        <Legend erase={erase} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div
          className={cn(
            "grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-8",
            erase && "[&_button]:cursor-not-allowed",
          )}
        >
          {visible.map((s) => (
            <StickerTile
              key={s.code}
              sticker={s}
              count={counts[s.code] ?? 0}
              onTap={() => onTileTap(s.code)}
              erase={erase}
            />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "border-t bg-card/95 backdrop-blur px-5 py-3 transition-colors",
          erase && "bg-destructive/5 border-destructive/20",
        )}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
        }}
      >
        <FilterPicker filter={filter} onChange={setFilter} />
      </div>
    </>
  );
}

function Legend({ erase }: { erase: boolean }) {
  const items: { label: string; dot: string }[] = [
    { label: "No tengo", dot: "bg-border" },
    { label: "Tengo", dot: "bg-success" },
    { label: "Repetido", dot: "bg-warning-strong" },
  ];
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {items.map((it) => (
          <span
            key={it.label}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
          >
            <span className={cn("h-2 w-2 rounded-full", it.dot)} />
            {it.label}
          </span>
        ))}
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
          erase
            ? "bg-destructive/15 text-destructive"
            : "bg-success/15 text-success",
        )}
      >
        {erase ? (
          <>
            <Eraser className="h-3 w-3" /> Borrar
          </>
        ) : (
          <>
            <Plus className="h-3 w-3" /> Añadir
          </>
        )}
      </span>
    </div>
  );
}

function FilterPicker({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (f: Filter) => void;
}) {
  const items: { id: Filter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "missing", label: "Faltan" },
    { id: "dupes", label: "Repetidos" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={cn(
            "rounded-full border px-3 py-2 text-sm transition-colors",
            filter === it.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-accent",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function StickerTile({
  sticker,
  count,
  onTap,
  erase,
}: {
  sticker: Sticker;
  count: number;
  onTap: () => void;
  erase: boolean;
}) {
  const owned = count >= 1;
  const dupes = Math.max(0, count - 1);
  const repe = dupes > 0;

  const code = formatStickerCode(sticker);

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={erase && count === 0}
      className={cn(
        "group relative flex aspect-square flex-col items-center justify-center rounded-lg border bg-card text-center transition-all active:scale-[0.95] disabled:opacity-40",
        repe && "bg-warning-soft border-warning/40",
        owned && !repe && "bg-success-soft/70 border-success/40",
        !owned && "bg-card",
        erase && owned && "ring-1 ring-destructive/40",
      )}
    >
      <span
        className={cn(
          "text-[11px] font-bold tabular-nums leading-tight",
          !owned && "text-muted-foreground",
        )}
      >
        {code}
      </span>
      {repe ? (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-warning-strong px-1 text-[9px] font-semibold leading-tight text-white">
          ×{dupes}
        </span>
      ) : null}
    </button>
  );
}
