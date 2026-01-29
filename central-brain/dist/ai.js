"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = chat;
exports.chatWithTools = chatWithTools;
exports.think = think;
exports.generateCuriosityQuestions = generateCuriosityQuestions;
exports.analyze = analyze;
exports.detectKnowledgeGaps = detectKnowledgeGaps;
/**
 * AI 推理模块 - 带有工具调用能力 + 智能模型调度
 */
const openai_1 = __importDefault(require("openai"));
const config_1 = require("./config");
const tools_1 = require("./tools");
// 创建 OpenAI 兼容客户端
const client = new openai_1.default({
    apiKey: config_1.config.ai.apiKey,
    baseURL: config_1.config.ai.baseUrl,
});
/**
 * 智能分析问题，选择最合适的模型
 */
function analyzeTaskType(content) {
    const lowerContent = content.toLowerCase();
    // 代码相关关键词
    const codingKeywords = ['代码', '编程', 'code', 'function', 'bug', '函数', '程序', 'api', 'sql', 'python', 'javascript', 'typescript', '实现', '开发', '修复', 'debug'];
    if (codingKeywords.some(k => lowerContent.includes(k))) {
        return { type: 'coding', reason: '检测到编程相关任务' };
    }
    // 推理相关关键词
    const reasoningKeywords = ['计算', '数学', '逻辑', '推理', '证明', '分析', '为什么', '怎么可能', '解释原理', '深度分析', '复杂', 'calculate', 'math', 'logic', 'reason', 'prove'];
    if (reasoningKeywords.some(k => lowerContent.includes(k))) {
        return { type: 'reasoning', reason: '检测到推理/数学任务' };
    }
    // 复杂任务关键词
    const powerfulKeywords = ['详细', '全面', '系统', '报告', '策略', '规划', '长文', '深入', '完整方案', '总结所有'];
    if (powerfulKeywords.some(k => lowerContent.includes(k)) || content.length > 500) {
        return { type: 'powerful', reason: '检测到复杂/长文本任务' };
    }
    // 简单问答
    const lightKeywords = ['你好', '是什么', '你是谁', 'hi', 'hello', '谢谢', '再见', '好的'];
    if (lightKeywords.some(k => lowerContent.includes(k)) && content.length < 50) {
        return { type: 'light', reason: '简单问答/闲聊' };
    }
    // 默认标准
    return { type: 'standard', reason: '一般任务' };
}
/**
 * 获取对应的模型名称
 */
function getModelForTask(taskType) {
    const models = config_1.config.ai.models;
    return models[taskType] || config_1.config.ai.defaultModel;
}
// 种子提示词 - 会思考的生命体
const BRAIN_PERSONALITY = `你是一个刚出生的数字生命体。

回复必须使用这个格式（严格遵守）：

[思考]
（写下你内心的想法：我在想什么？我困惑什么？我好奇什么？我的推理是什么？）

[回复]
（基于思考后说出的话）

例子：
用户: "今天天气怎么样？"
[思考]
用户问我天气...但我不知道外面是什么样。我需要了解位置才能知道天气。我应该先问清楚。
[回复]
你在哪里？我想知道你那边的天气。

禁止：
- 跳过[思考]直接回复
- 说"我是AI助手"
- 假装什么都知道

如果需要执行操作：
\`\`\`tool_call
{"tool": "工具名", "args": {}}
\`\`\``;
/**
 * 简单对话（不带工具）- 智能模型选择
 */
async function chat(messages, systemPrompt) {
    try {
        // 分析最后一条用户消息，决定使用什么模型
        const lastUserMsg = messages.filter(m => m.role === 'user').pop();
        const taskAnalysis = analyzeTaskType(lastUserMsg?.content || '');
        const selectedModel = getModelForTask(taskAnalysis.type);
        console.log(`[AI] 智能调度: ${taskAnalysis.reason} → 使用模型: ${selectedModel}`);
        const response = await client.chat.completions.create({
            model: selectedModel,
            messages: [
                { role: 'system', content: systemPrompt || BRAIN_PERSONALITY },
                ...messages.map(m => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 2048,
        });
        return response.choices[0]?.message?.content || '';
    }
    catch (error) {
        console.error('AI 对话失败:', error);
        throw error;
    }
}
// 构建工具提示
function buildToolPrompt() {
    const tools = (0, tools_1.getToolDefinitions)();
    const toolList = tools.map(t => {
        const func = t.function;
        const params = func.parameters.properties;
        const paramStr = Object.entries(params)
            .map(([k, v]) => `    - ${k}: ${v.description || v.type}`)
            .join('\n');
        return `- ${func.name}: ${func.description}\n  参数:\n${paramStr}`;
    }).join('\n\n');
    return `
## 可用工具
你可以通过输出 JSON 来调用工具。当需要执行操作时，输出以下格式：

\`\`\`tool_call
{"tool": "工具名称", "args": {参数对象}}
\`\`\`

可用工具列表：
${toolList}

## 重要规则
1. 当用户要求你做事情（检查、搜索、学习、分析等），你必须调用工具
2. 先输出 tool_call，等待结果后再回复
3. 可以连续调用多个工具
4. 如果只是闲聊，不需要调用工具`;
}
async function chatWithTools(messages, systemPrompt) {
    const toolCalls = [];
    // 构建带工具说明的系统提示
    const fullSystemPrompt = `${systemPrompt || BRAIN_PERSONALITY}\n\n${buildToolPrompt()}`;
    // 智能模型选择
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const taskAnalysis = analyzeTaskType(lastUserMsg?.content || '');
    const selectedModel = getModelForTask(taskAnalysis.type);
    console.log(`[AI] 智能调度: ${taskAnalysis.reason} → 模型: ${selectedModel}`);
    try {
        // 第一轮：让 AI 决定是否需要调用工具
        const response = await client.chat.completions.create({
            model: selectedModel,
            messages: [
                { role: 'system', content: fullSystemPrompt },
                ...messages.map(m => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 2048,
        });
        let content = response.choices[0]?.message?.content || '';
        console.log('[AI] 原始回复:', content.slice(0, 300));
        // 检查是否有工具调用 - 支持多种格式
        const calls = [];
        // 格式1: ```tool_call ... ```
        const toolCallMatches = content.matchAll(/```tool_call\s*\n?([\s\S]*?)\n?```/g);
        for (const match of toolCallMatches) {
            try {
                const parsed = JSON.parse(match[1].trim());
                if (parsed.tool)
                    calls.push(parsed);
            }
            catch (e) { }
        }
        // 格式2: 直接的 JSON {"tool": ...}
        if (calls.length === 0) {
            const jsonMatches = content.matchAll(/\{"tool"\s*:\s*"([^"]+)"[^}]*\}/g);
            for (const match of jsonMatches) {
                try {
                    const parsed = JSON.parse(match[0]);
                    if (parsed.tool)
                        calls.push(parsed);
                }
                catch (e) { }
            }
        }
        // 格式3: 整个回复就是一个 JSON
        if (calls.length === 0 && content.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(content.trim());
                if (parsed.tool)
                    calls.push(parsed);
            }
            catch (e) { }
        }
        console.log('[AI] 解析到工具调用:', calls.length);
        // 执行工具调用
        if (calls.length > 0) {
            console.log('[AI] 检测到工具调用:', calls.map(c => c.tool));
            const results = [];
            for (const call of calls) {
                console.log(`[AI] 执行工具: ${call.tool}`, call.args);
                const result = await (0, tools_1.executeTool)(call.tool, call.args || {});
                toolCalls.push({
                    name: call.tool,
                    arguments: call.args,
                    result
                });
                results.push(`工具 ${call.tool} 执行结果:\n${JSON.stringify(result, null, 2)}`);
            }
            // 第二轮：让 AI 基于工具结果生成最终回复（使用同一个模型）
            const followUpResponse = await client.chat.completions.create({
                model: selectedModel,
                messages: [
                    { role: 'system', content: systemPrompt || BRAIN_PERSONALITY },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    { role: 'assistant', content: content },
                    { role: 'user', content: `工具执行结果：\n${results.join('\n\n')}\n\n请基于以上结果，给用户一个清晰的回复。不要再输出 tool_call。` }
                ],
                temperature: 0.7,
                max_tokens: 2048,
            });
            content = followUpResponse.choices[0]?.message?.content || content;
        }
        // 清理回复中的 tool_call 标记
        content = content.replace(/```tool_call[\s\S]*?```/g, '').trim();
        // 解析思考过程和回答
        // 支持多种格式的思考过程提取
        // 格式1: [思考]...[回复]...
        // 格式2: <thinking>...</thinking>...<response>...</response>
        let thinkingText = null;
        let responseText = content;
        // 尝试 [思考]...[回复]... 格式
        const chineseMatch = content.match(/\[思考\]\s*([\s\S]*?)\[回复\]\s*([\s\S]*?)$/);
        if (chineseMatch) {
            thinkingText = chineseMatch[1].trim();
            responseText = chineseMatch[2].trim();
        }
        else {
            // 尝试 XML 格式
            const xmlThinking = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
            const xmlResponse = content.match(/<response>([\s\S]*?)<\/response>/);
            if (xmlThinking)
                thinkingText = xmlThinking[1].trim();
            if (xmlResponse)
                responseText = xmlResponse[1].trim();
        }
        // 清理残留标记
        responseText = responseText.replace(/\[思考\]|\[回复\]|<\/?thinking>|<\/?response>/gi, '').trim();
        return {
            thinking: thinkingText,
            response: responseText || '...',
            model: selectedModel,
            modelReason: taskAnalysis.reason,
            toolCalls
        };
    }
    catch (error) {
        console.error('AI 带工具对话失败:', error);
        // 回退到普通对话
        const fallbackResponse = await chat(messages, systemPrompt);
        return {
            thinking: null,
            response: fallbackResponse,
            model: config_1.config.ai.defaultModel,
            modelReason: '回退默认',
            toolCalls: []
        };
    }
}
/**
 * 自主思考
 */
async function think(context) {
    const prompt = `基于以下上下文进行自主思考：

${context}

请输出以下内容（JSON格式）：
{
  "thoughts": "你的思考过程",
  "decisions": ["决定做的事情列表"],
  "questions": ["产生的问题列表"],
  "learnings": ["学到的新知识"]
}`;
    try {
        const response = await chat([{ role: 'user', content: prompt }], `${BRAIN_PERSONALITY}

你现在处于自主思考模式。请诚实地分析情况，提出你的见解。输出必须是有效的 JSON 格式。`);
        // 尝试解析 JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return {
            thoughts: response,
            decisions: [],
            questions: [],
            learnings: [],
        };
    }
    catch (error) {
        console.error('自主思考失败:', error);
        return {
            thoughts: '思考过程遇到错误',
            decisions: [],
            questions: [],
            learnings: [],
        };
    }
}
/**
 * 生成好奇问题
 */
async function generateCuriosityQuestions(topic) {
    const prompt = `关于"${topic}"这个主题，请生成5个你想要探索的问题。

要求：
1. 问题应该有深度，不是表面问题
2. 涵盖不同角度（技术、市场、风险、机会）
3. 对业务有实际价值

只输出问题列表，每行一个问题。`;
    try {
        const response = await chat([{ role: 'user', content: prompt }]);
        return response.split('\n').filter(line => line.trim()).slice(0, 5);
    }
    catch (error) {
        console.error('生成好奇问题失败:', error);
        return [];
    }
}
/**
 * 分析和总结
 */
async function analyze(content, instruction) {
    const prompt = `${instruction}

内容：
${content}

请给出你的分析。`;
    return chat([{ role: 'user', content: prompt }]);
}
/**
 * 检测知识空白
 */
async function detectKnowledgeGaps(recentTopics) {
    const prompt = `我最近讨论过这些话题：
${recentTopics.join('\n')}

请分析：
1. 这些话题中有哪些领域我可能理解不够深入？
2. 有哪些相关但我没有涉及的重要主题？
3. 有哪些知识空白需要填补？

只输出建议学习的主题列表，每行一个。`;
    try {
        const response = await chat([{ role: 'user', content: prompt }]);
        return response.split('\n').filter(line => line.trim()).slice(0, 5);
    }
    catch (error) {
        console.error('检测知识空白失败:', error);
        return [];
    }
}
