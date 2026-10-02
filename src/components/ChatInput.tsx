import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Square,
  GitBranch,
  ArrowLeftRight,
  Bot,
  Sparkles,
  Eye,
  Check,
  ChevronDown,
  Layers,
  BarChart2,
  Cpu,
  X,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import { Agent, AiContextVisibilityFilter, TimelineBranch } from '../types';
import { getTimelineColorConfig } from '../lib/timelineMemory';
import { WindowFunctionPanel } from './WindowFunctionPanel';
import { saveImageFile, StoredImage } from '../lib/imageStore';

interface ChatInputProps {
  onSendMessage: (content: string, imageIds?: string[]) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  activeAgent: Agent;
  aiContextVisibility: AiContextVisibilityFilter;
  onOpenPromptModal: () => void;
  onOpenAgentModal: () => void;
  onOpenVisibilityModal: () => void;
  onOpenDualBoxPromptModal?: () => void;
  onTriggerRoleAnalysis?: () => void;
  onOpenSearchModal?: () => void;
  onOpenTimelineModal?: () => void;
  onOpenDocumentModal?: () => void;
  onOpenWindowApiParams?: () => void;
  onOpenSessionText?: () => void;
  onOpenSummary?: () => void;
  /** 当前 Provider 的可用模型列表，供输入框内的模型切换下拉使用 */
  models?: string[];
  /** 本窗口当前生效的模型名 */
  activeModel?: string;
  onSelectModel?: (model: string) => void;
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
  onOpenPromptModal,
  onOpenAgentModal,
  onOpenVisibilityModal,
  onOpenDualBoxPromptModal,
  onTriggerRoleAnalysis,
  onOpenSearchModal,
  onOpenTimelineModal,
  onOpenDocumentModal,
  onOpenWindowApiParams,
  onOpenSessionText,
  onOpenSummary,
  models = [],
  activeModel = '',
  onSelectModel,
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<StoredImage[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  // 图片入队：先压缩再写入 IndexedDB，这里只保留引用
  const addImageFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    setIsUploadingImage(true);
    try {
      for (const file of images) {
        const stored = await saveImageFile(file);
        setPendingImages((prev) => [...prev, stored]);
      }
    } catch (err) {
      console.error('图片处理失败:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    void addImageFiles(files);
  };

  // 支持直接粘贴截图
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData?.files || []).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      e.preventDefault();
      void addImageFiles(files);
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      onStopGeneration();
      return;
    }
    const trimmed = inputDraft.trim();
    // 允许只发图片、不带文字
    if (!trimmed && pendingImages.length === 0) return;
    onSendMessage(trimmed, pendingImages.map((i) => i.id));
    setInputDraft('');
    setPendingImages([]);
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
      className="w-full border-t backdrop-blur-xl px-4 sm:px-6 py-3 space-y-0"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Timeline Branch Tag Selection Bar */}
      {timelines.length > 0 && onSelectTimeline && (
        <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* Agent Selection Bar */}
      <div className="flex items-center gap-2 flex-wrap">
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

        {/* 收纳按钮：与顾问同行的紧凑 pill */}
        <WindowFunctionPanel
          isOpen={isPanelOpen}
          onToggle={() => setIsPanelOpen(!isPanelOpen)}
          onOpenDualBoxPrompt={onOpenDualBoxPromptModal}
          onOpenSearch={onOpenSearchModal}
          onOpenTimeline={onOpenTimelineModal}
          onOpenDocument={onOpenDocumentModal}
          onTriggerRoleAnalysis={onTriggerRoleAnalysis}
          onOpenWindowApiParams={onOpenWindowApiParams}
          onOpenSessionText={onOpenSessionText}
          onOpenSummary={onOpenSummary}
        />

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

        <button
          onClick={onOpenPromptModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-secondary)',
          }}
          title="系统提示词"
          aria-label="系统提示词"
        >
          <Sparkles size={12} />
          <span className="hidden sm:inline">系统提示词</span>
        </button>
      </div>

      {/* Input Box with Quick Model Switch */}
      <div className="space-y-2">
        <div
          className="rounded-2xl border p-3 shadow-sm transition-all focus-within:shadow-md"
          style={{
            backgroundColor: 'var(--surface-0)',
            borderColor: 'var(--border-default)',
          }}
        >
          {/* 待发送图片预览 */}
          {pendingImages.length > 0 && (
            <div
              className="flex flex-wrap gap-2 mb-2.5 pb-2.5 border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              {pendingImages.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.dataUrl}
                    alt={img.name || '待发送图片'}
                    className="w-16 h-16 object-cover rounded-lg border"
                    style={{ borderColor: 'var(--border-default)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setPendingImages((prev) => prev.filter((p) => p.id !== img.id))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                    title="移除这张图片"
                    aria-label="移除图片"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {isUploadingImage && (
                <div
                  className="w-16 h-16 rounded-lg border flex items-center justify-center"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <Loader2
                    size={16}
                    className="animate-spin"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* 图片入口：点选或直接粘贴 */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImagePick}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isStreaming || isUploadingImage}
              className="p-2 rounded-lg transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              title="添加图片（也可直接粘贴）"
              aria-label="添加图片"
            >
              <ImagePlus size={16} />
            </button>

          <textarea
            ref={textareaRef}
            value={inputDraft}
            onChange={(e) => setInputDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isStreaming ? 'AI 正在推演中...' : '围绕世界观讨论人物与事件...'}
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent px-1 py-1 text-sm resize-none leading-relaxed focus:outline-none disabled:opacity-50"
            style={{
              color: 'var(--text-primary)',
            }}
            aria-label="消息输入框"
          />

          {/* 模型切换：紧凑按钮 + 下拉，职责仅为切换模型 */}
          {models.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsModelMenuOpen((v) => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-medium max-w-[150px]"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text-secondary)',
                }}
                title={`当前模型：${activeModel}`}
                aria-label="切换模型"
              >
                <Cpu size={12} style={{ color: 'var(--accent-primary)' }} />
                <span className="truncate">{activeModel || '选择模型'}</span>
                <ChevronDown size={12} className="shrink-0" />
              </button>

              {isModelMenuOpen && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-60 max-h-64 overflow-y-auto rounded-xl border shadow-2xl backdrop-blur-xl z-50 py-1"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  {models.map((m) => {
                    const isCurrentModel = m === activeModel;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          onSelectModel?.(m);
                          setIsModelMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        style={{
                          color: isCurrentModel ? 'var(--accent-primary)' : 'var(--text-primary)',
                        }}
                      >
                        <Check
                          size={12}
                          className="shrink-0"
                          style={{ opacity: isCurrentModel ? 1 : 0 }}
                        />
                        <span className="truncate">{m}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isStreaming && !inputDraft.trim() && pendingImages.length === 0}
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
        </div>
      </div>

    </div>
  );
};
