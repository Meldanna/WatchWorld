import React, { useState } from 'react';
import { RegexRule } from '../types';
import { testRegexRule } from '../lib/regexProcessor';
import { ThemeConfig } from '../lib/theme';
import {
  Code2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Play,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface RegexModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RegexRule[];
  theme: ThemeConfig;
  onSaveRule: (rule: RegexRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
}

export const RegexModal: React.FC<RegexModalProps> = ({
  isOpen,
  onClose,
  rules,
  theme,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
}) => {
  const [editingRule, setEditingRule] = useState<RegexRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [replacement, setReplacement] = useState('');
  const [scope, setScope] = useState<'input' | 'output' | 'both'>('output');
  const [description, setDescription] = useState('');

  // Sandbox Tester
  const [testText, setTestText] = useState('好的！这是一段用于测试正则表达式清洗的AI回复。电话是 13812345678。');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testMatches, setTestMatches] = useState<number | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  if (!isOpen) return null;

  const startCreate = () => {
    setIsCreating(true);
    setEditingRule(null);
    setName('');
    setPattern('');
    setFlags('g');
    setReplacement('');
    setScope('output');
    setDescription('');
    setTestResult(null);
  };

  const startEdit = (r: RegexRule) => {
    setEditingRule(r);
    setIsCreating(false);
    setName(r.name);
    setPattern(r.pattern);
    setFlags(r.flags);
    setReplacement(r.replacement);
    setScope(r.scope);
    setDescription(r.description || '');
    setTestResult(null);
  };

  const handleTestInSandbox = () => {
    if (!pattern) return;
    const res = testRegexRule(testText, pattern, flags, replacement);
    if (res.success) {
      setTestResult(res.result);
      setTestMatches(res.matchCount);
      setTestError(null);
    } else {
      setTestResult(null);
      setTestMatches(0);
      setTestError(res.error || '测试出错');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pattern) return;

    const ruleToSave: RegexRule = {
      id: editingRule?.id || `regex-${Date.now()}`,
      name: name.trim(),
      pattern: pattern,
      flags: flags || 'g',
      replacement: replacement,
      scope,
      description: description.trim(),
      enabled: editingRule ? editingRule.enabled : true,
    };

    onSaveRule(ruleToSave);
    setIsCreating(false);
    setEditingRule(null);
  };

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
            <div className={`w-8 h-8 rounded-xl ${theme.accentBadge} flex items-center justify-center text-sm font-mono`}>
              .*
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>正则表达式规则引擎</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  Regex
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                实时匹配替换输入提问或输出回答，过滤废话或脱敏隐私
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
        {isCreating || editingRule ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-semibold ${theme.primaryText}`}>
                {isCreating ? '添加正则规则' : `编辑规则: ${editingRule?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingRule(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">
                  规则名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：剔除客套前缀、格式化时间..."
                  required
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  作用范围
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100"
                >
                  <option value="output">仅输出清洗 (AI回复)</option>
                  <option value="input">仅输入清洗 (提问前)</option>
                  <option value="both">输入与输出同时生效</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                  正则表达式模式 (Pattern) *
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="例如：^(好的|当然可以)[，,！!]?\\s*"
                  required
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                  Flags 标志
                </label>
                <input
                  type="text"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  placeholder="g / i / m"
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                替换为 (Replacement，支持 $1 分组捕获，留空即为删除)
              </label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="留空即直接删除匹配到的字符；或填写如 [$1] / ***"
                className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                规则说明备注
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简述该正则表达式的目的..."
                className="w-full bg-slate-950 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-slate-500 text-slate-100"
              />
            </div>

            {/* Sandbox Tester */}
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">实时沙箱测试效果</span>
                <button
                  type="button"
                  onClick={handleTestInSandbox}
                  className={`px-2 py-0.5 rounded ${theme.primaryBg} ${theme.primaryHover} text-white flex items-center gap-1 text-[11px]`}
                >
                  <Play size={11} /> 运行测试
                </button>
              </div>

              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={2}
                placeholder="测试用例输入..."
                className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-slate-200 text-[11px] font-mono"
              />

              {testResult !== null && (
                <div className="p-2 bg-slate-900 rounded border border-emerald-500/40 text-[11px] font-mono">
                  <div className="text-emerald-400 text-[10px] mb-0.5">
                    匹配命中: {testMatches} 处 ➔ 替换结果:
                  </div>
                  <div className="text-slate-100 select-all">{testResult || '(替换为空)'}</div>
                </div>
              )}

              {testError && (
                <div className="p-2 bg-rose-950/50 rounded border border-rose-500/40 text-[11px] text-rose-300 font-mono">
                  {testError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingRule(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                取消
              </button>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-lg ${theme.primaryBg} ${theme.primaryHover} text-white font-medium`}
              >
                保存规则
              </button>
            </div>
          </form>
        ) : (
          /* Rule List View */
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs text-slate-400">生效中的正则规则 ({rules.filter((r) => r.enabled).length}/{rules.length})</span>
              <button
                onClick={startCreate}
                className={`flex items-center gap-1 text-xs ${theme.primaryText} font-medium py-1 px-2.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-800`}
              >
                <Plus size={14} />
                <span>新建规则</span>
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                暂无正则规则，点击上方「新建规则」添加
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                    rule.enabled
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-950/30 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleRule(rule.id)}
                        className={`text-sm ${rule.enabled ? theme.primaryText : 'text-slate-600'}`}
                        title={rule.enabled ? '点击禁用' : '点击启用'}
                      >
                        {rule.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${rule.enabled ? 'text-slate-100' : 'text-slate-500'}`}>
                            {rule.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 font-mono">
                            {rule.scope === 'output' ? '输出' : rule.scope === 'input' ? '输入' : '双向'}
                          </span>
                        </div>
                        {rule.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {rule.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(rule)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        title="编辑规则"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确认删除规则「${rule.name}」？`)) {
                            onDeleteRule(rule.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                        title="删除规则"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 rounded-lg p-2 font-mono text-[11px] text-slate-300 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-amber-300 truncate max-w-[65%]">/{rule.pattern}/{rule.flags}</span>
                    <span className="text-slate-500 mx-1">➔</span>
                    <span className="text-emerald-400 truncate max-w-[30%]">{rule.replacement ? `"${rule.replacement}"` : '(清除)'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            支持全部标准 JavaScript 正则语法与分组替换
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
