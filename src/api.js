// API 调用模块
// 支持 OpenAI / DeepSeek / Claude / Ollama / Gemini 等

export const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    defaultBase: 'https://api.openai.com/v1',
    modelsEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    parseModels: (data) => data.data?.map(m => m.id).filter(id => id.includes('gpt') || id.includes('o1') || id.includes('o3')) || [],
  },
  deepseek: {
    name: 'DeepSeek',
    defaultBase: 'https://api.deepseek.com/v1',
    modelsEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    parseModels: (data) => data.data?.map(m => m.id) || [],
  },
  claude: {
    name: 'Claude (Anthropic)',
    defaultBase: 'https://api.anthropic.com/v1',
    modelsEndpoint: '/models',
    chatEndpoint: '/messages',
    authHeader: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
    parseModels: (data) => data.data?.map(m => m.id) || [],
  },
  gemini: {
    name: 'Gemini (Google)',
    defaultBase: 'https://generativelanguage.googleapis.com/v1beta',
    modelsEndpoint: '/models',
    chatEndpoint: '/openai/chat/completions',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    parseModels: (data) => {
      const models = data.models || [];
      return models
        .map(m => m.name?.replace('models/', ''))
        .filter(id => id && (id.includes('gemini') || id.includes('flash') || id.includes('pro')));
    },
    // Gemini 用 key 作为查询参数拉取模型
    modelsUrl: (base, key) => `${base}/models?key=${key}`,
  },
  ollama: {
    name: 'Ollama (本地)',
    defaultBase: 'http://localhost:11434/v1',
    modelsEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    authHeader: () => ({}),
    parseModels: (data) => data.models?.map(m => m.name) || data.data?.map(m => m.id) || [],
  },
  custom: {
    name: '自定义 (OpenAI兼容)',
    defaultBase: '',
    modelsEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    parseModels: (data) => data.data?.map(m => m.id) || [],
  },
};

// 检测 provider 类型
export function detectProvider(baseUrl) {
  if (!baseUrl) return 'custom';
  const url = baseUrl.toLowerCase();
  if (url.includes('openai.com')) return 'openai';
  if (url.includes('deepseek.com')) return 'deepseek';
  if (url.includes('anthropic.com')) return 'claude';
  if (url.includes('generativelanguage.googleapis.com') || url.includes('gemini')) return 'gemini';
  if (url.includes('localhost:11434') || url.includes('ollama')) return 'ollama';
  return 'custom';
}

// 从 API 拉取模型列表
export async function fetchModels(config) {
  const { apiKey, baseUrl, provider: providerKey, customHeaders = {} } = config;
  const providerType = providerKey || detectProvider(baseUrl);
  const provider = PROVIDERS[providerType] || PROVIDERS.custom;

  const base = (baseUrl || provider.defaultBase).replace(/\/$/, '');

  let url;
  if (provider.modelsUrl) {
    url = provider.modelsUrl(base, apiKey);
  } else {
    url = `${base}${provider.modelsEndpoint}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...provider.authHeader(apiKey),
    ...customHeaders,
  };

  // Gemini key-in-param 模式，不需要 Authorization header
  if (providerType === 'gemini' && provider.modelsUrl) {
    delete headers['Authorization'];
  }

  const resp = await fetch(url, { method: 'GET', headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
  const data = await resp.json();
  return provider.parseModels(data);
}

// 发送聊天消息（流式）
export async function sendChatMessage(config, messages, onChunk) {
  const {
    apiKey,
    baseUrl,
    model,
    provider: providerKey,
    customHeaders = {},
    temperature = 0.7,
    topP,
    maxTokens,
    systemPrompt = '',
  } = config;

  const providerType = providerKey || detectProvider(baseUrl);
  const provider = PROVIDERS[providerType] || PROVIDERS.custom;
  const base = (baseUrl || provider.defaultBase).replace(/\/$/, '');

  const headers = {
    'Content-Type': 'application/json',
    ...provider.authHeader(apiKey),
    ...customHeaders,
  };

  let payload;
  let endpoint;

  if (providerType === 'claude') {
    endpoint = `${base}${provider.chatEndpoint}`;
    payload = {
      model,
      max_tokens: maxTokens || 4096,
      system: systemPrompt || undefined,
      messages: messages.filter(m => m.role !== 'system'),
      stream: true,
    };
    if (temperature !== undefined) payload.temperature = temperature;
    if (topP !== undefined) payload.top_p = topP;
  } else if (providerType === 'gemini' && base.includes('generativelanguage')) {
    // Gemini OpenAI兼容端点，key 走 header
    endpoint = `${base}${provider.chatEndpoint}`;
    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;
    payload = { model, messages: allMessages, stream: true };
    if (temperature !== undefined) payload.temperature = temperature;
    if (topP !== undefined) payload.top_p = topP;
    if (maxTokens) payload.max_tokens = maxTokens;
  } else {
    endpoint = `${base}${provider.chatEndpoint}`;
    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;
    payload = { model, messages: allMessages, stream: true };
    if (temperature !== undefined) payload.temperature = temperature;
    if (topP !== undefined) payload.top_p = topP;
    if (maxTokens) payload.max_tokens = maxTokens;
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 500)}`);
  }

  // SSE 流式解析
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return fullText;

      try {
        const json = JSON.parse(data);
        let chunk = '';

        if (providerType === 'claude') {
          if (json.type === 'content_block_delta') {
            chunk = json.delta?.text || '';
          }
        } else {
          chunk = json.choices?.[0]?.delta?.content || '';
        }

        if (chunk) {
          fullText += chunk;
          onChunk?.(chunk, fullText);
        }
      } catch (_) { }
    }
  }

  return fullText;
}
