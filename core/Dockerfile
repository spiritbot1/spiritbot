# 中心大脑 Docker 镜像
# 支持开发和生产两种模式

FROM node:20-alpine

WORKDIR /app

# 安装构建工具
RUN apk add --no-cache python3 make g++

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于编译 TypeScript）
RUN npm ci

# 复制源代码
COPY . .

# 编译 TypeScript
RUN npm run build 2>/dev/null || echo "No build script, using tsx"

# 环境变量
ENV NODE_ENV=production
ENV PORT=4000

# 暴露端口
EXPOSE 4000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# 启动（使用 tsx 直接运行 TypeScript）
CMD ["npx", "tsx", "src/index.ts"]
