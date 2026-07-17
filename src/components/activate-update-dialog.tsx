"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UpdateMode } from "@/lib/collection";
import { TOTAL_UPDATE } from "@/lib/update-set";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function ActivateUpdateDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: UpdateMode, fillAll: boolean) => void;
}) {
  const [mode, setMode] = useState<UpdateMode>("addition");
  const [fillAll, setFillAll] = useState(false);

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
            active={mode === "addition"}
            onClick={() => setMode("addition")}
            title="Son un añadido"
            hint="Colección aparte. El total de 980 no cambia."
          />
          <ChoiceRow
            active={mode === "substitute"}
            onClick={() => setMode("substitute")}
            title="Sustituyen al original"
            hint="El actualizado completa el mismo slot. Puedes terminar el álbum con los alternativos."
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            ¿Cómo los anoto?
          </div>
          <ChoiceRow
            active={!fillAll}
            onClick={() => setFillAll(false)}
            title="Los iré añadiendo uno a uno"
            hint="Empiezas en 0 y marcas según los consigas."
          />
          <ChoiceRow
            active={fillAll}
            onClick={() => setFillAll(true)}
            title="Marcarlos todos de golpe"
            hint={`Compraste el pack: los ${TOTAL_UPDATE} quedan anotados.`}
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
