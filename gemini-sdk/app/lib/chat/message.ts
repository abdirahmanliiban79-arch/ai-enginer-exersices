import { UIMessage } from "ai";
import { db } from "@/app/db/drizzle";
import { eq, asc } from "drizzle-orm";
import { conversation, message } from "@/app/db/schema";
import { nanoid } from "nanoid";

// load messages for specific conversation
export async function loadChat(conversationId: string): Promise<UIMessage[]> {
    const messages = await db
        .select()
        .from(message)
        .where(eq(message.conversationId, conversationId))
        .orderBy(asc(message.createdAt));

    return messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        parts: [{ type: "text" as const, text: m.content }],
    }));
}

// save chat to database
export const saveChat = async ({
    chatId,
    messages,
}: {
    chatId: string;
    messages: UIMessage[];
}): Promise<void> => {
    // get conversation to check existence and owner
    const conv = await db
        .select({ userId: conversation.userId })
        .from(conversation)
        .where(eq(conversation.id, chatId))
        .limit(1);

    if (conv.length === 0) {
        throw new Error("Conversation not found");
    }

    const userId = conv[0].userId;

    // get existing message IDs to avoid duplicates
    const existingMessages = await db
        .select({ id: message.id })
        .from(message)
        .where(eq(message.conversationId, chatId));

    const existingMessageIds = new Set(existingMessages.map((m) => m.id));

    // only save new messages
    const newMessages = messages.filter((m) => m.id && !existingMessageIds.has(m.id));

    if (newMessages.length > 0) {
        // transform messages to database format
        const messageData = newMessages
            .map((m) => {
                const textPart = m.parts?.find((p) => p.type === "text");
                const content = textPart && "text" in textPart ? (textPart.text as string) : "";

                return {
                    id: m.id || nanoid(),
                    content,
                    role: m.role,
                    conversationId: chatId,
                    userId,
                };
            })
            .filter((m) => m.content.trim().length > 0);

        if (messageData.length > 0) {
            await db.insert(message).values(messageData);
        }
    }

    // update the conversation timestamp
    await db
        .update(conversation)
        .set({
            updatedAt: new Date(),
        })
        .where(eq(conversation.id, chatId));
};