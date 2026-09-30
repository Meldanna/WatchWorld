import React from 'react';
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
  GitBranch,
} from 'lucide-react';
import { MessageDisplaySettings } from '../types';
import { ThemeConfig } from '../lib/theme';
import { DEFAULT_DISPLAY_SETTINGS } from '../lib/defaultData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  displaySettings: MessageDisplaySettings;
  onChangeDisplaySettings: (settings: MessageDisplaySettings) => void;
  theme: ThemeConfig;
  sessionTotalTokens?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  displaySettings,
  onChangeDisplaySettings,
  theme,
  sessionTotalTokens = 0,
}) => {
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
      title: '显示本窗口总 Token 统计',
      description: '在会话窗口顶部或气泡指标栏显示当前整个对话累积的 Token 总量，便于掌控大模型上下文配额',
      icon: <Coins size={16} className="text-rose-500" />,
      preview: `当前本窗口: ~${sessionTotalTokens.toLocaleString()} tok`,
    },
    {
      key: 'showTimelineTag',
      title: '显示时间线分支标签',
      description: '在每条消息顶部展示归属的时间线分支（如 [主线]、[五年后]、[时间线A] 等），支持点击查看记忆树',
      icon: <GitBranch size={16} className="text-purple-500" />,
      preview: '⏱️ [主线 / 时间线A]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${theme.accentBadge} flex items-center justify-center`}>
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>消息元数据与显示设置</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                个性化开启或隐藏模型名、时间戳、耗时与 Token 统计
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 uppercase tracking-wider">
            消息信息显示项控制
          </div>

          {options.map((opt) => {
            const isEnabled = displaySettings[opt.key];

            return (
              <div
                key={opt.key}
                onClick={() => handleToggle(opt.key)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isEnabled
                    ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {opt.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {opt.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {opt.preview}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                    isEnabled ? theme.primaryBg : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {/* Interactive Live Preview Box */}
          <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className={theme.primaryText} />
              <span>实时效果预览</span>
            </div>

            {/* Mock message bubble */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span>🤖 AI 助手</span>
                {displaySettings.showModelName && (
                  <span className="px-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                    gemini-3.8-flash
                  </span>
                )}
              </div>
              <div className="text-xs">
                这是一条带有实时元数据的测试回复内容。
              </div>

              {/* Bottom metadata tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {displaySettings.showMessageTime && (
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} />
                    <span>14:30:15</span>
                  </span>
                )}
                {displaySettings.showLatency && (
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Zap size={10} />
                    <span>680ms</span>
                  </span>
                )}
                {displaySettings.showMessageTokens && (
                  <span className="flex items-center gap-0.5 text-emerald-500">
                    <FileText size={10} />
                    <span>42 tok</span>
                  </span>
                )}
                {displaySettings.showSessionTokens && (
                  <span className="flex items-center gap-0.5 text-indigo-500">
                    <Coins size={10} />
                    <span>本窗口: ~{sessionTotalTokens.toLocaleString()} tok</span>
                  </span>
                )}
                {!displaySettings.showMessageTime &&
                  !displaySettings.showLatency &&
                  !displaySettings.showMessageTokens &&
                  !displaySettings.showSessionTokens && (
                    <span className="italic text-slate-400">已隐藏所有底部信息指标</span>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
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
