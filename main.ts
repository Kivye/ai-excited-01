import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 768;
const H = 768;
const pixels = Buffer.alloc(W * H * 4);
const clamp = (v, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;

function blend(x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= W || y >= H || alpha <= 0) return;
  const i = (Math.floor(y) * W + Math.floor(x)) * 4;
  const a = clamp(alpha, 0, 1);
  pixels[i] = mix(pixels[i], color[0], a);
  pixels[i + 1] = mix(pixels[i + 1], color[1], a);
  pixels[i + 2] = mix(pixels[i + 2], color[2], a);
  pixels[i + 3] = 255;
}

function ellipse(cx, cy, rx, ry, color, opts = {}) {
  const angle = opts.angle || 0;
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const reach = Math.max(rx, ry) + (opts.soft || 0) + 2;
  const x0 = Math.max(0, Math.floor(cx - reach)), x1 = Math.min(W - 1, Math.ceil(cx + reach));
  const y0 = Math.max(0, Math.floor(cy - reach)), y1 = Math.min(H - 1, Math.ceil(cy + reach));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const u = (dx * ca + dy * sa) / rx;
    const v = (-dx * sa + dy * ca) / ry;
    const d = Math.sqrt(u * u + v * v);
    const edge = opts.soft || 0;
    const coverage = edge ? clamp((1 - d) * Math.min(rx, ry) / edge + 0.5, 0, 1) : clamp((1.01 - d) * 8, 0, 1);
    if (!coverage) continue;
    let c = color;
    if (opts.gradient) {
      const light = clamp(1 - Math.sqrt(((u + 0.27) * 0.72) ** 2 + ((v + 0.34) * 0.82) ** 2), 0, 1);
      const shade = clamp(d, 0, 1);
      c = color.map((n, k) => clamp(n + light * (opts.highlight[k] - n) * 0.62 - shade * (opts.shadow[k] || 0) * 0.42));
    }
    blend(x, y, c, coverage * (opts.alpha ?? 1));
  }
}

function line(x1, y1, x2, y2, color, width, alpha = 1) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.5);
  for (let j = 0; j <= steps; j++) {
    const t = j / steps;
    ellipse(mix(x1, x2, t), mix(y1, y2, t), width / 2, width / 2, color, { alpha });
  }
}

function sparkle(cx, cy, r, color) {
  line(cx - r, cy, cx + r, cy, color, 3, 0.9);
  line(cx, cy - r, cx, cy + r, color, 3, 0.9);
  ellipse(cx, cy, r * 0.28, r * 0.28, [255, 255, 238]);
}

function plush(cx, cy, rx, ry, base, hi, shade, tilt = 0) {
  const tufts = 22;
  for (let i = 0; i < tufts; i++) {
    const a = (i / tufts) * Math.PI * 2;
    const tx = cx + Math.cos(a) * rx * 0.91;
    const ty = cy + Math.sin(a) * ry * 0.91;
    ellipse(tx, ty, 15, 18, base, { angle: a + tilt, gradient: true, highlight: hi, shadow: shade });
  }
  ellipse(cx, cy, rx, ry, base, { angle: tilt, gradient: true, highlight: hi, shadow: shade });
  for (let i = 0; i < 88; i++) {
    const a = i * 2.399963;
    const radius = 0.965 + (i % 4) * 0.009;
    const x = cx + Math.cos(a) * rx * radius;
    const y = cy + Math.sin(a) * ry * radius;
    const color = i % 3 === 0 ? hi : shade;
    line(x, y, x + Math.cos(a) * 4, y + Math.sin(a) * 4, color, 2, 0.42);
  }
}

for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const d = Math.sqrt(((x - 365) / 610) ** 2 + ((y - 280) / 640) ** 2);
  const t = clamp(d, 0, 1);
  const grain = ((x * 17 + y * 31) % 9) - 4;
  const i = (y * W + x) * 4;
  pixels[i] = clamp(mix(255, 245, t) + grain);
  pixels[i + 1] = clamp(mix(239, 205, t) + grain);
  pixels[i + 2] = clamp(mix(211, 163, t) + grain);
  pixels[i + 3] = 255;
}

for (let k = 8; k >= 1; k--) ellipse(386, 627, 205 + k * 7, 24 + k * 4, [133, 75, 48], { alpha: 0.025 });

const confetti = [
  [113, 205, 12, -0.55, [244, 117, 83]], [176, 118, 9, 0.7, [250, 183, 62]],
  [272, 90, 7, -0.2, [61, 177, 160]], [481, 102, 10, 0.75, [248, 119, 93]],
  [584, 164, 8, -0.7, [92, 174, 190]], [649, 254, 12, 0.4, [246, 179, 62]],
  [104, 359, 8, 0.1, [81, 179, 157]], [654, 392, 8, -0.4, [226, 112, 133]],
  [149, 503, 10, 0.7, [249, 176, 70]], [610, 521, 11, -0.6, [67, 165, 177]],
];
for (const [x, y, r, a, c] of confetti) {
  ellipse(x, y, r * 0.48, r, c, { angle: a });
  ellipse(x + 18, y + 17, 3, 3, [255, 250, 225]);
}
sparkle(204, 250, 12, [255, 255, 238]);
sparkle(560, 284, 15, [255, 250, 224]);
sparkle(557, 462, 9, [255, 253, 230]);
sparkle(246, 551, 8, [255, 253, 230]);

ellipse(281, 266, 45, 68, [39, 139, 142], { angle: -0.35, gradient: true, highlight: [112, 216, 190], shadow: [25, 58, 54] });
ellipse(292, 278, 22, 40, [246, 154, 135], { angle: -0.35 });
ellipse(505, 260, 47, 70, [232, 124, 68], { angle: 0.33, gradient: true, highlight: [255, 205, 115], shadow: [92, 48, 35] });
ellipse(493, 277, 22, 42, [249, 169, 139], { angle: 0.33 });

plush(330, 429, 172, 184, [45, 157, 157], [145, 232, 197], [19, 66, 68], -0.08);
plush(448, 425, 168, 184, [238, 139, 70], [255, 218, 139], [92, 49, 33], 0.08);

ellipse(359, 505, 76, 27, [38, 142, 148], { angle: 0.16, gradient: true, highlight: [117, 218, 190], shadow: [22, 62, 62] });
ellipse(423, 498, 79, 28, [237, 137, 71], { angle: -0.2, gradient: true, highlight: [255, 208, 127], shadow: [106, 51, 32] });

for (const [x, y] of [[273, 389], [320, 394], [453, 390], [500, 388]]) {
  ellipse(x, y, 13, 20, [43, 49, 57]);
  ellipse(x - 4, y - 7, 4.5, 6, [255, 255, 246]);
  ellipse(x + 4, y + 5, 2, 3, [155, 203, 207]);
}
ellipse(296, 443, 10, 8, [113, 56, 61]);
ellipse(477, 441, 10, 8, [113, 56, 61]);
ellipse(296, 446, 5, 3, [247, 123, 135]);
ellipse(477, 444, 5, 3, [255, 156, 128]);
ellipse(255, 430, 19, 11, [247, 123, 135], { alpha: 0.62 });
ellipse(337, 430, 18, 11, [247, 123, 135], { alpha: 0.55 });
ellipse(438, 429, 18, 11, [255, 133, 119], { alpha: 0.58 });
ellipse(519, 428, 19, 11, [255, 126, 116], { alpha: 0.62 });

line(321, 222, 327, 205, [131, 225, 191], 8);
line(338, 218, 342, 201, [131, 225, 191], 7);
line(431, 217, 425, 199, [255, 209, 127], 8);
line(449, 215, 449, 197, [255, 209, 127], 7);
sparkle(268, 350, 7, [255, 248, 218]);
sparkle(514, 344, 7, [255, 248, 218]);

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

const scanlines = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  const dst = y * (1 + W * 4);
  scanlines[dst] = 0;
  pixels.copy(scanlines, dst + 1, y * W * 4, (y + 1) * W * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(scanlines, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'entry.png'), png);
console.log(`Wrote ${join(outputDir, 'entry.png')} (${png.length} bytes)`);
