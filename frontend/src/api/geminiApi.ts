// 前端 API 客户端
// 在开发环境中，使用 Vite 代理（相对路径）
// 在生产环境中，使用完整 URL 或环境变量配置的 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '' : 'http://localhost:3001');

export const sendMessageStreamToGemini = async function* (
  message: string,
  conversationHistory?: Array<{role: string, parts: Array<{text: string}>}>,
  thoughtSignature?: string,
  abortSignal?: AbortSignal
) {
  const response = await fetch(`${API_BASE_URL}/api/gemini/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message,
      conversationHistory,
      thoughtSignature
    }),
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  let buffer = '';

  while (true) {
    // Check if aborted
    if (abortSignal?.aborted) {
      reader.cancel();
      break;
    }
    
    const { done, value } = await reader.read();
    
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        let data: any;
        try {
          data = JSON.parse(jsonStr);
        } catch (parseError) {
          // JSON 解析错误，只记录日志但继续处理
          console.error('Error parsing SSE JSON:', parseError, 'Line:', jsonStr);
          continue;
        }
        
        // 检查服务器返回的错误
        if (data.error) {
          // 服务器返回的错误，需要抛出以停止流处理
          throw new Error(data.error);
        }
        
        if (data.done) {
          // 如果 done 为 true，返回最后的 Thought Signature（如果存在）
          return {
            text: '',
            thoughtSignature: data.thoughtSignature,
            done: true
          };
        }
        
        // 返回文本块和 Thought Signature
        if (data.chunk || data.thoughtSignature) {
          yield {
            text: data.chunk || '',
            thoughtSignature: data.thoughtSignature,
            done: false
          };
        }
      }
    }
  }

  // 处理剩余的 buffer
  if (buffer) {
    const lines = buffer.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        let data: any;
        try {
          data = JSON.parse(jsonStr);
        } catch (parseError) {
          // JSON 解析错误，只记录日志但继续处理
          console.error('Error parsing SSE JSON:', parseError, 'Line:', jsonStr);
          continue;
        }
        
        // 检查服务器返回的错误
        if (data.error) {
          // 服务器返回的错误，需要抛出以停止流处理
          throw new Error(data.error);
        }
        
        // 返回文本块和 Thought Signature
        if (data.chunk || data.thoughtSignature) {
          yield {
            text: data.chunk || '',
            thoughtSignature: data.thoughtSignature,
            done: false
          };
        }
      }
    }
  }
};

