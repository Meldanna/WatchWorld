import React, { useState } from 'react';
import { AgentSkill } from '../types';
import { ThemeConfig } from '../lib/theme';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Zap,
  Tag,
  Sliders,
  CheckSquare,
  Square,
  Wrench,
} from 'lucide-react';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: AgentSkill[];
  connectedSkillIds: string[];
  theme: ThemeConfig;
  onSaveSkill: (skill: AgentSkill) => void;
  onDeleteSkill: (id: string) => void;
  onToggleConnectSkill: (id: string) => void;
}

export const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  skills,
  connectedSkillIds,
  theme,
  onSaveSkill,
  onDeleteSkill,
  onToggleConnectSkill,
}) => {
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [description, setDescription] = useState('');
  const [keywordsStr, setKeywordsStr] = useState('');
  const [injection, setInjection] = useState('');

  if (!isOpen) return null;

  const startCreate = () => {
    setIsCreating(true);
    setEditingSkill(null);
    setName('');
    setIcon('⚡');
    setDescription('');
    setKeywordsStr('分析, 规划, 方案');
    setInjection('【已激活专属技能】请按结构化方案输出分步执行指南。');
  };

  const startEdit = (s: AgentSkill) => {
    setEditingSkill(s);
    setIsCreating(false);
    setName(s.name);
    setIcon(s.icon);
    setDescription(s.description);
    setKeywordsStr(s.triggerKeywords.join(', '));
    setInjection(s.systemInstructionInjection);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !injection.trim()) return;

    const parsedKeywords = keywordsStr
      .split(/[,，\s]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    const skillToSave: AgentSkill = {
      id: editingSkill?.id || `skill-${Date.now()}`,
      name: name.trim(),
      icon: icon.trim() || '⚡',
      description: description.trim(),
      triggerKeywords: parsedKeywords.length > 0 ? parsedKeywords : ['通用'],
      systemInstructionInjection: injection.trim(),
      enabled: true,
      isBuiltin: editingSkill?.isBuiltin || false,
    };

    onSaveSkill(skillToSave);
    setIsCreating(false);
    setEditingSkill(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${theme.accentBadge} flex items-center justify-center text-sm`}>
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span>Agent Skill 技能系统</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                定义智能触发词与专业指令模板，赋予模型特定领域的专家执行力
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {isCreating || editingSkill ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-semibold ${theme.primaryText}`}>
                {isCreating ? '新建专属技能' : `编辑技能: ${editingSkill?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingSkill(null);
                }}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  图标 (Emoji)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  maxLength={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-center text-xl p-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  技能名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：SQL 慢查询调优、小红书高赞爆款..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                触发关键词 (逗号分隔，用户发消息命中任一词时自动激活) *
              </label>
              <input
                type="text"
                value={keywordsStr}
                onChange={(e) => setKeywordsStr(e.target.value)}
                placeholder="例如：sql, 慢查询, 索引, explain"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                技能简要说明
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简述该技能适用的业务场景与效果..."
                className="w-full bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  触发时自动注入的指令 (System Instruction) *
                </label>
              </div>
              <textarea
                value={injection}
                onChange={(e) => setInjection(e.target.value)}
                placeholder="【已激活专属技能】请严格遵循以下执行规约：1. 诊断根因 2. 给出性能测试数据对比..."
                rows={5}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100 resize-y leading-relaxed font-mono text-[12px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingSkill(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                取消
              </button>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-lg ${theme.primaryBg} ${theme.primaryHover} text-white font-medium`}
              >
                保存技能
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                会话挂载技能 ({connectedSkillIds.length}/{skills.length} 已挂载)
              </span>
              <button
                onClick={startCreate}
                className={`flex items-center gap-1 text-xs ${theme.primaryText} font-medium py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700`}
              >
                <Plus size={14} />
                <span>新建技能</span>
              </button>
            </div>

            {skills.map((skill) => {
              const isConnected = connectedSkillIds.includes(skill.id);

              return (
                <div
                  key={skill.id}
                  onClick={() => onToggleConnectSkill(skill.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                    isConnected
                      ? 'bg-slate-50/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 shadow-sm'
                      : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        className={`shrink-0 ${isConnected ? theme.primaryText : 'text-slate-400'}`}
                      >
                        {isConnected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <div className="text-xl shrink-0 select-none">
                        {skill.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isConnected ? theme.primaryText : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {skill.name}
                          </span>
                          {isConnected && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-medium">
                              本窗口生效
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {skill.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => startEdit(skill)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="编辑"
                      >
                        <Edit2 size={13} />
                      </button>

                      {!skill.isBuiltin && (
                        <button
                          onClick={() => {
                            if (confirm(`确认删除技能「${skill.name}」？`)) {
                              onDeleteSkill(skill.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                          title="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trigger Keywords */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                    <span>激活词:</span>
                    {skill.triggerKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            命中关键词时自动激发专家指令注入模型
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-xs text-slate-700 dark:text-slate-200"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
