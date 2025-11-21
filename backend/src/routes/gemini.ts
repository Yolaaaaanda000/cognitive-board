import { Router } from 'express';
import { sendMessageStreamToGemini } from '../services/geminiService.js';

const router = Router();

// 流式消息接口
router.post('/stream', async (req, res) => {
  try {
    const { message, conversationHistory, thoughtSignature } = req.body;
    
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
      let lastThoughtSignature: string | undefined;
      
      for await (const chunk of sendMessageStreamToGemini(
        message,
        conversationHistory,
        thoughtSignature
      )) {
        // 保存 Thought Signature（如果存在）
        if (chunk.thoughtSignature) {
          lastThoughtSignature = chunk.thoughtSignature;
        }
        
        // 发送文本块和 Thought Signature
        res.write(`data: ${JSON.stringify({ 
          chunk: chunk.text || '', 
          thoughtSignature: chunk.thoughtSignature,
          done: chunk.done || false
        })}\n\n`);
      }
      
      // 如果最后有 Thought Signature，确保发送一次
      if (lastThoughtSignature) {
        res.write(`data: ${JSON.stringify({ 
          thoughtSignature: lastThoughtSignature,
          done: true 
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
      res.end();
    } catch (error) {
      console.error('Stream error:', error);
      // 提取错误信息，传递给前端
      const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);
      const errorDetails = error instanceof Error && error.stack
        ? error.stack
        : undefined;
      
      console.error('Error details:', errorDetails || errorMessage);
      
      // 尝试发送错误信息（如果连接还未关闭）
      try {
        res.write(`data: ${JSON.stringify({ 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        })}\n\n`);
        res.end();
      } catch (writeError) {
        // 如果写入失败（连接已关闭），只记录日志
        console.error('Failed to send error to client:', writeError);
        res.end();
      }
    }
  } catch (error) {
    console.error('Error in /stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

