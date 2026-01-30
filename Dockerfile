# 精灵1号 Gateway - Dockerfile
# Spirit One Gateway

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 编译 TypeScript
RUN npm run build

# 创建日志目录
RUN mkdir -p /app/logs

# 暴露端口
EXPOSE 3100

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3100/health || exit 1

# 启动命令
CMD ["node", "dist/index.js"]
