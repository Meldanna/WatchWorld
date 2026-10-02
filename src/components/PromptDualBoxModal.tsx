import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowDownToLine,
  Undo2,
  FileText,
  Upload,
  Copy,
  Check,
  X,
  Layers,
  Save,
  Info,
} from 'lucide-react';
import { ThemeConfig } from '../lib/theme';
import { ChatSession, ChatMessage } from '../types';

interface PromptDualBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  theme: ThemeConfig;
  onSavePrompt: (fixedPrompt: string, commonPrompt: string, isCommonPushed: boolean) => void;
  onPushCommonMessages: () => void;
  onRevertCommonMessages: () => void;
}

export const PromptDualBoxModal: React.FC<PromptDualBoxModalProps> = ({
  isOpen,
  onClose,
  session,
  theme,
  onSavePrompt,
  onPushCommonMessages,
  onRevertCommonMessages,
}) => {
  const [fixedPrompt, setFixedPrompt] = useState(
    session.systemPromptFixed || session.systemPromptOverride || ''
  );
  const [commonPrompt, setCommonPrompt] = useState(
    session.systemPromptInjectedCommon || ''
  );
  const [isCommonPushed, setIsCommonPushed] = useState(
    Boolean(session.isCommonPushed)
  );
  const [isCommonExpanded, setIsCommonExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [injectTarget, setInjectTarget] = useState<'fixed' | 'common'>('fixed');

  if (!isOpen) return null;

  // Extract all common messages in session to preview
  const commonMessages = (session.messages || []).filter(
    (m) => m.isCommon || m.timelineId === 'timeline-main' || m.codeTag === '通用'
  );

  // 已生成的前文总结：按顺序拼接进系统提示词，此处只做展示
  const summaries = session.summaries || [];

  const handleTogglePushCommon = () => {
    if (isCommonPushed) {
      onRevertCommonMessages();
      setIsCommonPushed(false);
      setCommonPrompt('');
    } else {
      // Build common prompt from messages with floor numbers: [来自 #1-#3] 内容...
      const commonSnippets = commonMessages.map((m) => {
        const floorStr = m.floorNumber ? `[来自 #${m.floorNumber}]` : '';
        const role = m.role === 'user' ? '用户设定' : '基础世界观';
        const content =
          m.role === 'assistant'
            ? (m.versions[m.currentVersionIndex] || m.versions[0])?.content || m.content
            : m.content;
        return `${floorStr} ${role}：${content.trim()}`;
      });

      const generated = commonSnippets.join('\n\n');
      setCommonPrompt(generated);
      setIsCommonPushed(true);
      onPushCommonMessages();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        if (injectTarget === 'fixed') {
          setFixedPrompt((prev) => (prev ? `${prev}\n\n${text}` : text));
        } else {
          setCommonPrompt((prev) => (prev ? `${prev}\n\n${text}` : text));
          setIsCommonPushed(true);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSavePrompt(fixedPrompt, commonPrompt, isCommonPushed);
    onClose();
  };

  const handleCopyAll = () => {
    const combined = `【本身的提示词】:\n${fixedPrompt}\n\n【注入的通用】:\n${commonPrompt}`;
    navigator.clipboard.writeText(combined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${theme.badgeBg} ${theme.badgeText}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>双框提示词区域</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium">
                  API缓存优化
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                固定提示词始终生效，通用世界观推入后走系统级前缀，享受API Prompt Caching
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyAll}
              title="复制全部提示词"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePushCommon}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isCommonPushed
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title="点击将聊天中标记为通用的消息复制到通用框，再点一下可撤回"
            >
              {isCommonPushed ? <Undo2 size={13} /> : <ArrowDownToLine size={13} />}
              <span>{isCommonPushed ? '撤回推入通用' : '推入通用 ↓'}</span>
            </button>

            <span className="text-[11px] text-slate-400">
              当前聊天中通用消息: {commonMessages.length} 条
            </span>
          </div>

          {/* Load Document as Prompt */}
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.json"
              className="hidden"
            />
            <select
              value={injectTarget}
              onChange={(e) => setInjectTarget(e.target.value as 'fixed' | 'common')}
              className="text-[11px] py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              <option value="fixed">注入至本身框</option>
              <option value="common">注入至通用框</option>
            </select>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <Upload size={12} />
              <span>载入本地设定</span>
            </button>
          </div>
        </div>

        {/* Dual Box Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Box 1: 本身的提示词 (始终展开) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>【本身的提示词】</span>
                <span className="text-[10px] text-slate-400 font-normal font-mono">(始终展开·手写固定规则)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {fixedPrompt.length} 字
              </span>
            </div>
            <textarea
              value={fixedPrompt}
              onChange={(e) => setFixedPrompt(e.target.value)}
              placeholder="在此填写固定的系统设定、世界观背景法则、AI说话口吻与行为准则..."
              rows={isCommonExpanded ? 3 : 6}
              className="w-full text-xs font-mono p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y transition-all"
            />
          </div>

          {/* Box 2: 注入的通用 (默认折叠，展开占屏幕约 3/4) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/80">
            <div
              onClick={() => setIsCommonExpanded(!isCommonExpanded)}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 cursor-pointer select-none transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                {isCommonExpanded ? (
                  <ChevronDown className="w-4 h-4 text-indigo-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span>【▶ 注入的通用】</span>
                {isCommonPushed && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                    已激活推入缓存
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>{commonPrompt ? `${commonPrompt.length} 字` : '暂无内容'}</span>
                <span className="text-[10px] text-indigo-500 hover:underline">
                  {isCommonExpanded ? '折叠收起' : '展开编辑 (大视窗)'}
                </span>
              </div>
            </div>

            {isCommonExpanded && (
              <div className="space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>包含已推入的通用消息，享受系统级 Prefix Prompt Caching</span>
                  {isCommonPushed && (
                    <button
                      type="button"
                      onClick={() => setCommonPrompt('')}
                      className="text-rose-500 hover:underline text-[10px]"
                    >
                      清空通用框
                    </button>
                  )}
                </div>
                <textarea
                  value={commonPrompt}
                  onChange={(e) => setCommonPrompt(e.target.value)}
                  placeholder="点击上方【推入通用 ↓】或直接粘贴通用信息。推入后内容走系统提示词位置，享受API长文本缓存..."
                  style={{ height: '320px' }}
                  className="w-full text-xs font-mono p-3 rounded-xl bg-indigo-50/20 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y"
                />
              </div>
            )}
          </div>

          {/* Box 3: 前文总结推入框（自动以系统提示词身份发送） */}
          <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>【前文总结】</span>
                <span className="text-[10px] text-slate-400 font-normal font-mono">
                  (自动推入·系统提示词身份)
                </span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {summaries.length} 条 · 已总结至 #{session.lastSummarizedFloor ?? 0}
              </span>
            </div>

            <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 max-h-44 overflow-y-auto">
              {summaries.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  暂无总结。在「窗口功能 → 前文总结」生成后会自动出现在这里，并随每次请求以系统提示词身份发送。
                </p>
              ) : (
                <div className="space-y-2.5">
                  {summaries.map((s, i) => (
                    <div key={s.id} className="text-[11px]">
                      <span className="font-mono text-indigo-500 dark:text-indigo-400">
                        #{i + 1} · 第 {s.fromFloor}–{s.toFloor} 楼
                      </span>
                      <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {s.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              总结按顺序拼接在通用缓存之后，以 system 身份发送；增删请到「窗口功能 → 前文总结」。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/40">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info size={13} className="text-indigo-500" />
            <span>保存后立即应用到下一次向 AI 发送的请求</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Save size={13} />
              <span>保存提示词配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
