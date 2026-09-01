"use client"

import { useEffect, useRef } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
}

const MAX_HEIGHT = 200;

export function ChatInput({ value, onChange, onSend, onStop, isStreaming }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const canSend = value.trim().length > 0;

  return (
    <div className="shrink-0 px-4 pb-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="mx-auto w-full max-w-3xl"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm transition-all focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/20">
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Message Gemini..."
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          {isStreaming ? (
            <button
              type="button"
              title="Stop generating"
              onClick={onStop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Square className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              title="Send message"
              disabled={!canSend}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              )}
            >
              <Send className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Gemini can make mistakes. Check important information.
        </p>
      </form>
    </div>
  );
}