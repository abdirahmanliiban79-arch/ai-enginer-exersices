"use server"
import { getUserConversationById, getUserConversations, loadChat } from "@/app/lib/chat";
import { getUserInfo } from "@/app/server/user";
import Chat from "@/components/chat";
import { redirect } from "next/navigation";

interface pageProp{
    params: Promise<{id:string}>;
    
}

const ChatPage = async ({params}:pageProp) =>{
    
    const {id} = await params;
    const user = await getUserInfo()

    if(!user){
        redirect("/signup")
    }

    // validate the conversation
    const conversation = await getUserConversationById(id,user.user.id)

    if(!conversation){
        redirect("/chat")
    }

    const [initialMessages, conversations] = await Promise.all([
        loadChat(id),
        getUserConversations(user.user.id),
    ])

return(
    <Chat
        key={id}
        initialMessages={initialMessages}
        conversationId={id}
        conversationTitle={conversation.title}
        conversations={conversations.map((c) => ({
            id: c.id,
            title: c.title,
            createdAt: new Date(c.createdAt).toISOString(),
            updatedAt: new Date(c.updatedAt).toISOString(),
        }))}
    />
)
}

export default ChatPage 