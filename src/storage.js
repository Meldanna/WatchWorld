// 本地存储模块

const KEYS = {
  WINDOWS: 'watchworld_windows',
  GROUPS: 'watchworld_groups',
  SETTINGS: 'watchworld_settings',
  DRAFT_PREFIX: 'watchworld_draft_',
  SKILLS: 'watchworld_skills',
  REGEX_RULES: 'watchworld_regex_rules',
  DOCUMENTS: 'watchworld_documents',
};

function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadWindows() { return load(KEYS.WINDOWS, []); }
export function saveWindows(windows) { save(KEYS.WINDOWS, windows); }

export function loadGroups() {
  return load(KEYS.GROUPS, ['默认', '编程开发', '文案润色', '灵感脑洞', '角色扮演']);
}
export function saveGroups(groups) { save(KEYS.GROUPS, groups); }

export function loadSettings() {
  return load(KEYS.SETTINGS, {
    defaultApi: {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: '',
      temperature: 0.7,
      topP: null,
      maxTokens: null,
      customHeaders: {},
    },
    theme: 'dark',
    webdav: { enabled: false, url: '', username: '', password: '' },
    defaultGroup: '默认',
    nameByModel: true,
  });
}
export function saveSettings(settings) { save(KEYS.SETTINGS, settings); }

export function saveDraft(windowId, text) {
  if (text) save(KEYS.DRAFT_PREFIX + windowId, text);
  else localStorage.removeItem(KEYS.DRAFT_PREFIX + windowId);
}
export function loadDraft(windowId) { return load(KEYS.DRAFT_PREFIX + windowId, ''); }

export function loadSkills() { return load(KEYS.SKILLS, getDefaultSkills()); }
export function saveSkills(skills) { save(KEYS.SKILLS, skills); }

function getDefaultSkills() {
  return [
    {
      id: 'timeline', name: '时间线梳理',
      keywords: ['梳理', '时间线', '因果'],
      prompt: '请帮我梳理当前分支的完整事件因果链，按时间顺序整理关键事件，标注每个事件的起因、经过、影响。',
      enabled: true,
    },
    {
      id: 'relationship', name: '角色关系分析',
      keywords: ['关系', '角色', '人物'],
      prompt: '请分析当前对话中涉及的所有角色之间的关系，包括：权力关系、情感关系、利益关系，以及关系的变化轨迹。',
      enabled: true,
    },
    {
      id: 'consistency', name: '世界观一致性检查',
      keywords: ['矛盾', '一致性', '检查'],
      prompt: '请检查当前讨论的世界观设定是否存在内部矛盾，列出所有不一致之处并给出修改建议。',
      enabled: true,
    },
    {
      id: 'document', name: '设定文档生成',
      keywords: ['整理', '文档', '归档'],
      prompt: '请将当前对话中的设定内容整理成结构化文档，包括：世界观概述、人物设定、重要事件、规则体系。',
      enabled: true,
    },
  ];
}

export function loadRegexRules() { return load(KEYS.REGEX_RULES, []); }
export function saveRegexRules(rules) { save(KEYS.REGEX_RULES, rules); }

export function loadDocuments() { return load(KEYS.DOCUMENTS, []); }
export function saveDocuments(docs) { save(KEYS.DOCUMENTS, docs); }

export function exportAll() {
  return JSON.stringify({
    version: 1,
    exportTime: Date.now(),
    windows: loadWindows(),
    groups: loadGroups(),
    settings: loadSettings(),
    skills: loadSkills(),
    regexRules: loadRegexRules(),
    documents: loadDocuments(),
  }, null, 2);
}

export function importAll(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (data.windows) saveWindows(data.windows);
  if (data.groups) saveGroups(data.groups);
  if (data.settings) saveSettings(data.settings);
  if (data.skills) saveSkills(data.skills);
  if (data.regexRules) saveRegexRules(data.regexRules);
  if (data.documents) saveDocuments(data.documents);
}
