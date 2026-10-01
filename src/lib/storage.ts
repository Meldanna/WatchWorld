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
  WebDavConfig,
  WorldDocument,
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
  DEFAULT_WEBDAV_CONFIG,
  DEFAULT_WORLD_DOCUMENTS,
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
  WEBDAV_CONFIG: 'guanjie_webdav_config',
  WORLD_DOCUMENTS: 'guanjie_world_documents',
  INPUT_DRAFT_PREFIX: 'guanjie_draft_',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key "${key}":`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key "${key}":`, err);
  }
}

export const Storage = {
  getProviders(): ApiProviderConfig[] {
    return safeGet<ApiProviderConfig[]>(STORAGE_KEYS.PROVIDERS, DEFAULT_PROVIDERS);
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
    return safeGet<ChatGroup[]>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
  },

  setGroups(groups: ChatGroup[]) {
    safeSet(STORAGE_KEYS.GROUPS, groups);
  },

  getAgents(): Agent[] {
    return safeGet<Agent[]>(STORAGE_KEYS.AGENTS, DEFAULT_AGENTS);
  },

  setAgents(agents: Agent[]) {
    safeSet(STORAGE_KEYS.AGENTS, agents);
  },

  getPrompts(): PromptPreset[] {
    return safeGet<PromptPreset[]>(STORAGE_KEYS.PROMPTS, DEFAULT_PROMPTS);
  },

  setPrompts(prompts: PromptPreset[]) {
    safeSet(STORAGE_KEYS.PROMPTS, prompts);
  },

  getSessions(): ChatSession[] {
    const list = safeGet<ChatSession[]>(STORAGE_KEYS.SESSIONS, [INITIAL_SESSION]);
    return list.length > 0 ? list : [INITIAL_SESSION];
  },

  setSessions(sessions: ChatSession[]) {
    safeSet(STORAGE_KEYS.SESSIONS, sessions);
  },

  getRegexRules(): RegexRule[] {
    return safeGet<RegexRule[]>(STORAGE_KEYS.REGEX_RULES, DEFAULT_REGEX_RULES);
  },

  setRegexRules(rules: RegexRule[]) {
    safeSet(STORAGE_KEYS.REGEX_RULES, rules);
  },

  getKnowledgeBase(): KnowledgeItem[] {
    return safeGet<KnowledgeItem[]>(
      STORAGE_KEYS.KNOWLEDGE_BASE,
      DEFAULT_KNOWLEDGE_BASE
    );
  },

  setKnowledgeBase(items: KnowledgeItem[]) {
    safeSet(STORAGE_KEYS.KNOWLEDGE_BASE, items);
  },

  getThemePalette(): ThemePalette {
    return safeGet<ThemePalette>(STORAGE_KEYS.THEME_PALETTE, 'emerald');
  },

  setThemePalette(palette: ThemePalette) {
    safeSet(STORAGE_KEYS.THEME_PALETTE, palette);
  },

  getUiMode(): UiMode {
    return safeGet<UiMode>(STORAGE_KEYS.UI_MODE, 'dark');
  },

  setUiMode(mode: UiMode) {
    safeSet(STORAGE_KEYS.UI_MODE, mode);
  },

  getMcpServers(): McpServerConfig[] {
    return safeGet<McpServerConfig[]>(
      STORAGE_KEYS.MCP_SERVERS,
      DEFAULT_MCP_SERVERS
    );
  },

  setMcpServers(servers: McpServerConfig[]) {
    safeSet(STORAGE_KEYS.MCP_SERVERS, servers);
  },

  getSkills(): AgentSkill[] {
    return safeGet<AgentSkill[]>(STORAGE_KEYS.SKILLS, DEFAULT_SKILLS);
  },

  setSkills(skills: AgentSkill[]) {
    safeSet(STORAGE_KEYS.SKILLS, skills);
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

  getWebDavConfig(): WebDavConfig {
    return safeGet<WebDavConfig>(STORAGE_KEYS.WEBDAV_CONFIG, DEFAULT_WEBDAV_CONFIG);
  },

  setWebDavConfig(config: WebDavConfig) {
    safeSet(STORAGE_KEYS.WEBDAV_CONFIG, config);
  },

  getWorldDocuments(): WorldDocument[] {
    return safeGet<WorldDocument[]>(
      STORAGE_KEYS.WORLD_DOCUMENTS,
      DEFAULT_WORLD_DOCUMENTS
    );
  },

  setWorldDocuments(docs: WorldDocument[]) {
    safeSet(STORAGE_KEYS.WORLD_DOCUMENTS, docs);
  },

  getInputDraft(sessionId: string): string {
    if (!sessionId) return '';
    try {
      return localStorage.getItem(`${STORAGE_KEYS.INPUT_DRAFT_PREFIX}${sessionId}`) || '';
    } catch {
      return '';
    }
  },

  setInputDraft(sessionId: string, text: string) {
    if (!sessionId) return;
    try {
      if (text) {
        localStorage.setItem(`${STORAGE_KEYS.INPUT_DRAFT_PREFIX}${sessionId}`, text);
      } else {
        localStorage.removeItem(`${STORAGE_KEYS.INPUT_DRAFT_PREFIX}${sessionId}`);
      }
    } catch {
      // ignore
    }
  },

  exportAllData(): string {
    const dump = {
      version: 5,
      exportTime: Date.now(),
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
      webdavConfig: this.getWebDavConfig(),
      worldDocuments: this.getWorldDocuments(),
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
      if (data.webdavConfig) this.setWebDavConfig(data.webdavConfig);
      if (data.worldDocuments) this.setWorldDocuments(data.worldDocuments);
      if (data.sessions) this.setSessions(data.sessions);
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  },
};
