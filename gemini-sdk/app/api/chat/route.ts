import { google } from '@ai-sdk/google';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from 'ai';
import { getConversation, saveChat, updateConversationTitle } from '@/app/lib/chat';

const DEFAULT_TITLE = "New Conversation";
const MAX_TITLE_LENGTH = 60;

export async function POST(req: Request) {
  try {
    const {
      messages,
      id,
    }: {
      messages: UIMessage[];
      id?: string;
      title?: string;
    } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    // Save user's incoming message to the database if id is provided
    if (id) {
      try {
        await saveChat({ chatId: id, messages });

        // auto-title a fresh conversation from the first user message
        const conversation = await getConversation(id);
        if (conversation && conversation.title === DEFAULT_TITLE) {
          const firstUserText = messages
            .find((m) => m.role === "user")
            ?.parts.find((p) => p.type === "text" && "text" in p && p.text.trim());

          if (firstUserText && "text" in firstUserText) {
            const text = firstUserText.text.trim();
            const title = text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH)}…` : text;
            await updateConversationTitle(id, title);
          }
        }
      } catch (err) {
        console.error("Failed to save initial chat messages:", err);
      }
    }

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: google('gemini-3.5-flash'),
      messages: modelMessages,
      onFinish: async ({ text }) => {
        if (id && text) {
          try {
            await saveChat({
              chatId: id,
              messages: [
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  parts: [{ type: 'text', text }],
                },
              ],
            });
          } catch (err) {
            console.error("Failed to save assistant response:", err);
          }
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}