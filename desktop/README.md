# ✨ 精灵1号 桌面版

> 双击打开，开箱即用的数字精灵伴侣

<p align="center">
  <img src="./resources/screenshot.png" alt="精灵1号截图" width="400" />
</p>

---

## ✅ 开箱即用

**下载 → 安装 → 使用**，不需要安装任何依赖！

所有能力已内置：
- 📁 文件操作
- ⚡ 命令执行
- 🔍 联网搜索
- 🌤 天气查询
- 🤖 AI 对话（需配置 API Key）
- 🌐 浏览器自动化（Playwright 内置）

---

## 📥 下载安装

### macOS

| 芯片类型 | 下载链接 |
|---------|---------|
| Apple Silicon (M1/M2/M3) | [精灵1号-arm64.dmg](https://github.com/spirit-one/spirit-one/releases/latest/download/Spirit-One-arm64.dmg) |
| Intel | [精灵1号-x64.dmg](https://github.com/spirit-one/spirit-one/releases/latest/download/Spirit-One-x64.dmg) |

**如何判断芯片类型？**
- 点击左上角  → 关于本机
- 查看"芯片"或"处理器"
- M1/M2/M3 选 Apple Silicon
- Intel 选 Intel 版本

### Windows

| 系统 | 下载链接 |
|-----|---------|
| Windows 10/11 (64位) | [精灵1号-Setup.exe](https://github.com/spirit-one/spirit-one/releases/latest/download/Spirit-One-Setup.exe) |

### Linux

| 格式 | 下载链接 |
|-----|---------|
| AppImage | [精灵1号.AppImage](https://github.com/spirit-one/spirit-one/releases/latest/download/Spirit-One.AppImage) |
| Deb | [精灵1号.deb](https://github.com/spirit-one/spirit-one/releases/latest/download/Spirit-One.deb) |

---

## 🚀 快速开始

### 1. 安装应用

**macOS:**
1. 下载对应芯片的 `.dmg` 文件
2. 双击打开，将「精灵1号」拖到「应用程序」文件夹
3. 首次打开如提示"无法验证"，右键点击 → 打开

**Windows:**
1. 下载 `.exe` 安装包
2. 双击运行，按提示安装

### 2. 配置 AI 服务

首次打开会引导你配置 API Key，推荐使用：

| 服务商 | 获取地址 | 特点 |
|--------|---------|------|
| **硅基流动** | https://cloud.siliconflow.cn | 国内首选，支持多模型 |
| **DeepSeek** | https://platform.deepseek.com | 性价比高 |
| **OpenAI** | https://platform.openai.com | GPT-4 |
| **月之暗面** | https://platform.moonshot.cn | Kimi |

### 3. 开始聊天！

配置完成后就可以和你的精灵聊天啦~

---

## ✨ 核心能力（基于 Moltbot Agent 引擎）

精灵1号集成了 Moltbot，拥有**真正的智能体能力**，无所不能！

### 💻 编程开发能力

| 能力 | 说明 |
|------|------|
| ✍️ **写代码** | 任何语言：Python、JavaScript、Go、Rust... |
| 🏗️ **开发应用** | 从零开始创建完整项目 |
| 🐛 **查找 Bug** | 分析代码、定位问题 |
| 🔧 **修复代码** | 自动修复错误、优化代码 |
| 📖 **代码审查** | Review PR、提出建议 |
| 🧪 **写测试** | 单元测试、集成测试 |

### 🖥️ 服务器运维能力

| 能力 | 说明 |
|------|------|
| 🔐 **SSH 连接** | 连接远程服务器 |
| 📊 **查看日志** | 分析错误、定位问题 |
| 🛠️ **修复漏洞** | 安全检查、漏洞修复 |
| 📦 **部署应用** | 自动化部署流程 |
| 🔍 **监控状态** | CPU、内存、磁盘监控 |
| ⚙️ **配置管理** | 环境变量、配置文件 |

### 🌐 网页自动化能力

| 能力 | 说明 |
|------|------|
| 🎯 **操作任何网页** | Playwright 驱动，模拟真人操作 |
| 🎫 **抢票** | 火车票、演唱会门票、飞机票 |
| 🧧 **抢红包** | 微信群红包监控 |
| 📝 **自动填表** | 表单填写、信息提交 |
| 📸 **截图取证** | 网页截图、内容抓取 |
| 🔑 **登录管理** | Cookie 管理、自动登录 |

### 🤖 AI Agent 能力

| 能力 | 说明 |
|------|------|
| 🧩 **创建专用 Agent** | 根据需求动态创建 AI Agent |
| 🎭 **角色扮演** | 红包猎手、票务专员、运维助手... |
| 📋 **任务编排** | 多步骤任务自动执行 |
| 🧠 **自主决策** | AI 自己判断用什么工具 |
| 💾 **记忆系统** | 记住上下文和历史 |
| 🔄 **持续学习** | 从执行结果中学习优化 |

### 📁 本地能力

| 能力 | 说明 |
|------|------|
| 📂 **文件操作** | 读写、创建、删除、搜索 |
| ⚡ **命令执行** | 运行任何终端命令 |
| 🔍 **联网搜索** | 实时搜索互联网 |
| 🌤️ **天气查询** | 全球城市天气 |
| 📰 **新闻获取** | 实时新闻资讯 |

---

### 🎯 使用示例

只需要**用自然语言告诉精灵**，它就会自动执行：

```
👤 你：帮我看看服务器上 /var/log/nginx 有没有报错

🌱 精灵：好的，我来连接服务器检查...
   [连接服务器] → [读取日志] → [分析错误]
   发现 3 个 502 错误，原因是后端服务超时，建议...

👤 你：写一个 Python 脚本，每天定时备份数据库

🌱 精灵：好的，我来创建备份脚本...
   [创建 backup.py] → [配置 cron] → [测试运行]
   已完成！脚本保存在 ~/scripts/backup.py，每天凌晨 3 点执行

👤 你：帮我抢明天北京到上海的高铁票

🌱 精灵：好的，需要你先登录 12306...
   [打开 12306] → [等待你扫码登录] → [开始监控]
   我会持续监控，有票立即抢购并通知你！

👤 你：分析一下这个项目的代码，找出性能问题

🌱 精灵：好的，我来分析...
   [扫描代码] → [性能分析] → [生成报告]
   发现 5 个性能问题：1. 数据库查询 N+1... 2. 没有缓存...
```

### 🎨 精灵个性化

| 功能 | 说明 |
|------|------|
| 🎨 **6种精灵形象** | 萌系、科技、治愈、活泼、机甲、梦幻 |
| ✏️ **自定义名字** | 给精灵取一个专属名字 |
| 🤖 **多AI支持** | 支持多种 AI 服务商 |
| 📌 **窗口置顶** | 精灵可以悬浮在其他窗口上 |
| 🌙 **深色模式** | 自动适配系统深色模式 |
| 💾 **本地存储** | 配置保存在本地，隐私安全 |

---

## 🛠 开发者

### 从源码构建

```bash
# 进入桌面版目录
cd desktop

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建 macOS 版本（当前系统架构）
npm run dist:mac

# 构建 macOS Intel 版本
npm run dist:mac-intel

# 构建 macOS Apple Silicon 版本
npm run dist:mac-arm

# 构建 macOS 通用版本（同时支持 Intel 和 Apple Silicon）
npm run dist:mac-universal

# 构建 Windows 版本
npm run dist:win

# 构建 Linux 版本
npm run dist:linux
```

### 项目结构

```
desktop/
├── src/
│   ├── main/           # Electron 主进程
│   │   └── main.ts
│   ├── preload/        # 预加载脚本
│   │   └── preload.ts
│   └── renderer/       # React 渲染进程
│       ├── App.tsx
│       ├── main.tsx
│       └── styles/
├── resources/          # 资源文件（图标等）
├── release/            # 构建输出目录
└── package.json
```

---

## ❓ 常见问题

### macOS 提示"无法打开，因为无法验证开发者"

右键点击应用 → 打开 → 再点击"打开"

### 更换 API Key

点击窗口标题栏的 ⚙️ 按钮进入设置

### 数据存储在哪里？

- macOS: `~/Library/Application Support/spirit-one-desktop/`
- Windows: `%APPDATA%/spirit-one-desktop/`
- Linux: `~/.config/spirit-one-desktop/`

---

## 📄 License

MIT

---

<p align="center">
  精灵1号 - 你的数字生命伴侣 ✨
</p>
