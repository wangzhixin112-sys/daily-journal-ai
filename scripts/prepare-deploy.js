
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const deployDir = path.resolve(rootDir, 'deploy_package');

console.log('🚀 开始构建部署包...');

// 1. 清理旧的部署目录
if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir);

// 2. 运行前端打包 (npm run build)
console.log('📦 正在打包前端 (npm run build)...');
try {
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
    console.error('❌ 前端打包失败，请检查错误日志。');
    process.exit(1);
}

// 3. 复制文件工具函数
function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to);
    fs.readdirSync(from).forEach(element => {
        if (element === 'node_modules' || element === '.env' || element === 'meiriji.db') return; // 跳过不需要的文件
        const stat = fs.lstatSync(path.join(from, element));
        if (stat.isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else if (stat.isDirectory()) {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

// 4. 开始复制
console.log('📂 正在整理文件...');

// 复制 dist (前端)
copyFolderSync(path.resolve(rootDir, 'dist'), path.resolve(deployDir, 'dist'));

// 复制 backend (后端)
copyFolderSync(path.resolve(rootDir, 'backend'), path.resolve(deployDir, 'backend'));

// 复制 package.json (根目录的，备用)
fs.copyFileSync(path.resolve(rootDir, 'package.json'), path.resolve(deployDir, 'package.json'));

console.log(`
✅ 打包完成！
-------------------------------------------------------
文件已生成在项目根目录下的: [ deploy_package ] 文件夹中。
-------------------------------------------------------
👉 下一步：
1. 打开文件夹，找到 'deploy_package'。
2. 右键把它压缩成 zip。
3. 上传到宝塔面板解压即可。
`);
