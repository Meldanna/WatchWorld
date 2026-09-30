import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { Agent, AiContextVisibilityFilter } from '../types';
import { ThemeConfig } from '../lib/theme';

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

  return (
    <div className="w-full bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800/90 backdrop-blur-lg px-3 py-2.5 pb-safe transition-colors">
      {/* Quick Toolbar */}
      <div className="flex items-center justify-between mb-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Agent Switch Button */}
          <button
            onClick={onOpenAgentModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 active:scale-95 transition-all shrink-0"
            title="切换当前智能助手/角色"
          >
            <span>{activeAgent.avatar}</span>
            <span className="max-w-[70px] sm:max-w-[110px] truncate font-medium">
              {activeAgent.name}
            </span>
          </button>

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
            title="Agent Skill 专属能力系统"
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
            title="管理或连接本地知识库"
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
            <span className="font-medium">提示词</span>
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
          placeholder={`对 ${activeAgent.name} 说点什么... (支持 MCP 与 Skill 智能联动)`}
          rows={1}
          className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-[15px] px-3 py-2 max-h-[130px] resize-none focus:outline-none leading-relaxed"
        />

        <button
          onClick={handleSubmit}
          disabled={!isStreaming && !inputDraft.trim()}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 ${
            isStreaming
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : inputDraft.trim()
              ? `${theme.primaryBg} ${theme.primaryHover} text-white shadow-md`
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
          }`}
          title={isStreaming ? '停止生成' : '发送消息'}
        >
          {isStreaming ? (
            <Square size={16} className="fill-current" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
};
