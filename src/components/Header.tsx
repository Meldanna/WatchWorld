import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { ChatSession, UiMode } from '../types';

interface HeaderProps {
  currentSession: ChatSession;
  uiMode: UiMode;
  onToggleUiMode: () => void;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  uiMode,
  onToggleUiMode,
  onOpenSidebar,
}) => {
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

        {/* Right: Theme Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleUiMode}
            className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all active:scale-95"
            title={uiMode === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
            aria-label="切换主题"
          >
            {uiMode === 'light' ? (
              <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <Sun size={18} style={{ color: 'var(--text-secondary)' }} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
