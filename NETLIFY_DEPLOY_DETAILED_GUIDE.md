# Netlify 部署超详细指南（GitHub集成方式）

## 🎯 目标
将已上传到 GitHub 的 AI 记账应用部署到 Netlify，实现全球访问和持续部署。

## 📋 准备工作
1. ✅ 代码已上传到 GitHub 仓库：`https://github.com/wangzhixin112-sys/daily-journal-ai`
2. ✅ 本地构建成功，生成了 `dist` 目录
3. ✅ 已获取百度文心一言 API 密钥

## 🔧 部署步骤（带截图说明）

### 1. 登录 Netlify 控制台
1. 访问 **Netlify官网**：https://www.netlify.com/
2. 点击右上角 **Log in**
3. 使用 GitHub 账号登录（推荐，方便后续连接仓库）

### 2. 新建站点
1. 登录后，进入 Netlify 控制台首页
2. 点击 **Add new site**（绿色按钮，位于页面中央或右上角）
3. 选择 **Import an existing project**（导入现有项目）

### 3. 连接 GitHub 仓库

#### 3.1 选择 Git 提供商
1. 在 "Where is your site's code?" 页面，选择 **GitHub**
2. 点击 **Authorize Netlify by Netlify** 按钮
3. 在 GitHub 授权页面，点击 **Authorize netlify**

#### 3.2 选择仓库
1. 授权成功后，Netlify 会显示你的 GitHub 仓库列表
2. 使用搜索框搜索 `daily-journal-ai`
3. 点击你要部署的仓库（`wangzhixin112-sys/daily-journal-ai`）

### 4. 配置构建设置

#### 4.1 基础构建设置
在 "Basic build settings" 部分，配置以下选项：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Branch to deploy** | `main` | 选择要部署的分支，通常是 `main` 或 `master` |
| **Build command** | `npm run build` | Netlify 构建项目时执行的命令 |
| **Publish directory** | `dist` | 构建完成后，Netlify 会部署这个目录下的文件 |

#### 4.2 高级构建设置（环境变量）
1. 点击 **Show advanced** 按钮展开高级设置
2. 点击 **Add an environment variable** 按钮
3. 输入环境变量：
   - **Key**: `VITE_API_KEY`（必须使用 `VITE_` 前缀，Vite 才能识别）
   - **Value**: 你的百度文心一言 API 密钥（如：`tZ2W0Jj9mRv4RaSo3ku0YhRR`）
4. 点击 **Add another variable** 可添加更多变量（如需）
5. 确认所有配置正确后，点击 **Deploy site** 按钮开始部署

### 5. 等待部署完成

#### 5.1 查看部署状态
1. 点击 **Deploy site** 后，Netlify 会跳转到部署详情页面
2. 页面顶部会显示 **Deploy in progress**（部署中）
3. 下方会显示实时构建日志，记录部署的每一步

#### 5.2 部署成功标志
- 页面顶部显示 **Site deployed successfully**（部署成功）
- 构建日志末尾显示 ✅ 成功标志
- 页面中会显示你的 Netlify 域名（如：`your-site-name.netlify.app`）

### 6. 访问部署后的应用

#### 6.1 获取部署域名
1. 在部署详情页面，找到 **Production deploy** 部分
2. 复制显示的域名（如：`https://sparkling-tartufo-123456.netlify.app`）

#### 6.2 在浏览器中访问
1. 打开新的浏览器标签页
2. 粘贴复制的域名，按回车访问
3. 确认应用能正常加载和使用

### 7. 测试 AI 功能

#### 7.1 进入 AI 记账页面
1. 访问部署后的应用
2. 登录应用（使用测试账号）
3. 点击底部导航栏中间的 **AI 记账** 图标

#### 7.2 测试 AI 识别
1. 在 AI 记账页面，输入记账描述（如："今天买了100元的菜"）
2. 点击 **生成记账** 按钮
3. 确认 AI 能正确识别并生成记账记录

## 🛠️ 配置管理（可选）

### 1. 自定义域名

#### 1.1 添加自定义域名
1. 在 Netlify 控制台，点击左侧菜单 **Site settings**
2. 点击 **Domain management** 选项卡
3. 点击 **Add custom domain** 按钮
4. 输入你的域名（如：`meiriji.example.com`）
5. 点击 **Verify** 按钮

#### 1.2 配置 DNS 记录
1. 验证成功后，Netlify 会显示需要配置的 DNS 记录
2. 登录你的域名服务商（如阿里云、腾讯云、GoDaddy 等）
3. 找到 DNS 管理页面
4. 添加 Netlify 提供的 DNS 记录：
   - **类型**: CNAME
   - **主机记录**: `www` 或 `@`
   - **记录值**: `your-site-name.netlify.app`
5. 保存 DNS 记录

#### 1.3 启用 HTTPS
1. DNS 记录生效后（通常需要 5-30 分钟），返回 Netlify 控制台
2. 在 **Domain management** 页面，找到你的自定义域名
3. 点击 **HTTPS** 选项卡
4. 点击 **Verify DNS configuration** 按钮
5. 验证成功后，Netlify 会自动为你生成免费 SSL 证书
6. 等待证书颁发完成后，HTTPS 会自动启用

### 2. 配置持续部署

#### 2.1 确认持续部署已开启
1. 在 Netlify 控制台，点击左侧菜单 **Deploys**
2. 在页面顶部，确认 **Auto publishing** 已开启（显示为绿色）
3. 下方会显示 "This site is set to auto-publish deployments from main branch"

#### 2.2 测试持续部署
1. 在本地修改代码（如修改 README.md 文件）
2. 提交代码到 GitHub：
   ```bash
   git add README.md
   git commit -m "Update README"
   git push origin main
   ```
3. 回到 Netlify 控制台 **Deploys** 页面
4. 确认 Netlify 已自动触发新的部署
5. 部署完成后，访问应用确认修改已生效

## 🚨 故障排除（详细）

### 1. 构建失败

#### 1.1 查看构建日志
1. 在 Netlify 控制台，点击左侧菜单 **Deploys**
2. 找到失败的部署，点击进入详情页面
3. 查看完整的构建日志，找到错误信息

#### 1.2 常见构建错误及解决方法

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `npm: command not found` | Netlify 环境中没有安装 npm | 检查 `package.json` 文件是否存在，确认项目是 npm 项目 |
| `Cannot find module 'vite'` | 依赖未安装 | 在 `Build command` 前添加 `npm ci && `，即 `npm ci && npm run build` |
| `Error: Could not resolve entry module (index.html)` | 入口文件路径错误 | 确认 `Publish directory` 配置为 `dist`，且构建后 `dist` 目录包含 `index.html` 文件 |
| `TypeScript error: Cannot find type definition file for 'node'` | TypeScript 配置错误 | 检查 `tsconfig.json` 文件，确认 `types` 数组为空或不包含 `node` |

### 2. 应用空白页

#### 2.1 检查浏览器控制台
1. 在浏览器中访问应用
2. 按下 `F12` 或 `Ctrl+Shift+I` 打开开发者工具
3. 点击 **Console** 选项卡，查看错误信息

#### 2.2 常见空白页错误及解决方法

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `Failed to load resource: the server responded with a status of 404 ()` | 资源文件路径错误 | 检查 `vite.config.ts` 中的 `base` 配置，确保为 `./` 或不设置 |
| `Uncaught ReferenceError: VITE_API_KEY is not defined` | 环境变量未正确配置 | 确认环境变量键名正确（必须使用 `VITE_` 前缀），且已在 Netlify 控制台中设置 |
| `Uncaught SyntaxError: Unexpected token < in JSON at position 0` | API 调用失败，返回 HTML 而非 JSON | 检查 API 密钥是否正确，以及 API 服务是否正常 |

### 3. AI 功能无法使用

#### 3.1 检查网络请求
1. 打开浏览器开发者工具
2. 点击 **Network** 选项卡
3. 触发 AI 记账功能
4. 查看请求到百度 API 的网络请求

#### 3.2 常见 AI 功能错误及解决方法

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `401 Unauthorized` | API 密钥无效 | 确认百度文心一言 API 密钥正确，且未过期 |
| `403 Forbidden` | API 密钥权限不足 | 检查百度 AI 控制台，确认 API 密钥有使用 `ernie_speed` 模型的权限 |
| `500 Internal Server Error` | 百度 API 服务错误 | 稍后重试，或检查百度 AI 控制台的服务状态 |
| `Response is not valid JSON` | API 响应格式错误 | 检查 `geminiService.ts` 中的 API 响应解析逻辑，确保能正确处理百度 API 的响应格式 |

## 📊 部署后管理

### 1. 查看部署历史
1. 在 Netlify 控制台，点击左侧菜单 **Deploys**
2. 页面会显示所有部署记录，按时间倒序排列
3. 点击任意部署记录，可查看详细的构建日志

### 2. 回滚部署
1. 在 **Deploys** 页面，找到要回滚到的部署记录
2. 点击该记录右侧的 **•••** 按钮
3. 选择 **Publish deploy**
4. 确认回滚后，Netlify 会将站点回滚到该部署版本

### 3. 查看访问统计
1. 在 Netlify 控制台，点击左侧菜单 **Analytics**
2. 这里可以查看站点的访问量、访问来源、设备类型等统计信息
3. 注意：高级统计功能可能需要付费

### 4. 管理环境变量
1. 在 Netlify 控制台，点击左侧菜单 **Site settings**
2. 点击 **Environment variables** 选项卡
3. 在这里可以添加、编辑或删除环境变量
4. 修改环境变量后，需要重新部署站点才能生效（点击 **Deploys** → **Trigger deploy** → **Deploy site**）

## 🎉 部署完成

恭喜！你已经成功将 AI 记账应用部署到 Netlify。现在你可以：

1. ✅ 分享你的 Netlify 域名给他人使用
2. ✅ 推送代码到 GitHub 自动更新部署
3. ✅ 配置自定义域名提升品牌形象
4. ✅ 监控站点访问情况和部署状态
5. ✅ 随时回滚到之前的部署版本

## 📞 技术支持

- **Netlify 官方文档**：https://docs.netlify.com/
- **Netlify 社区论坛**：https://community.netlify.com/
- **Netlify 支持中心**：https://www.netlify.com/support/
- **百度文心一言文档**：https://cloud.baidu.com/doc/WENXINWORKSHOP/s/klqx7b1xf

## 📝 部署记录

| 部署时间 | 部署类型 | 状态 | 域名 |
|----------|----------|------|------|
| `2026-01-08` | 首次部署 | ✅ 成功 | `your-site-name.netlify.app` |
| `YYYY-MM-DD` | 持续部署 | ✅ 成功 | `your-site-name.netlify.app` |

---

**最后更新时间**：2026-01-08
**文档版本**：v2.0
**适用范围**：AI 记账应用 Netlify 部署
