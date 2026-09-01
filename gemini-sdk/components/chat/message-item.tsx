"use client"

import { useState } from "react";
import { UIMessage } from "ai";
import { Bot, Check, Copy, RotateCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Streamdown } from "streamdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type Rating = "up" | "down";

interface MessageItemProps {
  message: UIMessage;
  user: { name?: string | null; image?: string | null };
  isStreaming: boolean;
  isLastAssistant: boolean;
  canRegenerate: boolean;
  rating?: Rating;
  onRate: (id: string, rating: Rating) => void;
  onRegenerate: () => void;
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
}

function IconButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active && "bg-muted text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function AssistantMessage({
  message,
  isStreaming,
  isLastAssistant,
  canRegenerate,
  rating,
  onRate,
  onRegenerate,
}: {
  message: UIMessage;
  isStreaming: boolean;
  isLastAssistant: boolean;
  canRegenerate: boolean;
  rating?: Rating;
  onRate: (id: string, rating: Rating) => void;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = messageText(message);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group/msg flex gap-3">
      <Avatar size="sm" className="mt-1 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
          {message.parts.map((part, i) => {
            if (part.type !== "text") return null;
            return (
              <Streamdown key={i} className="break-words text-[0.925rem] leading-relaxed">
                {part.text}
              </Streamdown>
            );
          })}
          {isStreaming && isLastAssistant && (
            <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-foreground/60 align-middle" />
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100">
          <IconButton title="Copy" onClick={handleCopy}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </IconButton>
          <IconButton title="Regenerate" disabled={!canRegenerate || isStreaming} onClick={onRegenerate}>
            <RotateCw className="size-3.5" />
          </IconButton>
          <IconButton
            title="Good response"
            active={rating === "up"}
            onClick={() => onRate(message.id, "up")}
          >
            <ThumbsUp className="size-3.5" />
          </IconButton>
          <IconButton
            title="Bad response"
            active={rating === "down"}
            onClick={() => onRate(message.id, "down")}
          >
            <ThumbsDown className="size-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export function MessageItem({
  message,
  user,
  isStreaming,
  isLastAssistant,
  canRegenerate,
  rating,
  onRate,
  onRegenerate,
}: MessageItemProps) {
  if (message.role === "assistant") {
    return (
      <AssistantMessage
        message={message}
        isStreaming={isStreaming}
        isLastAssistant={isLastAssistant}
        canRegenerate={canRegenerate}
        rating={rating}
        onRate={onRate}
        onRegenerate={onRegenerate}
      />
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-start gap-3">
          <div className="rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            <span className="whitespace-pre-wrap break-words">{messageText(message)}</span>
          </div>
          <Avatar size="sm" className="mt-0.5 shrink-0">
            {user.image ? <AvatarImage src={user.image} /> : null}
            <AvatarFallback className="bg-muted text-foreground">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }

  return null;
}