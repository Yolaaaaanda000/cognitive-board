# 🚀 快速部署到 Vercel

## 步骤 1: 推送到 GitHub

```bash
# 如果还没有 GitHub 仓库
git remote add origin https://github.com/你的用户名/cognitive-board.git
git branch -M main
git push -u origin main
```

## 步骤 2: 在 Vercel 部署

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New..." → "Project"
3. 选择你的 GitHub 仓库
4. 点击 "Import"

## 步骤 3: 配置环境变量

在 Vercel 项目设置中添加：

### 前端环境变量
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (部署后会自动生成，格式: `https://你的项目.vercel.app/api`)

### 后端环境变量
- `GEMINI_API_KEY`
- `HTTPS_PROXY` (可选，如果需要代理)
- `HTTP_PROXY` (可选，如果需要代理)

## 步骤 4: 部署

点击 "Deploy" 按钮，等待构建完成。

## ✅ 完成！

部署完成后，你会得到一个类似 `https://你的项目.vercel.app` 的 URL。

详细说明请查看 `DEPLOYMENT.md`。

