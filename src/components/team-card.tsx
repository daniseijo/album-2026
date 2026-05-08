"use client";

import { Section, STICKER_BY_NUMBER } from "@/lib/album";
import { Counts } from "@/lib/collection";
import { cn } from "@/lib/utils";

export function TeamCard({
  section,
  counts,
  onClick,
  active,
}: {
  section: Section;
  counts: Counts;
  onClick: () => void;
  active?: boolean;
}) {
  const total = section.range[1] - section.range[0] + 1;
  const dots: ("missing" | "owned" | "dupe")[] = [];
  let owned = 0;
  for (let n = section.range[0]; n <= section.range[1]; n++) {
    const s = STICKER_BY_NUMBER.get(n);
    const c = s ? counts[s.code] ?? 0 : 0;
    if (c === 0) dots.push("missing");
    else if (c === 1) {
      dots.push("owned");
      owned += 1;
    } else {
      dots.push("dupe");
      owned += 1;
    }
  }

  const completed = owned === total;
  const started = owned > 0 && !completed;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      className={cn(
        "relative flex w-full cursor-pointer flex-col items-start gap-2 overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all active:scale-[0.99]",
        completed && "border-success/50 bg-success-soft/60",
        started && "border-warning/40 bg-warning-soft/50",
        !completed && !started && "border-border bg-card hover:bg-accent/40",
        active && "border-success/60 ring-2 ring-success/20",
      )}
    >
      {active ? (
        <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-success" />
      ) : null}
      <div className="flex w-full items-center gap-2">
        <span className="text-2xl leading-none">{section.flag}</span>
      </div>
      <div className="min-w-0 w-full">
        <div className="truncate text-sm font-semibold leading-tight">
          {section.name}
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums">
          {owned}/{total} cromos
        </div>
      </div>
      <div className="mt-1 flex w-full flex-wrap gap-[3px]">
        {dots.map((d, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              d === "missing" && "bg-border",
              d === "owned" && "bg-success",
              d === "dupe" && "bg-warning-strong",
            )}
          />
        ))}
      </div>
    </button>
  );
}
