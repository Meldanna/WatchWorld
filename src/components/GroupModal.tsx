import React, { useState } from 'react';
import { ChatGroup, ChatSession } from '../types';
import {
  Folder,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ChatGroup[];
  sessions: ChatSession[];
  onSaveGroup: (group: ChatGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onReorderGroups: (newGroups: ChatGroup[]) => void;
}

const PRESET_COLORS = [
  '#64748b', // Slate
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#ef4444', // Red
  '#06b6d4', // Cyan
];

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  groups,
  sessions,
  onSaveGroup,
  onDeleteGroup,
  onReorderGroups,
}) => {
  const [editingGroup, setEditingGroup] = useState<ChatGroup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  if (!isOpen) return null;

  const startCreate = () => {
    setIsCreating(true);
    setEditingGroup(null);
    setName('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  };

  const startEdit = (g: ChatGroup) => {
    setEditingGroup(g);
    setIsCreating(false);
    setName(g.name);
    setColor(g.color);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const groupToSave: ChatGroup = {
      id: editingGroup?.id || `group-${Date.now()}`,
      name: name.trim(),
      color,
      order: editingGroup?.order ?? groups.length,
    };

    onSaveGroup(groupToSave);
    setIsCreating(false);
    setEditingGroup(null);
  };

  const moveGroup = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= groups.length) return;
    const newArr = [...groups];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    // update order
    newArr.forEach((g, idx) => {
      g.order = idx;
    });
    onReorderGroups(newArr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                窗口分组管理
              </h2>
              <p className="text-[11px] text-slate-400">
                创建分类目录并自定义色彩标识
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
        {isCreating || editingGroup ? (
          <form onSubmit={handleSave} className="py-4 space-y-3.5 text-xs text-slate-300">
            <h3 className="text-xs font-semibold text-emerald-400">
              {isCreating ? '新建窗口分组' : `编辑分组: ${editingGroup?.name}`}
            </h3>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                分组名称 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：工作项目、小说剧本..."
                required
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">
                标识色彩
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingGroup(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                保存分组
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs text-slate-400">现有分组列表</span>
              <button
                onClick={startCreate}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium py-1 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30"
              >
                <Plus size={14} />
                <span>新建分组</span>
              </button>
            </div>

            {groups.map((g, index) => {
              const count = sessions.filter((s) => s.groupId === g.id).length;
              const isDefault = g.id === 'group-default';

              return (
                <div
                  key={g.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {g.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {count} 个对话窗口
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move up/down */}
                    <button
                      onClick={() => moveGroup(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20"
                      title="上移"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveGroup(index, 'down')}
                      disabled={index === groups.length - 1}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20"
                      title="下移"
                    >
                      <ChevronDown size={14} />
                    </button>

                    <button
                      onClick={() => startEdit(g)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      title="编辑"
                    >
                      <Edit2 size={13} />
                    </button>

                    {!isDefault && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `确认删除分组「${g.name}」？该分组下的 ${count} 个窗口将自动转移到默认分组。`
                            )
                          ) {
                            onDeleteGroup(g.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                        title="删除分组"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex justify-end">
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
