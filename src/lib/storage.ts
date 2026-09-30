import {
  ApiProviderConfig,
  Agent,
  PromptPreset,
  ChatGroup,
  ChatSession,
  RegexRule,
  KnowledgeItem,
  ThemePalette,
  UiMode,
  McpServerConfig,
  AgentSkill,
  MessageDisplaySettings,
} from '../types';
import {
  DEFAULT_PROVIDERS,
  DEFAULT_GROUPS,
  DEFAULT_AGENTS,
  DEFAULT_PROMPTS,
  DEFAULT_REGEX_RULES,
  DEFAULT_KNOWLEDGE_BASE,
  DEFAULT_MCP_SERVERS,
  DEFAULT_SKILLS,
  INITIAL_SESSION,
  DEFAULT_DISPLAY_SETTINGS,
} from './defaultData';

const STORAGE_KEYS = {
  PROVIDERS: 'omnichat_providers',
  ACTIVE_PROVIDER_ID: 'omnichat_active_provider_id',
  GROUPS: 'omnichat_groups',
  AGENTS: 'omnichat_agents',
  PROMPTS: 'omnichat_prompts',
  SESSIONS: 'omnichat_sessions',
  ACTIVE_SESSION_ID: 'omnichat_active_session_id',
  REGEX_RULES: 'omnichat_regex_rules',
  KNOWLEDGE_BASE: 'omnichat_knowledge_base',
  THEME_PALETTE: 'omnichat_theme_palette',
  UI_MODE: 'omnichat_ui_mode',
  MCP_SERVERS: 'omnichat_mcp_servers',
  SKILLS: 'omnichat_skills',
  DISPLAY_SETTINGS: 'omnichat_display_settings',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error loading ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing ${key} to localStorage:`, err);
  }
}

export const Storage = {
  getProviders(): ApiProviderConfig[] {
    const list = safeGet<ApiProviderConfig[]>(STORAGE_KEYS.PROVIDERS, DEFAULT_PROVIDERS);
    const map = new Map(list.map((p) => [p.id, p]));
    for (const def of DEFAULT_PROVIDERS) {
      if (!map.has(def.id)) {
        list.push(def);
      }
    }
    return list;
  },

  setProviders(providers: ApiProviderConfig[]) {
    safeSet(STORAGE_KEYS.PROVIDERS, providers);
  },

  getActiveProviderId(): string {
    return safeGet<string>(STORAGE_KEYS.ACTIVE_PROVIDER_ID, 'provider-gemini');
  },

  setActiveProviderId(id: string) {
    safeSet(STORAGE_KEYS.ACTIVE_PROVIDER_ID, id);
  },

  getGroups(): ChatGroup[] {
    const list = safeGet<ChatGroup[]>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    if (!list || list.length === 0) return DEFAULT_GROUPS;
    return list;
  },

  setGroups(groups: ChatGroup[]) {
    safeSet(STORAGE_KEYS.GROUPS, groups);
  },

  getAgents(): Agent[] {
    const list = safeGet<Agent[]>(STORAGE_KEYS.AGENTS, DEFAULT_AGENTS);
    const map = new Map(list.map((a) => [a.id, a]));
    for (const def of DEFAULT_AGENTS) {
      if (!map.has(def.id)) {
        list.push(def);
      }
    }
    return list;
  },

  setAgents(agents: Agent[]) {
    safeSet(STORAGE_KEYS.AGENTS, agents);
  },

  getPrompts(): PromptPreset[] {
    const list = safeGet<PromptPreset[]>(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
    const map = new Map(list.map((p) => [p.id, p]));
    for (const def of DEFAULT_PROMPTS) {
      if (!map.has(def.id)) {
        list.push(def);
      }
    }
    return list;
  },

  setPrompts(prompts: PromptPreset[]) {
    safeSet(STORAGE_KEYS.PROMPTS, prompts);
  },

  getRegexRules(): RegexRule[] {
    const list = safeGet<RegexRule[]>(STORAGE_KEYS.REGEX_RULES, DEFAULT_REGEX_RULES);
    const map = new Map(list.map((r) => [r.id, r]));
    for (const def of DEFAULT_REGEX_RULES) {
      if (!map.has(def.id)) {
        list.push(def);
      }
    }
    return list;
  },

  setRegexRules(rules: RegexRule[]) {
    safeSet(STORAGE_KEYS.REGEX_RULES, rules);
  },

  getKnowledgeBase(): KnowledgeItem[] {
    const list = safeGet<KnowledgeItem[]>(STORAGE_KEYS.KNOWLEDGE_BASE, DEFAULT_KNOWLEDGE_BASE);
    const map = new Map(list.map((k) => [k.id, k]));
    for (const def of DEFAULT_KNOWLEDGE_BASE) {
      if (!map.has(def.id)) {
        list.push(def);
      }
    }
    return list;
  },

  setKnowledgeBase(items: KnowledgeItem[]) {
    safeSet(STORAGE_KEYS.KNOWLEDGE_BASE, items);
  },

  getThemePalette(): ThemePalette {
    return safeGet<ThemePalette>(STORAGE_KEYS.THEME_PALETTE, 'emerald');
  },

  setThemePalette(theme: ThemePalette) {
    safeSet(STORAGE_KEYS.THEME_PALETTE, theme);
  },

  getUiMode(): UiMode {
    return safeGet<UiMode>(STORAGE_KEYS.UI_MODE, 'light');
  },

  setUiMode(mode: UiMode) {
    safeSet(STORAGE_KEYS.UI_MODE, mode);
  },

  getMcpServers(): McpServerConfig[] {
    const list = safeGet<McpServerConfig[]>(STORAGE_KEYS.MCP_SERVERS, DEFAULT_MCP_SERVERS);
    const map = new Map(list.map((m) => [m.id, m]));
    for (const def of DEFAULT_MCP_SERVERS) {
      if (!map.has(def.id)) {
        list.push(def);
      }
    }
    return list;
  },

  setMcpServers(servers: McpServerConfig[]) {
    safeSet(STORAGE_KEYS.MCP_SERVERS, servers);
  },

  getSkills(): AgentSkill[] {
    const list = safeGet<AgentSkill[]>(STORAGE_KEYS.SKILLS, DEFAULT_SKILLS);
    const map = new Map(list.map((s) => [s.id, s]));
    for (const def of DEFAULT_SKILLS) {
      if (!map.has(def.id)) {
        list.push(def);
      }
    }
    return list;
  },

  setSkills(skills: AgentSkill[]) {
    safeSet(STORAGE_KEYS.SKILLS, skills);
  },

  getSessions(): ChatSession[] {
    const list = safeGet<ChatSession[]>(STORAGE_KEYS.SESSIONS, [INITIAL_SESSION]);
    if (!list || list.length === 0) return [INITIAL_SESSION];
    return list.map((s) => ({
      ...s,
      aiContextVisibility: s.aiContextVisibility || (s as any).aiVisibility || 'all',
      uiRenderLimit: s.uiRenderLimit ?? 0,
      connectedKnowledgeIds: s.connectedKnowledgeIds || ['kb-quick-notes'],
      connectedSkillIds: s.connectedSkillIds || ['skill-web-research', 'skill-code-debugger'],
    }));
  },

  setSessions(sessions: ChatSession[]) {
    safeSet(STORAGE_KEYS.SESSIONS, sessions);
  },

  getDisplaySettings(): MessageDisplaySettings {
    const saved = safeGet<Partial<MessageDisplaySettings>>(
      STORAGE_KEYS.DISPLAY_SETTINGS,
      DEFAULT_DISPLAY_SETTINGS
    );
    return {
      ...DEFAULT_DISPLAY_SETTINGS,
      ...saved,
    };
  },

  setDisplaySettings(settings: MessageDisplaySettings) {
    safeSet(STORAGE_KEYS.DISPLAY_SETTINGS, settings);
  },

  getActiveSessionId(): string {
    return safeGet<string>(STORAGE_KEYS.ACTIVE_SESSION_ID, INITIAL_SESSION.id);
  },

  setActiveSessionId(id: string) {
    safeSet(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
  },

  exportAllData(): string {
    const dump = {
      version: 4,
      timestamp: Date.now(),
      providers: this.getProviders(),
      groups: this.getGroups(),
      agents: this.getAgents(),
      prompts: this.getPrompts(),
      regexRules: this.getRegexRules(),
      knowledgeBase: this.getKnowledgeBase(),
      theme: this.getThemePalette(),
      uiMode: this.getUiMode(),
      mcpServers: this.getMcpServers(),
      skills: this.getSkills(),
      displaySettings: this.getDisplaySettings(),
      sessions: this.getSessions(),
    };
    return JSON.stringify(dump, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.providers) this.setProviders(data.providers);
      if (data.groups) this.setGroups(data.groups);
      if (data.agents) this.setAgents(data.agents);
      if (data.prompts) this.setPrompts(data.prompts);
      if (data.regexRules) this.setRegexRules(data.regexRules);
      if (data.knowledgeBase) this.setKnowledgeBase(data.knowledgeBase);
      if (data.theme) this.setThemePalette(data.theme);
      if (data.uiMode) this.setUiMode(data.uiMode);
      if (data.mcpServers) this.setMcpServers(data.mcpServers);
      if (data.skills) this.setSkills(data.skills);
      if (data.displaySettings) this.setDisplaySettings(data.displaySettings);
      if (data.sessions) this.setSessions(data.sessions);
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  },
};
