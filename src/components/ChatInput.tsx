import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Square,
  GitBranch,
  ArrowLeftRight,
  Bot,
  Sparkles,
  Eye,
  BookOpen,
  Code2,
  Server,
  Zap,
  Layers,
  BarChart2,
} from 'lucide-react';
import { Agent, AiContextVisibilityFilter, TimelineBranch } from '../types';
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
  onOpenPromptModal: () => void;
  onOpenAgentModal: () => void;
  onOpenVisibilityModal: () => void;
  onOpenKnowledgeModal: () => void;
  onOpenRegexModal: () => void;
  onOpenMcpModal: () => void;
  onOpenSkillModal: () => void;
  onOpenDualBoxPromptModal?: () => void;
  onTriggerRoleAnalysis?: () => void;
  inputDraft: string;
  setInputDraft: (val: string) => void;
  timelines?: TimelineBranch[];
  activeTimelineId?: string;
  onSelectTimeline?: (timelineId: string) => void;
  tagDisplayMode?: 'desc' | 'code';
  onToggleTagDisplayMode?: () => void;
  lastUserMessageTimelineId?: string;
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
  onOpenPromptModal,
  onOpenAgentModal,
  onOpenVisibilityModal,
  onOpenKnowledgeModal,
  onOpenRegexModal,
  onOpenMcpModal,
  onOpenSkillModal,
  onOpenDualBoxPromptModal,
  onTriggerRoleAnalysis,
  inputDraft,
  setInputDraft,
  timelines = [],
  activeTimelineId,
  onSelectTimeline,
  tagDisplayMode = 'desc',
  onToggleTagDisplayMode,
  lastUserMessageTimelineId,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 160)}px`;
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
        return '无记忆';
      case 'latest_1':
        return '最新1条';
      case 'latest_2':
        return '最新2条';
      case 'latest_3':
        return '最新3条';
      case 'latest_5':
        return '最新5条';
      default:
        return '全记忆';
    }
  };

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
    <div
      className="w-full border-t backdrop-blur-xl px-4 sm:px-6 py-4 space-y-3"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Timeline Branch Tag Selection Bar (窗口内功能) */}
      {timelines.length > 0 && onSelectTimeline && (
        <div className="flex items-center gap-2 pb-2">
          <button
            type="button"
            onClick={onToggleTagDisplayMode}
            className="text-xs px-3 py-1.5 rounded-full transition-all shrink-0 font-medium"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-secondary)',
            }}
            title="切换标签显示模式"
            aria-label="切换标签显示模式"
          >
            <ArrowLeftRight size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-primary)' }} />
            {tagDisplayMode === 'code' ? '字母' : '文字'}
          </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {orderedTimelines.map((branch) => {
              const isSelected = branch.id === (activeTimelineId || timelines[0]?.id);
              const colorConfig = getTimelineColorConfig(branch.color);
              const codeDisplay = branch.codeTag || branch.tag || '通用';
              const textDisplay = branch.descriptionTag || branch.name || codeDisplay;
              const displayText = tagDisplayMode === 'code' ? codeDisplay : `${codeDisplay}·${textDisplay}`;

              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => onSelectTimeline(branch.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected ? `${colorConfig.badge} shadow-md scale-105` : ''
                  }`}
                  style={
                    isSelected
                      ? {}
                      : {
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--text-secondary)',
                        }
                  }
                  title={`分支：${branch.name} (${codeDisplay})`}
                  aria-label={`切换到分支 ${branch.name}`}
                >
                  <GitBranch size={12} />
                  <span className="max-w-[150px] truncate">{displayText}</span>
                  {branch.visible === false && <span className="text-[9px] opacity-75">(隐)</span>}
                </button>
              );
            })}
          </div>

          {onTriggerRoleAnalysis && (
            <button
              type="button"
              onClick={onTriggerRoleAnalysis}
              className="text-xs px-3 py-1.5 rounded-full transition-all shrink-0 font-semibold flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
              }}
              title="启动角色心理动力学分析"
              aria-label="分析角色关系"
            >
              <BarChart2 size={12} />
              <span className="hidden sm:inline">分析角色</span>
            </button>
          )}
        </div>
      )}

      {/* Contextual Tools Bar (窗口内功能) */}
      <div className="flex items-center gap-2 flex-wrap pb-2">
        <button
          onClick={onOpenAgentModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-medium"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-primary)',
          }}
          title="切换顾问"
          aria-label="切换顾问"
        >
          <span className="text-sm">{activeAgent.avatar}</span>
          <span className="max-w-[100px] truncate">{activeAgent.name}</span>
        </button>

        {onOpenDualBoxPromptModal && (
          <button
            onClick={onOpenDualBoxPromptModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
            }}
            title="双框提示词"
            aria-label="打开双框提示词"
          >
            <Layers size={12} />
            <span className="hidden sm:inline">双框提示词</span>
          </button>
        )}

        <button
          onClick={onOpenVisibilityModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium`}
          style={{
            backgroundColor: aiContextVisibility !== 'all' ? 'rgba(251, 191, 36, 0.15)' : 'var(--surface-2)',
            color: aiContextVisibility !== 'all' ? '#D97706' : 'var(--text-secondary)',
          }}
          title="AI上下文记忆"
          aria-label="AI上下文记忆"
        >
          <Eye size={12} />
          <span>{getVisibilityBadgeText(aiContextVisibility)}</span>
        </button>
      </div>

      {/* Global Tools Bar (全局功能入口) */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={onOpenMcpModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium"
          style={{
            backgroundColor: activeMcpCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-2)',
            color: activeMcpCount > 0 ? '#059669' : 'var(--text-secondary)',
          }}
          title="MCP服务"
          aria-label="MCP服务"
        >
          <Server size={12} />
          <span>MCP{activeMcpCount > 0 ? ` (${activeMcpCount})` : ''}</span>
        </button>

        <button
          onClick={onOpenSkillModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium"
          style={{
            backgroundColor: connectedSkillCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--surface-2)',
            color: connectedSkillCount > 0 ? '#D97706' : 'var(--text-secondary)',
          }}
          title="Skill技能"
          aria-label="Skill技能"
        >
          <Zap size={12} />
          <span>Skill{connectedSkillCount > 0 ? ` (${connectedSkillCount})` : ''}</span>
        </button>

        <button
          onClick={onOpenKnowledgeModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium"
          style={{
            backgroundColor: connectedKnowledgeCount > 0 ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface-2)',
            color: connectedKnowledgeCount > 0 ? '#2563EB' : 'var(--text-secondary)',
          }}
          title="知识库"
          aria-label="知识库"
        >
          <BookOpen size={12} />
          <span>知识库{connectedKnowledgeCount > 0 ? ` (${connectedKnowledgeCount})` : ''}</span>
        </button>

        <button
          onClick={onOpenRegexModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium"
          style={{
            backgroundColor: activeRegexCount > 0 ? 'rgba(168, 85, 247, 0.15)' : 'var(--surface-2)',
            color: activeRegexCount > 0 ? '#9333EA' : 'var(--text-secondary)',
          }}
          title="正则规则"
          aria-label="正则规则"
        >
          <Code2 size={12} />
          <span>正则{activeRegexCount > 0 ? ` (${activeRegexCount})` : ''}</span>
        </button>

        <button
          onClick={onOpenPromptModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-secondary)',
          }}
          title="提示词预设"
          aria-label="提示词预设"
        >
          <Sparkles size={12} />
          <span>预设</span>
        </button>
      </div>

      {/* Input Box */}
      <div
        className="flex items-end gap-3 rounded-2xl border p-3 shadow-sm transition-all focus-within:shadow-md"
        style={{
          backgroundColor: 'var(--surface-0)',
          borderColor: 'var(--border-default)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={inputDraft}
          onChange={(e) => setInputDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'AI 正在推演中...' : '围绕世界观讨论人物与事件...'}
          disabled={isStreaming}
          rows={1}
          className="flex-1 bg-transparent px-1 py-1 text-sm resize-none leading-relaxed focus:outline-none disabled:opacity-50"
          style={{
            color: 'var(--text-primary)',
          }}
          aria-label="消息输入框"
        />

        <button
          onClick={handleSubmit}
          disabled={!inputDraft.trim() && !isStreaming}
          className="p-3 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{
            backgroundColor: isStreaming ? '#EF4444' : 'var(--accent-primary)',
            color: 'white',
          }}
          title={isStreaming ? '停止生成' : '发送消息'}
          aria-label={isStreaming ? '停止生成' : '发送消息'}
        >
          {isStreaming ? <Square size={18} fill="white" /> : <Send size={18} />}
        </button>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
        输入自动保存 · 支持 A12 切分支 · Enter 发送 · Shift+Enter 换行
      </p>
    </div>
  );
};
