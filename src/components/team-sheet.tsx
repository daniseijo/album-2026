"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Section, STICKERS, Sticker, formatStickerCode } from "@/lib/album";
import { isSlotOwned, useCollection } from "@/lib/collection";
import { getUpdateEntry, UpdateEntry } from "@/lib/update-set";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Eraser, Plus, RefreshCw } from "lucide-react";

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
  const {
    counts,
    setExact,
    hasUpdateSet,
    updateMode,
    updateOwned,
    setUpdateOwned,
  } = useCollection();
  const [erase, setErase] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [detailCode, setDetailCode] = useState<string | null>(null);

  const substitute = hasUpdateSet && updateMode === "substitute";
  const slotOpts = { updateOwned, substitute };

  const stickers = useMemo<Sticker[]>(() => {
    return STICKERS.filter(
      (s) => s.number >= section.range[0] && s.number <= section.range[1],
    );
  }, [section]);

  const owned = stickers.filter((s) =>
    isSlotOwned(s.code, counts, slotOpts),
  ).length;
  const dupes = stickers.reduce(
    (acc, s) => acc + Math.max(0, (counts[s.code] ?? 0) - 1),
    0,
  );
  const updatesInSection = hasUpdateSet
    ? stickers.filter((s) => getUpdateEntry(s.code)).length
    : 0;

  const visible = stickers.filter((s) => {
    const c = counts[s.code] ?? 0;
    const slotOwned = isSlotOwned(s.code, counts, slotOpts);
    if (filter === "owned" && !slotOwned) return false;
    if (filter === "missing" && slotOwned) return false;
    if (filter === "dupes" && c <= 1) return false;
    return true;
  });

  const detailEntry = detailCode ? getUpdateEntry(detailCode) : undefined;

  const onTileTap = (code: string) => {
    const c = counts[code] ?? 0;
    if (erase) setExact(code, Math.max(0, c - 1));
    else setExact(code, c + 1);
  };

  const onTileLongPress = (code: string) => {
    const c = counts[code] ?? 0;
    setExact(code, Math.max(0, c - 1));
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
              {updatesInSection > 0 ? (
                <span className="ml-1 inline-flex items-center gap-0.5 font-medium text-update">
                  · <RefreshCw className="h-3 w-3" />
                  {updatesInSection}
                </span>
              ) : null}
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

      <div className="px-5 pb-3 space-y-1">
        <Legend erase={erase} />
        <p className="text-[11px] text-muted-foreground">
          Toca para añadir · mantén pulsado para restar uno
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div
          className={cn(
            "grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-8",
            erase && "[&_button]:cursor-not-allowed",
          )}
        >
          {visible.map((s) => {
            const hasUpd = hasUpdateSet && Boolean(getUpdateEntry(s.code));
            return (
              <StickerTile
                key={s.code}
                sticker={s}
                count={counts[s.code] ?? 0}
                onTap={() => onTileTap(s.code)}
                onLongPress={() => onTileLongPress(s.code)}
                erase={erase}
                hasUpdate={hasUpd}
                updateHave={(updateOwned[s.code] ?? 0) >= 1}
                substitute={substitute}
                onMarkerTap={() => setDetailCode(s.code)}
              />
            );
          })}
        </div>
      </div>

      <UpdateDetailDialog
        entry={detailEntry ?? null}
        open={Boolean(detailEntry)}
        onOpenChange={(o) => {
          if (!o) setDetailCode(null);
        }}
        have={detailCode ? (updateOwned[detailCode] ?? 0) >= 1 : false}
        onHaveChange={(v) => detailCode && setUpdateOwned(detailCode, v)}
        originalCount={detailCode ? (counts[detailCode] ?? 0) : 0}
        substitute={substitute}
      />

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

const LONG_PRESS_MS = 450;

function StickerTile({
  sticker,
  count,
  onTap,
  onLongPress,
  erase,
  hasUpdate,
  updateHave,
  substitute,
  onMarkerTap,
}: {
  sticker: Sticker;
  count: number;
  onTap: () => void;
  onLongPress: () => void;
  erase: boolean;
  hasUpdate: boolean;
  updateHave: boolean;
  substitute: boolean;
  onMarkerTap: () => void;
}) {
  const hasOriginal = count >= 1;
  const dupes = Math.max(0, count - 1);
  const repe = dupes > 0;
  // En modo sustituir, tener el actualizado también da el slot por conseguido.
  const owned = hasOriginal || (substitute && updateHave);
  // Slot completado únicamente con el jugador del update set.
  const onlyViaUpdate = !hasOriginal && substitute && updateHave;

  const code = formatStickerCode(sticker);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);
  const [pressing, setPressing] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startPress = () => {
    longPressedRef.current = false;
    if (count === 0) return;
    clearTimer();
    setPressing(true);
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      setPressing(false);
      onLongPress();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }, LONG_PRESS_MS);
  };

  const endPress = () => {
    clearTimer();
    setPressing(false);
  };

  const handleClick = () => {
    // A long press already handled this interaction (it decremented the
    // count), so swallow the click that fires on pointer release.
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    onTap();
  };

  useEffect(() => () => clearTimer(), []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => e.preventDefault()}
        disabled={erase && count === 0}
        className={cn(
          "group relative flex aspect-square w-full flex-col items-center justify-center rounded-lg border bg-card text-center transition-all select-none active:scale-[0.95] disabled:opacity-40",
          repe && "bg-warning-soft border-warning/40",
          owned && !repe && !onlyViaUpdate && "bg-success-soft/70 border-success/40",
          onlyViaUpdate && "bg-update-soft border-update/40",
          !owned && "bg-card",
          erase && owned && "ring-1 ring-destructive/40",
          pressing && "ring-1 ring-destructive/60",
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 origin-bottom overflow-hidden rounded-lg bg-destructive/35"
          style={{
            transform: pressing ? "scaleY(1)" : "scaleY(0)",
            transitionProperty: "transform",
            transitionTimingFunction: "linear",
            transitionDuration: pressing ? `${LONG_PRESS_MS}ms` : "150ms",
          }}
        />
        <span
          className={cn(
            "relative z-10 text-[11px] font-bold tabular-nums leading-tight",
            !owned && "text-muted-foreground",
          )}
        >
          {code}
        </span>
        {repe ? (
          <span className="absolute bottom-0.5 right-0.5 z-10 rounded bg-warning-strong px-1 text-[9px] font-semibold leading-tight text-white">
            ×{dupes}
          </span>
        ) : null}
      </button>
      {hasUpdate ? (
        <button
          type="button"
          onClick={onMarkerTap}
          aria-label="Ver jugador actualizado"
          className={cn(
            "absolute -top-1 -left-1 z-20 inline-flex h-4 w-4 items-center justify-center rounded-full border shadow-sm transition-colors",
            updateHave
              ? "border-update bg-update text-white"
              : "border-update/50 bg-background text-update",
          )}
        >
          <RefreshCw className="h-2.5 w-2.5" strokeWidth={2.6} />
        </button>
      ) : null}
    </div>
  );
}

function UpdateDetailDialog({
  entry,
  open,
  onOpenChange,
  have,
  onHaveChange,
  originalCount,
  substitute,
}: {
  entry: UpdateEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  have: boolean;
  onHaveChange: (v: boolean) => void;
  originalCount: number;
  substitute: boolean;
}) {
  const originalStatus =
    originalCount === 0
      ? "No lo tienes"
      : originalCount === 1
        ? "Pegado"
        : `Pegado · ${originalCount - 1} repe${originalCount - 1 > 1 ? "s" : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-update/10 px-1.5 py-0.5 text-xs font-semibold text-update">
              <RefreshCw className="h-3 w-3" /> {entry?.code}
            </span>
            Update set
          </DialogTitle>
          <DialogDescription>
            Este cromo cambió respecto al álbum original.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Original
              </div>
              <div className="truncate text-sm font-medium line-through decoration-muted-foreground/50">
                {entry?.originalName}
              </div>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {originalStatus}
            </span>
          </div>

          <div className="my-2 flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="text-[11px]">se actualiza a</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-update">
                Actualizado · {entry?.position}
              </div>
              <div className="truncate text-sm font-semibold">
                {entry?.replacementName}
              </div>
            </div>
            <label className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-medium">Lo tengo</span>
              <Switch
                checked={have}
                onCheckedChange={(v) => onHaveChange(Boolean(v))}
              />
            </label>
          </div>
        </div>

        {substitute ? (
          <p className="text-[11px] text-muted-foreground">
            Modo sustituir: con el original o el actualizado, el cromo cuenta
            como conseguido.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Modo añadido: cuenta aparte, no altera el total del álbum.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
