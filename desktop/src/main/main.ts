/**
 * 精灵1号 桌面版 - 主进程
 * Spirit One Desktop - Main Process
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, dialog } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join, resolve, basename, dirname } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync, renameSync } from 'fs'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { homedir, platform, hostname, cpus, totalmem, freemem } from 'os'

const execAsync = promisify(exec)

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
        shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/zsh'
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
}

/**
 * 调用 AI API
 */
async function callAI(message: string, provider: string, apiKey: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  const endpoints: Record<string, string> = {
    siliconflow: 'https://api.siliconflow.cn/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    moonshot: 'https://api.moonshot.cn/v1/chat/completions'
  }
  
  const models: Record<string, string> = {
    siliconflow: 'deepseek-ai/DeepSeek-V3',
    deepseek: 'deepseek-chat',
    openai: 'gpt-4o-mini',
    moonshot: 'moonshot-v1-8k'
  }
  
  const spiritName = initStore().get('spiritName') as string
  const url = endpoints[provider] || endpoints.siliconflow
  const model = models[provider] || models.siliconflow
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `你是${spiritName}，一个友好、智能的数字精灵伙伴。你的回复要简洁、有帮助、有温度。`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1024
    })
  })
  
  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  }
  
  if (data.choices?.[0]?.message?.content) {
    return { success: true, content: data.choices[0].message.content }
  }
  
  return { success: false, error: data.error?.message || '调用失败' }
}

// 扩展 app 类型
declare module 'electron' {
  interface App {
    isQuitting: boolean
  }
}

app.isQuitting = false

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

  // 注册 IPC
  registerIpcHandlers()
  
  // 创建窗口和托盘
  createWindow()
  createTray()

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
})
