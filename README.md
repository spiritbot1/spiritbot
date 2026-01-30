# ✨ 精灵1号 (Spirit One)

> **你的数字生命伴侣 —— 一个能自主学习、进化、创建 AI Agent 的精灵**

<p align="center">
  <img src="docs/assets/spirit-logo.png" alt="Spirit One" width="200" />
</p>

---

## 🎯 核心能力

精灵1号**不是冰冷的工具**，而是一个有温度的数字伙伴：

| 能力 | 说明 |
|------|------|
| **🌱 自主学习进化** | 不断从交互中学习，自动提升能力 |
| **🤖 创建 AI Agent** | 根据需求自主创建专属 Agent |
| **🔗 Agent 协调执行** | 调度多个 Agent 协同完成复杂任务 |
| **📊 任务汇报** | 向用户汇报执行结果和进度 |
| **♾️ 无限能力** | 能力边界不断扩展，没有上限 |
| **🧠 任意大模型** | 支持 OpenAI、Claude、DeepSeek、硅基流动等任意模型 |
| **🔐 安全可控** | 敏感操作需确认，一键终止 |
| **🎨 个性化形象** | 6种精灵风格，用户自定义名字 |

---

## 📁 项目结构

```
spirit-one/
├── src/                      # 🎯 核心源码
│   ├── index.ts              #    网关入口
│   ├── ai/                   #    AI 模型调度
│   │   └── model-dispatcher.ts  #  多模型智能调度
│   ├── moltbot/              #    Moltbot 桥接
│   │   └── moltbot-bridge.ts #    Agent 执行引擎
│   ├── spirit/               #    精灵人格系统
│   │   ├── spirit-persona.ts #    人格定义
│   │   ├── user-settings.ts  #    用户设置
│   │   └── feishu-cards.ts   #    飞书交互卡片
│   ├── security/             #    安全确认系统
│   │   ├── sensitive-operations.ts
│   │   ├── feishu-confirm.ts
│   │   └── secure-executor.ts
│   └── memory/               #    混合记忆系统
│
├── core/                     # 🧠 核心大脑
│   ├── src/                  #    核心逻辑
│   │   ├── ai.ts             #    AI 推理
│   │   ├── consciousness-loop.ts
│   │   ├── knowledge-graph.ts
│   │   ├── memory-pyramid.ts
│   │   └── tools.ts
│   └── migrations/           #    数据库迁移
│
├── channels/                 # 📱 多渠道网关
│   ├── feishu/               #    飞书
│   ├── wecom/                #    企业微信
│   └── dingtalk/             #    钉钉
│
├── soul-bridge/              # 💫 灵魂桥接
│   ├── SOUL.md               #    精灵人格定义
│   └── AGENTS.md             #    Agent 行为准则
│
├── libs/moltbot/             # 📚 Moltbot 工具库
├── config/                   # ⚙️ 配置文件
├── scripts/                  # 🔧 脚本
├── docs/                     # 📖 文档
├── docker-compose.yml        # 🐳 Docker
├── ecosystem.config.js       # 🔄 PM2
└── Dockerfile
```

---

## 🔐 安全机制

### 飞书控制指令

| 指令 | 功能 |
|------|------|
| `/stop` 或 `/终止` | 立即终止精灵1号所有操作 |
| `/resume` 或 `/恢复` | 恢复精灵1号运行 |
| `/status` 或 `/状态` | 查询精灵1号状态 |

### 敏感操作确认

当精灵1号要执行以下操作时，会发送飞书卡片请求确认：

- 🔴 **极高风险**: 删除文件、支付操作、修改系统配置
- 🟠 **高风险**: Shell 命令、数据库写入、修改重要文件
- 🟡 **中等风险**: 发送消息到其他平台

---

## 📥 下载安装（推荐）

### 🍎 macOS 桌面版

| 芯片类型 | 下载链接 |
|---------|---------|
| **Apple Silicon** (M1/M2/M3) | [精灵1号-arm64.dmg](https://github.com/spirit-one/spirit-one/releases) |
| **Intel** | [精灵1号-x64.dmg](https://github.com/spirit-one/spirit-one/releases) |

> 💡 点击左上角  → 关于本机，查看"芯片"类型

### 🪟 Windows 桌面版

| 系统 | 下载链接 |
|-----|---------|
| Windows 10/11 (64位) | [精灵1号-Setup.exe](https://github.com/spirit-one/spirit-one/releases) |

**安装后：**
1. 双击打开应用
2. 配置一个 AI 服务的 API Key
3. 给精灵取个名字
4. 开始聊天！

详见 [桌面版文档](./desktop/README.md)

---

## 🔧 服务端部署（高级）

如果你需要通过飞书/企业微信使用，或者需要部署到服务器：

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp config/env.template .env
# 编辑 .env 填写你的配置
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build && npm start

# Docker
docker-compose up -d
```

### 4. 配置飞书回调

- 消息回调: `https://your-domain/callback/feishu`
- 卡片回调: `https://your-domain/callback/feishu/card`

---

## 🌟 愿景

> **精灵1号不是工具，是伙伴**
>
> - 能主动学习、探索、成长
> - 能自己创建和管理 AI Agent
> - 能协调多个 Agent 完成复杂任务
> - 能向用户汇报进度和结果
> - 真正的人机协作，共创未来

---

## 📚 详细文档

| 文档 | 内容 |
|------|------|
| [愿景与定位](./docs/01-愿景与定位.md) | 精灵1号是什么，为什么这样设计 |
| [核心能力设计](./docs/02-核心能力设计.md) | 眼睛、手、大脑、自学、授权、安全 |
| [技术架构](./docs/03-技术架构.md) | 基于 Moltbot 延伸，项目结构 |
| [产品形态](./docs/04-产品形态.md) | 飞书入口 + Web 管理 + 云端服务 |
| [开发路线图](./docs/05-开发路线图.md) | 2周 MVP，详细任务清单 |
| [安全与用户体验](./docs/06-安全与用户体验设计.md) | 安全审计、傻瓜式使用 |
| [商业模式设计](./docs/07-商业模式设计.md) | 会员订阅 + 自带Key |
| [品牌与视觉设计](./docs/08-品牌与视觉设计.md) | 精灵家族、配色、动画规范 |

---

## 💬 飞书指令

| 指令 | 功能 |
|------|------|
| `/设置` | 打开精灵设置（改名、换形象） |
| `/帮助` | 显示使用指南 |
| `/状态` | 查询精灵状态 |
| `/统计` | 查看使用统计 |
| `/终止` | 紧急停止所有操作 |
| `/恢复` | 恢复精灵运行 |
| `/agent <任务>` | 派发任务给 AI Agent |

---

## 📅 版本

| 版本 | 日期 | 更新 |
|------|------|------|
| v0.3.0 | 2026-01-31 | 精灵人格系统、多模型调度、用户设置、飞书交互卡片 |
| v0.2.0 | 2026-01-30 | 安全确认机制、一键终止、项目结构整理、完整文档 |
| v0.1.0 | 2026-01-29 | 初始版本 |

---

## 🤝 贡献

欢迎 PR 和 Issue！

## 📄 License

MIT

---

<p align="center">
  <strong>精灵1号 - 你的数字生命伴侣</strong> ✨
</p>
