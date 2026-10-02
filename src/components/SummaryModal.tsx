import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ChatSession } from '../types';
import { DEFAULT_SUMMARY_PROMPT } from '../lib/defaultData';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  /** 可用模型列表（来自当前全局 Provider） */
  models: string[];
  /** 当前窗口生效的模型名 */
  currentModel: string;
  /** 是否正在生成总结 */
  isSummarizing: boolean;
  onSaveConfig: (patch: { summaryPrompt?: string; summaryModel?: string }) => void;
  onGenerate: (opts: { prompt: string; model?: string }) => void;
  onDeleteSummary: (id: string) => void;
  onClearSummaries: () => void;
}

/**
 * 前文总结。
 * 窗口级功能：只处理当前会话的消息，结果按顺序推入系统提示词（systemInstruction）。
 * 依据 lastSummarizedFloor 只总结新增部分，避免重复。
 */
export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  session,
  models,
  currentModel,
  isSummarizing,
  onSaveConfig,
  onGenerate,
  onDeleteSummary,
  onClearSummaries,
}) => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>('');

  // ⚠️ Hooks 必须在条件 return 之前
  useEffect(() => {
    if (isOpen) {
      setPrompt(session.summaryPrompt ?? '');
      setModel(session.summaryModel ?? '');
    }
  }, [isOpen, session.summaryPrompt, session.summaryModel]);

  const { maxFloor, pendingFrom, pendingCount, hiddenCount } = useMemo(() => {
    const messages = session.messages || [];
    const mx = messages.reduce((acc, m) => Math.max(acc, m.floorNumber ?? 0), 0);
    const done = session.lastSummarizedFloor ?? 0;
    const from = done + 1;
    const count = messages.filter((m) => (m.floorNumber ?? 0) >= from).length;
    // 已总结的楼层不再送往模型，这里统计的是「对 AI 隐藏」的条数
    const hidden = messages.filter(
      (m) => m.floorNumber !== undefined && m.floorNumber <= done
    ).length;
    return { maxFloor: mx, pendingFrom: from, pendingCount: count, hiddenCount: hidden };
  }, [session.messages, session.lastSummarizedFloor]);

  const summaries = session.summaries || [];

  if (!isOpen) return null;

  const labelStyle: React.CSSProperties = { color: 'var(--text-tertiary)' };
  const valueStyle: React.CSSProperties = { color: 'var(--text-primary)' };
  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface-1)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  };

  const handleGenerate = () => {
    // 保存配置与生成放在一起，避免用户改了提示词却忘记保存
    onSaveConfig({ summaryPrompt: prompt.trim() || undefined, summaryModel: model || undefined });
    onGenerate({ prompt: prompt.trim() || DEFAULT_SUMMARY_PROMPT, model: model || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl border rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 border-b shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-primary-alpha)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={valueStyle}>
                前文总结
              </h2>
              <p className="text-[11px]" style={labelStyle}>
                总结结果按顺序推入系统提示词 · 只处理未总结过的内容
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 text-xs">
          {/* 进度提示 */}
          <div
            className="flex items-start gap-2 rounded-xl border p-3"
            style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-default)' }}
          >
            {pendingCount > 0 ? (
              <>
                <Sparkles size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <div className="space-y-0.5">
                  <p style={valueStyle}>
                    将总结 <span className="font-mono">#{pendingFrom} – #{maxFloor}</span> 共 {pendingCount} 条消息
                  </p>
                  <p style={labelStyle}>
                    已总结至 #{session.lastSummarizedFloor ?? 0}，不会重复处理。
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <div className="space-y-0.5">
                  <p style={valueStyle}>没有新的内容需要总结</p>
                  <p style={labelStyle}>
                    已总结至 #{session.lastSummarizedFloor ?? 0}（当前共 {maxFloor} 楼）。
                  </p>
                </div>
              </>
            )}
          </div>

          {/* 省钱关键：已总结的原文不再送往模型 */}
          <div
            className="flex items-center justify-between rounded-xl border px-3 py-2"
            style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-default)' }}
          >
            <span style={labelStyle}>已总结、不再发送给 AI 的原文</span>
            <span
              className="font-mono font-medium"
              style={hiddenCount > 0 ? { color: 'var(--accent-primary)' } : labelStyle}
            >
              {hiddenCount} 条
            </span>
          </div>

          {/* 总结提示词 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium" style={valueStyle}>
                总结提示词
              </label>
              <button
                type="button"
                onClick={() => setPrompt('')}
                className="text-[10px] hover:underline"
                style={labelStyle}
              >
                恢复默认
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="留空则使用内置默认提示词（只记录已确认事实、保留因果、记录人物状态变化…）"
              rows={3}
              className="w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-y font-mono text-[11px] leading-relaxed"
              style={inputStyle}
            />
            <p className="text-[10px] mt-0.5" style={labelStyle}>
              留空即用内置默认：只提炼已确认事实与当前状态，不复述原文。
            </p>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block font-medium mb-1" style={valueStyle}>
              总结使用的模型
            </label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 pr-8 rounded-xl border focus:outline-none focus:ring-2 appearance-none"
                style={inputStyle}
              >
                <option value="">跟随本窗口当前模型（{currentModel || '未指定'}）</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-tertiary)' }}
              />
            </div>
            <p className="text-[10px] mt-0.5" style={labelStyle}>
              可用模型来自全局 Provider 配置；总结不写入聊天记录。
            </p>
          </div>

          {/* 已生成的总结 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium" style={valueStyle}>
                已推入的总结（{summaries.length}）
              </label>
              {summaries.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSummaries}
                  className="text-[10px] hover:underline"
                  style={{ color: '#f43f5e' }}
                >
                  清空全部
                </button>
              )}
            </div>

            {summaries.length === 0 ? (
              <p
                className="text-[11px] rounded-xl border p-3"
                style={{
                  backgroundColor: 'var(--surface-1)',
                  borderColor: 'var(--border-default)',
                  ...labelStyle,
                }}
              >
                暂无总结。点击下方「总结前文」后会按顺序出现在这里，并自动作为系统提示词发送。
              </p>
            ) : (
              <div className="space-y-2">
                {summaries.map((s, idx) => (
                  <div
                    key={s.id}
                    className="rounded-xl border p-2.5"
                    style={{
                      backgroundColor: 'var(--surface-1)',
                      borderColor: 'var(--border-default)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px]" style={{ color: 'var(--accent-primary)' }}>
                        #{idx + 1} · 覆盖 #{s.fromFloor}–#{s.toFloor}
                        {s.model ? ` · ${s.model}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteSummary(s.id)}
                        className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        title="删除这条总结"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p
                      className="text-[11px] whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {s.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <span className="text-[11px] flex items-center gap-1" style={labelStyle}>
            <Check size={12} style={{ color: 'var(--accent-primary)' }} />
            <span>总结以系统提示词身份发送，不占用聊天消息</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              关闭
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isSummarizing || pendingCount === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium shadow-md transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
            >
              {isSummarizing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {isSummarizing ? '总结中...' : '总结前文'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
