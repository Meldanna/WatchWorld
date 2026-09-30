import React from 'react';
import { ThemePalette } from '../types';
import { THEMES, ThemeConfig } from '../lib/theme';
import { Palette, Check, X, Sparkles } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemePalette;
  onSelectTheme: (theme: ThemePalette) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                UI 主题色彩切换
              </h2>
              <p className="text-[11px] text-slate-400">
                个性化定制气泡配色、高亮主题与交互风格
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

        {/* Theme List */}
        <div className="py-4 space-y-2.5">
          {(Object.keys(THEMES) as ThemePalette[]).map((themeKey) => {
            const item = THEMES[themeKey];
            const isSelected = currentTheme === themeKey;

            return (
              <div
                key={themeKey}
                onClick={() => {
                  onSelectTheme(themeKey);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-slate-600 shadow-md ring-1 ring-slate-500'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-transform"
                    style={{ backgroundColor: item.primaryHex }}
                  >
                    {isSelected && <Check size={14} className="text-white drop-shadow" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      HEX: {item.primaryHex}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] text-white font-medium"
                    style={{ backgroundColor: item.primaryHex }}
                  >
                    气泡效果
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
