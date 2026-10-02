// 一次性图标生成脚本：手写 PNG 编码（zlib + CRC32），几何绘制「眼睛」图标。
// 生成完即删；如需改色/改尺寸，按下面常量重跑即可。
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || 'public';

// ---------------- PNG 编码 ----------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------- 配色（取自 index.css 的暗色 accent） ----------------
const BG = [15, 23, 42];        // #0f172a 与 manifest theme_color 一致
const G_TOP = [103, 232, 249];  // #67e8f9
const G_BOT = [59, 130, 246];   // #3b82f6
const HILITE = [224, 242, 254]; // #e0f2fe

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

function insideRoundedRect(u, v, rad) {
  const x = Math.min(u, 1 - u);
  const y = Math.min(v, 1 - v);
  if (x >= rad || y >= rad) return true;
  return Math.hypot(rad - x, rad - y) <= rad;
}

// 眼睛 = 两圆相交的透镜形轮廓（环），中心瞳 + 高光点
function makeShader({ rounded, s }) {
  const r = 0.5 * s;      // 外轮廓半径
  const d = 0.34 * s;     // 两圆心水平偏移
  const t = 0.04 * s;     // 描边厚度
  const rin = r - t;
  const pupil = 0.095 * s;
  const hr = 0.028 * s;
  const ho = 0.036 * s;
  const gTop = 0.5 - (r - d);
  const gSpan = 2 * (r - d);
  const grad = (v) => mix(G_TOP, G_BOT, clamp01((v - gTop) / gSpan));

  return (u, v) => {
    if (rounded && !insideRoundedRect(u, v, 0.22)) return [0, 0, 0, 0];
    const dx = u - 0.5;
    const dy = v - 0.5;
    const inPupil = Math.hypot(dx, dy) < pupil;
    if (inPupil) {
      if (Math.hypot(dx + ho, dy + ho) < hr) return [...HILITE, 255];
      return [...grad(v), 255];
    }
    const outer = Math.hypot(dx - d, dy) < r && Math.hypot(dx + d, dy) < r;
    if (!outer) return [...BG, 255];
    const inner = Math.hypot(dx - d, dy) < rin && Math.hypot(dx + d, dy) < rin;
    return inner ? [...BG, 255] : [...grad(v), 255];
  };
}

function render(size, cfg) {
  const SS = 4; // 4x4 超采样做抗锯齿
  const S = size * SS;
  const shade = makeShader(cfg);
  const acc = new Float64Array(size * size * 4);
  for (let y = 0; y < S; y++) {
    const py = (y / SS) | 0;
    for (let x = 0; x < S; x++) {
      const [r, g, b, a] = shade((x + 0.5) / S, (y + 0.5) / S);
      const al = a / 255;
      const i = (py * size + ((x / SS) | 0)) * 4;
      acc[i] += r * al;
      acc[i + 1] += g * al;
      acc[i + 2] += b * al;
      acc[i + 3] += al;
    }
  }
  const n = SS * SS;
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const a = acc[i * 4 + 3] / n;
    out[i * 4 + 3] = Math.round(clamp01(a) * 255);
    if (a > 1e-6) {
      for (let c = 0; c < 3; c++) {
        out[i * 4 + c] = Math.round(clamp01(acc[i * 4 + c] / n / a) * 255);
      }
    }
  }
  return out;
}

const JOBS = [
  ['icon-192.png', 192, { rounded: true, s: 1.0 }],
  ['icon-512.png', 512, { rounded: true, s: 1.0 }],
  ['icon-maskable-512.png', 512, { rounded: false, s: 0.8 }],
  ['apple-touch-icon.png', 180, { rounded: false, s: 0.92 }],
];

fs.mkdirSync(OUT, { recursive: true });
for (const [name, size, cfg] of JOBS) {
  const png = encodePNG(size, size, render(size, cfg));
  const file = path.join(OUT, name);
  fs.writeFileSync(file, png);
  console.log(`${name}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`);
}
