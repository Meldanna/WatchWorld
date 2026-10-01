import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Bot,
  Eye,
  BookOpen,
  Code2,
  Server,
  Zap,
  GitBranch,
  BarChart2,
  Layers,
  ArrowLeftRight,
  Search,
} from 'lucide-react';
import { Agent, AiContextVisibilityFilter, TimelineBranch } from '../types';
import { ThemeConfig } from '../lib/theme';
import { getTimelineColorConfig } from '../lib/timelineMemory';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  activeAgent: Agent;
  aiContextVisibility: AiContextVisibilityFilter;
  connectedKnowledgeCount: number;
  activeRegexCount: number;
  connectedSkillCount: number;
  activeMcpCount: number;
  theme: ThemeConfig;
  onOpenPromptModal: () => void;
  onOpenAgentModal: () => void;
  onOpenVisibilityModal: () => void;
  onOpenKnowledgeModal: () => void;
  onOpenRegexModal: () => void;
  onOpenMcpModal: () => void;
  onOpenSkillModal: () => void;
  inputDraft: string;
  setInputDraft: (val: string) => void;
  // 观界·时间线标签栏扩展
  timelines?: TimelineBranch[];
  activeTimelineId?: string;
  onSelectTimeline?: (timelineId: string) => void;
  tagDisplayMode?: 'desc' | 'code';
  onToggleTagDisplayMode?: () => void;
  lastUserMessageTimelineId?: string;
  onTriggerRoleAnalysis?: () => void;
  onOpenDualBoxPromptModal?: () => void;
  onOpenSearchModal?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  activeAgent,
  aiContextVisibility,
  connectedKnowledgeCount,
  activeRegexCount,
  connectedSkillCount,
  activeMcpCount,
  theme,
  onOpenPromptModal,
  onOpenAgentModal,
  onOpenVisibilityModal,
  onOpenKnowledgeModal,
  onOpenRegexModal,
  onOpenMcpModal,
  onOpenSkillModal,
  inputDraft,
  setInputDraft,
  timelines = [],
  activeTimelineId,
  onSelectTimeline,
  tagDisplayMode = 'desc',
  onToggleTagDisplayMode,
  lastUserMessageTimelineId,
  onTriggerRoleAnalysis,
  onOpenDualBoxPromptModal,
  onOpenSearchModal,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 130)}px`;
    }
  }, [inputDraft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (window.innerWidth > 640) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      onStopGeneration();
      return;
    }
    const trimmed = inputDraft.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const getVisibilityBadgeText = (mode: AiContextVisibilityFilter) => {
    switch (mode) {
      case 'hide_all':
        return 'AI无回复记忆';
      case 'latest_1':
        return 'AI显最新1条';
      case 'latest_2':
        return 'AI显最新2条';
      case 'latest_3':
        return 'AI显最新3条';
      case 'latest_5':
        return 'AI显最新5条';
      default:
        return 'AI全记忆';
    }
  };

  // 4.4 标签排序：上一条用户消息的标签自动排最前面，左右滑动切换其他标签
  const orderedTimelines = useMemo(() => {
    if (timelines.length === 0) return [];

    const copy = [...timelines];
    if (!lastUserMessageTimelineId) return copy;

    const lastIdx = copy.findIndex((t) => t.id === lastUserMessageTimelineId);
    if (lastIdx > 0) {
      const [lastT] = copy.splice(lastIdx, 1);
      copy.unshift(lastT);
    }
    return copy;
  }, [timelines, lastUserMessageTimelineId]);

  return (
    <div className="w-full bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800/90 backdrop-blur-lg px-3 py-2 pb-safe transition-colors">
      {/* 4.4 分支标签选择栏 (Tag Bar) */}
      {timelines.length > 0 && onSelectTimeline && (
        <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
          {/* Tag mode toggle button */}
          <button
            type="button"
            onClick={onToggleTagDisplayMode}
            className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700/70 flex items-center gap-1 shrink-0 font-medium"
            title="切换标签显示模式：文字版（下药线·感情上头）与字母版（A12）"
          >
            <ArrowLeftRight size={10} className="text-indigo-500" />
            <span>{tagDisplayMode === 'code' ? '字母版' : '文字版'}</span>
          </button>

          {/* Scrollable branch tags bar */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 mask-linear-scroll">
            {orderedTimelines.map((branch) => {
              const isSelected = branch.id === (activeTimelineId || timelines[0]?.id);
              const colorConfig = getTimelineColorConfig(branch.color);

              // 文本模式与字母模式切换
              const codeDisplay = branch.codeTag || branch.tag || '通用';
              const textDisplay = branch.descriptionTag || branch.name || codeDisplay;
              const displayText =
                tagDisplayMode === 'code'
                  ? codeDisplay
                  : `${codeDisplay}·${textDisplay}`;

              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => onSelectTimeline(branch.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1 border select-none ${
                    isSelected
                      ? `${colorConfig.badge} shadow-xs border-transparent scale-102`
                      : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700/60'
                  }`}
                  title={`点击将下一条消息归属于分支：${branch.name} (${codeDisplay})`}
                >
                  <GitBranch size={11} className={isSelected ? 'text-white' : 'text-slate-400'} />
                  <span className="max-w-[140px] truncate">{displayText}</span>
                  {branch.visible === false && (
                    <span className="text-[9px] opacity-75">(隐)</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Role Relationship Analysis Trigger Button */}
          {onTriggerRoleAnalysis && (
            <button
              type="button"
              onClick={onTriggerRoleAnalysis}
              className="text-[10px] px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/70 font-bold shrink-0 flex items-center gap-1 transition-colors"
              title="十、启动角色心理动力学分析 Agent（独立调用，不实时分析，省 Token）"
            >
              <BarChart2 size={11} className="text-indigo-500" />
              <span>分析角色关系</span>
            </button>
          )}
        </div>
      )}

      {/* Top Accessory Chips Bar */}
      <div className="flex items-center justify-between pb-1 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 mask-linear-scroll flex-1 mr-1">
          {/* Active Agent Badge */}
          <button
            onClick={onOpenAgentModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 active:scale-95 transition-all shrink-0"
            title="点击切换或编辑顾问"
          >
            <span>{activeAgent.avatar}</span>
            <span className="max-w-[70px] sm:max-w-[110px] truncate font-medium">
              {activeAgent.name}
            </span>
          </button>

          {/* Dual Box Prompt Quick Button */}
          {onOpenDualBoxPromptModal && (
            <button
              onClick={onOpenDualBoxPromptModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 active:scale-95 transition-all shrink-0 font-medium"
              title="打开双框提示词区域与推入通用缓存"
            >
              <Layers size={12} className="text-indigo-500" />
              <span>双框提示词</span>
            </button>
          )}

          {/* MCP Tools Quick Button */}
          <button
            onClick={onOpenMcpModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border active:scale-95 transition-all shrink-0 ${
              activeMcpCount > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
            }`}
            title="MCP 协议服务与外部工具"
          >
            <Server size={12} className="text-emerald-500" />
            <span className="font-medium">
              MCP{activeMcpCount > 0 ? ` (${activeMcpCount})` : ''}
            </span>
          </button>

          {/* Skills Quick Button */}
          <button
            onClick={onOpenSkillModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border active:scale-95 transition-all shrink-0 ${
              connectedSkillCount > 0
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/40'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
            }`}
            title="Agent Skill 专属能力系统（时间线梳理、世界观一致性检查等）"
          >
            <Zap size={12} className="text-amber-500" />
            <span className="font-medium">
              Skill{connectedSkillCount > 0 ? ` (${connectedSkillCount})` : ''}
            </span>
          </button>

          {/* Knowledge Base Button */}
          <button
            onClick={onOpenKnowledgeModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border active:scale-95 transition-all shrink-0 ${
              connectedKnowledgeCount > 0
                ? `${theme.accentBadge}`
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
            }`}
            title="管理或连接本地世界观知识库"
          >
            <BookOpen size={12} className="text-blue-500" />
            <span className="font-medium">
              知识库{connectedKnowledgeCount > 0 ? ` (${connectedKnowledgeCount})` : ''}
            </span>
          </button>

          {/* Regex Rules Button */}
          <button
            onClick={onOpenRegexModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border active:scale-95 transition-all shrink-0 ${
              activeRegexCount > 0
                ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-500/40'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
            }`}
            title="正则表达式清洗规则"
          >
            <Code2 size={12} className="text-purple-500" />
            <span className="font-medium">
              正则{activeRegexCount > 0 ? ` (${activeRegexCount})` : ''}
            </span>
          </button>

          {/* Prompt Presets Button */}
          <button
            onClick={onOpenPromptModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 active:scale-95 transition-all shrink-0"
            title="选择或管理提示词预设"
          >
            <Sparkles size={12} className="text-amber-500" />
            <span className="font-medium">预设</span>
          </button>

          {/* AI Context Visibility Switch Button */}
          <button
            onClick={onOpenVisibilityModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border active:scale-95 transition-all shrink-0 ${
              aiContextVisibility !== 'all'
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/40'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
            }`}
            title="控制 AI 上下文中能看见的历史助手回答条数"
          >
            <Eye size={12} className="text-amber-500" />
            <span className="font-medium">{getVisibilityBadgeText(aiContextVisibility)}</span>
          </button>
        </div>
      </div>

      {/* Input Text Box & Action Button */}
      <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-slate-300 dark:border-slate-800/90 focus-within:border-slate-500 dark:focus-within:border-slate-600 p-1.5 shadow-sm transition-colors">
        <textarea
          ref={textareaRef}
          value={inputDraft}
          onChange={(e) => setInputDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? 'AI 正在推演中...'
              : '围绕世界观讨论人物与事件（输入自动保存，支持 A12 切分支）...'
          }
          disabled={isStreaming}
          rows={1}
          className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
        />

        {/* Action Button: Send or Stop */}
        <button
          onClick={handleSubmit}
          disabled={!isStreaming && !inputDraft.trim()}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-md active:scale-95 ${
            isStreaming
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
              : inputDraft.trim()
              ? `${theme.primaryBg} ${theme.primaryHover} text-white`
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
          }`}
          title={isStreaming ? '停止生成' : '发送消息 (Enter 发送, Shift+Enter 换行)'}
        >
          {isStreaming ? <Square size={16} fill="currentColor" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};
