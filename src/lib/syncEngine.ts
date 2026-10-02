import { ChatSession, WebDavConfig } from '../types';
import { ImageStore, StoredImage } from './imageStore';
import {
  SyncManifest,
  emptyManifest,
  ensureCollections,
  fetchManifest,
  pushManifest,
  pushSessionFile,
  fetchSessionFile,
  pushImageFile,
  fetchImageFile,
} from './webdavSync';

export interface SyncState {
  manifest: SyncManifest;
  ready: boolean;
}

export interface SyncOutcome {
  pushed: number;
  pulled: number;
  images: number;
  message: string;
}

export function createSyncState(): SyncState {
  return { manifest: emptyManifest(), ready: false };
}

export function isSyncConfigured(config?: WebDavConfig | null): boolean {
  return Boolean(config && config.enabled && config.url && config.username && config.password);
}

function imageIdsOf(session: ChatSession): string[] {
  return (session.messages || []).flatMap((m) => m.imageIds || []);
}

async function pushMissingImages(
  config: WebDavConfig,
  ids: string[],
  state: SyncState
): Promise<number> {
  let count = 0;
  for (const id of new Set(ids)) {
    if (state.manifest.images[id]) continue;
    const img = await ImageStore.get(id);
    if (!img) continue;
    const res = await pushImageFile(config, img);
    if (!res.success) continue;
    state.manifest.images[id] = { bytes: img.bytes, updatedAt: img.createdAt, mime: img.mime };
    count++;
  }
  return count;
}

/** 只上传 updatedAt 比云端新的窗口，以及它们引用到的新图片 */
export async function pushChanges(
  config: WebDavConfig,
  sessions: ChatSession[],
  state: SyncState
): Promise<SyncOutcome> {
  const outcome: SyncOutcome = { pushed: 0, pulled: 0, images: 0, message: '未配置同步' };
  if (!isSyncConfigured(config)) return outcome;

  if (!state.ready) {
    await ensureCollections(config);
    state.manifest = (await fetchManifest(config)) ?? emptyManifest();
    state.ready = true;
  }

  let changed = false;
  for (const session of sessions) {
    const known = state.manifest.sessions[session.id]?.updatedAt ?? 0;
    if ((session.updatedAt ?? 0) <= known) continue;

    const res = await pushSessionFile(config, session);
    if (!res.success) continue;

    state.manifest.sessions[session.id] = {
      updatedAt: session.updatedAt,
      title: session.title,
    };
    outcome.pushed++;
    changed = true;

    const added = await pushMissingImages(config, imageIdsOf(session), state);
    outcome.images += added;
    if (added > 0) changed = true;
  }

  if (changed) await pushManifest(config, state.manifest);
  outcome.message = changed
    ? `已上传 ${outcome.pushed} 个窗口 / ${outcome.images} 张图片`
    : '无改动';
  return outcome;
}

/** 拉取比本地新的窗口，并补齐它们引用的图片 */
export async function pullChanges(
  config: WebDavConfig,
  localSessions: ChatSession[],
  state: SyncState
): Promise<{ sessions: ChatSession[]; outcome: SyncOutcome }> {
  const outcome: SyncOutcome = { pushed: 0, pulled: 0, images: 0, message: '未配置同步' };
  if (!isSyncConfigured(config)) return { sessions: [], outcome };

  await ensureCollections(config);
  const manifest = (await fetchManifest(config)) ?? emptyManifest();
  state.manifest = manifest;
  state.ready = true;

  const localMap = new Map(localSessions.map((s) => [s.id, s]));
  const pulled: ChatSession[] = [];

  for (const [id, meta] of Object.entries(manifest.sessions)) {
    const local = localMap.get(id);
    if (local && (local.updatedAt ?? 0) >= meta.updatedAt) continue;

    const data = await fetchSessionFile(config, id);
    if (!data) continue;
    const session = data as ChatSession;

    for (const imgId of new Set(imageIdsOf(session))) {
      if (state.manifest.images[imgId] === undefined) continue;
      const existing = await ImageStore.get(imgId);
      if (existing) continue;
      const img = await fetchImageFile(config, imgId);
      if (!img) continue;
      await ImageStore.put(img as StoredImage);
      outcome.images++;
    }

    pulled.push(session);
  }

  outcome.pulled = pulled.length;
  outcome.message = pulled.length > 0 ? `已拉取 ${pulled.length} 个窗口` : '无更新';
  return { sessions: pulled, outcome };
}
