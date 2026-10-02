import React, { useState, useMemo } from 'react';
import { FileText, X, Copy, Download, Upload, Check, ClipboardPaste } from 'lucide-react';
import { ChatSession, ChatMessage } from '../types';

interface SessionTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  /** 批量导入：把解析出的文本段追加为本窗口消息 */
  onImportMessages: (items: { content: string; role: 'user' | 'assistant' }[]) => void;
}

/** 取消息当前生效版本的正文，兼容旧数据缺失 */
function textOf(m: ChatMessage): string {
  if (m.role === 'assistant') {
    const version = m.versions?.[m.currentVersionIndex] ?? m.versions?.[0];
    return version?.content || m.content || '';
  }
  return m.content || '';
}

/** 把本窗口消息渲染成 Markdown 文本 */
function buildExportText(session: ChatSession): string {
  const messages = session.messages || [];
  const lines: string[] = [];

  lines.push(`# ${session.title || '未命名窗口'}`);
  lines.push('');
  lines.push(
    `> 导出时间：${new Date().toLocaleString('zh-CN')} · 共 ${messages.length} 条消息`
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  messages.forEach((m, idx) => {
    const floor = m.floorNumber ?? idx + 1;
    const who = m.role === 'assistant' ? 'AI' : '我';
    const tag = m.codeTag
      ? `${m.codeTag}${m.descriptionTag ? `·${m.descriptionTag}` : ''}`
      : m.timelineTag || '通用';

    lines.push(`## #${floor} · ${who} · [${tag}]`);
    lines.push('');
    lines.push(textOf(m));
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * 本窗口文本导入 / 导出。
 * 属于窗口级功能：只读写当前会话的消息，不触碰其他窗口。
 */
export const SessionTextModal: React.FC<SessionTextModalProps> = ({
  isOpen,
  onClose,
  session,
  onImportMessages,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importRole, setImportRole] = useState<'user' | 'assistant'>('user');
  const [splitByBlank, setSplitByBlank] = useState(true);
  const [copied, setCopied] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  // ⚠️ Hooks 必须在条件 return 之前调用（isOpen 变化会改变 hook 数量导致 React 报错）
  const exportText = useMemo(() => buildExportText(session), [session]);

  const parsedItems = useMemo(() => {
    const raw = importText.trim();
    if (!raw) return [] as { content: string; role: 'user' | 'assistant' }[];

    const blocks = splitByBlank
      ? raw
          .split(/\n\s*\n+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [raw];

    return blocks.map((content) => ({ content, role: importRole }));
  }, [importText, importRole, splitByBlank]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // 剪贴板不可用时退化为手动选择复制
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (session.title || '窗口').replace(/[\\/:*?"<>|]/g, '_');
    a.download = `${safeName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (parsedItems.length === 0) return;
    onImportMessages(parsedItems);
    setImportedCount(parsedItems.length);
    setImportText('');
    setTimeout(() => setImportedCount(null), 2500);
  };

  const labelStyle: React.CSSProperties = { color: 'var(--text-tertiary)' };
  const valueStyle: React.CSSProperties = { color: 'var(--text-primary)' };

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
                本窗口文本导入 / 导出
              </h2>
              <p className="text-[11px]" style={labelStyle}>
                只作用于当前窗口 · 共 {(session.messages || []).length} 条消息
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

        {/* Tabs */}
        <div className="flex gap-2 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setTab('export')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: tab === 'export' ? 'var(--accent-primary)' : 'var(--surface-2)',
              color: tab === 'export' ? 'white' : 'var(--text-secondary)',
            }}
          >
            <Download size={13} />
            导出
          </button>
          <button
            type="button"
            onClick={() => setTab('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: tab === 'import' ? 'var(--accent-primary)' : 'var(--surface-2)',
              color: tab === 'import' ? 'white' : 'var(--text-secondary)',
            }}
          >
            <Upload size={13} />
            导入
          </button>
        </div>

        {/* Body */}
        {tab === 'export' ? (
          <div className="flex-1 flex flex-col min-h-0 py-3 space-y-2">
            <textarea
              readOnly
              value={exportText}
              className="flex-1 min-h-[240px] w-full p-3 rounded-xl border focus:outline-none resize-none font-mono text-[11px] leading-relaxed"
              style={{
                backgroundColor: 'var(--surface-1)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              aria-label="导出文本预览"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? '已复制' : '复制全文'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              >
                <Download size={13} />
                下载 .md
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 py-3 space-y-3">
            {/* 角色选择 */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] shrink-0" style={labelStyle}>
                导入为：
              </span>
              <div className="flex gap-1.5">
                {(['user', 'assistant'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setImportRole(r)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor:
                        importRole === r ? 'var(--accent-primary-alpha)' : 'var(--surface-2)',
                      color: importRole === r ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${
                        importRole === r ? 'var(--accent-primary)' : 'var(--border-default)'
                      }`,
                    }}
                  >
                    {r === 'user' ? '我（用户）' : 'AI 回复'}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none" style={labelStyle}>
                <input
                  type="checkbox"
                  checked={splitByBlank}
                  onChange={(e) => setSplitByBlank(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                按空行拆分为多条
              </label>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={'在此粘贴文本...\n\n留空行会拆分成多条消息（可取消勾选以整段导入）'}
              className="flex-1 min-h-[200px] w-full p-3 rounded-xl border focus:outline-none focus:ring-2 resize-none text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--surface-1)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              aria-label="导入文本"
            />

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px]" style={labelStyle}>
                {parsedItems.length > 0
                  ? `将导入 ${parsedItems.length} 条消息到本窗口`
                  : '尚未输入内容'}
                {importedCount !== null && (
                  <span style={{ color: 'var(--accent-primary)' }}> · 已导入 {importedCount} 条</span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportText('')}
                  className="px-3 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  清空
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={parsedItems.length === 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium shadow-md transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                >
                  <ClipboardPaste size={13} />
                  导入到本窗口
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
