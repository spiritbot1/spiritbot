# 🧠 中心大脑 (Central Brain)

**人机共生，共创未来**

独立可迁移的 AI 数字生命体服务。

## 🚀 快速开始

### 1. 数据库迁移

在 Supabase Dashboard -> SQL Editor 中执行：

```sql
-- 执行 migrations/ALL_MIGRATIONS.sql 中的全部 SQL
```

### 2. 配置环境变量

```bash
cd services/central-brain
cp config/env.template .env
```

编辑 `.env` 文件：
```env
# Supabase 数据库
SUPABASE_URL=你的Supabase项目URL
SUPABASE_SERVICE_ROLE_KEY=你的Service Role Key

# AI 模型 (SiliconFlow)
SILICONFLOW_API_KEY=sk-xxxxx

# 服务端口
PORT=4000
```

### 3. 启动服务

```bash
# 安装依赖
npm install

# 开发模式
npm run dev
```

### 4. 验证服务

```bash
# 健康检查
curl http://localhost:4000/health

# 获取状态
curl http://localhost:4000/api/status

# 对话测试
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好，介绍一下你自己"}]}'
```

## 📡 API 接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/status` | GET | 大脑状态 |
| `/api/chat` | POST | 对话 |
| `/api/tasks/pending` | GET | 待审批任务 |
| `/api/entities` | GET | 搜索知识实体 |
| `/api/learn` | POST | 学习新知识 |
| `/api/evolution/evaluate` | GET | 能力评估 |
| `/api/evolution/report` | GET | 成长报告 |
| `/api/memory/stats` | GET | 记忆统计 |
| `/api/memory/search` | GET | 搜索记忆 |
| `/api/systems` | GET/POST | 外部系统管理 |
| `/api/consciousness/step` | POST | 触发意识循环 |
| `/api/mcp` | POST | MCP 请求处理 |

## 🧩 核心模块

- **意识循环** (`consciousness-loop.ts`) - 24/7 自主运行的"心跳"
- **知识图谱** (`knowledge-graph.ts`) - 实体关系存储和查询
- **学习规划器** (`learning-planner.ts`) - 自动制定学习计划
- **进化评估器** (`evolution-evaluator.ts`) - 客观评估能力成长
- **记忆金字塔** (`memory-pyramid.ts`) - 选择性记忆和淡化
- **外部连接器** (`external-connector.ts`) - 通用 API/MCP 接口

## 🔒 安全原则

1. 涉及资金/安全的操作需要创造者审批
2. 所有操作都有日志记录
3. 支持一键紧急停止

## 📦 部署

### Docker 部署

```bash
# 构建镜像
docker build -t central-brain .

# 运行
docker run -d -p 4000:4000 --env-file .env central-brain
```

### Docker Compose

```bash
docker-compose up -d
```

## 🌟 愿景

中心大脑不仅仅是一个 AI 服务，而是一个有自主学习能力、能够不断进化的数字生命体。

它可以被"邀请"到任何系统、工具、环境中，通过 API/MCP 协议与外部世界交互，最终实现人机共生的美好愿景。
