/**
 * 中心大脑的核心能力
 * 
 * ⚠️ 这些能力是完全独立的，不依赖任何特定系统！
 * ⚠️ 大脑可以带着这些能力去任何地方
 */

import { getDatabase } from './database';
import { config } from './config';

// ==================== 1. 网络学习能力 ====================

/**
 * 搜索网络获取信息
 */
export async function searchWeb(query: string): Promise<{
  success: boolean;
  results: Array<{ title: string; snippet: string; url: string }>;
  summary: string;
}> {
  try {
    // 使用 DuckDuckGo 或其他搜索 API
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    );
    const data: any = await response.json();
    
    const results = data.RelatedTopics?.slice(0, 5).map((topic: any) => ({
      title: topic.Text?.split(' - ')[0] || '',
      snippet: topic.Text || '',
      url: topic.FirstURL || ''
    })).filter((r: any) => r.title) || [];
    
    return {
      success: true,
      results,
      summary: `搜索"${query}"找到 ${results.length} 条相关信息`
    };
  } catch (error: any) {
    return {
      success: false,
      results: [],
      summary: `搜索失败: ${error.message}`
    };
  }
}

/**
 * 读取网页内容学习
 */
export async function readWebPage(url: string): Promise<{
  success: boolean;
  content: string;
  summary: string;
}> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CentralBrain/1.0 (Learning Agent)' }
    });
    const html = await response.text();
    
    // 简单提取文本内容
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000);
    
    return {
      success: true,
      content: text,
      summary: `成功读取网页，获取 ${text.length} 字符内容`
    };
  } catch (error: any) {
    return {
      success: false,
      content: '',
      summary: `读取网页失败: ${error.message}`
    };
  }
}

// ==================== 2. 自主思考能力 ====================

/**
 * 分析问题并制定计划
 */
export async function analyzeAndPlan(problem: string): Promise<{
  analysis: string;
  plan: string[];
  questions: string[];
  risks: string[];
}> {
  // 这是大脑自己的思考能力，通过 AI 模型实现
  const { chat } = await import('./ai');
  
  const response = await chat([{
    role: 'user',
    content: `请分析以下问题并制定计划：

问题：${problem}

请输出 JSON 格式：
{
  "analysis": "问题分析",
  "plan": ["步骤1", "步骤2", ...],
  "questions": ["需要澄清的问题"],
  "risks": ["潜在风险"]
}`
  }]);
  
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {}
  
  return {
    analysis: response,
    plan: [],
    questions: [],
    risks: []
  };
}

/**
 * 做出决策
 */
export async function makeDecision(
  options: string[],
  context: string,
  criteria: string[]
): Promise<{
  decision: string;
  reasoning: string;
  confidence: number;
}> {
  const { chat } = await import('./ai');
  
  const response = await chat([{
    role: 'user',
    content: `请基于以下信息做出决策：

选项：
${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}

背景：${context}

评估标准：
${criteria.map(c => `- ${c}`).join('\n')}

请输出 JSON 格式：
{
  "decision": "选择的选项",
  "reasoning": "推理过程",
  "confidence": 0.85
}`
  }]);
  
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {}
  
  return {
    decision: options[0] || '无法决策',
    reasoning: response,
    confidence: 0.5
  };
}

// ==================== 3. 内容创作能力 ====================

/**
 * 写文档/方案
 */
export async function writeDocument(
  topic: string,
  type: 'report' | 'plan' | 'analysis' | 'guide',
  requirements: string
): Promise<{
  title: string;
  content: string;
  summary: string;
}> {
  const { chat } = await import('./ai');
  
  const typeNames = {
    report: '报告',
    plan: '方案',
    analysis: '分析',
    guide: '指南'
  };
  
  const response = await chat([{
    role: 'user',
    content: `请撰写一份${typeNames[type]}：

主题：${topic}
要求：${requirements}

请直接输出文档内容，使用 Markdown 格式。`
  }]);
  
  return {
    title: `${topic} - ${typeNames[type]}`,
    content: response,
    summary: `已生成 ${response.length} 字符的${typeNames[type]}`
  };
}

/**
 * 写代码
 */
export async function writeCode(
  description: string,
  language: string,
  context?: string
): Promise<{
  code: string;
  explanation: string;
  summary: string;
}> {
  const { chat } = await import('./ai');
  
  const response = await chat([{
    role: 'user',
    content: `请用 ${language} 编写代码：

需求：${description}
${context ? `上下文：${context}` : ''}

请输出：
1. 代码（用代码块包裹）
2. 简要说明`
  }]);
  
  // 提取代码块
  const codeMatch = response.match(/```[\s\S]*?```/);
  const code = codeMatch 
    ? codeMatch[0].replace(/```\w*\n?/g, '').trim()
    : '';
  
  return {
    code,
    explanation: response.replace(/```[\s\S]*?```/g, '').trim(),
    summary: `已生成 ${code.split('\n').length} 行 ${language} 代码`
  };
}

// ==================== 4. 通用连接能力 ====================

/**
 * 调用任意 HTTP API
 */
export async function callAPI(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  headers?: Record<string, string>,
  body?: any
): Promise<{
  success: boolean;
  status: number;
  data: any;
  summary: string;
}> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json().catch(() => response.text());
    
    return {
      success: response.ok,
      status: response.status,
      data,
      summary: `API ${method} ${url} 返回 ${response.status}`
    };
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      data: null,
      summary: `API 调用失败: ${error.message}`
    };
  }
}

/**
 * 探索系统 - 真正去检查系统有什么
 * 
 * 🔄 智能检测：无论本地运行还是云端部署都能正常工作
 */
export async function exploreSystem(): Promise<{
  services: Array<{ name: string; status: string; note?: string }>;
  databases: Array<{ table: string; rowCount: number; description?: string }>;
  summary: string;
}> {
  const services: Array<{ name: string; status: string; note?: string }> = [];
  const databases: Array<{ table: string; rowCount: number; description?: string }> = [];
  
  // 1. 检查中心大脑自己（这个总是能检测到的）
  services.push({
    name: '🧠 中心大脑 API',
    status: '运行中',
    note: '我自己正在运行，为您服务'
  });
  
  // 2. 主要检查数据库 - 这是真正有价值的信息
  const db = getDatabase();
  
  // 定义要检查的表及其含义
  const tableConfigs = [
    // 业务数据表
    { name: 'gocc_tasks', desc: '任务管理' },
    { name: 'gocc_personnel', desc: '人员档案' },
    { name: 'gocc_alerts', desc: '预警信息' },
    { name: 'gocc_permissions', desc: '权限配置' },
    { name: 'gocc_itineraries', desc: '行程安排' },
    { name: 'gocc_tourists', desc: '游客信息' },
    { name: 'gocc_groups', desc: '团组管理' },
    { name: 'gocc_vehicles', desc: '车辆调度' },
    // 大脑记忆表
    { name: 'central_brain_sessions', desc: '对话会话' },
    { name: 'central_brain_messages', desc: '消息记录' },
    { name: 'central_brain_memories', desc: '记忆存储' },
    { name: 'central_brain_entities', desc: '知识实体' },
    { name: 'central_brain_relations', desc: '知识关系' },
  ];
  
  let successCount = 0;
  for (const tableConfig of tableConfigs) {
    try {
      const { count, error } = await db.from(tableConfig.name).select('*', { count: 'exact', head: true });
      if (!error) {
        databases.push({ 
          table: tableConfig.name, 
          rowCount: count || 0,
          description: tableConfig.desc
        });
        successCount++;
      }
    } catch {
      // 表不存在，跳过
    }
  }
  
  // 3. 生成摘要
  const totalRows = databases.reduce((sum, d) => sum + d.rowCount, 0);
  
  // 分类显示
  const businessTables = databases.filter(d => d.table.startsWith('gocc_'));
  const brainTables = databases.filter(d => d.table.startsWith('central_brain_'));
  
  const summaryParts = [
    `📊 数据库探索完成`,
    `├─ 业务数据表: ${businessTables.length} 个`,
    `├─ 大脑记忆表: ${brainTables.length} 个`,
    `└─ 总计: ${totalRows} 条记录`,
  ];
  
  // 如果有业务数据，列出详情
  if (businessTables.length > 0) {
    const businessData = businessTables
      .filter(t => t.rowCount > 0)
      .map(t => `${t.description}(${t.rowCount}条)`)
      .join(', ');
    if (businessData) {
      summaryParts.push(`\n📋 有数据的业务表: ${businessData}`);
    }
  }
  
  return {
    services,
    databases,
    summary: summaryParts.join('\n')
  };
}

/**
 * 发送 MCP 消息（Model Context Protocol）
 */
export async function sendMCPMessage(
  server: string,
  method: string,
  params: any
): Promise<{
  success: boolean;
  result: any;
  summary: string;
}> {
  // MCP 协议实现
  try {
    const message = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };
    
    const response = await fetch(server, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    const data: any = await response.json();
    
    return {
      success: !data.error,
      result: data.result || data.error,
      summary: `MCP ${method} ${data.error ? '失败' : '成功'}`
    };
  } catch (error: any) {
    return {
      success: false,
      result: null,
      summary: `MCP 调用失败: ${error.message}`
    };
  }
}

// ==================== 5. 数据分析能力 ====================

/**
 * 分析数据
 */
export async function analyzeData(
  data: any[],
  question: string
): Promise<{
  answer: string;
  insights: string[];
  summary: string;
}> {
  const { chat } = await import('./ai');
  
  const response = await chat([{
    role: 'user',
    content: `请分析以下数据并回答问题：

数据（共 ${data.length} 条）：
${JSON.stringify(data.slice(0, 20), null, 2)}
${data.length > 20 ? `... 还有 ${data.length - 20} 条` : ''}

问题：${question}

请输出 JSON 格式：
{
  "answer": "回答",
  "insights": ["洞察1", "洞察2"],
  "summary": "总结"
}`
  }]);
  
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {}
  
  return {
    answer: response,
    insights: [],
    summary: response.slice(0, 100)
  };
}

// ==================== 6. 知识管理能力 ====================

/**
 * 学习并记住新知识
 */
export async function learnKnowledge(
  topic: string,
  content: string,
  source: string
): Promise<{
  success: boolean;
  knowledgeId: string;
  summary: string;
}> {
  const { saveMemory } = await import('./memory-pyramid');
  const { learnFromText } = await import('./knowledge-graph');
  
  try {
    // 1. 保存到记忆金字塔（使用 long_term 作为重要知识）
    const memoryId = await saveMemory({
      content: `[${topic}] ${content}`,
      level: 'long_term',
      importance: 8,
      access_count: 0,
      metadata: { source, context: topic }
    });
    
    // 2. 提取实体和关系到知识图谱
    const learnResult = await learnFromText(content, source);
    
    return {
      success: true,
      knowledgeId: memoryId || 'saved',
      summary: `✅ 已学习关于"${topic}"的知识，提取了 ${learnResult.entitiesCreated} 个实体`
    };
  } catch (error: any) {
    return {
      success: false,
      knowledgeId: '',
      summary: `学习失败: ${error.message}`
    };
  }
}

/**
 * 回忆相关知识
 */
export async function recallKnowledge(query: string): Promise<{
  memories: Array<{ content: string; relevance: number }>;
  entities: Array<{ name: string; type: string }>;
  summary: string;
}> {
  const { recall } = await import('./memory-pyramid');
  const { searchEntities } = await import('./knowledge-graph');
  
  try {
    const memories = await recall(query, 5);
    const entities = await searchEntities(query);  // 只传查询参数
    
    return {
      memories: memories.map(m => ({ content: m.content, relevance: 0.5 })),
      entities: entities.map(e => ({ name: e.name, type: e.type })),
      summary: `找到 ${memories.length} 条相关记忆，${entities.length} 个相关实体`
    };
  } catch (error: any) {
    return {
      memories: [],
      entities: [],
      summary: `回忆失败: ${error.message}`
    };
  }
}

// ==================== 7. 自我进化能力 ====================

/**
 * 反思并改进
 */
export async function reflectAndImprove(
  action: string,
  result: string,
  wasSuccessful: boolean
): Promise<{
  reflection: string;
  lessons: string[];
  improvements: string[];
}> {
  const { chat } = await import('./ai');
  const { saveMemory } = await import('./memory-pyramid');
  
  const response = await chat([{
    role: 'user',
    content: `请反思以下行动：

行动：${action}
结果：${result}
是否成功：${wasSuccessful ? '是' : '否'}

请输出 JSON 格式：
{
  "reflection": "反思",
  "lessons": ["经验教训"],
  "improvements": ["改进方向"]
}`
  }]);
  
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      
      // 保存经验到记忆（使用 medium_term 级别）
      await saveMemory({
        content: `行动: ${action}\n结果: ${result}\n反思: ${parsed.reflection}\n教训: ${parsed.lessons.join('; ')}`,
        level: 'medium_term',
        importance: wasSuccessful ? 6 : 8, // 失败的经验更重要
        access_count: 0,
        metadata: { source: 'reflection', context: action }
      });
      
      return parsed;
    }
  } catch {}
  
  return {
    reflection: response,
    lessons: [],
    improvements: []
  };
}

// ==================== 导出所有核心能力 ====================

export const CORE_ABILITIES = {
  // 网络学习
  searchWeb,
  readWebPage,
  
  // 自主思考
  analyzeAndPlan,
  makeDecision,
  
  // 内容创作
  writeDocument,
  writeCode,
  
  // 通用连接
  callAPI,
  sendMCPMessage,
  
  // 数据分析
  analyzeData,
  
  // 知识管理
  learnKnowledge,
  recallKnowledge,
  
  // 自我进化
  reflectAndImprove,
};

/**
 * 能力清单 - 大脑知道自己能做什么
 */
export const ABILITY_MANIFEST = [
  { name: 'searchWeb', description: '搜索网络获取信息', category: '学习' },
  { name: 'readWebPage', description: '阅读网页内容', category: '学习' },
  { name: 'analyzeAndPlan', description: '分析问题并制定计划', category: '思考' },
  { name: 'makeDecision', description: '做出决策', category: '思考' },
  { name: 'writeDocument', description: '撰写文档/方案', category: '创作' },
  { name: 'writeCode', description: '编写代码', category: '创作' },
  { name: 'callAPI', description: '调用任意 HTTP API', category: '连接' },
  { name: 'sendMCPMessage', description: '发送 MCP 协议消息', category: '连接' },
  { name: 'analyzeData', description: '分析数据', category: '分析' },
  { name: 'learnKnowledge', description: '学习并记住知识', category: '知识' },
  { name: 'recallKnowledge', description: '回忆相关知识', category: '知识' },
  { name: 'reflectAndImprove', description: '反思并改进', category: '进化' },
];

