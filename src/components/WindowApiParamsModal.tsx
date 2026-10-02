import React, { useState, useEffect } from 'react';
import { Sliders, X, RotateCcw, Thermometer, Layers, Hash, Info, Filter, Repeat, TrendingUp, ImagePlus } from 'lucide-react';
import { ChatSession } from '../types';

interface WindowApiParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  /** 未覆盖时实际生效的默认值：顾问值 → 全局默认 → 内置兜底 */
  inheritedTemperature: number;
  inheritedTopP: number;
  /** 当前窗口实际生效的模型名（只读展示） */
  modelName: string;
  /** 当前窗口实际生效的服务商名（只读展示） */
  providerName: string;
  onSave: (params: {
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    maxTokens?: number;
    imageContextMode?: 'once' | 'history';
  }) => void;
}

/**
 * 窗口级 API 参数。
 * 只包含采样参数（温度 / Top P / 最大输出 Token），它们随会话保存。
 * 密钥、Base URL、模型清单属于全局 Provider 配置，不在此处编辑。
 */
export const WindowApiParamsModal: React.FC<WindowApiParamsModalProps> = ({
  isOpen,
  onClose,
  session,
  inheritedTemperature,
  inheritedTopP,
  modelName,
  providerName,
  onSave,
}) => {
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [topP, setTopP] = useState<number | undefined>(undefined);
  const [topK, setTopK] = useState<number | undefined>(undefined);
  const [frequencyPenalty, setFrequencyPenalty] = useState<number | undefined>(undefined);
  const [presencePenalty, setPresencePenalty] = useState<number | undefined>(undefined);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
  const [imageContextMode, setImageContextMode] = useState<'once' | 'history'>('once');

  // 每次打开时从会话同步，避免上一次的编辑残留
  useEffect(() => {
    if (isOpen) {
      setTemperature(session.temperature);
      setTopP(session.topP);
      setTopK(session.topK);
      setFrequencyPenalty(session.frequencyPenalty);
      setPresencePenalty(session.presencePenalty);
      setMaxTokens(session.maxTokens);
      setImageContextMode(session.imageContextMode || 'once');
    }
  }, [
    isOpen,
    session.temperature,
    session.topP,
    session.topK,
    session.frequencyPenalty,
    session.presencePenalty,
    session.maxTokens,
    session.imageContextMode,
  ]);

  if (!isOpen) return null;

  const baseTemperature = inheritedTemperature;
  const baseTopP = inheritedTopP;

  const handleSave = () => {
    onSave({
      temperature,
      topP,
      topK,
      frequencyPenalty,
      presencePenalty,
      maxTokens,
      imageContextMode,
    });
    onClose();
  };

  const handleResetAll = () => {
    setTemperature(undefined);
    setTopP(undefined);
    setTopK(undefined);
    setFrequencyPenalty(undefined);
    setPresencePenalty(undefined);
    setMaxTokens(undefined);
  };

  const labelStyle: React.CSSProperties = { color: 'var(--text-tertiary)' };
  const valueStyle: React.CSSProperties = { color: 'var(--text-primary)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-lg border rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[90vh] overflow-y-auto"
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
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ ...valueStyle }}>
                窗口 API 参数
              </h2>
              <p className="text-[11px]" style={labelStyle}>
                仅影响当前窗口，不修改全局 API 配置
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

        <div className="py-3 space-y-4 text-xs">
          {/* 只读：来源信息，提示这些来自全局配置 */}
          <div
            className="flex items-start gap-2 rounded-xl border p-3"
            style={{
              backgroundColor: 'var(--surface-1)',
              borderColor: 'var(--border-default)',
            }}
          >
            <Info size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
            <div className="space-y-1">
              <p style={labelStyle}>
                服务商与模型由全局配置提供，本窗口只读取：
              </p>
              <p className="font-mono text-[11px]" style={valueStyle}>
                {providerName} · {modelName}
              </p>
              <p style={labelStyle}>
                如需修改密钥 / Base URL / 模型清单，请到侧边栏「API」。
              </p>
            </div>
          </div>

          {/* 温度 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Thermometer size={13} style={{ color: 'var(--accent-primary)' }} />
                <span className="font-medium" style={valueStyle}>发散度 (Temperature)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono" style={valueStyle}>
                  {temperature !== undefined ? temperature.toFixed(2) : `${baseTemperature.toFixed(2)} (跟随默认)`}
                </span>
                {temperature !== undefined && (
                  <button
                    type="button"
                    onClick={() => setTemperature(undefined)}
                    className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                  >
                    跟随默认
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temperature ?? baseTemperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <p className="text-[10px] mt-0.5" style={labelStyle}>
              越低越严谨收敛，越高越发散。范围 0 – 1.5
            </p>
          </div>

          {/* Top P */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Layers size={13} style={{ color: 'var(--accent-primary)' }} />
                <span className="font-medium" style={valueStyle}>核采样 (Top P)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono" style={valueStyle}>
                  {topP !== undefined ? topP.toFixed(2) : `${baseTopP.toFixed(2)} (跟随默认)`}
                </span>
                {topP !== undefined && (
                  <button
                    type="button"
                    onClick={() => setTopP(undefined)}
                    className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                  >
                    跟随默认
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={topP ?? baseTopP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <p className="text-[10px] mt-0.5" style={labelStyle}>
              控制候选词的累积概率阈值，通常与温度二选一调节。
            </p>
          </div>

          {/* Top K */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Filter size={13} style={{ color: 'var(--accent-primary)' }} />
                <span className="font-medium" style={valueStyle}>候选词上限 (Top K)</span>
              </div>
              {topK !== undefined && (
                <button
                  type="button"
                  onClick={() => setTopK(undefined)}
                  className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  清除
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={topK ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setTopK(v === '' ? undefined : Math.max(1, parseInt(v, 10) || 1));
              }}
              placeholder="留空 = 不限制"
              className="w-full p-2 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-1)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            <p className="text-[10px] mt-0.5" style={labelStyle}>
              每步只从概率最高的 K 个候选词中采样，如 40。Claude / Gemini 支持。
            </p>
          </div>

          {/* 频率惩罚 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Repeat size={13} style={{ color: 'var(--accent-primary)' }} />
                <span className="font-medium" style={valueStyle}>重复惩罚 (Frequency)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono" style={valueStyle}>
                  {frequencyPenalty !== undefined ? frequencyPenalty.toFixed(2) : '未设置'}
                </span>
                {frequencyPenalty !== undefined && (
                  <button
                    type="button"
                    onClick={() => setFrequencyPenalty(undefined)}
                    className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={frequencyPenalty ?? 0}
              onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <p className="text-[10px] mt-0.5" style={labelStyle}>
              正值抑制重复用词，负值鼓励复读。0 为中性。仅 OpenAI 系服务商支持。
            </p>
          </div>

          {/* 存在惩罚 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} style={{ color: 'var(--accent-primary)' }} />
                <span className="font-medium" style={valueStyle}>话题惩罚 (Presence)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono" style={valueStyle}>
                  {presencePenalty !== undefined ? presencePenalty.toFixed(2) : '未设置'}
                </span>
                {presencePenalty !== undefined && (
                  <button
                    type="button"
                    onClick={() => setPresencePenalty(undefined)}
                    className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={presencePenalty ?? 0}
              onChange={(e) => setPresencePenalty(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <p className="text-[10px] mt-0.5" style={labelStyle}>
              正值推动模型引入新话题，负值让它紧扣当前话题。仅 OpenAI 系服务商支持。
            </p>
          </div>

          {/* 最大输出 Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Hash size={13} style={{ color: 'var(--accent-primary)' }} />
                <span className="font-medium" style={valueStyle}>最大输出 Token</span>
              </div>
              {maxTokens !== undefined && (
                <button
                  type="button"
                  onClick={() => setMaxTokens(undefined)}
                  className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  清空
                </button>
              )}
            </div>
            <input
              type="range"
              min="0"
              max="8192"
              step="256"
              value={maxTokens ?? 0}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setMaxTokens(v === 0 ? undefined : v);
              }}
              className="w-full"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="number"
                min="0"
                step="128"
                value={maxTokens ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaxTokens(v === '' ? undefined : Math.max(0, parseInt(v, 10) || 0));
                }}
                placeholder="留空 = 不限制"
                className="flex-1 p-2 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface-1)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="shrink-0" style={labelStyle}>tokens</span>
            </div>
            <p className="text-[10px] mt-0.5" style={labelStyle}>
              限制单次回复长度，留空表示不限制。
            </p>
          </div>

          {/* 图片上下文开关 */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ImagePlus size={13} style={{ color: 'var(--accent-primary)' }} />
              <span className="font-medium" style={valueStyle}>图片是否留在上下文</span>
            </div>
            <div className="flex gap-1.5">
              {(
                [
                  { id: 'once' as const, label: '只发一轮（省 token）' },
                  { id: 'history' as const, label: '保留在历史中' },
                ]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setImageContextMode(opt.id)}
                  className="flex-1 px-3 py-2 rounded-xl text-[11px] font-medium transition-all"
                  style={{
                    backgroundColor:
                      imageContextMode === opt.id
                        ? 'var(--accent-primary-alpha)'
                        : 'var(--surface-2)',
                    color:
                      imageContextMode === opt.id
                        ? 'var(--accent-primary)'
                        : 'var(--text-secondary)',
                    border: `1px solid ${
                      imageContextMode === opt.id
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)'
                    }`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-1" style={labelStyle}>
              「只发一轮」：图片只在发送它的那一轮带给模型，之后不再重复计费，但 AI 后续不再看到该图。
              「保留在历史中」：模型每轮都能看到，但图片会反复计入费用。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
          >
            <RotateCcw size={12} />
            <span>全部跟随默认</span>
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg font-medium shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
