import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants.js";
// @ts-ignore - undici is built-in Node.js 18+ module
import { setGlobalDispatcher, ProxyAgent } from 'undici';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 确保环境变量已加载（防止导入顺序问题）
// 获取当前文件的目录路径（ESM 模块需要）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件（指定路径以确保正确加载）
const envPath = join(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

// 调试：检查 .env 文件是否加载成功
if (result.error) {
  console.warn('⚠️ 加载 .env 文件失败:', result.error.message);
  console.warn('⚠️ 尝试使用默认路径...');
  // 如果指定路径失败，尝试默认路径
  dotenv.config();
} else {
  console.log('✅ .env 文件加载成功');
}

// 辅助函数：隐藏密码（安全考虑）
const maskUrl = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.password) {
      u.password = '******';
    }
    return u.toString();
  } catch {
    return url; // 如果不是标准URL格式，原样返回
  }
};

// 从环境变量读取代理配置（支持小写和大写）
// 调试：打印所有代理相关的环境变量
console.log('🔍 环境变量检查:', {
  'HTTPS_PROXY': process.env.HTTPS_PROXY || '(未设置)',
  'https_proxy': process.env.https_proxy || '(未设置)',
  'HTTP_PROXY': process.env.HTTP_PROXY || '(未设置)',
  'http_proxy': process.env.http_proxy || '(未设置)',
});

const proxyUrl = process.env.HTTPS_PROXY || 
                 process.env.https_proxy || 
                 process.env.HTTP_PROXY || 
                 process.env.http_proxy || 
                 '';

// 配置代理（关键步骤）
if (proxyUrl) {
  // 设置环境变量（为了兼容 Axios 等其他可能使用的库）
  process.env.HTTPS_PROXY = proxyUrl;
  process.env.HTTP_PROXY = proxyUrl;
  
  // 【关键】配置 Node.js 原生 fetch 的代理
  // Gemini SDK 使用原生 fetch，必须通过这种方式注入代理
  try {
    const dispatcher = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(dispatcher);
    console.log('🔌 Undici Global Dispatcher 已配置为使用代理:', maskUrl(proxyUrl));
  } catch (error) {
    console.error('❌ 配置代理失败:', error);
    console.warn('⚠️ 将尝试直接连接（可能失败）');
  }
} else {
  console.log('ℹ️ 未检测到代理配置，使用直连模式');
  // 注意：不要删除环境变量，可能影响其他库
}

// 获取 AI 客户端（单例模式）
let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (aiClient) {
    return aiClient;
  }

  // 官方 SDK：传入空对象，自动从环境变量 GEMINI_API_KEY 读取
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (apiKey && !process.env.GEMINI_API_KEY) {
    // 如果使用的是 API_KEY，设置 GEMINI_API_KEY 以便 SDK 读取
    process.env.GEMINI_API_KEY = apiKey;
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY 或 API_KEY 环境变量未设置。请检查 .env 文件。");
  }

  aiClient = new GoogleGenAI({});
  return aiClient;
};

// 流式发送消息（官方 SDK 的 API）
export const sendMessageStreamToGemini = async function* (message: string) {
  try {
    console.log("开始发送流式消息到 Gemini...");
    const ai = getAiClient();
    
    // 官方 SDK API: ai.models.generateContentStream()
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    
    // 流式处理响应
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
    console.log("流式消息处理完成");
  } catch (error) {
    console.error("流处理错误详情:", error);
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      const errorName = error.name || '';
      
      // 网络连接错误
      if (errorMsg.includes('fetch failed') || 
          errorMsg.includes('network') || 
          errorMsg.includes('econnrefused') || 
          errorMsg.includes('enotfound') ||
          errorMsg.includes('timeout') ||
          errorMsg.includes('econnreset') ||
          errorName === 'TypeError' && errorMsg.includes('fetch')) {
        
        let diagnosticMsg = "无法连接到 Gemini API 服务器。";
        if (proxyUrl) {
          diagnosticMsg += `\n当前代理设置: ${maskUrl(proxyUrl)}`;
          diagnosticMsg += "\n\n可能的原因：";
          diagnosticMsg += "\n1. 代理服务器未运行 - 请检查代理软件（如 V2Ray、Clash）是否正在运行";
          diagnosticMsg += `\n2. 代理地址或端口错误 - 确认代理监听在 ${maskUrl(proxyUrl)}`;
          diagnosticMsg += "\n3. 代理需要认证但未配置 - 如果代理需要用户名密码，请在 .env 文件中配置";
          diagnosticMsg += "\n4. Undici ProxyAgent 配置失败 - 检查代理 URL 格式是否正确";
        } else {
          diagnosticMsg += "\n未配置代理。";
          diagnosticMsg += "\n\n可能的原因：";
          diagnosticMsg += "\n1. 需要配置代理才能访问 Google API（如果在中国大陆）";
          diagnosticMsg += "\n2. 网络连接问题 - 检查网络连接是否正常";
          diagnosticMsg += "\n3. 防火墙阻止连接 - 检查防火墙设置";
        }
        diagnosticMsg += "\n\n⚠️ SSL/TLS 证书验证失败也可能导致此错误";
        diagnosticMsg += `\n\n详细错误信息: ${error.message}`;
        
        throw new Error(diagnosticMsg);
      }
      
      // API 密钥错误
      if (errorMsg.includes('api key') || errorMsg.includes('authentication') || errorMsg.includes('unauthorized')) {
        throw new Error("API 密钥无效或已过期。请检查环境变量中的 GEMINI_API_KEY 或 API_KEY。");
      }
      
      // 模型错误
      if (errorMsg.includes('model') || errorMsg.includes('not found') || errorMsg.includes('invalid model')) {
        throw new Error(`模型错误: ${error.message}。请检查模型名称是否正确（当前使用: gemini-2.5-flash）。`);
      }
      
      // SSL/TLS 错误
      if (errorMsg.includes('certificate') || errorMsg.includes('ssl') || errorMsg.includes('tls')) {
        throw new Error(`SSL/TLS 错误: ${error.message}。可能是证书验证失败，请检查代理或网络配置。`);
      }
    }
    
    // 如果无法识别错误类型，返回原始错误信息
    throw new Error(`流处理失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 非流式发送消息（如果还需要的话）
export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const ai = getAiClient();
    // 官方 SDK API: ai.models.generateContent()
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    // response.text 可能为 undefined，需要处理
    if (!response.text) {
      throw new Error("API 响应中没有文本内容");
    }
    return response.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};

// 保留旧接口以保持兼容性（如果需要）
export const initializeChat = async () => {
  // 官方 SDK 不需要预先初始化 chat session
  // 这个函数保留只是为了兼容性
  console.warn("initializeChat() is deprecated in official SDK. Model will be initialized on demand.");
  return null;
};
