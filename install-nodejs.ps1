# 自动安装Node.js脚本

# 检测系统架构
$is64Bit = [Environment]::Is64BitOperatingSystem

# 设置Node.js版本和下载URL
$nodeVersion = "20.11.1"  # LTS版本
if ($is64Bit) {
    $downloadUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
    $arch = "x64"
} else {
    $downloadUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x86.msi"
    $arch = "x86"
}

# 设置下载路径和安装路径
$downloadPath = "$env:TEMP\node-v$nodeVersion-$arch.msi"
$installPath = "C:\Program Files\nodejs"

Write-Host "正在下载Node.js v$nodeVersion ($arch)..."

# 下载Node.js安装包
Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath

Write-Host "下载完成，正在安装Node.js..."

# 静默安装Node.js
Start-Process -FilePath msiexec.exe -ArgumentList "/i $downloadPath /qn /norestart ADDLOCAL=ALL INSTALLDIR=$installPath" -Wait -NoNewWindow

Write-Host "Node.js安装完成！"

# 添加Node.js到环境变量
$npmPath = Join-Path $env:APPDATA "npm"
$newPath = ";$installPath;$npmPath"
$env:Path += $newPath
$currentMachinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
[Environment]::SetEnvironmentVariable("Path", $currentMachinePath + $newPath, "Machine")

Write-Host "正在验证Node.js安装..."

# 验证Node.js和npm
node -v
npm -v

Write-Host "Node.js自动安装完成！您现在可以使用node和npm命令了。"
