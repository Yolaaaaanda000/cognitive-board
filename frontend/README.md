# Frontend Application

Cognitive Board 前端应用，基于 React + Vite。

## 安装

```bash
npm install
```

## 配置

可选：复制 `.env.example` 为 `.env` 并配置 API 地址：

```bash
cp .env.example .env
```

默认 API 地址为 `http://localhost:3001`。

## 运行

### 开发模式
```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 代理配置

开发模式下，Vite 会自动代理 `/api` 请求到后端服务器（`http://localhost:3001`）。

