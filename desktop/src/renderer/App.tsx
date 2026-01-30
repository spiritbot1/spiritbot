/**
 * 精灵1号 桌面版 - 主应用组件
 * 具备文件操作、命令执行、AI对话等能力
 */

import React, { useState, useEffect, useRef } from 'react'

// 精灵形象配置
const SPIRIT_STYLES = {
  cute: { emoji: '🌱', name: '萌系', color: '#4ade80' },
  tech: { emoji: '⚡', name: '科技', color: '#60a5fa' },
  warm: { emoji: '☁️', name: '治愈', color: '#f472b6' },
  playful: { emoji: '🎈', name: '活泼', color: '#fb923c' },
  mecha: { emoji: '🤖', name: '机甲', color: '#a78bfa' },
  dream: { emoji: '💫', name: '梦幻', color: '#fbbf24' }
}

// AI 服务商配置
const AI_PROVIDERS = [
  { id: 'siliconflow', name: '硅基流动', placeholder: 'sk-...' },
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...' },
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'moonshot', name: '月之暗面', placeholder: 'sk-...' }
]

// 文件信息类型
interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string
}

interface Message {
  id: string
  role: 'user' | 'spirit' | 'system'
  content: string
  timestamp: Date
  type?: 'text' | 'code' | 'file-list' | 'system-info'
  data?: unknown
}

interface Config {
  spiritName: string
  spiritStyle: keyof typeof SPIRIT_STYLES
  speechStyle: string
  aiProvider: string
  apiKeys: Record<string, string>
  isFirstLaunch: boolean
}

interface SystemInfo {
  platform: string
  hostname: string
  homeDir: string
  cpus: number
  totalMemory: string
  freeMemory: string
  nodeVersion: string
  electronVersion: string
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
      // 文件操作
      fs: {
        readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>
        writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>
        listDir: (path: string) => Promise<{ success: boolean; items?: FileInfo[]; error?: string }>
        stat: (path: string) => Promise<{ success: boolean; info?: FileInfo; error?: string }>
        delete: (path: string) => Promise<{ success: boolean; error?: string }>
        copy: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>
        move: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>
        selectFile: () => Promise<string | undefined>
        selectFolder: () => Promise<string | undefined>
        getHomeDir: () => Promise<string>
      }
      // Shell 命令
      shell: {
        exec: (cmd: string, options?: { cwd?: string; timeout?: number }) => Promise<{
          success: boolean; stdout?: string; stderr?: string; error?: string
        }>
        openPath: (path: string) => Promise<{ success: boolean; error?: string }>
        openTerminal: (path?: string) => Promise<{ success: boolean; error?: string }>
        openExternal: (url: string) => Promise<void>
      }
      // 系统信息
      system: {
        getInfo: () => Promise<SystemInfo>
      }
      // 联网能力
      web: {
        search: (query: string) => Promise<{
          success: boolean
          results?: Array<{ title: string; snippet: string; url: string }>
          query?: string
          error?: string
        }>
        fetch: (url: string) => Promise<{
          success: boolean
          title?: string
          content?: string
          url?: string
          error?: string
        }>
        weather: (city: string) => Promise<{
          success: boolean
          weather?: {
            city: string
            country: string
            temperature: string
            feelsLike: string
            humidity: string
            description: string
            wind: string
            uvIndex: string
            high: string
            low: string
            date: string
          }
          error?: string
        }>
        news: (topic?: string) => Promise<{
          success: boolean
          news?: Array<{ title: string; link: string; description: string }>
          error?: string
        }>
      }
    }
  }
}

export default function App() {
  // 状态
  const [view, setView] = useState<'chat' | 'welcome' | 'settings' | 'tools'>('chat')
  const [config, setConfig] = useState<Config | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  
  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // 初始化
  useEffect(() => {
    loadConfig()
    loadSystemInfo()
    
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
      
      // 获取主目录
      const homeDir = await window.spirit.fs.getHomeDir()
      setCurrentPath(homeDir)
      
      // 检查首次启动
      const isFirst = await window.spirit.checkFirstLaunch()
      if (isFirst || !allConfig.apiKeys || Object.keys(allConfig.apiKeys).length === 0) {
        setView('welcome')
      } else {
        // 添加欢迎消息
        const spiritStyle = SPIRIT_STYLES[allConfig.spiritStyle] || SPIRIT_STYLES.cute
        addMessage('spirit', `${spiritStyle.emoji} 你好呀！我是${allConfig.spiritName}，现在我能帮你操作文件、执行命令、浏览网页啦！有什么可以帮你的吗？`)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  // 加载系统信息
  const loadSystemInfo = async () => {
    try {
      const info = await window.spirit.system.getInfo()
      setSystemInfo(info)
    } catch (error) {
      console.error('获取系统信息失败:', error)
    }
  }
  
  // 添加消息
  const addMessage = (role: 'user' | 'spirit' | 'system', content: string, type: Message['type'] = 'text', data?: unknown) => {
    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date(),
      type,
      data
    }
    setMessages(prev => [...prev, message])
  }

  // 解析并执行命令
  const parseAndExecuteCommand = async (text: string): Promise<boolean> => {
    const lowerText = text.toLowerCase()
    
    // 文件操作命令
    if (lowerText.startsWith('ls ') || lowerText.startsWith('列出 ') || lowerText.startsWith('查看目录 ')) {
      const path = text.replace(/^(ls |列出 |查看目录 )/i, '').trim() || currentPath
      const result = await window.spirit.fs.listDir(path)
      if (result.success && result.items) {
        setFiles(result.items)
        const dirs = result.items.filter(f => f.isDirectory).length
        const fileCount = result.items.length - dirs
        addMessage('spirit', `📂 ${path}\n\n找到 ${dirs} 个文件夹，${fileCount} 个文件`, 'file-list', result.items)
      } else {
        addMessage('spirit', `❌ 无法访问: ${result.error}`)
      }
      return true
    }
    
    // 读取文件
    if (lowerText.startsWith('cat ') || lowerText.startsWith('读取 ') || lowerText.startsWith('查看文件 ')) {
      const path = text.replace(/^(cat |读取 |查看文件 )/i, '').trim()
      const result = await window.spirit.fs.readFile(path)
      if (result.success && result.content) {
        const preview = result.content.length > 2000 
          ? result.content.substring(0, 2000) + '\n...(内容过长，已截断)'
          : result.content
        addMessage('spirit', `📄 **${path}**\n\n\`\`\`\n${preview}\n\`\`\``, 'code')
      } else {
        addMessage('spirit', `❌ 无法读取: ${result.error}`)
      }
      return true
    }
    
    // 执行命令
    if (lowerText.startsWith('run ') || lowerText.startsWith('执行 ') || lowerText.startsWith('$ ')) {
      const cmd = text.replace(/^(run |执行 |\$ )/i, '').trim()
      addMessage('system', `⚡ 执行命令: ${cmd}`)
      const result = await window.spirit.shell.exec(cmd, { cwd: currentPath })
      if (result.success) {
        const output = result.stdout || '(无输出)'
        addMessage('spirit', `✅ 命令执行完成\n\n\`\`\`\n${output}\n\`\`\``, 'code')
      } else {
        addMessage('spirit', `❌ 执行失败: ${result.error}\n${result.stderr || ''}`)
      }
      return true
    }
    
    // cd 命令
    if (lowerText.startsWith('cd ')) {
      const path = text.replace(/^cd /i, '').trim()
      const newPath = path.startsWith('/') || path.startsWith('~') 
        ? path 
        : `${currentPath}/${path}`
      const result = await window.spirit.fs.listDir(newPath)
      if (result.success) {
        setCurrentPath(newPath.replace('~', systemInfo?.homeDir || ''))
        addMessage('spirit', `📂 切换到: ${newPath}`)
      } else {
        addMessage('spirit', `❌ 无法进入: ${result.error}`)
      }
      return true
    }
    
    // 打开文件/网址
    if (lowerText.startsWith('open ') || lowerText.startsWith('打开 ')) {
      const target = text.replace(/^(open |打开 )/i, '').trim()
      if (target.startsWith('http://') || target.startsWith('https://')) {
        await window.spirit.shell.openExternal(target)
        addMessage('spirit', `🌐 已打开网址: ${target}`)
      } else {
        await window.spirit.shell.openPath(target)
        addMessage('spirit', `📂 已打开: ${target}`)
      }
      return true
    }
    
    // 系统信息
    if (lowerText.includes('系统信息') || lowerText.includes('system info')) {
      const info = await window.spirit.system.getInfo()
      addMessage('spirit', `💻 **系统信息**

| 项目 | 信息 |
|------|------|
| 系统 | ${info.platform} |
| 主机名 | ${info.hostname} |
| CPU | ${info.cpus} 核 |
| 内存 | ${info.freeMemory} / ${info.totalMemory} |
| Node | ${info.nodeVersion} |
| Electron | ${info.electronVersion} |`, 'system-info')
      return true
    }

    // ==================== 联网能力 ====================
    
    // 联网搜索
    if (lowerText.startsWith('搜索 ') || lowerText.startsWith('search ') || lowerText.startsWith('查询 ')) {
      const query = text.replace(/^(搜索 |search |查询 )/i, '').trim()
      addMessage('system', `🔍 正在搜索: ${query}`)
      const result = await window.spirit.web.search(query)
      if (result.success && result.results && result.results.length > 0) {
        let content = `🔍 **搜索结果: ${query}**\n\n`
        result.results.slice(0, 5).forEach((item, i) => {
          content += `**${i + 1}. ${item.title}**\n${item.snippet.slice(0, 150)}...\n${item.url ? `🔗 ${item.url}\n` : ''}\n`
        })
        addMessage('spirit', content)
      } else {
        addMessage('spirit', `🔍 没有找到关于 "${query}" 的结果，试试换个关键词？`)
      }
      return true
    }

    // 天气查询
    if (lowerText.startsWith('天气 ') || lowerText.startsWith('weather ') || 
        lowerText.includes('天气怎么样') || lowerText.includes('天气如何')) {
      let city = text.replace(/^(天气 |weather )/i, '').replace(/(天气怎么样|天气如何|的天气)/g, '').trim()
      if (!city || city.length < 2) city = '北京'
      
      addMessage('system', `🌤 正在查询 ${city} 天气...`)
      const result = await window.spirit.web.weather(city)
      
      if (result.success && result.weather) {
        const w = result.weather
        addMessage('spirit', `🌤 **${w.city} 实时天气** (${w.date})

| 项目 | 数据 |
|------|------|
| 天气 | ${w.description} |
| 温度 | ${w.temperature} (体感 ${w.feelsLike}) |
| 最高/最低 | ${w.high} / ${w.low} |
| 湿度 | ${w.humidity} |
| 风力 | ${w.wind} |
| 紫外线 | ${w.uvIndex} |

*数据来源: wttr.in (实时更新)*`)
      } else {
        addMessage('spirit', `❌ 无法获取 ${city} 的天气: ${result.error}`)
      }
      return true
    }

    // 新闻
    if (lowerText.startsWith('新闻') || lowerText.startsWith('news') || lowerText.includes('今日头条')) {
      const topic = text.replace(/^(新闻 |news |今日头条)/i, '').trim()
      addMessage('system', `📰 正在获取${topic ? topic + '相关' : ''}新闻...`)
      const result = await window.spirit.web.news(topic || undefined)
      
      if (result.success && result.news && result.news.length > 0) {
        let content = `📰 **${topic ? topic + '相关' : '今日'}新闻**\n\n`
        result.news.slice(0, 8).forEach((item, i) => {
          content += `**${i + 1}. ${item.title}**\n${item.description.slice(0, 80)}...\n\n`
        })
        addMessage('spirit', content)
      } else {
        addMessage('spirit', `📰 暂时无法获取新闻，请稍后再试`)
      }
      return true
    }

    // 网页抓取
    if (lowerText.startsWith('抓取 ') || lowerText.startsWith('fetch ') || lowerText.startsWith('获取网页 ')) {
      const url = text.replace(/^(抓取 |fetch |获取网页 )/i, '').trim()
      if (!url.startsWith('http')) {
        addMessage('spirit', `❌ 请输入完整的网址，例如: \`抓取 https://example.com\``)
        return true
      }
      
      addMessage('system', `🌐 正在抓取网页: ${url}`)
      const result = await window.spirit.web.fetch(url)
      
      if (result.success && result.content) {
        const preview = result.content.slice(0, 1500)
        addMessage('spirit', `🌐 **${result.title}**\n\n${preview}...\n\n*来源: ${url}*`)
      } else {
        addMessage('spirit', `❌ 无法抓取网页: ${result.error}`)
      }
      return true
    }
    
    // 帮助
    if (lowerText === 'help' || lowerText === '帮助' || lowerText === '?') {
      addMessage('spirit', `🌱 **精灵1号能力列表**

**🌐 联网能力** ✨新增
- \`搜索 <关键词>\` - 联网搜索信息
- \`天气 <城市>\` - 查询真实天气
- \`新闻\` - 获取今日新闻
- \`抓取 <网址>\` - 获取网页内容

**📂 文件操作**
- \`ls <路径>\` - 列出目录内容
- \`cd <路径>\` - 切换目录
- \`cat <文件>\` - 读取文件内容
- \`open <路径/网址>\` - 打开文件或网址

**⚡ 命令执行**
- \`$ <命令>\` 或 \`run <命令>\` - 执行Shell命令

**💻 系统**
- \`系统信息\` - 查看系统状态

**💬 AI 对话**
- 直接输入问题即可与我对话！

当前目录: \`${currentPath}\``)
      return true
    }
    
    return false
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
      // 先尝试解析命令
      const isCommand = await parseAndExecuteCommand(text)
      
      if (!isCommand) {
        // 不是命令，调用 AI
        const result = await window.spirit.callAI({ message: text })
        
        if (result.success && result.content) {
          addMessage('spirit', result.content)
        } else {
          const spiritStyle = config ? SPIRIT_STYLES[config.spiritStyle] : SPIRIT_STYLES.cute
          addMessage('spirit', `${spiritStyle.emoji} 哎呀，${result.error || '出了点问题'}...`)
        }
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
      addMessage('spirit', `${spiritStyle.emoji} 太好了！我是${config.spiritName}，现在我可以帮你：

📂 **操作文件** - 读写、复制、移动文件
⚡ **执行命令** - 运行任何 Shell 命令  
🌐 **浏览网页** - 打开网站、搜索信息
🤖 **AI对话** - 回答问题、写代码、翻译

输入 \`help\` 或 \`帮助\` 查看完整能力列表！`)
    }
    setView('chat')
  }

  // 快捷操作
  const quickActions = [
    { icon: '🔍', label: '搜索', action: () => setInputValue('搜索 ') },
    { icon: '🌤', label: '天气', action: () => setInputValue('天气 北京') },
    { icon: '📰', label: '新闻', action: () => setInputValue('新闻') },
    { icon: '📂', label: '文件', action: () => setInputValue('ls ~/Desktop') },
    { icon: '⚡', label: '终端', action: async () => { await window.spirit.shell.openTerminal(currentPath) } },
    { icon: '❓', label: '帮助', action: () => setInputValue('help') },
  ]
  
  // 获取精灵信息
  const spiritStyle = config ? SPIRIT_STYLES[config.spiritStyle] || SPIRIT_STYLES.cute : SPIRIT_STYLES.cute
  const spiritName = config?.spiritName || '小精灵'
  
  return (
    <div className="app-container">
      {/* 标题栏 */}
      <div className="title-bar drag-region">
        <div className="title-bar-left">
          <div className="spirit-avatar" style={{ background: `linear-gradient(135deg, ${spiritStyle.color}, ${spiritStyle.color}88)` }}>
            {spiritStyle.emoji}
          </div>
          <div className="title-info">
            <span className="spirit-name">{spiritName}</span>
            <span className="spirit-status">在线 · {systemInfo?.platform || '...'}</span>
          </div>
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
          <button className="title-btn close-btn" onClick={handleClose} title="隐藏">
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
            你的智能数字伙伴，可以帮你操作文件、执行命令、浏览网页
          </p>
          <div className="welcome-features">
            <div className="feature-item">📂 文件操作</div>
            <div className="feature-item">⚡ 命令执行</div>
            <div className="feature-item">🌐 网页浏览</div>
            <div className="feature-item">🤖 AI 对话</div>
          </div>
          <button className="primary-btn" onClick={() => setView('settings')}>
            ⚙️ 配置 API Key 开始使用
          </button>
        </div>
      )}
      
      {/* 聊天页面 */}
      {view === 'chat' && (
        <div className="chat-container">
          {/* 快捷操作栏 */}
          <div className="quick-actions">
            {quickActions.map((action, i) => (
              <button key={i} className="quick-btn" onClick={action.action} title={action.label}>
                {action.icon}
              </button>
            ))}
            <div className="current-path" title={currentPath}>
              📍 {currentPath.split('/').slice(-2).join('/')}
            </div>
          </div>
          
          <div className="messages-area">
            {messages.map(msg => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className={`message-bubble ${msg.type === 'code' ? 'code-block' : ''}`}>
                  {msg.type === 'file-list' && msg.data ? (
                    <div className="file-list">
                      {(msg.data as FileInfo[]).slice(0, 20).map((file, i) => (
                        <div 
                          key={i} 
                          className="file-item"
                          onClick={() => {
                            if (file.isDirectory) {
                              setInputValue(`cd ${file.path}`)
                            } else {
                              setInputValue(`cat ${file.path}`)
                            }
                          }}
                        >
                          <span className="file-icon">{file.isDirectory ? '📁' : '📄'}</span>
                          <span className="file-name">{file.name}</span>
                          {!file.isDirectory && (
                            <span className="file-size">{formatSize(file.size)}</span>
                          )}
                        </div>
                      ))}
                      {(msg.data as FileInfo[]).length > 20 && (
                        <div className="file-item more">还有 {(msg.data as FileInfo[]).length - 20} 个文件...</div>
                      )}
                    </div>
                  ) : (
                    <div className="message-content">{formatMessage(msg.content)}</div>
                  )}
                </div>
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
                placeholder={`输入命令或问题... (help 查看能力)`}
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
                    style={{ '--accent-color': style.color } as React.CSSProperties}
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
                💡 至少配置一个 API Key 即可使用 AI 对话功能
              </p>
            </div>

            {/* 系统信息 */}
            {systemInfo && (
              <div className="settings-section">
                <div className="settings-title">💻 系统信息</div>
                <div className="system-info-grid">
                  <div className="info-item">
                    <span className="info-label">系统</span>
                    <span className="info-value">{systemInfo.platform}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">CPU</span>
                    <span className="info-value">{systemInfo.cpus} 核</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">内存</span>
                    <span className="info-value">{systemInfo.freeMemory} / {systemInfo.totalMemory}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Electron</span>
                    <span className="info-value">{systemInfo.electronVersion}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 返回聊天 */}
            <button 
              className="primary-btn" 
              onClick={startChat}
              style={{ width: '100%', marginTop: 16 }}
            >
              ✅ 保存并开始使用
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
}

// 格式化消息（简单的 Markdown 支持）
function formatMessage(content: string): React.ReactNode {
  // 代码块
  if (content.includes('```')) {
    const parts = content.split(/(```[\s\S]*?```)/g)
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/g, '').replace(/```$/g, '')
        return <pre key={i} className="code-pre">{code}</pre>
      }
      return <span key={i}>{formatInline(part)}</span>
    })
  }
  return formatInline(content)
}

// 格式化内联元素
function formatInline(text: string): React.ReactNode {
  // 粗体
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    // 行内代码
    if (part.includes('`')) {
      const codeParts = part.split(/(`[^`]+`)/g)
      return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`')) {
          return <code key={`${i}-${j}`} className="inline-code">{cp.slice(1, -1)}</code>
        }
        return cp
      })
    }
    return part
  })
}
