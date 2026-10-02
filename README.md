```markdown
# WatchWorld · 观界

> 多窗口、多时间线、多模型协同的 AI 工作台

构建世界观。  
管理长期对话。  
探索平行时间线。  
连接任意 AI 模型。

一切都在同一个工作空间完成。

---

## 什么是 WatchWorld

WatchWorld（观界）是一款面向复杂场景设计的 AI 工作台。

传统 AI 聊天工具更适合短期问答，而 WatchWorld 更关注：

- 长周期项目管理
- 多阶段思考与推演
- 世界观构建
- 角色关系分析
- 长篇创作
- 资料沉淀
- 多模型协作

你不仅可以聊天，还可以组织知识、管理分支、保存推演过程，并在不同 AI 模型之间自由切换。

---

# 核心特性

## 🗂️ 多窗口工作流

观界不是单会话聊天工具。

你可以同时维护多个独立工作区：

- 项目规划
- 世界观设计
- 角色档案
- 技术开发
- 长期研究

支持：

- 会话分组
- 快速搜索
- 窗口独立配置
- 独立 Agent
- 独立模型
- 独立 API 参数

每个窗口都拥有自己的上下文、知识库绑定、技能绑定和设定体系。

---

## 🌌 时间线记忆树

传统 AI 聊天只有一条历史记录。

观界支持真正的多分支时间线系统。

```text
通用世界观
├── A1 帝国线
│   ├── A11 战争线
│   └── A12 和平线
├── B1 学院线
└── C1 远征线
```

支持：

- 时间线切换
- 窗口内多分支管理
- 父子分支继承
- IF 世界线推演
- 通用信息共享
- 分支可见性控制
- 编号标签（A1、A12、B1……）
- 描述标签（战争线、学院线……）
- AI 上下文自动重排

不同时间线互不污染，但可以继承共同设定。

特别适合：

- 世界观构建
- RPG / TRPG
- 小说创作
- IF 剧情推演
- 多方案规划
- 长期角色模拟

---

## 🤖 多模型统一接入

支持：

- Google Gemini
- Anthropic Claude
- OpenAI
- DeepSeek
- OpenRouter
- Groq
- Ollama
- 任意 OpenAI-Compatible API

可在同一工作区内自由切换模型。

支持：

- 自动获取模型列表
- 自定义 Base URL
- 自定义请求头
- 中转服务
- 私有部署接口

---

## 👤 Agent 系统

每个会话可绑定独立 Agent。

每个 Agent 拥有：

- 独立系统提示词
- 温度参数
- Top P
- 独立模型
- 标签分类

内置顾问包括：

- 全能主顾问
- 角色心理分析师
- 剧情逻辑审查官
- 世界观设定师
- 对白润色师
- 情感线推演师

也支持完全自定义。

---

## ⚡ Skill 系统

Skill 类似轻量能力模块。

例如：

- 时间线梳理
- 世界观一致性检查
- 角色关系分析
- 深度调研
- 设定文档生成

每个 Skill 都可以自动向模型注入专业能力提示。

---

## 🔌 MCP 服务管理

支持接入 MCP（Model Context Protocol）服务。

可以扩展：

- 文件系统
- 数据库
- 搜索服务
- 自定义工具链

让 AI 获得更多外部能力。

---

## 📚 本地知识库

支持构建个人知识库。

可直接导入：

- TXT
- Markdown
- 项目资料
- 世界观设定
- 参考文档

知识库可以按窗口独立挂载。

AI 会自动获得对应参考信息。

---

## 📖 世界观文档库

专门用于管理：

- 世界观
- 人物档案
- 时间线记录
- 分析报告
- 自定义设定

支持：

- Markdown 编辑
- 文档搜索
- 文件导入
- Prompt 注入

---

## 🧠 Token 优化系统

针对长期对话进行了专门设计。

支持：

### AI 可见范围控制

可限制 AI 看到的历史回答数量：

- 全部历史
- 最新 5 条
- 最新 3 条
- 最新 2 条
- 最新 1 条
- 完全隐藏历史回答

降低 Token 消耗。

### 前文总结

自动将旧对话压缩为结构化摘要。

特点：

- 顺序沉淀
- 不重复总结
- 自动进入系统提示词
- 已总结内容不再发送给模型

### 时间线重排

发送前自动重排上下文：

```text
通用事实
↓
父分支
↓
当前分支
```

在长对话中获得更稳定的上下文效果。

---

## 🖼️ 图片与多模态

支持：

- 图片上传
- 图片拖入
- 截图粘贴
- 自动压缩
- 图片历史管理

兼容：

- Gemini Vision
- Claude Vision
- OpenAI Vision

图片保存在 IndexedDB 中，不占用 LocalStorage 配额。

并且支持：

- 仅发送一轮
- 保留历史上下文

两种模式。

---

## ☁️ WebDAV 跨设备同步

支持：

- 坚果云
- Nextcloud
- Alist
- NAS
- 自建 WebDAV

采用增量同步架构。

```text
index.json
windows/
media/
```

仅同步变化内容。

支持：

- 会话同步
- 图片同步
- 自动同步
- 手动同步

---

## 🎨 可定制主题

内置主题：

- Emerald
- Blue
- Violet
- Rose
- Amber
- Cyan
- Midnight

支持：

- 深色模式
- 浅色模式
- 移动端优化界面

---

## 📱 PWA 应用化

支持：

- 添加到主屏幕
- 离线启动
- Service Worker 缓存
- 类原生体验

无需安装额外客户端即可使用。

---

# 技术架构

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## Backend

- Node.js
- Express

## Storage

- LocalStorage
- IndexedDB

## Sync

- WebDAV

## Supported Providers

- Gemini
- Claude
- OpenAI
- DeepSeek
- OpenRouter
- Groq
- Ollama

---

# 快速开始

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

启动服务：

```bash
npm start
```

---

# 环境变量

创建：

```bash
cp .env.example .env
```

配置：

```env
GEMINI_API_KEY=your_key

ACCESS_TOKEN=your_token

HOST=127.0.0.1

PORT=3000
```

---

# Roadmap

## 已完成

- 多 Provider 支持
- Agent 系统
- Skill 系统
- MCP 管理
- 时间线记忆树
- 分支重排
- 知识库
- 世界观文档库
- 图片支持
- 前文总结
- WebDAV 增量同步
- PWA

## 计划中

- Tauri 桌面版
- 更完整的 MCP 工作流
- Agent 自动协作系统
- 世界书生态集成
- 多用户协作

---

# License

MIT License
```