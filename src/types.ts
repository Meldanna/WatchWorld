export type ProviderType =
  | 'gemini'
  | 'openai'
  | 'claude'
  | 'deepseek'
  | 'openrouter'
  | 'groq'
  | 'ollama'
  | 'custom';

export interface ApiProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
  enabled: boolean;
  isSystemDefault?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string; // Emoji or short symbol
  description: string;
  systemPrompt: string;
  providerId?: string;
  model?: string;
  temperature: number;
  maxTokens?: number;
  tags: string[];
  isBuiltin?: boolean;
}

export interface PromptPreset {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'writing' | 'coding' | 'translation' | 'roleplay' | 'productivity' | 'reasoning' | 'custom';
  tags: string[];
}

export interface MessageVersion {
  content: string;
  timestamp: number;
  model?: string;
  providerName?: string;
  latencyMs?: number;
  tokens?: number;
}

// Timeline Branch (记忆整理·时间线分支树)
export interface TimelineBranch {
  id: string;
  name: string; // 时间线名称，如："主线"、"五年后要塞战役"、"IF线：大学时代"
  tag: string; // 标签简写，如："主线"、"五年后"、"大学时代"
  color: string; // 标识色彩，如："indigo" | "emerald" | "amber" | "rose" | "cyan" | "purple"
  description: string; // 核心区分信息/世界观设定特征
  plotSummary: string; // 随剧情发展的脉络发展记录
  keyMilestones?: string[]; // 关键事件节点
  messageIds: string[]; // 归属该时间线消息ID
  parentId?: string; // 父级分支ID（构建消息树）
  forkMessageId?: string; // 分支起始消息ID
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  versions: MessageVersion[];
  currentVersionIndex: number;
  content: string;
  timestamp: number;
  latencyMs?: number;
  tokens?: number;
  timelineId?: string; // 关联的时间线ID
  timelineTag?: string; // 缓存的时间线标签显示
}

// Display Settings for message metrics & chat metadata
export interface MessageDisplaySettings {
  showModelName: boolean; // 是否显示模型名
  showMessageTime: boolean; // 是否显示消息发出时间
  showLatency: boolean; // 是否显示耗时
  showSessionTokens: boolean; // 是否显示本窗口Token统计
  showMessageTokens: boolean; // 是否显示本消息Token
  showTimelineTag?: boolean; // 是否显示时间线分支标签
}

export type AiContextVisibilityFilter =
  | 'all'
  | 'hide_all'
  | 'latest_1'
  | 'latest_2'
  | 'latest_3'
  | 'latest_5';

export interface ChatGroup {
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
}

// Regex Rule for preprocessing input / postprocessing output / highlighting
export interface RegexRule {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  replacement: string;
  scope: 'input' | 'output' | 'both';
  enabled: boolean;
  description?: string;
}

// Knowledge Base Document Chunk / Item
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  enabled: boolean;
  updatedAt: number;
}

// MCP (Model Context Protocol) Server & Tool Definition
export interface McpTool {
  name: string;
  description: string;
  parametersSchema?: string; // JSON schema or description
}

export interface McpServerConfig {
  id: string;
  name: string;
  type: 'sse' | 'stdio' | 'custom_api';
  endpoint: string; // url or command
  apiKey?: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'testing';
  tools: McpTool[];
  description?: string;
}

// Skill Definition (Actionable function/capability with trigger pattern & execution instructions)
export interface AgentSkill {
  id: string;
  name: string;
  icon: string;
  description: string;
  triggerKeywords: string[];
  systemInstructionInjection: string; // Guidance added to system prompt when skill triggers
  toolsNeeded?: string[]; // Mcp tool names or simulated functions
  enabled: boolean;
  isBuiltin?: boolean;
}

// Color Theme
export type ThemePalette =
  | 'emerald'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'cyan'
  | 'midnight';

export type UiMode = 'dark' | 'light';

export interface ChatSession {
  id: string;
  title: string;
  groupId: string;
  agentId: string;
  providerId?: string;
  model?: string;
  systemPromptOverride?: string;
  // Controls how many AI messages AI itself sees in context
  aiContextVisibility: AiContextVisibilityFilter;
  // Controls how many messages are rendered in the UI (0 = all, or e.g. 5, 10, 20)
  uiRenderLimit: number;
  // Active knowledge base IDs connected to this session
  connectedKnowledgeIds: string[];
  // Active skill IDs enabled for this session
  connectedSkillIds?: string[];
  messages: ChatMessage[];
  // 记忆整理·时间线分支树功能
  timelineMemoryEnabled?: boolean; // 是否开启时间线记忆整理
  activeTimelineId?: string; // 当前激活选中的时间线分支ID
  timelines?: TimelineBranch[]; // 会话内的所有时间线分支
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}
