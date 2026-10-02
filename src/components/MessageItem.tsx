import React, { useState, useEffect } from 'react';
import {
  ChatMessage,
  Agent,
  MessageVersion,
  MessageDisplaySettings,
  TimelineBranch,
} from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ThemeConfig } from '../lib/theme';
import { formatTimestamp, formatLatency, formatTokenCount, estimateTokens } from '../lib/tokenEstimator';
import { getTimelineColorConfig } from '../lib/timelineMemory';
import { ImageStore, StoredImage } from '../lib/imageStore';
import {
  ChevronLeft,
  ChevronRight,
  Dices,
  Copy,
  Check,
  Edit3,
  Trash2,
  Save,
  X,
  User as UserIcon,
  Clock,
  Zap,
  Cpu,
  Coins,
  FileText,
  GitBranch,
} from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  agent?: Agent;
  theme: ThemeConfig;
  displaySettings: MessageDisplaySettings;
  sessionTotalTokens?: number;
  isStreaming?: boolean;
  timelines?: TimelineBranch[];
  onRoll: (messageId: string) => void;
  onSwitchVersion: (messageId: string, versionIndex: number) => void;
  onEditContent: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onOpenTimelineModal?: (timelineId?: string) => void;
  onToggleCommon?: (messageId: string) => void;
  onToggleAnalysisVisibility?: (messageId: string) => void;
  onSaveAnalysisToDoc?: (message: ChatMessage) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  agent,
  theme,
  displaySettings,
  sessionTotalTokens = 0,
  isStreaming = false,
  timelines = [],
  onRoll,
  onSwitchVersion,
  onEditContent,
  onDeleteMessage,
  onOpenTimelineModal,
  onToggleCommon,
  onToggleAnalysisVisibility,
  onSaveAnalysisToDoc,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [images, setImages] = useState<StoredImage[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // 图片本体存于 IndexedDB，这里按 id 异步取回
  const imageKey = (message.imageIds || []).join(',');
  useEffect(() => {
    let cancelled = false;
    const ids = message.imageIds || [];
    if (ids.length === 0) {
      setImages([]);
      return;
    }
    ImageStore.getMany(ids).then((map) => {
      if (cancelled) return;
      setImages(ids.map((id) => map[id]).filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
  }, [imageKey]);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const versions = message.versions || [];
  const currentIdx = Math.max(0, Math.min(message.currentVersionIndex ?? 0, versions.length - 1));
  const activeVersion: MessageVersion | undefined = versions[currentIdx];

  const currentContent = isUser
    ? message.content
    : (activeVersion?.content ?? message.content ?? '');

  const totalVersions = versions.length;

  // Resolved metadata
  const currentModel = isAssistant
    ? activeVersion?.model || agent?.model || '默认模型'
    : undefined;

  const currentTimestamp = isAssistant
    ? activeVersion?.timestamp || message.timestamp
    : message.timestamp;

  const currentLatency = isAssistant
    ? activeVersion?.latencyMs ?? message.latencyMs
    : undefined;

  // Estimated tokens for this single message
  const currentTokens =
    (isAssistant ? activeVersion?.tokens : message.tokens) ||
    estimateTokens(currentContent);

  const timelineBranch = timelines.find((t) => t.id === message.timelineId);
  const timelineColor = getTimelineColorConfig(timelineBranch?.color);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleStartEdit = () => {
    setEditDraft(currentContent);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editDraft.trim()) {
      onEditContent(message.id, editDraft.trim());
    }
    setIsEditing(false);
  };

  const handlePrevVersion = () => {
    if (currentIdx > 0) {
      onSwitchVersion(message.id, currentIdx - 1);
    }
  };

  const handleNextVersion = () => {
    if (currentIdx < totalVersions - 1) {
      onSwitchVersion(message.id, currentIdx + 1);
    }
  };

  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-3 px-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 max-w-[90%] text-center">
          <span className="font-medium text-slate-700 dark:text-slate-300">系统提示：</span> {message.content}
        </div>
      </div>
    );
  }

  const hasMetricsToDisplay =
    (displaySettings.showMessageTime && currentTimestamp) ||
    (displaySettings.showLatency && isAssistant && currentLatency !== undefined) ||
    (displaySettings.showMessageTokens && currentTokens > 0) ||
    (displaySettings.showSessionTokens && isAssistant && sessionTotalTokens > 0);

  return (
    <div
      className={`group flex flex-col w-full my-3 px-3 transition-opacity ${
        isUser ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender Header info */}
      <div
        className={`flex items-center gap-1.5 mb-1 px-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Floor Number Badge (前端强制写入，消息唯一定位符) */}
        {message.floorNumber && (
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 shadow-xs">
            #{message.floorNumber}
          </span>
        )}

        {isAssistant ? (
          <>
            <span className="text-base select-none">{message.isAnalysis ? '📊' : (agent?.avatar || '🤖')}</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {message.isAnalysis ? '角色关系分析Agent' : (agent?.name || 'AI 助手')}
            </span>
            {/* Model Name in Header if enabled */}
            {displaySettings.showModelName && currentModel && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700/50 flex items-center gap-1">
                <Cpu size={10} className="text-indigo-400" />
                <span>{currentModel}</span>
              </span>
            )}
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[11px] border border-slate-300 dark:border-slate-700">
              <UserIcon size={12} />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">我</span>
          </>
        )}

        {/* Timeline Dual-Tag Badge */}
        {displaySettings.showTimelineTag !== false && (
          <button
            type="button"
            onClick={() => onOpenTimelineModal?.(message.timelineId)}
            title={`所属时间线分支: ${timelineBranch?.name || message.timelineTag || '通用'} (点击查看记忆树)`}
            className={`text-[10px] px-2 py-0.2 rounded-full font-bold flex items-center gap-1 border transition-all hover:scale-105 shadow-xs cursor-pointer ${
              timelineColor.badge
            }`}
          >
            <GitBranch size={10} />
            <span>
              {message.codeTag
                ? `${message.codeTag}${message.descriptionTag ? `·${message.descriptionTag}` : ''}`
                : (timelineBranch?.codeTag ? `${timelineBranch.codeTag}·${timelineBranch.tag}` : (message.timelineTag || '通用'))}
            </span>
          </button>
        )}

        {/* Common Tag Badge */}
        {message.isCommon && (
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            通用
          </span>
        )}

        {/* Analysis Card Badge */}
        {message.isAnalysis && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
              message.analysisVisibility === 'hidden'
                ? 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                : 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
            }`}
          >
            {message.analysisVisibility === 'hidden' ? '仅自己可见 (不占AI上下文)' : 'AI可见 (参与重排)'}
          </span>
        )}
      </div>

      {/* Bubble Container with Theme */}
      <div
        className={`relative max-w-[94%] sm:max-w-[85%] rounded-2xl px-4 py-3 transition-all ${
          message.isAnalysis
            ? 'bg-gradient-to-br from-indigo-50/90 to-blue-50/90 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/80 shadow-md text-slate-900 dark:text-slate-100'
            : isUser
            ? `${theme.userBubble} rounded-tr-sm`
            : 'bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-800/80 shadow-sm'
        }`}
      >
        {/* 消息附图（点击可看大图） */}
        {images.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setPreviewSrc(img.dataUrl)}
                className="rounded-lg overflow-hidden border transition-transform hover:scale-[1.02]"
                style={{ borderColor: 'rgba(148,163,184,0.35)' }}
                title={img.name ? `${img.name}（点击查看大图）` : '点击查看大图'}
              >
                <img
                  src={img.dataUrl}
                  alt={img.name || '消息附图'}
                  className="block max-w-[180px] max-h-[180px] object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {isEditing ? (
          <div className="w-full flex flex-col gap-2">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              className="w-full min-h-[90px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 resize-y"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <X size={13} /> 取消
              </button>
              <button
                onClick={handleSaveEdit}
                className={`px-2.5 py-1 rounded ${theme.primaryBg} ${theme.primaryHover} text-white font-medium flex items-center gap-1`}
              >
                <Save size={13} /> 保存
              </button>
            </div>
          </div>
        ) : isUser ? (
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed select-text font-normal">
            {currentContent}
          </div>
        ) : (
          <div>
            <MarkdownRenderer content={currentContent} />
            {isStreaming && (
              <span className={`inline-block w-2 h-4 ml-1 ${theme.primaryBg} animate-pulse align-middle`} />
            )}
          </div>
        )}

        {/* Bottom Message Metrics / Metadata Bar inside bubble */}
        {!isEditing && hasMetricsToDisplay && (
          <div
            className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 pt-1.5 border-t text-[10px] select-none font-mono ${
              isUser
                ? 'border-white/20 text-white/80 justify-end'
                : 'border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 justify-start'
            }`}
          >
            {/* Message Time */}
            {displaySettings.showMessageTime && currentTimestamp > 0 && (
              <span
                className="flex items-center gap-1"
                title={`发出时间: ${new Date(currentTimestamp).toLocaleString()}`}
              >
                <Clock size={11} className="opacity-70" />
                <span>{formatTimestamp(currentTimestamp)}</span>
              </span>
            )}

            {/* Latency (for assistant) */}
            {displaySettings.showLatency && isAssistant && currentLatency !== undefined && (
              <span
                className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400"
                title={`生成耗时: ${currentLatency}ms`}
              >
                <Zap size={11} />
                <span>{formatLatency(currentLatency)}</span>
              </span>
            )}

            {/* This Message Token */}
            {displaySettings.showMessageTokens && currentTokens > 0 && (
              <span
                className={`flex items-center gap-0.5 ${
                  isUser ? 'text-white/90' : 'text-emerald-600 dark:text-emerald-400'
                }`}
                title={`本条消息消耗: ~${currentTokens} Tokens`}
              >
                <FileText size={11} />
                <span>{formatTokenCount(currentTokens)} tok</span>
              </span>
            )}

            {/* Session Total Token (displayed on AI responses) */}
            {displaySettings.showSessionTokens && isAssistant && sessionTotalTokens > 0 && (
              <span
                className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400"
                title={`当前会话累计总消耗: ~${sessionTotalTokens.toLocaleString()} Tokens`}
              >
                <Coins size={11} />
                <span>窗口: ~{formatTokenCount(sessionTotalTokens)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 图片大图预览 */}
      {previewSrc && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80"
          onClick={() => setPreviewSrc(null)}
          role="dialog"
          aria-label="图片预览"
        >
          <img
            src={previewSrc}
            alt="图片预览"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
          />
          <button
            type="button"
            onClick={() => setPreviewSrc(null)}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      {!isEditing && (
        <div
          className={`flex items-center gap-2 mt-1.5 px-1 text-xs text-slate-400 dark:text-slate-500 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Version Switcher for Assistant (< 1/3 >) */}
          {isAssistant && totalVersions > 1 && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-300">
              <button
                onClick={handlePrevVersion}
                disabled={currentIdx === 0}
                className="p-0.5 hover:text-black dark:hover:text-white disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                title="查看上一分支"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-1 text-slate-500 dark:text-slate-400 font-mono">
                {currentIdx + 1}/{totalVersions}
              </span>
              <button
                onClick={handleNextVersion}
                disabled={currentIdx === totalVersions - 1}
                className="p-0.5 hover:text-black dark:hover:text-white disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                title="查看下一分支"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Roll / Regenerate Button (For Assistant) */}
          {isAssistant && !isStreaming && (
            <button
              onClick={() => onRoll(message.id)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors text-[11px]"
              title="重新生成并保存为新分支（完全不影响下方已有对话）"
            >
              <Dices size={12} className={theme.primaryText} />
              <span>Roll分支</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="复制内容"
          >
            {copied ? <Check size={12} className={theme.primaryText} /> : <Copy size={12} />}
          </button>

          {/* Edit Button */}
          <button
            onClick={handleStartEdit}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="修改内容"
          >
            <Edit3 size={12} />
          </button>

          {/* Timeline Branch Button */}
          {onOpenTimelineModal && (
            <button
              onClick={() => onOpenTimelineModal(message.timelineId)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="查看时间线记忆树"
            >
              <GitBranch size={12} />
            </button>
          )}

          {/* Toggle Common Message Button */}
          {onToggleCommon && (
            <button
              type="button"
              onClick={() => onToggleCommon(message.id)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                message.isCommon
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:text-indigo-500'
              }`}
              title={message.isCommon ? "取消通用标记（归属特定分支）" : "标记为通用信息（所有分支共享，享受缓存）"}
            >
              {message.isCommon ? '已通用' : '设为通用'}
            </button>
          )}

          {/* Special Actions for Analysis Card */}
          {message.isAnalysis && (
            <>
              {onToggleAnalysisVisibility && (
                <button
                  type="button"
                  onClick={() => onToggleAnalysisVisibility(message.id)}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                  title="切换可见性：隐藏只自己看，不进AI上下文；可见则参与后续重排"
                >
                  {message.analysisVisibility === 'hidden' ? '设为AI可见' : '隐藏不进AI'}
                </button>
              )}
              {onSaveAnalysisToDoc && (
                <button
                  type="button"
                  onClick={() => onSaveAnalysisToDoc(message)}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                  title="将本份心理博弈分析报告归档至设定文档区"
                >
                  存文档
                </button>
              )}
            </>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDeleteMessage(message.id)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors"
            title="删除此消息"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
