"use server"

import { getUserInfo } from "./user"
import {
    deleteConversation as deleteConversationRecord,
    renameConversation as renameConversationRecord,
} from "@/app/lib/chat"

// rename a conversation owned by the current user

export async function renameConversationAction(conversationId: string, title: string) {
    const user = await getUserInfo()
    if (!user) return

    const trimmed = title.trim()
    if (!trimmed) return

    await renameConversationRecord(conversationId, user.user.id, trimmed)
}

// delete a conversation owned by the current user

export async function deleteConversationAction(conversationId: string) {
    const user = await getUserInfo()
    if (!user) return

    await deleteConversationRecord(conversationId, user.user.id)
}