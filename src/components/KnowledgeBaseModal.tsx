import React, { useState, useRef } from 'react';
import { KnowledgeItem } from '../types';
import { ThemeConfig } from '../lib/theme';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Search,
  CheckSquare,
  Square,
  UploadCloud,
  Layers,
} from 'lucide-react';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBase: KnowledgeItem[];
  connectedKnowledgeIds: string[];
  theme: ThemeConfig;
  onSaveKnowledgeItem: (item: KnowledgeItem) => void;
  onDeleteKnowledgeItem: (id: string) => void;
  onToggleConnectToSession: (id: string) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  knowledgeBase,
  connectedKnowledgeIds,
  theme,
  onSaveKnowledgeItem,
  onDeleteKnowledgeItem,
  onToggleConnectToSession,
}) => {
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const startCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
    setTitle('');
    setContent('');
    setTagsStr('文档');
  };

  // 批量导入本地文本文件，每个文件成为一条知识库资料
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const now = Date.now();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        if (!text.trim()) continue;
        const ext = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
        onSaveKnowledgeItem({
          id: `kb-file-${now}-${i}`,
          title: file.name.replace(/\.[^.]+$/, '') || file.name,
          content: text,
          tags: ['文档', ext].filter(Boolean),
          enabled: true,
          updatedAt: now + i,
        });
      } catch (err) {
        console.error(`读取文件失败: ${file.name}`, err);
      }
    }
  };

  const startEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setTitle(item.title);
    setContent(item.content);
    setTagsStr((item.tags ?? []).join(', '));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const parsedTags = tagsStr
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const itemToSave: KnowledgeItem = {
      id: editingItem?.id || `kb-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['文档'],
      enabled: true,
      updatedAt: Date.now(),
    };

    onSaveKnowledgeItem(itemToSave);
    setIsCreating(false);
    setEditingItem(null);
  };

  const filteredItems = knowledgeBase.filter((item) => {
    const q = search.toLowerCase();
    return (
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      (item.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${theme.accentBadge} flex items-center justify-center`}>
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>本地知识库与文档连接</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                勾选即可连接至当前会话，AI 自动在提问时参考该知识
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

        {/* Content Body */}
        {isCreating || editingItem ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-semibold ${theme.primaryText}`}>
                {isCreating ? '新建知识库词条/资料' : `编辑资料: ${editingItem?.title}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                返回列表
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                资料标题 / 主题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：公司考勤与报销规范、项目核心API说明..."
                required
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                分类标签 (逗号分隔)
              </label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="例如：公司制度, 财务, 研发"
                className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400">
                  知识库详细内容 *
                </label>
                <span className="text-[10px] text-slate-500">
                  支持多行、Markdown 与规约文本
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在此粘贴文档正文、业务规范、专业术语解释或数据手册..."
                rows={8}
                required
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100 resize-y leading-relaxed font-mono text-[12px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingItem(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                取消
              </button>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-lg ${theme.primaryBg} ${theme.primaryHover} text-white font-medium`}
              >
                保存知识文档
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 pt-3">
            {/* Search and action */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 flex items-center bg-slate-950 rounded-xl px-2.5 py-1.5 border border-slate-800 focus-within:border-slate-600">
                <Search size={14} className="text-slate-500 mr-2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索知识库文档内容或标签..."
                  className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.json,.csv,.log,.yaml,.yml,text/*"
                className="hidden"
                onChange={handleFilesUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-medium flex items-center gap-1 shrink-0 shadow-sm"
                title="从本地导入文本文件（可多选），每个文件成为一条资料"
              >
                <UploadCloud size={14} />
                <span>导入文件</span>
              </button>

              <button
                onClick={startCreate}
                className={`px-3 py-1.5 rounded-xl ${theme.primaryBg} ${theme.primaryHover} text-white text-xs font-medium flex items-center gap-1 shrink-0 shadow-sm`}
              >
                <Plus size={14} />
                <span>新建文档</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  知识库暂无内容，点击右上角「新建文档」导入你的第一篇资料
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isConnected = connectedKnowledgeIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onToggleConnectToSession(item.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                        isConnected
                          ? 'bg-slate-800/90 border-slate-700 shadow-md ring-1 ring-slate-600'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            className={`shrink-0 ${isConnected ? theme.primaryText : 'text-slate-600'}`}
                          >
                            {isConnected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isConnected ? theme.primaryText : 'text-slate-200'
                                }`}
                              >
                                {item.title}
                              </span>
                              {isConnected && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 font-medium">
                                  已连接本窗口
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                              {(item.tags ?? []).map((t) => (
                                <span key={t} className="bg-slate-800/80 px-1.5 py-0.5 rounded">
                                  #{t}
                                </span>
                              ))}
                              <span>· {item.content.length} 字</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="编辑"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确认从知识库删除「${item.title}」？`)) {
                                onDeleteKnowledgeItem(item.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                            title="删除"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="bg-slate-900/90 rounded-lg p-2 text-[11px] font-mono text-slate-400 line-clamp-2 border border-slate-800/50">
                        {item.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            勾选的文档将自动作为 RAG 背景注入会话上下文
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
