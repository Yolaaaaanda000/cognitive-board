# Backend Server

Cognitive Board 后端服务，提供 Gemini AI API 接口。

## 安装

```bash
npm install
```

## 配置

复制 `.env.example` 为 `.env` 并填入配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Gemini API Key。

## 运行

### 开发模式（热重载）
```bash
npm run dev
```

### 生产模式
```bash
npm run build
npm start
```

服务器将在 `http://localhost:3001` 启动。

## API 端点

### POST /api/gemini/stream
流式发送消息到 Gemini AI

**请求：**
```json
{
  "message": "用户消息"
}
```

**响应：** Server-Sent Events (SSE) 流

## 健康检查

### GET /health
返回服务器状态

