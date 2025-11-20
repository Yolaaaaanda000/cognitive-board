import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 【关键】必须先加载环境变量，再导入其他模块
dotenv.config();

// 导入路由（此时环境变量已经加载）
import geminiRoutes from './routes/gemini.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 根路径 - API 信息
app.get('/', (req, res) => {
  res.json({
    name: 'Cognitive Board Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      stream: '/api/gemini/stream'
    },
    timestamp: new Date().toISOString()
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/gemini', geminiRoutes);

// 404 处理 - 必须在所有路由之后
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `请求的路径 ${req.path} 不存在`,
    availableEndpoints: {
      root: '/',
      health: '/health',
      stream: '/api/gemini/stream'
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/gemini/stream`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

