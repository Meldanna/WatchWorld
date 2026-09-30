import { TimelineBranch, ChatMessage } from '../types';

export const TIMELINE_COLORS = [
  {
    id: 'indigo',
    name: '靛青',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    border: 'border-indigo-500/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-600 text-white',
    ring: 'ring-indigo-500/40',
  },
  {
    id: 'emerald',
    name: '翠绿',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-600 text-white',
    ring: 'ring-emerald-500/40',
  },
  {
    id: 'amber',
    name: '琥珀',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-600 text-white',
    ring: 'ring-amber-500/40',
  },
  {
    id: 'rose',
    name: '玫瑰',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-600 text-white',
    ring: 'ring-rose-500/40',
  },
  {
    id: 'cyan',
    name: '青蓝',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    badge: 'bg-cyan-600 text-white',
    ring: 'ring-cyan-500/40',
  },
  {
    id: 'purple',
    name: '幻紫',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-600 text-white',
    ring: 'ring-purple-500/40',
  },
  {
    id: 'teal',
    name: '松石',
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    border: 'border-teal-500/30',
    text: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-600 text-white',
    ring: 'ring-teal-500/40',
  },
];

export function getTimelineColorConfig(colorId?: string) {
  const found = TIMELINE_COLORS.find((c) => c.id === colorId);
  return found || TIMELINE_COLORS[0];
}

export const DEFAULT_MAIN_TIMELINE_ID = 'timeline-main';

export function createDefaultMainTimeline(): TimelineBranch {
  return {
    id: DEFAULT_MAIN_TIMELINE_ID,
    name: '现实主线',
    tag: '主线',
    color: 'indigo',
    description: '核心主世界设定与初始剧情推进现实。',
    plotSummary: '故事与对话从本主分支起始推进。',
    keyMilestones: ['会话起源与主线建立'],
    messageIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export interface TimelineDetectionResult {
  triggered: boolean;
  action?: 'create_new' | 'switch_existing';
  targetTimelineId?: string;
  newTimelineName?: string;
  newTimelineTag?: string;
  initialDescription?: string;
}

/**
 * 自动识别消息中对时间线的提及或显式声明
 * 规则涵盖：
 * 1. "这是一个时间线..." / "作为新时间线..."
 * 2. 【时间线：xxx】 / [时间线：xxx]
 * 3. "切换到时间线xxx" / "回到主线" / "在xxx时间线里"
 * 4. IF线 / 平行世界线声明
 */
export function detectTimelineIntent(
  text: string,
  existingTimelines: TimelineBranch[]
): TimelineDetectionResult {
  const clean = text.trim();
  if (!clean) return { triggered: false };

  // 1. 检查是否显式要求切换到已有的某个时间线 (例如: "回到主线", "切换到时间线A", "切到IF线")
  for (const t of existingTimelines) {
    const escapedTag = t.tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedName = t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const switchPattern = new RegExp(
      `(?:切换|回到|切回|转到|进入|重回|位于|处于)(?:到|回)?(?:【|\\[)?(?:时间线|分支)?(?:[:：\\s])*(?:${escapedTag}|${escapedName})(?:】|\\])?`,
      'i'
    );

    if (switchPattern.test(clean)) {
      return {
        triggered: true,
        action: 'switch_existing',
        targetTimelineId: t.id,
      };
    }
  }

  // 2. 检测显式声明："这是一个时间线..." / "这是一个新时间线..."
  const explicitThisIsTimelineRegex =
    /(?:这|此)(?:个|条)?(?:是|算作|作为|当成|开启)?(?:一个|一条|一个全新的?)?时间线[：:\s]*(.*)/i;
  const explicitMatch = clean.match(explicitThisIsTimelineRegex);

  if (explicitMatch) {
    const remainder = explicitMatch[1]?.trim() || '';
    const nameMatch = remainder.match(/^([^\n,，。！？!?;；]{2,20})/);
    let extractedName = nameMatch ? nameMatch[1].trim() : '';

    if (!extractedName) {
      const count = existingTimelines.length;
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const letter = letters[Math.min(count - 1, letters.length - 1)] || `${count}`;
      extractedName = `分支时间线 ${letter}`;
    }

    // 尝试提取标签简写 (2-6个字符)
    let tag = extractedName.replace(/^时间线[:：\s]*/, '').slice(0, 6).trim();
    if (!tag) tag = `线${existingTimelines.length}`;

    // 区分信息：取用户接下来的设定阐述
    const description = remainder.length > 5 ? remainder : `由用户创建的「${extractedName}」时间线分支，设定有别于主线。`;

    return {
      triggered: true,
      action: 'create_new',
      newTimelineName: extractedName,
      newTimelineTag: tag,
      initialDescription: description,
    };
  }

  // 3. 检测方括号标签式时间线：【时间线：xxx】 / [时间线A：五年后]
  const bracketMatch = clean.match(
    /[【\[](?:时间线|分支线|IF线|平行线)[：:\s]*(.+?)[】\]]/i
  );
  if (bracketMatch) {
    const rawContent = bracketMatch[1].trim();
    const parts = rawContent.split(/[：:]/);
    const extractedName = rawContent;
    const tag = (parts[0] || rawContent).slice(0, 6).trim();

    // 检查是否已存在同名或同tag的时间线
    const existing = existingTimelines.find(
      (t) => t.name === extractedName || t.tag === tag
    );
    if (existing) {
      return {
        triggered: true,
        action: 'switch_existing',
        targetTimelineId: existing.id,
      };
    }

    return {
      triggered: true,
      action: 'create_new',
      newTimelineName: extractedName,
      newTimelineTag: tag,
      initialDescription: clean.slice(0, 200),
    };
  }

  // 4. 检测常见前缀式："时间线[A-Z0-9]：" / "IF线：" / "平行时间线："
  const prefixMatch = clean.match(
    /^(?:时间线\s*([A-Za-z0-9一二三四五六七八九十]+)|IF线|平行(?:时间线|世界))[：:\s]+(.+)/i
  );
  if (prefixMatch) {
    const tagSuffix = prefixMatch[1] || 'IF';
    const tag = `时间线${tagSuffix}`.slice(0, 6);
    const content = prefixMatch[2]?.trim() || '';
    const name = `时间线 ${tagSuffix}：${content.slice(0, 15)}`;

    const existing = existingTimelines.find((t) => t.tag === tag);
    if (existing) {
      return {
        triggered: true,
        action: 'switch_existing',
        targetTimelineId: existing.id,
      };
    }

    return {
      triggered: true,
      action: 'create_new',
      newTimelineName: name,
      newTimelineTag: tag,
      initialDescription: content || `在时间线 ${tagSuffix} 下的展开情节。`,
    };
  }

  return { triggered: false };
}

/**
 * 随着时间线剧情的发展，自动为该时间线提炼并写入更多区分信息与剧情脉络
 * 确保分类正确、记忆树持续进化
 */
export function enrichTimelineProgression(
  timeline: TimelineBranch,
  userText: string,
  assistantReply: string
): {
  updatedDescription: string;
  updatedPlotSummary: string;
  newMilestones: string[];
} {
  const currentDesc = timeline.description || '';
  const currentSummary = timeline.plotSummary || '';
  const milestones = [...(timeline.keyMilestones || [])];

  // 1. 提炼核心关键情节 (从AI回复中截取有效段落与事件动向)
  const cleanReply = assistantReply.replace(/```[\s\S]*?```/g, '').trim();
  const replyLines = cleanReply
    .split(/[\n。！？]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8 && !s.startsWith('#'));

  const keySentence = replyLines.slice(0, 2).join('；');

  // 2. 检查是否有关键转折词汇或实体动向
  const turningKeywords = [
    '决定',
    '发现',
    '到达',
    '获得',
    '离开',
    '击败',
    '死亡',
    '相遇',
    '结盟',
    '觉醒',
    '穿越',
    '战争',
    '反转',
    '揭开',
  ];
  const hasTurningPoint = turningKeywords.some(
    (kw) => userText.includes(kw) || cleanReply.includes(kw)
  );

  let newMilestone: string | null = null;
  if (hasTurningPoint && keySentence) {
    newMilestone = `【进展】${keySentence.slice(0, 35)}...`;
    if (!milestones.includes(newMilestone)) {
      milestones.push(newMilestone);
    }
  }

  // 3. 增强区分信息 (写入当前环境状态、重要分支因果差异，避免被后续会话混淆)
  const timeStampStr = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 提炼用户本轮输入的核心关切
  const userCore = userText.slice(0, 60).replace(/\n/g, ' ');
  const newPlotSnippet = `[${timeStampStr}] 交互焦点：“${userCore}” → 走向：${keySentence ? keySentence.slice(0, 45) : '剧情继续推进'}。`;

  // 保持 plotSummary 条理清晰，最多保留最近 8 条脉络
  const previousSnippets = currentSummary
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  previousSnippets.push(newPlotSnippet);
  const updatedPlotSummary = previousSnippets.slice(-8).join('\n');

  // 更新区分信息：如果发现新的特征，保留区分设定的持续演进
  let updatedDescription = currentDesc;
  if (milestones.length > 0 && !currentDesc.includes('最新分歧')) {
    updatedDescription = `${currentDesc}\n• 分歧特征沉淀：本分支已发展出独立的因果节点（当前共 ${milestones.length} 个关键里程碑）。`;
  }

  return {
    updatedDescription: updatedDescription.trim(),
    updatedPlotSummary: updatedPlotSummary.trim(),
    newMilestones: milestones.slice(-10),
  };
}

/**
 * 根据后台建立的消息树，定位并重组属于当前时间线分支的上下文脉络
 * "就好像在后台建立了一个消息树，把它们重新定位排列"
 */
export function buildTimelineTreePromptContext(
  activeTimeline: TimelineBranch,
  allTimelines: TimelineBranch[],
  allMessages: ChatMessage[]
): string {
  // 查找父级时间线
  const parentTimeline = activeTimeline.parentId
    ? allTimelines.find((t) => t.id === activeTimeline.parentId)
    : null;

  // 列出其他平行时间线供模型辨析区分
  const otherTimelines = allTimelines.filter((t) => t.id !== activeTimeline.id);
  const otherSection =
    otherTimelines.length > 0
      ? otherTimelines
          .map(
            (t) =>
              `- 分支【${t.name}】(标签: ${t.tag}): ${t.description.slice(0, 60)}`
          )
          .join('\n')
      : '暂无其他平行分支。';

  // 提取属于本分支以及父分支继承来的消息节点
  const activeMessageIds = new Set(activeTimeline.messageIds);
  const branchMessages = allMessages.filter(
    (m) =>
      m.timelineId === activeTimeline.id ||
      activeMessageIds.has(m.id) ||
      (m.role === 'user' && !m.timelineId)
  );

  const recentBranchExchanges = branchMessages.slice(-6).map((m) => {
    const roleName = m.role === 'user' ? '用户' : 'AI';
    const tagInfo = m.timelineTag ? `[${m.timelineTag}] ` : '';
    const content =
      m.role === 'assistant'
        ? (m.versions[m.currentVersionIndex] || m.versions[0])?.content || m.content
        : m.content;
    return `${tagInfo}${roleName}: ${content.slice(0, 100)}`;
  });

  return `
# 【时间线记忆树 · 分支重组上下文】
后台记忆整理引擎已激活，消息已根据时间线树完成重新定位与归类：
- 当前激活分支：【${activeTimeline.name}】（标识标签：${activeTimeline.tag}）
- 节点层级：${parentTimeline ? `分化自父分支【${parentTimeline.name}】` : '根主线节点'}
- 核心区分信息/世界观特征：
  ${activeTimeline.description}
- 本时间线剧情脉络与事件沉淀：
  ${activeTimeline.plotSummary || '本分支剧情初步展开中...'}
${
  activeTimeline.keyMilestones && activeTimeline.keyMilestones.length > 0
    ? `- 关键里程碑：\n  ${activeTimeline.keyMilestones.join('\n  ')}`
    : ''
}

【其他平行时间线（用于对比辨析，请严格保持分立，勿混淆当前剧情事实）】：
${otherSection}

【本分支消息树因果脉络参考（最近节点）】：
${recentBranchExchanges.length > 0 ? recentBranchExchanges.join('\n') : '分支初始节点'}

【AI回复准则】：
1. 确认已看见上述时间线树。请直接在【${activeTimeline.name}】的世界线与因果体系下回复；
2. 尊重本分支的独立特征与剧情发展，绝不与其他平行时间线的状态产生混淆；
3. 随剧情自然发展，保持逻辑连贯与沉浸感。
`;
}
