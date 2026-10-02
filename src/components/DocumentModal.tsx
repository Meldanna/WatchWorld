import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FileText,
  Copy,
  ArrowUpRight,
  Layers,
  Save,
  Search,
  UploadCloud,
} from 'lucide-react';
import { WorldDocument } from '../types';
import { ThemeConfig } from '../lib/theme';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: WorldDocument[];
  onSaveDocument: (doc: WorldDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onInjectAsPrompt: (content: string, target: 'fixed' | 'common') => void;
  theme: ThemeConfig;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSaveDocument,
  onDeleteDocument,
  onInjectAsPrompt,
  theme,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents[0]?.id || ''
  );
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<WorldDocument['category']>('worldview');
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const filteredDocs = documents.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q);
  });

  const handleStartCreate = () => {
    setIsEditing(true);
    setEditTitle('');
    setEditCategory('worldview');
    setEditContent('');
  };

  // 批量导入本地文本文件为设定文档
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
        onSaveDocument({
          id: `doc-file-${now}-${i}`,
          title: file.name.replace(/\.[^.]+$/, '') || file.name,
          category: 'custom',
          content: text,
          createdAt: now + i,
          updatedAt: now + i,
          tags: ['导入', ext].filter(Boolean),
        });
      } catch (err) {
        console.error(`读取文件失败: ${file.name}`, err);
      }
    }
  };

  const handleStartEdit = (doc: WorldDocument) => {
    setIsEditing(true);
    setEditTitle(doc.title);
    setEditCategory(doc.category);
    setEditContent(doc.content);
  };

  const handleSave = () => {
    if (!editTitle.trim()) return;

    const docToSave: WorldDocument = {
      id: isEditing && currentDoc && editTitle === currentDoc.title ? currentDoc.id : `doc-${Date.now()}`,
      title: editTitle.trim(),
      category: editCategory,
      content: editContent.trim(),
      createdAt: isEditing && currentDoc ? currentDoc.createdAt : Date.now(),
      updatedAt: Date.now(),
      tags: [editCategory],
    };

    onSaveDocument(docToSave);
    setSelectedDocId(docToSave.id);
    setIsEditing(false);
  };

  const handleCopyContent = () => {
    if (currentDoc) {
      navigator.clipboard.writeText(currentDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const categoryLabels: Record<WorldDocument['category'], string> = {
    worldview: '世界观总览',
    character: '人物设定档案',
    timeline: '时间线因果',
    analysis: '心理关系归档',
    custom: '自定义设定',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${theme.badgeBg} ${theme.badgeText}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>世界观文档系统</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                  支持WebDAV同步
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                存放世界观基石、人物卡、时间线因果与心理分析，随时一键注入提示词
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Doc List Sidebar */}
          <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
            {/* Search and Add */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索设定文档..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
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
                className="p-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-700 transition-colors shadow-xs"
                title="从本地导入文本文件（可多选），每个文件成为一篇设定文档"
              >
                <UploadCloud className="w-4 h-4" />
              </button>
              <button
                onClick={handleStartCreate}
                className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
                title="新建设定文档"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredDocs.map((doc) => {
                const isSelected = doc.id === (currentDoc?.id || '');
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setIsEditing(false);
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                        {categoryLabels[doc.category] || doc.category}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="truncate font-medium">{doc.title}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doc Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {isEditing ? (
              <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="文档标题（如：世界观总纲、某某人物心理档案）"
                    className="flex-1 text-sm font-bold p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                    autoFocus
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="worldview">世界观总览</option>
                    <option value="character">人物设定档案</option>
                    <option value="timeline">时间线因果</option>
                    <option value="analysis">心理关系归档</option>
                    <option value="custom">自定义设定</option>
                  </select>
                </div>

                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="在此输入 Markdown 格式的完整世界观、角色卡或剧情推演设定..."
                  className="flex-1 text-xs font-mono p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none resize-none leading-relaxed"
                />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-xl text-xs bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-sm"
                  >
                    <Save size={13} />
                    <span>保存文档</span>
                  </button>
                </div>
              </div>
            ) : currentDoc ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* View Toolbar */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {currentDoc.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {categoryLabels[currentDoc.category] || currentDoc.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    {/* Inject to Fixed Box */}
                    <button
                      onClick={() => onInjectAsPrompt(currentDoc.content, 'fixed')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 transition-colors"
                      title="将本文档直接注入到【本身的提示词】区域"
                    >
                      <ArrowUpRight size={12} />
                      <span>注入本身框</span>
                    </button>

                    {/* Inject to Common Box */}
                    <button
                      onClick={() => onInjectAsPrompt(currentDoc.content, 'common')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 transition-colors"
                      title="将本文档直接注入到【注入的通用】框并开启推入缓存"
                    >
                      <Layers size={12} />
                      <span>注入通用框</span>
                    </button>

                    <button
                      onClick={handleCopyContent}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="复制全文"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>

                    <button
                      onClick={() => handleStartEdit(currentDoc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="编辑文档"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`确认删除文档「${currentDoc.title}」吗？`)) {
                          onDeleteDocument(currentDoc.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="删除文档"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content preview */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {currentDoc.content}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400">
                <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                <span>暂无设定文档，点击左上角加号新建</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
