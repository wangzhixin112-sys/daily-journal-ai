# Netlify 部署全流程详细指南

## 1. 项目准备

### 1.1 确保项目已正确构建
```bash
# 运行构建命令
npm run build

# 确认dist目录存在且包含正确文件
dir dist
```

### 1.2 检查package.json脚本
- `dev`: 开发服务器
- `build`: 构建项目
- `preview`: 本地预览构建结果
- `deploy:prep`: 部署准备脚本

## 2. Netlify部署的三种方法

### 方法一：GitHub仓库直接部署（推荐）

#### 步骤1：准备GitHub仓库
1. 确保项目已推送到GitHub仓库 `https://github.com/wangzhixin112-sys/daily-journal-ai`
2. 检查仓库结构，确保包含以下文件：
   - `package.json`
   - `vite.config.ts`
   - `tsconfig.json`
   - `.gitignore`（建议包含node_modules、dist等）

#### 步骤2：登录Netlify
1. 访问 [Netlify官网](https://www.netlify.com/)
2. 使用GitHub账号登录

#### 步骤3：创建新站点
1. 点击"Add new site" → "Import an existing project"
2. 选择"GitHub"作为Git提供商
3. 授权Netlify访问你的GitHub账号
4. 搜索并选择仓库 `wangzhixin112-sys/daily-journal-ai`

#### 步骤4：配置部署设置
| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Base directory** | 留空 | 项目根目录 |
| **Build command** | `npm run build` | 使用package.json中的构建命令 |
| **Publish directory** | `dist` | Vite构建输出目录 |
| **Environment variables** | 见第3节 | 配置API密钥等敏感信息 |

#### 步骤5：部署站点
1. 点击"Deploy site"
2. Netlify将自动开始构建和部署
3. 等待部署完成，获取部署URL

#### 步骤6：设置自定义域名（可选）
1. 在Netlify控制台，点击"Domain settings"
2. 可以添加自定义域名或使用Netlify提供的免费域名

### 方法二：Netlify CLI部署

#### 步骤1：安装Netlify CLI
```bash
npm install -g netlify-cli
```

#### 步骤2：登录Netlify
```bash
netlify login
```
这将打开浏览器，引导你完成登录授权。

#### 步骤3：初始化Netlify项目
```bash
# 在项目根目录执行
netlify init
```

#### 步骤4：配置部署设置
根据提示完成配置：
- 选择"Create & configure a new site"
- 选择团队（或创建新团队）
- 输入站点名称（或使用随机生成的名称）
- 选择构建命令：`npm run build`
- 选择发布目录：`dist`

#### 步骤5：部署站点
```bash
# 部署到生产环境
netlify deploy --prod

# 或部署到预览环境
netlify deploy
```

### 方法三：手动上传部署

#### 步骤1：构建项目
```bash
npm run build
```

#### 步骤2：登录Netlify控制台
1. 访问 [Netlify官网](https://www.netlify.com/)
2. 点击"Add new site" → "Deploy manually"

#### 步骤3：上传构建文件
1. 拖拽dist目录到上传区域
2. 或点击"Choose files"选择dist目录下的所有文件
3. 点击"Deploy site"

## 3. 环境变量配置

### 3.1 项目中的环境变量
项目使用Vite构建，环境变量需要以`VITE_`为前缀。主要环境变量包括：

| 环境变量名 | 说明 | 必填 |
|------------|------|------|
| `VITE_BAIDU_API_KEY` | 百度文心一言API密钥 | 是 |
| `VITE_BAIDU_SECRET_KEY` | 百度文心一言Secret Key | 是 |
| `VITE_AI_MODEL` | AI模型名称，如`bce-v3/ALTAK-p6Mh4sderuFthCaIv3W7c/44dd56f122557bed4a92adc4022a15060df95198` | 是 |
| `VITE_API_BASE_URL` | API基础URL（如果有后端服务） | 否 |

### 3.2 在Netlify中配置环境变量

#### 方法1：通过Netlify控制台配置
1. 进入站点设置 → "Environment variables"
2. 点击"Add a variable"
3. 输入变量名和值，点击"Save"
4. 对于敏感信息，建议启用"Encrypt"选项

#### 方法2：通过netlify.toml配置（见第4节）

#### 方法3：通过Netlify CLI配置
```bash
netlify env:set VITE_BAIDU_API_KEY your_api_key
netlify env:set VITE_BAIDU_SECRET_KEY your_secret_key
netlify env:set VITE_AI_MODEL your_model_name
```

## 4. Netlify配置文件（netlify.toml）

### 4.1 创建配置文件
在项目根目录创建`netlify.toml`文件：

```toml
# netlify.toml

# 构建设置
[build]
  # 构建命令
  command = "npm run build"
  # 发布目录
  publish = "dist"
  # 基础目录
  base = "."

# 环境变量（可选，敏感信息建议通过控制台配置）
[context.production.environment]
  VITE_AI_MODEL = "bce-v3/ALTAK-p6Mh4sderuFthCaIv3W7c/44dd56f122557bed4a92adc4022a15060df95198"

# 重定向规则（处理单页应用路由）
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# 标题设置
[functions]
  node_bundler = "esbuild"
```

### 4.2 配置说明
- `[build]`: 构建相关配置
- `[context.production.environment]`: 生产环境变量
- `[[redirects]]`: 重定向规则，用于处理单页应用的路由问题
- `[functions]`: 无服务器函数配置（如果使用）

## 5. 部署后的验证步骤

### 5.1 检查部署状态
1. 登录Netlify控制台，查看站点状态
2. 确认部署日志中没有错误
3. 访问部署URL，确认页面能正常加载

### 5.2 功能验证
1. 测试AI识别功能：
   - 输入"今天花了十块钱买了个鸡蛋"，检查是否能正确识别
   - 输入"昨天给宝宝买了奶粉"，检查是否能正确识别宝宝支出
   - 输入"归还信用卡500元"，检查余额是否正确更新

2. 测试家庭成员功能：
   - 查看家庭成员列表
   - 检查权限设置是否正常

3. 测试数据同步：
   - 添加新的支出记录
   - 检查统计数据是否更新

### 5.3 性能验证
1. 检查页面加载时间
2. 测试在不同设备上的响应式表现
3. 验证图片懒加载是否正常工作

## 6. 常见部署问题及解决方案

### 6.1 构建失败

**问题**：Netlify构建失败，错误信息：`Failed to install dependencies`

**解决方案**：
- 检查package.json中的依赖版本是否兼容
- 确保.gitignore文件没有包含必要的依赖文件
- 尝试在本地重新安装依赖：`npm install`，然后重新构建

**问题**：构建成功但页面空白

**解决方案**：
- 检查浏览器控制台是否有JavaScript错误
- 确认netlify.toml中已配置重定向规则
- 检查构建输出目录是否包含所有必要文件

### 6.2 AI功能无法使用

**问题**：AI识别功能无法正常工作

**解决方案**：
- 检查环境变量是否正确配置
- 验证百度API密钥和Secret Key是否有效
- 检查AI模型名称是否正确
- 查看浏览器控制台的网络请求，确认API调用是否成功

### 6.3 路由问题

**问题**：直接访问子路由（如https://your-site.netlify.app/family）时出现404错误

**解决方案**：
- 确保netlify.toml中已添加重定向规则
- 检查React Router配置是否正确

### 6.4 环境变量问题

**问题**：环境变量在生产环境中无法访问

**解决方案**：
- 确保环境变量名称以`VITE_`为前缀
- 检查Netlify控制台中环境变量是否已正确设置
- 重新部署站点以应用新的环境变量

### 6.5 资源加载问题

**问题**：图片或其他资源无法加载

**解决方案**：
- 检查资源路径是否正确
- 确保资源已包含在构建输出中
- 检查CORS设置（如果资源来自外部域名）

## 7. 自动化部署

### 7.1 GitHub Actions自动化部署
在项目根目录创建`.github/workflows/deploy.yml`文件：

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Build
      run: npm run build
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### 7.2 配置Netlify自动部署
1. 在Netlify控制台中，进入站点设置 → "Build & deploy"
2. 确保"Continuous Deployment"已启用
3. 选择要自动部署的分支（通常是main或master）
4. 每次推送到该分支时，Netlify将自动触发构建和部署

## 8. 最佳实践

1. **使用GitHub仓库部署**：便于版本控制和自动化部署
2. **通过控制台配置敏感环境变量**：避免将API密钥等敏感信息提交到代码仓库
3. **配置重定向规则**：解决单页应用的路由问题
4. **启用HTTPS**：Netlify默认提供HTTPS，确保站点安全
5. **监控部署日志**：及时发现和解决部署问题
6. **使用预览环境**：在合并到主分支前，先在预览环境测试
7. **定期备份数据**：如果使用本地存储，定期导出数据

## 9. 后续维护

1. **更新依赖**：定期运行`npm update`更新依赖包
2. **监控站点性能**：使用Netlify Analytics或其他工具监控站点性能
3. **处理用户反馈**：及时修复bug和添加新功能
4. **备份配置**：定期备份Netlify配置和环境变量
5. **更新AI模型**：根据需要更新AI模型或API密钥

---

通过以上步骤，你可以成功将React + TypeScript + Vite项目部署到Netlify，并确保所有功能正常工作。如果遇到任何问题，请参考Netlify官方文档或检查部署日志以获取更多信息。