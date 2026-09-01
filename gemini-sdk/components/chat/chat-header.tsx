"use client"

import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title: string;
  isStreaming: boolean;
  onToggleSidebar: () => void;
  onBack: () => void;
}

export function ChatHeader({ title, isStreaming, onToggleSidebar, onBack }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          title="Toggle sidebar"
          onClick={onToggleSidebar}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="size-4" />
        </button>
        <h1 className="truncate text-sm font-medium">{title}</h1>
        <span className="hidden shrink-0 items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex">
          <Sparkles className="size-3" />
          Gemini 3.5 Flash
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              isStreaming ? "animate-pulse bg-amber-500" : "bg-emerald-500"
            )}
          />
          {isStreaming ? "Streaming…" : "Connected"}
        </span>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          Back to Dashboard
        </Button>
      </div>
    </header>
  );
}