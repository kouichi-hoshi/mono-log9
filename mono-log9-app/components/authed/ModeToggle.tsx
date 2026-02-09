"use client";

import { useState } from "react";

import { notifyNotImplemented } from "@/components/authed/notImplemented";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "メモ" | "ノート";

export default function ModeToggle() {
  const [mode, setMode] = useState<Mode>("メモ");

  const handleSelect = (nextMode: Mode) => {
    setMode(nextMode);
    notifyNotImplemented(`${nextMode}モードに切替`);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground/70">モード切替</p>
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-foreground/10 bg-background/60 p-1">
        {(["メモ", "ノート"] as const).map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={mode === item ? "default" : "ghost"}
            className={cn("h-9", mode !== item && "text-foreground/70")}
            onClick={() => handleSelect(item)}
          >
            {item}
          </Button>
        ))}
      </div>
    </div>
  );
}
