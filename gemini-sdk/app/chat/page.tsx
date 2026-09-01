"use server"

import { auth } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { getUserInfo } from "../server/user"
import { createConversation } from "../lib/chat"

const NewchatPage = async () => {
    // get the auth user

    const user = await getUserInfo();
    
    if(!user){
        redirect("/signup")
    }

    // create new chat

    // create new conversation

    const conversationId = await createConversation(user.user.id)

    redirect(`/chat/${conversationId}`);
    
    return (
        <div>
            <h1>Chat</h1>
        </div>
    )
}

export default NewchatPage