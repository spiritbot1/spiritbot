/**
 * 精灵1号 图标库
 * 专业 SVG 图标，替换所有 emoji
 */

import React from 'react'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

// 精灵头像 (使用 3D 图片)
export const SpiritIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <img 
    src="./spirit-icon.png" 
    alt="精灵" 
    width={size} 
    height={size} 
    className={className}
    style={{ objectFit: 'contain' }}
  />
)

// 搜索图标
export const SearchIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

// 文件夹图标
export const FolderIcon: React.FC<IconProps> = ({ size = 20, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
  </svg>
)

// 文件图标
export const FileIcon: React.FC<IconProps> = ({ size = 20, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
)

// 终端/命令图标
export const TerminalIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="4,17 10,11 4,5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
)

// 设置图标
export const SettingsIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

// 对话/聊天图标
export const ChatIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

// 帮助图标
export const HelpIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// 机器人/AI 图标
export const RobotIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
)

// 闪电/执行图标
export const BoltIcon: React.FC<IconProps> = ({ size = 20, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)

// 截图图标
export const ScreenshotIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21,15 16,10 5,21"/>
  </svg>
)

// 麦克风/语音图标
export const MicIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

// 云/网络图标
export const CloudIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
)

// 星星/收藏图标
export const StarIcon: React.FC<IconProps> = ({ size = 20, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
)

// 气球/活泼图标
export const BalloonIcon: React.FC<IconProps> = ({ size = 20, color = '#fb923c' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <ellipse cx="12" cy="10" rx="7" ry="9"/>
    <path d="M12 19v4" stroke={color} strokeWidth="2"/>
  </svg>
)

// 叶子/萌系图标  
export const LeafIcon: React.FC<IconProps> = ({ size = 20, color = '#4ade80' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M6 3v18c3-3 6-3 9-3 6 0 6-9 6-12-3 0-12 0-15 15z"/>
    <path d="M6 21c3-6 6-9 9-9" fill="none" stroke="#22c55e" strokeWidth="2"/>
  </svg>
)

export default {
  SpiritIcon,
  SearchIcon,
  FolderIcon,
  FileIcon,
  TerminalIcon,
  SettingsIcon,
  ChatIcon,
  HelpIcon,
  RobotIcon,
  BoltIcon,
  ScreenshotIcon,
  MicIcon,
  CloudIcon,
  StarIcon,
  BalloonIcon,
  LeafIcon
}
