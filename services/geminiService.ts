import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChat = async () => {
  const ai = getAiClient();
  if (!ai) throw new Error("AI Client not initialized");

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (message: string) => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session.");
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};

export const sendMessageStreamToGemini = async function* (message: string) {
  if (!chatSession) {
    await initializeChat();
  }
  
  if (!chatSession) {
     throw new Error("Failed to initialize chat session.");
  }

  try {
    const streamResult = await chatSession.sendMessageStream({ message });
    for await (const chunk of streamResult) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error in stream:", error);
    throw error;
  }
}
