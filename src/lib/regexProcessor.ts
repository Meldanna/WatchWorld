import { RegexRule } from '../types';

export function applyRegexRules(
  text: string,
  rules: RegexRule[],
  scope: 'input' | 'output'
): string {
  if (!text) return '';
  let result = text;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.scope !== 'both' && rule.scope !== scope) continue;

    try {
      const reg = new RegExp(rule.pattern, rule.flags || 'g');
      result = result.replace(reg, rule.replacement);
    } catch (err) {
      console.warn(`Invalid regex pattern in rule "${rule.name}":`, err);
    }
  }

  return result;
}

export function testRegexRule(
  text: string,
  pattern: string,
  flags: string,
  replacement: string
): { success: boolean; result: string; matchCount: number; error?: string } {
  try {
    const reg = new RegExp(pattern, flags);
    const matches = text.match(reg);
    const matchCount = matches ? matches.length : 0;
    const result = text.replace(reg, replacement);
    return {
      success: true,
      result,
      matchCount,
    };
  } catch (err: any) {
    return {
      success: false,
      result: text,
      matchCount: 0,
      error: err.message || '正则表达式语法错误',
    };
  }
}
