#!/bin/bash
# 精灵1号 桌面版 - 构建脚本

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           ✨ 精灵1号 桌面版 - 构建脚本                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

echo "✓ Node.js $(node -v)"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 根据参数构建
case "$1" in
    "mac")
        echo "🍎 构建 macOS 版本..."
        npm run dist:mac
        ;;
    "mac-intel")
        echo "🍎 构建 macOS Intel 版本..."
        npm run dist:mac-intel
        ;;
    "mac-arm")
        echo "🍎 构建 macOS Apple Silicon 版本..."
        npm run dist:mac-arm
        ;;
    "mac-universal")
        echo "🍎 构建 macOS 通用版本..."
        npm run dist:mac-universal
        ;;
    "win")
        echo "🪟 构建 Windows 版本..."
        npm run dist:win
        ;;
    "linux")
        echo "🐧 构建 Linux 版本..."
        npm run dist:linux
        ;;
    "all")
        echo "📦 构建所有平台..."
        npm run dist
        ;;
    *)
        echo "用法: ./build.sh [mac|mac-intel|mac-arm|mac-universal|win|linux|all]"
        echo ""
        echo "  mac          - 当前 macOS 架构"
        echo "  mac-intel    - macOS Intel (x64)"
        echo "  mac-arm      - macOS Apple Silicon (arm64)"
        echo "  mac-universal- macOS 通用版"
        echo "  win          - Windows (x64)"
        echo "  linux        - Linux (AppImage + deb)"
        echo "  all          - 所有平台"
        exit 0
        ;;
esac

echo ""
echo "✅ 构建完成！"
echo "📁 输出目录: ./release/"
echo ""
ls -la release/ 2>/dev/null || echo "(等待构建完成...)"
