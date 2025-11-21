# Vercel 部署指南

## 📋 部署前准备

### 1. GitHub 仓库设置

1. **在 GitHub 上创建新仓库**
   ```bash
   # 如果还没有 GitHub 远程仓库
   git remote add origin https://github.com/你的用户名/cognitive-board.git
   git branch -M main
   git push -u origin main
   ```

2. **确保所有代码已提交**
   ```bash
   git status
   git add .
   git commit -m "准备部署到 Vercel"
   git push
   ```

### 2. 环境变量准备

需要准备以下环境变量：

#### 前端环境变量（在 Vercel 中设置）
- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase Anon Key
- `VITE_API_BASE_URL` - API 基础 URL（生产环境）

#### 后端环境变量（在 Vercel 中设置）
- `GEMINI_API_KEY` - Gemini API 密钥
- `HTTPS_PROXY` - 代理地址（如果需要）
- `HTTP_PROXY` - 代理地址（如果需要）

## 🚀 Vercel 部署步骤

### 方法 1: 通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `cognitive-board`
   - 点击 "Import"

3. **配置项目设置**
   
   **Root Directory**: 留空（使用项目根目录）
   
   **Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`
   
   **注意**: Vercel 会自动检测 `vercel.json` 配置，无需手动设置这些选项

4. **配置环境变量**
   
   在项目设置中添加以下环境变量：
   
   **前端环境变量**:
   ```
   VITE_SUPABASE_URL=你的_supabase_url
   VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
   VITE_API_BASE_URL=https://你的域名.vercel.app/api
   ```
   
   **后端环境变量**:
   ```
   GEMINI_API_KEY=你的_gemini_api_key
   HTTPS_PROXY=你的代理地址（可选）
   HTTP_PROXY=你的代理地址（可选）
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### 方法 2: 使用 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```

4. **设置环境变量**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add GEMINI_API_KEY
   # ... 其他环境变量
   ```

## ⚙️ 项目配置说明

### 前端配置

前端使用 Vite 构建，输出到 `frontend/dist` 目录。

### 后端配置

后端 API 路由通过 Vercel Serverless Functions 处理：
- API 路由: `/api/*` → `backend/src/index.ts`

### 路由配置

- `/api/*` - 后端 API 路由
- `/*` - 前端静态文件

## 🔧 自定义配置

如果需要修改配置，可以编辑 `vercel.json` 文件。

## 📝 注意事项

1. **后端部署**: 
   - Vercel 的 Serverless Functions 有执行时间限制（Hobby 计划 10 秒，Pro 计划 60 秒）
   - 如果后端需要长时间运行，考虑使用其他服务（如 Railway、Render 等）

2. **环境变量**:
   - 确保所有敏感信息都通过环境变量设置
   - 不要将 `.env` 文件提交到 GitHub

3. **代理配置**:
   - 如果在中国大陆，可能需要配置代理才能访问 Gemini API
   - 考虑使用 Vercel 的边缘函数或配置代理服务

4. **数据库**:
   - Supabase 数据库需要配置 RLS（Row Level Security）策略
   - 确保生产环境的数据库配置正确

## 🐛 常见问题

### 构建失败
- 检查 Node.js 版本（Vercel 默认使用 Node.js 18+）
- 检查依赖是否正确安装
- 查看构建日志中的错误信息

### API 路由不工作
- 检查 `vercel.json` 中的路由配置
- 确保后端代码正确导出
- 检查环境变量是否正确设置

### 环境变量未生效
- 确保在 Vercel Dashboard 中设置了环境变量
- 重新部署项目以应用新的环境变量

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Supabase 文档](https://supabase.com/docs)

