/**
 * Accurate token estimator & message metrics helper
 * Standard token estimation:
 * - Chinese characters / CJK punctuation: ~1.2 - 1.5 chars per token (~0.8 token per char)
 * - English words & punctuation: ~4 chars per token (~0.25 token per char)
 * - Code & symbols: ~3 chars per token
 */

export function estimateTokens(text: string | undefined | null): number {
  if (!text) return 0;

  let tokens = 0;
  // Count CJK characters
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff01-\uffee]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // Non-CJK text
  const nonCjk = text.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff01-\uffee]/g, ' ');
  const words = nonCjk.trim().split(/\s+/).filter(Boolean);

  // Each CJK char is ~0.65-0.8 token (in modern BPE tokenizers like cl100k / tiktoken / Llama3 / Gemini, each Chinese char is typically 1~1.5 tokens)
  tokens += Math.ceil(cjkCount * 1.1);

  // English words: 1 word ~ 1.3 tokens
  tokens += Math.ceil(words.length * 1.3);

  // Fallback sanity check against raw length
  const minTokens = Math.ceil(text.length / 4);
  return Math.max(tokens, minTokens);
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(1) + 'M';
  }
  if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'k';
  }
  return tokens.toString();
}

export function formatLatency(latencyMs?: number): string {
  if (latencyMs === undefined || latencyMs === null) return '';
  if (latencyMs < 1000) {
    return `${latencyMs}ms`;
  }
  return `${(latencyMs / 1000).toFixed(1)}s`;
}

export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
