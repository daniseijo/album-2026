"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardPaste,
  Clock,
  Copy,
  History,
  Link2,
  PlayCircle,
  RotateCcw,
  Send,
  FileUp,
  Trash2,
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
import {
  SESSION_INCOMING_FRIEND_KEY,
  decodeSharePayload,
  extractSharePayload,
} from "@/lib/share-url";
import {
  decodeTradePayload,
  extractTradePayload,
  newTradeId,
  type TradePayload,
} from "@/lib/trade-url";
import {
  addTradeEntry,
  deleteTradeEntry,
  markTradeApplied,
  markTradeRedone,
  markTradeUndone,
  newEntryId,
  tradeStatus,
  useTradeHistory,
  type TradeHistoryEntry,
} from "@/lib/trade-history";
import { ShareLinkDialog } from "@/components/share-link-dialog";
import { TradeAcceptDialog } from "@/components/trade-accept-dialog";
import { TradeLinkDialog } from "@/components/trade-link-dialog";
import { cn } from "@/lib/utils";

type TabKey = "mine" | "friend" | "history";

export default function IntercambioPage() {
  const { counts, ownerName, setOwnerName, applyDelta } = useCollection();
  const history = useTradeHistory();

  const [friend, setFriend] = useState<ExportPayload | null>(null);
  const [tab, setTab] = useState<TabKey>("mine");
  const [shareLinkOpen, setShareLinkOpen] = useState(false);
  const [pendingIncomingTrade, setPendingIncomingTrade] =
    useState<TradePayload | null>(null);
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
    const filename = `album-2026${ownerName ? `-${slug(ownerName)}` : ""}.json`;
    const file = new File([blob], filename, { type: "application/json" });
    const canShareFile =
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      typeof navigator.share === "function" &&
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
    // Fallback: descarga directa. Algunos navegadores ignoran el click
    // si el <a> no está en el DOM, así que lo añadimos antes de pulsarlo.
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
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
      setTab("friend");
      toast.success(
        `Cargada colección de ${data.ownerName ?? "tu amigo"}`,
      );
    } catch (e) {
      toast.error("Archivo inválido", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handlePasteLink = async () => {
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      toast.error("No se pudo leer el portapapeles", {
        description: "Concédele permiso al navegador o pega el enlace tú mismo.",
      });
      return;
    }
    // Un enlace `#t=...` es un intercambio; `#d=...` es una colección.
    // Probamos primero el intercambio porque es más específico.
    const tradeRaw = extractTradePayload(text);
    if (tradeRaw) {
      try {
        const payload = await decodeTradePayload(tradeRaw);
        setPendingIncomingTrade(payload);
      } catch (e) {
        toast.error("Enlace de intercambio inválido", {
          description: e instanceof Error ? e.message : undefined,
        });
      }
      return;
    }
    const payload = extractSharePayload(text);
    if (!payload) {
      toast.error("No encontré un enlace", {
        description: "Copia un enlace de colección o de intercambio.",
      });
      return;
    }
    try {
      const { counts: c, ownerName: name } = await decodeSharePayload(payload);
      const data: ExportPayload = {
        app: "album-2026",
        version: 1,
        exportedAt: new Date().toISOString(),
        ownerName: name,
        counts: c,
      };
      setFriend(data);
      setTab("friend");
      toast.success(
        `Cargada colección de ${name ?? "tu amigo"}`,
      );
    } catch (e) {
      toast.error("Enlace inválido", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleSendTrade = (
    pido: string[],
    doy: string[],
    opts: { pending: boolean },
  ) => {
    const id = newTradeId();
    const payload: TradePayload = {
      v: 1,
      id,
      from: ownerName?.trim() || undefined,
      pido,
      doy,
    };
    const now = new Date().toISOString();
    if (!opts.pending) {
      // Aplicamos en mi colección: doy = -1, pido = +1
      const delta: Record<string, number> = {};
      for (const code of doy) delta[code] = (delta[code] ?? 0) - 1;
      for (const code of pido) delta[code] = (delta[code] ?? 0) + 1;
      applyDelta(delta);
    }
    addTradeEntry({
      id: newEntryId(),
      tradeId: id,
      at: now,
      partner: friend?.ownerName?.trim() || "Amigo",
      direction: "sent",
      gave: doy,
      received: pido,
      pendingAt: opts.pending ? now : undefined,
    });
    return payload;
  };

  const handleApplyPending = (entry: TradeHistoryEntry) => {
    const delta: Record<string, number> = {};
    for (const code of entry.gave) delta[code] = (delta[code] ?? 0) - 1;
    for (const code of entry.received) delta[code] = (delta[code] ?? 0) + 1;
    applyDelta(delta);
    markTradeApplied(entry.id);
    toast.success("Intercambio aplicado");
  };

  const handleUndoTrade = (entry: TradeHistoryEntry) => {
    // Invertir el efecto: lo que entregué vuelve, lo que recibí se va.
    const delta: Record<string, number> = {};
    for (const code of entry.gave) delta[code] = (delta[code] ?? 0) + 1;
    for (const code of entry.received) delta[code] = (delta[code] ?? 0) - 1;
    applyDelta(delta);
    markTradeUndone(entry.id);
    toast.success("Intercambio deshecho");
  };

  const handleRedoTrade = (entry: TradeHistoryEntry) => {
    // Si está deshecho y lo restauramos, re-aplicamos el efecto original.
    const delta: Record<string, number> = {};
    for (const code of entry.gave) delta[code] = (delta[code] ?? 0) - 1;
    for (const code of entry.received) delta[code] = (delta[code] ?? 0) + 1;
    applyDelta(delta);
    markTradeRedone(entry.id);
    toast.success("Intercambio restaurado");
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

  // Si llegamos a /intercambio desde un enlace de colección compartida,
  // el handler global guardó la colección del amigo en sessionStorage.
  // La consumimos al montar y mostramos directamente la comparativa.
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = sessionStorage.getItem(SESSION_INCOMING_FRIEND_KEY);
        if (!raw) return;
        sessionStorage.removeItem(SESSION_INCOMING_FRIEND_KEY);
        const data = JSON.parse(raw) as ExportPayload;
        setFriend(data);
        setTab("friend");
        toast.success(
          `Cargada colección de ${data.ownerName ?? "tu amigo"}`,
        );
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

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mine">Mi lista</TabsTrigger>
            <TabsTrigger value="friend">
              Con un amigo
              {friend ? (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="history">
              Historial
              {history.length > 0 ? (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground tabular-nums">
                  {history.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-4 space-y-3">
            <Button
              onClick={() => setShareLinkOpen(true)}
              className="h-11 w-full"
              variant="default"
            >
              <Link2 className="mr-2 h-4 w-4" /> Compartir por enlace
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCopyWhatsapp}
                variant="outline"
                className="h-11"
              >
                <Copy className="mr-2 h-4 w-4" /> Texto
              </Button>
              <Button
                onClick={handleShareFile}
                variant="outline"
                className="h-11"
              >
                <Send className="mr-2 h-4 w-4" /> Archivo
              </Button>
            </div>
            <p className="px-1 text-[11px] text-muted-foreground">
              <strong>Enlace</strong>: tu amigo lo abre en su móvil y la app
              le importa la colección de un toque.{" "}
              <strong>Texto</strong>: lista de repes y faltas para pegar en
              cualquier chat.{" "}
              <strong>Archivo</strong>: lo mismo que el enlace pero como{" "}
              <code>.json</code>, útil si el chat corta enlaces largos.
            </p>

            <CodeList
              title="Me sobran"
              icon={<ArrowUp className="h-4 w-4" />}
              tone="emerald"
              items={dupeCodes.map((d) => ({
                code: d.code,
                badge: `×${d.c - 1}`,
              }))}
              empty="Aún no tienes repes"
            />
            <CodeList
              title="Me faltan"
              icon={<ArrowDown className="h-4 w-4" />}
              tone="amber"
              items={missingCodes.map((code) => ({ code }))}
              empty="¡Álbum completo!"
              limit={120}
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
                onPasteLink={handlePasteLink}
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
                    onSendTrade={handleSendTrade}
                  />
                ) : null}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            <TradeHistoryView
              entries={history}
              onPaste={handlePasteLink}
              onApply={handleApplyPending}
              onUndo={handleUndoTrade}
              onRedo={handleRedoTrade}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ShareLinkDialog
        open={shareLinkOpen}
        onOpenChange={setShareLinkOpen}
        counts={counts}
        ownerName={ownerName}
      />

      {pendingIncomingTrade ? (
        <TradeAcceptDialog
          payload={pendingIncomingTrade}
          onClose={() => setPendingIncomingTrade(null)}
        />
      ) : null}
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
  onSendTrade,
}: {
  iWantFromThem: TradeMatch[];
  iCanGiveThem: TradeMatch[];
  ownerName?: string;
  friendName?: string;
  onSendTrade: (
    pido: string[],
    doy: string[],
    opts: { pending: boolean },
  ) => TradePayload;
}) {
  const [pido, setPido] = useState<Set<string>>(() => new Set());
  const [doy, setDoy] = useState<Set<string>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkPayload, setLinkPayload] = useState<TradePayload | null>(null);

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

  const handleSendLink = () => {
    if (pidoArr.length === 0 && doyArr.length === 0) {
      toast.error("Selecciona algún cromo primero");
      return;
    }
    setConfirmOpen(true);
  };

  const finishSend = (pending: boolean) => {
    const payload = onSendTrade(pidoArr, doyArr, { pending });
    setConfirmOpen(false);
    setLinkPayload(payload);
    setLinkOpen(true);
    setPido(new Set());
    setDoy(new Set());
    toast.success(
      pending ? "Intercambio guardado como pendiente" : "Intercambio aplicado",
      {
        description: pending
          ? "Comparte el enlace y aplícalo desde el Historial cuando os veáis."
          : "Comparte el enlace con tu amigo.",
      },
    );
  };

  const handleConfirmApply = () => finishSend(false);
  const handleConfirmPending = () => finishSend(true);

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
          extra: `×${m.theirCount - 1}`,
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
          extra: `×${m.myCount - 1}`,
        }))}
        selected={doy}
        onToggle={toggleDoy}
        onAll={allDoy}
        onClear={clearDoy}
        empty="No tienes repes que él/ella necesite"
      />

      <div
        className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-10 space-y-2 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur"
      >
        <div className="flex items-center justify-between">
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
        <Button
          onClick={handleSendLink}
          className="h-10 w-full"
          disabled={pidoArr.length === 0 && doyArr.length === 0}
        >
          <Link2 className="mr-2 h-4 w-4" /> Enviar como enlace
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="h-9"
            disabled={pidoArr.length === 0 && doyArr.length === 0}
          >
            <Copy className="mr-2 h-3.5 w-3.5" /> Copiar texto
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="h-9"
            disabled={pidoArr.length === 0 && doyArr.length === 0}
          >
            <Send className="mr-2 h-3.5 w-3.5" /> Enviar texto
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartir intercambio</DialogTitle>
            <DialogDescription>
              {doyArr.length > 0
                ? `Entregarás ${doyArr.length} ${doyArr.length === 1 ? "cromo" : "cromos"}`
                : "No entregas nada"}
              {" "}y{" "}
              {pidoArr.length > 0
                ? `recibirás ${pidoArr.length} ${pidoArr.length === 1 ? "cromo" : "cromos"}`
                : "no recibes nada"}
              . Elige cuándo quieres tocar tu colección.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-xs">
            <div className="flex items-start gap-2">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div>
                <div className="font-semibold">Aplicar y enviar</div>
                <p className="text-muted-foreground">
                  Actualizamos tu colección ahora. Útil si ya tienes los
                  cromos físicamente o vais a hacer el cambio enseguida.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-strong" />
              <div>
                <div className="font-semibold">Enviar y dejar pendiente</div>
                <p className="text-muted-foreground">
                  Guardamos el intercambio en el Historial sin tocar tu
                  colección. Cuando os veáis con {friendShort}, le das a
                  Aplicar.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-col-reverse">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              className="w-full"
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmPending}
              className="w-full"
            >
              <Clock className="mr-2 h-4 w-4" /> Enviar y dejar pendiente
            </Button>
            <Button onClick={handleConfirmApply} className="w-full">
              <Link2 className="mr-2 h-4 w-4" /> Aplicar y enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TradeLinkDialog
        open={linkOpen}
        onOpenChange={(o) => {
          setLinkOpen(o);
          if (!o) setLinkPayload(null);
        }}
        payload={linkPayload}
        friendName={friendName}
      />
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
  onPasteLink,
}: {
  onFile: (file: File) => void;
  onClick: () => void;
  onPasteLink: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <Card
      className={cn(
        "border-dashed transition-colors",
        over && "border-primary/50 bg-accent/40",
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
            Pega el enlace que te ha enviado (colección o intercambio),
            arrastra su <code>.json</code> o tócalo para seleccionarlo. La
            comparativa se calcula al instante.
          </p>
        </div>
        <div className="grid w-full max-w-xs grid-cols-2 gap-2">
          <Button onClick={onPasteLink} variant="default" size="default">
            <ClipboardPaste className="mr-2 h-4 w-4" /> Pegar enlace
          </Button>
          <Button onClick={onClick} variant="outline" size="default">
            <FileUp className="mr-2 h-4 w-4" /> Archivo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeHistoryView({
  entries,
  onPaste,
  onApply,
  onUndo,
  onRedo,
}: {
  entries: TradeHistoryEntry[];
  onPaste: () => void;
  onApply: (entry: TradeHistoryEntry) => void;
  onUndo: (entry: TradeHistoryEntry) => void;
  onRedo: (entry: TradeHistoryEntry) => void;
}) {
  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                ¿Te llegó un enlace de intercambio?
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pégalo aquí y revísalo antes de aceptarlo.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onPaste}
              className="shrink-0"
            >
              <ClipboardPaste className="mr-1.5 h-3.5 w-3.5" /> Pegar enlace
            </Button>
          </div>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <History className="h-7 w-7 text-muted-foreground" />
            <div className="text-sm font-medium">Aún no hay intercambios</div>
            <p className="max-w-xs text-[11px] text-muted-foreground">
              Cuando envíes un intercambio por enlace o aceptes uno, aparecerá
              aquí con un botón para deshacerlo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <TradeHistoryRow
              key={entry.id}
              entry={entry}
              onApply={() => onApply(entry)}
              onUndo={() => onUndo(entry)}
              onRedo={() => onRedo(entry)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function TradeHistoryRow({
  entry,
  onApply,
  onUndo,
  onRedo,
}: {
  entry: TradeHistoryEntry;
  onApply: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const [confirmUndoOpen, setConfirmUndoOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const status = tradeStatus(entry);
  const when = useRelativeTime(entry.at);
  return (
    <Card className={cn(status === "undone" && "opacity-60")}>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
              <span
                className={cn(
                  "inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[10px] font-medium uppercase tracking-wide",
                  entry.direction === "sent"
                    ? "bg-primary/10 text-primary"
                    : "bg-success-soft text-success",
                )}
              >
                {entry.direction === "sent" ? "Enviado" : "Recibido"}
              </span>
              {status === "pending" ? (
                <span className="inline-flex h-5 items-center gap-1 rounded-full bg-warning-soft px-1.5 text-[10px] font-medium uppercase tracking-wide text-warning-strong">
                  <Clock className="h-2.5 w-2.5" /> Pendiente
                </span>
              ) : null}
              <span className="truncate">{entry.partner}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {when}
              {status === "pending"
                ? " · sin aplicar"
                : status === "undone"
                  ? " · deshecho"
                  : ""}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {status === "applied" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmUndoOpen(true)}
                className="h-7 text-xs"
              >
                <RotateCcw className="mr-1 h-3 w-3" /> Deshacer
              </Button>
            ) : status === "pending" ? (
              <>
                <Button
                  size="sm"
                  onClick={onApply}
                  className="h-7 text-xs"
                >
                  <PlayCircle className="mr-1 h-3 w-3" /> Aplicar
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setConfirmDeleteOpen(true)}
                  aria-label="Descartar pendiente"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRedo}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="mr-1 h-3 w-3 -scale-x-100" /> Restaurar
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setConfirmDeleteOpen(true)}
                  aria-label="Eliminar del historial"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
        <HistoryCodeLine
          label={status === "pending" ? "Darás" : "Diste"}
          tone="amber"
          icon={<ArrowUp className="h-3 w-3" />}
          codes={entry.gave}
        />
        <HistoryCodeLine
          label={status === "pending" ? "Recibirás" : "Recibiste"}
          tone="emerald"
          icon={<ArrowDown className="h-3 w-3" />}
          codes={entry.received}
        />
      </CardContent>

      <Dialog open={confirmUndoOpen} onOpenChange={setConfirmUndoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Deshacer este intercambio?</DialogTitle>
            <DialogDescription>
              Tu colección volverá al estado anterior:
              {" "}
              {entry.gave.length > 0
                ? `te devolveremos ${entry.gave.length} ${entry.gave.length === 1 ? "cromo" : "cromos"}`
                : "nada que devolver"}
              {" "}y{" "}
              {entry.received.length > 0
                ? `quitaremos ${entry.received.length} ${entry.received.length === 1 ? "cromo" : "cromos"} que recibiste`
                : "nada que quitar"}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmUndoOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onUndo();
                setConfirmUndoOpen(false);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Deshacer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {status === "pending"
                ? "¿Descartar este pendiente?"
                : "¿Eliminar del historial?"}
            </DialogTitle>
            <DialogDescription>
              {status === "pending"
                ? "Lo borraremos del historial. No tocábamos tu colección, así que no cambia nada en el álbum."
                : "Lo borraremos de la lista. Como ya está deshecho, tu colección no cambia. Esta acción no se puede deshacer."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteTradeEntry(entry.id);
                setConfirmDeleteOpen(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> {status === "pending" ? "Descartar" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function HistoryCodeLine({
  label,
  tone,
  icon,
  codes,
}: {
  label: string;
  tone: "emerald" | "amber";
  icon: React.ReactNode;
  codes: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
          tone === "emerald"
            ? "bg-success-soft text-success"
            : "bg-warning-soft text-warning-strong",
        )}
      >
        {icon}
        {label}
        <span className="tabular-nums opacity-70">({codes.length})</span>
      </span>
      {codes.length === 0 ? (
        <span className="text-[11px] text-muted-foreground">—</span>
      ) : (
        codes.map((code) => {
          const s = getStickerByCode(code);
          return (
            <span
              key={code}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] tabular-nums",
                tone === "emerald"
                  ? "border-success/30 bg-success-soft/30"
                  : "border-warning/30 bg-warning-soft/30",
              )}
              title={s ? `${s.sectionName} · ${s.label}` : undefined}
            >
              {s?.flag ? (
                <span className="text-[12px] leading-none">{s.flag}</span>
              ) : null}
              <span className="font-semibold">{code}</span>
            </span>
          );
        })
      )}
    </div>
  );
}

function useRelativeTime(iso: string): string {
  // Re-render perezoso: como las entradas se ordenan por fecha de creación
  // y la página entera se vuelve a renderizar a menudo, no hace falta un
  // intervalo. Si hace falta más exactitud puntual, ya se actualizará al
  // siguiente render.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "ahora mismo";
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `hace ${day} ${day === 1 ? "día" : "días"}`;
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "2-digit",
  });
}
