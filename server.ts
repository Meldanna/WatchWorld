import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health / test route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now()
  });
});

// ============================================================
// /api/models — 拉取各 provider 可用模型列表
// Body: { provider, apiKey, baseUrl, customHeaders }
// Returns: { models: string[] }
// ============================================================
app.post('/api/models', async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, baseUrl, customHeaders } = req.body;

    // 1. Gemini — 使用 @google/genai SDK 列举模型
    if (provider === 'gemini' || (!provider && !baseUrl)) {
      const activeKey = apiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({ error: '请先配置 Google Gemini API Key' });
      }
      // Gemini REST list-models endpoint
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}&pageSize=50`;
      const upstream = await fetch(listUrl, { method: 'GET' });
      if (!upstream.ok) {
        const errText = await upstream.text();
        return res.status(upstream.status).json({ error: `Gemini 模型列表获取失败 (${upstream.status}): ${errText.slice(0, 200)}` });
      }
      const data = await upstream.json();
      const models: string[] = (data.models || [])
        .map((m: any) => (m.name as string).replace('models/', ''))
        .filter((id: string) => id.startsWith('gemini'));
      return res.json({ models });
    }

    // 2. Claude / Anthropic
    if (provider === 'claude') {
      const base = (baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
      const upstream = await fetch(`${base}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version': '2023-06-01',
          ...(customHeaders || {}),
        },
      });
      if (!upstream.ok) {
        const errText = await upstream.text();
        return res.status(upstream.status).json({ error: `Claude 模型列表获取失败 (${upstream.status}): ${errText.slice(0, 200)}` });
      }
      const data = await upstream.json();
      const models: string[] = (data.data || []).map((m: any) => m.id as string);
      return res.json({ models });
    }

    // 3. OpenAI-compatible: openai / deepseek / ollama / openrouter / groq / custom
    if (
      provider === 'openai' ||
      provider === 'deepseek' ||
      provider === 'ollama' ||
      provider === 'openrouter' ||
      provider === 'groq' ||
      provider === 'custom'
    ) {
      const base = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(customHeaders || {}),
      };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const upstream = await fetch(`${base}/models`, { method: 'GET', headers });
      if (!upstream.ok) {
        const errText = await upstream.text();
        return res.status(upstream.status).json({ error: `模型列表获取失败 (${upstream.status}): ${errText.slice(0, 200)}` });
      }
      const data = await upstream.json();

      // Ollama returns { models: [{name, ...}] }, OpenAI returns { data: [{id, ...}] }
      let models: string[] = [];
      if (Array.isArray(data.models)) {
        models = data.models.map((m: any) => m.name || m.id || m.model || String(m));
      } else if (Array.isArray(data.data)) {
        models = data.data.map((m: any) => m.id || m.name || String(m));
      }

      // For OpenAI official, filter to relevant models only
      if (provider === 'openai' && !baseUrl) {
        models = models.filter((id) =>
          id.startsWith('gpt') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('chatgpt')
        );
      }

      return res.json({ models });
    }

    return res.status(400).json({ error: `不支持的 provider 类型: ${provider}` });
  } catch (error: any) {
    console.error('Models fetch error:', error);
    return res.status(500).json({ error: error.message || '获取模型列表失败' });
  }
});

// Universal AI completion proxy
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      provider, // 'gemini' | 'openai' | 'claude' | 'custom'
      apiKey,
      baseUrl,
      model,
      messages,
      systemInstruction,
      temperature = 0.7,
      maxTokens = 2048,
      stream = false,
      customHeaders,
    } = req.body;

    // 1. Google Gemini Handling (Server-side key or user provided key)
    if (provider === 'gemini' || (!provider && !baseUrl)) {
      const activeKey = apiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          error: '请在设置中填入 Google Gemini API Key，或在环境变量中配置 GEMINI_API_KEY。'
        });
      }

      const ai = new GoogleGenAI({ apiKey: activeKey });
      const targetModel = model || 'gemini-2.0-flash';

      const contents = (messages || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || '' }]
      }));

      const config: any = {
        temperature: Number(temperature) || 0.7,
      };

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const responseStream = await ai.models.generateContentStream({
          model: targetModel,
          contents,
          config,
        });

        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      } else {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents,
          config,
        });

        return res.json({
          text: response.text || '',
          model: targetModel,
        });
      }
    }

    // 2. OpenAI-compatible / Custom API / DeepSeek / Ollama / OpenRouter / Groq
    if (provider === 'openai' || provider === 'custom' || provider === 'deepseek' || provider === 'openrouter' || provider === 'groq' || provider === 'ollama') {
      let endpoint = baseUrl || 'https://api.openai.com/v1';
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(customHeaders || {}),
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const formattedMessages = [];
      if (systemInstruction) {
        formattedMessages.push({ role: 'system', content: systemInstruction });
      }
      for (const m of (messages || [])) {
        formattedMessages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content || '',
        });
      }

      const payload: any = {
        model: model || 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: Number(temperature) || 0.7,
        max_tokens: Number(maxTokens) || 2048,
        stream: Boolean(stream),
      };

      const upstreamRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text();
        return res.status(upstreamRes.status).json({
          error: `上游 API 报错 (${upstreamRes.status}): ${errText}`,
        });
      }

      if (stream && upstreamRes.body) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          res.write(chunkStr);
        }
        return res.end();
      } else {
        const data = await upstreamRes.json();
        const reply = data.choices?.[0]?.message?.content || '';
        return res.json({
          text: reply,
          model: data.model || model,
          usage: data.usage,
        });
      }
    }

    // 3. Claude / Anthropic Direct Messages API
    if (provider === 'claude') {
      const endpoint = (baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://api.anthropic.com/v1') + '/messages';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
        ...(customHeaders || {}),
      };

      const formattedMessages = (messages || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || '',
      }));

      const payload: any = {
        model: model || 'claude-3-5-sonnet-20241022',
        messages: formattedMessages,
        max_tokens: Number(maxTokens) || 2048,
        temperature: Number(temperature) || 0.7,
      };

      if (systemInstruction) {
        payload.system = systemInstruction;
      }

      const upstreamRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text();
        return res.status(upstreamRes.status).json({
          error: `Claude API 报错 (${upstreamRes.status}): ${errText}`,
        });
      }

      const data = await upstreamRes.json();
      const textContent = data.content?.map((c: any) => c.text).join('\n') || '';
      return res.json({
        text: textContent,
        model: data.model || model,
      });
    }

    return res.status(400).json({ error: `不支持的 API 类型: ${provider}` });
  } catch (error: any) {
    console.error('Chat error:', error);
    let errMsg = error.message || '内部服务错误，请检查 API 配置或网络状态';
    try {
      const parsed = JSON.parse(errMsg);
      if (parsed.error?.message) {
        errMsg = parsed.error.message;
      }
    } catch {
      // not JSON
    }

    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded') || errMsg.includes('quota')) {
      errMsg = `API 请求频度/配额报错 (429 Rate Limit / Quota Exceeded)。\n• 原因：当前模型请求频率过快或按量费额度已达上限。\n• 刷新机制：Gemini/OpenAI 配额限制通常在每分钟或整点刷新，按日额度于 UTC 00:00 刷新。\n• 解决方案：请稍后重试，或在左上角设置中配置个人 API 密钥/自定义中转接口。`;
    }

    return res.status(500).json({
      error: errMsg,
    });
  }
});

// Universal WebDAV proxy to prevent CORS issues with 3rd-party servers (Jianguoyun, Nextcloud, Alist, etc.)
app.all('/api/webdav', async (req: Request, res: Response) => {
  try {
    const targetUrl = (req.headers['x-webdav-url'] as string) || (req.query.url as string);
    const targetMethod = (req.headers['x-webdav-method'] as string) || req.method;

    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing x-webdav-url header or url query param' });
    }

    const forwardHeaders: Record<string, string> = {};
    if (req.headers['authorization']) {
      forwardHeaders['Authorization'] = req.headers['authorization'] as string;
    }
    if (req.headers['depth']) {
      forwardHeaders['Depth'] = req.headers['depth'] as string;
    }
    if (req.headers['content-type']) {
      forwardHeaders['Content-Type'] = req.headers['content-type'] as string;
    }

    let requestBody: any = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(targetMethod.toUpperCase())) {
      if (typeof req.body === 'string') {
        requestBody = req.body;
      } else if (req.body && Object.keys(req.body).length > 0) {
        requestBody = JSON.stringify(req.body);
      }
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: targetMethod,
      headers: forwardHeaders,
      body: requestBody,
    });

    res.status(upstreamResponse.status);
    upstreamResponse.headers.forEach((val, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    const responseData = await upstreamResponse.text();
    return res.send(responseData);
  } catch (err: any) {
    return res.status(502).json({ error: `WebDAV 代理转发失败: ${err.message}` });
  }
});

// Quota check endpoint to check API status and responsiveness
app.get('/api/check-quota', async (req: Request, res: Response) => {
  try {
    const key = (req.query.apiKey as string) || process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({
        available: false,
        message: '未配置任何 API Key，可使用本地回退模式或在设置中输入 Key。',
        refreshed: false,
      });
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const pingRes = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      config: { maxOutputTokens: 5, temperature: 0.1 },
    });

    return res.json({
      available: true,
      refreshed: true,
      message: 'API 服务响应正常，额度尚未可用！',
      preview: pingRes.text?.trim() || 'pong',
      timestamp: Date.now(),
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    const isExhausted = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
    return res.json({
      available: false,
      refreshed: !isExhausted,
      isExhausted,
      message: isExhausted
        ? '当前模型额度已达上限，通常每分钟次或次日 UTC 0 点自动刷新。'
        : `服务返回: ${msg.slice(0, 100)}`,
      timestamp: Date.now(),
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
