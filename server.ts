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
      stream = false
    } = req.body;

    // 1. Google Gemini Handling (Server-side key or user provided key)
    if (provider === 'gemini' || (!provider && !baseUrl)) {
      const activeKey = apiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          error: '请先在设置中填写 Google Gemini API Key，或在环境变量中配置 GEMINI_API_KEY。'
        });
      }

      const ai = new GoogleGenAI({ apiKey: activeKey });
      const targetModel = model || 'gemini-3.8-flash';

      // Format messages for Gemini
      // Combine systemInstruction if provided
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

        // Proxy stream
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
    return res.status(500).json({
      error: errMsg,
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
