#!/bin/bash
# ====================================
# 精灵1号 - Spirit One 启动脚本
# ====================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           ✨ 精灵1号 - Spirit One 启动脚本                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 版本过低，需要 18+，当前: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ .env 文件不存在${NC}"
    
    if [ -f "config/env.template" ]; then
        echo -e "${YELLOW}📋 从模板创建 .env 文件...${NC}"
        cp config/env.template .env
        echo -e "${YELLOW}⚠️ 请编辑 .env 文件填写你的配置，然后重新运行此脚本${NC}"
        exit 1
    else
        echo -e "${RED}❌ 配置模板不存在，请检查项目完整性${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ .env 配置文件${NC}"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
fi

echo -e "${GREEN}✓ 依赖已安装${NC}"

# 编译 TypeScript
echo -e "${YELLOW}🔨 编译 TypeScript...${NC}"
npm run build

echo -e "${GREEN}✓ 编译完成${NC}"

# 启动服务
echo ""
echo -e "${GREEN}🚀 启动精灵1号...${NC}"
echo ""

npm run start
