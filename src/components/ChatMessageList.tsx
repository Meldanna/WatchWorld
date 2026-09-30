import React, { useRef, useEffect, useState } from 'react';
import {
  ChatMessage,
  Agent,
  AiContextVisibilityFilter,
  MessageDisplaySettings,
  TimelineBranch,
} from '../types';
import { MessageItem } from './MessageItem';
import { ThemeConfig } from '../lib/theme';
import { EyeOff, ArrowDown, Layers, Coins, GitBranch, Filter } from 'lucide-react';
import { formatTokenCount } from '../lib/tokenEstimator';

interface ChatMessageListProps {
  messages: ChatMessage[];
  agent?: Agent;
  aiContextVisibility: AiContextVisibilityFilter;
  uiRenderLimit: number;
  theme: ThemeConfig;
  displaySettings: MessageDisplaySettings;
  sessionTotalTokens?: number;
  isStreaming?: boolean;
  streamingMessageId?: string | null;
  timelines?: TimelineBranch[];
  activeTimelineId?: string;
  filterByActiveTimeline?: boolean;
  onToggleFilterByActiveTimeline?: () => void;
  onOpenTimelineModal?: (timelineId?: string) => void;
  onRoll: (messageId: string) => void;
  onSwitchVersion: (messageId: string, versionIndex: number) => void;
  onEditContent: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onChangeAiContextVisibility: (mode: AiContextVisibilityFilter) => void;
  onChangeUiRenderLimit: (limit: number) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  agent,
  aiContextVisibility,
  uiRenderLimit,
  theme,
  displaySettings,
  sessionTotalTokens = 0,
  isStreaming = false,
  streamingMessageId,
  timelines = [],
  activeTimelineId,
  filterByActiveTimeline = false,
  onToggleFilterByActiveTimeline,
  onOpenTimelineModal,
  onRoll,
  onSwitchVersion,
  onEditContent,
  onDeleteMessage,
  onChangeAiContextVisibility,
  onChangeUiRenderLimit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showAllTemporarily, setShowAllTemporarily] = useState(false);

  // Auto-scroll when messages change or streaming
  useEffect(() => {
    if (!showScrollBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // Branch-specific filtering if enabled
  const activeTimeline = timelines.find((t) => t.id === activeTimelineId) || timelines[0];
  const branchFilteredMessages = filterByActiveTimeline && activeTimelineId
    ? messages.filter((m) => m.timelineId === activeTimelineId || (m.role === 'user' && !m.timelineId))
    : messages;

  const totalMessageCount = branchFilteredMessages.length;
  const isLimited = uiRenderLimit > 0 && totalMessageCount > uiRenderLimit && !showAllTemporarily;
  const visibleMessages = isLimited
    ? branchFilteredMessages.slice(-uiRenderLimit)
    : branchFilteredMessages;
  const hiddenPastCount = isLimited ? totalMessageCount - uiRenderLimit : 0;

  const getAiContextVisibilityLabel = (mode: AiContextVisibilityFilter) => {
    switch (mode) {
      case 'hide_all':
        return 'AI无历史回答记忆';
      case 'latest_1':
        return 'AI仅看最新1条回答';
      case 'latest_2':
        return 'AI仅看最新2条回答';
      case 'latest_3':
        return 'AI仅看最新3条回答';
      case 'latest_5':
        return 'AI仅看最新5条回答';
      default:
        return 'AI记忆完整';
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 w-full overflow-y-auto px-1 sm:px-4 py-4 space-y-1 relative"
    >
      {/* Top Banner: UI Render Limit info */}
      {isLimited && (
        <div className="mx-auto max-w-md my-2 px-3 py-1.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-md backdrop-blur-md flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className={theme.primaryText} />
            <span>
              已启用高性能渲染：仅显示最新 <strong className={theme.primaryText}>{uiRenderLimit}</strong> 条（还有 {hiddenPastCount} 条已暂隐）
            </span>
          </div>
          <button
            onClick={() => setShowAllTemporarily(true)}
            className={`text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-black dark:hover:text-white font-medium ${theme.primaryText}`}
          >
            显示全部
          </button>
        </div>
      )}

      {showAllTemporarily && uiRenderLimit > 0 && (
        <div className="mx-auto max-w-md my-2 px-3 py-1.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm backdrop-blur-md flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          <span>已临时展开全部 {totalMessageCount} 条消息</span>
          <button
            onClick={() => setShowAllTemporarily(false)}
            className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          >
            恢复折叠
          </button>
        </div>
      )}

      {/* AI Context Visibility indicator banner */}
      {aiContextVisibility !== 'all' && (
        <div className="sticky top-2 z-10 mx-auto max-w-md my-1.5 px-3 py-1.5 bg-amber-50/90 dark:bg-slate-900/95 border border-amber-200 dark:border-slate-700/80 rounded-xl shadow-sm backdrop-blur-md flex items-center justify-between text-xs text-amber-900 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <EyeOff size={14} className="text-amber-500" />
            <span>
              AI 上下文视野：<span className="font-semibold text-amber-600 dark:text-amber-300">{getAiContextVisibilityLabel(aiContextVisibility)}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">(屏幕展示完整可见)</span>
            </span>
          </div>
          <button
            onClick={() => onChangeAiContextVisibility('all')}
            className={`text-[11px] px-2 py-0.5 rounded bg-amber-100 dark:bg-slate-800 hover:bg-amber-200 dark:hover:bg-slate-700 font-medium ${theme.primaryText}`}
          >
            还原全记忆
          </button>
        </div>
      )}

      {/* Branch Filter indicator banner */}
      {filterByActiveTimeline && activeTimeline && (
        <div className="sticky top-2 z-10 mx-auto max-w-md my-1.5 px-3 py-1.5 bg-indigo-50/95 dark:bg-slate-900/95 border border-indigo-200 dark:border-indigo-800/80 rounded-xl shadow-sm backdrop-blur-md flex items-center justify-between text-xs text-indigo-900 dark:text-slate-200">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <GitBranch size={13} className="text-indigo-500 shrink-0" />
            <span className="truncate">
              已聚焦分支：<strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{activeTimeline.name}</strong> ({branchFilteredMessages.length}条消息)
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleFilterByActiveTimeline}
              className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
            >
              看全部
            </button>
            <button
              onClick={() => onOpenTimelineModal?.(activeTimeline.id)}
              className="text-[11px] px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 font-medium"
            >
              记忆树
            </button>
          </div>
        </div>
      )}

      {/* Session Tokens Header Badge (if showSessionTokens is enabled and there are messages) */}
      {displaySettings.showSessionTokens && sessionTotalTokens > 0 && messages.length > 0 && (
        <div className="flex justify-center my-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono shadow-xs">
            <Coins size={11} className="text-indigo-500" />
            <span>本窗口总 Token: ~{formatTokenCount(sessionTotalTokens)} tok ({messages.length}条消息)</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-3xl mb-4 shadow-sm">
            {agent?.avatar || '🌟'}
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {agent?.name || '新会话'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
            {agent?.description || '随时在下方输入消息、连接 MCP 服务、绑定知识库或选用提示词开始对话。'}
          </p>
        </div>
      )}

      {/* Render Messages */}
      {visibleMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          agent={agent}
          theme={theme}
          displaySettings={displaySettings}
          sessionTotalTokens={sessionTotalTokens}
          isStreaming={isStreaming && streamingMessageId === message.id}
          timelines={timelines}
          onRoll={onRoll}
          onSwitchVersion={onSwitchVersion}
          onEditContent={onEditContent}
          onDeleteMessage={onDeleteMessage}
          onOpenTimelineModal={onOpenTimelineModal}
        />
      ))}

      <div ref={bottomRef} className="h-4" />

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className={`fixed bottom-24 right-5 z-20 w-9 h-9 rounded-full ${theme.primaryBg} ${theme.primaryHover} text-white flex items-center justify-center shadow-lg border border-white/20 transition-transform active:scale-95`}
          title="回到底部"
        >
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
};
