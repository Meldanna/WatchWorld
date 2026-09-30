import React from 'react';
import { Eye, EyeOff, Filter, Check, X, ShieldAlert, Sparkles, Layers } from 'lucide-react';
import { AiContextVisibilityFilter } from '../types';
import { ThemeConfig } from '../lib/theme';

interface AiVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAiContextMode: AiContextVisibilityFilter;
  uiRenderLimit: number;
  theme: ThemeConfig;
  onChangeAiContextMode: (mode: AiContextVisibilityFilter) => void;
  onChangeUiRenderLimit: (limit: number) => void;
}

export const AiVisibilityModal: React.FC<AiVisibilityModalProps> = ({
  isOpen,
  onClose,
  currentAiContextMode,
  uiRenderLimit,
  theme,
  onChangeAiContextMode,
  onChangeUiRenderLimit,
}) => {
  if (!isOpen) return null;

  const aiContextOptions: {
    id: AiContextVisibilityFilter;
    title: string;
    description: string;
    icon: React.ReactNode;
    tag?: string;
  }[] = [
    {
      id: 'all',
      title: '全部历史回复送入 AI 上下文 (默认)',
      description: 'AI 在回答时能看到完整的前序助手回答（模型记忆最完整，但消耗较多 Token）。用户端屏幕始终完整展示。',
      icon: <Eye size={17} className={theme.primaryText} />,
    },
    {
      id: 'hide_all',
      title: '向 AI 隐藏所有助手消息 (无历史回答视野)',
      description: '给 AI 发送的上下文里只包含你的用户提问，完全不传以前的 AI 回答（模型不被旧答案干扰，更省 Token，防幻觉）。用户端屏幕不受影响。',
      icon: <EyeOff size={17} className="text-amber-400" />,
      tag: '高效防幻觉',
    },
    {
      id: 'latest_1',
      title: '仅让 AI 看到最新 1 条历史回答',
      description: 'AI 仅接收最后 1 条 AI 助手的回答，更早的回答自动从发送给大模型的上下文中剔除。',
      icon: <Filter size={17} className="text-blue-400" />,
    },
    {
      id: 'latest_2',
      title: '仅让 AI 看到最新 2 条历史回答',
      description: '保留短期记忆，过滤长程冗余回答。',
      icon: <Filter size={17} className="text-blue-400" />,
    },
    {
      id: 'latest_3',
      title: '仅让 AI 看到最新 3 条历史回答',
      description: '折中模式，兼顾前情承接与 Token 节省。',
      icon: <Filter size={17} className="text-blue-400" />,
    },
  ];

  const renderLimitOptions = [
    { limit: 0, label: '全部渲染 (无限制)' },
    { limit: 5, label: '最新 5 条' },
    { limit: 10, label: '最新 10 条' },
    { limit: 20, label: '最新 20 条' },
    { limit: 50, label: '最新 50 条' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${theme.accentBadge} flex items-center justify-center`}>
              <Eye size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                AI 上下文视野 & 界面渲染优化
              </h2>
              <p className="text-[11px] text-slate-400">
                精细控制 AI 所见上下文，以及屏幕渲染条数
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

        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Section 1: AI Visibility (Affects AI only) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>1. AI 助手消息显隐（只影响 AI 能否看见，用户屏幕保持完整）</span>
              </span>
            </div>

            <div className="space-y-2">
              {aiContextOptions.map((opt) => {
                const isSelected = currentAiContextMode === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => onChangeAiContextMode(opt.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-slate-600 shadow-md ring-1 ring-slate-500'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{opt.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? theme.primaryText : 'text-slate-200'
                          }`}
                        >
                          {opt.title}
                        </span>
                        {opt.tag && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            {opt.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full ${theme.accentBadge} flex items-center justify-center shrink-0`}>
                        <Check size={13} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: UI Render Limit (Renders latest N messages) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers size={14} className={theme.primaryText} />
                <span>2. 屏幕仅渲染最新 N 条消息（极大提升超长会话滑动流畅度）</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              当一个窗口聊了上百条很卡时，可限制只渲染最新的几条；历史记录完好无损，随时可点顶部“显示全部”。
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {renderLimitOptions.map((opt) => {
                const isSelected = uiRenderLimit === opt.limit;
                return (
                  <button
                    key={opt.limit}
                    onClick={() => onChangeUiRenderLimit(opt.limit)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                      isSelected
                        ? `${theme.primaryBg} text-white border-transparent shadow-sm`
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>设置将自动作用于当前会话窗口</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
