"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  buildExport,
  parseImport,
  summarize,
  useCollection,
} from "@/lib/collection";
import { TOTAL_STICKERS } from "@/lib/album";
import { Download, Trash2, Upload } from "lucide-react";

export default function AjustesPage() {
  const { counts, ownerName, setOwnerName, importCounts, reset } =
    useCollection();
  const totals = summarize(counts);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const payload = buildExport(counts, ownerName);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `album-2026${ownerName ? `-${slug(ownerName)}` : ""}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Archivo descargado");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseImport(text);
      importCounts(data.counts);
      if (data.ownerName) setOwnerName(data.ownerName);
      toast.success("Colección importada");
    } catch (e) {
      toast.error("Archivo inválido", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <div>
      <PageHeader title="Ajustes" subtitle="Tus datos y la app" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <Card>
          <CardContent className="space-y-2 p-4">
            <label className="text-xs font-medium text-muted-foreground">
              Tu nombre
            </label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Tu nombre"
            />
            <p className="text-[11px] text-muted-foreground">
              Aparece en el archivo y en el texto que se copia a WhatsApp.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <div className="text-sm font-semibold">Mi colección</div>
              <p className="text-xs text-muted-foreground">
                {totals.owned} pegados · {totals.dupes} repes ·{" "}
                {totals.missing} faltan ({TOTAL_STICKERS} total)
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" /> Exportar a archivo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" /> Importar desde archivo
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Importar reemplaza tu colección actual. Exporta antes si quieres
              guardar copia.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="space-y-2 p-4">
            <div className="text-sm font-semibold text-destructive">
              Zona peligrosa
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmReset(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Borrar mi colección
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-xs text-muted-foreground">
            <p>
              Los datos se guardan en este dispositivo (almacenamiento del
              navegador). Si borras los datos del navegador o desinstalas la
              app, perderás tu colección. Exporta de vez en cuando para tener
              una copia.
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar tu colección?</DialogTitle>
            <DialogDescription>
              Se eliminarán todos los cromos pegados y repes que tienes
              registrados. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                reset();
                setConfirmReset(false);
                toast.success("Colección reiniciada");
              }}
            >
              Sí, borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
