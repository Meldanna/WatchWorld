import { WebDavConfig } from '../types';

export interface WebDavSyncResult {
  success: boolean;
  message: string;
  timestamp?: number;
  remoteData?: string;
}

/**
 * Helper to call WebDAV through backend proxy to avoid CORS
 */
async function callWebDavProxy(
  url: string,
  method: string,
  config: WebDavConfig,
  body?: string,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const authHeader = 'Basic ' + btoa(`${config.username}:${config.password || ''}`);
  const headers: Record<string, string> = {
    'x-webdav-url': url,
    'x-webdav-method': method,
    'Authorization': authHeader,
    ...extraHeaders,
  };

  if (body) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }

  return fetch('/api/webdav', {
    method: 'POST',
    headers,
    body: body || undefined,
  });
}

/**
 * 2.5 WebDAV 连接测试
 */
export async function testWebDavConnection(
  config: WebDavConfig
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  if (!config.url || !config.username || !config.password) {
    return {
      success: false,
      latencyMs: 0,
      message: '请填写完整的 WebDAV 地址、用户名和应用密码',
    };
  }

  const startTime = Date.now();
  try {
    const res = await callWebDavProxy(config.url, 'PROPFIND', config, undefined, {
      Depth: '0',
    });

    const latencyMs = Date.now() - startTime;
    if (res.ok || res.status === 207 || res.status === 405) {
      return {
        success: true,
        latencyMs,
        message: `WebDAV 连接成功！响应耗时 ${latencyMs}ms（支持坚果云/Nextcloud/Alist/自建NAS）`,
      };
    }

    const errText = await res.text().catch(() => '');
    return {
      success: false,
      latencyMs,
      message: `认证失败或路径不存在 (${res.status}): ${errText.slice(0, 100)}`,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: `网络异常: ${err.message || '连接超时'}`,
    };
  }
}

/**
 * 拉取远程 WebDAV 数据
 */
export async function pullFromWebDav(
  config: WebDavConfig
): Promise<WebDavSyncResult> {
  if (!config.enabled || !config.url || !config.username || !config.password) {
    return { success: false, message: 'WebDAV 未启用或配置不完整' };
  }

  const syncPath = config.syncPath || '/guanjie_backup.json';
  const fullUrl = config.url.replace(/\/+$/, '') + syncPath;

  try {
    const res = await callWebDavProxy(fullUrl, 'GET', config);
    if (res.status === 404) {
      return {
        success: true,
        message: '远程尚无备份文件，后续将自动推送本地数据',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        message: `获取远程备份失败 (${res.status})`,
      };
    }

    const remoteData = await res.text();
    return {
      success: true,
      message: '成功拉取远程数据',
      remoteData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `拉取失败: ${err.message}`,
    };
  }
}

/**
 * 推送本地数据到 WebDAV
 */
export async function pushToWebDav(
  config: WebDavConfig,
  dataStr: string
): Promise<WebDavSyncResult> {
  if (!config.enabled || !config.url || !config.username || !config.password) {
    return { success: false, message: 'WebDAV 未启用或配置不完整' };
  }

  const syncPath = config.syncPath || '/guanjie_backup.json';
  const fullUrl = config.url.replace(/\/+$/, '') + syncPath;

  try {
    const res = await callWebDavProxy(fullUrl, 'PUT', config, dataStr);
    if (res.ok || res.status === 201 || res.status === 204) {
      return {
        success: true,
        message: `同步成功 (${new Date().toLocaleTimeString()})`,
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      message: `推送失败，状态码: ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `网络推送失败: ${err.message}`,
    };
  }
}

/* ------------------------------------------------------------------
 * 增量同步：按窗口/图片分文件存放，只上传有改动的部分。
 * 目录结构：
 *   <root>/index.json            清单（各窗口与图片的 updatedAt）
 *   <root>/windows/<id>.json     单个窗口的数据
 *   <root>/media/<id>.json       单张图片
 * ------------------------------------------------------------------ */

export interface SyncManifest {
  version: number;
  updatedAt: number;
  sessions: Record<string, { updatedAt: number; title?: string }>;
  images: Record<string, { bytes: number; updatedAt: number; mime?: string }>;
}

export function emptyManifest(): SyncManifest {
  return { version: 1, updatedAt: 0, sessions: {}, images: {} };
}

/** 同步根目录，默认 /guanjie/ */
export function syncRoot(config: WebDavConfig): string {
  const dir = config.syncRootDir || '/guanjie/';
  const withSlash = dir.endsWith('/') ? dir : `${dir}/`;
  return config.url.replace(/\/+$/, '') + withSlash;
}

function safeFileName(id: string): string {
  return id.replace(/[^A-Za-z0-9._-]/g, '_');
}

async function putFile(
  config: WebDavConfig,
  url: string,
  body: string
): Promise<WebDavSyncResult> {
  try {
    const res = await callWebDavProxy(url, 'PUT', config, body);
    if (res.ok || res.status === 201 || res.status === 204) {
      return { success: true, message: 'ok', timestamp: Date.now() };
    }
    return { success: false, message: `PUT 失败 (${res.status})` };
  } catch (err: any) {
    return { success: false, message: err.message || '网络异常' };
  }
}

async function getFile(config: WebDavConfig, url: string): Promise<string | null> {
  try {
    const res = await callWebDavProxy(url, 'GET', config);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** 确保目录存在；MKCOL 在目录已存在时返回 405，一律忽略 */
export async function ensureCollections(config: WebDavConfig): Promise<void> {
  const root = syncRoot(config);
  await callWebDavProxy(root, 'MKCOL', config).catch(() => undefined);
  await callWebDavProxy(`${root}windows/`, 'MKCOL', config).catch(() => undefined);
  await callWebDavProxy(`${root}media/`, 'MKCOL', config).catch(() => undefined);
}

export async function fetchManifest(config: WebDavConfig): Promise<SyncManifest | null> {
  const text = await getFile(config, `${syncRoot(config)}index.json`);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return { ...emptyManifest(), ...parsed };
  } catch {
    return null;
  }
}

export async function pushManifest(
  config: WebDavConfig,
  manifest: SyncManifest
): Promise<WebDavSyncResult> {
  const next = { ...manifest, updatedAt: Date.now() };
  const res = await putFile(config, `${syncRoot(config)}index.json`, JSON.stringify(next));
  if (res.success) manifest.updatedAt = next.updatedAt;
  return res;
}

export async function pushSessionFile(
  config: WebDavConfig,
  session: unknown
): Promise<WebDavSyncResult> {
  const s = session as { id: string };
  return putFile(
    config,
    `${syncRoot(config)}windows/${safeFileName(s.id)}.json`,
    JSON.stringify({ kind: 'session', payload: session })
  );
}

export async function fetchSessionFile(config: WebDavConfig, id: string): Promise<unknown | null> {
  const text = await getFile(config, `${syncRoot(config)}windows/${safeFileName(id)}.json`);
  if (!text) return null;
  try {
    return JSON.parse(text)?.payload ?? null;
  } catch {
    return null;
  }
}

export async function pushImageFile(
  config: WebDavConfig,
  image: unknown
): Promise<WebDavSyncResult> {
  const img = image as { id: string };
  return putFile(
    config,
    `${syncRoot(config)}media/${safeFileName(img.id)}.json`,
    JSON.stringify({ kind: 'image', payload: image })
  );
}

export async function fetchImageFile(config: WebDavConfig, id: string): Promise<unknown | null> {
  const text = await getFile(config, `${syncRoot(config)}media/${safeFileName(id)}.json`);
  if (!text) return null;
  try {
    return JSON.parse(text)?.payload ?? null;
  } catch {
    return null;
  }
}
