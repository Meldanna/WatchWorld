import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Settings,
  Search,
  GitBranch,
  FileText,
  MoreVertical,
} from 'lucide-react';
import { ChatSession, UiMode } from '../types';

interface HeaderProps {
  currentSession: ChatSession;
  uiMode: UiMode;
  onToggleUiMode: () => void;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onOpenTimelineModal: () => void;
  onOpenDocumentModal?: () => void;
  onOpenSearchModal?: () => void;
  onTriggerRoleAnalysis?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  uiMode,
  onToggleUiMode,
  onOpenSidebar,
  onOpenSettings,
  onOpenTimelineModal,
  onOpenDocumentModal,
  onOpenSearchModal,
  onTriggerRoleAnalysis,
}) => {
  const [showQuickMenu, setShowQuickMenu] = React.useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
        {/* Left: Menu + Session Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all active:scale-95"
            title="打开侧边栏"
            aria-label="打开侧边栏"
          >
            <Menu size={20} style={{ color: 'var(--text-primary)' }} />
          </button>

          <div className="flex-1 min-w-0">
            <h1
              className="text-base font-semibold truncate tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentSession.title}
            </h1>
          </div>
        </div>

        {/* Right: Compact Action Bar */}
        <div className="flex items-center gap-1">
          {/* Search */}
          {onOpenSearchModal && (
            <button
              onClick={onOpenSearchModal}
              className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all hidden sm:flex"
              title="搜索消息"
              aria-label="搜索消息"
            >
              <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}

          {/* Timeline Branch */}
          <button
            onClick={onOpenTimelineModal}
            className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all"
            title="时间线分支"
            aria-label="查看时间线分支"
          >
            <GitBranch size={18} style={{ color: 'var(--accent-primary)' }} />
          </button>

          {/* Document Library */}
          {onOpenDocumentModal && (
            <button
              onClick={onOpenDocumentModal}
              className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all hidden sm:flex"
              title="文档库"
              aria-label="打开文档库"
            >
              <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleUiMode}
            className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all"
            title={uiMode === 'dark' ? '切换到白天模式' : '切换到夜晚模式'}
            aria-label={uiMode === 'dark' ? '切换到白天模式' : '切换到夜晚模式'}
          >
            {uiMode === 'dark' ? (
              <Sun size={18} style={{ color: '#FCD34D' }} />
            ) : (
              <Moon size={18} style={{ color: '#6366F1' }} />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all"
            title="系统设置"
            aria-label="打开系统设置"
          >
            <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {/* More Menu (Mobile) */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all"
              aria-label="更多操作"
            >
              <MoreVertical size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>

            {showQuickMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-xl border z-50 py-2 overflow-hidden"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  {onOpenSearchModal && (
                    <button
                      onClick={() => {
                        onOpenSearchModal();
                        setShowQuickMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100/80 dark:hover:bg-white/5 flex items-center gap-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Search size={16} style={{ color: 'var(--text-secondary)' }} />
                      <span>搜索消息</span>
                    </button>
                  )}
                  {onOpenDocumentModal && (
                    <button
                      onClick={() => {
                        onOpenDocumentModal();
                        setShowQuickMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100/80 dark:hover:bg-white/5 flex items-center gap-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
                      <span>文档库</span>
                    </button>
                  )}
                  {onTriggerRoleAnalysis && (
                    <button
                      onClick={() => {
                        onTriggerRoleAnalysis();
                        setShowQuickMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100/80 dark:hover:bg-white/5 flex items-center gap-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span style={{ fontSize: '16px' }}>📊</span>
                      <span>分析角色关系</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
