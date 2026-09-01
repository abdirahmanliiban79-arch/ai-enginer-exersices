"use client"

import { useState } from "react";
import {
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "./types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  collapsed: boolean;
  user: { name?: string | null; email?: string | null; image?: string | null };
  onToggleCollapse: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MAX_TITLE_LENGTH = 60;

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfPrevious7Days = new Date(startOfToday);
  startOfPrevious7Days.setDate(startOfToday.getDate() - 7);

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const buckets: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conversation of sorted) {
    const time = new Date(conversation.updatedAt).getTime();
    if (time >= startOfToday.getTime()) buckets[0].items.push(conversation);
    else if (time >= startOfYesterday.getTime()) buckets[1].items.push(conversation);
    else if (time >= startOfPrevious7Days.getTime()) buckets[2].items.push(conversation);
    else buckets[3].items.push(conversation);
  }

  return buckets.filter((bucket) => bucket.items.length > 0);
}

interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ConversationItem({
  conversation,
  active,
  collapsed,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const [confirming, setConfirming] = useState(false);

  const commitRename = async () => {
    const title = draft.trim();
    setEditing(false);
    if (!title || title === conversation.title) return;
    const nextTitle = title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH)}…` : title;
    await onRename(conversation.id, nextTitle);
  };

  if (collapsed) {
    return (
      <button
        type="button"
        title={conversation.title}
        onClick={() => onSelect(conversation.id)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          active && "bg-muted text-foreground"
        )}
      >
        <MessageSquare className="size-4" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg text-sm transition-colors",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-8 w-full rounded-lg border border-ring bg-background px-2.5 text-sm focus:outline-none"
        />
      ) : confirming ? (
        <div className="flex h-8 w-full items-center justify-between gap-1 px-2">
          <span className="truncate text-xs text-muted-foreground">Delete conversation?</span>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              title="Confirm delete"
              onClick={() => onDelete(conversation.id)}
              className="rounded p-1 text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              title="Cancel"
              onClick={() => setConfirming(false)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onSelect(conversation.id)}
            className="flex h-8 min-w-0 flex-1 items-center gap-2 px-2.5 text-left"
          >
            <MessageSquare className="size-3.5 shrink-0" />
            <span className="truncate">{conversation.title}</span>
          </button>
          <div className="absolute right-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              title="Rename"
              onClick={() => {
                setDraft(conversation.title);
                setEditing(true);
              }}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              title="Delete"
              onClick={() => setConfirming(true)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar({
  conversations,
  activeId,
  collapsed,
  user,
  onToggleCollapse,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
}: SidebarProps) {
  const groups = groupConversations(conversations);

  return (
    <aside
      className={cn(
        "z-40 flex h-full shrink-0 flex-col border-r border-border bg-background transition-[width,transform] duration-200",
        collapsed ? "w-16" : "w-72",
        collapsed ? "hidden md:flex" : "fixed inset-y-0 left-0 md:static"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-border",
          collapsed ? "justify-center p-2" : "justify-between gap-1 p-3"
        )}
      >
        {collapsed ? (
          <button
            type="button"
            title="New chat"
            onClick={onNewChat}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-5" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onNewChat}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <Plus className="size-4" />
              New Chat
            </button>
            <button
              type="button"
              title="Collapse sidebar"
              onClick={onToggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        {groups.length === 0 && !collapsed && (
          <p className="px-2.5 pt-2 text-sm text-muted-foreground">No conversations yet.</p>
        )}
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1 px-2.5 text-xs font-medium text-muted-foreground">{group.label}</p>
            )}
            <div className={cn(collapsed && "flex flex-col items-center gap-1")}>
              {group.items.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeId}
                  collapsed={collapsed}
                  onSelect={onSelect}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 border-t border-border", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar size="sm">
              {user.image ? <AvatarImage src={user.image} /> : null}
              <AvatarFallback className="bg-muted text-foreground">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              title="Expand sidebar"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeft className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar size="lg">
              {user.image ? <AvatarImage src={user.image} /> : null}
              <AvatarFallback className="bg-muted text-foreground">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name || "User"}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Connected
              </p>
            </div>
            <button
              type="button"
              title="Collapse sidebar"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}