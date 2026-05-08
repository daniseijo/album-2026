"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
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
import {
  decodeSharePayload,
  isStandalonePwa,
  readSharePayloadFromHash,
  SESSION_INCOMING_FRIEND_KEY,
} from "@/lib/share-url";
import {
  summarize,
  useCollection,
  type Counts,
  type ExportPayload,
} from "@/lib/collection";

type Incoming = {
  payload: string;
  shareUrl: string;
  counts: Counts;
  ownerName?: string;
} | null;

export function IncomingShareHandler() {
  const [incoming, setIncoming] = useState<Incoming>(null);
  const [standalone, setStandalone] = useState(false);
  const { importCounts, setOwnerName } = useCollection();
  const router = useRouter();

  useEffect(() => {
    Promise.resolve().then(() => setStandalone(isStandalonePwa()));

    const payload = readSharePayloadFromHash(window.location.hash);
    if (!payload) return;

    // Reconstruimos la URL canónica para el botón "Copiar código" antes
    // de limpiar el hash, así no perdemos el original.
    const shareUrl = `${window.location.origin}/#d=${payload}`;
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", cleanUrl);

    decodeSharePayload(payload)
      .then(({ counts, ownerName }) =>
        setIncoming({ payload, shareUrl, counts, ownerName }),
      )
      .catch((e: unknown) => {
        toast.error("Enlace inválido", {
          description: e instanceof Error ? e.message : undefined,
        });
      });
  }, []);

  const close = () => setIncoming(null);

  const handleCopyCode = async () => {
    if (!incoming) return;
    try {
      await navigator.clipboard.writeText(incoming.shareUrl);
      toast.success("Código copiado", {
        description: "Pégalo en la app instalada (Intercambio → Con un amigo)",
      });
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleViewAsFriend = () => {
    if (!incoming) return;
    const payload: ExportPayload = {
      app: "album-2026",
      version: 1,
      exportedAt: new Date().toISOString(),
      ownerName: incoming.ownerName,
      counts: incoming.counts,
    };
    try {
      sessionStorage.setItem(
        SESSION_INCOMING_FRIEND_KEY,
        JSON.stringify(payload),
      );
    } catch {}
    close();
    router.push("/intercambio");
  };

  const handleReplace = () => {
    if (!incoming) return;
    importCounts(incoming.counts);
    if (incoming.ownerName) setOwnerName(incoming.ownerName);
    close();
    toast.success("Colección importada");
  };

  if (!incoming) return null;

  const totals = summarize(incoming.counts);
  const friend = incoming.ownerName ?? "tu amigo";

  return (
    <Dialog open onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Has recibido la colección de {friend}</DialogTitle>
          <DialogDescription>
            {totals.owned}/{totals.total} pegados
            {totals.dupes > 0 ? ` · ${totals.dupes} repes` : ""}
            {" · "}
            {totals.percent}%
          </DialogDescription>
        </DialogHeader>

        {!standalone ? (
          <div className="rounded-lg border bg-accent/40 p-3 text-xs">
            <p className="font-medium">¿Tienes la app instalada en este móvil?</p>
            <p className="mt-1 text-muted-foreground">
              Los enlaces no abren dentro de la PWA en iOS. Copia el código,
              abre la app desde tu pantalla de inicio y pulsa{" "}
              <strong>Intercambio → Con un amigo → Pegar enlace</strong>. Tu
              colección viaja contigo.
            </p>
            <Button
              onClick={handleCopyCode}
              size="sm"
              variant="outline"
              className="mt-2 w-full"
            >
              <Copy className="mr-2 h-3.5 w-3.5" /> Copiar código
            </Button>
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleViewAsFriend} className="w-full">
            Ver para intercambiar
          </Button>
          <Button
            onClick={handleReplace}
            variant="outline"
            className="w-full"
          >
            Reemplazar mi colección por esta
          </Button>
          <Button onClick={close} variant="ghost" className="w-full">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
