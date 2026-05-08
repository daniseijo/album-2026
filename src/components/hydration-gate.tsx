"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

// Bloquea el render del contenido data-dependiente hasta que el
// cliente haya hidratado y leído el localStorage. Sin esto, en el
// primer render se ven stats a cero y cards vacías durante un
// instante antes de que useSyncExternalStore cambie del snapshot
// servidor al de cliente.
export function HydrationGate({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-warning" />
      </div>
    );
  }

  return <>{children}</>;
}
