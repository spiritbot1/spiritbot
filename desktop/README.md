# ✨ 精灵1号 桌面版

> 双击打开，开箱即用的数字精灵伴侣

<p align="center">
  <img src="./resources/screenshot.png" alt="精灵1号截图" width="400" />
</p>

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

## ✨ 功能特点

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
