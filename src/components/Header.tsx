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
    <header className="w-full bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-3 py-2.5 flex items-center justify-between z-20 shrink-0 sticky top-0 transition-colors">
      {/* Left: Hamburger Drawer button & Group/Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={onOpenSidebar}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 active:scale-95 transition-all border border-slate-300 dark:border-slate-700/50"
          title="打开窗口与分组侧边栏"
        >
          <Menu size={18} />
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
                className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm px-2 py-0.5 rounded border border-slate-400 dark:border-slate-600 focus:outline-none w-full"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                onClick={handleStartRename}
                className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:opacity-80 transition-colors"
                title="点击重命名窗口"
              >
                {currentSession.title || '新对话'}
              </span>
            </div>
          )}

          {/* Group and Agent info line */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {currentGroup && (
              <span
                className="flex items-center gap-1 text-[11px] truncate max-w-[90px]"
                style={{ color: currentGroup.color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: currentGroup.color }}
                />
                {currentGroup.name}
              </span>
            )}
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <button
              onClick={onOpenAgentModal}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 truncate max-w-[100px]"
            >
              {currentAgent?.name}
            </button>
            {currentSession.uiRenderLimit > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  显{currentSession.uiRenderLimit}条
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {/* Search in Current Window Button */}
        {onOpenSearchModal && (
          <button
            onClick={onOpenSearchModal}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-300 dark:border-slate-700/50 active:scale-95 transition-all"
            title="窗口内全文搜索（带楼号与标签直达）"
          >
            <Search size={15} />
          </button>
        )}

        {/* World Documents Button */}
        {onOpenDocumentModal && (
          <button
            onClick={onOpenDocumentModal}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-300 dark:border-slate-700/50 active:scale-95 transition-all"
            title="世界观文档库（设定、人物卡、时间线梳理）"
          >
            <BookOpen size={15} className="text-emerald-500" />
          </button>
        )}

        {/* Dual-Box Prompt Area Button */}
        {onOpenDualBoxPromptModal && (
          <button
            onClick={onOpenDualBoxPromptModal}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-300 dark:border-slate-700/50 active:scale-95 transition-all"
            title="双框提示词区域与推入通用（API缓存优化）"
          >
            <Layers size={15} className="text-indigo-500" />
          </button>
        )}

        {/* Timeline Branch Quick Button */}
        <button
          onClick={onOpenTimelineModal}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
            currentSession.timelineMemoryEnabled
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 border-slate-300 dark:border-slate-700/50'
          }`}
          title={`时间线记忆树: ${activeTimeline ? activeTimeline.name : '通用世界观'}`}
        >
          <GitBranch size={12} className={currentSession.timelineMemoryEnabled ? 'text-indigo-500' : 'text-slate-400'} />
          <span className="max-w-[70px] truncate">{activeTimelineTag}</span>
        </button>

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={onToggleUiMode}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-300 dark:border-slate-700/50 active:scale-95 transition-all"
          title={uiMode === 'dark' ? '切换为白底清新模式' : '切换为夜间深色模式'}
        >
          {uiMode === 'dark' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-indigo-600" />
          )}
        </button>

        {/* Quick New Session Button */}
        <button
          onClick={onNewSession}
          className={`w-8 h-8 rounded-lg ${theme.accentBadge} hover:opacity-90 flex items-center justify-center active:scale-95 transition-all`}
          title="新建窗口会话"
        >
          <Plus size={16} />
        </button>

        {/* API Provider Status Indicator */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/50"
          title="配置 API 密钥与端点"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="max-w-[70px] truncate hidden sm:inline">{activeProvider.name}</span>
          <Settings size={13} className="text-slate-400 ml-0.5" />
        </button>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-10 z-40 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 text-xs text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in zoom-in-95 duration-100">
                <div className="py-1">
                  <button
                    onClick={handleStartRename}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <Edit2 size={13} className="text-slate-400" />
                    <span>重命名窗口</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenTimelineModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch size={13} className="text-indigo-500" />
                      <span>记忆整理 · 时间线树</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {currentSession.timelineMemoryEnabled ? '已开启' : '已关闭'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenDisplaySettingsModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <Sliders size={13} className="text-cyan-500" />
                    <span>消息显示设置 (模型/时间/耗时/Token)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenMcpModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <Server size={13} className="text-emerald-500" />
                    <span>MCP 协议服务配置</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenSkillModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <Zap size={13} className="text-amber-500" />
                    <span>Agent Skill 技能系统</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenKnowledgeModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <BookOpen size={13} className="text-blue-500" />
                    <span>连接本地知识库</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenRegexModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <Code2 size={13} className="text-purple-500" />
                    <span>正则表达式清洗</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenVisibilityModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <Eye size={13} className="text-amber-500" />
                    <span>AI 视野 & 渲染条数</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenThemeModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <Palette size={13} className="text-rose-500" />
                    <span>调色盘 & 配色方案</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenAgentModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <Bot size={13} className="text-indigo-500" />
                    <span>切换或定制 Agent</span>
                  </button>
                </div>

                {/* Move to group */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">
                    移动到分组
                  </div>
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        onMoveSessionGroup(currentSession.id, g.id);
                        setShowMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 ${
                        currentSession.groupId === g.id ? `${theme.primaryText} font-medium` : 'text-slate-700 dark:text-slate-300'
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

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm('确认清空当前对话中的所有消息？')) {
                        onClearSession(currentSession.id);
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 text-amber-500 flex items-center gap-2"
                  >
                    <RotateCcw size={13} />
                    <span>清空本窗口消息</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm('确认删除此会话窗口？')) {
                        onDeleteSession(currentSession.id);
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 text-rose-500 flex items-center gap-2"
                  >
                    <Trash2 size={13} />
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
