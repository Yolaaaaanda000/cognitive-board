import { Router } from 'express';
import { sendMessageStreamToGemini } from '../services/geminiService.js';

const router = Router();

// 流式消息接口
router.post('/stream', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 流式发送消息
    try {
      for await (const chunk of sendMessageStreamToGemini(message)) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error in /stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

