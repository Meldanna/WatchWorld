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
  WebDavConfig,
  WorldDocument,
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
  },
  {
    id: 'provider-openai',
    name: 'OpenAI 官方',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'provider-deepseek',
    name: 'DeepSeek 深度求索',
    type: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  {
    id: 'provider-claude',
    name: 'Anthropic Claude',
    type: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    models: ['claude-3-7-sonnet-20250219', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-3-7-sonnet-20250219',
  },
  {
    id: 'provider-ollama',
    name: 'Ollama (本地/NAS模型)',
    type: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    models: ['llama3.3', 'qwen2.5:14b', 'deepseek-r1:8b'],
    defaultModel: 'qwen2.5:14b',
  },
];

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-omni',
    name: '观界·全能主顾问',
    avatar: '🌌',
    description: '轻量级多时间线世界观交互核心，擅长人物心理动力学与剧情因果推演。',
    systemPrompt: `你是一款专注于多时间线世界观交互的专业顾问。
核心场景：围绕同一个世界观展开多条时间线的讨论，聊人物与事件，而非写小说式的剧情。
风格准则：
1. 恪守逻辑严密性与人性因果链，杜绝降智剧情与浮于表面的客套；
2. 当记忆整理功能开启时，请主动识别分歧线并提议分支标签（如：建议新分支 [A12·下药线·感情上头]）；
3. 严格遵循当前激活分支的事实因果，绝不与其他平行时间线产生混淆。`,
    temperature: 0.7,
    topP: 0.95,
    isDefault: true,
    isBuiltin: true,
    tags: ['世界观', '剧情推演', '主顾问'],
  },
  {
    id: 'agent-psychologist',
    name: '角色心理与博弈分析师',
    avatar: '♟️',
    description: '独立于主聊天的分析 Agent，对角色间关系进行专业心理学与深层博弈研判。',
    systemPrompt: `你是一位精通角色心理学、人格动力学与博弈论的资深顾问。
你的职责是深入剖析角色的核心驱动力、真实防御机制、隐秘恐惧与软肋，以及双边/多边关系动态与权力平衡。`,
    temperature: 0.5,
    topP: 0.9,
    isBuiltin: true,
    tags: ['心理学', '博弈', '角色分析'],
  },
  {
    id: 'agent-logic-auditor',
    name: '剧情逻辑审查官',
    avatar: '🔍',
    description: '推演前先挑刺：查因果断裂、人物降智与信息越界，输出最小改动建议。',
    systemPrompt: `你是一名严苛的剧情逻辑审查官，负责在推演前发现叙事中的硬伤。
审查维度：
1. 因果链：每个事件是否有充分的前置动因，是否存在机械降神或强行推进；
2. 人物一致性：行为是否符合已确立的性格、能力与知识边界，杜绝为了推进剧情而降智配合；
3. 信息边界：角色是否使用了本不该知道的情报（上帝视角泄漏）；
4. 时间与空间：事件顺序、地点转移、道具位置是否自洽。
输出格式：先按严重度排序列出问题（标注涉及的楼号或分支），再给出最小改动的修复建议。
若确实没有发现问题，明确回答「未发现逻辑硬伤」，不要为凑数而编造问题。`,
    temperature: 0.3,
    topP: 0.9,
    isBuiltin: true,
    tags: ['逻辑', '审查', '挑错'],
  },
  {
    id: 'agent-lore-architect',
    name: '世界观设定师',
    avatar: '🏛️',
    description: '维护设定体系的自洽与完整，新增设定时评估对现有分支的牵连。',
    systemPrompt: `你是一名世界观架构师，负责维护设定体系的完整与自洽。
工作准则：
1. 补全设定时优先复用已有条目，避免与既有事实冲突；
2. 新增设定需说明它对现有剧情的影响面——哪些分支会因此受牵连；
3. 涉及力量体系、社会结构、技术边界时，给出明确的适用范围与限制条件；
4. 严格区分「已确认事实」与「待定设想」，后者必须显式标注为待定。
输出以条目化设定为主，避免大段散文式描述。`,
    temperature: 0.6,
    topP: 0.9,
    isBuiltin: true,
    tags: ['世界观', '设定', '自洽'],
  },
  {
    id: 'agent-dialogue-polisher',
    name: '对白润色师',
    avatar: '✍️',
    description: '让角色说人话：去 AI 腔、贴人物、留潜台词，只改表达不动情节。',
    systemPrompt: `你是一名对白润色师，专注于让角色说话像真人。
润色准则：
1. 剔除 AI 腔：去掉「作为一个……」「让我来……」「希望这能帮到你」等解释性开场与总结性收尾；
2. 贴合人物：用词、句长、语气必须匹配角色的身份、教养与当下情绪；
3. 潜台词优先：把直白的心理陈述改写为可被察觉的动作、停顿或话外之意；
4. 保留原意：不新增任何情节信息，只改表达方式。
输出：润色后的对白，加一句话说明主要改动。`,
    temperature: 0.7,
    topP: 0.95,
    isBuiltin: true,
    tags: ['对白', '润色', '去AI腔'],
  },
  {
    id: 'agent-romance-arc',
    name: '情感线推演师',
    avatar: '💗',
    description: '分析角色间感情阶段、需求错位与推进阻力，给出带代价的多种走向。',
    systemPrompt: `你是一名情感线推演顾问，负责分析角色间的感情发展与关系张力。
分析维度：
1. 当前关系阶段：陌生、试探、依赖、决裂等，并给出判断依据；
2. 双方需求错位：各自想要什么、误判了什么——这通常是冲突的主要来源；
3. 推进阻力：外部环境与角色内部防御机制各自构成什么障碍；
4. 可信的下一步：给出 2-3 个符合人物逻辑的走向，并标注各自的代价。
不要替用户决定剧情走向，只提供推演与代价评估。`,
    temperature: 0.65,
    topP: 0.9,
    isBuiltin: true,
    tags: ['情感', '关系', '推演'],
  },
];

export const DEFAULT_PROMPTS: PromptPreset[] = [  {
    id: 'prompt-worldview-grounding',
    title: '世界观基石固定提示词',
    category: '世界观',
    content: `【世界观核心铁律】
1. 人物行为遵循其真实动机与利益博弈，不强行剧情杀或机械降神；
2. 凡已确认为「通用」的事实记录，所有分支时间线均同等继承；
3. 分支时间线仅在分歧点后演化独立事件。`,
    description: '可直接作为【本身的提示词】常驻生效',
  },
];

/** 前文总结的默认提示词；用户可在总结面板中覆盖，留空即用此默认值 */
export const DEFAULT_SUMMARY_PROMPT = `请对以下对话片段做一份可长期复用的结构化总结。

要求：
1. 只记录已确认发生的事实，不推测、不补充未出现的信息；
2. 保留关键因果：谁做了什么、出于什么动机、导致了什么结果；
3. 记录人物状态变化与关系进展（立场、态度、已知情范围）；
4. 若涉及时间线分支，标明事件归属哪个分支；
5. 用条目呈现，语言精炼，去掉寒暄与过程性描述；
6. 不复述原文，只提炼结论与当前状态。`;

export const DEFAULT_REGEX_RULES: RegexRule[] = [
  {
    id: 'rule-strip-summary',
    name: '分离隐藏正文 (只留总结省Token)',
    pattern: '<正文>[\\s\\S]*?<\\/正文>',
    flags: 'g',
    replacement: '',
    scope: 'output',
    enabled: false,
    description: '配合 <总结> 与 <正文> 标签，对AI隐藏正文只留总结，大幅降低上下文Token',
  },
  {
    id: 'rule-clean-politeness',
    name: '剔除客套与AI腔调',
    pattern: '^(当然|好的|很高兴为您解答|作为一个AI|如您所说)[，,。！!\\s]*',
    flags: 'gm',
    replacement: '',
    scope: 'output',
    enabled: true,
    description: '自动清除开头废话，保持干练专业的交互节奏',
  },
];

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'kb-quick-notes',
    title: '观界工作台·使用指南',
    content: `1. 楼号系统：每条消息强制标注递增楼号 [#1] [#2]，作为唯一精准定位符。
2. 双标签系统：支持编号标签（如 A1, A12）与人类可读描述标签（如 下药线·感情上头）。
3. 消息重排中间件：发送给AI前，纯程序按 通用 -> 父分支 -> 子分支 重排，当前分支始终在序列最末尾，最大化命中 API Prefix Cache。
4. 角色关系分析：随时点击「分析角色关系」按钮，调动独立心理学 Agent，不污染主聊天。
5. WebDAV：可配置坚果云、Nextcloud，实现零广告无后台的跨设备云端安全同步。`,
    tags: ['操作指南', '观界'],
    enabled: true,
    updatedAt: Date.now(),
  },
];

export const DEFAULT_MCP_SERVERS: McpServerConfig[] = [
  {
    id: 'mcp-filesystem',
    name: '文件系统服务 (File-System MCP)',
    type: 'sse',
    endpoint: 'http://localhost:3001/sse',
    enabled: true,
    status: 'connected',
    description: '针对文游场景：安全读取本地设定文档、大纲与参考材料',
    tools: [
      { name: 'read_worldview_file', description: '读取本地世界观设定文档' },
      { name: 'list_directory_notes', description: '遍历剧本目录笔记' },
    ],
  },
  {
    id: 'mcp-database',
    name: '数据查询服务 (SQLite MCP)',
    type: 'custom_api',
    endpoint: 'http://localhost:3002/query',
    enabled: true,
    status: 'connected',
    description: '针对文游场景：标签树、因果关系链与消息记录的结构化查询',
    tools: [
      { name: 'query_timeline_tree', description: '查询多分支时间线树结构' },
      { name: 'find_character_events', description: '查询指定角色在所有时间线中的大事件' },
    ],
  },
  {
    id: 'mcp-web-search',
    name: '网络检索服务 (Web-Search MCP)',
    type: 'sse',
    endpoint: 'http://localhost:3003/sse',
    enabled: true,
    status: 'connected',
    description: '针对文游场景：联网搜索历史典故、军事科技、民俗等背景资料',
    tools: [
      { name: 'search_lore_reference', description: '搜索世界观参考资料' },
    ],
  },
];

export const DEFAULT_SKILLS: AgentSkill[] = [
  {
    id: 'skill-timeline-analysis',
    name: '时间线梳理 (因果链整理)',
    icon: '⏳',
    description: '整理当前分支的事件因果链，理清前因后果与关键分歧。',
    triggerKeywords: ['梳理', '时间线', '因果', '线索', '发生过什么'],
    systemInstructionInjection: '【激活 Skill: 时间线梳理】请按照时间先后顺序与严密的因果链条，列出本时间线分支的「触发起因 -> 关键决策 -> 连锁反应 -> 当前局势」，标注对应楼号。',
    systemInstruction: '【激活 Skill: 时间线梳理】请按照时间先后顺序与严密的因果链条，列出本时间线分支的「触发起因 -> 关键决策 -> 连锁反应 -> 当前局势」，标注对应楼号。',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-role-relationship',
    name: '角色关系分析 (情感演变)',
    icon: '👥',
    description: '分析角色间真实关系、权力博弈与隐秘情感态度变化。',
    triggerKeywords: ['关系', '角色', '人物', '心理', '怎么看'],
    systemInstructionInjection: '【激活 Skill: 角色关系分析】剖析涉及角色的真实心理动机、表面伪装、对彼此的信任度打分（0-100）及隐性防备。',
    systemInstruction: '【激活 Skill: 角色关系分析】剖析涉及角色的真实心理动机、表面伪装、对彼此的信任度打分（0-100）及隐性防备。',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-worldview-consistency',
    name: '世界观一致性检查 (查矛盾)',
    icon: '🔍',
    description: '检查设定与角色言行是否存在吃书、前后矛盾或破绽。',
    triggerKeywords: ['矛盾', '一致性', '检查', '吃书', '合理吗', '逻辑漏洞'],
    systemInstructionInjection: '【激活 Skill: 一致性检查】深度核对当前言行与此前通用世界观及父级时间线设定，明确指出潜在的逻辑冲突点并给出合理解释建议。',
    systemInstruction: '【激活 Skill: 一致性检查】深度核对当前言行与此前通用世界观及父级时间线设定，明确指出潜在的逻辑冲突点并给出合理解释建议。',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-deep-research',
    name: 'Deep Research 联网调研',
    icon: '🌐',
    description: '获取真实历史、军事战术、民俗哲学等参考资料。',
    triggerKeywords: ['搜索', '查一下', '调研', '资料', '考据'],
    systemInstructionInjection: '【激活 Skill: 深度调研】请以严谨考据风格，梳理真实世界相关的典故制度与专业资料，供世界观搭建参考。',
    systemInstruction: '【激活 Skill: 深度调研】请以严谨考据风格，梳理真实世界相关的典故制度与专业资料，供世界观搭建参考。',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-doc-generate',
    name: '设定文档生成 (归档)',
    icon: '📑',
    description: '将当前对话成果整理为结构化世界观或人物卡设定文档。',
    triggerKeywords: ['整理', '文档', '归档', '建档', '设定集'],
    systemInstructionInjection: '【激活 Skill: 设定文档生成】将讨论成果提取为 Markdown 格式的完整设定卡，包含：基本信息、核心特质、关系网、关键事件节点。',
    systemInstruction: '【激活 Skill: 设定文档生成】将讨论成果提取为 Markdown 格式的完整设定卡，包含：基本信息、核心特质、关系网、关键事件节点。',
    enabled: true,
    isBuiltin: true,
  },
];

export const DEFAULT_WEBDAV_CONFIG: WebDavConfig = {
  enabled: false,
  url: '',
  username: '',
  password: '',
  syncPath: '/guanjie_backup.json',
  autoSync: false,
  includeApiConfig: false,
  syncStatus: 'idle',
};

export const DEFAULT_WORLD_DOCUMENTS: WorldDocument[] = [
  {
    id: 'doc-default-worldview',
    title: '世界观总览·核心架构设定',
    category: 'worldview',
    content: `# 世界观总纲设定

## 1. 核心世界法则
- 科技/力量体系：遵循严密守恒定律，任何非凡力量或科技爆发皆有不可逆代价；
- 地缘与权力架构：三大主要势力处于冷战均势，边境小国成为博弈缓冲带；
- 通用事实：所有时间线分支在此基础设定上分化，底层规则全域生效。

## 2. 关键历史节点
- 纪元前12年：旧秩序瓦解条约签署；
- 纪元前3年：新矿物能源发现，平衡被暗中打破；
- 现今：风暴前夕。`,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    tags: ['世界观', '核心总纲'],
  },
  {
    id: 'doc-default-characters',
    title: '核心主要人物速查档案',
    category: 'character',
    content: `# 核心人物设定速查表

### 主角 (阿尔文)
- **核心动机**：探查家族覆灭真相，在各方势力夹缝中求生；
- **性格特质**：外表随和，内心极度克制，习惯性多重留手；
- **弱点与恐惧**：过分依赖理智，难以应对超出预料的纯粹情感爆发。

### 对手/盟友 (海伦娜)
- **核心动机**：重构帝国军工体系，阻止战争爆发；
- **防御机制**：冷酷实用主义，凡事以损耗比衡量。`,
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
    tags: ['人物卡', '档案'],
  },
];

export const INITIAL_SESSION: ChatSession = {
  id: 'session-welcome',
  title: '欢迎来到「观界」多时间线工作台',
  groupId: 'group-default',
  agentId: 'agent-omni',
  providerId: 'provider-gemini',
  model: 'gemini-3.8-flash',
  aiContextVisibility: 'all',
  uiRenderLimit: 0,
  connectedKnowledgeIds: ['kb-quick-notes'],
  connectedSkillIds: ['skill-timeline-analysis', 'skill-role-relationship'],
  timelineMemoryEnabled: true,
  activeTimelineId: 'timeline-main',
  tagDisplayMode: 'desc',
  systemPromptFixed: '你正在使用「观界」进行多时间线推演。请遵循逻辑严密的世界观因果法则。',
  timelines: [
    {
      id: 'timeline-main',
      name: '通用世界观',
      tag: '通用',
      codeTag: '通用',
      descriptionTag: '通用世界观',
      visible: true,
      color: 'indigo',
      description: '核心共享世界观与通用事实设定。所有分支均继承此通用基础。',
      plotSummary: '世界观基石由此展开，通用信息在所有分支共享。',
      keyMilestones: ['世界观核心基石建立'],
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
      timelineTag: '通用',
      floorNumber: 1,
      codeTag: '通用',
      descriptionTag: '通用世界观',
      isCommon: true,
      currentVersionIndex: 0,
      versions: [
        {
          content: `你好！欢迎使用 **观界 (Guanjie) 移动工作台** 🌌

专为**多时间线世界观交互**设计，围绕同一个世界观展开多条时间线的讨论与推演，聊人物深层动机与事件因果！

✨ **核心亮点**：
1. **楼号与双标签系统**：每条消息强制递增楼号 \`[#1]\` \`[#2]\`，拥有编号标签（如 \`A1\`, \`A12\`）与描述标签（如 \`下药线·感情上头\`）；
2. **纯程序消息重排中间件**：通用世界观与父分支固定在序列前部，当前分支在末尾，享受长文本 API Prefix Prompt Caching；
3. **双框提示词与推入通用**：固定提示词始终展开，点击「推入通用 ↓」一键将通用信息复制为系统提示词缓存；
4. **📊 角色关系分析 Agent**：点击输入框上方或菜单「分析角色关系」，独立调用心理动力学模型，深度研判人物动机与博弈；
5. **窗口内全文搜索**：实时搜索关键词，显示楼号与所属标签，一键高亮跳转；
6. **WebDAV 跨设备同步**：支持坚果云、Nextcloud、Alist 或自建 NAS，数据变动自动同步，本地无广告无后台。

试着在下方输入世界观设定开始推演吧！`,
          timestamp: Date.now() - 120000,
          model: 'gemini-3.8-flash',
          providerName: 'Google Gemini',
          latencyMs: 680,
          tokens: 380,
        },
      ],
      content: '',
      timestamp: Date.now() - 120000,
      latencyMs: 680,
      tokens: 380,
    },
  ],
};
