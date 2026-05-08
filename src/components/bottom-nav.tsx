"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, ArrowLeftRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Cromos", icon: Layers },
  { href: "/intercambio", label: "Intercambio", icon: ArrowLeftRight },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={cn(
                  "flex h-[4.5rem] flex-col items-center justify-center gap-1 text-xs transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                prefetch
              >
                <Icon
                  className={cn("h-5 w-5", active && "scale-110")}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className={cn(active && "font-medium")}>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
