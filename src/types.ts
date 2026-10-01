// API Provider Configuration (多API支持：OpenAI / DeepSeek / Claude / Ollama / Gemini 等)
export type ApiProviderType =
  | 'gemini'
  | 'openai'
  | 'claude'
  | 'deepseek'
  | 'ollama'
  | 'openrouter'
  | 'groq'
  | 'custom';

export type ProviderType = ApiProviderType;

export interface ApiProviderConfig {
  id: string;
  name: string;
  type: ApiProviderType;
  baseUrl?: string;
  apiKey?: string;
  defaultModel: string;
  models: string[];
  isCustom?: boolean;
  enabled?: boolean;
  isSystemDefault?: boolean;
  customHeaders?: Record<string, string>; // 自定义请求头（适配不同中转站）
}

// Agent Configuration
export interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  topP?: number;
  contextMessageLimit?: number; // 历史消息上下文上限
  isDefault?: boolean;
  tags?: string[];
  isBuiltin?: boolean;
  model?: string;
}

// Prompt Preset
export interface PromptPreset {
  id: string;
  title: string;
  category: string;
  content: string;
  description?: string;
  tags?: string[];
}

// Message Version for branching / rolling answers
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
  tag: string; // 标签简写，如："主线"、"A1"、"五年后"
  codeTag?: string; // 编号标签（用户快速输入用，如 A1、A12、B1）
  descriptionTag?: string; // 描述标签（如 下药线、下药线·感情上头，由·分隔支持嵌套）
  visible?: boolean; // 标签可见性开关：隐藏的分支消息不发送给AI (PRD 4.6)
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
  floorNumber?: number; // 楼号系统：每条消息强制标注递增楼号 [#1] [#2] [#3] (PRD 4.2)
  codeTag?: string; // 归属分支编号标签（如 A12、通用）
  descriptionTag?: string; // 归属分支描述标签（如 下药线·感情上头）
  isCommon?: boolean; // 是否标记为通用信息 (PRD 4.5)
  isAnalysis?: boolean; // 是否为心理动力学角色关系分析报告
  analysisVisibility?: 'visible' | 'hidden'; // 分析报告的可见性
  analysisBranchCode?: string; // 所属分析分支
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
  systemInstruction?: string; // alias
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

// 2.5 WebDAV 同步配置
export interface WebDavConfig {
  enabled: boolean;
  url: string; // WebDAV 地址 (坚果云、Nextcloud、Alist、自建NAS等)
  username: string; // 用户名
  password?: string; // 应用密码
  syncPath?: string; // 同步文件路径，默认 /guanjie_backup.json
  autoSync: boolean; // 数据变动时自动同步
  lastSyncTime?: number;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  lastError?: string;
}

// 世界观文档库设定
export interface WorldDocument {
  id: string;
  title: string;
  category: 'worldview' | 'character' | 'timeline' | 'analysis' | 'custom';
  content: string; // Markdown 文本
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  groupId: string;
  agentId: string;
  providerId?: string;
  model?: string;
  systemPromptOverride?: string;
  // 3.1 双框提示词区域
  systemPromptFixed?: string; // 用户手写的固定提示词（始终展开）
  systemPromptInjectedCommon?: string; // 注入的通用提示词（默认折叠，推入后走系统提示词缓存）
  isCommonPushed?: boolean; // 推入通用按钮开关状态
  tagDisplayMode?: 'desc' | 'code'; // 标签显示模式：文字版（下药线·感情上头）或字母版（A12）
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
