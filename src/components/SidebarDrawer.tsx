import React, { useState } from 'react';
import {
  ChatSession,
  ChatGroup,
  Agent,
  ApiProviderConfig,
  UiMode,
} from '../types';
import { ThemeConfig } from '../lib/theme';
import {
  Plus,
  Search,
  Folder,
  FolderPlus,
  Settings,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Trash2,
  X,
  Palette,
  BookOpen,
  Code2,
  Server,
  Zap,
  Sun,
  Moon,
  Sliders,
  GitBranch,
} from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  groups: ChatGroup[];
  agents: Agent[];
  theme: ThemeConfig;
  uiMode: UiMode;
  onToggleUiMode: () => void;
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: (groupId?: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenGroupModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenDisplaySettingsModal: () => void;
  onOpenTimelineModal: () => void;
  onOpenAgentModal: () => void;
  onOpenPromptModal: () => void;
  onOpenKnowledgeModal: () => void;
  onOpenRegexModal: () => void;
  onOpenThemeModal: () => void;
  onOpenMcpModal: () => void;
  onOpenSkillModal: () => void;
  onExportData: () => void;
  onImportData: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  groups,
  agents,
  theme,
  uiMode,
  onToggleUiMode,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenGroupModal,
  onOpenSettingsModal,
  onOpenDisplaySettingsModal,
  onOpenTimelineModal,
  onOpenAgentModal,
  onOpenPromptModal,
  onOpenKnowledgeModal,
  onOpenRegexModal,
  onOpenThemeModal,
  onOpenMcpModal,
  onOpenSkillModal,
  onExportData,
  onImportData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const agentMap = React.useMemo(() => {
    return new Map(agents.map((a) => [a.id, a]));
  }, [agents]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.messages.some((m) =>
        m.role === 'user'
          ? m.content.toLowerCase().includes(q)
          : m.versions.some((v) => v.content.toLowerCase().includes(q))
      )
    );
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[84%] max-w-[320px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-transform duration-300 ease-in-out text-slate-800 dark:text-slate-100 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ backgroundColor: theme.primaryHex }}
            >
              💬
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">观界</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">多API移动工作台</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleUiMode}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              title={uiMode === 'dark' ? '切到白底模式' : '切到暗色模式'}
            >
              {uiMode === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Buttons: New Session & New Group */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className={`flex-1 py-2 px-3 rounded-xl ${theme.primaryBg} ${theme.primaryHover} text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all`}
          >
            <Plus size={15} />
            <span>新建窗口</span>
          </button>

          <button
            onClick={() => {
              onOpenGroupModal();
              onClose();
            }}
            className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1 border border-slate-300 dark:border-slate-700/60 active:scale-95 transition-all"
            title="分组管理"
          >
            <FolderPlus size={15} />
            <span className="hidden sm:inline">分组</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pt-2.5 pb-1.5">
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 focus-within:border-slate-400 dark:focus-within:border-slate-600">
            <Search size={14} className="text-slate-400 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索窗口或消息..."
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Group & Session List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {groups.map((group) => {
            const groupSessions = filteredSessions.filter((s) => s.groupId === group.id);
            const isCollapsed = Boolean(collapsedGroups[group.id]);

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header */}
                <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500 dark:text-slate-400 select-none group">
                  <div
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 flex-1 min-w-0"
                  >
                    {isCollapsed ? (
                      <ChevronRight size={13} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={13} className="text-slate-400" />
                    )}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {group.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      ({groupSessions.length})
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onNewSession(group.id);
                      onClose();
                    }}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white opacity-60 hover:opacity-100"
                    title={`在「${group.name}」中新建窗口`}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Session Items inside this group */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pl-2">
                    {groupSessions.length === 0 ? (
                      <div className="text-[11px] text-slate-400 px-3 py-1 italic">
                        无会话
                      </div>
                    ) : (
                      groupSessions.map((session) => {
                        const isActive = session.id === activeSessionId;
                        const sessionAgent = agentMap.get(session.agentId);

                        return (
                          <div
                            key={session.id}
                            onClick={() => {
                              onSelectSession(session.id);
                              onClose();
                            }}
                            className={`group/session flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                              isActive
                                ? `bg-slate-100 dark:bg-slate-800/90 ${theme.primaryText} font-medium border border-slate-300 dark:border-slate-700/80 shadow-sm`
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                              <span className="text-sm shrink-0">
                                {sessionAgent?.avatar || '💬'}
                              </span>
                              <span className="truncate">
                                {session.title || '未命名对话'}
                              </span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`确认删除会话「${session.title}」？`)) {
                                  onDeleteSession(session.id);
                                }
                              }}
                              className="opacity-0 group-hover/session:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-400 hover:text-rose-500 transition-opacity"
                              title="删除"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Feature Navigation Menu */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
          <div className="grid grid-cols-5 gap-1 py-1.5 text-center">
            <button
              onClick={() => {
                onOpenMcpModal();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-0.5"
              title="MCP 协议服务"
            >
              <Server size={14} className="text-emerald-500" />
              <span className="text-[10px]">MCP</span>
            </button>

            <button
              onClick={() => {
                onOpenSkillModal();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-0.5"
              title="Agent 技能系统"
            >
              <Zap size={14} className="text-amber-500" />
              <span className="text-[10px]">Skill</span>
            </button>

            <button
              onClick={() => {
                onOpenKnowledgeModal();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-0.5"
              title="本地知识库"
            >
              <BookOpen size={14} className="text-blue-500" />
              <span className="text-[10px]">知识库</span>
            </button>

            <button
              onClick={() => {
                onOpenRegexModal();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-0.5"
              title="正则规则"
            >
              <Code2 size={14} className="text-purple-500" />
              <span className="text-[10px]">正则</span>
            </button>

            <button
              onClick={() => {
                onOpenDisplaySettingsModal();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-0.5"
              title="设置显示项（模型/时间/耗时/Token等）"
            >
              <Sliders size={14} className="text-cyan-500" />
              <span className="text-[10px]">显示设置</span>
            </button>

            <button
              onClick={() => {
                onOpenSettingsModal();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-0.5"
              title="API设置"
            >
              <Settings size={14} className="text-rose-500" />
              <span className="text-[10px]">API</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between px-2 text-[11px] text-slate-500 dark:text-slate-400">
            <button
              onClick={() => {
                onOpenTimelineModal();
                onClose();
              }}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1"
            >
              <GitBranch size={11} />
              <span>时间线树</span>
            </button>
            <span>·</span>
            <button
              onClick={() => {
                onOpenDisplaySettingsModal();
                onClose();
              }}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-cyan-600 dark:text-cyan-400 font-medium"
            >
              消息设置
            </button>
            <span>·</span>
            <button
              onClick={onExportData}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              备份
            </button>
            <span>·</span>
            <button
              onClick={() => {
                onOpenPromptModal();
                onClose();
              }}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              提示词
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
