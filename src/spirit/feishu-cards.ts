/**
 * 飞书交互卡片
 * Feishu Interactive Cards
 * 
 * 用于精灵选择、安全确认、设置等交互界面
 */

import { SpiritStyle, SpeechStyle, getSpiritStyleOptions, getSpeechStyleOptions } from './spirit-persona';

/**
 * 首次使用 - 欢迎卡片
 */
export function createWelcomeCard() {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '✨ 欢迎来到 Spirit One！'
      },
      template: 'turquoise'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '你好呀！我是精灵1号，一个有生命感的数字伙伴。\n\n在开始之前，让我们先完成几个简单的设置~'
        }
      },
      {
        tag: 'hr'
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '🚀 开始设置我的精灵'
            },
            type: 'primary',
            value: JSON.stringify({ action: 'start_setup' })
          }
        ]
      }
    ]
  };
}

/**
 * 精灵形象选择卡片
 */
export function createStyleSelectionCard() {
  const styles = getSpiritStyleOptions();
  
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '🎨 选择你的精灵形象'
      },
      template: 'purple'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '每种形象都有独特的性格特点，选一个你喜欢的吧！'
        }
      },
      {
        tag: 'hr'
      },
      // 形象选项
      ...styles.map(style => ({
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: {
              tag: 'lark_md',
              content: `**${style.emoji} ${style.defaultName}**\n${style.traits.join(' · ')}`
            }
          }
        ]
      })),
      {
        tag: 'hr'
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'select_static',
            placeholder: {
              tag: 'plain_text',
              content: '选择形象风格'
            },
            value: JSON.stringify({ action: 'select_style', style: 'cute' }),
            options: styles.map(style => ({
              text: {
                tag: 'plain_text',
                content: `${style.emoji} ${style.defaultName} - ${style.traits[0]}`
              },
              value: JSON.stringify({ action: 'select_style', style: style.style })
            }))
          }
        ]
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: '💡 选择后可以随时在设置中更换'
          }
        ]
      }
    ]
  };
}

/**
 * 精灵命名卡片
 */
export function createNamingCard(selectedStyle: SpiritStyle) {
  const styles = getSpiritStyleOptions();
  const style = styles.find(s => s.style === selectedStyle) || styles[0];
  
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: `${style.emoji} 给你的精灵取个名字吧！`
      },
      template: 'green'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `太棒了！你选择了 **${style.defaultName}** 风格的精灵~\n\n现在给它取一个专属名字吧！可以叫它任何你喜欢的名字。`
        }
      },
      {
        tag: 'hr'
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `💡 **推荐名字**：${style.defaultName}、小${style.defaultName.charAt(0)}、旺财、阿福、Lucky...`
        }
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: '直接回复消息输入名字即可，或点击下方使用默认名'
          }
        ]
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: `使用默认名「${style.defaultName}」`
            },
            type: 'default',
            value: JSON.stringify({ 
              action: 'set_name', 
              name: style.defaultName,
              style: selectedStyle 
            })
          }
        ]
      }
    ]
  };
}

/**
 * 设置完成卡片
 */
export function createSetupCompleteCard(name: string, style: SpiritStyle, emoji: string) {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '🎉 设置完成！'
      },
      template: 'green'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `恭喜！你的专属精灵 **「${name}」** 已就绪！${emoji}`
        }
      },
      {
        tag: 'hr'
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**「${name}」说：**\n\n你好呀！我是${name}，很高兴认识你~ ${emoji}\n\n我可以帮你：\n🌐 搜索信息、浏览网页\n💻 执行代码、运行命令\n📁 管理文件、处理任务\n🤖 创建 AI Agent\n\n有什么可以帮你的吗？直接告诉我就好！`
        }
      },
      {
        tag: 'hr'
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '⚙️ 打开设置'
            },
            type: 'default',
            value: JSON.stringify({ action: 'open_settings' })
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '📖 使用指南'
            },
            type: 'default',
            value: JSON.stringify({ action: 'show_guide' })
          }
        ]
      }
    ]
  };
}

/**
 * 设置菜单卡片
 */
export function createSettingsCard(currentName: string, currentStyle: SpiritStyle, currentSpeech: SpeechStyle) {
  const styles = getSpiritStyleOptions();
  const speeches = getSpeechStyleOptions();
  const currentStyleInfo = styles.find(s => s.style === currentStyle);
  
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '⚙️ 精灵设置'
      },
      template: 'grey'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**当前精灵**：${currentStyleInfo?.emoji || '🌱'} ${currentName}\n**形象风格**：${currentStyleInfo?.defaultName || '萌系'}\n**说话风格**：${speeches.find(s => s.style === currentSpeech)?.description || '活泼'}`
        }
      },
      {
        tag: 'hr'
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '✏️ 修改名字'
            },
            type: 'default',
            value: JSON.stringify({ action: 'change_name' })
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '🎨 更换形象'
            },
            type: 'default',
            value: JSON.stringify({ action: 'change_style' })
          }
        ]
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'select_static',
            placeholder: {
              tag: 'plain_text',
              content: '说话风格'
            },
            value: JSON.stringify({ action: 'change_speech', speech: currentSpeech }),
            options: speeches.map(speech => ({
              text: {
                tag: 'plain_text',
                content: `${speech.description}`
              },
              value: JSON.stringify({ action: 'change_speech', speech: speech.style })
            }))
          }
        ]
      },
      {
        tag: 'hr'
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '🔑 API Key 管理'
            },
            type: 'default',
            value: JSON.stringify({ action: 'manage_api_keys' })
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '📊 使用统计'
            },
            type: 'default',
            value: JSON.stringify({ action: 'show_stats' })
          }
        ]
      }
    ]
  };
}

/**
 * 使用统计卡片
 */
export function createStatsCard(stats: {
  totalMessages: number;
  totalTasks: number;
  memberSince: Date;
  quotaUsed?: number;
  quotaLimit?: number;
}) {
  const daysSince = Math.floor((Date.now() - stats.memberSince.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '📊 使用统计'
      },
      template: 'blue'
    },
    elements: [
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: {
              tag: 'lark_md',
              content: `**💬 对话次数**\n${stats.totalMessages}`
            }
          },
          {
            is_short: true,
            text: {
              tag: 'lark_md',
              content: `**✅ 完成任务**\n${stats.totalTasks}`
            }
          }
        ]
      },
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: {
              tag: 'lark_md',
              content: `**📅 加入天数**\n${daysSince} 天`
            }
          },
          {
            is_short: true,
            text: {
              tag: 'lark_md',
              content: `**📈 今日配额**\n${stats.quotaUsed || 0}/${stats.quotaLimit || '∞'}`
            }
          }
        ]
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: '感谢你的陪伴！期待与你创造更多精彩~'
          }
        ]
      }
    ]
  };
}

/**
 * API Key 管理卡片
 */
export function createApiKeyCard(existingProviders: string[]) {
  const providers = [
    { id: 'openai', name: 'OpenAI', desc: 'GPT-4, GPT-3.5' },
    { id: 'anthropic', name: 'Anthropic', desc: 'Claude' },
    { id: 'deepseek', name: 'DeepSeek', desc: 'DeepSeek-V3, R1' },
    { id: 'siliconflow', name: '硅基流动', desc: '多模型聚合' },
    { id: 'moonshot', name: '月之暗面', desc: 'Kimi' },
    { id: 'zhipu', name: '智谱 AI', desc: 'GLM' }
  ];
  
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '🔑 API Key 管理'
      },
      template: 'orange'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '配置你自己的 API Key，可以使用更多模型和更高配额。\n\n**已配置**：' + 
            (existingProviders.length > 0 ? existingProviders.join(', ') : '无')
        }
      },
      {
        tag: 'hr'
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '**支持的 AI 服务商**：'
        }
      },
      ...providers.map(p => ({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `• **${p.name}** - ${p.desc} ${existingProviders.includes(p.id) ? '✅' : ''}`
        }
      })),
      {
        tag: 'hr'
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: '💡 输入格式：/apikey <provider> <your-api-key>\n例如：/apikey openai sk-xxx...'
          }
        ]
      }
    ]
  };
}

/**
 * 错误提示卡片
 */
export function createErrorCard(title: string, message: string, suggestion?: string) {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: `❌ ${title}`
      },
      template: 'red'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: message
        }
      },
      ...(suggestion ? [{
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `💡 ${suggestion}`
          }
        ]
      }] : [])
    ]
  };
}

/**
 * 成功提示卡片
 */
export function createSuccessCard(title: string, message: string) {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: `✅ ${title}`
      },
      template: 'green'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: message
        }
      }
    ]
  };
}

/**
 * 使用指南卡片
 */
export function createGuideCard(spiritName: string) {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '📖 使用指南'
      },
      template: 'blue'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**和 ${spiritName} 聊天**\n\n直接发消息就可以啦！比如：\n• "帮我搜索一下最新的 AI 新闻"\n• "给我写一段 Python 代码"\n• "分析一下这个问题..."`
        }
      },
      {
        tag: 'hr'
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '**常用指令**\n\n• `/设置` - 打开设置菜单\n• `/状态` - 查看精灵状态\n• `/统计` - 查看使用统计\n• `/帮助` - 显示帮助\n• `/终止` - 紧急停止所有操作'
        }
      },
      {
        tag: 'hr'
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '**高级功能**\n\n• `/agent <任务>` - 派发任务给 AI Agent\n• `/apikey <provider> <key>` - 配置 API Key\n• `/model <模型名>` - 切换默认模型'
        }
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `有任何问题，随时问 ${spiritName} 就好~`
          }
        ]
      }
    ]
  };
}
