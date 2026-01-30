/**
 * 精灵1号 桌面版 - Preload 脚本
 * 安全地暴露 API 给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 文件信息类型
interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  isFile?: boolean
  size: number
  created?: string
  modified: string
}

// 精灵1号 API
const spiritAPI = {
  // ==================== 配置 ====================
  getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: unknown) => ipcRenderer.invoke('set-config', key, value),
  getAllConfig: () => ipcRenderer.invoke('get-all-config'),
  
  // ==================== 窗口控制 ====================
  minimize: () => ipcRenderer.invoke('window-minimize'),
  close: () => ipcRenderer.invoke('window-close'),
  togglePin: () => ipcRenderer.invoke('window-toggle-pin'),
  
  // ==================== AI 调用 ====================
  callAI: (params: { message: string; provider?: string; apiKey?: string }) => 
    ipcRenderer.invoke('call-ai', params),
  saveApiKey: (provider: string, apiKey: string) => 
    ipcRenderer.invoke('save-api-key', provider, apiKey),
  
  // ==================== 文件操作 ====================
  fs: {
    // 读取文件
    readFile: (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> =>
      ipcRenderer.invoke('fs-read-file', filePath),
    
    // 写入文件
    writeFile: (filePath: string, content: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('fs-write-file', filePath, content),
    
    // 列出目录
    listDir: (dirPath: string): Promise<{ success: boolean; items?: FileInfo[]; error?: string }> =>
      ipcRenderer.invoke('fs-list-dir', dirPath),
    
    // 获取文件信息
    stat: (filePath: string): Promise<{ success: boolean; info?: FileInfo; error?: string }> =>
      ipcRenderer.invoke('fs-stat', filePath),
    
    // 删除文件
    delete: (filePath: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('fs-delete', filePath),
    
    // 复制文件
    copy: (src: string, dest: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('fs-copy', src, dest),
    
    // 移动/重命名
    move: (src: string, dest: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('fs-move', src, dest),
    
    // 选择文件
    selectFile: (): Promise<string | undefined> =>
      ipcRenderer.invoke('select-file'),
    
    // 选择文件夹
    selectFolder: (): Promise<string | undefined> =>
      ipcRenderer.invoke('select-folder'),
    
    // 获取主目录
    getHomeDir: (): Promise<string> =>
      ipcRenderer.invoke('get-home-dir')
  },
  
  // ==================== Shell 命令 ====================
  shell: {
    // 执行命令
    exec: (command: string, options?: { cwd?: string; timeout?: number }): Promise<{
      success: boolean;
      stdout?: string;
      stderr?: string;
      error?: string;
    }> => ipcRenderer.invoke('shell-exec', command, options),
    
    // 打开文件/文件夹
    openPath: (filePath: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('shell-open-path', filePath),
    
    // 在终端中打开
    openTerminal: (dirPath?: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('shell-open-terminal', dirPath),
    
    // 打开外部链接
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
  },
  
  // ==================== 系统信息 ====================
  system: {
    // 获取系统信息
    getInfo: (): Promise<{
      platform: string;
      hostname: string;
      homeDir: string;
      cpus: number;
      totalMemory: string;
      freeMemory: string;
      nodeVersion: string;
      electronVersion: string;
    }> => ipcRenderer.invoke('system-info'),
    
    // 获取应用版本
    getVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version')
  },

  // ==================== 联网能力 ====================
  web: {
    // 联网搜索
    search: (query: string): Promise<{
      success: boolean;
      results?: Array<{ title: string; snippet: string; url: string }>;
      query?: string;
      error?: string;
    }> => ipcRenderer.invoke('web-search', query),

    // 抓取网页内容
    fetch: (url: string): Promise<{
      success: boolean;
      title?: string;
      content?: string;
      url?: string;
      error?: string;
    }> => ipcRenderer.invoke('web-fetch', url),

    // 查询真实天气
    weather: (city: string): Promise<{
      success: boolean;
      weather?: {
        city: string;
        country: string;
        temperature: string;
        feelsLike: string;
        humidity: string;
        description: string;
        wind: string;
        uvIndex: string;
        high: string;
        low: string;
        date: string;
      };
      error?: string;
    }> => ipcRenderer.invoke('web-weather', city),

    // 获取新闻
    news: (topic?: string): Promise<{
      success: boolean;
      news?: Array<{ title: string; link: string; description: string }>;
      error?: string;
    }> => ipcRenderer.invoke('web-news', topic)
  },
  
  // ==================== 工具 ====================
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  selectFile: () => ipcRenderer.invoke('select-file'),
  checkFirstLaunch: () => ipcRenderer.invoke('check-first-launch'),
  
  // ==================== Moltbot Agent 引擎（完整能力）====================
  moltbot: {
    // 初始化
    init: (): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke('moltbot-init'),
    
    // 状态
    status: (): Promise<{ ready: boolean; path: string }> =>
      ipcRenderer.invoke('moltbot-status'),
    
    // 调用 Moltbot 命令
    call: (command: string, args?: string[]): Promise<{
      ok: boolean;
      output?: string;
      error?: string;
    }> => ipcRenderer.invoke('moltbot-call', command, args),
    
    // Bash 执行
    bash: (command: string, cwd?: string): Promise<{
      ok: boolean;
      stdout?: string;
      stderr?: string;
      error?: string;
    }> => ipcRenderer.invoke('moltbot-bash', command, cwd),
    
    // 事件
    onReady: (callback: () => void) => {
      ipcRenderer.on('moltbot-ready', callback)
      return () => ipcRenderer.removeListener('moltbot-ready', callback)
    }
  },
  
  // ==================== 事件监听 ====================
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', callback)
    return () => ipcRenderer.removeListener('open-settings', callback)
  },
  onOpenStats: (callback: () => void) => {
    ipcRenderer.on('open-stats', callback)
    return () => ipcRenderer.removeListener('open-stats', callback)
  }
}

// 暴露 API
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('spirit', spiritAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.spirit = spiritAPI
}
