// create a conversation for a user 

import { nanoid } from "nanoid";
import { db } from "@/app/db/drizzle";
import { and, eq, desc } from "drizzle-orm";
import { conversation } from "@/app/db/schema";

export async function createConversation(userId: string , title? : string) {
   const conversationId = nanoid();
   await db.insert(conversation).values({
    id: conversationId,
    userId,
    title:title || "New Conversation"
   })
   
   return conversationId;
}

// get conversation 

export async function getUserConversations(userId:string){
    return await db.select().from(conversation).where(eq(conversation.userId,userId)).orderBy(desc(conversation.createdAt))
}

// getuserconversation by id

export async function getUserConversationById(conversationId:string,userId:string){
    const result = await db.select()
    .from(conversation)
    .where(eq(conversation.id,conversationId))
    // .where(eq(conversation.userId,userId))
    .limit(1)

   const cov = result[0];

   if(!cov || cov.userId !== userId) {
    return null;
   }

   return cov;
}

// get a single conversation regardless of owner (used by the chat API route)

export async function getConversation(conversationId: string) {
    const result = await db.select()
        .from(conversation)
        .where(eq(conversation.id, conversationId))
        .limit(1)

    return result[0] ?? null;
}

// rename a conversation owned by the user

export async function renameConversation(conversationId: string, userId: string, title: string) {
    await db.update(conversation)
        .set({ title })
        .where(and(eq(conversation.id, conversationId), eq(conversation.userId, userId)))
}

// set the title regardless of owner (used to auto-title new conversations)

export async function updateConversationTitle(conversationId: string, title: string) {
    await db.update(conversation)
        .set({ title })
        .where(eq(conversation.id, conversationId))
}

// delete a conversation owned by the user

export async function deleteConversation(conversationId: string, userId: string) {
    await db.delete(conversation)
        .where(and(eq(conversation.id, conversationId), eq(conversation.userId, userId)))
}