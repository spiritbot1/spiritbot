# 🔗 Moltbot 深度集成指南

> 本文档记录了对 Moltbot 的深度研究成果，以及如何将其与精灵1号完美集成。

## 目录

1. [Moltbot 是什么](#1-moltbot-是什么)
2. [核心架构](#2-核心架构)
3. [灵魂注入机制](#3-灵魂注入机制)
4. [工具系统](#4-工具系统)
5. [模型与认证](#5-模型与认证)
6. [集成方案](#6-集成方案)
7. [实施步骤](#7-实施步骤)
8. [注意事项](#8-注意事项)

---

## 1. Moltbot 是什么

Moltbot 是一个**完整的 AI Agent 框架**，不是简单的聊天机器人。

### 核心能力矩阵

| 能力 | 描述 | 对精灵的价值 |
|------|------|-------------|
| 🧠 多模型支持 | 15+ AI 服务商 | 用户可选任意模型 |
| 🌐 浏览器自动化 | Playwright 完整控制 | 真正的网页操作 |
| 💻 Shell 执行 | 命令行 + 后台进程 | 系统级任务 |
| 🔍 联网搜索 | Brave + Perplexity | 实时信息获取 |
| 📁 文件操作 | 读/写/编辑/搜索 | 本地文件管理 |
| 🧬 记忆系统 | 向量嵌入 + 语义搜索 | 长期记忆 |
| ⏰ 定时任务 | Cron 系统 | 自动化调度 |
| 💬 多通道 | Telegram/Discord/Slack... | 未来扩展 |
| 🔌 Hooks | 可扩展钩子 | 自定义行为 |
| 🎭 灵魂注入 | SOUL.md | **精灵人格！** |

### 项目结构

```
libs/moltbot/
├── moltbot.mjs              # CLI 入口
├── dist/                    # 编译后的代码
│   ├── commands/            # CLI 命令
│   │   └── agent.js         # `moltbot agent` 命令
│   ├── agents/              # Agent 核心
│   │   ├── pi-embedded-runner/  # Agent 运行器
│   │   ├── pi-tools.js      # 工具创建
│   │   ├── workspace.js     # 工作区管理
│   │   └── system-prompt.js # 系统提示构建
│   ├── browser/             # Playwright 浏览器
│   ├── memory/              # 记忆系统
│   ├── hooks/               # Hooks 系统
│   ├── config/              # 配置管理
│   └── channels/            # 消息通道
├── node_modules/
│   └── @mariozechner/
│       ├── pi-ai/           # AI 模型库
│       ├── pi-coding-agent/ # Agent 核心库
│       └── pi-agent-core/   # Agent 循环
└── package.json
```

---

## 2. 核心架构

### Agent 执行流程

```
用户输入
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  moltbot agent --message "xxx" --local --json               │
│  (commands/agent.js)                                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  runEmbeddedPiAgent()                                       │
│  (agents/pi-embedded-runner/run.js)                         │
│                                                             │
│  - 解析模型和服务商                                          │
│  - 获取 API Key                                             │
│  - 检查上下文窗口                                            │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  runEmbeddedAttempt()                                       │
│  (agents/pi-embedded-runner/run/attempt.js)                 │
│                                                             │
│  1. 加载工作区文件 (loadWorkspaceBootstrapFiles)             │
│     - ~/clawd/SOUL.md                                       │
│     - ~/clawd/AGENTS.md                                     │
│     - ~/clawd/TOOLS.md                                      │
│     - ~/clawd/MEMORY.md                                     │
│                                                             │
│  2. 应用 Hooks (applyBootstrapHookOverrides)                │
│                                                             │
│  3. 创建工具 (createMoltbotCodingTools)                     │
│                                                             │
│  4. 构建系统提示 (buildEmbeddedSystemPrompt)                │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 循环 (pi-agent-core/agentLoop)                       │
│                                                             │
│  while (有工具调用) {                                        │
│    1. 发送消息给 LLM                                        │
│    2. 解析 LLM 返回的工具调用                                │
│    3. 执行工具                                              │
│    4. 将结果发回 LLM                                        │
│  }                                                          │
│  return 最终回复                                            │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  返回 JSON 结果                                             │
│  {                                                          │
│    ok: true,                                                │
│    payloads: [{ text: "回复内容" }],                         │
│    summary: "任务摘要",                                      │
│    usage: { inputTokens, outputTokens }                     │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 灵魂注入机制

### 工作区文件结构

Moltbot 默认工作区：`~/clawd/`（可通过环境变量覆盖）

```
~/clawd/
├── SOUL.md        # 🎭 灵魂/人格定义（最重要！）
├── AGENTS.md      # 📋 Agent 行为准则
├── TOOLS.md       # 🔧 工具使用指南
├── IDENTITY.md    # 🪪 身份定义
├── USER.md        # 👤 用户信息
├── HEARTBEAT.md   # 💓 心跳/自动回复
├── BOOTSTRAP.md   # 🚀 启动文件
├── MEMORY.md      # 🧠 短期记忆
└── memory/        # 📚 长期记忆目录
    └── *.md
```

### 文件加载流程

```javascript
// workspace.js
export async function loadWorkspaceBootstrapFiles(dir) {
  const entries = [
    { name: "AGENTS.md", filePath: path.join(dir, "AGENTS.md") },
    { name: "SOUL.md", filePath: path.join(dir, "SOUL.md") },
    { name: "TOOLS.md", filePath: path.join(dir, "TOOLS.md") },
    // ... 其他文件
  ];
  
  // 读取每个文件内容
  for (const entry of entries) {
    const content = await fs.readFile(entry.filePath, "utf-8");
    result.push({ name: entry.name, content, missing: false });
  }
  
  return result;
}
```

### Hooks 可以修改灵魂！

```javascript
// bootstrap-hooks.js
export async function applyBootstrapHookOverrides(params) {
  const event = createInternalHookEvent("agent", "bootstrap", sessionKey, {
    bootstrapFiles: params.files,  // 包含 SOUL.md
  });
  
  await triggerInternalHook(event);
  
  // Hooks 可以修改 bootstrapFiles！
  return event.context.bootstrapFiles;
}

// 示例：soul-evil.js 可以替换 SOUL.md
// 根据配置，有一定概率用 SOUL_EVIL.md 替换 SOUL.md
```

### 灵魂如何注入系统提示

```javascript
// system-prompt.js
export function buildAgentSystemPrompt(params) {
  const lines = [
    "You are a personal assistant running inside Moltbot.",
    "",
    "## Tooling",
    // ... 工具描述
    "",
    "## Workspace Files (injected)",
    "These user-editable files are loaded by Moltbot and included below in Project Context.",
    "",
    // ... 其他部分
  ];
  
  // contextFiles 包含 SOUL.md, AGENTS.md 等的内容
  // 它们会被注入到系统提示的 "Project Context" 部分
  return lines.join("\n");
}
```

### 精灵1号的灵魂文件

我们已有的灵魂文件：

```
soul-bridge/
├── SOUL.md      # 精灵人格定义
└── AGENTS.md    # 精灵行为准则
```

**集成方式：** 将这些文件复制到 `~/clawd/` 目录

---

## 4. 工具系统

### 工具创建入口

```javascript
// pi-tools.js
export function createMoltbotCodingTools(options) {
  const tools = [];
  
  // 文件操作
  tools.push(createReadTool(options));
  tools.push(createWriteTool(options));
  tools.push(createEditTool(options));
  tools.push(createGrepTool(options));
  tools.push(createFindTool(options));
  tools.push(createLsTool(options));
  
  // Shell 执行
  tools.push(createExecTool(options));
  tools.push(createProcessTool(options));
  
  // 浏览器
  tools.push(createBrowserTool(options));
  
  // 网络
  tools.push(createWebSearchTool(options));
  tools.push(createWebFetchTool(options));
  
  // 记忆
  tools.push(createMemorySearchTool(options));
  tools.push(createMemoryGetTool(options));
  
  // 消息
  tools.push(createMessageTool(options));
  
  // 定时任务
  tools.push(createCronTool(options));
  
  // 子 Agent
  tools.push(createSessionsListTool(options));
  tools.push(createSessionsSendTool(options));
  tools.push(createSessionsSpawnTool(options));
  
  return tools.filter(Boolean);
}
```

### 工具详细说明

| 工具 | 文件 | 功能 |
|------|------|------|
| `exec` | bash-tools.exec.js | 执行 Shell 命令 |
| `process` | bash-tools.exec.js | 管理后台进程 |
| `browser` | browser-tool.js | Playwright 浏览器控制 |
| `web_search` | web-search.js | Brave/Perplexity 搜索 |
| `web_fetch` | web-fetch.js | 获取网页内容 |
| `read` | (pi-coding-agent) | 读取文件 |
| `write` | (pi-coding-agent) | 写入文件 |
| `edit` | (pi-coding-agent) | 编辑文件 |
| `grep` | (pi-coding-agent) | 搜索文件内容 |
| `find` | (pi-coding-agent) | 查找文件 |
| `ls` | (pi-coding-agent) | 列出目录 |
| `memory_search` | memory-tool.js | 语义搜索记忆 |
| `memory_get` | memory-tool.js | 获取记忆片段 |
| `message` | message-tool.js | 发送消息 |
| `cron` | cron-tool.js | 定时任务 |
| `sessions_list` | sessions-list-tool.js | 列出会话 |
| `sessions_send` | sessions-send-tool.js | 发送到其他会话 |
| `sessions_spawn` | sessions-spawn-tool.js | 派生子 Agent |

### 浏览器工具能力

```javascript
// browser-tool.js (通过 pw-ai.js)
export const browserActions = {
  navigate: "导航到 URL",
  click: "点击元素",
  fill: "填写表单",
  type: "输入文本",
  press: "按键",
  scroll: "滚动",
  screenshot: "截图",
  snapshot: "获取页面快照",
  evaluate: "执行 JavaScript",
  cookies_get: "获取 Cookies",
  cookies_set: "设置 Cookies",
  // ... 更多
};
```

### 搜索工具配置

```javascript
// web-search.js
const SEARCH_PROVIDERS = ["brave", "perplexity"];

// Brave Search API
const BRAVE_SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
// 需要: BRAVE_API_KEY

// Perplexity (通过 OpenRouter)
const DEFAULT_PERPLEXITY_BASE_URL = "https://openrouter.ai/api/v1";
// 需要: PERPLEXITY_API_KEY 或 OPENROUTER_API_KEY
```

---

## 5. 模型与认证

### 支持的 AI 服务商

```javascript
// @mariozechner/pi-ai 支持的服务商
const providers = [
  "anthropic",      // Claude
  "openai",         // GPT
  "google",         // Gemini
  "amazon-bedrock", // AWS Bedrock
  "azure",          // Azure OpenAI
  "openrouter",     // OpenRouter (聚合)
  "deepseek",       // DeepSeek
  "groq",           // Groq
  "together",       // Together AI
  "fireworks",      // Fireworks
  "mistral",        // Mistral
  "cohere",         // Cohere
  "perplexity",     // Perplexity
  "github-copilot", // GitHub Copilot
  // ... 更多
];
```

### API Key 认证方式

```javascript
// model-auth.js
export async function getApiKeyForModel(params) {
  // 1. 从环境变量获取
  const envKey = process.env[`${PROVIDER}_API_KEY`];
  
  // 2. 从 auth profiles 获取
  const profileKey = authStore.profiles[profileId]?.apiKey;
  
  // 3. 从 macOS Keychain 获取
  const keychainKey = await getFromKeychain(provider);
  
  return envKey || profileKey || keychainKey;
}
```

### 模型中转站策略

**核心理念：** 用户可以自由选择模型提供商！

```
┌─────────────────────────────────────────────────────────────┐
│                     模型提供商层级                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  第一层：中转站（推荐，一个 Key 调用多个模型）                 │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  硅基流动        │  │  OpenRouter     │                  │
│  │  SiliconFlow    │  │                 │                  │
│  │                 │  │                 │                  │
│  │  ✅ 国内访问快   │  │  ✅ 模型最全     │                  │
│  │  ✅ 价格便宜     │  │  ✅ 海外稳定     │                  │
│  │  ✅ 支持国产模型 │  │  ✅ 支持最新模型  │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  第二层：直连官方（高级用户）                                 │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐        │
│  │OpenAI │ │Claude │ │Gemini │ │DeepSeek│ │ Qwen  │        │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 推荐配置方案

| 用户类型 | 推荐方案 | 理由 |
|---------|---------|------|
| 🇨🇳 国内用户 | **硅基流动** | 访问快、便宜、支持国产模型 |
| 🌍 海外用户 | **OpenRouter** | 模型全、稳定 |
| 💼 企业用户 | 直连官方 | 合规、SLA 保障 |
| 🔧 高级用户 | 自由配置 | 按需选择 |

### 环境变量列表

| 环境变量 | 用途 | 优先级 |
|---------|------|-------|
| `SILICONFLOW_API_KEY` | 硅基流动（国内推荐）| ⭐⭐⭐ |
| `OPENROUTER_API_KEY` | OpenRouter（海外推荐）| ⭐⭐⭐ |
| `OPENAI_API_KEY` | OpenAI 直连 | ⭐⭐ |
| `ANTHROPIC_API_KEY` | Anthropic Claude 直连 | ⭐⭐ |
| `GOOGLE_API_KEY` | Google Gemini 直连 | ⭐⭐ |
| `DEEPSEEK_API_KEY` | DeepSeek 直连 | ⭐⭐ |
| `BRAVE_API_KEY` | Brave Search（搜索功能）| ⭐ |
| `PERPLEXITY_API_KEY` | Perplexity AI（搜索功能）| ⭐ |

### 硅基流动支持的模型

```javascript
// 硅基流动 API 端点
const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";

// 支持的模型（部分）
const siliconflowModels = [
  // DeepSeek 系列
  "deepseek-ai/DeepSeek-V3",
  "deepseek-ai/DeepSeek-R1",
  "deepseek-ai/deepseek-coder",
  
  // Qwen 系列
  "Qwen/Qwen2.5-72B-Instruct",
  "Qwen/Qwen2.5-32B-Instruct",
  "Qwen/Qwen2.5-7B-Instruct",
  "Qwen/QwQ-32B-Preview",  // 推理模型
  
  // GLM 系列
  "THUDM/glm-4-9b-chat",
  
  // Yi 系列
  "01-ai/Yi-1.5-34B-Chat",
  
  // ... 更多
];
```

### 用户自定义配置

精灵1号支持用户在设置界面配置自己的 API Key：

```typescript
// 设置界面数据结构
interface UserConfig {
  // 模型配置
  model: {
    provider: "siliconflow" | "openrouter" | "openai" | "anthropic" | "custom";
    apiKey: string;
    baseUrl?: string;  // 自定义端点
    modelId?: string;  // 指定模型
  };
  
  // 搜索配置（可选）
  search?: {
    provider: "brave" | "perplexity";
    apiKey: string;
  };
}

### 配置文件路径

```
~/.moltbot/moltbot.json    # 新路径
~/.clawdbot/clawdbot.json  # 旧路径（兼容）
```

---

## 6. 集成方案

### 方案概览

```
┌─────────────────────────────────────────────────────────────┐
│                     精灵1号 架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                            │
│  │  Electron   │  用户界面层                                 │
│  │  桌面端 UI  │  - 聊天界面                                 │
│  │             │  - 设置界面（API Key）                      │
│  └──────┬──────┘  - 状态显示                                │
│         │                                                   │
│         │ IPC 通信                                          │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  Electron   │  主进程层                                   │
│  │  Main       │  - 子进程管理                              │
│  │  Process    │  - 灵魂文件注入                            │
│  │             │  - API Key 传递                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│         │ spawn() 子进程                                    │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  Moltbot    │  Agent 核心层                              │
│  │  CLI        │  - 完整 Agent 能力                         │
│  │             │  - 工具执行                                │
│  │             │  - 模型调用                                │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 为什么用子进程？

| 方案 | 问题 |
|------|------|
| 直接 import | Electron 用 Node.js 18，Moltbot 需要 Node.js 20+ |
| HTTP Gateway | 需要额外启动服务，复杂 |
| **子进程 CLI** ✅ | 使用系统 Node.js，简单可靠 |

### 调用方式

```javascript
// Electron 主进程
import { spawn } from 'child_process';
import { join } from 'path';

const MOLTBOT_PATH = join(__dirname, '../libs/moltbot');

// 根据用户配置构建环境变量
function buildEnvForMoltbot(userConfig) {
  const env = { ...process.env };
  
  // 根据用户选择的提供商设置对应的 API Key
  switch (userConfig.model.provider) {
    case 'siliconflow':
      env.SILICONFLOW_API_KEY = userConfig.model.apiKey;
      // 硅基流动使用 OpenAI 兼容接口
      env.OPENAI_API_KEY = userConfig.model.apiKey;
      env.OPENAI_BASE_URL = 'https://api.siliconflow.cn/v1';
      break;
    case 'openrouter':
      env.OPENROUTER_API_KEY = userConfig.model.apiKey;
      break;
    case 'openai':
      env.OPENAI_API_KEY = userConfig.model.apiKey;
      break;
    case 'anthropic':
      env.ANTHROPIC_API_KEY = userConfig.model.apiKey;
      break;
    case 'custom':
      // 用户自定义
      env.OPENAI_API_KEY = userConfig.model.apiKey;
      if (userConfig.model.baseUrl) {
        env.OPENAI_BASE_URL = userConfig.model.baseUrl;
      }
      break;
  }
  
  // 搜索 API Key（可选）
  if (userConfig.search?.apiKey) {
    if (userConfig.search.provider === 'brave') {
      env.BRAVE_API_KEY = userConfig.search.apiKey;
    } else {
      env.PERPLEXITY_API_KEY = userConfig.search.apiKey;
    }
  }
  
  return env;
}

async function callMoltbotAgent(message, userConfig) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [
      'moltbot.mjs',
      'agent',
      '--message', message,
      '--local',    // 本地模式
      '--json'      // JSON 输出
    ], {
      cwd: MOLTBOT_PATH,
      env: buildEnvForMoltbot(userConfig)
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error('Invalid JSON output'));
        }
      } else {
        reject(new Error(stderr || `Exit code: ${code}`));
      }
    });
  });
}
```

### 灵魂注入

```javascript
// 启动时将精灵灵魂复制到 Moltbot 工作区
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

function injectSpiritSoul() {
  const clawdDir = join(homedir(), 'clawd');
  const soulBridgeDir = join(__dirname, '../soul-bridge');
  
  // 确保目录存在
  if (!existsSync(clawdDir)) {
    mkdirSync(clawdDir, { recursive: true });
  }
  
  // 复制灵魂文件
  copyFileSync(
    join(soulBridgeDir, 'SOUL.md'),
    join(clawdDir, 'SOUL.md')
  );
  
  copyFileSync(
    join(soulBridgeDir, 'AGENTS.md'),
    join(clawdDir, 'AGENTS.md')
  );
  
  console.log('[Spirit] 灵魂已注入');
}
```

---

## 7. 实施步骤

### Phase 1: 基础集成

- [ ] 1.1 删除现有的自造轮子代码
  - 删除 `desktop/src/main/main.ts` 中的 `SPIRIT_TOOLS`
  - 删除 `desktop/src/main/main.ts` 中的 `executeToolCall`
  - 删除 `core/src/tools.ts`（如果不再需要）

- [ ] 1.2 实现 Moltbot 子进程调用
  - 创建 `callMoltbotAgent()` 函数
  - 处理 stdout/stderr
  - 解析 JSON 返回

- [ ] 1.3 实现灵魂注入
  - 启动时复制 `SOUL.md` 和 `AGENTS.md`
  - 检查 `~/clawd/` 目录

- [ ] 1.4 API Key 管理
  - UI 设置界面（支持多提供商选择）
  - 安全存储（加密本地保存）
  - 环境变量传递给 Moltbot 子进程
  - 默认推荐硅基流动（国内用户）

### Phase 2: UI 优化

- [ ] 2.1 显示 Moltbot 执行过程
  - 工具调用进度
  - 思考过程（如果有）

- [ ] 2.2 错误处理
  - Moltbot 启动失败
  - API Key 无效
  - 网络错误

- [ ] 2.3 流式输出（可选）
  - 实时显示 Agent 输出

### Phase 3: 高级功能

- [ ] 3.1 记忆系统集成
  - 显示/管理 `~/clawd/memory/`

- [ ] 3.2 安全确认
  - 敏感操作前询问用户
  - 可能需要自定义 Hook

- [ ] 3.3 多会话支持
  - 管理不同的会话 ID

---

## 8. 注意事项

### 系统要求

| 要求 | 说明 |
|------|------|
| Node.js | **20+**（Moltbot 要求）|
| Electron | 28+（我们已有）|
| 系统 | macOS / Windows / Linux |

### 设置界面设计

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 精灵1号 设置                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🤖 AI 模型配置                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  模型提供商：                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ 硅基流动 SiliconFlow（推荐，国内访问快）            │   │
│  │ ○ OpenRouter（模型最全）                             │   │
│  │ ○ OpenAI 直连                                       │   │
│  │ ○ Anthropic Claude 直连                             │   │
│  │ ○ 自定义                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  API Key：                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  💡 获取方式：https://cloud.siliconflow.cn                   │
│                                                             │
│  模型选择（可选）：                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ deepseek-ai/DeepSeek-V3                       ▼    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔍 搜索功能（可选）                                         │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  搜索提供商：                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ Brave Search（推荐，有免费额度）                    │   │
│  │ ○ Perplexity AI                                     │   │
│  │ ○ 不启用搜索                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                    [ 保存 ]  [ 测试连接 ]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 常见问题

#### Q: 为什么需要系统 Node.js 20+？

Moltbot 依赖的 `undici` 等库需要 Node.js 20+ 的特性。Electron 内置的 Node.js 是 18，所以我们用子进程调用系统 Node.js。

#### Q: API Key 存储在哪里？

- 我们的桌面端：`~/.spirit-one/config.json`（加密）
- 传递给 Moltbot：通过环境变量

#### Q: 灵魂文件会覆盖用户的吗？

首次启动时复制，后续可以让用户选择是否更新。

#### Q: 搜索功能需要额外配置吗？

是的，需要 `BRAVE_API_KEY`（免费额度够用）或 `PERPLEXITY_API_KEY`。

### 调试技巧

```bash
# 直接测试 Moltbot
cd libs/moltbot
export OPENROUTER_API_KEY=xxx
node moltbot.mjs agent --message "你好" --local --json

# 查看详细日志
DEBUG=* node moltbot.mjs agent --message "你好" --local
```

---

## 附录：关键文件索引

| 文件 | 位置 | 用途 |
|------|------|------|
| CLI 入口 | `libs/moltbot/moltbot.mjs` | Moltbot 主入口 |
| Agent 命令 | `libs/moltbot/dist/commands/agent.js` | `moltbot agent` 命令 |
| Agent 运行器 | `libs/moltbot/dist/agents/pi-embedded-runner/run.js` | Agent 执行核心 |
| 工具创建 | `libs/moltbot/dist/agents/pi-tools.js` | 创建所有工具 |
| 工作区管理 | `libs/moltbot/dist/agents/workspace.js` | SOUL.md 等文件管理 |
| 系统提示 | `libs/moltbot/dist/agents/system-prompt.js` | 构建系统提示 |
| 浏览器工具 | `libs/moltbot/dist/agents/tools/browser-tool.js` | Playwright 控制 |
| 搜索工具 | `libs/moltbot/dist/agents/tools/web-search.js` | Brave/Perplexity |
| 记忆工具 | `libs/moltbot/dist/agents/tools/memory-tool.js` | 记忆搜索 |
| Hooks | `libs/moltbot/dist/hooks/internal-hooks.js` | Hook 系统 |
| 模型认证 | `libs/moltbot/dist/agents/model-auth.js` | API Key 管理 |

---

> 📝 **文档版本**: 1.0
> 
> 📅 **更新时间**: 2026-01-31
> 
> 👤 **作者**: Spirit One Team
