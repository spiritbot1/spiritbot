#!/bin/bash

# 中心大脑启动脚本
# 使用方法: ./start.sh

echo "🧠 启动中心大脑..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
  echo "❌ 请在 services/central-brain 目录下运行此脚本"
  exit 1
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
  echo "⚠️  未找到 .env 文件，从模板创建..."
  cp config/env.template .env
  echo "请编辑 .env 文件填入实际配置"
  exit 1
fi

# 安装依赖
echo "📦 检查依赖..."
npm install

# 启动服务
echo "🚀 启动中心大脑服务..."
npm run dev

