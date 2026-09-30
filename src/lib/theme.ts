import { ThemePalette, UiMode } from '../types';

export interface ThemeConfig {
  id: ThemePalette;
  name: string;
  primary: string;
  primaryHex: string;
  primaryBg: string;
  primaryHover: string;
  primaryBorder: string;
  primaryText: string;
  userBubble: string;
  accentBadge: string;
}

export const THEMES: Record<ThemePalette, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: '翡翠玉绿 (默认)',
    primary: 'emerald-600',
    primaryHex: '#059669',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-500',
    primaryBorder: 'border-emerald-500/50',
    primaryText: 'text-emerald-500 dark:text-emerald-400',
    userBubble: 'bg-emerald-600 text-white shadow-sm',
    accentBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40',
  },
  blue: {
    id: 'blue',
    name: '深邃科技蓝',
    primary: 'blue-600',
    primaryHex: '#2563eb',
    primaryBg: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-500',
    primaryBorder: 'border-blue-500/50',
    primaryText: 'text-blue-500 dark:text-blue-400',
    userBubble: 'bg-blue-600 text-white shadow-sm',
    accentBadge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500/40',
  },
  violet: {
    id: 'violet',
    name: '极光幻夜紫',
    primary: 'violet-600',
    primaryHex: '#7c3aed',
    primaryBg: 'bg-violet-600',
    primaryHover: 'hover:bg-violet-500',
    primaryBorder: 'border-violet-500/50',
    primaryText: 'text-violet-500 dark:text-violet-400',
    userBubble: 'bg-violet-600 text-white shadow-sm',
    accentBadge: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-500/40',
  },
  rose: {
    id: 'rose',
    name: '热烈绯红玫瑰',
    primary: 'rose-600',
    primaryHex: '#e11d48',
    primaryBg: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-500',
    primaryBorder: 'border-rose-500/50',
    primaryText: 'text-rose-500 dark:text-rose-400',
    userBubble: 'bg-rose-600 text-white shadow-sm',
    accentBadge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-500/40',
  },
  amber: {
    id: 'amber',
    name: '明亮落日琥珀',
    primary: 'amber-600',
    primaryHex: '#d97706',
    primaryBg: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-500',
    primaryBorder: 'border-amber-500/50',
    primaryText: 'text-amber-500 dark:text-amber-400',
    userBubble: 'bg-amber-600 text-white shadow-sm',
    accentBadge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/40',
  },
  cyan: {
    id: 'cyan',
    name: '霓虹赛博青',
    primary: 'cyan-600',
    primaryHex: '#0891b2',
    primaryBg: 'bg-cyan-600',
    primaryHover: 'hover:bg-cyan-500',
    primaryBorder: 'border-cyan-500/50',
    primaryText: 'text-cyan-500 dark:text-cyan-400',
    userBubble: 'bg-cyan-600 text-white shadow-sm',
    accentBadge: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/40',
  },
  midnight: {
    id: 'midnight',
    name: '极简黑曜石 / 皓灰',
    primary: 'slate-700',
    primaryHex: '#334155',
    primaryBg: 'bg-slate-700',
    primaryHover: 'hover:bg-slate-600',
    primaryBorder: 'border-slate-500/50',
    primaryText: 'text-slate-600 dark:text-slate-300',
    userBubble: 'bg-slate-800 text-white border border-slate-700 shadow-sm',
    accentBadge: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-600/50',
  },
};
