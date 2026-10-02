import React, { useState, useRef } from 'react';
import {
  Settings,
  Cpu,
  Clock,
  Zap,
  Coins,
  FileText,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Server,
  Shield,
  Layers,
  Hash,
} from 'lucide-react';
import { MessageDisplaySettings, WebDavConfig } from '../types';
import { ThemeConfig } from '../lib/theme';
import { DEFAULT_DISPLAY_SETTINGS } from '../lib/defaultData';
import { testWebDavConnection, pushToWebDav, pullFromWebDav } from '../lib/webdavSync';
import { Storage } from '../lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  displaySettings: MessageDisplaySettings;
  onChangeDisplaySettings: (settings: MessageDisplaySettings) => void;
  webdavConfig?: WebDavConfig;
  onChangeWebDavConfig?: (config: WebDavConfig) => void;
  onExportJson?: () => void;
  onImportJson?: (jsonStr: string) => boolean;
  theme: ThemeConfig;
  sessionTotalTokens?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  displaySettings,
  onChangeDisplaySettings,
  webdavConfig = {
    enabled: false,
    url: '',
    username: '',
    password: '',
    syncPath: '/guanjie_backup.json',
    autoSync: false,
    syncStatus: 'idle',
  },
  onChangeWebDavConfig,
  onExportJson,
  onImportJson,
  theme,
  sessionTotalTokens = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'display' | 'webdav' | 'backup'>('display');
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleToggle = (key: keyof MessageDisplaySettings) => {
    onChangeDisplaySettings({
      ...displaySettings,
      [key]: !displaySettings[key],
    });
  };

  const handleReset = () => {
    onChangeDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
  };

  const handleTestWebDav = async () => {
    if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
      setTestResult({ status: 'error', message: '请完整填写 WebDAV 地址、用户名和密码' });
      return;
    }

    setTestResult({ status: 'testing', message: '正在测试 WebDAV 连接...' });
    const res = await testWebDavConnection(webdavConfig);
    setTestResult({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });
  };

  const handleManualPushWebDav = async () => {
    setTestResult({ status: 'testing', message: '正在同步备份至 WebDAV...' });
    // 远端备份时，默认不上传 API 密钥与 WebDAV 密码。
    // 只有用户主动勾选「包含 API 配置」时，才一并传上去。
    const dataStr = Storage.exportAllData({
      redactSecrets: !webdavConfig.includeApiConfig,
    });
    const res = await pushToWebDav(webdavConfig, dataStr);
    setTestResult({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });
    if (res.success && onChangeWebDavConfig) {
      onChangeWebDavConfig({
        ...webdavConfig,
        enabled: true,
        lastSyncTime: Date.now(),
        syncStatus: 'success',
      });
    }
  };

  const handleManualPullWebDav = async () => {
    setTestResult({ status: 'testing', message: '正在从 WebDAV 拉取最新备份...' });
    const res = await pullFromWebDav(webdavConfig);
    if (res.success && res.remoteData) {
      const ok = onImportJson ? onImportJson(res.remoteData) : Storage.importAllData(res.remoteData);
      if (ok) {
        setTestResult({ status: 'success', message: '已从 WebDAV 成功恢复最新数据！页面刷新后生效。' });
      } else {
        setTestResult({ status: 'error', message: '解析远程数据失败' });
      }
    } else {
      setTestResult({ status: 'error', message: res.message || '远程拉取失败' });
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const ok = onImportJson ? onImportJson(text) : Storage.importAllData(text);
        if (ok) {
          alert('数据导入成功！工作台已完整恢复。');
          onClose();
        } else {
          alert('数据格式解析失败，请检查是否为导出的JSON。');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const options: {
    key: keyof MessageDisplaySettings;
    title: string;
    description: string;
    icon: React.ReactNode;
    preview: string;
  }[] = [
    {
      key: 'showModelName',
      title: '显示模型名',
      description: '在 AI 助手回复标题或气泡底部显示对应调用的模型名称（如 gemini-3.8-flash, gpt-4o 等）',
      icon: <Cpu size={16} className="text-indigo-500" />,
      preview: 'gemini-3.8-flash',
    },
    {
      key: 'showMessageTime',
      title: '显示消息发出时间',
      description: '在每条用户提问与 AI 回答下方显示具体时分秒（如 14:28:09）',
      icon: <Clock size={16} className="text-blue-500" />,
      preview: '14:32:05',
    },
    {
      key: 'showLatency',
      title: '显示响应耗时',
      description: '在 AI 回答下方实时展示大模型思考与流式生成消耗的时间（如 820ms, 1.4s）',
      icon: <Zap size={16} className="text-amber-500" />,
      preview: '820ms',
    },
    {
      key: 'showMessageTokens',
      title: '显示本条消息 Token',
      description: '预估并展示当前单条消息内容消耗的 Token 数量（如 128 tok）',
      icon: <FileText size={16} className="text-emerald-500" />,
      preview: '128 tok',
    },
    {
      key: 'showSessionTokens',
      title: '显示本窗口总 Token',
      description: '在窗口顶部显示该对话累计交互消耗的预估上下文 Token 总和',
      icon: <Coins size={16} className="text-yellow-500" />,
      preview: '2,450 tok',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${theme.badgeBg} ${theme.badgeText}`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>系统设置与同步</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  v2.0
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                消息指标显示、WebDAV 跨设备云同步与全量数据备份
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 pt-2 gap-4 text-xs">
          <button
            onClick={() => setActiveTab('display')}
            className={`pb-2 px-1 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'display'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers size={13} />
            <span>消息卡片显示</span>
          </button>
          <button
            onClick={() => setActiveTab('webdav')}
            className={`pb-2 px-1 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'webdav'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Cloud size={13} />
            <span>WebDAV 同步</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2 px-1 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Download size={13} />
            <span>备份与恢复</span>
          </button>
        </div>

        {/* Tab 1: Display Settings */}
        {activeTab === 'display' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 uppercase tracking-wider">
              消息元数据显示开关
            </div>

            {options.map((opt) => {
              const isEnabled = displaySettings[opt.key] !== false;
              return (
                <div
                  key={opt.key}
                  onClick={() => handleToggle(opt.key)}
                  className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isEnabled
                      ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-300/80 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-2.5 pr-3">
                    <div className="mt-0.5">{opt.icon}</div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{opt.title}</span>
                        <span className="text-[10px] font-normal text-slate-400 font-mono">
                          {opt.preview}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-0.5">
                    <div
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        isEnabled ? theme.primaryBg : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                          isEnabled ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: WebDAV Sync */}
        {activeTab === 'webdav' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-700 dark:text-indigo-300">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <Cloud size={14} />
                <span>2.5 WebDAV 同步支持</span>
              </p>
              <p className="text-[11px] leading-relaxed text-indigo-600 dark:text-indigo-400">
                默认纯本地存储，零配置即可使用。可配置坚果云、Nextcloud、Alist、自建NAS等 WebDAV 连接。数据变动时自动防抖同步，启动时自动拉取最新数据，冲突以时间戳较新为准。
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  WebDAV 服务器地址 *
                </label>
                <input
                  type="text"
                  value={webdavConfig.url}
                  onChange={(e) =>
                    onChangeWebDavConfig?.({ ...webdavConfig, url: e.target.value.trim() })
                  }
                  placeholder="https://dav.jianguoyun.com/dav/ 或 https://your-nas/remote.php/dav/files/user/"
                  className="w-full text-xs font-mono p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    用户名 / 账号 *
                  </label>
                  <input
                    type="text"
                    value={webdavConfig.username}
                    onChange={(e) =>
                      onChangeWebDavConfig?.({ ...webdavConfig, username: e.target.value.trim() })
                    }
                    placeholder="如：your_account@gmail.com"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    应用密码 / Token *
                  </label>
                  <input
                    type="password"
                    value={webdavConfig.password || ''}
                    onChange={(e) =>
                      onChangeWebDavConfig?.({ ...webdavConfig, password: e.target.value.trim() })
                    }
                    placeholder="坚果云应用专用密码或Token"
                    className="w-full text-xs font-mono p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">数据变动时自动同步</div>
                  <div className="text-[11px] text-slate-400">发消息或新建时间线分支后自动防抖同步到云盘</div>
                </div>
                <input
                  type="checkbox"
                  checked={webdavConfig.autoSync}
                  onChange={(e) =>
                    onChangeWebDavConfig?.({ ...webdavConfig, autoSync: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </div>

              <div className="flex items-start justify-between p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 text-xs">
                <div className="flex-1 pr-3">
                  <div className="font-semibold text-rose-800 dark:text-rose-200">在手动备份时包含 API 配置</div>
                  <div className="text-[11px] text-rose-700/90 dark:text-rose-400/90 mt-0.5">
                    打开后，「立即同步到云端」会把你的 API 密钥与 WebDAV 密码一并上传到远端。
                    建议只在信任的个人云盘使用，或者保持关闭（恢复后需重新填入密钥）。
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={webdavConfig.includeApiConfig ?? false}
                  onChange={(e) =>
                    onChangeWebDavConfig?.({ ...webdavConfig, includeApiConfig: e.target.checked })
                  }
                  className="w-4 h-4 accent-rose-600 rounded mt-0.5"
                />
              </div>

              {testResult.message && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.status === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300'
                      : testResult.status === 'testing'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300'
                  }`}
                >
                  {testResult.status === 'testing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {testResult.status === 'success' && <Check className="w-3.5 h-3.5" />}
                  {testResult.status === 'error' && <X className="w-3.5 h-3.5" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestWebDav}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  测试连接
                </button>
                <button
                  type="button"
                  onClick={handleManualPushWebDav}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Upload size={13} />
                  <span>立即同步到云端</span>
                </button>
                <button
                  type="button"
                  onClick={handleManualPullWebDav}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Download size={13} />
                  <span>从云端拉取</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeWebDavConfig?.({
                      ...webdavConfig,
                      enabled: true,
                      lastSyncTime: Date.now(),
                      syncStatus: 'success',
                    });
                    alert('WebDAV 配置已保存生效！');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors ml-auto"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Download size={14} className="text-indigo-500" />
                <span>2.6 一键本地数据全量导出 (JSON)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                包含所有会话、各分支时间线因果树、楼号记录、世界观设定文档、API 密钥与自定义正则。单文件备份，完全自主掌控。
              </p>
              <div>
                <button
                  type="button"
                  onClick={onExportJson}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Download size={14} />
                  <span>立即导出全量 JSON 文件</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Upload size={14} className="text-emerald-500" />
                <span>导入 JSON 恢复全量数据</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                选择此前导出的备份文件，可将整套时间线数据完整还原至新设备或新浏览器。
              </p>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Upload size={14} />
                  <span>选择文件并恢复</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/40">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={12} />
            <span>恢复默认设置</span>
          </button>

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg ${theme.primaryBg} ${theme.primaryHover} text-white font-medium text-xs shadow-sm`}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
