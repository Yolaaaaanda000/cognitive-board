import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants.js";

let chatSession: Chat | null = null;

// 直接设置代理（硬编码在代码中）
// 如果需要修改代理地址，请直接修改下面的代理配置
// 
// ⚠️ 待解决问题：虽然代理配置已设置，但 GoogleGenAI SDK 仍无法通过代理连接
// 详细问题记录请查看：files/代理连接问题记录.md
const HTTPS_PROXY = 'http://127.0.0.1:8118';
const HTTP_PROXY = 'http://127.0.0.1:8118';
const ALL_PROXY = 'socks5://127.0.0.1:8119';

// 设置代理环境变量（Node.js 的 fetch 会自动使用这些变量）
process.env.HTTPS_PROXY = HTTPS_PROXY;
process.env.HTTP_PROXY = HTTP_PROXY;
process.env.ALL_PROXY = ALL_PROXY;

console.log('代理设置已启用:', {
  HTTPS_PROXY,
  HTTP_PROXY,
  ALL_PROXY
});

const getAiClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
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
      temperature: 0.1,
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
  // 检查 API 密钥
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY 或 GEMINI_API_KEY 环境变量未设置。请检查 .env 文件。");
  }

  if (!chatSession) {
    try {
      await initializeChat();
    } catch (initError) {
      console.error("初始化聊天会话失败:", initError);
      throw new Error(`初始化失败: ${initError instanceof Error ? initError.message : String(initError)}`);
    }
  }
  
  if (!chatSession) {
     throw new Error("聊天会话初始化失败，chatSession 为 null。");
  }

  try {
    console.log("开始发送流式消息到 Gemini...");
    const streamResult = await chatSession.sendMessageStream({ message });
    
    for await (const chunk of streamResult) {
      // 检查 chunk 和 chunk.text 是否存在
      if (!chunk) {
        console.warn("收到空的 chunk，跳过");
        continue;
      }
      
      if (chunk.text === undefined || chunk.text === null) {
        console.warn("chunk.text 不存在，chunk 内容:", chunk);
        // 尝试使用其他可能的字段
        if (typeof chunk === 'string') {
          yield chunk;
        } else {
          // 跳过无效的 chunk
          continue;
        }
      } else {
        yield chunk.text;
      }
    }
    console.log("流式消息处理完成");
  } catch (error) {
    console.error("流处理错误详情:", error);
    
    // 提供更详细的错误信息
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      const errorName = error.name || '';
      
      // 检查是否是 fetch 失败错误（网络连接问题）
      if (errorMsg.includes('fetch failed') || 
          errorMsg.includes('network') || 
          errorMsg.includes('econnrefused') || 
          errorMsg.includes('enotfound') ||
          errorMsg.includes('timeout') ||
          errorMsg.includes('econnreset') ||
          errorName === 'TypeError' && errorMsg.includes('fetch')) {
        
        let diagnosticMsg = "无法连接到 Gemini API 服务器。";
        diagnosticMsg += `\n当前代理设置:`;
        diagnosticMsg += `\n  HTTPS_PROXY: ${HTTPS_PROXY}`;
        diagnosticMsg += `\n  HTTP_PROXY: ${HTTP_PROXY}`;
        diagnosticMsg += `\n  ALL_PROXY: ${ALL_PROXY}`;
        diagnosticMsg += "\n\n可能的原因：";
        diagnosticMsg += "\n1. 代理服务器未运行 - 请检查代理软件（如 V2Ray、Clash）是否正在运行";
        diagnosticMsg += `\n2. 代理地址或端口错误 - 确认 HTTP 代理监听在 ${HTTPS_PROXY}，SOCKS5 代理监听在 ${ALL_PROXY}`;
        diagnosticMsg += "\n3. 代理需要认证但未配置 - 如果代理需要用户名密码，请修改代码中的代理配置";
        diagnosticMsg += "\n4. SSL/TLS 证书验证失败 - 某些代理可能需要禁用证书验证";
        diagnosticMsg += "\n\n排查步骤：";
        diagnosticMsg += "\n1. 测试 HTTP 代理是否可用（在终端运行以下命令）:";
        diagnosticMsg += `\n   curl -x "${HTTPS_PROXY}" https://www.google.com`;
        diagnosticMsg += "\n2. 测试 SOCKS5 代理是否可用:";
        diagnosticMsg += `\n   curl --socks5-hostname "${ALL_PROXY.replace('socks5://', '')}" https://www.google.com`;
        diagnosticMsg += "\n3. 检查代理软件日志，查看是否有错误";
        diagnosticMsg += "\n4. 确认代理软件允许本地连接";
        diagnosticMsg += "\n5. 如果代理地址不同，请修改代码中的代理配置常量";
        
        diagnosticMsg += "\n\n建议：";
        diagnosticMsg += "\n- 检查网络连接是否正常（可以尝试 ping google.com）";
        diagnosticMsg += "\n- 如果使用代理，请检查代理配置是否正确";
        diagnosticMsg += "\n- 确认代理服务器可以访问（如果配置了代理）";
        diagnosticMsg += "\n- 检查防火墙设置，确保允许 HTTPS 连接";
        diagnosticMsg += `\n- 查看后端控制台的详细错误信息: ${error.message}`;
        diagnosticMsg += "\n- 如果在中国大陆，可能需要配置代理才能访问 Google API";
        
        throw new Error(diagnosticMsg);
      }
      
      // 检查是否是 API 密钥相关错误
      if (errorMsg.includes('api key') || errorMsg.includes('authentication') || errorMsg.includes('unauthorized')) {
        throw new Error("API 密钥无效或已过期。请检查环境变量中的 API_KEY 或 GEMINI_API_KEY。");
      }
      
      // 检查是否是模型相关错误
      if (errorMsg.includes('model') || errorMsg.includes('not found') || errorMsg.includes('invalid model')) {
        throw new Error(`模型错误: ${error.message}。请检查模型名称是否正确（当前使用: gemini-2.5-flash）。`);
      }
      
      // 检查是否是 SSL/TLS 错误
      if (errorMsg.includes('certificate') || errorMsg.includes('ssl') || errorMsg.includes('tls')) {
        throw new Error(`SSL/TLS 错误: ${error.message}。可能是证书验证失败，请检查代理或网络配置。`);
      }
    }
    
    // 如果无法识别错误类型，返回原始错误信息
    throw new Error(`流处理失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

