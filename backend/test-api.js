/**
 * 测试脚本：测试 Gemini API 和 Supabase 数据存储
 * 
 * 使用方法：
 * 1. 确保后端服务正在运行（npm run dev）
 * 2. 在 backend 目录下运行：node test-api.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

console.log('🧪 开始测试...\n');
console.log('API 基础 URL:', API_BASE_URL);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('');

// 测试 1: 测试 Gemini API
async function testGeminiAPI() {
  console.log('📡 测试 1: Gemini API 连接...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, please respond with "API test successful"',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ API 连接成功');
    console.log('📥 接收流式响应...');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let receivedChunks = 0;
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
              throw new Error(data.error);
            }
            if (data.chunk) {
              receivedChunks++;
              fullResponse += data.chunk;
              process.stdout.write('.');
            }
            if (data.done) {
              console.log('\n✅ 流式响应接收完成');
              console.log(`📊 收到 ${receivedChunks} 个数据块`);
              console.log(`📝 响应内容预览: ${fullResponse.substring(0, 100)}...`);
              return true;
            }
          } catch (parseError) {
            // 忽略解析错误，继续处理
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Gemini API 测试失败:', error.message);
    if (error.message.includes('fetch failed')) {
      console.error('   请确保后端服务正在运行: npm run dev');
    }
    return false;
  }
}

// 测试 2: 测试 Supabase 连接（通过前端 API）
async function testSupabaseConnection() {
  console.log('\n🗄️  测试 2: Supabase 连接...');
  console.log('   注意: 此测试需要前端环境变量配置');
  console.log('   请在前端浏览器控制台检查 Supabase 配置状态');
  console.log('   或在浏览器中打开应用并检查控制台输出');
  return true;
}

// 运行所有测试
async function runTests() {
  const results = {
    gemini: false,
    supabase: false,
  };

  // 测试 Gemini API
  results.gemini = await testGeminiAPI();
  
  // Supabase 测试提示
  await testSupabaseConnection();

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结:');
  console.log('='.repeat(50));
  console.log(`Gemini API:     ${results.gemini ? '✅ 通过' : '❌ 失败'}`);
  console.log(`Supabase:       ℹ️  请在浏览器中测试`);
  console.log('='.repeat(50));
  
  if (results.gemini) {
    console.log('\n✅ Gemini API 测试通过！');
    console.log('💡 提示: 在浏览器中打开应用测试 Supabase 数据存储功能');
  } else {
    console.log('\n❌ 部分测试失败，请检查：');
    console.log('   1. 后端服务是否运行: npm run dev (在 backend 目录)');
    console.log('   2. GEMINI_API_KEY 是否正确设置');
    console.log('   3. 网络连接是否正常');
  }
}

runTests().catch(console.error);

