# 更新日志 (Changelog)

所有重要的更新都会记录在这里。

---

## [0.6.0] - 2026-01-31

### 🚀 Moltbot 深度集成

这是一次重大更新，将 Moltbot Agent 引擎完整集成到精灵1号桌面应用中。

#### 新增功能

**核心集成**
- 集成 Moltbot 作为 AI Agent 后端引擎
- 通过子进程 (`spawn`) 调用 `moltbot agent` 命令
- 实现灵魂注入机制：`soul-bridge/` → `~/clawd/`
- 支持固定会话 ID，保持对话上下文

**工具能力**
| 工具 | 能力 | 状态 |
|------|------|------|
| `exec` | 执行 Shell 命令 | ✅ 已验证 |
| `browser` | Playwright 浏览器自动化 | ✅ 就绪 |
| `read/write/edit` | 文件读写编辑 | ✅ 可用 |
| `web_search` | 网络搜索 | ✅ 可用 |
| `web_fetch` | 获取网页内容 | ✅ 可用 |
| `tts` | 文字转语音 | ✅ 可用 |
| `cron` | 定时任务 | ✅ 可用 |
| `canvas` | 截屏 (需配对 node) | ⚠️ 需配置 |

**多模型支持**
- 支持硅基流动 (SiliconFlow) 作为 AI 中转站
- 支持 OpenRouter 中转站
- 配置文件：`~/.moltbot/moltbot.json`
- 密钥存储：`~/clawd/agents/main/agent/auth-profiles.json`
- 用户可自定义配置 API Key

**视觉能力**
- 配置国产视觉模型 `Qwen/Qwen2-VL-72B-Instruct`
- 支持截图分析（通过 `exec screencapture`）

**Gateway 服务**
- 自动安装为 macOS LaunchAgent 系统服务
- 支持 WebSocket 连接
- 支持设备配对 (nodes)

#### 技术细节

**文件变更**
- `desktop/src/main/main.ts` - 主进程 Moltbot 集成
- `soul-bridge/AGENTS.md` - Agent 行为规范
- `soul-bridge/SOUL.md` - 精灵人格定义
- `~/.moltbot/moltbot.json` - Moltbot 配置

**配置要点**
```json
{
  "agents.defaults.model.primary": "openai/Pro/deepseek-ai/DeepSeek-V3",
  "agents.defaults.imageModel.primary": "openai/Qwen/Qwen2-VL-72B-Instruct",
  "models.providers.openai.baseUrl": "https://api.siliconflow.cn/v1",
  "plugins.slots.memory": "none"
}
```

**安全机制**
- API Key 通过环境变量传递，不硬编码
- 敏感操作需用户授权（如系统权限）

#### 已知限制

- `canvas` 工具需要配对 Moltbot node 设备
- 部分应用控制需要 macOS 辅助功能权限
- 网易云音乐等应用的播放控制有限制

---

## [0.5.0] - 2026-01-31

### 桌面应用框架

- Electron + React + TypeScript 框架搭建
- 基础聊天界面
- 系统托盘支持
- 开机自启动

---

## [0.3.0] - 2026-01-31

### 精灵人格系统

- 多模型智能调度
- 用户设置系统
- 飞书交互卡片

---

## [0.2.0] - 2026-01-30

### 安全与文档

- 安全确认机制
- 一键终止功能
- 项目结构整理
- 完整文档编写

---

## [0.1.0] - 2026-01-29

### 初始版本

- 项目初始化
- 基础架构设计
