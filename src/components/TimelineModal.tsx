import React, { useState } from 'react';
import {
  GitBranch,
  X,
  Plus,
  Check,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Filter,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';
import { TimelineBranch, ChatSession } from '../types';
import { ThemeConfig } from '../lib/theme';
import {
  TIMELINE_COLORS,
  getTimelineColorConfig,
  allocateTimelineCodeTag,
} from '../lib/timelineMemory';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  theme: ThemeConfig;
  onUpdateSession: (updater: (prev: ChatSession) => ChatSession) => void;
  filterByActiveTimeline: boolean;
  onToggleFilterByActiveTimeline: () => void;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  onClose,
  session,
  theme,
  onUpdateSession,
  filterByActiveTimeline,
  onToggleFilterByActiveTimeline,
}) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'create'>('tree');
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);

  // Form states for creating / editing
  const [formName, setFormName] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formCodeTag, setFormCodeTag] = useState('');
  const [formDescriptionTag, setFormDescriptionTag] = useState('');
  const [formColor, setFormColor] = useState('indigo');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formPlotSummary, setFormPlotSummary] = useState('');

  if (!isOpen) return null;

  const isMemoryEnabled = Boolean(session.timelineMemoryEnabled);
  const timelines = session.timelines || [];
  const activeTimelineId = session.activeTimelineId || timelines[0]?.id || 'timeline-main';
  const activeTimeline = timelines.find((t) => t.id === activeTimelineId) || timelines[0];

  const handleToggleMemory = () => {
    onUpdateSession((prev) => ({
      ...prev,
      timelineMemoryEnabled: !prev.timelineMemoryEnabled,
      updatedAt: Date.now(),
    }));
  };

  const handleSelectActiveTimeline = (timelineId: string) => {
    onUpdateSession((prev) => ({
      ...prev,
      activeTimelineId: timelineId,
      updatedAt: Date.now(),
    }));
  };

  const handleToggleVisibility = (timelineId: string) => {
    onUpdateSession((prev) => ({
      ...prev,
      timelines: (prev.timelines || []).map((t) =>
        t.id === timelineId
          ? { ...t, visible: t.visible === false ? true : false, updatedAt: Date.now() }
          : t
      ),
      updatedAt: Date.now(),
    }));
  };

  const handleStartCreate = (parentId?: string) => {
    const parentKey = parentId || activeTimelineId || '';
    const parentBranch = timelines.find((t) => t.id === parentKey);
    const autoCode = allocateTimelineCodeTag(timelines, parentBranch);
    setEditingTimelineId(null);
    setFormCodeTag(autoCode);
    setFormDescriptionTag('');
    setFormName(`${autoCode}·新分支`);
    setFormTag(autoCode);
    const usedColors = new Set(timelines.map((t) => t.color));
    const nextColor = TIMELINE_COLORS.find((c) => !usedColors.has(c.id)) || TIMELINE_COLORS[0];
    setFormColor(nextColor.id);
    setFormParentId(parentKey);
    setFormDescription('');
    setFormPlotSummary('自该分化节点起展开新剧情。');
    setActiveTab('create');
  };

  const handleStartEdit = (t: TimelineBranch) => {
    setEditingTimelineId(t.id);
    setFormName(t.name);
    setFormTag(t.tag);
    setFormCodeTag(t.codeTag || t.tag);
    setFormDescriptionTag(t.descriptionTag || t.tag);
    setFormColor(t.color);
    setFormParentId(t.parentId || '');
    setFormDescription(t.description);
    setFormPlotSummary(t.plotSummary);
    setActiveTab('create');
  };

  const handleSaveTimeline = () => {
    if (!formName.trim()) return;
    const codeTag = formCodeTag.trim() || 'A1';
    const descTag = formDescriptionTag.trim() || formName.trim().slice(0, 10);
    const tag = descTag || codeTag;
    const desc =
      formDescription.trim() ||
      `在「${formName.trim()}」分支下的独立设定，区别于其他时间线。`;

    if (editingTimelineId) {
      // Update existing
      onUpdateSession((prev) => {
        const nextList = (prev.timelines || []).map((t) => {
          if (t.id === editingTimelineId) {
            return {
              ...t,
              name: formName.trim(),
              tag,
              codeTag,
              descriptionTag: descTag,
              color: formColor,
              parentId: formParentId || undefined,
              description: desc,
              plotSummary: formPlotSummary.trim() || t.plotSummary,
              updatedAt: Date.now(),
            };
          }
          return t;
        });

        // Also update message cached tags
        const nextMessages = prev.messages.map((m) => {
          if (m.timelineId === editingTimelineId) {
            return { ...m, timelineTag: tag, codeTag, descriptionTag: descTag };
          }
          return m;
        });

        return {
          ...prev,
          timelines: nextList,
          messages: nextMessages,
          updatedAt: Date.now(),
        };
      });
    } else {
      // Create new timeline
      const newId = `timeline-${Date.now()}`;
      const newTimeline: TimelineBranch = {
        id: newId,
        name: formName.trim(),
        tag,
        codeTag,
        descriptionTag: descTag,
        visible: true,
        color: formColor,
        description: desc,
        plotSummary: formPlotSummary.trim() || '新时间线分支已建立，等待探索。',
        keyMilestones: [`分化创建时间线【${formName.trim()}】`],
        messageIds: [],
        parentId: formParentId || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onUpdateSession((prev) => ({
        ...prev,
        timelines: [...(prev.timelines || []), newTimeline],
        activeTimelineId: newId,
        updatedAt: Date.now(),
      }));
    }

    setActiveTab('tree');
  };

  const handleDeleteTimeline = (id: string) => {
    if (timelines.length <= 1) return;
    if (!confirm('确定删除此时间线分支吗？该分支的消息将被重新分配回主线。')) return;

    onUpdateSession((prev) => {
      const remaining = (prev.timelines || []).filter((t) => t.id !== id);
      const fallbackId = remaining[0]?.id || 'timeline-main';
      const fallbackTag = remaining[0]?.tag || '主线';

      const nextMessages = prev.messages.map((m) => {
        if (m.timelineId === id) {
          return { ...m, timelineId: fallbackId, timelineTag: fallbackTag };
        }
        return m;
      });

      return {
        ...prev,
        timelines: remaining,
        activeTimelineId: prev.activeTimelineId === id ? fallbackId : prev.activeTimelineId,
        messages: nextMessages,
        updatedAt: Date.now(),
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${theme.badgeBg} ${theme.badgeText} flex items-center justify-center`}
            >
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  记忆整理 · 时间线消息树
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isMemoryEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                  }`}
                >
                  {isMemoryEnabled ? '已开启' : '已关闭'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                自动识别时间线并打标签归类，构建后台消息树，随着剧情写入区分信息
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Master Switch & View Tabs */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMemoryEnabled}
                onChange={handleToggleMemory}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              记忆整理开关 (自动识别与树状排序)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                activeTab === 'tree'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              时间线树 ({timelines.length})
            </button>
            <button
              onClick={() => handleStartCreate()}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1 ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              新建分支
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'tree' ? (
            <>
              {/* Filter option banner */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-700 dark:text-slate-300">
                    主聊天窗口视图模式：
                  </span>
                </div>
                <button
                  onClick={onToggleFilterByActiveTimeline}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    filterByActiveTimeline
                      ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {filterByActiveTimeline ? '仅展示当前时间线' : '展示全部消息(带分支标签)'}
                </button>
              </div>

              {/* Active branch prompt injection preview */}
              {activeTimeline && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      当前激活时间线：{activeTimeline.name}
                    </div>
                    <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80">
                      AI 回复时将自动以此时间线记忆树组织回复
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {activeTimeline.description}
                  </p>
                </div>
              )}

              {/* Timeline Branches Cards / Tree List */}
              <div className="space-y-3">
                {timelines.map((t, idx) => {
                  const colorConfig = getTimelineColorConfig(t.color);
                  const isActive = t.id === activeTimelineId;
                  const parent = timelines.find((p) => p.id === t.parentId);
                  const msgCount = session.messages.filter((m) => m.timelineId === t.id).length;

                  return (
                    <div
                      key={t.id}
                      className={`relative p-3.5 rounded-xl border transition-all ${
                        isActive
                          ? `${colorConfig.border} bg-white dark:bg-slate-900 ring-2 ${colorConfig.ring} shadow-md`
                          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top Bar of Timeline Card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(t.id)}
                            className={`p-1 rounded-md transition-colors ${
                              t.visible !== false
                                ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title={t.visible !== false ? '当前分支AI可见（点击切换为隐藏，跳过不发给AI）' : '当前分支已隐藏（点击切换为可见）'}
                          >
                            {t.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-rose-500" />}
                          </button>

                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-bold shadow-xs ${colorConfig.badge}`}
                          >
                            {t.codeTag || t.tag}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {t.descriptionTag ? `${t.codeTag ? `${t.codeTag}·` : ''}${t.descriptionTag}` : t.name}
                          </span>
                          {t.visible === false && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
                              已隐藏(跳过)
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                              当前聚焦
                            </span>
                          )}
                          {parent && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span>分化自: {parent.codeTag ? `[${parent.codeTag}] ` : ''}{parent.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!isActive && (
                            <button
                              onClick={() => handleSelectActiveTimeline(t.id)}
                              className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              切换至此
                            </button>
                          )}
                          <button
                            onClick={() => handleStartEdit(t)}
                            title="编辑时间线信息"
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {timelines.length > 1 && (
                            <button
                              onClick={() => handleDeleteTimeline(t.id)}
                              title="删除此分支"
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Distinguishing Characteristics (区分信息) */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 mb-2">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                          <span>🔍 核心区分信息与设定特征：</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            确保分类正确
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {t.description || '暂无详细区分信息'}
                        </p>
                      </div>

                      {/* Storyline progression summary (随剧情推进写入更多内容) */}
                      {t.plotSummary && (
                        <div className="p-2 rounded-lg bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 mb-2">
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>剧情脉络与沉淀演进 (自动更新)：</span>
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3">
                            {t.plotSummary}
                          </p>
                        </div>
                      )}

                      {/* Milestones pills if any */}
                      {t.keyMilestones && t.keyMilestones.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {t.keyMilestones.slice(-3).map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Info & Branch Out Action */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-2">
                          <span>包含 {msgCount} 条对话</span>
                          <span>•</span>
                          <span>更新于 {new Date(t.updatedAt).toLocaleTimeString()}</span>
                        </div>
                        <button
                          onClick={() => handleStartCreate(t.id)}
                          className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          以此分支分化新时间线
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Create / Edit Timeline Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {editingTimelineId ? '编辑时间线分支信息' : '创建新时间线分支 (消息树节点)'}
                </h3>
                <button
                  onClick={() => setActiveTab('tree')}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  返回列表
                </button>
              </div>

              {/* Dual Tags: Code Tag + Description Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    编号标签 (Code Tag, 如 A1, A12) *
                  </label>
                  <input
                    type="text"
                    value={formCodeTag}
                    onChange={(e) => setFormCodeTag(e.target.value.toUpperCase())}
                    placeholder="例如：A12"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">用户在输入框键入此编号可秒切分支</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    描述标签 (如 下药线·感情上头) *
                  </label>
                  <input
                    type="text"
                    value={formDescriptionTag}
                    onChange={(e) => setFormDescriptionTag(e.target.value)}
                    placeholder="人类可读分支描述，用·分隔层级"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">随对话推进展示在标签栏文字模式中</p>
                </div>
              </div>

              {/* Timeline Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  时间线分支全称 *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：A12·下药线·因为感情上头"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  分支代表色彩
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIMELINE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormColor(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        formColor === c.id
                          ? `${c.badge} border-white shadow-sm ring-2 ring-indigo-500/50`
                          : `${c.bg} ${c.text} ${c.border}`
                      }`}
                    >
                      {formColor === c.id && <Check className="w-3 h-3" />}
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parent Timeline (Tree hierarchy) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  父分支来源 (用于构建记忆树因果链)
                </label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">(作为独立根分支)</option>
                  {timelines
                    .filter((t) => t.id !== editingTimelineId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} [{t.tag}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Distinguishing Characteristics (核心区分信息) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  核心区分信息 / 世界观与设定特征 *
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  写明该时间线与主线或其它分支的本质区别（如身份、年份、存活状态、势力格局等），AI 将以此为准保持准确分类与回复一致性。
                </p>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="例如：这是离开团队5年后的平行分支，主角已成为要塞指挥官；敌方势力未被完全瓦解，目前处于停火协议期间..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Plot Summary / Development Initial State */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  剧情脉络与推进记录 (随会话持续自动丰富)
                </label>
                <textarea
                  rows={2}
                  value={formPlotSummary}
                  onChange={(e) => setFormPlotSummary(e.target.value)}
                  placeholder="分支初始状态，随后续聊天剧情发展，AI系统会自动追加更多脉络记录..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Save & Cancel */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('tree')}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveTimeline}
                  disabled={!formName.trim()}
                  className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-md transition-all ${
                    formName.trim()
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {editingTimelineId ? '保存修改' : '确认创建分支'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>智能识别触发示例：输入「这是一个时间线：五年后...」</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
