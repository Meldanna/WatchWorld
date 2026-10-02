/* 观界 · Service Worker
 *
 * 缓存策略（三条线，别混）：
 *   1. /api/*         → 一律 network-only，绝不缓存。
 *                       聊天、模型列表、WebDAV 代理都必须是实时结果，
 *                       缓存住会出现「发消息回的是上一次的答复」这类怪象。
 *   2. 导航请求(index) → network-first + 3s 超时，失败回退缓存里的 index.html，
 *                       保证离线也能开壳（数据本来就在 IndexedDB / localStorage）。
 *   3. 其余同源静态资源 → stale-while-revalidate：先返回缓存、后台静默更新。
 *                       构建产物文件名带 hash，不会出现新旧串味。
 */

const VERSION = 'v1';
const STATIC_CACHE = `watchworld-static-${VERSION}`;
const PAGE_CACHE = `watchworld-page-${VERSION}`;
const NAV_TIMEOUT = 3000;

self.addEventListener('install', (event) => {
  // 不预缓存任何东西：首次访问时由 fetch 处理器顺路填充，
  // 避免 install 阶段因某一个资源 404 而整体失败。
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('watchworld-') && k !== STATIC_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// 页面可发 {type:'SKIP_WAITING'} 让新 SW 立即接管（配合前端的更新提示）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只接管 GET；POST/PUT 等交给网络，SW 不掺和
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. 后端接口：network-only
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    return; // 不调用 respondWith，浏览器走默认网络请求
  }

  // 跨域资源（如 WebDAV 直连）同样不插手
  if (url.origin !== self.location.origin) return;

  // 2. 页面导航：network-first，失败回退缓存
  if (req.mode === 'navigate') {
    event.respondWith(networkFirstPage(req));
    return;
  }

  // 3. 静态资源：stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

/** 导航请求：3 秒拿不到网络响应就先用缓存顶上（弱网下很关键） */
async function networkFirstPage(req) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await withTimeout(fetch(req), NAV_TIMEOUT);
    if (res && res.ok) cache.put('/index.html', res.clone());
    return res;
  } catch {
    const cached = (await cache.match('/index.html')) || (await cache.match(req));
    if (cached) return cached;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>观界</title>' +
        '<body style="font-family:system-ui;background:#0f172a;color:#e2e8f0;padding:2rem">' +
        '<h2>暂时离线</h2><p>没有网络，且本地还没有缓存过页面。请联网后重试。</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);

  const network = fetch(req)
    .then((res) => {
      // 只缓存同源的正常响应，206/opaque 之类不碰
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);

  return cached || (await network) || Response.error();
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}
