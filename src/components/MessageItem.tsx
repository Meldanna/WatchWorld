import React, { useState } from 'react';
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
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');

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
        className={`flex items-center gap-2 mb-1 px-1 text-xs text-slate-500 dark:text-slate-400 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {isAssistant ? (
          <>
            <span className="text-base select-none">{agent?.avatar || '🤖'}</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {agent?.name || 'AI 助手'}
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

        {/* Timeline Branch Tag Badge */}
        {message.timelineTag && displaySettings.showTimelineTag !== false && (
          <button
            type="button"
            onClick={() => onOpenTimelineModal?.(message.timelineId)}
            title={`所属时间线分支: ${timelineBranch?.name || message.timelineTag} (点击查看记忆树)`}
            className={`text-[10px] px-2 py-0.2 rounded-full font-bold flex items-center gap-1 border transition-all hover:scale-105 shadow-xs cursor-pointer ${
              timelineColor.badge
            }`}
          >
            <GitBranch size={10} />
            <span>{message.timelineTag}</span>
          </button>
        )}
      </div>

      {/* Bubble Container with Theme */}
      <div
        className={`relative max-w-[94%] sm:max-w-[85%] rounded-2xl px-4 py-3 transition-all ${
          isUser
            ? `${theme.userBubble} rounded-tr-sm`
            : 'bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-800/80 shadow-sm'
        }`}
      >
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
