"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Send } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildShareUrl } from "@/lib/share-url";
import type { Counts } from "@/lib/collection";

export function ShareLinkDialog({
  open,
  onOpenChange,
  counts,
  ownerName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  counts: Counts;
  ownerName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Compartir por enlace</DialogTitle>
          <DialogDescription>
            Pásale el enlace a un amigo. Al abrirlo, la app le ofrecerá
            importar tu colección o verla como referencia para
            intercambiar.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <ShareLinkBody counts={counts} ownerName={ownerName} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ShareLinkBody({
  counts,
  ownerName,
}: {
  counts: Counts;
  ownerName?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildShareUrl(counts, ownerName)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [counts, ownerName]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleShare = async () => {
    if (!url) return;
    const text = ownerName
      ? `Mi colección Mundial 2026 (${ownerName}): ${url}`
      : `Mi colección Mundial 2026: ${url}`;
    const data: ShareData = { text };
    const canShare =
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      typeof navigator.share === "function" &&
      navigator.canShare(data);
    if (canShare) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    // Fallback: portapapeles. Sin share API o si falla, al menos
    // dejamos el enlace listo para pegar.
    handleCopy();
  };

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
        {error}
      </div>
    );
  }
  if (!url) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center rounded-xl border bg-white p-4">
        <QRCodeSVG value={url} size={208} level="M" marginSize={1} />
      </div>
      <div className="break-all rounded-md border bg-muted/50 p-2 font-mono text-[10.5px] leading-snug">
        {url}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleCopy} variant="outline" className="h-10">
          <Copy className="mr-2 h-4 w-4" /> Copiar
        </Button>
        <Button onClick={handleShare} className="h-10">
          <Send className="mr-2 h-4 w-4" /> Compartir
        </Button>
      </div>
    </div>
  );
}
