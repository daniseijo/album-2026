"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  decodeTradePayload,
  readTradePayloadFromHash,
  type TradePayload,
} from "@/lib/trade-url";
import { isStandalonePwa } from "@/lib/share-url";
import { TradeAcceptDialog } from "@/components/trade-accept-dialog";

type Incoming = {
  payload: TradePayload;
  shareUrl: string;
} | null;

export function IncomingTradeHandler() {
  const [incoming, setIncoming] = useState<Incoming>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setStandalone(isStandalonePwa()));

    const raw = readTradePayloadFromHash(window.location.hash);
    if (!raw) return;

    // Guardamos el enlace original para el botón "Copiar enlace" (iOS PWA)
    // antes de limpiar el hash.
    const shareUrl = `${window.location.origin}/#t=${raw}`;
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", cleanUrl);

    decodeTradePayload(raw)
      .then((payload) => setIncoming({ payload, shareUrl }))
      .catch((e: unknown) => {
        toast.error("Enlace de intercambio inválido", {
          description: e instanceof Error ? e.message : undefined,
        });
      });
  }, []);

  if (!incoming) return null;

  return (
    <TradeAcceptDialog
      payload={incoming.payload}
      shareUrl={incoming.shareUrl}
      showCopyFallback={!standalone}
      onClose={() => setIncoming(null)}
    />
  );
}
