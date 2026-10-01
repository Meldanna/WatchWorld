import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  GitBranch,
  User,
  Bot,
  Hash,
} from 'lucide-react';
import { ChatMessage, TimelineBranch } from '../types';
import { ThemeConfig } from '../lib/theme';
import { getTimelineColorConfig } from '../lib/timelineMemory';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  timelines: TimelineBranch[];
  theme: ThemeConfig;
  onJumpToMessage: (messageId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  messages,
  timelines,
  theme,
  onJumpToMessage,
}) => {
  const [keyword, setKeyword] = useState('');

  if (!isOpen) return null;

  const results = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return [];

    return messages
      .filter((m) => {
        const text =
          m.role === 'assistant'
            ? (m.versions[m.currentVersionIndex] || m.versions[0])?.content || m.content
            : m.content;
        return text.toLowerCase().includes(q);
      })
      .map((m) => {
        const text =
          m.role === 'assistant'
            ? (m.versions[m.currentVersionIndex] || m.versions[0])?.content || m.content
            : m.content;

        const timeline = timelines.find((t) => t.id === m.timelineId);
        return {
          message: m,
          text,
          timeline,
        };
      });
  }, [keyword, messages, timelines]);

  const handleSelect = (messageId: string) => {
    onJumpToMessage(messageId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header Search Input */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索当前窗口消息（显示楼号与标签，点击直达）..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            取消
          </button>
        </div>

        {/* Results Info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>{keyword ? `找到 ${results.length} 条相关消息` : '请输入搜索关键词'}</span>
          <span className="text-[11px] text-slate-400">当前窗口共 {messages.length} 条消息</span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {results.length > 0 ? (
            results.map(({ message, text, timeline }) => {
              const colorConfig = getTimelineColorConfig(timeline?.color);
              const isAssistant = message.role === 'assistant';
              const floorNum = message.floorNumber || 1;
              const tagDisplay = message.codeTag
                ? `${message.codeTag}${message.descriptionTag ? `·${message.descriptionTag}` : ''}`
                : (timeline?.tag || '通用');

              return (
                <div
                  key={message.id}
                  onClick={() => handleSelect(message.id)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        #{floorNum}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold shadow-xs ${colorConfig.badge}`}
                      >
                        {tagDisplay}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        {isAssistant ? (
                          <>
                            <Bot className="w-3.5 h-3.5 text-indigo-400" />
                            <span>AI</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span>我</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>跳转</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {text}
                  </p>
                </div>
              );
            })
          ) : keyword ? (
            <div className="py-10 text-center text-xs text-slate-400">
              未找到包含“{keyword}”的消息
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              输入关键词，按楼号和时间线分支快速检索
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
