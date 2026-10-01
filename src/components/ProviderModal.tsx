import React, { useState, useRef, useEffect } from 'react';
import { ApiProviderConfig, ProviderType } from '../types';
import { testProviderConnection, fetchModelsFromProvider } from '../lib/api';
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
  RefreshCw,
  ChevronDown,
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

  // Fetch-models states
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchModelError, setFetchModelError] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    }
    if (showModelDropdown) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showModelDropdown]);

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
    setFetchedModels([]);
    setFetchModelError('');
    setShowModelDropdown(false);
    setModelSearch('');
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
    setFetchedModels([]);
    setFetchModelError('');
    setShowModelDropdown(false);
    setModelSearch('');
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

  // Build a temporary provider config from current form values for fetching
  const buildTempProvider = (): ApiProviderConfig => {
    let parsedHeaders: Record<string, string> | undefined;
    if (customHeadersStr.trim()) {
      try { parsedHeaders = JSON.parse(customHeadersStr.trim()); } catch { parsedHeaders = undefined; }
    }
    return {
      id: 'temp',
      name,
      type,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      models: [],
      defaultModel: '',
      customHeaders: parsedHeaders,
    };
  };

  const handleFetchModels = async () => {
    setFetchingModels(true);
    setFetchModelError('');
    setFetchedModels([]);
    setShowModelDropdown(false);

    const temp = buildTempProvider();
    const result = await fetchModelsFromProvider(temp);

    setFetchingModels(false);
    if (result.error) {
      setFetchModelError(result.error);
    } else if (result.models.length === 0) {
      setFetchModelError('未获取到任何模型，请检查 API Key 和 Base URL');
    } else {
      setFetchedModels(result.models);
      setShowModelDropdown(true);
      setModelSearch('');
    }
  };

  const handleSelectModel = (modelId: string) => {
    setDefaultModel(modelId);
    // Add to models list if not already present
    const current = modelsStr
      .split(/[,，\s]+/)
      .map((m) => m.trim())
      .filter(Boolean);
    if (!current.includes(modelId)) {
      setModelsStr(current.length > 0 ? current.join(', ') + ', ' + modelId : modelId);
    }
    setShowModelDropdown(false);
  };

  const filteredModels = fetchedModels.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  );

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
                  <option value="openrouter">OpenRouter 汇聚</option>
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
                Google Gemini 可置空（默认走官方接口）
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
                所有密钥仅保存在本地浏览器端安全沙箱，不会传任何第三方数据库。
              </span>
            </div>

            {/* 模型配置区域 */}
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400">
                默认使用模型
              </label>

              {/* 模型输入行 + 获取按钮 */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  placeholder="例如：gpt-4o-mini"
                  className="flex-1 bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels}
                  title="从 API 拉取可用模型列表"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-[11px] font-medium border border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors"
                >
                  <RefreshCw size={12} className={fetchingModels ? 'animate-spin' : ''} />
                  {fetchingModels ? '拉取中...' : '获取模型'}
                </button>
              </div>

              {/* 错误提示 */}
              {fetchModelError && (
                <div className="flex items-start gap-1.5 text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-2">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <span>{fetchModelError}</span>
                </div>
              )}

              {/* 模型下拉列表 */}
              {showModelDropdown && fetchedModels.length > 0 && (
                <div ref={dropdownRef} className="relative z-20">
                  <div className="bg-slate-950 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    {/* 搜索框 */}
                    <div className="p-2 border-b border-slate-800">
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder={`搜索 ${fetchedModels.length} 个模型...`}
                        autoFocus
                        className="w-full bg-slate-900 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* 模型列表 */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredModels.length === 0 ? (
                        <div className="px-3 py-3 text-[11px] text-slate-500 text-center">无匹配模型</div>
                      ) : (
                        filteredModels.map((modelId) => (
                          <button
                            key={modelId}
                            type="button"
                            onClick={() => handleSelectModel(modelId)}
                            className={`w-full text-left px-3 py-2 text-[11px] font-mono hover:bg-slate-800 transition-colors flex items-center justify-between group ${
                              defaultModel === modelId
                                ? 'text-indigo-300 bg-indigo-950/40'
                                : 'text-slate-300'
                            }`}
                          >
                            <span className="truncate">{modelId}</span>
                            {defaultModel === modelId && (
                              <Check size={11} className="text-indigo-400 shrink-0 ml-2" />
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    {/* 底部提示 */}
                    <div className="px-3 py-1.5 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>共 {fetchedModels.length} 个可用模型</span>
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(false)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        收起
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 成功提示 + 重新展开 */}
              {!showModelDropdown && fetchedModels.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(true)}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  <ChevronDown size={12} />
                  已获取 {fetchedModels.length} 个模型，点击重新展开选择
                </button>
              )}
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
              <span className="text-[10px] text-slate-500 mt-1 block">
                点击「获取模型」可自动填充。选中的模型会自动加入此列表。
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                自定义请求头 (Headers) — 适配中转站
              </label>
              <textarea
                value={customHeadersStr}
                onChange={(e) => setCustomHeadersStr(e.target.value)}
                placeholder={'{ \n  "HTTP-Referer": "https://guanjie.app",\n  "X-Title": "观界工作台"\n}'}
                rows={3}
                className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 font-mono text-[11px] resize-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                支持 JSON 格式或每行一条 &quot;Header: Value&quot;，适配聚合站、OneAPI、自建中转认证。
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
              <span className="text-xs text-slate-400">已配置的 API 提供方</span>
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
                              · 内置预配置
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
