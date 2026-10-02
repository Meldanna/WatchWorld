# 观界 · 交接文档

> 用途：新会话开工前先读这里。记录已完成内容、待办任务与踩过的坑。
> 项目根目录：`E:\WatchWorld\WatchWorld\`（React 18 + TS + Vite + Tailwind，服务端 `server.ts`）

---

## 一、当前状态

`npx tsc --noEmit` 零错误，`npm run build` 通过。

### 本轮已完成

| # | 内容 | 主要文件 |
|---|---|---|
| 1 | **修复 Agent Modal 白屏** | `AgentModal.tsx`、`storage.ts`、`defaultData.ts`、新增 `ErrorBoundary.tsx` |
| 2 | **修复全文搜索首次打开渲染失败** | `SearchModal.tsx` |
| 3 | **全局 / 窗口 / 弹窗三层功能分离** | `Header.tsx`、`ChatInput.tsx`、`WindowFunctionPanel.tsx`、`SidebarDrawer.tsx` |
| 4 | **窗口 API 参数独立**（温度/topP/topK/重复惩罚/话题惩罚/最大输出） | 新增 `WindowApiParamsModal.tsx`、`api.ts`、`server.ts` |
| 5 | **修复后端丢失参数**（topP 从未被解构；温度 0 被强制成 0.7） | `server.ts` |
| 6 | **Agent 扩到 7 个内置顾问** | `defaultData.ts` |
| 7 | **本窗口文本导入 / 导出** | 新增 `SessionTextModal.tsx` |
| 8 | **前文总结**（可配提示词与模型、不重复、推入系统提示词、已总结楼层不再发送） | 新增 `SummaryModal.tsx`、`App.tsx` |
| 9 | **输入框图片**（IndexedDB 存储、自动压缩、粘贴、上下文开关） | 新增 `imageStore.ts`、`ChatInput.tsx`、`MessageItem.tsx` |
| 10 | **知识库 / 世界观文档支持上传本地文件** | `KnowledgeBaseModal.tsx`、`DocumentModal.tsx` |
| 11 | **WebDAV 增量同步**（按窗口/图片分文件、防抖上传、定时兜底、按窗口拉取） | 新增 `syncEngine.ts`、扩展 `webdavSync.ts`、`App.tsx` |
| 12 | **PWA 化**（可添加到主屏幕、离线开壳） | 新增 `public/`（4 图标 + `manifest.webmanifest` + `sw.js`）、`scripts/gen-icons.mjs`、`index.html`、`main.tsx` |

### 已完成但**未做运行时验证**的部分

- 图片在浏览器里的选图 / 粘贴 / 压缩（需要 `browser_file_upload`，属高危操作未执行）
- Gemini 分支的多模态格式（走 SDK，不经可拦截的 HTTP 层，无法用 echo server 抓包）
- PWA 的**「添加到主屏幕」安装提示**与 iOS 上的 `apple-touch-icon` 实际显示（需 HTTPS + 手机上人工点一次，无法在本机 Playwright 里触发）
- PWA 离线开壳**已验证**（做法见下方「验证手法」），但只在 Edge 桌面端验过；手机端同样要 HTTPS

---

## 二、待办任务（新窗口继续）

> 任务 2（PWA 化）已完成，见上表第 12 行。设计取舍与踩坑记在「三、知识点」。

### 任务 4：Tauri 桌面打包

**⚠️ 本机没有 Rust 工具链**（`cargo` / `rustc` 均未安装）。只能搭工程、给步骤，**无法在此编译验证**。

前置：安装 Rust（https://rustup.rs）+ 系统依赖（Windows 需 WebView2，通常系统已带）。

要做的事：

1. `npm i -D @tauri-apps/cli @tauri-apps/api` + `npx tauri init`
2. **关键抉择**：`server.ts` 承担三件事（提供页面、持有 API Key、代理 WebDAV 绕 CORS）。Tauri 打包后没有 Node 进程，必须二选一：
   - **方案 A（推荐，改动小）**：把后端逻辑改写成 Tauri command（Rust），或作为 sidecar 打包 Node
   - **方案 B（最快）**：App 直连各家 API —— 会丢 CORS 绕行能力，浏览器端 key 也暴露，**不推荐**
3. `tauri.conf.json` 配置：窗口尺寸、图标、`bundle.targets`
4. 开机自启 / 系统托盘按需加

**建议**：先验证 PWA 够不够用，再决定是否上 Tauri。

### 其他遗留

- `/api/chat` 是**无认证的开放代理**。仅本机使用无妨；一旦部署到公网（NAS/VPS），任何人可拿它当中转站，若配了 `GEMINI_API_KEY` 会直接烧额度。上公网前必须加访问令牌。
- 设置面板 WebDAV 页仍写着「数据变动时自动防抖同步」等旧描述，已与新的增量实现不完全对应，可更新文案。
- `SettingsModal` 的 WebDAV 页可加：同步状态显示、上次同步时间、手动「立即同步」按钮。

---

## 三、知识点 / 踩过的坑

### React

**Hook 必须在任何条件 return 之前。** 这是白屏 bug 的根源类别：

```tsx
if (!isOpen) return null;          // ← 条件 return
const results = useMemo(...)        // ← Hook 在其后，报错
```

`isOpen` 由 false 变 true 时 hook 数量从 1 变 2，React 抛
"Rendered more hooks than during the previous render"。**全项目排查过一次，只有 `SearchModal` 犯这错；新写弹窗务必把 Hook 放最上面。**

**必须包 ErrorBoundary。** 没有它，任意子组件渲染期抛错会让 React 卸载整棵树 → 整页白屏、必须刷新。现已包两层：全局（`main.tsx`）+ 弹窗区（`App.tsx`）。

### TypeScript / 数据

**可选字段要用 `?? []` 兜底。** `Agent.tags` 声明为 `tags?: string[]`，但 `DEFAULT_AGENTS` 里没写 → `agent.tags.map()` 直接崩。内部数据也要防御。

**新增内置数据要写入迁移逻辑。** `storage.getAgents()` 会把 `DEFAULT_AGENTS` 里用户 localStorage 缺少的条目补进去。新增内置 Agent 时必须走这条路，否则老用户看不到。注意别重复插入。

**localStorage 满会静默失败。** `safeSet` 捕获异常后只 `console.error`，**不抛错**。图片若放 localStorage，一张手机照 2-5MB 就会把**整个聊天记录**的持久化一起拖垮。所以图片走 IndexedDB（`imageStore.ts`），文本配置留 localStorage。

### 请求链路

**系统提示词 →
上游的映射（三家用三种方式，别记混）：**

| Provider | 上游格式 |
|---|---|
| OpenAI 系（openai/custom/deepseek/openrouter/groq/ollama） | `messages[0] = { role: "system", content }` |
| Claude | 顶层 `system` 字段，**不在 messages 里** |
| Gemini | SDK `config.systemInstruction` |

图片同理：OpenAI 是 `content: [{type:"text"},{type:"image_url"}]`，Claude 是 `content: [{type:"text"},{type:"image",source:{type:"base64",...}}]`，Gemini 是 `parts:[{inlineData}]`。

**总结省钱的关键是「减」不是「加」。** 只把总结塞进系统提示词、却仍把原文发过去，等于总结和原文各发一份，**token 不减反增**。必须同时用 `lastSummarizedFloor` 把已总结楼层从发送内容里**剔除**（UI 仍完整显示）。见 `App.tsx` 的 `dropSummarizedFloors`。

**`Number(x) || 默认值` 会吃掉合法的 0。** 温度设 0（追求确定性）会被判为未设置而回退 0.7。改用 `Number.isFinite` 判断，见 `server.ts` 的 `num()`。

### WebDAV / 坚果云

- 地址：`https://dav.jianguoyun.com/dav/`
- **必须用「应用专用密码」**，不是登录密码
- `MKCOL` 建目录，**目录已存在返回 405**（不是错误，要忽略）
- 免费版有流量与请求频率限制 → **防抖 + 增量上传是必需，不是优化**
- 目录结构：`<root>/index.json`（清单）、`<root>/windows/<id>.json`、`<root>/media/<id>.json`

**增量同步能工作的前提：`updateCurrentSession` 会 bump `updatedAt`。** 否则 `pushChanges` 永远认为「无改动」。若以后新增别处的会话写入口（如直接 `setSessions`），记得同步维护 `updatedAt`。

### PWA / Service Worker

- **SW 只在 HTTPS 或 localhost 下能注册。** 手机用 `http://<局域网IP>:3000` 访问时，图标/manifest 都在、但 SW 静默不注册（离线能力没有）。手机要用就必须上 HTTPS。
- **`/api/*` 绝不能进缓存。** 聊天与 WebDAV 代理都是实时数据，缓存住会出现「发消息回的是上一次答复」这类怪象。`sw.js` 对 `/api/` 直接 `return`（不调 `respondWith`），完全交给网络。
- **dev 下不注册 SW。** `main.tsx` 用 `import.meta.env.PROD` 拦住；否则 SW 会缓存住模块，改代码看不到效果（等于把 HMR 挡在门外）。
- **没做「新版本提示 / skipWaiting」也已经能自动更新。** 导航是 network-first，每次打开都从网上取新 `index.html`；构建产物文件名带 hash，新 HTML 必然拉到新资源，不存在新旧串味。代价是**首次**离线打开依赖上一次在线时留下的缓存。
- **图标是真 PNG，由脚本生成**（`scripts/gen-icons.mjs`，纯 Node + zlib 手写 PNG 编码，零依赖）：`node scripts/gen-icons.mjs public`。改配色改脚本顶部的 `BG / G_TOP / G_BOT`。maskable 那张把眼睛缩到 0.8，确保落在圆形遮罩的安全区内。
- **`public/` 里的东西不经过打包，原样拷进 `dist/` 根目录**，所以 `sw.js`、`manifest.webmanifest` 里的路径要写绝对路径（`/sw.js`）。`server.ts` 生产分支的 `express.static(dist)` 已能正确给出 `application/manifest+json` MIME，无需改后端。
- ⚠️ 本机验证时在你的 Edge 上给 `localhost:3011` **注册过一个 Service Worker**，会留在 profile 里。以后若要在 3011 跑 dev，先去 DevTools → Application → Service Workers → Unregister。

### 验证手法（很有用）

**用 echo server 抓真实请求体。** 起一个假上游 HTTP 服务，把 `baseUrl` 指过去，让 `server.ts` 转发给它，就能看到**实际发出的 payload**。本轮靠这招抓到两个真 bug：topP 从未被解构、温度 0 被篡改。比读代码可靠。

```js
const echo = http.createServer((req, res) => {
  let b = ''; req.on('data', c => b += c);
  req.on('end', () => { console.log(JSON.parse(b)); res.writeHead(200, {'Content-Type':'text/event-stream'}); res.end('data: [DONE]\n\n'); });
});
```

**验证 Service Worker 真在干活：关掉服务器，再访问一个浏览器从没请求过的深层 URL。** 若还能渲染出完整界面，就只能是 SW 在回退缓存——HTTP 缓存对「从没请求过的 URL」无从下手，天然排除了干扰。比调 `getRegistrations()` 更贴近「离线到底能不能用」这个问题本身。

### 环境 / 工具

- **端口**：3000 是默认（`server.ts` 读 `process.env.PORT`，可用 `PORT=3007 npm run dev` 换）；**24678 是 Vite HMR 端口，常被占用**，控制台会刷 WebSocket 报错，属噪音，可用 `DISABLE_HMR=true` 关（但关了就**不会**热更新代码）
- **Playwright MCP**：元素「不稳定」超时会误报（点击其实成功了）；文件选择对话框在会话里会累积不消失，`browser_close` 也清不掉，是 MCP 会话残留，不影响应用
- 验证实例建议换端口启动，**避免动用户在 3000 上的真实数据**（不同端口 = 不同 localStorage）

---

## 四、常用命令

```bash
cd /e/WatchWorld/WatchWorld
npx tsc --noEmit                       # 类型检查（改完必跑）
npm run build                          # 生产构建
node scripts/gen-icons.mjs public      # 重新生成 PWA 图标（改配色后跑）
PORT=3010 npm run dev                  # 换端口起开发服务
NODE_ENV=production npm start          # 生产模式（先 build）
```
