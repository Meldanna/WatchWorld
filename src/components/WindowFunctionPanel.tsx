import React from 'react';
import {
  Layers,
  Search,
  GitBranch,
  FileText,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Sparkles,
} from 'lucide-react';

interface WindowFunctionPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenDualBoxPrompt?: () => void;
  onOpenSearch?: () => void;
  onOpenTimeline?: () => void;
  onOpenDocument?: () => void;
  onTriggerRoleAnalysis?: () => void;
  onOpenWindowApiParams?: () => void;
  onOpenSessionText?: () => void;
  onOpenSummary?: () => void;
}

export const WindowFunctionPanel: React.FC<WindowFunctionPanelProps> = ({
  isOpen,
  onToggle,
  onOpenDualBoxPrompt,
  onOpenSearch,
  onOpenTimeline,
  onOpenDocument,
  onTriggerRoleAnalysis,
  onOpenWindowApiParams,
  onOpenSessionText,
  onOpenSummary,
}) => {
  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium shrink-0"
        style={{
          backgroundColor: isOpen ? 'var(--accent-primary)' : 'var(--surface-2)',
          color: isOpen ? 'white' : 'var(--text-secondary)',
        }}
        title="窗口功能"
        aria-label="窗口功能"
      >
        <Settings size={12} />
        <span>窗口功能</span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl p-3 backdrop-blur-xl z-50"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {onOpenSummary && (
              <button
                type="button"
                onClick={() => {
                  onOpenSummary();
                  onToggle();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  前文总结
                </span>
              </button>
            )}

            {onOpenDualBoxPrompt && (
              <button
                type="button"
                onClick={() => {
                  onOpenDualBoxPrompt();
                  onToggle();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                <Layers size={20} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  双框提示词
                </span>
              </button>
            )}

            {onOpenSearch && (
              <button
                type="button"
                onClick={() => {
                  onOpenSearch();
                  onToggle();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                <Search size={20} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  全文搜索
                </span>
              </button>
            )}

            {onOpenTimeline && (
              <button
                type="button"
                onClick={() => {
                  onOpenTimeline();
                  onToggle();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                <GitBranch size={20} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  时间线管理
                </span>
              </button>
            )}

            {onOpenDocument && (
              <button
                type="button"
                onClick={() => {
                  onOpenDocument();
                  onToggle();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  世界观文档
                </span>
              </button>
            )}

            {onTriggerRoleAnalysis && (
              <button
                type="button"
                onClick={() => {
                  onTriggerRoleAnalysis();
                  onToggle();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                <BarChart2 size={20} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  角色心理分析
                </span>
              </button>
            )}

            {onOpenWindowApiParams && (
              <button
                type="button"
                onClick={() => {
                  onOpenWindowApiParams();
                  onToggle();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  窗口API参数
                </span>
              </button>
            )}

            {onOpenSessionText && (
              <button
                type="button"
                onClick={() => {
                  onOpenSessionText();
                  onToggle();
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--surface-2)',
                }}
              >
                <ClipboardPaste size={20} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  文本导入导出
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
