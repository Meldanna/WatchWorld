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

  // 0. Timeline Memory Context Reaction
  if (timelineContextPrompt && (timelineContextPrompt.includes('当前激活分支') || query.includes('时间线') || query.includes('IF线'))) {
    // Extract current branch name from prompt if present
    const branchMatch = timelineContextPrompt.match(/当前激活分支：【(.+?)】/);
    const branchName = branchMatch ? branchMatch[1] : '当前分支';
    const tagMatch = timelineContextPrompt.match(/标识标签：(.+?)）/);
    const tag = tagMatch ? tagMatch[1] : '时间线';

    return `⏱️ **【已锁定时间线分支 · 记忆树共鸣】**
🏷️ **当前时间线**：\`${branchName}\` (标签: \`${tag}\`)

收到关于此时间线的输入：“${query}”

在该分支的因果脉络中，历史已被重新定位与归类：
1. **分支现实确立**：当前对话与事件均属于「${branchName}」时间线独立推演，绝不与主线或其他平行分支混淆；
2. **剧情推进**：你的决策已在该分支的记忆树中生长出新的节点。关键因果链与区分信息已被记忆整理器沉淀；
3. **后续走向**：你可以继续在本时间线深入探索剧情，或随时通过显式说明开启一条新的平行时间线！`;
  }

  // 1. Skill Triggered Responses
  if (triggeredSkills.length > 0) {
    const activeSkill = triggeredSkills[0];

    if (activeSkill.id === 'skill-web-research') {
      return `⚡ **已激活 Skill**：【${activeSkill.name}】
🔌 **调用工具**：\`web_search\` 实时检索协议

经过网络多源检索与交叉核验，为您总结如下要点：
1. **核心态势**：针对「${query}」，最新行业共识已形成标准化规范；
2. **多方印证**：
   - 官方权威源：已于近期发布新一代交互与协议标准；
   - 社区实践：开发者反馈架构解耦后吞吐量提升约 35%；
3. **时效性提示**：数据已更新至最新状态，建议结合你的实际业务场景灵活落地。`;
    }

    if (activeSkill.id === 'skill-code-debugger') {
      return `⚡ **已激活 Skill**：【${activeSkill.name}】
🔍 **代码诊断排查结果**：

针对你提出的异常描述：\`${query}\`

1. **错误诱因定位**：
   - 变量在异步闭包解析前已被重置或存在并发竞争条件（Race Condition）。
2. **根因剖析**：
   - 未在状态变更点执行不可变副本浅拷贝，导致引用污染；
3. **修复示例代码**：
\`\`\`typescript
// 优化后的防御性处理
try {
  const sanitizedInput = Object.freeze({ ...rawPayload });
  await processSafely(sanitizedInput);
} catch (error: any) {
  console.error('[Diagnostic] Catch boundary trapped:', error?.message);
}
\`\`\`
4. **防御建议**：为核心边界加装 TypeScript 判空断言与自动化单元测试。`;
    }

    if (activeSkill.id === 'skill-doc-generator') {
      return `⚡ **已激活 Skill**：【${activeSkill.name}】

这是为您生成的结构化架构设计与 API 规约：

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as 移动端用户
    participant App as 观界系统
    participant MCP as MCP Server
    participant Model as 语言模型

    User->>App: 发送消息指令
    App->>MCP: 匹配工具与知识库检索
    MCP-->>App: 返回 Context Payload
    App->>Model: 组合 System Prompt 注入推演
    Model-->>User: 逐字流式打字回显
\`\`\`

**接口契约规范**：
- **URI**: \`/api/v1/sessions/dispatch\`
- **Method**: \`POST\`
- **Status**: \`200 OK (application/json)\``;
    }

    if (activeSkill.id === 'skill-math-calc') {
      return `⚡ **已激活 Skill**：【${activeSkill.name}】
🧮 **逐步严格推演过程**：

针对问题：**"${query}"**

1. **设立公式模型**：
   设自变量 $x$ 为基础基准，$r$ 为步进速率；
2. **代入数据逐步计算**：
   - 第一步：标准化数值边界，剔除异常干扰项；
   - 第二步：计算复合增益 $\\Delta = x \\times (1 + r)^t$；
   - 第三步：双向反验，误差范围 $\\epsilon < 10^{-6}$。
3. **确定性结论**：推演结果严格可信，杜绝数字幻觉。`;
    }
  }

  // 2. Knowledge Base Matching
  const matchingDocs = knowledgeBase.filter(
    (k) =>
      k.enabled &&
      (query.includes(k.title) ||
        k.tags.some((t) => query.includes(t)) ||
        k.content.toLowerCase().includes(lower))
  );

  if (matchingDocs.length > 0) {
    const doc = matchingDocs[0];
    return `📚 **检索自已连接的知识库**：《${doc.title}》\n\n${doc.content}\n\n💡 提示：该内容直接根据你连接的知识库提供事实依据。`;
  }

  // 3. MCP Server status inquiry
  if (lower.includes('mcp') || lower.includes('工具') || lower.includes('tool')) {
    const serverList = connectedMcp
      .map((s) => `- **${s.name}** (${s.type}): 包含工具 [${s.tools.map((t) => t.name).join(', ')}]`)
      .join('\n');

    return `🔌 **当前活跃的 MCP (Model Context Protocol) 状态**：

${serverList || '暂无已连接的 MCP 服务器，点击底部「MCP」或右上角菜单可快速配置。'}

**MCP 支持能力**：
- 支持 **SSE 实时流协议** 与 **本地 Stdio 命令行服务**；
- 赋予 AI 大模型读写文件、访问本地数据库、调用网络检索等真实行动力！`;
  }

  // 4. Role-specific intelligence replies
  if (agent.id === 'agent-coder') {
    return `收到！我以「${agent.name}」的身份为你进行技术解答：

针对你的需求：**"${query}"**

\`\`\`typescript
export interface ITaskContext {
  id: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export async function executeOperation(context: ITaskContext): Promise<void> {
  // 1. 校验输入状态与断言
  // 2. 状态原子性流转
  console.log('[System] Executed successfully:', context.id);
}
\`\`\`

**技术建议**：
1. 模块边界清晰，遵循单一职责原则；
2. 为核心路径添加容灾降级机制；
3. 可以点击本回答底部的 **「Roll分支」** 获取另一套架构思路。`;
  }

  if (agent.id === 'agent-writer') {
    return `这是为您提炼润色的版本：

> **“${query}”**

✨ **【优化方案 A · 精准干练】**
“去除冗杂修辞，直击核心痛点，使读者在数秒内把握核心主旨与行动呼吁。”

✨ **【优化方案 B · 文艺雅致】**
“春风化雨，行云流水，在字里行间融注叙事共鸣，留给读者持久的回味空间。”

（注：您可以点击本条回答底部的 **「Roll分支」** 切换生成长文方案）`;
  }

  // 5. Default Omni Agent response
  return `你好！我已经接收到你的消息：

> **"${query}"**

当前处于 **「全功能智能模拟模式」**，已为你准备就绪以下高级特性：
- ☀️ **白底清新模式**：点击顶部导航栏右上角的 **太阳/月亮图标** 即可在黑白底色间无缝切换；
- 🔌 **MCP 协议服务器**：点击底栏「MCP」可管理和连接 SSE / Stdio 外部工具；
- ⚡ **Agent Skills 技能系统**：在「Skill」面板中开启或添加你的自定义技能，触发关键词时自动激活特化提示词；
- 📚 **本地知识库**：随时挂载专属文档进行 RAG 参考；
- 🎲 **Roll AI 分支**：点击下方的「Roll分支」生成多版本回答，无损回溯！

有什么具体任务需要我为你处理吗？`;
}
