import {
  ApiProviderConfig,
  Agent,
  ChatMessage,
  AiContextVisibilityFilter,
  KnowledgeItem,
  RegexRule,
  AgentSkill,
  McpServerConfig,
} from '../types';
import { applyRegexRules } from './regexProcessor';
import { generateSmartLocalResponse } from './mockAi';

export interface SendChatParams {
  provider: ApiProviderConfig;
  agent: Agent;
  model: string;
  messages: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  aiContextVisibility?: AiContextVisibilityFilter;
  connectedKnowledge?: KnowledgeItem[];
  activeSkills?: AgentSkill[];
  activeMcpServers?: McpServerConfig[];
  regexRules?: RegexRule[];
  timelineContextPrompt?: string;
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
  aiContextVisibility = 'all',
  connectedKnowledge = [],
  activeSkills = [],
  activeMcpServers = [],
  regexRules = [],
  timelineContextPrompt,
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
    filteredMessagesForAi = messages.filter((m, idx) => {
      if (m.role !== 'assistant') return true;
      return allowedIndices.has(idx);
    });
  }

  // Format message history
  const formattedMessages: { role: string; content: string }[] = [];

  for (const m of filteredMessagesForAi) {
    if (m.role === 'user') {
      const processedContent = applyRegexRules(m.content, regexRules, 'input');
      formattedMessages.push({ role: 'user', content: processedContent });
    } else if (m.role === 'assistant') {
      const currentVersion = m.versions[m.currentVersionIndex] || m.versions[0];
      if (currentVersion && currentVersion.content) {
        formattedMessages.push({ role: 'assistant', content: currentVersion.content });
      }
    } else if (m.role === 'system') {
      formattedMessages.push({ role: 'system', content: m.content });
    }
  }

  // 2. Build system instruction with Knowledge Base, MCP Tools & Skills
  let effectiveSystemPrompt = systemInstruction || agent.systemPrompt || '';

  // 2.1 Knowledge Base Reference
  const activeKnowledge = connectedKnowledge.filter((k) => k.enabled);
  if (activeKnowledge.length > 0) {
    const kbSection = activeKnowledge
      .map(
        (k, idx) =>
          `[知识库参考 ${idx + 1}]: 《${k.title}》\n${k.content.trim()}`
      )
      .join('\n\n');

    effectiveSystemPrompt = `${effectiveSystemPrompt}\n\n# 相关知识库检索参考：\n以下是与本次会话相关的外部知识库资料，请依据以下材料事实回答：\n${kbSection}`;
  }

  // 2.2 MCP Tools Injection (Protocol declaration)
  const connectedMcp = activeMcpServers.filter((s) => s.enabled);
  if (connectedMcp.length > 0) {
    const mcpToolDefinitions = connectedMcp
      .map((server) => {
        const toolList = server.tools
          .map((t) => `- \`${t.name}\`: ${t.description} (参数: ${t.parametersSchema || '{}'})`)
          .join('\n');
        return `[MCP Server: ${server.name} (${server.type})]:\n${toolList}`;
      })
      .join('\n\n');

    effectiveSystemPrompt = `${effectiveSystemPrompt}\n\n# MCP (Model Context Protocol) 外部可用工具协议：\n当前运行环境已连接以下 MCP 服务器。当用户请求需要调用工具时，请生成符合调用意图的调用描述或直接给出工具操作结果：\n${mcpToolDefinitions}`;
  }

  // 2.3 Skills Injection (Trigger matching)
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
  const userText = lastUserMsg ? lastUserMsg.content : '';

  const triggeredSkills = activeSkills.filter((skill) => {
    if (!skill.enabled) return false;
    return skill.triggerKeywords.some((kw) => userText.includes(kw));
  });

  if (triggeredSkills.length > 0) {
    const skillInstructions = triggeredSkills
      .map((s) => `${s.icon} ${s.name}: ${s.systemInstructionInjection}`)
      .join('\n');
    effectiveSystemPrompt = `${effectiveSystemPrompt}\n\n# 当前会话已触发的 Agent Skills 专属技能：\n${skillInstructions}`;
  }

  // 2.4 Timeline Memory Context Injection (Message Tree Context)
  if (timelineContextPrompt) {
    effectiveSystemPrompt = `${effectiveSystemPrompt}\n\n${timelineContextPrompt}`;
  }

  const bodyPayload = {
    provider: provider.type,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    model: model || provider.defaultModel,
    messages: formattedMessages,
    systemInstruction: effectiveSystemPrompt,
    temperature: temperature ?? agent.temperature ?? 0.7,
    maxTokens: agent.maxTokens || 2048,
    stream: Boolean(onChunk),
  };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      signal,
    });

    if (response.ok) {
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed === 'data: [DONE]') {
              continue;
            }

            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.choices?.[0]?.delta?.content) {
                  const delta = parsed.choices[0].delta.content;
                  accumulated += delta;
                  onChunk(accumulated);
                } else if (parsed.text) {
                  accumulated += parsed.text;
                  onChunk(accumulated);
                }
              } catch {
                // ignore
              }
            }
          }
        }

        if (!accumulated && buffer) {
          try {
            const parsed = JSON.parse(buffer);
            accumulated = parsed.text || '';
            onChunk(accumulated);
          } catch {
            // ignore
          }
        }

        const processedOutput = applyRegexRules(accumulated, regexRules, 'output');
        return processedOutput;
      } else {
        const data = await response.json();
        const rawReply = data.text || '';
        const processedOutput = applyRegexRules(rawReply, regexRules, 'output');
        return processedOutput;
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn('Backend API request error, switching to interactive local simulation:', err);
  }

  // Local Smart Fallback Simulation
  const fullReply = generateSmartLocalResponse(
    userText,
    agent,
    messages,
    connectedKnowledge,
    triggeredSkills,
    connectedMcp,
    timelineContextPrompt
  );

  const processedReply = applyRegexRules(fullReply, regexRules, 'output');

  if (onChunk) {
    let streamed = '';
    const stepSize = Math.max(2, Math.floor(processedReply.length / 25));
    for (let i = 0; i < processedReply.length; i += stepSize) {
      if (signal?.aborted) break;
      streamed = processedReply.slice(0, i + stepSize);
      onChunk(streamed);
      await new Promise((r) => setTimeout(r, 22));
    }
  }

  return processedReply;
}

export async function testProviderConnection(provider: ApiProviderConfig): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
}> {
  const startTime = Date.now();
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider.type,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        model: provider.defaultModel || provider.models[0] || 'gemini-3.8-flash',
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
      message: `连接正常！耗时 ${latencyMs}ms`,
    };
  } catch (error: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: error.message || '网络连接超时或地址不可达',
    };
  }
}
