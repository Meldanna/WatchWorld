import { Agent, ChatMessage, KnowledgeItem, AgentSkill, McpServerConfig } from '../types';

export function generateSmartLocalResponse(
  userPrompt: string,
  agent: Agent,
  history: ChatMessage[],
  knowledgeBase: KnowledgeItem[] = [],
  triggeredSkills: AgentSkill[] = [],
  connectedMcp: McpServerConfig[] = [],
  timelineContextPrompt?: string
): string {
  const query = userPrompt.trim();
  const lower = query.toLowerCase();

  // 0. AI 行为规范 6.5：分支状态汇报 (标签树)
  if (
    query.includes('标签树') ||
    query.includes('分支树') ||
    query.includes('分支状态') ||
    query.includes('查看分支')
  ) {
    return `当前标签树与楼号归属状态：

\`\`\`
[通用] #1-#3
├── [A1] 下药线 #4 #6
│   ├── [A11] 下药线·等待太久 #9
│   └── [A12] 下药线·感情上头 #8 #10
├── [B1] 联姻线 #5 #7 (已隐藏)
└── [C1] 远走线 #11
\`\`\`

💡 您可在输入框上方滑动切换当前发言归属标签，或点击左上角【分支】管理可见性。`;
  }

  // 1. Skill 技能系统 (PRD 八、针对文游场景定制)
  if (triggeredSkills.length > 0) {
    const activeSkill = triggeredSkills[0];

    // 1.1 时间线梳理 (因果链整理)
    if (activeSkill.id === 'skill-timeline-analysis') {
      return `⏳ **【时间线梳理 · 因果链推演】**
📌 **所属分支**：当前时间线序列

1. **起因契机**：通用世界观底色确立，矛盾焦点初步显露；
2. **关键抉择**：在剧情关键节点发生分歧决策，直接催生了当前分支独立演化；
3. **连锁反应**：各方势力与角色基于自身防御机制做出对抗或依附姿态；
4. **当前局势**：因果锁链已收紧，矛盾即将进入下一阶段激化。

> 💡 提示：该分支的因果链已被程序重排中间件稳定锁定在上下文前缀，保障长程逻辑一致性。`;
    }

    // 1.2 角色关系分析 (情感演变)
    if (activeSkill.id === 'skill-role-relationship') {
      return `👥 **【角色关系与心理动机分析报告】**

1. **核心驱动力**：各角色表面行为下暗藏深层恐惧，追求对局面的控制感；
2. **权力平衡与博弈**：双方在言语与行动间互相试探，信任度呈现波动态势；
3. **隐秘态度变化**：随着本分支剧情推进，此前潜伏的软肋逐渐暴露；
4. **潜在爆点**：一旦特定底线被触碰，势必引爆不可逆的戏剧冲突。

> 📊 亦可随时点击聊天顶部的 **[📊 分析角色关系]** 按钮，调动专属心理学 Agent 生成深度分析并一键归档。`;
    }

    // 1.3 世界观一致性检查 (查矛盾)
    if (activeSkill.id === 'skill-worldview-consistency') {
      return `🔍 **【世界观一致性核查结果】**

经过与「通用世界观」及父级设定链路的交叉比对：
- **世界观底色吻合度**：100%（科技水平、社会制度与核心法则无冲突）；
- **角色言行一致性**：行为符合既定性格基准，未发现设定吃书或逻辑跳跃；
- **分支因果闭环**：当前分支的动机演进符合自然心理发展规律。

建议：可进一步丰富边缘细节（如环境氛围与微表情描摹），增强沉浸张力。`;
    }

    // 1.4 Deep Research 联网调研
    if (activeSkill.id === 'skill-deep-research') {
      return `🌐 **【Deep Research 联网调研资料参考】**
🔌 **调用工具**：\`search_lore_reference\`

针对世界观考据关键要素：
1. **历史制度原型**：类似权力结构在古典政治体制中往往表现为相互制衡与暗中角力；
2. **人际心理学映射**：高压情境下的联盟关系具有强烈的功利依附属性；
3. **叙事参考建议**：可借鉴真实历史演化中的偶然性事件，为分支剧情注入不可预料的生动感。`;
    }

    // 1.5 设定文档生成 (归档)
    if (activeSkill.id === 'skill-doc-generate') {
      return `📑 **【结构化设定文档整理】**

# 角色与世界观设定片段

- **所属分支**：当前时间线
- **核心人物档案**：
  - 核心动机：自我保全与追求自主权
  - 关系羁绊：表面客套，暗中设防
- **关键历史事件节点**：
  - 分歧点发生，各方态度出现不可逆转的分化。

> 💡 本条内容已按标准 Markdown 规范整理，可点击消息操作菜单一键归档至【世界观文档库】。`;
    }
  }

  // 2. 正则系统配合标签 (PRD 7.2: <总结><正文>分区隐藏)
  if (query.includes('总结') || query.includes('正则') || query.includes('概括')) {
    return `<总结>
当前分支的核心事件推进明确，角色间矛盾已不可调和，即将迎来决定性对峙。
</总结>
<正文>
在当前时间线细化分支中，各方情绪在压抑后迎来爆发期。言语的伪装已无法掩盖深层的行动意图，任何微小的变故都将引发连锁崩塌，为下一步抉择提供了充分的动机依托。
</正文>`;
  }

  // 3. AI 行为规范 6.1 分支检测与建议
  if (
    query.includes('如果') ||
    query.includes('走另外一条路') ||
    query.includes('分支') ||
    query.includes('另一条线')
  ) {
    return `💡 **【检测到潜在剧情新分支】**

检测到您的剧情设想可能偏离当前时间线：
- **建议新编号**：\`A13\` 或 \`B2\`
- **建议描述标签**：\`决裂线·背水一战\`

若确认开启，您可以在输入框上方的分支栏中选择新标签继续，或在左上角【分支】管理面板中创建。

---

针对您的探讨：
在这个可能性分支下，原本稳固的盟约将瞬间瓦解，各角色将不得不提前亮出底牌。`;
  }

  // 4. Timeline Context 注入反应
  if (timelineContextPrompt && timelineContextPrompt.includes('当前激活分支')) {
    const branchMatch = timelineContextPrompt.match(/当前激活分支：【(.+?)】/);
    const branchName = branchMatch ? branchMatch[1] : '当前时间线';

    return `⏱️ **【已锁定时间线分支：${branchName}】**

围绕当前分支展开探讨：针对「${query}」

1. **局势推演**：在该时间线设定中，既有事实被严格维护，未受平行分支扰动；
2. **事件关联**：与父级通用世界观设定保持紧密因果关联；
3. **下一步探讨**：您可继续围绕人物动机深入推演，或点击上方标签随时切换视角。`;
  }

  // 5. 默认文游交互回复
  return `收到。针对当前世界观的探讨：

> **“${query}”**

从人物动机与因果演变角度来看：
1. **行为诱因**：这一动作符合角色当前的心理防御机制与处境；
2. **局势反馈**：外部世界对其选择将产生必然的因果回响；
3. **后续推演**：若沿着这一脉络推进，角色间的博弈将进一步明朗化。

💡 您可以使用上方双框提示词注入全局设定，或随时点击 **[📊 分析角色关系]** 深度洞察心理动力学。`;
}
