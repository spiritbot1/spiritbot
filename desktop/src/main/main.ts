/**
 * 精灵1号 桌面版 - 主进程
 * Spirit One Desktop - Main Process
 * 
 * 集成 Moltbot 作为 Agent 引擎
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, dialog, Notification } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { join, resolve, basename, dirname } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync, renameSync } from 'fs'
import { exec, spawn, ChildProcess } from 'child_process'
import { promisify } from 'util'
import { homedir, platform, hostname, cpus, totalmem, freemem } from 'os'

const execAsync = promisify(exec)

// 常见的 Node.js 安装路径
const NODE_PATHS = [
  '/usr/local/bin',           // Homebrew (Intel Mac)
  '/opt/homebrew/bin',        // Homebrew (Apple Silicon)
  '/usr/bin',                 // 系统自带
  join(homedir(), '.nvm/versions/node'),  // NVM
  join(homedir(), '.volta/bin'),          // Volta
  join(homedir(), '.fnm/aliases/default/bin'),  // FNM
]

// 获取完整的 PATH（包含常见 Node.js 路径）
function getEnhancedPath(): string {
  const currentPath = process.env.PATH || ''
  const additionalPaths = NODE_PATHS.filter(p => existsSync(p)).join(':')
  return additionalPaths + ':' + currentPath
}

// 带增强 PATH 的 exec
function execWithPath(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(cmd, {
    env: { ...process.env, PATH: getEnhancedPath() }
  })
}

// ==================== Moltbot 完整集成（通过子进程）====================

// Moltbot 路径
const MOLTBOT_PATH = is.dev
  ? resolve(__dirname, '../../../libs/moltbot')
  : join(process.resourcesPath, 'moltbot')

// 灵魂文件路径
const SOUL_BRIDGE_PATH = is.dev
  ? resolve(__dirname, '../../../soul-bridge')
  : join(process.resourcesPath, 'soul-bridge')

// Moltbot 工作区路径
const CLAWD_DIR = join(homedir(), 'clawd')

// Moltbot 进程状态
let moltbotReady = false
let moltbotProcess: ReturnType<typeof spawn> | null = null

// Moltbot Agent 目录
const MOLTBOT_AGENT_DIR = join(homedir(), '.clawdbot', 'agents', 'main', 'agent')

/**
 * 配置 Moltbot 的 auth-profiles.json
 * 将 API Key 写入 Moltbot 的认证配置文件
 */
function configureMoltbotAuth(provider: string, apiKey: string): { ok: boolean; error?: string } {
  console.log('[Spirit] 配置 Moltbot 认证...')
  console.log('[Spirit] Provider:', provider)
  
  try {
    // 确保目录存在
    if (!existsSync(MOLTBOT_AGENT_DIR)) {
      mkdirSync(MOLTBOT_AGENT_DIR, { recursive: true })
      console.log('[Spirit] 创建 Moltbot agent 目录')
    }
    
    const authPath = join(MOLTBOT_AGENT_DIR, 'auth-profiles.json')
    
    // 确定 provider key
    let providerKey = 'openai'  // 默认使用 OpenAI 兼容接口
    let profileId = 'spirit-key'
    let label = 'Spirit One API Key'
    
    switch (provider) {
      case 'siliconflow':
        providerKey = 'openai'  // SiliconFlow 兼容 OpenAI 接口
        profileId = 'openai-siliconflow'
        label = 'SiliconFlow (DeepSeek V3)'
        break
      case 'openrouter':
        providerKey = 'openrouter'
        profileId = 'openrouter-key'
        label = 'OpenRouter'
        break
      case 'anthropic':
        providerKey = 'anthropic'
        profileId = 'anthropic-key'
        label = 'Anthropic Claude'
        break
      case 'deepseek':
        providerKey = 'deepseek'
        profileId = 'deepseek-key'
        label = 'DeepSeek'
        break
      case 'openai':
        providerKey = 'openai'
        profileId = 'openai-key'
        label = 'OpenAI'
        break
      default:
        providerKey = 'openai'
        profileId = `${provider}-key`
        label = provider
    }
    
    // 构建 auth-profiles.json
    const authConfig = {
      version: 3,
      profiles: {
        [profileId]: {
          type: 'api_key',
          provider: providerKey,
          key: apiKey,  // 注意: Moltbot 用 "key" 字段，不是 "apiKey"
          label: label
        }
      },
      order: {
        [providerKey]: [profileId]
      }
    }
    
    writeFileSync(authPath, JSON.stringify(authConfig, null, 2))
    
    // 设置权限（仅 owner 可读写）
    try {
      const fs = require('fs')
      fs.chmodSync(authPath, 0o600)
    } catch {
      // Windows 等不支持 chmod
    }
    
    console.log('[Spirit] ✅ Moltbot 认证配置完成:', profileId)
    return { ok: true }
    
  } catch (error) {
    console.error('[Spirit] Moltbot 认证配置失败:', error)
    return { ok: false, error: (error as Error).message }
  }
}

/**
 * 注入精灵灵魂到 Moltbot 工作区
 * 将 soul-bridge/SOUL.md 和 AGENTS.md 复制到 ~/clawd/
 */
function injectSpiritSoul(): { ok: boolean; message: string } {
  console.log('[Spirit] 开始注入精灵灵魂...')
  console.log('[Spirit] 灵魂源路径:', SOUL_BRIDGE_PATH)
  console.log('[Spirit] 目标路径:', CLAWD_DIR)
  
  try {
    // 确保 ~/clawd/ 目录存在
    if (!existsSync(CLAWD_DIR)) {
      mkdirSync(CLAWD_DIR, { recursive: true })
      console.log('[Spirit] 创建 clawd 目录')
    }
    
    // 复制 SOUL.md
    const soulSrc = join(SOUL_BRIDGE_PATH, 'SOUL.md')
    const soulDest = join(CLAWD_DIR, 'SOUL.md')
    
    if (existsSync(soulSrc)) {
      copyFileSync(soulSrc, soulDest)
      console.log('[Spirit] ✅ SOUL.md 已注入')
    } else {
      console.log('[Spirit] ⚠️ SOUL.md 源文件不存在:', soulSrc)
    }
    
    // 复制 AGENTS.md
    const agentsSrc = join(SOUL_BRIDGE_PATH, 'AGENTS.md')
    const agentsDest = join(CLAWD_DIR, 'AGENTS.md')
    
    if (existsSync(agentsSrc)) {
      copyFileSync(agentsSrc, agentsDest)
      console.log('[Spirit] ✅ AGENTS.md 已注入')
    } else {
      console.log('[Spirit] ⚠️ AGENTS.md 源文件不存在:', agentsSrc)
    }
    
    console.log('[Spirit] 🌸 精灵灵魂注入完成！')
    return { ok: true, message: '灵魂注入成功' }
    
  } catch (error) {
    console.error('[Spirit] 灵魂注入失败:', error)
    return { ok: false, message: (error as Error).message }
  }
}

/**
 * 初始化 Moltbot（检查环境）
 */
async function initMoltbot(): Promise<{ ok: boolean; error?: string }> {
  console.log('[Spirit] 检查 Moltbot 环境...')
  console.log('[Spirit] Moltbot 路径:', MOLTBOT_PATH)
  
  // 检查 Moltbot 文件是否存在
  const moltbotMjs = join(MOLTBOT_PATH, 'moltbot.mjs')
  
  if (!existsSync(moltbotMjs)) {
    console.log('[Spirit] Moltbot 文件不存在:', moltbotMjs)
    return { ok: false, error: 'Moltbot 文件不存在' }
  }
  
  // 检查 Node.js（使用增强的 PATH）
  try {
    const { stdout } = await execWithPath('node --version')
    const version = stdout.trim()
    console.log('[Spirit] 系统 Node.js 版本:', version)
    
    const major = parseInt(version.slice(1).split('.')[0])
    if (major >= 20) {
      moltbotReady = true
      console.log('[Spirit] ✅ Moltbot 环境就绪')
      // Gateway 由 Moltbot 自己管理（moltbot gateway install）
      mainWindow?.webContents.send('moltbot-ready')
      return { ok: true }
    } else {
      console.log('[Spirit] ⚠️ Node.js 版本过低，Moltbot 高级功能受限')
      return { ok: false, error: `Node.js 版本过低 (${version})，需要 20+` }
    }
  } catch {
    console.log('[Spirit] 未检测到系统 Node.js')
    return { ok: false, error: '未检测到系统 Node.js' }
  }
}

/**
 * 调用 Moltbot 命令
 */
async function callMoltbot(command: string, args: string[] = []): Promise<{
  ok: boolean;
  output?: string;
  error?: string;
}> {
  const moltbotMjs = join(MOLTBOT_PATH, 'moltbot.mjs')
  
  if (!existsSync(moltbotMjs)) {
    return { ok: false, error: 'Moltbot 未安装' }
  }
  
  return new Promise((resolve) => {
    try {
      const fullArgs = [moltbotMjs, command, ...args]
      console.log('[Spirit] 执行 Moltbot:', 'node', fullArgs.join(' '))
      
      const proc = spawn('node', fullArgs, {
        cwd: MOLTBOT_PATH,
        env: { ...process.env, PATH: getEnhancedPath() },
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let stdout = ''
      let stderr = ''
      
      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })
      
      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ ok: true, output: stdout })
        } else {
          resolve({ ok: false, error: stderr || `退出码: ${code}`, output: stdout })
        }
      })
      
      proc.on('error', (err) => {
        resolve({ ok: false, error: err.message })
      })
      
      // 30秒超时
      setTimeout(() => {
        proc.kill()
        resolve({ ok: false, error: '执行超时' })
      }, 30000)
      
    } catch (error) {
      resolve({ ok: false, error: (error as Error).message })
    }
  })
}

/**
 * 执行 Bash 命令
 */
async function moltbotBashExec(command: string, cwd?: string): Promise<{
  ok: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || homedir(),
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      shell: platform() === 'win32' ? 'powershell.exe' : '/bin/zsh',
      env: { ...process.env, PATH: getEnhancedPath() }
    })
    
    return { ok: true, stdout, stderr }
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string }
    return {
      ok: false,
      error: execError.message || '执行失败',
      stdout: execError.stdout || '',
      stderr: execError.stderr || ''
    }
  }
}

// 简单的配置存储（使用 JSON 文件）
class SimpleStore {
  private data: Record<string, unknown>
  private filePath: string
  
  constructor(defaults: Record<string, unknown>) {
    const userDataPath = app.getPath('userData')
    this.filePath = join(userDataPath, 'config.json')
    
    // 确保目录存在
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }
    
    // 加载或创建配置
    if (existsSync(this.filePath)) {
      try {
        this.data = JSON.parse(readFileSync(this.filePath, 'utf-8'))
      } catch {
        this.data = { ...defaults }
      }
    } else {
      this.data = { ...defaults }
    }
    
    // 合并默认值
    for (const key of Object.keys(defaults)) {
      if (!(key in this.data)) {
        this.data[key] = defaults[key]
      }
    }
    
    this.save()
  }
  
  get(key: string): unknown {
    return this.data[key]
  }
  
  set(key: string, value: unknown): void {
    this.data[key] = value
    this.save()
  }
  
  get store(): Record<string, unknown> {
    return { ...this.data }
  }
  
  private save(): void {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
  }
}

// 配置存储（延迟初始化）
let store: SimpleStore

function initStore(): SimpleStore {
  if (!store) {
    store = new SimpleStore({
      // 精灵设置
      spiritName: '小精灵',
      spiritStyle: 'cute',
      speechStyle: 'lively',
      
      // AI 配置
      aiProvider: 'siliconflow',
      apiKeys: {},
      
      // 窗口设置
      windowBounds: { width: 400, height: 600 },
      alwaysOnTop: false,
      
      // 首次使用
      isFirstLaunch: true
    })
  }
  return store
}

let mainWindow: BrowserWindow | null = null
let floatingSpirit: BrowserWindow | null = null  // 悬浮精灵窗口
let tray: Tray | null = null

/**
 * 创建主窗口
 */
function createWindow(): void {
  const s = initStore()
  const bounds = s.get('windowBounds') as { width: number; height: number }
  
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 320,
    minHeight: 480,
    show: false,
    frame: false,           // 无边框窗口
    transparent: true,      // 透明背景
    vibrancy: 'under-window', // macOS 毛玻璃效果
    visualEffectState: 'active',
    alwaysOnTop: s.get('alwaysOnTop') as boolean,
    skipTaskbar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 保存窗口位置
  mainWindow.on('resized', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize()
      initStore().set('windowBounds', { width, height })
    }
  })

  // 关闭时隐藏到托盘
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // 加载页面
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * 创建悬浮精灵窗口
 * 一个小精灵漂浮在屏幕边缘，鼠标悬停显示快捷菜单
 */
function createFloatingSpirit(): void {
  const { screen } = require('electron')
  const display = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = display.workAreaSize
  
  // 悬浮窗口大小（扩大以容纳菜单）
  const spiritSize = 100
  const menuWidth = 200
  const menuHeight = 280
  
  floatingSpirit = new BrowserWindow({
    width: spiritSize + menuWidth,
    height: spiritSize + menuHeight,
    x: screenWidth - spiritSize - menuWidth - 20,  // 右下角
    y: screenHeight - spiritSize - menuHeight - 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 允许鼠标穿透（除了精灵本身）
  floatingSpirit.setIgnoreMouseEvents(false)
  
  // 加载悬浮精灵页面
  const floatingSpiritHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent;
          -webkit-app-region: drag;
        }
        .spirit-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          cursor: pointer;
          -webkit-app-region: drag;
          padding: 10px;
          position: relative;
        }
        .spirit-avatar {
          width: 72px;
          height: 72px;
          animation: float 3s ease-in-out infinite;
          transition: transform 0.2s, filter 0.2s;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
        }
        .spirit-avatar img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .spirit-avatar:hover {
          transform: scale(1.15);
          filter: drop-shadow(0 6px 20px rgba(34, 197, 94, 0.5));
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .menu {
          position: absolute;
          bottom: 80px;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          opacity: 0;
          transform: translateY(10px) scale(0.9);
          transition: all 0.2s ease;
          pointer-events: none;
          min-width: 160px;
        }
        .spirit-container:hover .menu {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
          -webkit-app-region: no-drag;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          color: #333;
        }
        .menu-item:hover {
          background: rgba(34, 197, 94, 0.1);
        }
        .menu-item .icon {
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <div class="spirit-container" id="container">
        <div class="spirit-avatar"><img src="SPIRIT_IMAGE_PATH" alt="精灵"/></div>
        <div class="menu">
          <div class="menu-item" onclick="action('chat')">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>打开对话</span>
          </div>
          <div class="menu-item" onclick="action('screenshot')">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
            <span>截图提问</span>
          </div>
          <div class="menu-item" onclick="action('voice')">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
            <span>语音输入</span>
          </div>
          <div class="menu-item" onclick="action('search')">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span>快速搜索</span>
          </div>
          <div class="menu-item" onclick="action('settings')">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            <span>设置</span>
          </div>
        </div>
      </div>
      <script>
        function action(type) {
          window.spirit.floatingAction(type);
        }
      </script>
    </body>
    </html>
  `
  
  // 读取精灵图片并转为 base64
  const spiritImagePath = is.dev
    ? join(__dirname, '../../../desktop/resources/spirit-float-small.png')
    : join(process.resourcesPath, 'spirit-float-small.png')
  
  let spiritImageBase64 = ''
  try {
    const imageBuffer = readFileSync(spiritImagePath)
    spiritImageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`
  } catch (e) {
    console.error('[Spirit] 无法加载精灵图片:', e)
    spiritImageBase64 = '' // 使用默认 emoji
  }
  
  // 替换图片路径为 base64
  const htmlWithImage = floatingSpiritHtml.replace(
    'SPIRIT_IMAGE_PATH', 
    spiritImageBase64 || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="70" font-size="70">🧚</text></svg>'
  )
  
  floatingSpirit.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlWithImage))
  
  // 双击打开主窗口
  floatingSpirit.webContents.on('before-input-event', (_, input) => {
    if (input.type === 'mouseDown' && input.button === 'left') {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}

/**
 * 创建可爱的精灵图标（Base64 PNG）
 */
function createSpiritIcon(): nativeImage {
  // 一个可爱的绿色精灵图标 (22x22 PNG)
  const iconBase64 = `
iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAC
vUlEQVR4nK2VW0hUURSGv3NmHC+TOpqZt8wuVpqZRRcqooLqoYh6qIfoIYKCoOilh+itl4jooQci
gogeosyioCQrK8PEKMsySszK1My8jI7jZc6c3sYZdRydht7Ww9lr7f9f/9p7rS0EBWdJ4E8IChYi
2P8fxDiuwOu1cXfPI+7cukNeTi6pqalMnDiRoqIiMjMzycjIID4+ntjYWJRSuN1uXC4XTqeTtrY2
Wltbsdls5OTkkJOTw4wZM5g9ezYRERGBNf6OoGsxhGGG4BPFgQkT2XHoJKvX72DDxo2kpqaiKYWu
B7aLruuYpomqVDhNk/LXr0m/dpXyh/dZtnI169dvIDk5mdDQ0L4pHH5ZUXFQ/PqFubNnkfXyGdPG
xREaEoKmBQ+j6zqGYeB0OiktLSUzM5P2tlbWrlnDl08fSE5OITIysl8Kh4fY7XZpMgxWLV9GRXkZ
o0JDEUIghOifQggMw0DTNDRNo6amhry8PNxuNytXruTLl8+kpKQQFRWFEGJAYntdXZ2MtViYNm0a
7U4nYWFhQYv2FNM0MQwDt9tNbW0t+fn5+Hw+Fi9eTHV1NWPHjiUqKgqv14sQ4q/E9rq6OumzWIiN
i8Pr8xEaGhq0aE8xDANd1/F4PNTX11NQUIDT6WTRokXU1NSQlJREVFQUHo8Hn88XnNju/VGLuNgY
3G43VqsVn88XdNGeYhgGmqbhcrl49uwZhYWFdHV1sWDBApqamoiPjycyMhKXy4XH4+mXwuFz9apV
cnBHKqptbSAERJBrZNd1DMPANE1sNhvFxcWUl5fj8/mYN28eTU1NxMTEEB4ejsvlwuVyBSf+rexN
UjIdrS0EuaXgdDpRSmGaJo8fP+bFixd4vV7mzJlDU1MTUVFRWCwWnE4nbrc7OLHDYpGbN2+WrLdr
wLQAv7CgUEqhlKKkpITXr1/j9XqZNWsWTU1NREREYLFYsNvteDyeoCkCfpR/AIHJh6CjZMa5AAAA
AElFTkSuQmCC
`.replace(/\s/g, '')
  
  return nativeImage.createFromDataURL(`data:image/png;base64,${iconBase64}`)
}

/**
 * 创建系统托盘
 */
function createTray(): void {
  const store = initStore()
  
  // 使用可爱的精灵图标
  let icon = createSpiritIcon()
  
  // macOS 托盘图标应该是 16x16 或 22x22
  if (process.platform === 'darwin') {
    icon = icon.resize({ width: 18, height: 18 })
    icon.setTemplateImage(true) // macOS 风格
  }
  
  tray = new Tray(icon)
  tray.setToolTip('精灵1号 🌱')
  
  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
  
  // 右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🌱 显示精灵1号',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: '⚙️ 设置',
      click: () => {
        mainWindow?.show()
        mainWindow?.webContents.send('open-settings')
      }
    },
    {
      label: '📊 使用统计',
      click: () => {
        mainWindow?.show()
        mainWindow?.webContents.send('open-stats')
      }
    },
    { type: 'separator' },
    {
      label: initStore().get('alwaysOnTop') ? '✓ 总在最前' : '  总在最前',
      click: () => {
        const s = initStore()
        const current = s.get('alwaysOnTop') as boolean
        s.set('alwaysOnTop', !current)
        mainWindow?.setAlwaysOnTop(!current)
        createTray() // 刷新菜单
      }
    },
    { type: 'separator' },
    {
      label: '🔗 GitHub',
      click: () => {
        shell.openExternal('https://github.com/spirit-one/spirit-one')
      }
    },
    {
      label: '📖 帮助文档',
      click: () => {
        shell.openExternal('https://spirit-one.github.io/docs')
      }
    },
    { type: 'separator' },
    {
      label: '❌ 退出精灵1号',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
}

/**
 * 注册 IPC 处理器
 */
function registerIpcHandlers(): void {
  // 获取配置
  ipcMain.handle('get-config', (_, key: string) => {
    return initStore().get(key)
  })
  
  // 设置配置
  ipcMain.handle('set-config', (_, key: string, value: unknown) => {
    initStore().set(key, value)
    return true
  })
  
  // 获取所有配置
  ipcMain.handle('get-all-config', () => {
    return initStore().store
  })
  
  // 窗口控制
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize()
  })
  
  ipcMain.handle('window-close', () => {
    mainWindow?.hide()
  })
  
  ipcMain.handle('window-toggle-pin', () => {
    const current = mainWindow?.isAlwaysOnTop()
    mainWindow?.setAlwaysOnTop(!current)
    initStore().set('alwaysOnTop', !current)
    return !current
  })
  
  // 调用 AI
  ipcMain.handle('call-ai', async (_, params: { 
    message: string; 
    provider?: string;
    apiKey?: string;
  }) => {
    const s = initStore()
    const apiKeys = s.get('apiKeys') as Record<string, string>
    const provider = params.provider || s.get('aiProvider') as string
    const apiKey = params.apiKey || apiKeys[provider]
    
    if (!apiKey) {
      return { success: false, error: '请先配置 API Key' }
    }
    
    try {
      const result = await callAI(params.message, provider, apiKey)
      return result
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '调用失败' 
      }
    }
  })
  
  // 保存 API Key
  ipcMain.handle('save-api-key', (_, provider: string, apiKey: string) => {
    const s = initStore()
    const apiKeys = s.get('apiKeys') as Record<string, string> || {}
    apiKeys[provider] = apiKey
    s.set('apiKeys', apiKeys)
    return true
  })
  
  // 打开外部链接
  ipcMain.handle('open-external', (_, url: string) => {
    shell.openExternal(url)
  })
  
  // 选择文件
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile']
    })
    return result.filePaths[0]
  })
  
  // 检查首次启动
  ipcMain.handle('check-first-launch', () => {
    const s = initStore()
    const isFirst = s.get('isFirstLaunch')
    if (isFirst) {
      s.set('isFirstLaunch', false)
    }
    return isFirst
  })

  // ==================== 文件操作能力 ====================
  
  // 读取文件
  ipcMain.handle('fs-read-file', async (_, filePath: string) => {
    try {
      const absolutePath = resolve(filePath.replace('~', homedir()))
      if (!existsSync(absolutePath)) {
        return { success: false, error: '文件不存在' }
      }
      const content = readFileSync(absolutePath, 'utf-8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 写入文件
  ipcMain.handle('fs-write-file', async (_, filePath: string, content: string) => {
    try {
      const absolutePath = resolve(filePath.replace('~', homedir()))
      const dir = dirname(absolutePath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(absolutePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 列出目录
  ipcMain.handle('fs-list-dir', async (_, dirPath: string) => {
    try {
      const absolutePath = resolve(dirPath.replace('~', homedir()))
      if (!existsSync(absolutePath)) {
        return { success: false, error: '目录不存在' }
      }
      const items = readdirSync(absolutePath).map(name => {
        const fullPath = join(absolutePath, name)
        const stat = statSync(fullPath)
        return {
          name,
          path: fullPath,
          isDirectory: stat.isDirectory(),
          size: stat.size,
          modified: stat.mtime.toISOString()
        }
      })
      return { success: true, items }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取文件信息
  ipcMain.handle('fs-stat', async (_, filePath: string) => {
    try {
      const absolutePath = resolve(filePath.replace('~', homedir()))
      if (!existsSync(absolutePath)) {
        return { success: false, error: '文件不存在' }
      }
      const stat = statSync(absolutePath)
      return {
        success: true,
        info: {
          name: basename(absolutePath),
          path: absolutePath,
          isDirectory: stat.isDirectory(),
          isFile: stat.isFile(),
          size: stat.size,
          created: stat.birthtime.toISOString(),
          modified: stat.mtime.toISOString()
        }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除文件
  ipcMain.handle('fs-delete', async (_, filePath: string) => {
    try {
      const absolutePath = resolve(filePath.replace('~', homedir()))
      if (!existsSync(absolutePath)) {
        return { success: false, error: '文件不存在' }
      }
      unlinkSync(absolutePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 复制文件
  ipcMain.handle('fs-copy', async (_, src: string, dest: string) => {
    try {
      const srcPath = resolve(src.replace('~', homedir()))
      const destPath = resolve(dest.replace('~', homedir()))
      copyFileSync(srcPath, destPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 移动/重命名文件
  ipcMain.handle('fs-move', async (_, src: string, dest: string) => {
    try {
      const srcPath = resolve(src.replace('~', homedir()))
      const destPath = resolve(dest.replace('~', homedir()))
      renameSync(srcPath, destPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 选择文件夹
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.filePaths[0]
  })

  // 获取主目录
  ipcMain.handle('get-home-dir', () => homedir())

  // ==================== 命令执行能力 ====================

  // 执行 Shell 命令
  ipcMain.handle('shell-exec', async (_, command: string, options?: { cwd?: string; timeout?: number }) => {
    try {
      const cwd = options?.cwd?.replace('~', homedir()) || homedir()
      const timeout = options?.timeout || 30000
      
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/zsh',
        env: { ...process.env, PATH: getEnhancedPath() }
      })
      
      return { success: true, stdout, stderr }
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message?: string }
      return { 
        success: false, 
        error: execError.message || '执行失败',
        stdout: execError.stdout || '',
        stderr: execError.stderr || ''
      }
    }
  })

  // 获取系统信息
  ipcMain.handle('system-info', () => {
    return {
      platform: platform(),
      hostname: hostname(),
      homeDir: homedir(),
      cpus: cpus().length,
      totalMemory: Math.round(totalmem() / 1024 / 1024 / 1024) + ' GB',
      freeMemory: Math.round(freemem() / 1024 / 1024 / 1024) + ' GB',
      nodeVersion: process.version,
      electronVersion: process.versions.electron
    }
  })

  // 打开文件/文件夹（用系统默认应用）
  ipcMain.handle('shell-open-path', async (_, filePath: string) => {
    try {
      const absolutePath = resolve(filePath.replace('~', homedir()))
      await shell.openPath(absolutePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 在终端中打开
  ipcMain.handle('shell-open-terminal', async (_, dirPath?: string) => {
    try {
      const cwd = dirPath ? resolve(dirPath.replace('~', homedir())) : homedir()
      
      if (platform() === 'darwin') {
        spawn('open', ['-a', 'Terminal', cwd])
      } else if (platform() === 'win32') {
        spawn('cmd', ['/c', 'start', 'cmd', '/K', `cd /d ${cwd}`])
      } else {
        spawn('x-terminal-emulator', ['--working-directory', cwd])
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ==================== 联网能力 ====================

  // 联网搜索（使用 DuckDuckGo，免费无需 API Key）
  ipcMain.handle('web-search', async (_, query: string) => {
    try {
      console.log(`[Spirit] 联网搜索: ${query}`)
      
      // 使用 DuckDuckGo Instant Answer API
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Spirit-One/1.0 (Desktop App)'
        }
      })
      
      const data = await response.json() as {
        Abstract?: string;
        AbstractText?: string;
        AbstractSource?: string;
        AbstractURL?: string;
        Heading?: string;
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
        Results?: Array<{ Text?: string; FirstURL?: string }>;
      }
      
      // 构建搜索结果
      const results: Array<{ title: string; snippet: string; url: string }> = []
      
      // 主要答案
      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL || ''
        })
      }
      
      // 相关主题
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 50),
              snippet: topic.Text,
              url: topic.FirstURL
            })
          }
        }
      }
      
      // 如果 DuckDuckGo 没有结果，尝试使用 Google 搜索建议
      if (results.length === 0) {
        const googleUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`
        const googleRes = await fetch(googleUrl)
        const googleData = await googleRes.json() as [string, string[]]
        
        if (googleData[1] && googleData[1].length > 0) {
          results.push({
            title: '搜索建议',
            snippet: googleData[1].join(', '),
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
          })
        }
      }
      
      console.log(`[Spirit] 搜索完成，找到 ${results.length} 条结果`)
      return { success: true, results, query }
    } catch (error) {
      console.error('[Spirit] 搜索失败:', error)
      return { success: false, error: (error as Error).message, results: [] }
    }
  })

  // 获取网页内容
  ipcMain.handle('web-fetch', async (_, url: string) => {
    try {
      console.log(`[Spirit] 抓取网页: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      })
      
      const html = await response.text()
      
      // 简单提取文本内容（去除 HTML 标签）
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000) // 限制长度
      
      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : url
      
      console.log(`[Spirit] 网页抓取完成: ${title}`)
      return { success: true, title, content: text, url }
    } catch (error) {
      console.error('[Spirit] 网页抓取失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取真实天气（使用 wttr.in，免费无需 API Key）
  ipcMain.handle('web-weather', async (_, city: string) => {
    try {
      console.log(`[Spirit] 查询天气: ${city}`)
      
      // wttr.in 提供免费天气 API
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=zh`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Spirit-One/1.0'
        },
        signal: AbortSignal.timeout(10000)
      })
      
      const data = await response.json() as {
        current_condition?: Array<{
          temp_C?: string;
          FeelsLikeC?: string;
          humidity?: string;
          weatherDesc?: Array<{ value?: string }>;
          windspeedKmph?: string;
          winddir16Point?: string;
          uvIndex?: string;
        }>;
        nearest_area?: Array<{
          areaName?: Array<{ value?: string }>;
          country?: Array<{ value?: string }>;
        }>;
        weather?: Array<{
          date?: string;
          maxtempC?: string;
          mintempC?: string;
          hourly?: Array<{
            time?: string;
            tempC?: string;
            weatherDesc?: Array<{ value?: string }>;
          }>;
        }>;
      }
      
      if (!data.current_condition?.[0]) {
        return { success: false, error: '无法获取天气数据' }
      }
      
      const current = data.current_condition[0]
      const area = data.nearest_area?.[0]
      const forecast = data.weather?.[0]
      
      const weather = {
        city: area?.areaName?.[0]?.value || city,
        country: area?.country?.[0]?.value || '',
        temperature: current.temp_C + '°C',
        feelsLike: current.FeelsLikeC + '°C',
        humidity: current.humidity + '%',
        description: current.weatherDesc?.[0]?.value || '',
        wind: `${current.windspeedKmph} km/h ${current.winddir16Point || ''}`,
        uvIndex: current.uvIndex || '',
        high: forecast?.maxtempC ? forecast.maxtempC + '°C' : '',
        low: forecast?.mintempC ? forecast.mintempC + '°C' : '',
        date: forecast?.date || new Date().toISOString().split('T')[0]
      }
      
      console.log(`[Spirit] 天气查询完成: ${weather.city} ${weather.temperature}`)
      return { success: true, weather }
    } catch (error) {
      console.error('[Spirit] 天气查询失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // ==================== 自动更新 ====================
  
  // 手动检查更新
  ipcMain.handle('check-for-updates', async () => {
    try {
      console.log('[Spirit] 手动检查更新...')
      const result = await autoUpdater.checkForUpdates()
      return { 
        success: true, 
        currentVersion: app.getVersion(),
        updateInfo: result?.updateInfo 
      }
    } catch (error) {
      return { success: false, error: (error as Error).message, currentVersion: app.getVersion() }
    }
  })

  // 获取当前版本
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // 悬浮精灵快捷操作
  ipcMain.handle('floating-action', async (_, action: string) => {
    console.log('[Spirit] 悬浮精灵操作:', action)
    
    switch (action) {
      case 'chat':
        mainWindow?.show()
        mainWindow?.focus()
        break
      case 'screenshot':
        // 截图提问
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('start-screenshot')
        break
      case 'voice':
        // 语音输入
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('start-voice')
        break
      case 'search':
        // 快速搜索
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('focus-search')
        break
      case 'settings':
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('open-settings')
        break
    }
    
    return { ok: true }
  })

  // 获取新闻（使用 RSS）
  ipcMain.handle('web-news', async (_, topic?: string) => {
    try {
      console.log(`[Spirit] 获取新闻: ${topic || '头条'}`)
      
      // 使用百度新闻 RSS
      const rssUrl = topic 
        ? `https://news.baidu.com/n?cmd=1&class=${encodeURIComponent(topic)}&rn=20&format=rss`
        : 'https://news.baidu.com/n?cmd=1&class=civilnews&rn=20&format=rss'
      
      const response = await fetch(rssUrl, {
        headers: { 'User-Agent': 'Spirit-One/1.0' },
        signal: AbortSignal.timeout(10000)
      })
      
      const xml = await response.text()
      
      // 简单解析 RSS
      const items: Array<{ title: string; link: string; description: string }> = []
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
      
      for (const match of itemMatches) {
        const itemXml = match[1]
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                      itemXml.match(/<title>(.*?)<\/title>/)?.[1] || ''
        const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                           itemXml.match(/<description>(.*?)<\/description>/)?.[1] || ''
        
        if (title) {
          items.push({ title, link, description: description.replace(/<[^>]+>/g, '').slice(0, 200) })
        }
      }
      
      console.log(`[Spirit] 新闻获取完成: ${items.length} 条`)
      return { success: true, news: items.slice(0, 10) }
    } catch (error) {
      console.error('[Spirit] 新闻获取失败:', error)
      return { success: false, error: (error as Error).message, news: [] }
    }
  })

  // ==================== Moltbot Agent 能力 ====================
  
  // 初始化 Moltbot
  ipcMain.handle('moltbot-init', async () => {
    return initMoltbot()
  })
  
  // Moltbot 状态
  ipcMain.handle('moltbot-status', () => {
    return { 
      ready: moltbotReady,
      path: MOLTBOT_PATH
    }
  })
  
  // 调用 Moltbot 命令
  ipcMain.handle('moltbot-call', async (_, command: string, args?: string[]) => {
    return callMoltbot(command, args)
  })
  
  // Bash 执行
  ipcMain.handle('moltbot-bash', async (_, command: string, cwd?: string) => {
    return moltbotBashExec(command, cwd)
  })
}

// ==================== Moltbot Agent 集成 ====================
// 注意：工具能力由 Moltbot 提供，不再需要手动定义

// executeToolCall 已删除 - 工具执行由 Moltbot 处理

/**
 * 构建 Moltbot 环境变量
 * 根据用户配置的提供商设置对应的 API Key
 */
function buildMoltbotEnv(provider: string, apiKey: string): NodeJS.ProcessEnv {
  const env = { ...process.env }
  
  // 确保 PATH 包含常见的 Node.js 路径
  env.PATH = getEnhancedPath()
  
  switch (provider) {
    case 'siliconflow':
      // 硅基流动 - 设置为 siliconflow provider 的 API Key
      // 同时设置 OPENAI 兼容变量作为后备
      env.SILICONFLOW_API_KEY = apiKey
      env.OPENAI_API_KEY = apiKey
      env.OPENAI_BASE_URL = 'https://api.siliconflow.cn/v1'
      break
    case 'openrouter':
      env.OPENROUTER_API_KEY = apiKey
      break
    case 'openai':
      env.OPENAI_API_KEY = apiKey
      break
    case 'anthropic':
      env.ANTHROPIC_API_KEY = apiKey
      break
    case 'deepseek':
      env.DEEPSEEK_API_KEY = apiKey
      break
    case 'moonshot':
      env.OPENAI_API_KEY = apiKey
      env.OPENAI_BASE_URL = 'https://api.moonshot.cn/v1'
      break
    default:
      // 默认当作 OpenAI 兼容接口
      env.OPENAI_API_KEY = apiKey
  }
  
  return env
}

/**
 * 调用 Moltbot Agent
 * 通过子进程调用 moltbot agent 命令
 */
async function callAI(message: string, provider: string, apiKey: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
  toolCalls?: Array<{ name: string; args: Record<string, string>; result: string }>;
}> {
  console.log('[Spirit] 调用 Moltbot Agent...')
  console.log('[Spirit] Provider:', provider)
  console.log('[Spirit] Message:', message.slice(0, 100) + (message.length > 100 ? '...' : ''))
  
  // 检查 Moltbot 是否就绪
  if (!moltbotReady) {
    console.log('[Spirit] Moltbot 未就绪，尝试初始化...')
    const initResult = await initMoltbot()
    if (!initResult.ok) {
      return { success: false, error: `Moltbot 未就绪: ${initResult.error}` }
    }
  }
  
  const moltbotMjs = join(MOLTBOT_PATH, 'moltbot.mjs')
  
  if (!existsSync(moltbotMjs)) {
    return { success: false, error: 'Moltbot 未安装' }
  }
  
  // 配置 Moltbot 认证（关键！Moltbot 读取 auth-profiles.json 而不是环境变量）
  const authResult = configureMoltbotAuth(provider, apiKey)
  if (!authResult.ok) {
    console.error('[Spirit] 认证配置失败:', authResult.error)
    // 继续尝试，可能已有配置
  }
  
  return new Promise((resolve) => {
    try {
      // 构建环境变量（作为备用）
      const env = buildMoltbotEnv(provider, apiKey)
      
      // 每次启动精灵使用新 session，避免"记得但看不到"的问题
      // 如果需要连续对话，应该在 UI 层面加载历史消息
      const sessionId = `spirit-${Date.now()}`
      
      // 调用 Moltbot Agent
      const args = [
        moltbotMjs,
        'agent',
        '--agent', 'main',
        '--session-id', sessionId,  // 每次新 session，避免缓存
        '--message', message,
        '--local',  // 本地模式
        '--json'    // JSON 输出
      ]
      
      console.log('[Spirit] 执行:', 'node', args.join(' ').slice(0, 100) + '...')
      
      const proc = spawn('node', args, {
        cwd: MOLTBOT_PATH,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let stdout = ''
      let stderr = ''
      
      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })
      
      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
        // 打印 stderr 以便调试
        console.log('[Moltbot stderr]:', data.toString().trim())
      })
      
      proc.on('close', (code) => {
        console.log('[Spirit] Moltbot 退出码:', code)
        
        if (code === 0 && stdout) {
          try {
            // 从输出中提取 JSON（Moltbot 输出可能包含 Doctor warnings 等前缀）
            const jsonMatch = stdout.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
              console.log('[Spirit] 无法找到 JSON 输出')
              resolve({ success: true, content: stdout.trim() || '已完成' })
              return
            }
            
            const result = JSON.parse(jsonMatch[0]) as {
              ok?: boolean;
              payloads?: Array<{ text?: string; mediaUrls?: string[] }>;
              summary?: string;
              error?: string;
            }
            
            // 提取回复内容（payloads 存在即为成功）
            const content = result.payloads?.[0]?.text || result.summary || 'Moltbot 已完成任务。'
            console.log('[Spirit] Moltbot 成功:', content.slice(0, 200) + (content.length > 200 ? '...' : ''))
            resolve({ success: true, content })
            
          } catch (parseError) {
            // JSON 解析失败，可能是非 JSON 输出
            console.log('[Spirit] JSON 解析失败:', parseError)
            resolve({ success: true, content: stdout.trim() || '已完成' })
          }
        } else {
          // 执行失败
          const errorMsg = stderr || `Moltbot 退出码: ${code}`
          console.error('[Spirit] Moltbot 失败:', errorMsg)
          resolve({ success: false, error: errorMsg })
        }
      })
      
      proc.on('error', (err) => {
        console.error('[Spirit] Moltbot 进程错误:', err)
        resolve({ success: false, error: err.message })
      })
      
      // 2 分钟超时
      setTimeout(() => {
        proc.kill()
        resolve({ success: false, error: '执行超时（2分钟）' })
      }, 120000)
      
    } catch (error) {
      console.error('[Spirit] 调用 Moltbot 异常:', error)
      resolve({ success: false, error: (error as Error).message })
    }
  })
}

// 扩展 app 类型
declare module 'electron' {
  interface App {
    isQuitting: boolean
  }
}

app.isQuitting = false

// ==================== 自动更新配置 ====================
function setupAutoUpdater(): void {
  // 配置更新源（GitHub Releases）
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'spiritbot1',
    repo: 'spiritbot'
  })

  // 检查更新出错
  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] 检查更新失败:', error)
  })

  // 检查到更新
  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] 发现新版本:', info.version)
    
    // 发送通知
    if (Notification.isSupported()) {
      new Notification({
        title: '🌱 精灵1号有新版本',
        body: `发现新版本 ${info.version}，正在下载...`,
        icon: nativeImage.createEmpty()
      }).show()
    }
    
    // 通知渲染进程
    mainWindow?.webContents.send('update-available', info)
  })

  // 没有更新
  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] 当前已是最新版本')
  })

  // 下载进度
  autoUpdater.on('download-progress', (progress) => {
    console.log(`[AutoUpdater] 下载进度: ${Math.round(progress.percent)}%`)
    mainWindow?.webContents.send('update-progress', progress)
  })

  // 下载完成
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] 更新下载完成:', info.version)
    
    // 显示通知
    if (Notification.isSupported()) {
      new Notification({
        title: '🎉 更新已就绪',
        body: `新版本 ${info.version} 已下载完成，重启后生效`,
        icon: nativeImage.createEmpty()
      }).show()
    }
    
    // 通知渲染进程
    mainWindow?.webContents.send('update-downloaded', info)
    
    // 询问用户是否立即重启
    dialog.showMessageBox({
      type: 'info',
      title: '更新已就绪',
      message: `精灵1号 ${info.version} 已下载完成`,
      detail: '重启应用以完成更新？',
      buttons: ['立即重启', '稍后'],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  // 延迟检查更新（启动 5 秒后）
  setTimeout(() => {
    console.log('[AutoUpdater] 开始检查更新...')
    autoUpdater.checkForUpdates().catch(err => {
      console.error('[AutoUpdater] 检查更新失败:', err)
    })
  }, 5000)
}

// 应用准备就绪
app.whenReady().then(() => {
  // 初始化配置存储
  initStore()
  
  // 设置 app 用户模型 ID（Windows）
  electronApp.setAppUserModelId('com.spiritone.desktop')

  // 开发模式下按 F12 打开 DevTools
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 🌸 注入精灵灵魂（首先执行）
  const soulResult = injectSpiritSoul()
  if (soulResult.ok) {
    console.log('[Spirit] 🌸 精灵灵魂已注入到 Moltbot 工作区')
  } else {
    console.warn('[Spirit] ⚠️ 灵魂注入失败:', soulResult.message)
  }

  // 注册 IPC
  registerIpcHandlers()
  
  // 创建窗口和托盘
  createWindow()
  createTray()
  createFloatingSpirit()  // 创建悬浮精灵
  
  console.log('[Spirit] 精灵1号已启动！')
  
  // 初始化 Moltbot（后台）
  initMoltbot().then((result) => {
    if (result.ok) {
      console.log('[Spirit] ✅ Moltbot Agent 引擎就绪')
      console.log('[Spirit] 🔧 能力: 浏览器自动化、Shell执行、联网搜索、文件操作、记忆系统')
    } else {
      console.warn('[Spirit] ⚠️ Moltbot 初始化失败:', result.error)
      console.log('[Spirit] 💡 提示: 请确保系统已安装 Node.js 20+')
    }
  })
  
  // 设置自动更新（生产环境）
  if (!is.dev) {
    setupAutoUpdater()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

// macOS: 点击 dock 图标时显示窗口
app.on('activate', () => {
  mainWindow?.show()
})

// 所有窗口关闭时
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前
app.on('before-quit', () => {
  app.isQuitting = true
  moltbotReady = false
  // Gateway 由 Moltbot 服务管理，不需要手动停止
})
