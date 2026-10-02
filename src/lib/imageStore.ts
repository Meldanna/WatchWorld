/**
 * 图片存储层（IndexedDB）。
 *
 * 为什么不放 localStorage：那里只有约 5MB，且 storage.safeSet 在超配额时只打日志、
 * 静默失败——一张手机照 base64 后就有 2-5MB，会把**整个聊天记录**的持久化一起拖垮。
 * 图片这类二进制数据放 IndexedDB（配额通常几百 MB），文本配置继续留在 localStorage。
 */

export interface StoredImage {
  id: string;
  dataUrl: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  name?: string;
  createdAt: number;
}

const DB_NAME = 'guanjie_media';
const DB_VERSION = 1;
const STORE = 'images';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function runTx<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = action(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

/** 估算 dataURL 的实际字节数 */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return dataUrl.length;
  return Math.round(((dataUrl.length - comma - 1) * 3) / 4);
}

function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片解码失败'));
    img.src = src;
  });
}

/**
 * 压缩图片：只在小图时保留原图，否则等比缩放到 maxDim 内并转 JPEG。
 * 目的是控制 IndexedDB 占用与每次请求的体积。
 */
export async function compressImageFile(
  file: File,
  maxDim = 1600,
  quality = 0.85
): Promise<{ dataUrl: string; width: number; height: number; mime: string; bytes: number }> {
  const original = await readAsDataURL(file);
  const img = await loadImage(original);
  const { naturalWidth: w0, naturalHeight: h0 } = img;

  const alreadySmall = file.size <= 400 * 1024 && Math.max(w0, h0) <= maxDim;
  if (alreadySmall) {
    return {
      dataUrl: original,
      width: w0,
      height: h0,
      mime: file.type || 'image/png',
      bytes: dataUrlBytes(original),
    };
  }

  const scale = Math.min(1, maxDim / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      dataUrl: original,
      width: w0,
      height: h0,
      mime: file.type || 'image/png',
      bytes: dataUrlBytes(original),
    };
  }

  // 有透明通道的 PNG 保留 PNG，其余转 JPEG 以显著减小体积
  const isPng = (file.type || '').includes('png');
  ctx.drawImage(img, 0, 0, w, h);
  const outMime = isPng ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(outMime, isPng ? undefined : quality);

  return {
    dataUrl,
    width: w,
    height: h,
    mime: outMime,
    bytes: dataUrlBytes(dataUrl),
  };
}

/** 把 File 压缩并落库，返回可写入消息的图片 id */
export async function saveImageFile(file: File): Promise<StoredImage> {
  const compressed = await compressImageFile(file);
  const img: StoredImage = {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataUrl: compressed.dataUrl,
    mime: compressed.mime,
    width: compressed.width,
    height: compressed.height,
    bytes: compressed.bytes,
    name: file.name,
    createdAt: Date.now(),
  };
  await ImageStore.put(img);
  return img;
}

export const ImageStore = {
  async put(img: StoredImage): Promise<void> {
    await runTx('readwrite', (store) => store.put(img));
  },

  async get(id: string): Promise<StoredImage | undefined> {
    try {
      return await runTx<StoredImage | undefined>('readonly', (store) => store.get(id));
    } catch {
      return undefined;
    }
  },

  /** 批量读取，返回 id -> 图片 的映射；缺失的 id 不会出现在结果里 */
  async getMany(ids: string[]): Promise<Record<string, StoredImage>> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return {};
    const out: Record<string, StoredImage> = {};
    await Promise.all(
      unique.map(async (id) => {
        const img = await this.get(id);
        if (img) out[id] = img;
      })
    );
    return out;
  },

  async remove(id: string): Promise<void> {
    try {
      await runTx('readwrite', (store) => store.delete(id));
    } catch {
      // 删除失败不影响主流程
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.remove(id)));
  },

  async listAll(): Promise<StoredImage[]> {
    try {
      return await runTx<StoredImage[]>('readonly', (store) => store.getAll());
    } catch {
      return [];
    }
  },

  /** 统计占用，便于在界面上提示体积 */
  async usage(): Promise<{ count: number; bytes: number }> {
    const all = await this.listAll();
    return {
      count: all.length,
      bytes: all.reduce((sum, i) => sum + (i.bytes || 0), 0),
    };
  },

  /** 清理没有被任何消息引用的孤儿图片 */
  async pruneOrphans(usedIds: string[]): Promise<number> {
    const used = new Set(usedIds);
    const all = await this.listAll();
    const orphans = all.filter((i) => !used.has(i.id)).map((i) => i.id);
    if (orphans.length > 0) await this.removeMany(orphans);
    return orphans.length;
  },
};
