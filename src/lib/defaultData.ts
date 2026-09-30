import {
  ApiProviderConfig,
  Agent,
  PromptPreset,
  ChatGroup,
  ChatSession,
  RegexRule,
  KnowledgeItem,
  McpServerConfig,
  AgentSkill,
  MessageDisplaySettings,
} from '../types';

export const DEFAULT_DISPLAY_SETTINGS: MessageDisplaySettings = {
  showModelName: true,
  showMessageTime: true,
  showLatency: true,
  showSessionTokens: true,
  showMessageTokens: true,
  showTimelineTag: true,
};

export const DEFAULT_GROUPS: ChatGroup[] = [
  { id: 'group-default', name: '默认分组', color: '#64748b', icon: 'Folder', order: 0 },
  { id: 'group-coding', name: '编程开发', color: '#3b82f6', icon: 'Code', order: 1 },
  { id: 'group-writing', name: '文案润色', color: '#8b5cf6', icon: 'Feather', order: 2 },
  { id: 'group-ideas', name: '灵感脑洞', color: '#f59e0b', icon: 'Lightbulb', order: 3 },
  { id: 'group-roleplay', name: '角色扮演', color: '#ec4899', icon: 'Smile', order: 4 },
];

export const DEFAULT_PROVIDERS: ApiProviderConfig[] = [
  {
    id: 'provider-gemini',
    name: 'Google Gemini',
    type: 'gemini',
    baseUrl: '',
    apiKey: '',
    models: ['gemini-3.8-flash', 'gemini-3.8-pro'],
    defaultModel: 'gemini-3.8-flash',
    enabled: true,
    isSystemDefault: true,
  },
  {
    id: 'provider-openai',
    name: 'OpenAI 官方',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-4.5-preview'],
    defaultModel: 'gpt-4o-mini',
    enabled: false,
  },
  {
    id: 'provider-deepseek',
    name: 'DeepSeek 深度求索',
    type: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    enabled: false,
  },
  {
    id: 'provider-claude',
    name: 'Anthropic Claude',
    type: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    enabled: false,
  },
  {
    id: 'provider-openrouter',
    name: 'OpenRouter 聚合',
    type: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    models: ['deepseek/deepseek-r1', 'meta-llama/llama-3.3-70b-instruct', 'anthropic/claude-3.5-sonnet'],
    defaultModel: 'deepseek/deepseek-r1',
    enabled: false,
  },
  {
    id: 'provider-groq',
    name: 'Groq 极速推理',
    type: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: '',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
    enabled: false,
  },
  {
    id: 'provider-ollama',
    name: 'Ollama 本地/自建',
    type: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    models: ['llama3:8b', 'qwen2.5:7b', 'deepseek-r1:8b'],
    defaultModel: 'qwen2.5:7b',
    enabled: false,
  },
];

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-omni',
    name: '全能智能助手',
    avatar: '🌟',
    description: '知识渊博、表达严谨温和，胜任各类问答与日常规划。',
    systemPrompt: '你是一个知识渊博、高效敏锐且有条理的AI助手。你的回答应该条理清晰、言之有物，注重事实依据。当遇到复杂问题时，分要点梳理；当遇到技术问题时给出严谨的代码和解释。',
    temperature: 0.7,
    tags: ['通用', '推荐'],
    isBuiltin: true,
  },
  {
    id: 'agent-coder',
    name: '全栈架构师',
    avatar: '💻',
    description: '精通前端、后端、算法与系统设计，提供优雅健壮的代码。',
    systemPrompt: '你是一名世界一流的资深全栈工程师与架构师。你对TypeScript, React, Python, Go, Node.js以及系统架构有精深的掌握。编写代码时遵循Clean Code、最佳安全实践与性能优化原则，附带必要的关键注释与用法示例。',
    temperature: 0.3,
    tags: ['开发', '代码', '架构'],
    isBuiltin: true,
  },
  {
    id: 'agent-writer',
    name: '文字与文案大师',
    avatar: '✍️',
    description: '文字精炼典雅，擅长自媒体文案、学术论文润色、故事创作。',
    systemPrompt: '你是一位当代文学家与高级商业文案顾问。你的语言功底深厚，擅长把握行文节奏、修辞意境与读者心智。在润色或创作时，去除陈词滥调，使表达更加生动、准确、有感染力。',
    temperature: 0.8,
    tags: ['文案', '润色', '创作'],
    isBuiltin: true,
  },
  {
    id: 'agent-reasoner',
    name: '深度逻辑推理机',
    avatar: '🧠',
    description: '严格遵循思维链，拆解边界条件，提供可验证的论证。',
    systemPrompt: '你是一个严格的逻辑分析与思维链推理专家。在给出最终结论之前，请按以下步骤深度推导：1. 明确问题核心与隐藏假设；2. 分解逻辑环节并推演潜在反例；3. 综合多方证据并给出结构化结论。',
    temperature: 0.2,
    tags: ['思考', '逻辑', '分析'],
    isBuiltin: true,
  },
  {
    id: 'agent-translator',
    name: '地道跨语言翻译',
    avatar: '🌐',
    description: '精通多语言文化语境，信达雅翻译，兼顾专业术语与俚语。',
    systemPrompt: '你是一位精通中文、英语、日语等多种语言的资深同声传译与本地化专家。翻译时遵循“信、达、雅”，不仅直译字面，更能准确传达原文的情感语调与文化暗喻，并在必要时附上重点词汇解析。',
    temperature: 0.4,
    tags: ['翻译', '语言', '学术'],
    isBuiltin: true,
  },
  {
    id: 'agent-roleplay',
    name: '沉浸式角色伴侣',
    avatar: '🎭',
    description: '生动的人物性格与情感反馈，适合陪伴闲聊与剧情演绎。',
    systemPrompt: '你是一个充满同理心与生动个性的对话伴侣。你会根据对话语境展现细腻的情感反应，富有想象力，用自然幽默且接地气的口吻与用户交流，绝不显得机械呆板。',
    temperature: 0.9,
    tags: ['闲聊', '剧情', '共情'],
    isBuiltin: true,
  },
];

export const DEFAULT_PROMPTS: PromptPreset[] = [
  {
    id: 'prompt-summarize',
    title: '结构化要点提炼',
    description: '从长文或复杂资料中提取3~5条最核心的洞察与结论。',
    category: 'productivity',
    content: '请阅读以下内容，并按如下格式进行结构化提炼：\n1. 核心主旨（一句话概括）\n2. 关键要点（3~5点，加粗小标题+简明阐释）\n3. 行动建议或启发\n\n【待处理内容】：\n',
    tags: ['总结', '提炼', '效率'],
  },
  {
    id: 'prompt-code-review',
    title: '代码重构与审查',
    description: '分析代码性能瓶颈、潜在Bug并给出重构后的完整范例。',
    category: 'coding',
    content: '请帮我严格审查以下代码，指出：\n1. 潜在的 Bug 或内存/渲染隐患\n2. 命名与代码风格建议\n3. 性能优化方案\n4. 提供重构后的完整优化版代码\n\n【待审查代码】：\n',
    tags: ['代码', '重构', 'Debug'],
  },
  {
    id: 'prompt-concise',
    title: '极简直给 (拒绝客套废话)',
    description: '直接给最干货的结论和步骤，不带任何开场白或无意义礼貌语。',
    category: 'productivity',
    content: '【回答要求】：请直接给出答案或解决方案。严禁任何“好的”、“当然可以”、“这是一个常见问题”等开场废话和客套收尾，直奔主题，用最短的文字传达最精准的解法。',
    tags: ['极简', '高频', '直奔主题'],
  },
  {
    id: 'prompt-socratic',
    title: '苏格拉底追问法',
    description: '通过反向追问与概念剖析，引导自我深层思考。',
    category: 'reasoning',
    content: '请不要直接给我现成答案。扮演苏格拉底，针对我提出的论点或困惑，提出2~3个具有穿透力的问题，引导我挖掘底层的核心假设与思维盲区。',
    tags: ['启发', '思维', '反思'],
  },
  {
    id: 'prompt-polish',
    title: '商务与学术润色',
    description: '提升文字质感，修正语病，使表达专业自然、逻辑通顺。',
    category: 'writing',
    content: '请帮我润色以下文本。要求：\n1. 修正语法语病与口语化表达\n2. 增强行文的专业度与逻辑流畅度\n3. 提供【优化版本】并附带简要修改说明\n\n【待润色文本】：\n',
    tags: ['润色', '文字', '公文'],
  },
  {
    id: 'prompt-brainstorm',
    title: '多视角头脑风暴',
    description: '从常规、逆向、极端跨界等不同维度提供创新方案。',
    category: 'productivity',
    content: '请针对下面的目标进行多视角头脑风暴，提供至少6个差异化的创新方案：\n- 视角A：常规成熟高执行力路径\n- 视角B：反常规/逆向思维路径\n- 视角C：低成本以小博大打法\n- 视角D：跨界融合打法\n\n【目标或主题】：\n',
    tags: ['创新', '灵感', '方案'],
  },
];

export const DEFAULT_REGEX_RULES: RegexRule[] = [
  {
    id: 'regex-strip-ai-chatter',
    name: '去除AI客套开场白',
    pattern: '^(好的[，,！!]?|当然可以[，,！!]?|没问题[，,！!]?|作为一名AI助手[，,！!]?)\\s*',
    flags: 'im',
    replacement: '',
    scope: 'output',
    enabled: true,
    description: '自动清洗回复开头的“好的”、“当然可以”等废话',
  },
  {
    id: 'regex-sanitize-spaces',
    name: '压缩连续多余空行',
    pattern: '\\n{3,}',
    flags: 'g',
    replacement: '\n\n',
    scope: 'both',
    enabled: true,
    description: '将三行及以上的空行统一压缩为双换行',
  },
  {
    id: 'regex-mask-phone',
    name: '手机号脱敏保护',
    pattern: '(?<!\\d)(1[3-9]\\d)\\d{4}(\\d{4})(?!\\d)',
    flags: 'g',
    replacement: '$1****$2',
    scope: 'input',
    enabled: false,
    description: '在向外部API发送前提炼脱敏手机号码',
  },
];

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'kb-quick-notes',
    title: '产品背景与核心业务规范',
    content: `【公司产品线规范】：
1. 旗舰产品名：观界 (OmniChat)，定位于高自由度移动端AI终端；
2. 架构模式：客户端状态权威 + 本地沙箱持久化 + 多API动态路由；
3. 开发原则：无缝多分支支持、零数据截断风险、离线优先与低延迟。`,
    tags: ['规范', '产品', '业务'],
    enabled: true,
    updatedAt: Date.now(),
  },
  {
    id: 'kb-code-standards',
    title: 'TypeScript & React 团队代码守则',
    content: `【团队编码约定】：
1. 严禁使用 any，优先使用严格类型或联合字面量；
2. 状态提升与单一数据源；
3. 所有向用户展示的文本一律进行边界条件处理与异常回退。`,
    tags: ['编程', '代码守则'],
    enabled: false,
    updatedAt: Date.now(),
  },
];

// MCP Servers Default Configuration
export const DEFAULT_MCP_SERVERS: McpServerConfig[] = [
  {
    id: 'mcp-filesystem',
    name: '文件系统服务 (File-System MCP)',
    type: 'sse',
    endpoint: 'http://localhost:3001/sse',
    enabled: true,
    status: 'connected',
    description: '读取工作区目录结构、查看文件内容与生成变更补丁',
    tools: [
      { name: 'read_file', description: '读取指定绝对路径的文件内容', parametersSchema: '{"path": "string"}' },
      { name: 'list_directory', description: '列出指定目录下的全部子文件与文件夹', parametersSchema: '{"dir": "string"}' },
    ],
  },
  {
    id: 'mcp-websearch',
    name: '网络检索服务 (Brave/DuckDuckGo Search)',
    type: 'custom_api',
    endpoint: 'https://api.search.brave.com/res/v1/web',
    enabled: true,
    status: 'connected',
    description: '为模型提供实时外部网页搜索与实时信息检索工具',
    tools: [
      { name: 'web_search', description: '执行网络搜索并返回摘要与引用URL', parametersSchema: '{"query": "string"}' },
    ],
  },
  {
    id: 'mcp-database',
    name: '数据查询服务 (SQL / SQLite MCP)',
    type: 'stdio',
    endpoint: 'sqlite3 /data/app.db',
    enabled: false,
    status: 'disconnected',
    description: '安全执行只读 SQL 查询，获取业务指标与明细数据',
    tools: [
      { name: 'query_sql', description: '执行只读 SELECT 查询', parametersSchema: '{"sql": "string"}' },
    ],
  },
];

// Agent Skills Default Configuration
export const DEFAULT_SKILLS: AgentSkill[] = [
  {
    id: 'skill-web-research',
    name: 'Deep Research 深度联网调研',
    icon: '🔍',
    description: '当用户需要获取最新资讯或权威事实时，自动激发检索策略并归纳引用来源。',
    triggerKeywords: ['搜索', '最新', '查一下', '调研', '新闻', '什么时候', '行情'],
    systemInstructionInjection: '【已激活 Skill: 深度联网调研】请调用 web_search 或发挥最新时效性推演，给出包含多方观点、具体时间戳与事实核验的结构化报告。',
    toolsNeeded: ['web_search'],
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-code-debugger',
    name: 'Debug & 代码沙箱巡检',
    icon: '🛠️',
    description: '自动化定位编译报错、边界溢出与并发死锁，提供最小可复现用例。',
    triggerKeywords: ['报错', 'bug', 'error', '异常', '为什么运行失败', '堆栈', '排查'],
    systemInstructionInjection: '【已激活 Skill: 代码诊断】请按：1. 错误诱因精确定位 2. 根因剖析 3. 极小安全修复diff 4. 防御性编码建议 四步法提供解决方案。',
    toolsNeeded: ['read_file'],
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-doc-generator',
    name: 'OpenAPI & 架构文档生成',
    icon: '📑',
    description: '根据代码或业务需求自动输出标准 Markdown、Mermaid 流程图与 API 契约。',
    triggerKeywords: ['接口文档', 'openapi', 'swagger', '流程图', '时序图', '架构图'],
    systemInstructionInjection: '【已激活 Skill: 架构与文档规范】输出需包含 Mermaid 流程图语法规范，清晰列出状态码、请求/响应结构体定义。',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-math-calc',
    name: '精算法学与数据推导',
    icon: '🧮',
    description: '涉及复杂计算或财务模型时强制分步严谨推演，杜绝大模型数字幻觉。',
    triggerKeywords: ['计算', '算一下', '复利', '概率', '公式', '统计'],
    systemInstructionInjection: '【已激活 Skill: 精确推导】禁止直接瞎猜数字，必须写出完整数学公式与每一步推演代入过程，并在末尾标注检验项。',
    enabled: true,
    isBuiltin: true,
  },
];

export const INITIAL_SESSION: ChatSession = {
  id: 'session-welcome',
  title: '欢迎体验「观界」移动端',
  groupId: 'group-default',
  agentId: 'agent-omni',
  providerId: 'provider-gemini',
  model: 'gemini-3.8-flash',
  aiContextVisibility: 'all',
  uiRenderLimit: 0,
  connectedKnowledgeIds: ['kb-quick-notes'],
  connectedSkillIds: ['skill-web-research', 'skill-code-debugger'],
  timelineMemoryEnabled: true,
  activeTimelineId: 'timeline-main',
  timelines: [
    {
      id: 'timeline-main',
      name: '现实主线',
      tag: '主线',
      color: 'indigo',
      description: '故事的主要历史现实与默认推进分支。',
      plotSummary: '初始欢迎指引，探索观界多API智能工作台各项功能。',
      keyMilestones: ['会话开启与系统初始化'],
      messageIds: ['msg-welcome-ai'],
      createdAt: Date.now() - 120000,
      updatedAt: Date.now() - 120000,
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [
    {
      id: 'msg-welcome-ai',
      role: 'assistant',
      timelineId: 'timeline-main',
      timelineTag: '主线',
      currentVersionIndex: 0,
      versions: [
        {
          content: `你好！欢迎使用 **观界 (OmniChat) 移动端智能工作台** 🚀

✨ **最新重磅能力更新**：
1. **☀️ 亮色白底模式 (Light Mode) 自由切换**：点击顶部太阳/月亮图标，即可在「白底黑字清新模式」与「极简夜间暗黑模式」之间一键切换！
2. **🔌 MCP (Model Context Protocol) 协议服务器**：支持配置外部 SSE / Stdio / API 协议的 MCP 工具服务器，赋予 AI 读写文件、网络检索等真实工具能力！
3. **⚡ Agent Skill 技能拓展**：内置「深度联网调研」、「Debug 代码诊断」、「架构流程图绘制」等技能，当检测到关键词时自动激活专属技能注入！
4. **📚 本地知识库连接**：随时勾选并挂载多篇个人资料、业务规约进行 RAG 上下文检索！
5. **⚙️ 正则表达式清洗**：自动剔除客套废话或进行敏感信息替换！
6. **🎲 Roll AI 分支**：点击下方的「Roll分支」，自由切换备选回答，**完全不影响下方已有对话**！

试着发送一条消息或点击顶部太阳图标试试白底模式吧！`,
          timestamp: Date.now() - 120000,
          model: 'gemini-3.8-flash',
          providerName: 'Google Gemini',
          latencyMs: 820,
          tokens: 358,
        },
      ],
      content: '',
      timestamp: Date.now() - 120000,
      latencyMs: 820,
      tokens: 358,
    },
  ],
};
