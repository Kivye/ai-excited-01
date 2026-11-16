const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const W = 768, H = 768;
const pixels = Buffer.alloc(W * H * 4);
const clamp = (v, a = 0, b = 255) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const hash = (n) => {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
};

function blend(x, y, color, alpha = 1) {
  const ix = Math.round(x), iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= W || iy >= H) return;
  const i = (iy * W + ix) * 4, a = clamp(alpha, 0, 1), inv = 1 - a;
  pixels[i] = pixels[i] * inv + color[0] * a;
  pixels[i + 1] = pixels[i + 1] * inv + color[1] * a;
  pixels[i + 2] = pixels[i + 2] * inv + color[2] * a;
  pixels[i + 3] = 255;
}

function ellipse(cx, cy, rx, ry, color, opts = {}) {
  const { edge = 0, shade = 0, alpha = 1, rim = null } = opts;
  const x0 = Math.max(0, Math.floor(cx - rx - 2)), x1 = Math.min(W - 1, Math.ceil(cx + rx + 2));
  const y0 = Math.max(0, Math.floor(cy - ry - 2)), y1 = Math.min(H - 1, Math.ceil(cy + ry + 2));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    const d = Math.sqrt(nx * nx + ny * ny);
    if (d > 1.025) continue;
    const aa = clamp((1.015 - d) * 20, 0, 1) * alpha;
    const light = clamp(0.18 + 0.62 * Math.max(0, -nx * 0.72 - ny * 0.85) + 0.13 * (1 - d), 0, 0.78);
    let c = color.map(v => clamp(v * (1 - shade * (1 - light)) + 255 * shade * light));
    if (rim && d > 0.91) c = c.map((v, k) => mix(v, rim[k], clamp((d - 0.91) * 7, 0, 0.72)));
    blend(x, y, c, aa);
  }
}

function line(x1, y1, x2, y2, color, width, alpha = 1) {
  const dx = x2 - x1, dy = y2 - y1, steps = Math.ceil(Math.hypot(dx, dy) * 1.5);
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps), x = x1 + dx * t, y = y1 + dy * t;
    const r = width / 2;
    for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
      const dist = Math.hypot(ox, oy);
      if (dist <= r + 0.5) blend(x + ox, y + oy, color, alpha * clamp(r + 0.6 - dist, 0, 1));
    }
  }
}

function curve(points, color, width, alpha = 1) {
  const [p0, p1, p2, p3] = points;
  let prev = p0;
  for (let i = 1; i <= 90; i++) {
    const t = i / 90, q = 1 - t;
    const cur = [q*q*q*p0[0] + 3*q*q*t*p1[0] + 3*q*t*t*p2[0] + t*t*t*p3[0], q*q*q*p0[1] + 3*q*q*t*p1[1] + 3*q*t*t*p2[1] + t*t*t*p3[1]];
    line(prev[0], prev[1], cur[0], cur[1], color, width, alpha);
    prev = cur;
  }
}

function background() {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - 390) / 610, dy = (y - 330) / 610;
    const vignette = clamp((dx * dx + dy * dy) * 0.72, 0, 0.48);
    const glow = Math.max(0, 1 - Math.hypot((x - 370) / 510, (y - 340) / 520));
    const grain = (hash(x * 92821 + y * 68917) - 0.5) * 2.3;
    const t = clamp(0.28 + 0.50 * glow - vignette, 0, 0.8);
    const i = (y * W + x) * 4;
    pixels[i] = clamp(mix(207, 255, t) + grain);
    pixels[i + 1] = clamp(mix(111, 224, t) + grain);
    pixels[i + 2] = clamp(mix(68, 175, t) + grain);
    pixels[i + 3] = 255;
  }
}

function fur(cx, cy, rx, ry, base, count, seed, strength = 1) {
  for (let n = 0; n < count; n++) {
    const a = hash(seed + n * 7.31) * Math.PI * 2;
    const r = Math.sqrt(hash(seed + n * 19.17)) * 0.94;
    const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
    const len = 2 + hash(seed + n * 3.97) * 8;
    const c = base.map((v, k) => clamp(v + (hash(seed + n * (k + 11)) - 0.45) * 52));
    line(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, c, 1 + hash(seed + n) * 1.25, strength * (0.22 + hash(seed + n * 2) * 0.28));
  }
}

function blush(cx, cy, r) {
  for (let k = 5; k >= 1; k--) ellipse(cx, cy, r * k / 3.1, r * k / 3.1, [255, 74, 97], { alpha: 0.055 });
  ellipse(cx, cy, r * 0.22, r * 0.22, [255, 112, 124], { alpha: 0.48 });
}

function eye(cx, cy, r) {
  ellipse(cx + 1, cy + 4, r * 1.06, r * 1.15, [30, 57, 68]);
  ellipse(cx, cy, r, r * 1.1, [250, 255, 250]);
  ellipse(cx + 1, cy + 3, r * 0.68, r * 0.77, [30, 50, 70]);
  ellipse(cx + 2, cy + 4, r * 0.52, r * 0.61, [36, 121, 157]);
  ellipse(cx + 3, cy + 6, r * 0.33, r * 0.43, [20, 35, 57]);
  ellipse(cx - r * 0.22, cy - r * 0.28, r * 0.2, r * 0.22, [255, 255, 255]);
  ellipse(cx + r * 0.27, cy + r * 0.14, r * 0.09, r * 0.1, [255, 255, 255]);
}

function sparkle(cx, cy, size, color) {
  line(cx - size, cy, cx + size, cy, color, 2.2, 0.95);
  line(cx, cy - size, cx, cy + size, color, 2.2, 0.95);
  line(cx - size * 0.52, cy - size * 0.52, cx + size * 0.52, cy + size * 0.52, color, 1.2, 0.75);
  line(cx + size * 0.52, cy - size * 0.52, cx - size * 0.52, cy + size * 0.52, color, 1.2, 0.75);
}

background();

// Soft ground shadow anchors the oversized pair.
for (let k = 8; k >= 1; k--) ellipse(390, 650, 285 + k * 5, 25 + k * 3, [94, 53, 43], { alpha: 0.035 });

// Teal plush body, with a broad shoulder and soft stitched edge.
ellipse(292, 431, 235, 229, [0, 151, 145], { shade: 0.26, rim: [0, 94, 99] });
fur(292, 431, 226, 221, [0, 160, 151], 2300, 123, 1.15);

// Orange character sits forward, so the embrace reads as two overlapping bodies.
ellipse(477, 430, 231, 228, [255, 126, 35], { shade: 0.24, rim: [188, 70, 26] });
fur(477, 430, 222, 220, [255, 139, 39], 2300, 731, 1.1);

// Visible arms wrap across the other plush, ending in rounded mitten paws.
curve([[123, 487], [170, 572], [318, 613], [406, 553]], [0, 112, 111], 58, 0.98);
curve([[123, 487], [170, 572], [318, 613], [406, 553]], [0, 176, 164], 43, 0.98);
ellipse(405, 553, 34, 29, [0, 172, 160], { shade: 0.13 });
fur(403, 550, 30, 24, [0, 181, 169], 180, 888);
curve([[644, 480], [602, 565], [476, 598], [360, 533]], [193, 72, 25], 58, 0.98);
curve([[644, 480], [602, 565], [476, 598], [360, 533]], [255, 159, 49], 43, 0.98);
ellipse(360, 533, 34, 29, [255, 157, 48], { shade: 0.12 });
fur(361, 531, 30, 24, [255, 174, 57], 180, 1118);

// Rounded heads and ears frame large, sparkling faces.
ellipse(151, 258, 59, 67, [0, 129, 127], { shade: 0.2 });
ellipse(337, 253, 60, 69, [0, 129, 127], { shade: 0.2 });
ellipse(563, 253, 60, 69, [215, 91, 27], { shade: 0.18 });
ellipse(638, 258, 59, 67, [215, 91, 27], { shade: 0.18 });
ellipse(270, 379, 185, 190, [0, 163, 153], { shade: 0.24, rim: [0, 102, 106] });
fur(270, 379, 178, 184, [0, 170, 160], 1900, 1982, 1.12);
ellipse(498, 379, 185, 190, [255, 144, 43], { shade: 0.22, rim: [195, 79, 26] });
fur(498, 379, 178, 184, [255, 151, 47], 1900, 2982, 1.08);

// Ear insets and face highlights.
ellipse(151, 260, 29, 38, [0, 194, 177], { alpha: 0.62 });
ellipse(337, 257, 30, 39, [0, 194, 177], { alpha: 0.62 });
ellipse(563, 257, 30, 39, [255, 190, 83], { alpha: 0.72 });
ellipse(638, 260, 29, 38, [255, 190, 83], { alpha: 0.72 });
ellipse(242, 270, 80, 47, [100, 220, 208], { alpha: 0.10 });
ellipse(474, 269, 82, 47, [255, 226, 171], { alpha: 0.12 });

// The faces angle inward toward one another.
eye(218, 344, 37); eye(302, 347, 37);
eye(466, 344, 37); eye(550, 347, 37);
blush(202, 407, 37); blush(330, 407, 37);
blush(450, 407, 37); blush(578, 407, 37);
ellipse(260, 400, 11, 8, [0, 92, 95]);
ellipse(508, 400, 11, 8, [164, 63, 31]);
curve([[243, 417], [254, 435], [269, 435], [279, 418]], [0, 83, 91], 4, 0.95);
curve([[491, 417], [502, 435], [517, 435], [527, 418]], [143, 52, 30], 4, 0.95);
curve([[246, 421], [255, 427], [264, 427], [271, 421]], [255, 208, 190], 2.5, 0.9);
curve([[494, 421], [503, 427], [512, 427], [519, 421]], [255, 219, 183], 2.5, 0.9);

// Confetti and starbursts remain around the silhouette rather than across the eyes.
const confetti = [
  [78,198,9,[255,239,167]],[695,174,10,[255,239,167]],[92,348,7,[255,205,89]],
  [682,342,8,[255,206,85]],[116,580,9,[255,229,168]],[660,580,8,[255,229,168]],
  [235,105,7,[255,246,205]],[520,105,7,[255,246,205]],[320,91,6,[255,210,105]],
  [446,93,6,[255,210,105]],[49,450,6,[255,244,204]],[719,451,6,[255,244,204]],
  [175,650,7,[255,217,112]],[589,651,7,[255,217,112]],[375,674,6,[255,245,214]],
  [548,215,5,[255,250,219]],[215,222,5,[255,250,219]],[72,270,5,[255,239,177]],
  [710,268,5,[255,239,177]],[130,123,5,[255,221,117]],[645,118,5,[255,221,117]]
];
for (const [x,y,r,c] of confetti) {
  line(x-r, y-r*0.3, x+r, y+r*0.3, c, 4, 0.95);
  ellipse(x, y, 3, 3, [255,255,240], { alpha: 0.9 });
}
sparkle(114, 270, 16, [255, 246, 204]);
sparkle(652, 280, 18, [255, 246, 204]);
sparkle(168, 530, 14, [255, 225, 135]);
sparkle(612, 525, 15, [255, 225, 135]);
sparkle(385, 145, 13, [255, 252, 224]);
sparkle(72, 510, 10, [255, 250, 220]);
sparkle(700, 514, 10, [255, 250, 220]);

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii'), len = Buffer.alloc(4), sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  sum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, sum]);
}

const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) pixels.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
]);
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'entry.png'), png);
