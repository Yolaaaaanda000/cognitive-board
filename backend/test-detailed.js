/**
 * 详细测试脚本：测试 Gemini 3 Pro Preview 和 Thought Signature
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

console.log('🧪 详细测试 Gemini 3 Pro Preview 和 Thought Signature\n');
console.log('='.repeat(60));

async function testWithHistory() {
  console.log('\n📡 测试 1: 带对话历史的请求...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '请记住：我的名字是测试用户',
        conversationHistory: [
          {
            role: 'user',
            parts: [{ text: '你好' }]
          },
          {
            role: 'model',
            parts: [{ text: '你好！我是 ThinkFlow，很高兴认识你。' }]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    let thoughtSignature = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              console.error('❌ 错误:', data.error);
              return false;
            }
            if (data.chunk) {
              fullResponse += data.chunk;
            }
            if (data.thoughtSignature) {
              thoughtSignature = data.thoughtSignature;
              console.log('✅ 收到 Thought Signature:', thoughtSignature.substring(0, 50) + '...');
            }
            if (data.done) {
              console.log('✅ 响应完成');
              console.log('📝 响应内容:', fullResponse.substring(0, 200));
              if (thoughtSignature) {
                console.log('✅ Thought Signature 功能正常');
                return { success: true, thoughtSignature };
              }
              return { success: true, thoughtSignature: null };
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return { success: true, thoughtSignature };
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

async function testWithThoughtSignature(thoughtSignature) {
  if (!thoughtSignature) {
    console.log('\n⏭️  跳过 Thought Signature 测试（未收到）');
    return true;
  }

  console.log('\n📡 测试 2: 使用 Thought Signature 的后续请求...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '你还记得我的名字吗？',
        thoughtSignature: thoughtSignature
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              console.error('❌ 错误:', data.error);
              return false;
            }
            if (data.chunk) {
              fullResponse += data.chunk;
            }
            if (data.done) {
              console.log('✅ 响应完成');
              console.log('📝 响应内容:', fullResponse);
              if (fullResponse.includes('测试用户')) {
                console.log('✅ 上下文连续性验证成功！模型记住了之前的对话');
              }
              return true;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

async function runDetailedTests() {
  console.log('开始详细测试...\n');
  
  // 测试 1: 带对话历史的请求
  const result1 = await testWithHistory();
  
  if (!result1.success) {
    console.log('\n❌ 测试 1 失败，无法继续');
    return;
  }

  // 测试 2: 使用 Thought Signature
  if (result1.thoughtSignature) {
    await testWithThoughtSignature(result1.thoughtSignature);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 详细测试完成');
}

runDetailedTests().catch(console.error);

