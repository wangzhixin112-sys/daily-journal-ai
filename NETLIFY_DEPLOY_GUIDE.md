# Netlify 保姆级部署指南

## 准备工作

1. **确认项目已构建**
   - 确保你的项目已经成功构建，生成了 `dist` 目录
   - 构建命令：`node node_modules/vite/bin/vite.js build`
   - 确认 `dist` 目录包含 `index.html` 和 `assets` 文件夹

2. **获取百度文心一言 API 密钥**
   - 前往 [百度智能云控制台](https://console.bce.baidu.com/) 获取 API 密钥
   - 保存好你的 API 密钥，部署时需要用到

## 部署方式一：拖放部署（最简单）

### 步骤 1：创建 Netlify 账号
1. 访问 [Netlify 官网](https://www.netlify.com/)
2. 点击右上角 "Sign Up"
3. 选择使用 GitHub/Google 账号登录，或使用邮箱注册

### 步骤 2：拖放部署
1. 登录后，进入 Netlify 控制台
2. 点击 "Add new site" → "Deploy manually"
3. 在 "Drag and drop your site folder" 区域，找到并拖放你的 `dist` 文件夹
4. 等待部署完成（通常几秒钟）

### 步骤 3：配置环境变量
1. 部署完成后，点击 "Site settings" → "Environment variables"
2. 点击 "Add a variable"
3. 输入：
   - **Key**: `VITE_API_KEY`
   - **Value**: 你的百度文心一言 API 密钥
4. 点击 "Save"
5. 重新部署：点击 "Deploys" → "Trigger deploy" → "Deploy site"

## 部署方式二：GitHub/GitLab 集成部署（推荐，支持持续部署）

### 步骤 1：将项目上传到 GitHub
1. 在 GitHub 上创建一个新仓库
2. 将本地项目推送到 GitHub（确保 `.gitignore` 文件包含 `node_modules` 和 `.env.local`）

### 步骤 2：Netlify 连接 GitHub
1. 登录 Netlify 控制台
2. 点击 "Add new site" → "Import an existing project"
3. 选择 "GitHub" 并授权 Netlify 访问你的仓库
4. 选择你刚才创建的仓库

### 步骤 3：配置构建设置
1. 在 "Basic build settings" 部分：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Environment**: 点击 "Advanced" → "Add an environment variable"
   - 输入：
     - **Key**: `VITE_API_KEY`
     - **Value**: 你的百度文心一言 API 密钥
2. 点击 "Deploy site"

### 步骤 4：开启持续部署
- 当你推送代码到 GitHub 时，Netlify 会自动触发构建和部署

## 部署方式三：Netlify CLI 部署

### 步骤 1：安装 Netlify CLI
```bash
npm install -g netlify-cli
```

### 步骤 2：登录 Netlify
```bash
netlify login
```
- 浏览器会自动打开，授权登录

### 步骤 3：初始化项目
在项目根目录执行：
```bash
netlify init
```
- 选择 "Create & configure a new site"
- 输入站点名称（可选）
- 选择团队（通常选择你的个人团队）
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 步骤 4：配置环境变量
```bash
netlify env:set VITE_API_KEY 你的百度文心一言 API 密钥
```

### 步骤 5：部署站点
```bash
netlify deploy --prod
```
- 或使用简写：`netlify deploy -p`

## 验证部署

1. **访问站点**
   - 部署完成后，Netlify 会提供一个随机域名（如 `your-site-name.netlify.app`）
   - 在浏览器中访问该域名，确认应用正常运行

2. **测试 AI 功能**
   - 进入应用的 AI 记账页面
   - 尝试使用语音或文字输入记账，确认百度 AI 功能正常工作

## 常见问题解决

### 1. 应用空白页
- 检查 `dist` 目录是否正确生成
- 确认 `index.html` 中的资源路径正确
- 查看浏览器控制台的错误信息

### 2. AI 功能无法使用
- 检查环境变量 `VITE_API_KEY` 是否正确设置
- 确认 API 密钥是否有效（可在百度控制台验证）
- 查看浏览器控制台的网络请求，检查 API 调用是否成功

### 3. 构建失败
- 确认本地可以正常构建（执行 `npm run build`）
- 检查 Netlify 构建日志，查看具体错误信息
- 确认依赖是否完整（可尝试在 `package.json` 中添加 `npm ci` 到构建命令）

## 高级配置（可选）

### 1. 自定义域名
1. 点击 "Site settings" → "Domain management"
2. 点击 "Add custom domain"
3. 输入你的域名（如 `your-domain.com`）
4. 按照提示在域名服务商处配置 DNS 记录
5. 启用 HTTPS（Netlify 自动提供免费 SSL 证书）

### 2. 启用 CDN 缓存
- Netlify 默认启用 CDN 缓存，无需额外配置
- 静态资源会自动缓存，提高访问速度

### 3. 配置重定向规则
- 在项目根目录创建 `_redirects` 文件
- 示例：将所有请求重定向到 index.html（适合单页应用）
  ```
  /*    /index.html   200
  ```

## 部署完成

恭喜！你的 AI 记账应用已经成功部署到 Netlify。现在你可以：
- 分享你的 Netlify 域名给他人使用
- 推送代码到 GitHub 自动更新部署
- 配置自定义域名提升品牌形象
- 监控部署状态和访问日志

如果遇到任何问题，可以查看 Netlify 的 [官方文档](https://docs.netlify.com/) 或在 Netlify 控制台查看构建日志。
