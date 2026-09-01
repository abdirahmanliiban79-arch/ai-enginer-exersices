"use client"

import { DefaultChatTransport, UIMessage } from "ai"
import { useChat } from "@ai-sdk/react";
import { useSession } from "../app/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./chat/sidebar";
import { ChatHeader } from "./chat/chat-header";
import { MessageItem, type Rating } from "./chat/message-item";
import { WelcomeScreen } from "./chat/welcome-screen";
import { ChatInput } from "./chat/chat-input";
import type { Conversation } from "./chat/types";
import {
    deleteConversationAction,
    renameConversationAction,
} from "@/app/server/conversation-actions";

const MAX_TITLE_LENGTH = 60;

interface ChatPageProps {
    initialMessages?: UIMessage[];
    conversationTitle?: string;
    conversationId: string;
    conversations: Conversation[];
}

const Chat = ({ initialMessages, conversationId, conversationTitle, conversations: initialConversations }: ChatPageProps) => {
    const { data: session } = useSession();
    const router = useRouter();
    const [input, setInput] = useState("");
    const [collapsed, setCollapsed] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [ratings, setRatings] = useState<Record<string, Rating>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeTitle = conversations.find((c) => c.id === conversationId)?.title ?? conversationTitle ?? "New Chat";

    const { messages, sendMessage, status, error, stop, clearError, regenerate } = useChat({
        id: conversationId,
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest: ({ messages }) => {
                return {
                    body: {
                        messages,
                        id: conversationId,
                        title: activeTitle,
                    }
                }
            }
        })
    });

    const isStreaming = status === "submitted" || status === "streaming";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isStreaming]);

    if (!session) {
        return null
    }

    const titleFromText = (text: string) =>
        text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH)}…` : text;

    const updateActiveTitleOptimistically = (text: string) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === conversationId && c.title === "New Conversation"
                    ? { ...c, title: titleFromText(text) }
                    : c
            )
        );
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text || isStreaming) return;
        setInput("");
        updateActiveTitleOptimistically(text);
        sendMessage({ text });
    };

    const handlePick = (prompt: string) => {
        if (isStreaming) return;
        updateActiveTitleOptimistically(prompt);
        sendMessage({ text: prompt });
    };

    const handleStop = () => {
        stop();
    };

    const handleRegenerate = () => {
        if (isStreaming) return;
        clearError();
        regenerate();
    };

    const handleRename = async (id: string, title: string) => {
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
        await renameConversationAction(id, title);
    };

    const handleDelete = async (id: string) => {
        await deleteConversationAction(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (id === conversationId) {
            router.push("/chat");
        }
    };

    const handleRate = (id: string, rating: Rating) => {
        setRatings((prev) => {
            const next = { ...prev };
            if (prev[id] === rating) delete next[id];
            else next[id] = rating;
            return next;
        });
    };

    const lastMessage = messages[messages.length - 1];
    const isAssistantStreaming = isStreaming && lastMessage?.role === "assistant";
    const canRegenerate = messages.some((m) => m.role === "user");

    return (
        <div className="flex h-screen overflow-hidden bg-muted/30 text-foreground">
            {!collapsed && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}

            <Sidebar
                conversations={conversations}
                activeId={conversationId}
                collapsed={collapsed}
                user={{
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                }}
                onToggleCollapse={() => setCollapsed((c) => !c)}
                onSelect={(id) => router.push(`/chat/${id}`)}
                onNewChat={() => router.push("/chat")}
                onRename={handleRename}
                onDelete={handleDelete}
            />

            <main className="flex h-full min-w-0 flex-1 flex-col">
                <ChatHeader
                    title={activeTitle}
                    isStreaming={isStreaming}
                    onToggleSidebar={() => setCollapsed((c) => !c)}
                    onBack={() => router.push("/dashboard")}
                />

                <div className="relative flex-1 overflow-y-auto">
                    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6">
                        {messages.length === 0 ? (
                            <WelcomeScreen onPick={handlePick} />
                        ) : (
                            <div className="space-y-6">
                                {messages.map((message, index) => (
                                    <MessageItem
                                        key={message.id}
                                        message={message}
                                        user={{
                                            name: session.user.name,
                                            image: session.user.image,
                                        }}
                                        isStreaming={isStreaming}
                                        isLastAssistant={
                                            index === messages.length - 1 && message.role === "assistant"
                                        }
                                        canRegenerate={canRegenerate}
                                        rating={ratings[message.id]}
                                        onRate={handleRate}
                                        onRegenerate={handleRegenerate}
                                    />
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="mx-auto mt-4 flex w-full max-w-3xl items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                                <span className="min-w-0 flex-1">{error.message}</span>
                                <button
                                    type="button"
                                    onClick={clearError}
                                    className="ml-4 shrink-0 text-xs font-medium underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <ChatInput
                    value={input}
                    onChange={setInput}
                    onSend={handleSend}
                    onStop={handleStop}
                    isStreaming={isAssistantStreaming || isStreaming}
                />
            </main>
        </div>
    )
}



export default Chat