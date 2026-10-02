import React, { useState } from 'react';
import { PromptPreset } from '../types';
import {
  Sparkles,
  Plus,
  Search,
  Check,
  Edit2,
  Trash2,
  ArrowUpRight,
  Sliders,
  X,
} from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: PromptPreset[];
  activeSystemPrompt?: string;
  onInsertToInput: (content: string) => void;
  onApplyAsSystemPrompt: (content: string, title: string) => void;
  onSavePrompt: (prompt: PromptPreset) => void;
  onDeletePrompt: (promptId: string) => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  prompts,
  activeSystemPrompt,
  onInsertToInput,
  onApplyAsSystemPrompt,
  onSavePrompt,
  onDeletePrompt,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptPreset | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PromptPreset['category']>('productivity');
  const [tagsStr, setTagsStr] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'productivity', label: '效率分析' },
    { id: 'coding', label: '编程开发' },
    { id: 'writing', label: '写作润色' },
    { id: 'reasoning', label: '深度思考' },
    { id: 'custom', label: '自定义' },
  ];

  const startCreate = () => {
    setIsCreating(true);
    setEditingPrompt(null);
    setTitle('');
    setDescription('');
    setContent('');
    setCategory('custom');
    setTagsStr('自建');
  };

  const startEdit = (p: PromptPreset) => {
    setEditingPrompt(p);
    setIsCreating(false);
    setTitle(p.title);
    setDescription(p.description || '');
    setContent(p.content);
    setCategory(p.category);
    setTagsStr((p.tags || []).join(', '));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const parsedTags = tagsStr
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const promptToSave: PromptPreset = {
      id: editingPrompt?.id || `prompt-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
      category,
      tags: parsedTags.length > 0 ? parsedTags : ['自建'],
    };

    onSavePrompt(promptToSave);
    setIsCreating(false);
    setEditingPrompt(null);
  };

  const filteredPrompts = prompts.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                提示词库与快捷切换
              </h2>
              <p className="text-[11px] text-slate-400">
                可填入输入框，或直接设为当前会话窗口的主控提示词
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {isCreating || editingPrompt ? (
          /* Create / Edit Form */
          <form
            onSubmit={handleSaveForm}
            className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-slate-300"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-emerald-400">
                {isCreating ? '新建自定义提示词' : `编辑提示词: ${editingPrompt?.title}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingPrompt(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                返回列表
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                提示词标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：论文结构润色、深度反问..."
                required
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                简要说明
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述该提示词的主要效果..."
                className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                分类
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
              >
                <option value="productivity">效率分析</option>
                <option value="coding">编程开发</option>
                <option value="writing">写作润色</option>
                <option value="reasoning">深度思考</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                提示词具体内容 *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在此编写详细的指令模版..."
                rows={6}
                required
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 resize-y font-mono text-[12px] leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingPrompt(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                保存提示词
              </button>
            </div>
          </form>
        ) : (
          /* List View */
          <div className="flex-1 flex flex-col min-h-0 pt-3">
            {/* Search & Category Tabs */}
            <div className="space-y-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-slate-950 rounded-xl px-2.5 py-1.5 border border-slate-800 focus-within:border-slate-600">
                  <Search size={14} className="text-slate-500 mr-2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索提示词名称、内容或标签..."
                    className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
                      <X size={13} />
                    </button>
                  )}
                </div>

                <button
                  onClick={startCreate}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} />
                  <span>新建</span>
                </button>
              </div>

              {/* Category Segmented Filter */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === c.id
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredPrompts.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  没有找到匹配的提示词
                </div>
              ) : (
                filteredPrompts.map((p) => {
                  const isCurrentSystemPrompt = activeSystemPrompt === p.content;

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-100">
                              {p.title}
                            </span>
                            {(p.tags ?? []).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] text-slate-400 font-mono"
                              >
                                · {t}
                              </span>
                            ))}
                          </div>
                          {p.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {p.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="编辑"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确认删除提示词「${p.title}」？`)) {
                                onDeletePrompt(p.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                            title="删除"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="bg-slate-900/90 rounded-lg p-2 text-[11px] font-mono text-slate-300 line-clamp-2 border border-slate-800/60 select-all">
                        {p.content}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/40 text-xs">
                        <button
                          onClick={() => {
                            onApplyAsSystemPrompt(p.content, p.title);
                            onClose();
                          }}
                          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 text-[11px] font-medium transition-colors ${
                            isCurrentSystemPrompt
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-emerald-400'
                          }`}
                          title="将此提示词设定为当前窗口的核心系统指令"
                        >
                          {isCurrentSystemPrompt ? <Check size={12} /> : <Sliders size={12} />}
                          <span>{isCurrentSystemPrompt ? '当前窗口生效中' : '设为窗口提示词'}</span>
                        </button>

                        <button
                          onClick={() => {
                            onInsertToInput(p.content);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 text-[11px] font-medium transition-colors shadow-sm"
                          title="将此模版填入输入框直接发送或编辑"
                        >
                          <ArrowUpRight size={12} />
                          <span>填入输入框</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
