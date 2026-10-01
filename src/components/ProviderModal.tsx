import React, { useState } from 'react';
import { ApiProviderConfig, ProviderType } from '../types';
import { testProviderConnection } from '../lib/api';
import {
  Key,
  Plus,
  Check,
  Globe,
  Settings,
  X,
  Play,
  Trash2,
  Eye,
  EyeOff,
  Server,
  Activity,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ApiProviderConfig[];
  activeProviderId: string;
  onSelectProvider: (id: string) => void;
  onSaveProvider: (provider: ApiProviderConfig) => void;
  onDeleteProvider: (id: string) => void;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  isOpen,
  onClose,
  providers,
  activeProviderId,
  onSelectProvider,
  onSaveProvider,
  onDeleteProvider,
}) => {
  const [editingProvider, setEditingProvider] = useState<ApiProviderConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});

  // Test states
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; latencyMs: number; message: string }>
  >({});

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<ProviderType>('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelsStr, setModelsStr] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [customHeadersStr, setCustomHeadersStr] = useState('');

  if (!isOpen) return null;

  const toggleShowKey = (id: string) => {
    setShowKeyMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingProvider(null);
    setName('');
    setType('custom');
    setBaseUrl('https://api.openai.com/v1');
    setApiKey('');
    setModelsStr('gpt-4o, gpt-4o-mini');
    setDefaultModel('gpt-4o-mini');
    setCustomHeadersStr('');
  };

  const startEdit = (p: ApiProviderConfig) => {
    setEditingProvider(p);
    setIsCreating(false);
    setName(p.name);
    setType(p.type);
    setBaseUrl(p.baseUrl || '');
    setApiKey(p.apiKey || '');
    setModelsStr(p.models.join(', '));
    setDefaultModel(p.defaultModel);
    setCustomHeadersStr(p.customHeaders ? JSON.stringify(p.customHeaders, null, 2) : '');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedModels = modelsStr
      .split(/[,，\s]+/)
      .map((m) => m.trim())
      .filter(Boolean);

    let parsedHeaders: Record<string, string> | undefined = undefined;
    if (customHeadersStr.trim()) {
      try {
        parsedHeaders = JSON.parse(customHeadersStr.trim());
      } catch {
        parsedHeaders = {};
        customHeadersStr.split('\n').forEach((line) => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const k = line.slice(0, colonIdx).trim();
            const v = line.slice(colonIdx + 1).trim();
            if (k) parsedHeaders![k] = v;
          }
        });
      }
    }

    const providerToSave: ApiProviderConfig = {
      id: editingProvider?.id || `provider-custom-${Date.now()}`,
      name: name.trim(),
      type,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      models: parsedModels.length > 0 ? parsedModels : [defaultModel || 'gpt-4o-mini'],
      defaultModel: defaultModel.trim() || parsedModels[0] || 'gpt-4o-mini',
      enabled: true,
      isSystemDefault: editingProvider?.isSystemDefault || false,
      customHeaders: parsedHeaders,
    };

    onSaveProvider(providerToSave);
    setIsCreating(false);
    setEditingProvider(null);
  };

  const handleTestConnection = async (p: ApiProviderConfig) => {
    setTestingId(p.id);
    const result = await testProviderConnection(p);
    setTestResults((prev) => ({ ...prev, [p.id]: result }));
    setTestingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                多 API 接口管理与兼容
              </h2>
              <p className="text-[11px] text-slate-400">
                支持保存多种官方、开源或自建 OpenAI 兼容端点
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {isCreating || editingProvider ? (
          /* Create / Edit Form */
          <form
            onSubmit={handleSaveForm}
            className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-slate-300"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-emerald-400">
                {isCreating ? '添加自定义 API 接口' : `配置 API: ${editingProvider?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingProvider(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  接口显示名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：自建 DeepSeek、我的 Ollama..."
                  required
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  接口协议类型
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI 格式</option>
                  <option value="deepseek">DeepSeek 深度求索</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="openrouter">OpenRouter 聚合</option>
                  <option value="groq">Groq 极速</option>
                  <option value="ollama">Ollama 本地/自建</option>
                  <option value="custom">通用兼容 (Custom)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                API Base URL (端点地址)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="例如：https://api.openai.com/v1 或 http://localhost:11434/v1"
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 font-mono text-[11px]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Google Gemini 可留空（默认走智能云代理或直连）
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                API Key (密钥)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 font-mono text-[11px]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                所有密钥均保存在本地浏览器端安全沙箱，不上传任何第三方数据库。
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  默认选用模型
                </label>
                <input
                  type="text"
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  placeholder="例如：gpt-4o-mini"
                  className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  可用模型列表 (逗号分隔)
                </label>
                <input
                  type="text"
                  value={modelsStr}
                  onChange={(e) => setModelsStr(e.target.value)}
                  placeholder="gpt-4o, gpt-4o-mini"
                  className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                自定义请求头 (Headers) - 适配不同中转站
              </label>
              <textarea
                value={customHeadersStr}
                onChange={(e) => setCustomHeadersStr(e.target.value)}
                placeholder={'{\n  "HTTP-Referer": "https://guanjie.app",\n  "X-Title": "观界工作台"\n}'}
                rows={3}
                className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 font-mono text-[11px] resize-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                支持 JSON 格式或每行一条 &quot;Header: Value&quot;，适合聚合站、OneAPI、自建中转认证。
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingProvider(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                保存配置
              </button>
            </div>
          </form>
        ) : (
          /* List View */
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs text-slate-400">已配置的 API 提供商</span>
              <button
                onClick={startCreate}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium py-1 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30"
              >
                <Plus size={14} />
                <span>添加接口</span>
              </button>
            </div>

            {providers.map((p) => {
              const isActive = p.id === activeProviderId;
              const hasKey = Boolean(p.apiKey);
              const testResult = testResults[p.id];
              const isTesting = testingId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProvider(p.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                    isActive
                      ? 'bg-slate-800/90 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                            : 'border-slate-600'
                        }`}
                      >
                        {isActive && <Check size={11} strokeWidth={3} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isActive ? 'text-emerald-400' : 'text-slate-100'
                            }`}
                          >
                            {p.name}
                          </span>
                          {p.isSystemDefault && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              · 内置免配置
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          默认模型: {p.defaultModel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Test Connection Button */}
                      <button
                        onClick={() => handleTestConnection(p)}
                        disabled={isTesting}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 text-[11px] flex items-center gap-1 border border-slate-700/60"
                        title="测试接口连通性"
                      >
                        <Activity size={12} className={isTesting ? 'animate-spin text-emerald-400' : ''} />
                        <span className="hidden sm:inline">测试连接</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        title="配置详情"
                      >
                        <Settings size={14} />
                      </button>

                      {/* Delete Custom Button */}
                      {!p.isSystemDefault && (
                        <button
                          onClick={() => {
                            if (confirm(`确认删除 API「${p.name}」？`)) {
                              onDeleteProvider(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Test result banner if available */}
                  {testResult && (
                    <div
                      className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        testResult.success
                          ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 size={13} className="shrink-0" />
                      ) : (
                        <AlertCircle size={13} className="shrink-0" />
                      )}
                      <span className="truncate">{testResult.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            随时切换当前全局使用的对话模型引擎
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
