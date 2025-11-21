// Vercel Serverless Function wrapper for Express backend
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes - need to use dynamic import for Vercel
// @ts-ignore
import geminiRoutes from '../backend/src/routes/gemini.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root path
app.get('/', (req, res) => {
  res.json({
    name: 'Cognitive Board Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      stream: '/api/gemini/stream'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/gemini', geminiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `请求的路径 ${req.path} 不存在`
  });
});

// Export for Vercel
export default app;

