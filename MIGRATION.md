# 前后端分离迁移指南

项目已成功分离为前后端结构。以下是迁移说明。

## 新的目录结构

```
cognitive-board/
├── backend/          # 后端服务（Node.js + Express）
│   ├── src/
│   │   ├── routes/   # API 路由
│   │   ├── services/ # 业务逻辑
│   │   └── index.ts  # 服务器入口
│   └── package.json
├── frontend/         # 前端应用（React + Vite）
│   ├── src/
│   │   ├── api/      # API 客户端
│   │   ├── components/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
└── [旧文件保留在根目录，可删除]
```

## 迁移步骤

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 配置后端环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入 GEMINI_API_KEY
```

### 3. 安装前端依赖

```bash
cd frontend
npm install
```

### 4. 启动服务

**终端 1 - 启动后端：**
```bash
cd backend
npm run dev
```

**终端 2 - 启动前端：**
```bash
cd frontend
npm run dev
```

## 主要变更

### 后端
- ✅ Gemini AI 服务移至 `backend/src/services/geminiService.ts`
- ✅ 创建 Express API 服务器
- ✅ 提供 `/api/gemini/stream` SSE 流式接口

### 前端
- ✅ 创建 API 客户端 `frontend/src/api/geminiApi.ts`
- ✅ 使用 HTTP 请求替代直接调用 Gemini SDK
- ✅ Vite 配置代理，开发时自动转发 `/api` 请求

## 清理旧文件（可选）

迁移完成后，可以删除根目录下的旧文件：

```bash
# 注意：确保 frontend/ 目录中的文件正常工作后再删除
rm -rf services/
rm App.tsx index.tsx types.ts constants.ts vite.config.ts tsconfig.json package.json
```

或者保留作为备份。

## 环境变量

### 后端 (.env)
```
PORT=3001
GEMINI_API_KEY=your_api_key_here
```

### 前端 (.env) - 可选
```
VITE_API_BASE_URL=http://localhost:3001
```

## 故障排除

### 后端无法启动
- 检查 `.env` 文件是否存在且包含 `GEMINI_API_KEY`
- 检查端口 3001 是否被占用

### 前端无法连接后端
- 确认后端服务正在运行（`http://localhost:3001/health`）
- 检查浏览器控制台的网络请求
- 确认 Vite 代理配置正确

### CORS 错误
- 后端已配置 CORS，允许所有来源（开发环境）
- 生产环境需要配置具体的允许来源

