/**
 * 精灵1号 桌面版 - Preload 脚本
 * 安全地暴露 API 给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 精灵1号 API
const spiritAPI = {
  // 配置
  getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: unknown) => ipcRenderer.invoke('set-config', key, value),
  getAllConfig: () => ipcRenderer.invoke('get-all-config'),
  
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window-minimize'),
  close: () => ipcRenderer.invoke('window-close'),
  togglePin: () => ipcRenderer.invoke('window-toggle-pin'),
  
  // AI 调用
  callAI: (params: { message: string; provider?: string; apiKey?: string }) => 
    ipcRenderer.invoke('call-ai', params),
  
  // API Key 管理
  saveApiKey: (provider: string, apiKey: string) => 
    ipcRenderer.invoke('save-api-key', provider, apiKey),
  
  // 工具
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  selectFile: () => ipcRenderer.invoke('select-file'),
  checkFirstLaunch: () => ipcRenderer.invoke('check-first-launch'),
  
  // 事件监听
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
