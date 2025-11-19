# Cognitive Board - ThinkFlow

一个智能认知助手应用，支持知识图谱可视化和多智能体对话。

## 项目结构

```
cognitive-board/
├── backend/          # 后端服务
│   ├── src/
│   │   ├── routes/   # API 路由
│   │   ├── services/ # 业务逻辑服务
│   │   └── index.ts  # 服务器入口
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # 前端应用
│   ├── src/
│   │   ├── api/      # API 客户端
│   │   ├── components/ # React 组件
│   │   ├── services/ # 前端服务
│   │   └── App.tsx   # 主应用
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 快速开始

### 1. 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 2. 配置环境变量

#### 后端
复制 `backend/.env.example` 为 `backend/.env` 并填入你的 Gemini API Key：
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入 API_KEY
```

#### 前端
复制 `frontend/.env.example` 为 `frontend/.env`（可选，默认使用 localhost:3001）：
```bash
cd frontend
cp .env.example .env
```

### 3. 启动服务

#### 启动后端（终端 1）
```bash
cd backend
npm run dev
```
后端将在 `http://localhost:3001` 运行

#### 启动前端（终端 2）
```bash
cd frontend
npm run dev
```
前端将在 `http://localhost:3000` 运行

## 开发

### 后端开发
- 使用 `npm run dev` 启动开发服务器（支持热重载）
- 使用 `npm run build` 构建生产版本
- 使用 `npm start` 运行生产版本

### 前端开发
- 使用 `npm run dev` 启动开发服务器
- 使用 `npm run build` 构建生产版本
- 使用 `npm run preview` 预览生产版本

## API 文档

### POST /api/gemini/stream
流式发送消息到 Gemini AI

**请求体：**
```json
{
  "message": "用户消息内容"
}
```

**响应：**
Server-Sent Events (SSE) 流，格式：
```
data: {"chunk": "文本片段"}
data: {"done": true}
```

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- @google/genai

### 前端
- React 19
- TypeScript
- Vite
- Tailwind CSS

## 许可证

Private
