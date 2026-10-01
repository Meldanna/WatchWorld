import React, { useState } from 'react';
import {
  Menu,
  MoreVertical,
  Plus,
  Settings,
  Folder,
  Edit2,
  Trash2,
  RotateCcw,
  Bot,
  Eye,
  BookOpen,
  Palette,
  Layers,
  Code2,
  Sun,
  Moon,
  Server,
  Zap,
  Sliders,
  GitBranch,
  Search,
  Users,
  FileText,
} from 'lucide-react';
import { ChatSession, ChatGroup, Agent, ApiProviderConfig, UiMode } from '../types';
import { ThemeConfig } from '../lib/theme';

interface HeaderProps {
  currentSession: ChatSession;
  currentGroup?: ChatGroup;
  currentAgent?: Agent;
  activeProvider: ApiProviderConfig;
  theme: ThemeConfig;
  uiMode: UiMode;
  onToggleUiMode: () => void;
  onOpenSidebar: () => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
  onOpenDisplaySettingsModal: () => void;
  onOpenTimelineModal: () => void;
  onOpenAgentModal: () => void;
  onOpenVisibilityModal: () => void;
  onOpenKnowledgeModal: () => void;
  onOpenRegexModal: () => void;
  onOpenThemeModal: () => void;
  onOpenMcpModal: () => void;
  onOpenSkillModal: () => void;
  onOpenSearchModal?: () => void;
  onOpenDocumentModal?: () => void;
  onOpenDualBoxPromptModal?: () => void;
  onTriggerRoleAnalysis?: () => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onClearSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onMoveSessionGroup: (sessionId: string, targetGroupId: string) => void;
  groups: ChatGroup[];
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  currentGroup,
  currentAgent,
  activeProvider,
  theme,
  uiMode,
  onToggleUiMode,
  onOpenSidebar,
  onNewSession,
  onOpenSettings,
  onOpenDisplaySettingsModal,
  onOpenTimelineModal,
  onOpenAgentModal,
  onOpenVisibilityModal,
  onOpenKnowledgeModal,
  onOpenRegexModal,
  onOpenThemeModal,
  onOpenMcpModal,
  onOpenSkillModal,
  onOpenSearchModal,
  onOpenDocumentModal,
  onOpenDualBoxPromptModal,
  onTriggerRoleAnalysis,
  onRenameSession,
  onClearSession,
  onDeleteSession,
  onMoveSessionGroup,
  groups,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(currentSession.title);

  const handleStartRename = () => {
    setRenameValue(currentSession.title);
    setIsRenaming(true);
    setShowMenu(false);
  };

  const handleFinishRename = () => {
    if (renameValue.trim()) {
      onRenameSession(currentSession.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const sessionTimelines = currentSession.timelines || [];
  const activeTimeline = sessionTimelines.find((t) => t.id === currentSession.activeTimelineId) || sessionTimelines[0];
  const activeTimelineTag = activeTimeline?.tag || '主线';

  return (
    <header className="w-full bg-white/95 dark:bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)] backdrop-blur-xl px-4 py-3 flex items-center justify-between z-20 shrink-0 sticky top-0">
      {/* Left: Hamburger Drawer button & Group/Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onOpenSidebar}
          className="w-10 h-10 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm"
          title="打开窗口与分组侧边栏"
        >
          <Menu size={19} />
        </button>

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          {isRenaming ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename();
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                autoFocus
                className="bg-white dark:bg-[var(--surface-2)] text-[var(--text-primary)] text-sm px-3 py-1.5 rounded-xl border border-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                onClick={handleStartRename}
                className="text-sm font-semibold text-[var(--text-primary)] truncate cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                title="点击重命名窗口"
              >
                {currentSession.title || '新对话'}
              </span>
            </div>
          )}

          {/* Group and Agent info line */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
            {currentGroup && (
              <span
                className="flex items-center gap-1.5 text-xs truncate max-w-[100px]"
                style={{ color: currentGroup.color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: currentGroup.color }}
                />
                {currentGroup.name}
              </span>
            )}
            <span className="text-[var(--border-default)]">·</span>
            <button
              onClick={onOpenAgentModal}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] truncate max-w-[120px] transition-colors"
            >
              {currentAgent?.name}
            </button>
            {currentSession.uiRenderLimit > 0 && (
              <>
                <span className="text-[var(--border-default)]">·</span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                  显{currentSession.uiRenderLimit}条
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {/* Search in Current Window Button */}
        {onOpenSearchModal && (
          <button
            onClick={onOpenSearchModal}
            className="w-9 h-9 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center active:scale-95 transition-all"
            title="窗口内全文搜索（带楼号与标签直达）"
          >
            <Search size={16} />
          </button>
        )}

        {/* World Documents Button */}
        {onOpenDocumentModal && (
          <button
            onClick={onOpenDocumentModal}
            className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center active:scale-95 transition-all"
            title="世界观文档库（设定、人物卡、时间线梳理）"
          >
            <BookOpen size={16} />
          </button>
        )}

        {/* Dual-Box Prompt Area Button */}
        {onOpenDualBoxPromptModal && (
          <button
            onClick={onOpenDualBoxPromptModal}
            className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center active:scale-95 transition-all"
            title="双框提示词区域与推入通用（API缓存优化）"
          >
            <Layers size={16} />
          </button>
        )}

        {/* Timeline Branch Quick Button */}
        <button
          onClick={onOpenTimelineModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            currentSession.timelineMemoryEnabled
              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
          }`}
          title={`时间线记忆树: ${activeTimeline ? activeTimeline.name : '通用世界观'}`}
        >
          <GitBranch size={14} />
          <span className="max-w-[80px] truncate">{activeTimelineTag}</span>
        </button>

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={onToggleUiMode}
          className="w-9 h-9 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center active:scale-95 transition-all"
          title={uiMode === 'dark' ? '切换为白底清新模式' : '切换为夜间深色模式'}
        >
          {uiMode === 'dark' ? (
            <Sun size={17} className="text-amber-400" />
          ) : (
            <Moon size={17} className="text-indigo-600" />
          )}
        </button>

        {/* Quick New Session Button */}
        <button
          onClick={onNewSession}
          className={`w-9 h-9 rounded-xl ${theme.primaryBg} ${theme.primaryHover} text-white flex items-center justify-center active:scale-95 transition-all shadow-sm`}
          title="新建窗口会话"
        >
          <Plus size={18} />
        </button>

        {/* API Provider Status Indicator */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-xs text-[var(--text-secondary)]"
          title="配置 API 密钥与端点"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="max-w-[80px] truncate hidden sm:inline">{activeProvider.name}</span>
          <Settings size={14} className="text-[var(--text-tertiary)]" />
        </button>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-all active:scale-95"
          >
            <MoreVertical size={17} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-11 z-40 w-56 bg-white dark:bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-xl py-2 text-sm text-[var(--text-primary)] divide-y divide-[var(--border-subtle)] animate-in fade-in zoom-in-95 duration-100">
                <div className="py-1 px-1">
                  <button
                    onClick={handleStartRename}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Edit2 size={14} className="text-slate-400" />
                    <span>重命名窗口</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenTimelineModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center justify-between rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <GitBranch size={14} className="text-indigo-500" />
                      <span>记忆整理 · 时间线树</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {currentSession.timelineMemoryEnabled ? '已开启' : '已关闭'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenDisplaySettingsModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Sliders size={14} className="text-cyan-500" />
                    <span>消息显示设置</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenMcpModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Server size={14} className="text-emerald-500" />
                    <span>MCP 协议服务</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenSkillModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Zap size={14} className="text-amber-500" />
                    <span>Agent Skill 技能</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenKnowledgeModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <BookOpen size={14} className="text-blue-500" />
                    <span>本地知识库</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenRegexModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Code2 size={14} className="text-purple-500" />
                    <span>正则表达式清洗</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenVisibilityModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Eye size={14} className="text-amber-500" />
                    <span>AI 视野 & 渲染限制</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenThemeModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Palette size={14} className="text-rose-500" />
                    <span>调色盘 & 配色</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenAgentModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Bot size={14} className="text-indigo-500" />
                    <span>切换或定制 Agent</span>
                  </button>
                </div>

                {/* Move to group */}
                <div className="py-1 px-1">
                  <div className="px-3 py-2 text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">
                    移动到分组
                  </div>
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        onMoveSessionGroup(currentSession.id, g.id);
                        setShowMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 flex items-center gap-2.5 rounded-xl transition-colors ${
                        currentSession.groupId === g.id ? `${theme.primaryText} font-semibold` : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: g.color }}
                      />
                      <span className="truncate">{g.name}</span>
                    </button>
                  ))}
                </div>

                <div className="py-1 px-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm('确认清空当前对话中的所有消息？')) {
                        onClearSession(currentSession.id);
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-amber-50/80 dark:hover:bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <RotateCcw size={14} />
                    <span>清空本窗口消息</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm('确认删除此会话窗口？')) {
                        onDeleteSession(currentSession.id);
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-rose-50/80 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-500 flex items-center gap-2.5 rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>删除此窗口</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
