"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  summarizeUpdate,
  UpdateMode,
  useCollection,
} from "@/lib/collection";
import { TOTAL_STICKERS } from "@/lib/album";
import { TOTAL_UPDATE } from "@/lib/update-set";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Download,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

export default function AjustesPage() {
  const {
    counts,
    ownerName,
    setOwnerName,
    importCounts,
    importUpdate,
    reset,
    hasUpdateSet,
    updateMode,
    updateOwned,
    enableUpdateSet,
    disableUpdateSet,
    setUpdateMode,
  } = useCollection();
  const totals = summarize(counts);
  const updateTotals = summarizeUpdate(updateOwned);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);

  const handleExport = () => {
    const payload = buildExport(counts, ownerName, {
      hasUpdateSet,
      updateMode,
      updateOwned,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `album-2026${ownerName ? `-${slug(ownerName)}` : ""}.json`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Archivo descargado");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseImport(text);
      importCounts(data.counts);
      if (data.ownerName) setOwnerName(data.ownerName);
      importUpdate({
        hasUpdateSet: data.hasUpdateSet,
        updateMode: data.updateMode,
        updateOwned: data.updateOwned,
      });
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

        <Card className={hasUpdateSet ? "border-update/40" : undefined}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <RefreshCw className="h-4 w-4 text-update" /> Update set
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {TOTAL_UPDATE} cromos que Panini actualizó tras las listas
                  definitivas. Actívalo solo si compraste el pack.
                </p>
              </div>
              <Switch
                checked={hasUpdateSet}
                onCheckedChange={(v) => {
                  if (v) setActivateOpen(true);
                  else disableUpdateSet();
                }}
              />
            </div>

            {hasUpdateSet ? (
              <>
                <div className="rounded-lg bg-update/5 p-3">
                  <div className="text-xs font-medium">
                    {updateTotals.owned}/{updateTotals.total} anotados
                  </div>
                  <div className="mt-2 flex gap-2">
                    <ModePill
                      active={updateMode === "substitute"}
                      onClick={() => setUpdateMode("substitute")}
                      title="Sustituyen"
                      hint="Completan el slot del original"
                    />
                    <ModePill
                      active={updateMode === "addition"}
                      onClick={() => setUpdateMode("addition")}
                      title="Añadido"
                      hint="Colección aparte"
                    />
                  </div>
                </div>
                <Link
                  href="/update-set"
                  prefetch
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Ver y marcar los {TOTAL_UPDATE} cromos
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </>
            ) : null}
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

      <ActivateUpdateDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        onConfirm={(mode, fillAll) => {
          enableUpdateSet({ mode, fillAll });
          setActivateOpen(false);
          toast.success(
            fillAll
              ? `Update set activado · ${TOTAL_UPDATE} marcados`
              : "Update set activado",
          );
        }}
      />
    </div>
  );
}

function ModePill({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg border px-2.5 py-2 text-left transition-colors",
        active
          ? "border-update bg-update/10"
          : "border-border bg-background hover:bg-accent",
      )}
    >
      <div
        className={cn(
          "text-xs font-semibold",
          active ? "text-update" : "text-foreground",
        )}
      >
        {title}
      </div>
      <div className="text-[10px] leading-tight text-muted-foreground">
        {hint}
      </div>
    </button>
  );
}

function ActivateUpdateDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: UpdateMode, fillAll: boolean) => void;
}) {
  const [mode, setMode] = useState<UpdateMode>("substitute");
  const [fillAll, setFillAll] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-update" /> Activar update set
          </DialogTitle>
          <DialogDescription>
            Dos ajustes rápidos y listo. Podrás cambiarlos después.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            ¿Cómo cuentan?
          </div>
          <ChoiceRow
            active={mode === "substitute"}
            onClick={() => setMode("substitute")}
            title="Sustituyen al original"
            hint="El actualizado completa el mismo slot. Puedes terminar el álbum con los alternativos."
          />
          <ChoiceRow
            active={mode === "addition"}
            onClick={() => setMode("addition")}
            title="Son un añadido"
            hint="Colección aparte. El total de 980 no cambia."
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            ¿Cómo los anoto?
          </div>
          <ChoiceRow
            active={fillAll}
            onClick={() => setFillAll(true)}
            title="Marcarlos todos de golpe"
            hint={`Compraste el pack: los ${TOTAL_UPDATE} quedan anotados.`}
          />
          <ChoiceRow
            active={!fillAll}
            onClick={() => setFillAll(false)}
            title="Los iré añadiendo uno a uno"
            hint="Empiezas en 0 y marcas según los consigas."
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(mode, fillAll)}>Activar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceRow({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-update bg-update/5"
          : "border-border bg-background hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          active ? "border-update" : "border-muted-foreground/40",
        )}
      >
        {active ? <span className="h-2 w-2 rounded-full bg-update" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
          {hint}
        </span>
      </span>
    </button>
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
