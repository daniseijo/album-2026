"use client";

import { ArrowDown, ArrowUp, Check, Copy, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { applyCollectionDelta, useCollection } from "@/lib/collection";
import {
  addTradeEntry,
  findActiveByTradeId,
  newEntryId,
  useTradeHistory,
} from "@/lib/trade-history";
import { getStickerByCode } from "@/lib/album";
import type { TradePayload } from "@/lib/trade-url";
import { cn } from "@/lib/utils";

export function TradeAcceptDialog({
  payload,
  shareUrl,
  showCopyFallback = false,
  onClose,
}: {
  payload: TradePayload;
  shareUrl?: string;
  showCopyFallback?: boolean;
  onClose: () => void;
}) {
  // Suscribirse a la historia hace que el componente se vuelva a
  // renderizar cuando entra una entrada nueva (p.ej. doble click en
  // aceptar), y `already` se recalcula al instante.
  useTradeHistory();
  const { counts } = useCollection();

  const from = payload.from?.trim() || "Amigo";
  // Perspectiva del receptor:
  //   - `youGive` = lo que pide el emisor (yo entrego)
  //   - `youReceive` = lo que regala el emisor (yo recibo)
  const youGive = payload.pido;
  const youReceive = payload.doy;

  const already = findActiveByTradeId(payload.id);

  const handleAccept = () => {
    if (already) {
      toast.error("Este intercambio ya está aplicado");
      onClose();
      return;
    }
    const delta: Record<string, number> = {};
    for (const code of youGive) delta[code] = (delta[code] ?? 0) - 1;
    for (const code of youReceive) delta[code] = (delta[code] ?? 0) + 1;
    applyCollectionDelta(delta);
    addTradeEntry({
      id: newEntryId(),
      tradeId: payload.id,
      at: new Date().toISOString(),
      partner: from,
      direction: "received",
      gave: youGive,
      received: youReceive,
    });
    toast.success("Intercambio aplicado", {
      description: "Lo tienes en el historial si necesitas deshacerlo.",
    });
    onClose();
  };

  const handleCopyCode = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado", {
        description:
          "Pégalo en la app instalada (Intercambio → Pegar enlace)",
      });
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const missing = youGive.filter((code) => (counts[code] ?? 0) < 1);
  const wouldGoToZero = youGive.filter(
    (code) => (counts[code] ?? 0) === 1,
  );

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {already
              ? `Ya aplicaste el intercambio con ${from}`
              : `${from} te propone un intercambio`}
          </DialogTitle>
          <DialogDescription>
            {already
              ? "Si quieres deshacerlo, hazlo desde el Historial."
              : "Si lo aceptas, la app actualizará tu colección al instante. Podrás deshacerlo desde el Historial."}
          </DialogDescription>
        </DialogHeader>

        {!already ? (
          <div className="space-y-3">
            <CodeRow
              label="Le das"
              tone="amber"
              icon={<ArrowUp className="h-3.5 w-3.5" />}
              codes={youGive}
            />
            <CodeRow
              label="Recibes"
              tone="emerald"
              icon={<ArrowDown className="h-3.5 w-3.5" />}
              codes={youReceive}
            />

            {missing.length > 0 ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-[11px] text-destructive">
                Cuidado: <strong>{missing.length}</strong>{" "}
                {missing.length === 1
                  ? "cromo que vas a dar no lo tienes"
                  : "cromos que vas a dar no los tienes"}{" "}
                en tu colección.
              </div>
            ) : wouldGoToZero.length > 0 ? (
              <div className="rounded-md border border-warning/40 bg-warning-soft/40 p-2.5 text-[11px] text-warning-strong">
                {wouldGoToZero.length}{" "}
                {wouldGoToZero.length === 1
                  ? "cromo no es un repe"
                  : "cromos no son repes"}
                : te quedarías sin{" "}
                {wouldGoToZero.length === 1 ? "él" : "ellos"}.
              </div>
            ) : null}
          </div>
        ) : null}

        {showCopyFallback && shareUrl && !already ? (
          <div className="rounded-lg border bg-accent/40 p-3 text-xs">
            <p className="font-medium">¿Tienes la app instalada?</p>
            <p className="mt-1 text-muted-foreground">
              Los enlaces no abren la PWA en iOS. Copia el enlace, abre la app
              desde la pantalla de inicio y pulsa{" "}
              <strong>Intercambio → Pegar enlace</strong>.
            </p>
            <Button
              onClick={handleCopyCode}
              size="sm"
              variant="outline"
              className="mt-2 w-full"
            >
              <Copy className="mr-2 h-3.5 w-3.5" /> Copiar enlace
            </Button>
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {!already ? (
            <Button onClick={handleAccept} className="w-full">
              <Check className="mr-2 h-4 w-4" /> Aceptar y aplicar
            </Button>
          ) : null}
          <Button onClick={onClose} variant="ghost" className="w-full">
            {already ? "Cerrar" : (
              <>
                <X className="mr-2 h-4 w-4" /> Rechazar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CodeRow({
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
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full",
            tone === "emerald"
              ? "bg-success-soft text-success"
              : "bg-warning-soft text-warning-strong",
          )}
        >
          {icon}
        </span>
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          ({codes.length})
        </span>
      </div>
      {codes.length === 0 ? (
        <div className="ml-7 text-[11px] text-muted-foreground">—</div>
      ) : (
        <div className="-mx-1 max-h-44 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-1.5 px-1">
            {codes.map((code) => {
              const s = getStickerByCode(code);
              return (
                <span
                  key={code}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs tabular-nums",
                    tone === "emerald"
                      ? "border-success/30 bg-success-soft/40"
                      : "border-warning/40 bg-warning-soft/40",
                  )}
                  title={s ? `${s.sectionName} · ${s.label}` : undefined}
                >
                  {s?.flag ? (
                    <span className="text-sm leading-none">{s.flag}</span>
                  ) : null}
                  <span className="font-semibold">{code}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
