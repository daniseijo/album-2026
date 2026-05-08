"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowUp,
  Check,
  Copy,
  Send,
  FileUp,
  X,
} from "lucide-react";
import {
  buildExport,
  buildTradeProposalText,
  buildWhatsappText,
  compareCollections,
  parseImport,
  summarize,
  useCollection,
  type Counts,
  type ExportPayload,
  type TradeMatch,
} from "@/lib/collection";
import { STICKERS, getStickerByCode } from "@/lib/album";
import { cn } from "@/lib/utils";

export default function IntercambioPage() {
  const { counts, ownerName, setOwnerName } = useCollection();

  const [friend, setFriend] = useState<ExportPayload | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const dupeCodes = useMemo(
    () =>
      STICKERS
        .map((s) => ({ code: s.code, n: s.number, c: counts[s.code] ?? 0 }))
        .filter((it) => it.c > 1)
        .sort((a, b) => a.n - b.n),
    [counts],
  );

  const missingCodes = useMemo(
    () =>
      STICKERS
        .filter((s) => !counts[s.code])
        .map((s) => s.code),
    [counts],
  );

  const handleCopyWhatsapp = async () => {
    const text = buildWhatsappText(counts, ownerName);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lista copiada", {
        description: "Pégala donde quieras",
      });
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleShareFile = async () => {
    const payload = buildExport(counts, ownerName);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const file = new File(
      [blob],
      `album-2026${ownerName ? `-${slug(ownerName)}` : ""}.json`,
      { type: "application/json" },
    );
    const canShareFile =
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] });
    if (canShareFile) {
      try {
        await navigator.share({
          files: [file],
          title: "Mi colección álbum 2026",
          text: ownerName
            ? `Colección álbum 2026 de ${ownerName}`
            : "Mi colección del álbum 2026",
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Archivo descargado", {
      description: "Adjúntalo en tu chat",
    });
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseImport(text);
      setFriend(data);
      toast.success(
        `Cargada colección de ${data.ownerName ?? "tu amigo"}`,
      );
    } catch (e) {
      toast.error("Archivo inválido", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const compare = useMemo(() => {
    if (!friend) return null;
    return compareCollections(counts, friend.counts as Counts);
  }, [counts, friend]);

  useEffect(() => {
    const w = window as unknown as {
      launchQueue?: {
        setConsumer: (
          cb: (params: { files: FileSystemFileHandle[] }) => void,
        ) => void;
      };
    };
    if (!w.launchQueue) return;
    w.launchQueue.setConsumer(async ({ files }) => {
      if (!files || files.length === 0) return;
      try {
        const handle = files[0];
        const file = await handle.getFile();
        await handleImportFile(file);
      } catch {}
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="Intercambio"
        subtitle={
          dupeCodes.length === 0 && missingCodes.length === 0
            ? "Empieza marcando cromos"
            : `${dupeCodes.length} repes · ${missingCodes.length} faltan`
        }
      />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <label className="text-xs font-medium text-muted-foreground">
              Tu nombre (aparece en la lista de WhatsApp y en el archivo)
            </label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Tu nombre"
              className="h-10"
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mine">Mi lista</TabsTrigger>
            <TabsTrigger value="friend">
              Con un amigo
              {friend ? (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-4 space-y-3">
            <Button
              onClick={handleCopyWhatsapp}
              className="h-11 w-full"
              variant="default"
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar lista en texto
            </Button>
            <Button
              onClick={handleShareFile}
              variant="outline"
              className="h-11 w-full"
            >
              <Send className="mr-2 h-4 w-4" /> Enviar archivo a un amigo
            </Button>
            <p className="px-1 text-[11px] text-muted-foreground">
              <strong>Texto</strong>: pégalo en cualquier chat para enseñar tus
              repes y faltas a un amigo.{" "}
              <strong>Archivo</strong>: si tu amigo también usa esta app, podrá
              importarlo y ver al instante en qué cromos os hacéis match.
            </p>

            <CodeList
              title="Mis repes para intercambiar"
              subtitle="Estos son los que vas a compartir. Las faltas no se incluyen porque sin saber qué tiene tu amigo no son accionables; el archivo JSON sí lleva tu colección entera."
              icon={<ArrowUp className="h-4 w-4" />}
              tone="emerald"
              items={dupeCodes.map((d) => ({
                code: d.code,
                badge: d.c - 1 > 1 ? `×${d.c - 1}` : undefined,
              }))}
              empty="Aún no tienes repes"
            />
          </TabsContent>

          <TabsContent value="friend" className="mt-4 space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
                e.target.value = "";
              }}
            />
            {!friend ? (
              <DropZone
                onFile={handleImportFile}
                onClick={() => fileRef.current?.click()}
              />
            ) : (
              <>
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {friend.ownerName ?? "Amigo"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cargado · {summarize(friend.counts as Counts).owned}/
                        {summarize(friend.counts as Counts).total} pegados
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFriend(null)}
                      aria-label="Quitar amigo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {compare ? (
                  <TradeBuilder
                    iWantFromThem={compare.iWantFromThem}
                    iCanGiveThem={compare.iCanGiveThem}
                    ownerName={ownerName}
                    friendName={friend.ownerName}
                  />
                ) : null}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function TradeBuilder({
  iWantFromThem,
  iCanGiveThem,
  ownerName,
  friendName,
}: {
  iWantFromThem: TradeMatch[];
  iCanGiveThem: TradeMatch[];
  ownerName?: string;
  friendName?: string;
}) {
  const [pido, setPido] = useState<Set<string>>(() => new Set());
  const [doy, setDoy] = useState<Set<string>>(() => new Set());

  const togglePido = (code: string) =>
    setPido((s) => {
      const next = new Set(s);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  const toggleDoy = (code: string) =>
    setDoy((s) => {
      const next = new Set(s);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const allPido = () =>
    setPido(new Set(iWantFromThem.map((m) => m.code)));
  const clearPido = () => setPido(new Set());
  const allDoy = () => setDoy(new Set(iCanGiveThem.map((m) => m.code)));
  const clearDoy = () => setDoy(new Set());

  const matchAuto = () => {
    const pairs = Math.min(iWantFromThem.length, iCanGiveThem.length);
    setPido(new Set(iWantFromThem.slice(0, pairs).map((m) => m.code)));
    setDoy(new Set(iCanGiveThem.slice(0, pairs).map((m) => m.code)));
  };

  const pidoArr = useMemo(
    () =>
      iWantFromThem
        .filter((m) => pido.has(m.code))
        .map((m) => m.code),
    [pido, iWantFromThem],
  );
  const doyArr = useMemo(
    () => iCanGiveThem.filter((m) => doy.has(m.code)).map((m) => m.code),
    [doy, iCanGiveThem],
  );

  const proposalText = useMemo(
    () =>
      buildTradeProposalText({
        ownerName,
        friendName,
        pido: pidoArr,
        doy: doyArr,
      }),
    [ownerName, friendName, pidoArr, doyArr],
  );

  const handleCopy = async () => {
    if (pidoArr.length === 0 && doyArr.length === 0) {
      toast.error("Selecciona algún cromo primero");
      return;
    }
    try {
      await navigator.clipboard.writeText(proposalText);
      toast.success("Propuesta copiada");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleShare = async () => {
    if (pidoArr.length === 0 && doyArr.length === 0) {
      toast.error("Selecciona algún cromo primero");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: proposalText });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await handleCopy();
  };

  const friendShort = friendName ?? "tu amigo";
  const myShort = ownerName ?? "tú";

  if (iWantFromThem.length === 0 && iCanGiveThem.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No hay cromos que podáis intercambiar (todavía).
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Marca los cromos a pedir y los que vas a dar. No tiene que ser 1:1.
        </p>
        {iWantFromThem.length > 0 && iCanGiveThem.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={matchAuto}
            className="shrink-0 text-xs"
          >
            Match auto
          </Button>
        ) : null}
      </div>

      <SelectableList
        title={`Te pido a ${friendShort}`}
        subtitle="Cromos que tu amigo tiene de sobra y a ti te faltan"
        tone="amber"
        items={iWantFromThem.map((m) => ({
          code: m.code,
          extra: m.theirCount > 2 ? `×${m.theirCount - 1}` : undefined,
        }))}
        selected={pido}
        onToggle={togglePido}
        onAll={allPido}
        onClear={clearPido}
        empty={`${friendShort} no tiene repes que necesites`}
      />

      <SelectableList
        title={`Le doy a ${friendShort}`}
        subtitle={`Cromos que ${myShort} tiene de sobra y a ${friendShort} le faltan`}
        tone="emerald"
        items={iCanGiveThem.map((m) => ({
          code: m.code,
          extra: m.myCount > 2 ? `×${m.myCount - 1}` : undefined,
        }))}
        selected={doy}
        onToggle={toggleDoy}
        onAll={allDoy}
        onClear={clearDoy}
        empty="No tienes repes que él/ella necesite"
      />

      <div
        className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-10 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">
            <span className="text-warning-strong">{pidoArr.length}</span>{" "}
            <span className="text-muted-foreground">↔</span>{" "}
            <span className="text-success">{doyArr.length}</span>
          </div>
          {pidoArr.length !== doyArr.length &&
          pidoArr.length > 0 &&
          doyArr.length > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {pidoArr.length > doyArr.length
                ? `+${pidoArr.length - doyArr.length} a tu favor`
                : `+${doyArr.length - pidoArr.length} a su favor`}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="h-10"
            disabled={pidoArr.length === 0 && doyArr.length === 0}
          >
            <Copy className="mr-2 h-4 w-4" /> Copiar
          </Button>
          <Button
            onClick={handleShare}
            className="h-10"
            disabled={pidoArr.length === 0 && doyArr.length === 0}
          >
            <Send className="mr-2 h-4 w-4" /> Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}

function SelectableList({
  title,
  subtitle,
  tone,
  items,
  selected,
  onToggle,
  onAll,
  onClear,
  empty,
}: {
  title: string;
  subtitle?: string;
  tone: "emerald" | "amber";
  items: { code: string; extra?: string }[];
  selected: Set<string>;
  onToggle: (code: string) => void;
  onAll: () => void;
  onClear: () => void;
  empty: string;
}) {
  const selectedCount = items.filter((it) => selected.has(it.code)).length;
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  tone === "emerald" ? "bg-success" : "bg-warning-strong",
                )}
              />
              <h3 className="text-sm font-semibold">{title}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {selectedCount}/{items.length}
              </span>
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          {items.length > 0 ? (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={onAll}
                className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
              >
                Todos
              </button>
              <span className="text-[11px] text-muted-foreground">·</span>
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
              >
                Ninguno
              </button>
            </div>
          ) : null}
        </div>
        {items.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            {empty}
          </div>
        ) : (
          <div className="-mx-1 max-h-72 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-1.5 px-1">
              {items.map((it) => {
                const s = getStickerByCode(it.code);
                const isSelected = selected.has(it.code);
                return (
                  <button
                    key={it.code}
                    type="button"
                    onClick={() => onToggle(it.code)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                      isSelected
                        ? tone === "emerald"
                          ? "border-success bg-success-soft text-foreground"
                          : "border-warning-strong bg-warning-soft text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border transition-colors",
                        isSelected
                          ? tone === "emerald"
                            ? "border-success bg-success text-white"
                            : "border-warning-strong bg-warning-strong text-white"
                          : "border-border",
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-2.5 w-2.5" strokeWidth={4} />
                      ) : null}
                    </span>
                    {s?.flag ? (
                      <span className="text-sm leading-none">{s.flag}</span>
                    ) : null}
                    <span className="font-semibold tabular-nums">{it.code}</span>
                    {it.extra ? (
                      <span className="text-[10px] text-muted-foreground">
                        {it.extra}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CodeList({
  title,
  subtitle,
  icon,
  tone,
  items,
  empty,
  limit,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone: "emerald" | "amber";
  items: { code: string; badge?: string }[];
  empty: string;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = limit && !expanded ? items.slice(0, limit) : items;
  const remaining = items.length - shown.length;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              tone === "emerald"
                ? "bg-success-soft text-success"
                : "bg-warning-soft text-warning-strong",
            )}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            {subtitle ? (
              <div className="text-[11px] text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
        </div>
        {items.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            {empty}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {shown.map((it) => {
                const s = getStickerByCode(it.code);
                return (
                  <span
                    key={it.code}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs tabular-nums",
                      tone === "emerald" &&
                        "border-success/30 bg-success-soft/40",
                      tone === "amber" &&
                        "border-warning/30 bg-warning-soft/40",
                    )}
                    title={s ? `${s.sectionName} · ${s.label}` : undefined}
                  >
                    {s?.flag ? (
                      <span className="text-sm leading-none">{s.flag}</span>
                    ) : null}
                    <span className="font-semibold">{it.code}</span>
                    {it.badge ? (
                      <span className="text-[10px] text-muted-foreground">
                        {it.badge}
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
            {remaining > 0 ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Ver {remaining} más
              </button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DropZone({
  onFile,
  onClick,
}: {
  onFile: (file: File) => void;
  onClick: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <Card
      className={cn(
        "border-dashed transition-colors",
        over && "border-foreground/50 bg-accent/40",
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <FileUp className="h-8 w-8 text-muted-foreground" />
        <div>
          <div className="text-sm font-semibold">
            Carga la colección de tu amigo
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Arrastra el archivo .json que te ha pasado o tócalo para
            seleccionarlo. La comparativa se calcula al instante.
          </p>
        </div>
        <Button onClick={onClick} variant="outline">
          Seleccionar archivo
        </Button>
      </CardContent>
    </Card>
  );
}
