/**
 * 精灵1号 桌面版 - 主进程
 * Spirit One Desktop - Main Process
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, dialog, Notification } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
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
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取当前版本
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
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

  // 注册 IPC
  registerIpcHandlers()
  
  // 创建窗口和托盘
  createWindow()
  createTray()
  
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
})
