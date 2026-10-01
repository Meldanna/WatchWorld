import { TimelineBranch, ChatMessage, ChatSession } from '../types';

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
    name: '通用世界观',
    tag: '通用',
    codeTag: '通用',
    descriptionTag: '通用世界观',
    visible: true,
    color: 'indigo',
    description: '核心共享世界观与通用事实设定。所有分支均继承此通用基础。',
    plotSummary: '世界观基石由此展开，通用信息在所有分支共享。',
    keyMilestones: ['世界观核心基石建立'],
    messageIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * 4.3 编号标签分配算法
 * 自动分配类似 A1、A12、B1、B2 的编号标签，确保不重复且具备层级关系
 */
export function allocateTimelineCodeTag(
  existingTimelines: TimelineBranch[],
  parentBranch?: TimelineBranch
): string {
  const existingCodes = new Set(
    existingTimelines.map((t) => t.codeTag).filter(Boolean) as string[]
  );

  if (!parentBranch || parentBranch.id === DEFAULT_MAIN_TIMELINE_ID || parentBranch.codeTag === '通用') {
    // 根分支：分配 A1, B1, C1...
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      let num = 1;
      while (existingCodes.has(`${letter}${num}`)) {
        num++;
      }
      return `${letter}${num}`;
    }
    return `T${existingTimelines.length}`;
  }

  // 子分支：基于父分支分配（例如 A1 -> A11, A12, A13...）
  const parentCode = parentBranch.codeTag || 'A1';
  let subIndex = 1;
  while (existingCodes.has(`${parentCode}${subIndex}`)) {
    subIndex++;
  }
  return `${parentCode}${subIndex}`;
}

/**
 * 五、消息重排中间件（纯程序逻辑，不调用AI，不消耗 Token）
 *
 * function 重排(当前分支, 所有消息) {
 *   1. 读取用户当前所在分支编号
 *   2. 从该分支向上回溯标签树，收集整条链路：A12 → A1 → 通用
 *   3. 检查链路上每个分支的可见性，跳过隐藏的
 *   4. 取出可见分支的所有消息
 *   5. 按标签树层级排列：通用 → 父分支 → 子分支
 *   6. 同层级内按楼号升序
 *   7. 当前分支的消息放在最末尾
 *   8. 输出重排后的消息序列发送给AI
 * }
 */
export function rearrangeMessagesForAi(
  currentBranch: TimelineBranch | undefined,
  allTimelines: TimelineBranch[],
  allMessages: ChatMessage[]
): ChatMessage[] {
  if (!allMessages || allMessages.length === 0) return [];
  if (!currentBranch) return [...allMessages];

  // 1. 回溯收集链路：从当前分支向上查找 parentId 直到通用根节点
  const chain: TimelineBranch[] = [];
  const visited = new Set<string>();
  let cur: TimelineBranch | undefined = currentBranch;

  while (cur && !visited.has(cur.id)) {
    visited.add(cur.id);
    chain.unshift(cur); // 将父级放在前面：[根, 父, 当前]
    if (cur.parentId && cur.parentId !== cur.id) {
      cur = allTimelines.find((t) => t.id === cur!.parentId);
    } else {
      break;
    }
  }

  // 如果链条中没有通用根主线，确保通用主线在最前
  const mainBranch = allTimelines.find((t) => t.id === DEFAULT_MAIN_TIMELINE_ID || t.codeTag === '通用');
  if (mainBranch && !visited.has(mainBranch.id)) {
    chain.unshift(mainBranch);
  }

  // 2. 检查链路上每个分支的可见性，跳过隐藏的分支（visible === false）
  const visibleChain = chain.filter((b) => b.visible !== false);
  const visibleBranchIds = new Set(visibleChain.map((b) => b.id));
  const branchHierarchyOrder = new Map<string, number>();
  visibleChain.forEach((b, index) => {
    branchHierarchyOrder.set(b.id, index);
  });

  // 3. 取出属于可见分支或通用的消息
  const includedMessages = allMessages.filter((m) => {
    // 通用消息默认所有分支共享
    if (m.isCommon || m.codeTag === '通用' || m.timelineId === DEFAULT_MAIN_TIMELINE_ID) {
      return true;
    }
    if (!m.timelineId) return true; // 未分配分支的旧消息视为通用
    return visibleBranchIds.has(m.timelineId);
  });

  // 4. 排序：通用 -> 父分支 -> 子分支 -> 当前分支（同层级内按 floorNumber 递增升序）
  const currentBranchId = currentBranch.id;

  const sortedMessages = [...includedMessages].sort((a, b) => {
    const isCurrentA = a.timelineId === currentBranchId;
    const isCurrentB = b.timelineId === currentBranchId;

    // 当前分支的消息排在最末尾 (PRD 5.3 规则7)
    if (isCurrentA && !isCurrentB) return 1;
    if (!isCurrentA && isCurrentB) return -1;

    // 按链路层级排列
    const orderA = branchHierarchyOrder.get(a.timelineId || '') ?? 0;
    const orderB = branchHierarchyOrder.get(b.timelineId || '') ?? 0;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 同层级内按楼号升序 (PRD 5.3 规则6)
    const floorA = a.floorNumber ?? 0;
    const floorB = b.floorNumber ?? 0;
    if (floorA !== floorB) {
      return floorA - floorB;
    }

    return (a.timestamp || 0) - (b.timestamp || 0);
  });

  return sortedMessages;
}

/**
 * 格式化发给 AI 的消息上下文，带有楼号与双标签 (PRD 5.4)
 * 示例：[A1·下药线] #4 决定下药
 */
export function formatMessageWithFloorAndTag(
  message: ChatMessage,
  allTimelines: TimelineBranch[]
): string {
  const content =
    message.role === 'assistant'
      ? (message.versions[message.currentVersionIndex] || message.versions[0])?.content || message.content
      : message.content;

  const floorPrefix = message.floorNumber ? `#${message.floorNumber}` : '';
  const timeline = allTimelines.find((t) => t.id === message.timelineId);

  let tagDisplay = '通用';
  if (message.codeTag) {
    tagDisplay = message.descriptionTag
      ? `${message.codeTag}·${message.descriptionTag}`
      : message.codeTag;
  } else if (timeline) {
    const code = timeline.codeTag || timeline.tag || '通用';
    const desc = timeline.descriptionTag || timeline.name || '';
    tagDisplay = desc && desc !== code ? `${code}·${desc}` : code;
  }

  return `[${tagDisplay}] ${floorPrefix} ${content}`.trim();
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
 */
export function detectTimelineIntent(
  text: string,
  existingTimelines: TimelineBranch[]
): TimelineDetectionResult {
  const clean = text.trim();
  if (!clean) return { triggered: false };

  // 1. 用户输入编号直接切换（例如输入 "A12"、"切到A1"、"进入B1"）
  for (const t of existingTimelines) {
    if (t.codeTag && clean.toUpperCase() === t.codeTag.toUpperCase()) {
      return {
        triggered: true,
        action: 'switch_existing',
        targetTimelineId: t.id,
      };
    }

    const escapedTag = (t.codeTag || t.tag).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    const nameMatch = remainder.match(/^(?:叫|名为|称作|：|:)?\s*([^\s,，。]+)/);
    const branchName = nameMatch ? nameMatch[1] : remainder.slice(0, 15) || '新时间线';
    return {
      triggered: true,
      action: 'create_new',
      newTimelineName: branchName,
      newTimelineTag: branchName.slice(0, 4),
      initialDescription: remainder || '根据用户意图开启的新世界观时间线。',
    };
  }

  // 3. 检测方括号标签声明：【时间线：xxx】
  const bracketTagRegex = /[【\[](?:时间线|分支|IF线)[：:\s]*([^】\]]+)[】\]]/i;
  const bracketMatch = clean.match(bracketTagRegex);
  if (bracketMatch) {
    const rawName = bracketMatch[1].trim();
    const existing = existingTimelines.find(
      (t) => t.name === rawName || t.tag === rawName || t.codeTag === rawName
    );
    if (existing) {
      return {
        triggered: true,
        action: 'switch_existing',
        targetTimelineId: existing.id,
      };
    } else {
      return {
        triggered: true,
        action: 'create_new',
        newTimelineName: rawName,
        newTimelineTag: rawName.slice(0, 4),
        initialDescription: `通过标签【${rawName}】明确创建的新时间线。`,
      };
    }
  }

  return { triggered: false };
}

/**
 * 伴随对话自然推进，丰富时间线的区分描述与关键里程碑
 */
export function enrichTimelineProgression(
  branch: TimelineBranch,
  userMessage: string,
  aiReply: string
): {
  updatedDescription: string;
  updatedPlotSummary: string;
  newMilestones: string[];
} {
  const currentDesc = branch.description || '';
  const currentPlot = branch.plotSummary || '';
  const milestones = [...(branch.keyMilestones || [])];

  const milestoneKeywords = ['决定', '导致', '发现', '改变', '爆发', '杀死', '揭开', '建立'];
  for (const kw of milestoneKeywords) {
    if (userMessage.includes(kw) || aiReply.includes(kw)) {
      const sentence = (userMessage.length < 50 ? userMessage : aiReply)
        .split(/[。！？\n]/)
        .find((s) => s.includes(kw));
      if (sentence && sentence.trim().length > 4) {
        const cleanSnippet = sentence.trim().slice(0, 36);
        if (!milestones.includes(cleanSnippet)) {
          milestones.push(cleanSnippet);
          break;
        }
      }
    }
  }

  const previousSnippets = currentPlot ? currentPlot.split('\n') : [];
  const latestExchangeSummary = `用户: ${userMessage.slice(0, 30)}... | 回复: ${aiReply.slice(0, 35)}...`;
  previousSnippets.push(latestExchangeSummary);
  const updatedPlotSummary = previousSnippets.slice(-8).join('\n');

  let updatedDescription = currentDesc;
  if (milestones.length > 0 && !currentDesc.includes('关键里程碑')) {
    updatedDescription = `${currentDesc}\n• 本分支因果节点（当前共 ${milestones.length} 个关键里程碑）。`;
  }

  return {
    updatedDescription: updatedDescription.trim(),
    updatedPlotSummary: updatedPlotSummary.trim(),
    newMilestones: milestones.slice(-10),
  };
}

/**
 * 构建发给 AI 的时间线系统背景树提示
 */
export function buildTimelineTreePromptContext(
  activeTimeline: TimelineBranch,
  allTimelines: TimelineBranch[],
  allMessages: ChatMessage[]
): string {
  const parentTimeline = activeTimeline.parentId
    ? allTimelines.find((t) => t.id === activeTimeline.parentId)
    : null;

  const otherTimelines = allTimelines.filter((t) => t.id !== activeTimeline.id && t.visible !== false);
  const otherSection =
    otherTimelines.length > 0
      ? otherTimelines
          .map(
            (t) =>
              `- 分支【${t.codeTag || t.tag}·${t.descriptionTag || t.name}】: ${t.description.slice(0, 60)}`
          )
          .join('\n')
      : '暂无其他可见平行分支。';

  return `
# 【时间线记忆树 · 分支重组上下文】
后台记忆整理中间件已自动重排：
- 当前激活分支：【${activeTimeline.codeTag || activeTimeline.tag} · ${activeTimeline.descriptionTag || activeTimeline.name}】
- 分支层级溯源：${parentTimeline ? `分化自父分支【${parentTimeline.codeTag || parentTimeline.tag}·${parentTimeline.descriptionTag || parentTimeline.name}】` : '根主线节点（通用）'}
- 核心区分信息/世界观特征：
  ${activeTimeline.description}
- 本时间线因果剧情沉淀：
  ${activeTimeline.plotSummary || '本分支剧情展开中...'}

【其他可见平行时间线（用于对比辨析，保持分立，切勿混淆事实）】：
${otherSection}

【AI回复规范 (PRD 六)】：
1. 你的回复必须严格基于当前时间线【${activeTimeline.codeTag || activeTimeline.tag}】的因果发展；
2. 若用户提出开启新分歧线，请在回复末尾主动提议新分支标签建议（如：新分支建议 [A12·下药线·感情上头]）；
3. 若用户需要总结与正文分离，可用 <总结>概括</总结> 与 <正文>详情</正文> 标签包裹，配合正则系统精简历史 Token。
`;
}
