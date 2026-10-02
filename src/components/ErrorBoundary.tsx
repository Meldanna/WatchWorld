import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** 出错时展示的标题，用于区分是哪一块界面挂了 */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 渲染期异常兜底。没有它时，任意子组件抛错都会让 React 卸载整棵树 → 整页白屏。
 * 包在 Modal 区域外层后，单个弹窗崩掉只会让该区域降级，主界面仍然可用。
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` ${this.props.label}` : ''}] 渲染异常:`, error);
    console.error('[ErrorBoundary] 组件栈:', info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      >
        <div
          className="w-full max-w-lg rounded-2xl border shadow-2xl p-5 space-y-3"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border-default)',
          }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {this.props.label ? `${this.props.label} 渲染出错` : '界面渲染出错'}
          </h2>
          <pre
            className="text-[11px] whitespace-pre-wrap break-all max-h-40 overflow-y-auto rounded-xl p-3 font-mono"
            style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-secondary)' }}
          >
            {error.message}
          </pre>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
            >
              关闭并重试
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    );
  }
}
