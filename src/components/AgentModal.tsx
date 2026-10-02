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
    setTagsStr((a.tags ?? []).join(', '));
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
      <div
        className="relative w-full max-w-xl border rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-primary-alpha)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Agent 顾问中心
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                切换不同角色设定或创建专属顾问
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {isCreating || editingAgent ? (
          /* Create / Edit Form */
          <form
            onSubmit={handleSaveForm}
            className="flex-1 overflow-y-auto py-3 space-y-3.5 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {isCreating ? '新建专属顾问' : `编辑顾问: ${editingAgent?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingAgent(null);
                }}
                className="text-sm hover:underline"
                style={{ color: 'var(--text-tertiary)' }}
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="block text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  头像
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  maxLength={4}
                  className="w-full text-center text-xl p-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--surface-1)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  顾问名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：世界观推演师、剧情评估师..."
                  required
                  className="w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--surface-1)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
                简介说明
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简述该顾问的专业特长与适用场景..."
                className="w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface-1)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  系统提示词 (System Prompt) *
                </label>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  决定回答风格与思考链路
                </span>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="你是一名资深的... 在回答时请遵循以下原则..."
                rows={5}
                required
                className="w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-y leading-relaxed font-mono text-[12px]"
                style={{
                  backgroundColor: 'var(--surface-1)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  <span>发散度: {temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  标签 (逗号分隔)
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="如：世界观, 剧情, 角色"
                  className="w-full p-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--surface-1)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingAgent(null);
                }}
                className="px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text-secondary)',
                }}
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg font-medium shadow-md hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                }}
              >
                保存顾问
              </button>
            </div>
          </form>
        ) : (
          /* Agent List View */
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>可用顾问列表</span>
              <button
                onClick={startCreate}
                className="flex items-center gap-1 text-xs font-medium py-1 px-2.5 rounded-lg border transition-all hover:opacity-80"
                style={{
                  color: 'var(--accent-primary)',
                  backgroundColor: 'var(--accent-primary-alpha)',
                  borderColor: 'var(--accent-primary)',
                }}
              >
                <Plus size={14} />
                <span>新建顾问</span>
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
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3`}
                  style={{
                    backgroundColor: isActive ? 'var(--surface-2)' : 'var(--surface-1)',
                    borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-default)',
                    boxShadow: isActive ? '0 0 0 1px var(--accent-primary-alpha)' : 'none',
                  }}
                >
                  <div className="text-2xl mt-0.5 shrink-0 select-none">
                    {agent.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                      >
                        {agent.name}
                      </span>
                      {(agent.tags ?? []).map((t) => (
                        <span key={t} className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                          · {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {agent.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {isActive ? (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center mr-1"
                        style={{
                          backgroundColor: 'var(--accent-primary-alpha)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        <Check size={13} />
                      </div>
                    ) : null}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(agent);
                      }}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      title="编辑"
                    >
                      <Edit2 size={13} />
                    </button>

                    {!agent.isBuiltin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确认删除顾问「${agent.name}」？`)) {
                            onDeleteAgent(agent.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hover:text-rose-500"
                        style={{ color: 'var(--text-tertiary)' }}
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
