# Supabase 配置步骤详解

## 📍 如何找到 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

### 第一步：访问 Supabase Dashboard

1. 打开浏览器，访问：https://supabase.com/dashboard
2. 如果还没有账号，点击 "Sign Up" 注册
3. 如果已有账号，点击 "Sign In" 登录

### 第二步：创建新项目（如果还没有项目）

1. 登录后，点击右上角的 **"New Project"** 按钮
2. 填写项目信息：
   - **Name**: 项目名称（例如：thinkflow）
   - **Database Password**: 设置数据库密码（请记住这个密码）
   - **Region**: 选择离你最近的区域（例如：Southeast Asia (Singapore)）
3. 点击 **"Create new project"**
4. 等待项目创建完成（大约需要 2-3 分钟）

### 第三步：获取 Supabase URL 和 API Key

1. 在项目列表中，点击你刚创建的项目

2. 在左侧菜单栏，点击 **"Settings"** (设置图标 ⚙️)

3. 在设置菜单中，点击 **"API"** 选项

4. 在 API 页面，你会看到两个重要信息：

   #### 🔗 Project URL（这就是 VITE_SUPABASE_URL）
   - 位置：在 "Configuration" 部分的最上方
   - 格式：`https://xxxxxxxxxxxxx.supabase.co`
   - **复制这个 URL**

   #### 🔑 Project API keys（这就是 VITE_SUPABASE_ANON_KEY）
   - 位置：在 "Project API keys" 部分
   - 找到 **"anon public"** 这一行
   - 点击旁边的 **"Reveal"** 或 **"Copy"** 按钮
   - **复制这个 key**（一串很长的字符）

### 第四步：配置前端环境变量

1. 在项目根目录的 `frontend` 文件夹中，创建 `.env` 文件：

```bash
cd frontend
touch .env
```

2. 打开 `.env` 文件，填入你复制的值：

```env
# API 配置
VITE_API_BASE_URL=http://localhost:3001

# Supabase 配置
VITE_SUPABASE_URL=https://你复制的项目URL.supabase.co
VITE_SUPABASE_ANON_KEY=你复制的anon key
```

**示例：**
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzE0NjI4MDAsImV4cCI6MTk0NzAzODgwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 第五步：验证配置

1. 确保 `.env` 文件在 `frontend` 目录下
2. 确保环境变量名称正确（必须以 `VITE_` 开头）
3. 重启开发服务器（如果正在运行）

### 📸 图片指引

如果你需要更直观的指引，可以：

1. 登录 Supabase Dashboard 后
2. 导航到：Settings → API
3. 你会看到类似这样的界面：

```
Configuration
┌─────────────────────────────────────┐
│ Project URL                          │
│ https://xxxxx.supabase.co           │ ← 复制这个
└─────────────────────────────────────┘

Project API keys
┌─────────────────────────────────────┐
│ anon public                          │
│ eyJhbGciOiJIUzI1NiIs...            │ ← 点击 Reveal 复制这个
└─────────────────────────────────────┘
```

### ⚠️ 注意事项

1. **不要将 `.env` 文件提交到 Git**
   - `.env` 文件包含敏感信息
   - 确保 `.gitignore` 中包含 `.env`

2. **URL 格式**
   - 必须是完整的 HTTPS URL
   - 格式：`https://项目ID.supabase.co`
   - 不要包含末尾的斜杠 `/`

3. **API Key 安全**
   - `anon` key 可以在客户端使用（前端代码中）
   - 不要暴露 `service_role` key（这个 key 有完整权限，只能在服务器端使用）

4. **重启服务器**
   - 修改 `.env` 文件后，需要重启 Vite 开发服务器
   - 环境变量在服务器启动时加载

### 🔍 检查配置是否正确

配置完成后，启动前端服务器，打开浏览器控制台：

1. 如果看到警告："Missing Supabase environment variables" 
   → 说明配置有误，请检查 `.env` 文件

2. 如果没有任何警告，说明配置成功 ✅

3. 可以在浏览器控制台输入：
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```
   应该能输出你的 Supabase URL

### 🆘 遇到问题？

如果找不到这些值：

1. **确认项目已创建完成**
   - 项目状态应该显示为 "Active"
   - 如果显示 "Setting up"，请等待完成

2. **确认在正确的项目中**
   - 检查项目名称是否正确
   - 可以点击右上角切换项目

3. **检查网络连接**
   - 确保能访问 supabase.com

4. **尝试刷新页面**
   - 有时需要刷新才能看到最新的配置信息

### 📝 下一步

配置好环境变量后，记得：

1. ✅ 在 Supabase Dashboard 的 SQL Editor 中执行数据库表创建 SQL
2. ✅ 参考 `files/数据库部署说明.md` 完成数据库初始化
3. ✅ 启动后端和前端服务器进行测试

