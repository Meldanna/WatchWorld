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
