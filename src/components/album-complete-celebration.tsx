"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const FLAG_KEY = "album-2026:celebrated:v1";

function readFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function writeFlag(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(FLAG_KEY, "1");
    else window.localStorage.removeItem(FLAG_KEY);
  } catch {}
}

async function fireConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const defaults = {
    startVelocity: 45,
    ticks: 220,
    zIndex: 9999,
    colors: ["#f5c518", "#ffd86b", "#1f8b4c", "#ffffff", "#2a2520"],
  };
  // Ráfaga central potente
  confetti({
    ...defaults,
    particleCount: 140,
    spread: 100,
    origin: { y: 0.4 },
  });
  // Cañones laterales para envolver
  confetti({
    ...defaults,
    particleCount: 80,
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 0.7 },
  });
  confetti({
    ...defaults,
    particleCount: 80,
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 0.7 },
  });
  // Segunda ráfaga ligeramente diferida
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 100,
      spread: 130,
      origin: { y: 0.3 },
    });
  }, 550);
}

export function AlbumCompleteCelebration({
  complete,
  ownerName,
}: {
  complete: boolean;
  ownerName?: string;
}) {
  const [open, setOpen] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!complete) {
      writeFlag(false);
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;
    if (readFlag()) return;
    writeFlag(true);
    // Diferimos la apertura un microtick para no encadenar renders desde el
    // efecto: la celebración se dispara por una transición real del usuario,
    // no es estado derivado de props.
    queueMicrotask(() => setOpen(true));
    void fireConfetti();
  }, [complete]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-warning" />
            ¡Enhorabuena{ownerName ? `, ${ownerName}` : ""}!
          </DialogTitle>
          <DialogDescription>
            Has completado el álbum del Mundial 2026: 980 cromos pegados, ni
            uno menos. Eres campeón antes que nadie. 🏆
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => {
              setOpen(false);
              void fireConfetti();
            }}
          >
            ¡A celebrarlo!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
