import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // 设置代理环境变量（如果 .env 文件中有配置）
    if (env.HTTPS_PROXY) process.env.HTTPS_PROXY = env.HTTPS_PROXY;
    if (env.HTTP_PROXY) process.env.HTTP_PROXY = env.HTTP_PROXY;
    if (env.ALL_PROXY) process.env.ALL_PROXY = env.ALL_PROXY;
    
    return {
      server: {
        port: 3002,
        host: '0.0.0.0',
        strictPort: false, // 如果端口被占用，自动尝试其他端口
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.HTTPS_PROXY': JSON.stringify(env.HTTPS_PROXY || ''),
        'process.env.HTTP_PROXY': JSON.stringify(env.HTTP_PROXY || ''),
        'process.env.ALL_PROXY': JSON.stringify(env.ALL_PROXY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});