"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  readSharePayloadFromHash,
  SESSION_INCOMING_FRIEND_KEY,
} from "@/lib/share-url";
import {
  summarize,
  useCollection,
  type Counts,
  type ExportPayload,
} from "@/lib/collection";

type Incoming = { counts: Counts; ownerName?: string } | null;

export function IncomingShareHandler() {
  const [incoming, setIncoming] = useState<Incoming>(null);
  const { importCounts, setOwnerName } = useCollection();
  const router = useRouter();

  useEffect(() => {
    const payload = readSharePayloadFromHash(window.location.hash);
    if (!payload) return;

    // Limpiar el hash para que un refresh no vuelva a disparar el diálogo.
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", cleanUrl);

    decodeSharePayload(payload)
      .then(setIncoming)
      .catch((e: unknown) => {
        toast.error("Enlace inválido", {
          description: e instanceof Error ? e.message : undefined,
        });
      });
  }, []);

  const close = () => setIncoming(null);

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
