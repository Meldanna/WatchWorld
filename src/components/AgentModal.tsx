import React, { useState } from 'react';
import { Agent } from '../types';
import {
  Bot,
  Plus,
  Check,
  Edit2,
  Trash2,
  Copy,
  X,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  activeAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onSaveAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  agents,
  activeAgentId,
  onSelectAgent,
  onSaveAgent,
  onDeleteAgent,
}) => {
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states for creating/editing
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [tagsStr, setTagsStr] = useState('');

  if (!isOpen) return null;

  const startCreate = () => {
    setIsCreating(true);
    setEditingAgent(null);
    setName('');
    setAvatar('🤖');
    setDescription('');
    setSystemPrompt('');
    setTemperature(0.7);
    setTagsStr('自定义');
  };

  const startEdit = (a: Agent) => {
    setEditingAgent(a);
    setIsCreating(false);
    setName(a.name);
    setAvatar(a.avatar);
    setDescription(a.description);
    setSystemPrompt(a.systemPrompt);
    setTemperature(a.temperature ?? 0.7);
    setTagsStr(a.tags.join(', '));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedTags = tagsStr
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const agentToSave: Agent = {
      id: editingAgent?.id || `agent-custom-${Date.now()}`,
      name: name.trim(),
      avatar: avatar.trim() || '🤖',
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      temperature: Number(temperature),
      tags: parsedTags.length > 0 ? parsedTags : ['自定义'],
      isBuiltin: editingAgent?.isBuiltin || false,
    };

    onSaveAgent(agentToSave);
    setIsCreating(false);
    setEditingAgent(null);
  };

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
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Agent 角色中心
              </h2>
              <p className="text-[11px] text-slate-400">
                随时切换不同角色设定或创建专属智能体
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
        {isCreating || editingAgent ? (
          /* Create / Edit Form */
          <form
            onSubmit={handleSaveForm}
            className="flex-1 overflow-y-auto py-3 space-y-3.5 text-xs text-slate-300"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-emerald-400">
                {isCreating ? '新建专属智能体' : `编辑智能体: ${editingAgent?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingAgent(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="block text-[11px] text-slate-400 mb-1">
                  头像 (Emoji)
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  maxLength={4}
                  className="w-full bg-slate-950 text-center text-xl p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] text-slate-400 mb-1">
                  角色名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：论文评审专家、小红书文案手..."
                  required
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                简介说明
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简述该角色的专业特长与适用场景..."
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400">
                  系统提示词 (System Prompt) *
                </label>
                <span className="text-[10px] text-slate-500">
                  决定回答风格与思考链路
                </span>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="你是一名资深的... 在回答时请遵循以下原则..."
                rows={5}
                required
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100 resize-y leading-relaxed font-mono text-[12px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>发散度 (Temperature): {temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  标签 (以逗号分隔)
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="如：写作, 幽默, 推荐"
                  className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingAgent(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950"
              >
                保存智能体
              </button>
            </div>
          </form>
        ) : (
          /* Agent List View */
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs text-slate-400">可用 Agent 列表</span>
              <button
                onClick={startCreate}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium py-1 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30"
              >
                <Plus size={14} />
                <span>新建 Agent</span>
              </button>
            </div>

            {agents.map((agent) => {
              const isActive = agent.id === activeAgentId;

              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-slate-800/90 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl mt-0.5 shrink-0 select-none">
                    {agent.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-xs font-semibold ${
                          isActive ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {agent.name}
                      </span>
                      {agent.tags.map((t) => (
                        <span key={t} className="text-[10px] text-slate-400 font-mono">
                          · {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {isActive ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-1">
                        <Check size={13} />
                      </div>
                    ) : null}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(agent);
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      title="编辑"
                    >
                      <Edit2 size={13} />
                    </button>

                    {!agent.isBuiltin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确认删除 Agent「${agent.name}」？`)) {
                            onDeleteAgent(agent.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                        title="删除"
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
      </div>
    </div>
  );
};
