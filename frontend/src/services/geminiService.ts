import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;

// 设置代理（本地运行时使用，部署时可注释掉）
const setupProxy = () => {
  // 从环境变量读取代理配置
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const allProxy = process.env.ALL_PROXY || process.env.all_proxy;

  if (httpsProxy && !process.env.HTTPS_PROXY) {
    process.env.HTTPS_PROXY = httpsProxy;
  }
  if (httpProxy && !process.env.HTTP_PROXY) {
    process.env.HTTP_PROXY = httpProxy;
  }
  if (allProxy && !process.env.ALL_PROXY) {
    process.env.ALL_PROXY = allProxy;
  }

  // 如果环境变量中有代理配置，设置全局代理
  // Node.js 的 fetch 和 HTTP 客户端会自动使用这些环境变量
  if (httpsProxy || httpProxy || allProxy) {
    console.log('代理设置已启用:', { httpsProxy, httpProxy, allProxy });
  }
};

// 初始化时设置代理
setupProxy();

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
