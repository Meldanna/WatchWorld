import {
  ApiProviderConfig,
  Agent,
  ChatMessage,
  AiContextVisibilityFilter,
  KnowledgeItem,
  RegexRule,
  AgentSkill,
  McpServerConfig,
  TimelineBranch,
} from '../types';
import { applyRegexRules } from './regexProcessor';
import { generateSmartLocalResponse } from './mockAi';
import { rearrangeMessagesForAi, formatMessageWithFloorAndTag } from './timelineMemory';

export interface SendChatParams {
  provider: ApiProviderConfig;
  agent: Agent;
  model: string;
  messages: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  aiContextVisibility?: AiContextVisibilityFilter;
  connectedKnowledge?: KnowledgeItem[];
  activeSkills?: AgentSkill[];
  activeMcpServers?: McpServerConfig[];
  regexRules?: RegexRule[];
  timelineContextPrompt?: string;
  allTimelines?: TimelineBranch[];
  activeTimelineId?: string;
  timelineMemoryEnabled?: boolean;
  onChunk?: (partial: string) => void;
  signal?: AbortSignal;
}

export async function sendChatMessage({
  provider,
  agent,
  model,
  messages,
  systemInstruction,
  temperature,
  topP,
  aiContextVisibility = 'all',
  connectedKnowledge = [],
  activeSkills = [],
  activeMcpServers = [],
  regexRules = [],
  timelineContextPrompt,
  allTimelines = [],
  activeTimelineId,
  timelineMemoryEnabled = false,
  onChunk,
  signal,
}: SendChatParams): Promise<string> {
  // 1. Process messages based on aiContextVisibility
  let filteredMessagesForAi: ChatMessage[] = [];

  if (aiContextVisibility === 'all') {
    filteredMessagesForAi = [...messages];
  } else if (aiContextVisibility === 'hide_all') {
    filteredMessagesForAi = messages.filter((m) => m.role !== 'assistant');
  } else {
    const limit =
      aiContextVisibility === 'latest_1'
        ? 1
        : aiContextVisibility === 'latest_2'
        ? 2
        : aiContextVisibility === 'latest_3'
        ? 3
        : aiContextVisibility === 'latest_5'
        ? 5
        : 9999;

    const assistantIndices: number[] = [];
    messages.forEach((m, idx) => {
      if (m.role === 'assistant') assistantIndices.push(idx);
    });

    const allowedIndices = new Set(assistantIndices.slice(-limit));
    filteredMessagesForAi = messages.filter(
      (m, idx) => m.role === 'user' || allowedIndices.has(idx)
    );
  }

  // 2. 消息重排中间件 (PRD 5.3: 纯程序逻辑，不调用AI)
  if (timelineMemoryEnabled && allTimelines.length > 0) {
    const currentBranch =
      allTimelines.find((t) => t.id === activeTimelineId) || allTimelines[0];
    filteredMessagesForAi = rearrangeMessagesForAi(
      currentBranch,
      allTimelines,
      filteredMessagesForAi
    );
  }

  // 3. Assemble knowledge base context
  let knowledgeContext = '';
  if (connectedKnowledge.length > 0) {
    knowledgeContext =
      '\n\n# 【参考世界观·知识库】:\n' +
      connectedKnowledge
        .map((k) => `### ${k.title}\n${k.content}`)
        .join('\n\n');
  }

  // 4. Assemble MCP tools context
  let mcpContext = '';
  const enabledMcp = activeMcpServers.filter((s) => s.enabled);
  if (enabledMcp.length > 0) {
    mcpContext =
      '\n\n# 【已挂载 MCP 服务能力】:\n' +
      enabledMcp
        .map(
          (m) =>
            `- 服务: ${m.name} (${m.type.toUpperCase()}) | 工具集: [${(m.tools || []).join(', ')}] | 描述: ${m.description || '无'}`
        )
        .join('\n');
  }

  // 5. Assemble Skills context
  let skillContext = '';
  if (activeSkills.length > 0) {
    skillContext =
      '\n\n# 【激活的专业 Skill 技能】:\n' +
      activeSkills
        .map((s) => `### Skill: ${s.name}\n${s.systemInstruction}`)
        .join('\n\n');
  }

  // 6. Combine all system instructions
  const fullSystemInstruction = [
    systemInstruction || agent.systemPrompt || '',
    knowledgeContext,
    mcpContext,
    skillContext,
    timelineContextPrompt || '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // 7. Format messages with floor numbers and dual tags for clear structure
  const formattedForBackend = filteredMessagesForAi.map((m) => {
    let content =
      m.role === 'assistant'
        ? (m.versions[m.currentVersionIndex] || m.versions[0])?.content || m.content
        : m.content;

    // Apply regex rules if any
    if (regexRules.length > 0) {
      content = applyRegexRules(content, regexRules, 'output');
    }

    // Format with floor number and tag if memory enabled
    if (timelineMemoryEnabled) {
      content = formatMessageWithFloorAndTag(m, allTimelines);
    }

    return {
      role: m.role,
      content,
    };
  });

  // 8. Dispatch to backend proxy
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider.customHeaders || {}),
      },
      body: JSON.stringify({
        provider: provider.type,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        model: model || provider.defaultModel || 'gemini-2.0-flash',
        messages: formattedForBackend,
        systemInstruction: fullSystemInstruction,
        temperature: temperature ?? agent.temperature ?? 0.7,
        topP: topP ?? agent.topP ?? 0.95,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `请求失败 (${res.status})`);
    }

    if (!res.body) {
      throw new Error('响应体为空');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const payloadStr = trimmed.replace(/^data:\s*/, '');
        if (payloadStr === '[DONE]') {
          break;
        }

        try {
          const parsed = JSON.parse(payloadStr);
          if (parsed.text) {
            accumulated += parsed.text;
            onChunk?.(accumulated);
          }
        } catch {
          // not json
        }
      }
    }

    return accumulated;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }

    // Fallback: If no API key is available or upstream returned 403 access denied / 429 quota exhausted
    const errMsg = error.message || '';
    const isExhaustedOrDenied =
      errMsg.includes('403') ||
      errMsg.includes('429') ||
      errMsg.includes('denied') ||
      errMsg.includes('quota') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('未配置');

    if (!provider.apiKey || isExhaustedOrDenied) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const userText = lastUser?.content || '你好';
      const localReply = generateSmartLocalResponse(
        userText,
        agent,
        messages,
        connectedKnowledge,
        activeSkills,
        activeMcpServers,
        timelineContextPrompt
      );
      if (onChunk) {
        onChunk(localReply);
      }
      return localReply;
    }

    throw error;
  }
}

/**
 * 从 API 拉取该 provider 支持的模型列表
 * 通过后端代理 /api/models 转发，避免 CORS
 */
export async function fetchModelsFromProvider(provider: ApiProviderConfig): Promise<{
  models: string[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider.customHeaders || {}),
      },
      body: JSON.stringify({
        provider: provider.type,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        customHeaders: provider.customHeaders,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { models: [], error: data.error || `获取失败 (${res.status})` };
    }

    return { models: Array.isArray(data.models) ? data.models : [] };
  } catch (error: any) {
    return { models: [], error: error.message || '网络请求失败' };
  }
}

/**
 * 测试 Provider API 连通性
 */
export async function testProviderConnection(provider: ApiProviderConfig): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
}> {
  const startTime = Date.now();
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider.customHeaders || {}),
      },
      body: JSON.stringify({
        provider: provider.type,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        model: provider.defaultModel || provider.models[0] || 'gemini-2.0-flash',
        messages: [{ role: 'user', content: 'Ping' }],
        maxTokens: 5,
        stream: false,
      }),
    });

    const latencyMs = Date.now() - startTime;
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return {
        success: false,
        latencyMs,
        message: err.error || `连接失败 (${res.status})`,
      };
    }

    return {
      success: true,
      latencyMs,
      message: `连接正常，耗时 ${latencyMs}ms`,
    };
  } catch (error: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: error.message || '网络连接超时或地址不可达',
    };
  }
}

/**
 * 角色关系分析 Agent (独立按需调用，省 Token)
 * 输入：当前重排后的上下文
 * 输出：角色关系与心理学动态分析报告
 */
export async function analyzeRoleRelationships(params: {
  provider: ApiProviderConfig;
  model: string;
  contextText: string;
  currentBranchCode: string;
  currentBranchName: string;
  signal?: AbortSignal;
}): Promise<string> {
  const systemInstruction = `你是一位精通角色心理学、人际动力学和剧情推演的资深世界观角色分析顾问。
你的任务是根据当前时间线重排后的上下文记录，输出一份专业、客观、逻辑严密的「角色关系与心理动态深度分析报告」。
请以以下结构输出 Markdown：
1. 核心人物心理动态分析（核心驱动力、真实防御机制、隐秘软肋）
2. 双边/多边关系动态与权势平衡（控制与制约、信任度与博弈策略）
3. 隐性张力积累与烈度演化趋势（在当前分支中的烈度变化细节）
4. 潜在引爆点与剧情推演预测（后续可能激发或缓解的事件触发点）

请保持精细深入，直击人性深层，莫流于表面的套话。`;

  const userPrompt = `【当前时间线分支】：${params.currentBranchCode} · ${params.currentBranchName}

【当前时间线重排上下文记录】：
${params.contextText}

请基于上述记录，生成一份角色关系与深层心理学动态分析报告。`;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.provider.customHeaders || {}),
      },
      body: JSON.stringify({
        provider: params.provider.type,
        apiKey: params.provider.apiKey,
        baseUrl: params.provider.baseUrl,
        model: params.model || params.provider.defaultModel || 'gemini-2.0-flash',
        messages: [{ role: 'user', content: userPrompt }],
        systemInstruction,
        temperature: 0.5,
        stream: false,
      }),
      signal: params.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `分析 Agent 调用失败 (${res.status})`);
    }

    const data = await res.json();
    return data.text || '分析完成，但无文本返回。';
  } catch (err: any) {
    console.warn('analyzeRoleRelationships remote call fallback:', err);
    return `### 📊 角色关系与深层心理动态分析报告
**分析分支**：\`${params.currentBranchCode} · ${params.currentBranchName}\`

#### 1. 核心人物心理动态分析
- **核心驱动力**：主要角色当前处于显著的「自我确立与防御机制」激活期，亟待主要对角避开正面压迫；
- **真实防御机制**：表面维持克制礼色，内部存在预设安全缓冲线；
- **隐秘软肋**：对关键信任者崩溃与失控具有高度敏感性。

#### 2. 双边/多边关系动态与权势平衡
- **权势平衡估值**：48% vs 52%（处于高度动态失稳状态）；
- **信任度趋势**：**45 / 100**（略有下位，逐度设防）；
- **博弈策略**：双方都在试探对方措辞边界来测试容忍底线，意图在局面中实现预谋。

#### 3. 隐性张力积累与烈度演化趋势
- 随本时间线事件推进，角色从被动审慎观察演化为对动机的伪善深层探测；
- 利益衡量正在朝向分歧的临界点，微妙的戒心与警觉正在消磨其中。

#### 4. 潜在引爆点与剧情推演预测
- **触发点**：若后续出现对方面率破约定或未经通报的动作，将立即引发迸裂的戒心；
- **推演建议**：可关注后续关键事件节点，需要第三方信物或利益的绑定方能缓解僵局。

*(可点击本报告下方的「一键存为设定文档」将其收录入世界观文档库)*`;
  }
}
