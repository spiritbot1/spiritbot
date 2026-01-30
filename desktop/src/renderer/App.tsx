/**
 * 精灵1号 桌面版 - 主应用组件
 */

import React, { useState, useEffect, useRef } from 'react'

// 精灵形象配置
const SPIRIT_STYLES = {
  cute: { emoji: '🌱', name: '萌系' },
  tech: { emoji: '⚡', name: '科技' },
  warm: { emoji: '☁️', name: '治愈' },
  playful: { emoji: '🎈', name: '活泼' },
  mecha: { emoji: '🤖', name: '机甲' },
  dream: { emoji: '💫', name: '梦幻' }
}

// AI 服务商配置
const AI_PROVIDERS = [
  { id: 'siliconflow', name: '硅基流动', placeholder: 'sk-...' },
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...' },
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'moonshot', name: '月之暗面', placeholder: 'sk-...' }
]

interface Message {
  id: string
  role: 'user' | 'spirit'
  content: string
  timestamp: Date
}

interface Config {
  spiritName: string
  spiritStyle: keyof typeof SPIRIT_STYLES
  speechStyle: string
  aiProvider: string
  apiKeys: Record<string, string>
  isFirstLaunch: boolean
}

// 声明 window.spirit API
declare global {
  interface Window {
    spirit: {
      getConfig: (key: string) => Promise<unknown>
      setConfig: (key: string, value: unknown) => Promise<boolean>
      getAllConfig: () => Promise<Config>
      minimize: () => Promise<void>
      close: () => Promise<void>
      togglePin: () => Promise<boolean>
      callAI: (params: { message: string }) => Promise<{ success: boolean; content?: string; error?: string }>
      saveApiKey: (provider: string, apiKey: string) => Promise<boolean>
      openExternal: (url: string) => Promise<void>
      checkFirstLaunch: () => Promise<boolean>
      onOpenSettings: (callback: () => void) => () => void
      onOpenStats: (callback: () => void) => () => void
    }
  }
}

export default function App() {
  // 状态
  const [view, setView] = useState<'chat' | 'welcome' | 'settings'>('chat')
  const [config, setConfig] = useState<Config | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  
  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // 初始化
  useEffect(() => {
    loadConfig()
    
    // 监听主进程事件
    const unsubSettings = window.spirit.onOpenSettings(() => setView('settings'))
    const unsubStats = window.spirit.onOpenStats(() => {/* 打开统计 */})
    
    return () => {
      unsubSettings()
      unsubStats()
    }
  }, [])
  
  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // 加载配置
  const loadConfig = async () => {
    try {
      const allConfig = await window.spirit.getAllConfig()
      setConfig(allConfig)
      
      // 检查首次启动
      const isFirst = await window.spirit.checkFirstLaunch()
      if (isFirst || !allConfig.apiKeys || Object.keys(allConfig.apiKeys).length === 0) {
        setView('welcome')
      } else {
        // 添加欢迎消息
        const spiritStyle = SPIRIT_STYLES[allConfig.spiritStyle] || SPIRIT_STYLES.cute
        addMessage('spirit', `${spiritStyle.emoji} 你好呀！我是${allConfig.spiritName}，有什么可以帮你的吗？`)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }
  
  // 添加消息
  const addMessage = (role: 'user' | 'spirit', content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }
  
  // 发送消息
  const sendMessage = async () => {
    const text = inputValue.trim()
    if (!text || isTyping) return
    
    // 添加用户消息
    addMessage('user', text)
    setInputValue('')
    setIsTyping(true)
    
    try {
      // 调用 AI
      const result = await window.spirit.callAI({ message: text })
      
      if (result.success && result.content) {
        addMessage('spirit', result.content)
      } else {
        const spiritStyle = config ? SPIRIT_STYLES[config.spiritStyle] : SPIRIT_STYLES.cute
        addMessage('spirit', `${spiritStyle.emoji} 哎呀，${result.error || '出了点问题'}...`)
      }
    } catch (error) {
      addMessage('spirit', '🌱 网络似乎有点问题，请稍后再试~')
    } finally {
      setIsTyping(false)
    }
  }
  
  // 处理按键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  // 窗口控制
  const handleMinimize = () => window.spirit.minimize()
  const handleClose = () => window.spirit.close()
  const handleTogglePin = async () => {
    const newPinned = await window.spirit.togglePin()
    setIsPinned(newPinned)
  }
  
  // 保存设置
  const saveSettings = async (key: string, value: unknown) => {
    await window.spirit.setConfig(key, value)
    setConfig(prev => prev ? { ...prev, [key]: value } : null)
  }
  
  // 保存 API Key
  const saveApiKey = async (provider: string, apiKey: string) => {
    await window.spirit.saveApiKey(provider, apiKey)
    setConfig(prev => {
      if (!prev) return null
      return {
        ...prev,
        apiKeys: { ...prev.apiKeys, [provider]: apiKey }
      }
    })
  }
  
  // 开始聊天
  const startChat = () => {
    if (config) {
      const spiritStyle = SPIRIT_STYLES[config.spiritStyle] || SPIRIT_STYLES.cute
      addMessage('spirit', `${spiritStyle.emoji} 你好呀！我是${config.spiritName}，很高兴认识你！有什么可以帮你的吗？`)
    }
    setView('chat')
  }
  
  // 获取精灵信息
  const spiritStyle = config ? SPIRIT_STYLES[config.spiritStyle] || SPIRIT_STYLES.cute : SPIRIT_STYLES.cute
  const spiritName = config?.spiritName || '小精灵'
  
  return (
    <div className="app-container">
      {/* 标题栏 */}
      <div className="title-bar drag-region">
        <div className="title-bar-left">
          <div className="spirit-avatar">{spiritStyle.emoji}</div>
          <span className="spirit-name">{spiritName}</span>
        </div>
        <div className="title-bar-buttons">
          <button 
            className={`title-btn ${isPinned ? 'pin-active' : ''}`} 
            onClick={handleTogglePin}
            title={isPinned ? '取消置顶' : '置顶'}
          >
            📌
          </button>
          <button className="title-btn" onClick={() => setView('settings')} title="设置">
            ⚙️
          </button>
          <button className="title-btn" onClick={handleMinimize} title="最小化">
            ➖
          </button>
          <button className="title-btn" onClick={handleClose} title="隐藏">
            ✖️
          </button>
        </div>
      </div>
      
      {/* 欢迎页面 */}
      {view === 'welcome' && (
        <div className="welcome-container">
          <div className="welcome-spirit">{spiritStyle.emoji}</div>
          <h1 className="welcome-title">欢迎使用精灵1号！</h1>
          <p className="welcome-subtitle">
            在开始之前，请先配置 AI 服务
          </p>
          <button className="settings-btn" onClick={() => setView('settings')}>
            ⚙️ 配置 API Key
          </button>
        </div>
      )}
      
      {/* 聊天页面 */}
      {view === 'chat' && (
        <div className="chat-container">
          <div className="messages-area">
            {messages.map(msg => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message message-spirit">
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                className="input-field"
                placeholder={`和${spiritName}说点什么...`}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button 
                className="send-btn" 
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 设置页面 */}
      {view === 'settings' && (
        <div className="chat-container">
          <div className="settings-container">
            {/* 精灵设置 */}
            <div className="settings-section">
              <div className="settings-title">🎨 精灵设置</div>
              <div className="settings-item">
                <span className="settings-item-label">精灵名字</span>
                <input
                  className="settings-input"
                  value={config?.spiritName || ''}
                  onChange={e => saveSettings('spiritName', e.target.value)}
                  placeholder="给精灵取个名字"
                />
              </div>
              
              <div className="settings-title" style={{ marginTop: 16 }}>选择形象</div>
              <div className="style-selector">
                {Object.entries(SPIRIT_STYLES).map(([key, style]) => (
                  <div
                    key={key}
                    className={`style-option ${config?.spiritStyle === key ? 'active' : ''}`}
                    onClick={() => saveSettings('spiritStyle', key)}
                  >
                    <div className="style-emoji">{style.emoji}</div>
                    <div className="style-name">{style.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* AI 配置 */}
            <div className="settings-section">
              <div className="settings-title">🤖 AI 服务配置</div>
              {AI_PROVIDERS.map(provider => (
                <div key={provider.id} className="settings-item">
                  <span className="settings-item-label">{provider.name}</span>
                  <input
                    className="settings-input"
                    type="password"
                    value={config?.apiKeys?.[provider.id] || ''}
                    onChange={e => saveApiKey(provider.id, e.target.value)}
                    placeholder={provider.placeholder}
                  />
                </div>
              ))}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                💡 至少配置一个 API Key 即可使用
              </p>
            </div>
            
            {/* 返回聊天 */}
            <button 
              className="settings-btn" 
              onClick={startChat}
              style={{ width: '100%', marginTop: 16 }}
            >
              ✅ 保存并开始聊天
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
