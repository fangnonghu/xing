/** 2026 上半年科技进展 · Canvas 直出影片引擎 */

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 300;
export const FPS = 24;

export const CHAPTERS = [
  { id: "open", start: 0, end: 16, name: "开场", color: "#4ef0d5" },
  { id: "toc", start: 16, end: 28, name: "六条主线", color: "#9d8cff" },
  { id: "ai", start: 28, end: 78, name: "01  实时智能", color: "#4ef0d5" },
  { id: "robot", start: 78, end: 118, name: "02  具身机器人", color: "#5aa7ff" },
  { id: "chips", start: 118, end: 162, name: "03  算力芯片", color: "#ffc857" },
  { id: "energy", start: 162, end: 210, name: "04  能源存储", color: "#7dffb3" },
  { id: "bio", start: 210, end: 248, name: "05  生命科学", color: "#ff6b8a" },
  { id: "space", start: 248, end: 286, name: "06  太空计算", color: "#9d8cff" },
  { id: "close", start: 286, end: 300, name: "收束", color: "#f2f5fb" },
];

const C = {
  bg0: "#03050a",
  bg1: "#0b1224",
  text: "#f3f6fb",
  muted: "#8d97ab",
  dim: "#5c6578",
  cyan: "#4ef0d5",
  amber: "#ffc857",
  violet: "#9d8cff",
  rose: "#ff6b8a",
  blue: "#5aa7ff",
  green: "#7dffb3",
};

const FONT = {
  sc: "NotoSansSC, WenQuanYi Micro Hei, sans-serif",
  scb: "NotoSansSCBold, NotoSansSC, WenQuanYi Micro Hei, sans-serif",
  scm: "NotoSansSCMedium, NotoSansSC, WenQuanYi Micro Hei, sans-serif",
  en: "NotoSans, NotoSansSC, WenQuanYi Micro Hei, sans-serif",
  enb: "NotoSansBold, NotoSansSCBold, NotoSansSC, WenQuanYi Micro Hei, sans-serif",
};

let assets = null;
let surfaceFactory = null;

/** 允许 Node 渲染器注入离屏画布工厂，用于胶片颗粒。 */
export function attachSurfaces(factory) {
  surfaceFactory = factory;
  assets = null;
}

function makeSurface(w, h) {
  if (surfaceFactory) return surfaceFactory(w, h);
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  return null;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}
function appear(t, delay, dur = 0.85) {
  return easeOutCubic(clamp((t - delay) / dur, 0, 1));
}
function hold(t, start, end, fade = 0.7) {
  if (t < start) return 0;
  if (t > end) return 0;
  const a = appear(t, start, fade);
  const b = t > end - fade ? clamp((end - t) / fade, 0, 1) : 1;
  return a * b;
}
function hexAlpha(hex, a) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fmtTime(t) {
  const s = Math.max(0, Math.min(DURATION, t));
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function ensureAssets(ctx) {
  if (assets) return assets;
  const rand = mulberry32(20260816);
  const stars = Array.from({ length: 220 }, () => ({
    x: rand(),
    y: rand(),
    z: 0.25 + rand() * 0.75,
    r: 0.4 + rand() * 1.6,
    p: rand() * Math.PI * 2,
  }));
  const grain = makeSurface(256, 256);
  if (grain) {
    grain.width = 256;
    grain.height = 256;
    const g = grain.getContext("2d");
    const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 80 + Math.floor(rand() * 140);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 28;
    }
    g.putImageData(img, 0, 0);
  }
  assets = { stars, grain };
  return assets;
}

function font(ctx, size, family, weightHint = "") {
  ctx.font = `${weightHint}${size}px ${family}`;
}

function drawWorld(ctx, t) {
  const { stars, grain } = ensureAssets(ctx);
  const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  g.addColorStop(0, C.bg0);
  g.addColorStop(0.55, C.bg1);
  g.addColorStop(1, "#061018");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const orb = ctx.createRadialGradient(1480, 220, 20, 1480, 220, 560);
  orb.addColorStop(0, "rgba(78,240,213,0.10)");
  orb.addColorStop(1, "rgba(78,240,213,0)");
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const orb2 = ctx.createRadialGradient(280, 900, 10, 280, 900, 520);
  orb2.addColorStop(0, "rgba(157,140,255,0.10)");
  orb2.addColorStop(1, "rgba(157,140,255,0)");
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  const drift = (t * 12) % 80;
  for (let x = -80; x < WIDTH + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x + drift * 0.15, 0);
    ctx.lineTo(x + drift * 0.15, HEIGHT);
    ctx.stroke();
  }
  for (let y = -80; y < HEIGHT + 80; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y + drift * 0.08);
    ctx.lineTo(WIDTH, y + drift * 0.08);
    ctx.stroke();
  }
  ctx.restore();

  for (const s of stars) {
    const tw = 0.45 + 0.55 * Math.sin(t * (0.7 + s.z) + s.p);
    const x = ((s.x + t * 0.003 * s.z) % 1) * WIDTH;
    const y = ((s.y + t * 0.0012 * s.z) % 1) * HEIGHT;
    ctx.fillStyle = `rgba(230,240,255,${0.18 + tw * 0.55 * s.z})`;
    ctx.beginPath();
    ctx.arc(x, y, s.r * s.z, 0, Math.PI * 2);
    ctx.fill();
  }

  if (grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = ctx.createPattern(grain, "repeat");
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }
}

function drawVignette(ctx) {
  const v = ctx.createRadialGradient(960, 540, 280, 960, 540, 980);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawChrome(ctx, t) {
  const ch = CHAPTERS.find((c) => t >= c.start && t < c.end) || CHAPTERS[CHAPTERS.length - 1];
  ctx.save();
  ctx.globalAlpha = t < 1.2 ? appear(t, 0.4, 0.8) : t > 297 ? clamp((300 - t) / 2.2, 0, 1) : 1;

  ctx.fillStyle = C.muted;
  font(ctx, 20, FONT.sc);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("2026  ·  科技半年报", 72, 42);
  ctx.textAlign = "right";
  font(ctx, 20, FONT.en);
  ctx.fillText(`${fmtTime(t)}  /  05:00`, WIDTH - 72, 42);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 78);
  ctx.lineTo(WIDTH - 72, 78);
  ctx.stroke();
  ctx.strokeStyle = hexAlpha(ch.color, 0.85);
  ctx.beginPath();
  ctx.moveTo(72, 78);
  ctx.lineTo(72 + 160, 78);
  ctx.stroke();

  const barY = HEIGHT - 48;
  const barX = 72;
  const barW = WIDTH - 144;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(barX, barY, barW, 3);
  ctx.fillStyle = hexAlpha(ch.color, 0.95);
  ctx.fillRect(barX, barY, barW * (t / DURATION), 3);
  for (const c of CHAPTERS) {
    const x = barX + barW * (c.start / DURATION);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x, barY - 3, 1.5, 9);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = C.muted;
  font(ctx, 20, FONT.sc);
  ctx.fillText(ch.name, 72, HEIGHT - 58);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCard(ctx, x, y, w, h, accent, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(10,16,32,0.62)";
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillRect(x, y + 16, 4, h - 32);
  ctx.restore();
}

function drawLabel(ctx, text, x, y, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  font(ctx, 18, FONT.sc);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawTitle(ctx, text, x, y, size, alpha, dy = 0, family = FONT.scb) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, dy);
  ctx.fillStyle = C.text;
  font(ctx, size, family);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawMuted(ctx, text, x, y, size, alpha, maxWidth) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.muted;
  font(ctx, size, FONT.sc);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  if (maxWidth) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapText(ctx, text, maxWidth, size, family = FONT.sc) {
  font(ctx, size, family);
  const lines = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawParagraph(ctx, text, x, y, maxWidth, size, alpha, lineH = 1.55) {
  const lines = wrapText(ctx, text, maxWidth, size);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.muted;
  font(ctx, size, FONT.sc);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * size * lineH));
  ctx.restore();
  return lines.length * size * lineH;
}

function drawStat(ctx, value, unit, label, x, y, color, alpha, scale = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  const valueFont = /[\u3400-\u9fff]/.test(String(value) + String(unit)) ? FONT.scb : FONT.enb;
  font(ctx, 78, valueFont);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, 0, 0);
  const vw = ctx.measureText(value).width;
  ctx.fillStyle = C.text;
  font(ctx, 28, FONT.sc);
  ctx.fillText(unit, vw + 12, -8);
  ctx.fillStyle = C.muted;
  font(ctx, 22, FONT.sc);
  ctx.fillText(label, 0, 42);
  ctx.restore();
}

function drawChapterSting(ctx, local, no, en, zh, color) {
  const a = appear(local, 0.15, 0.7);
  const up = lerp(28, 0, a);
  drawLabel(ctx, `CHAPTER  ${no}`, 120, 168 + up, color, a);
  drawTitle(ctx, zh, 120, 280 + up, 86, a);
  drawMuted(ctx, en, 120, 340 + up, 26, a * 0.9);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = hexAlpha(color, 0.85);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 372);
  ctx.lineTo(120 + 220 * a, 372);
  ctx.stroke();
  ctx.restore();
}

function drawTokenStream(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const n = 90;
  for (let i = 0; i < n; i++) {
    const seed = i * 17.13;
    const y = 430 + ((i * 47) % 320);
    const speed = 80 + (i % 7) * 28;
    const x = ((t * speed + seed * 40) % (WIDTH + 200)) - 80;
    const w = 10 + (i % 5) * 8;
    ctx.fillStyle = i % 4 === 0 ? C.cyan : i % 4 === 1 ? C.violet : "rgba(255,255,255,0.28)";
    ctx.globalAlpha = alpha * (0.25 + (i % 5) * 0.12);
    roundRect(ctx, x, y, w, 4, 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAgents(ctx, t, alpha) {
  const pairs = [
    [640, 620],
    [960, 560],
    [1280, 640],
  ];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = hexAlpha(C.blue, 0.45);
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(pairs[0][0], pairs[0][1]);
  ctx.lineTo(pairs[1][0], pairs[1][1]);
  ctx.lineTo(pairs[2][0], pairs[2][1]);
  ctx.stroke();
  ctx.setLineDash([]);
  pairs.forEach(([x, y], i) => {
    const pulse = 1 + 0.06 * Math.sin(t * 2.2 + i);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(12,20,40,0.8)";
    roundRect(ctx, -54, -54, 108, 108, 22);
    ctx.fill();
    ctx.strokeStyle = i === 1 ? C.cyan : C.blue;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = i === 1 ? C.cyan : C.blue;
    ctx.beginPath();
    ctx.arc(0, -8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-16, 12, 32, 8);
    ctx.restore();
  });
  ctx.restore();
}

function drawCircuit(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = hexAlpha(C.amber, 0.55);
  ctx.lineWidth = 1.4;
  const paths = [
    [1400, 200, 1700, 200, 1700, 420, 1540, 420, 1540, 560],
    [1480, 240, 1480, 360, 1760, 360, 1760, 700],
    [1600, 180, 1600, 300, 1840, 300, 1840, 520, 1680, 520],
  ];
  const prog = (0.15 + (t % 8) / 8) % 1;
  for (const p of paths) {
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.stroke();
  }
  ctx.fillStyle = C.amber;
  paths.forEach((p, idx) => {
    const segs = [];
    for (let i = 0; i < p.length - 2; i += 2) {
      segs.push([p[i], p[i + 1], p[i + 2], p[i + 3]]);
    }
    const u = (prog + idx * 0.27) % 1;
    const si = Math.floor(u * segs.length);
    const f = u * segs.length - si;
    const [x1, y1, x2, y2] = segs[Math.min(si, segs.length - 1)];
    ctx.beginPath();
    ctx.arc(lerp(x1, x2, f), lerp(y1, y2, f), 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBatteries(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const cells = 8;
  for (let i = 0; i < cells; i++) {
    const x = 1180 + (i % 4) * 150;
    const y = 430 + Math.floor(i / 4) * 200;
    roundRect(ctx, x, y, 120, 160, 14);
    ctx.strokeStyle = hexAlpha(C.green, 0.7);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = hexAlpha(C.green, 0.42);
    const fill = clamp(0.25 + 0.75 * appear(t + i * 0.12, 0.2, 2.4), 0, 1);
    const fh = 132 * fill;
    roundRect(ctx, x + 10, y + 18 + (132 - fh), 100, fh, 8);
    ctx.fill();
    ctx.fillStyle = C.green;
    ctx.fillRect(x + 44, y - 10, 32, 10);
  }
  ctx.restore();
}

function drawHelix(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const x0 = 1320;
  const y0 = 560;
  const w = 420;
  const amp = 70;
  const n = 48;
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    const x = x0 + p * w;
    const a = p * Math.PI * 7 + t * 1.3;
    const y1 = y0 + Math.sin(a) * amp;
    const y2 = y0 + Math.sin(a + Math.PI) * amp;
    const z1 = Math.cos(a);
    ctx.fillStyle = hexAlpha(C.rose, 0.35 + 0.45 * (0.5 + 0.5 * z1));
    ctx.beginPath();
    ctx.arc(x, y1, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexAlpha(C.violet, 0.35 + 0.45 * (0.5 + 0.5 * -z1));
    ctx.beginPath();
    ctx.arc(x, y2, 4.2, 0, Math.PI * 2);
    ctx.fill();
    if (i % 4 === 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawOrbits(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const cx = 1420;
  const cy = 560;
  ctx.strokeStyle = "rgba(157,140,255,0.35)";
  ctx.lineWidth = 1.3;
  [90, 150, 220].forEach((r, i) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.42, -0.4 + i * 0.12, 0, Math.PI * 2);
    ctx.stroke();
    const ang = t * (0.4 + i * 0.18) + i;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r * 0.42;
    ctx.fillStyle = i === 1 ? C.cyan : C.violet;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  const earth = ctx.createRadialGradient(cx - 8, cy - 8, 6, cx, cy, 42);
  earth.addColorStop(0, "#7ec8ff");
  earth.addColorStop(1, "#1a3a78");
  ctx.fillStyle = earth;
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawOpen(ctx, local) {
  const warp = appear(local, 0, 3.2);
  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT / 2);
  for (let i = 0; i < 70; i++) {
    const ang = (i / 70) * Math.PI * 2;
    const len = 80 + i * 9 * (0.3 + warp);
    ctx.strokeStyle = `rgba(200,220,255,${0.04 + 0.08 * warp})`;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 20, Math.sin(ang) * 20);
    ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();

  const a1 = appear(local, 1.4, 1.1);
  ctx.save();
  ctx.globalAlpha = a1;
  ctx.fillStyle = C.text;
  font(ctx, 168, FONT.enb);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = hexAlpha(C.cyan, 0.45);
  ctx.shadowBlur = 28;
  ctx.fillText("2026", WIDTH / 2, 430 + lerp(30, 0, a1));
  ctx.restore();

  const a2 = appear(local, 3.2, 0.9);
  ctx.save();
  ctx.globalAlpha = a2;
  ctx.fillStyle = C.cyan;
  font(ctx, 28, FONT.sc);
  ctx.textAlign = "center";
  ctx.fillText("二月  —  八月", WIDTH / 2, 500);
  ctx.fillStyle = C.text;
  font(ctx, 56, FONT.scb);
  ctx.fillText("世界科技重大进展", WIDTH / 2, 590);
  ctx.fillStyle = C.muted;
  font(ctx, 26, FONT.sc);
  ctx.fillText("用五分钟，看清半年里改写曲线的那些节点", WIDTH / 2, 670);
  ctx.restore();

  const a3 = appear(local, 6.4, 1);
  ctx.save();
  ctx.globalAlpha = a3;
  ctx.fillStyle = C.dim;
  font(ctx, 20, FONT.sc);
  ctx.textAlign = "center";
  ctx.fillText("公开报道综述  ·  HTML Canvas 直出  ·  1920×1080", WIDTH / 2, 760);
  ctx.restore();
}

function drawToc(ctx, local) {
  const a = appear(local, 0.1, 0.7);
  drawLabel(ctx, "INDEX", 120, 168, C.violet, a);
  drawTitle(ctx, "六条并行改写的主线", 120, 250, 64, a, lerp(20, 0, a));
  drawParagraph(
    ctx,
    "智能变快、机器人协作、芯片扩产、电网储能、体内基因筛选、计算进入轨道——它们不是彼此无关的新闻，而是同一条压力曲线的六个截面。",
    120,
    290,
    980,
    26,
    a * 0.95
  );

  const items = [
    ["01", "实时智能", "速度成为新的智力指标", C.cyan],
    ["02", "具身机器人", "模型开始指挥物理世界", C.blue],
    ["03", "算力芯片", "地面工厂与太空处理器", C.amber],
    ["04", "能源存储", "为智能准备电力底座", C.green],
    ["05", "生命科学", "在肿瘤里筛选 T 细胞", C.rose],
    ["06", "太空计算", "卫星从眼睛变成大脑", C.violet],
  ];
  items.forEach((it, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 120 + col * 560;
    const y = 430 + row * 230;
    const ia = appear(local, 0.35 + i * 0.16, 0.55);
    drawCard(ctx, x, y, 520, 200, it[3], ia);
    ctx.save();
    ctx.globalAlpha = ia;
    ctx.fillStyle = it[3];
    font(ctx, 22, FONT.enb);
    ctx.textAlign = "left";
    ctx.fillText(it[0], x + 36, y + 58);
    ctx.fillStyle = C.text;
    font(ctx, 36, FONT.scb);
    ctx.fillText(it[1], x + 36, y + 112);
    ctx.fillStyle = C.muted;
    font(ctx, 22, FONT.sc);
    ctx.fillText(it[2], x + 36, y + 158);
    ctx.restore();
  });
}

function drawAi(ctx, local, t) {
  drawChapterSting(ctx, local, "01", "REAL-TIME INTELLIGENCE", "实时智能", C.cyan);
  const lead = hold(local, 3.2, 10.2, 0.6);
  drawParagraph(
    ctx,
    "竞赛从「谁更强」转向「谁能在真实工作流里连续、实时地做事」。前沿模型不再只比智商，也开始比每秒完成的有效工作。",
    120,
    410,
    1040,
    30,
    lead
  );

  const b1 = hold(local, 10.0, 24.5, 0.55);
  if (b1 > 0) {
    drawTokenStream(ctx, t, b1 * 0.55);
    drawCard(ctx, 120, 400, 1680, 520, C.cyan, b1);
    drawLabel(ctx, "2026.08  ·  OPENAI  ×  CEREBRAS", 160, 460, C.cyan, b1);
    drawTitle(ctx, "GPT-5.6 Sol  Ultrafast", 160, 540, 58, b1);
    drawParagraph(
      ctx,
      "同一套最强模型，换到晶圆级推理轨道上。官方称最高约 14 倍于标准处理速度，输出可达约 750 token/秒——快到足以让语音智能体在通话中途完成思考。目前为小范围预览。",
      160,
      580,
      900,
      26,
      b1
    );
    drawStat(ctx, "14×", "", "相对标准速度", 160, 820, C.cyan, b1);
    drawStat(ctx, "750", "tok/s", "峰值输出", 560, 820, C.text, b1);
    drawStat(ctx, "实时", "", "前沿模型也要跑在通话里", 1000, 820, C.violet, b1);
  }

  const b2 = hold(local, 24.2, 36.8, 0.55);
  if (b2 > 0) {
    drawCard(ctx, 120, 400, 1680, 520, C.blue, b2);
    drawLabel(ctx, "2026.08  ·  GOOGLE", 160, 460, C.blue, b2);
    drawTitle(ctx, "Gemini 3.7 Flash", 160, 540, 58, b2);
    drawParagraph(
      ctx,
      "面向编程与智能体编排的工作模型，距 3.6 Flash 仅约三周。引入价约为原 3.6 Flash 的一半，并覆盖 160 余个国家。Google 同时把 Gemini Spark 个人智能体切到这一代，强调全天候代办与 Workspace 工具调用。",
      160,
      580,
      1000,
      26,
      b2
    );
    drawStat(ctx, "3.7", "Flash", "工作模型迭代", 160, 820, C.blue, b2);
    drawStat(ctx, "1/2", "", "引入价相对 3.6 Flash", 560, 820, C.cyan, b2);
    drawStat(ctx, "160+", "国", "同步可用范围", 1000, 820, C.text, b2);
  }

  const b3 = hold(local, 36.5, 49.6, 0.55);
  if (b3 > 0) {
    drawCard(ctx, 120, 400, 1680, 520, C.violet, b3);
    drawLabel(ctx, "2026.08.12  ·  SPACEXAI  （原 xAI，2 月并入 SpaceX）", 160, 460, C.violet, b3);
    drawTitle(ctx, "Grok 4.6  ·  长程智能体", 160, 540, 58, b3);
    drawParagraph(
      ctx,
      "在 4.5 基座上做后训练升级：50 万 token 上下文，新增 xhigh 推理档，针对「跨很多步仍不跑偏」的研究、代码与交互式产品。第三方 Artificial Analysis 智力指数报 61，与 GPT-5.6 Sol Max 持平。",
      160,
      580,
      1000,
      26,
      b3
    );
    drawStat(ctx, "500K", "", "上下文窗口", 160, 820, C.violet, b3);
    drawStat(ctx, "61", "", "AA 智力指数", 620, 820, C.cyan, b3);
    drawStat(ctx, "xhigh", "", "新的推理力度", 1000, 820, C.amber, b3, 0.86);
  }
}

function drawRobot(ctx, local, t) {
  drawChapterSting(ctx, local, "02", "EMBODIED REASONING", "具身机器人", C.blue);
  const lead = hold(local, 3.0, 12.0, 0.55);
  drawParagraph(
    ctx,
    "当模型快到可以边做边想，下一站就是身体。Google DeepMind 发布 Gemini Robotics ER 2：它不是直接拧螺丝的运动模型，而是机器人的高层大脑。",
    120,
    410,
    1000,
    30,
    lead
  );

  const b1 = hold(local, 11.5, 39.6, 0.5);
  if (b1 > 0) {
    drawAgents(ctx, t, b1);
    const points = [
      ["连续视频", "看着自己做到哪一步，出错就改，做完再进入下一步"],
      ["任务编排", "把多步工作拆开，再交给底层视觉-语言-动作模型执行"],
      ["多机协作", "不同构型的机器人共享语义，在同一空间交接任务"],
      ["工具调用", "可检索、可调用自定义函数，边行动边补全世界知识"],
    ];
    points.forEach((p, i) => {
      const y = 400 + i * 130;
      const ia = b1 * appear(local, 12 + i * 0.35, 0.45);
      drawCard(ctx, 120, y, 860, 112, C.blue, ia);
      ctx.save();
      ctx.globalAlpha = ia;
      ctx.fillStyle = C.text;
      font(ctx, 28, FONT.scb);
      ctx.fillText(p[0], 156, y + 46);
      ctx.fillStyle = C.muted;
      font(ctx, 22, FONT.sc);
      ctx.fillText(p[1], 156, y + 84);
      ctx.restore();
    });
  }
}

function drawChips(ctx, local, t) {
  drawChapterSting(ctx, local, "03", "COMPUTE  &  SILICON", "算力芯片", C.amber);
  drawCircuit(ctx, t, 0.55 * appear(local, 1.2, 1));

  const b1 = hold(local, 3.2, 23.5, 0.55);
  if (b1 > 0) {
    drawCard(ctx, 120, 400, 1100, 520, C.amber, b1);
    drawLabel(ctx, "2026.08.06  ·  TESLA  ×  SPACEX", 160, 460, C.amber, b1);
    drawTitle(ctx, "Terafab  落子德州", 160, 545, 56, b1);
    drawParagraph(
      ctx,
      "双方宣布在得州格莱姆斯县启动先进晶圆厂，首期投资 168 亿美元，规划超 1 亿平方英尺制造空间，把逻辑与存储的制造、封装、测试放在同一地点。目标芯片既供 Optimus、Cybercab 的端侧推理，也供 SpaceX 设想中的太空数据中心。",
      160,
      590,
      1000,
      26,
      b1
    );
    drawStat(ctx, "168", "亿美金", "首期投资", 160, 840, C.amber, b1);
    drawStat(ctx, "1亿+", "平方英尺", "规划厂房", 560, 840, C.text, b1);
  }

  const b2 = hold(local, 23.2, 43.6, 0.55);
  if (b2 > 0) {
    drawCard(ctx, 120, 400, 1100, 520, C.cyan, b2);
    drawLabel(ctx, "2026.02 起测  ·  NASA JPL  ×  MICROCHIP", 160, 460, C.cyan, b2);
    drawTitle(ctx, "HPSC  ·  Hello Universe", 160, 545, 56, b2);
    drawParagraph(
      ctx,
      "掌心大小的抗辐照高性能处理器进入喷射推进实验室测试。项目目标是把航天计算能力提升约两个数量级；早期迹象显示，相对现役抗辐照芯片可达约 500 倍性能。架构为 64 位 RISC-V，面向深空自主、成像与机载人工智能。尚未完成飞行鉴定。",
      160,
      590,
      1000,
      26,
      b2
    );
    drawStat(ctx, "500×", "", "相对现役抗辐照芯片", 160, 840, C.cyan, b2);
    drawStat(ctx, "RISC-V", "", "开放指令集", 700, 840, C.violet, b2, 0.78);
  }
}

function drawEnergy(ctx, local, t) {
  drawChapterSting(ctx, local, "04", "ENERGY  STORAGE", "能源存储", C.green);
  const b1 = hold(local, 3.2, 18.5, 0.5);
  if (b1 > 0) {
    drawBatteries(ctx, local, b1);
    drawCard(ctx, 120, 400, 1000, 520, C.green, b1);
    drawLabel(ctx, "2026  ·  远景  ·  内蒙古", 160, 460, C.green, b1);
    drawTitle(ctx, "12.8 GWh 储能集群", 160, 545, 54, b1);
    drawParagraph(
      ctx,
      "查干哈达等站点连成目前公开报道中规模最大的电化学储能集群之一，并把人工智能写入电池管理：实时调度、现货交易与电网构网。同一区域的绿色算力园区，试图用风电加储能给高密度加速卡供电。",
      160,
      590,
      900,
      26,
      b1
    );
    drawStat(ctx, "12.8", "GWh", "集群规模", 160, 840, C.green, b1);
  }

  const b2 = hold(local, 18.2, 32.2, 0.5);
  if (b2 > 0) {
    drawBatteries(ctx, local + 2, b2);
    drawCard(ctx, 120, 400, 1000, 520, C.amber, b2);
    drawLabel(ctx, "2026.08  ·  TESLA  BROOKSHIRE", 160, 460, C.amber, b2);
    drawTitle(ctx, "Megapack 3  投产", 160, 545, 54, b2);
    drawParagraph(
      ctx,
      "得州新厂从奠基到投产约 16 个月，设计年产能 50 GWh。单台约 5 MWh，较上一代同占地提升约 28% 能量。配套 Megablock 把更多接线移入工厂，宣称 20 个工作日可部署 1 GWh。",
      160,
      590,
      900,
      26,
      b2
    );
    drawStat(ctx, "5", "MWh", "单台容量", 160, 840, C.amber, b2);
    drawStat(ctx, "+28%", "", "同占地能量", 520, 840, C.green, b2);
  }

  const b3 = hold(local, 31.9, 47.6, 0.5);
  if (b3 > 0) {
    drawCard(ctx, 120, 400, 1680, 520, C.cyan, b3);
    drawLabel(ctx, "2026.07–08  ·  固态电池产业化窗口", 160, 460, C.cyan, b3);
    drawTitle(ctx, "硫化物固态，开车上路", 160, 545, 54, b3);
    drawParagraph(
      ctx,
      "中科源本完成中国公开报道中的首次硫化物全固态电池实车路试；电解质产线与数十 GWh 级项目同步推进。比亚迪新增多件双电解质正极固态专利，并展望 2027 小规模试产。行业共识仍在：量产上车还要越过界面、工艺与成本三道坎。",
      160,
      590,
      1500,
      26,
      b3
    );
    drawStat(ctx, "首次", "", "硫化物全固态路试", 160, 840, C.cyan, b3, 0.86);
    drawStat(ctx, "2027", "", "BYD 试产时间窗", 700, 840, C.amber, b3);
  }
}

function drawBio(ctx, local, t) {
  drawChapterSting(ctx, local, "05", "LIFE  SCIENCE", "生命科学", C.rose);
  drawHelix(ctx, t, 0.8 * appear(local, 1, 1));
  const b1 = hold(local, 3.2, 37.6, 0.5);
  if (b1 > 0) {
    drawCard(ctx, 120, 400, 1080, 520, C.rose, b1);
    drawLabel(ctx, "2026.08.12  ·  NATURE", 160, 460, C.rose, b1);
    drawTitle(ctx, "在实体瘤里做全基因组筛选", 160, 545, 46, b1);
    drawParagraph(
      ctx,
      "斯坦福等团队建立可高效回收肿瘤内人 T 细胞的体内模型，首次把全基因组 CRISPR 筛选做到实体瘤微环境里。丰度筛选指向 P2RY8–Gα13 轴抑制浸润；效应筛选指向 GNAS/Gαs 作为多种抑制信号的汇合点。敲除后，CAR 与 TCR 体系在多种实体瘤模型中都更强；两靶联用再进一步。",
      160,
      600,
      980,
      26,
      b1
    );
    drawStat(ctx, "P2RY8", "", "浸润负调控", 160, 860, C.rose, b1, 0.7);
    drawStat(ctx, "GNAS", "", "耗竭汇合点", 560, 860, C.violet, b1, 0.7);
  }
}

function drawSpace(ctx, local, t) {
  drawChapterSting(ctx, local, "06", "SPACE  COMPUTE", "太空计算", C.violet);
  drawOrbits(ctx, t, 0.9 * appear(local, 1, 1));

  const b1 = hold(local, 3.2, 20.5, 0.5);
  if (b1 > 0) {
    drawCard(ctx, 120, 400, 1040, 520, C.violet, b1);
    drawLabel(ctx, "2026.08.05  ·  海阳海上发射  ·  捷龙三号", 160, 460, C.violet, b1);
    drawTitle(ctx, "东方慧眼：卫星开始推理", 160, 545, 48, b1);
    drawParagraph(
      ctx,
      "两颗高光谱 AI 卫星入轨，星上算力约 400 TOPS。它们不再把原始数据全部送回地面，而是在轨道上做特征提取与异常检测，响应从「天」压到「分钟」。规划星座超过两百颗，并已绑定印尼、乌兹别克斯坦等国际载荷。",
      160,
      600,
      940,
      26,
      b1
    );
    drawStat(ctx, "400", "TOPS", "单星智能算力", 160, 850, C.violet, b1);
    drawStat(ctx, "分钟", "", "从回传再处理，到在轨出结果", 620, 850, C.cyan, b1, 0.78);
  }

  const b2 = hold(local, 20.2, 37.6, 0.5);
  if (b2 > 0) {
    drawCard(ctx, 120, 400, 1040, 520, C.cyan, b2);
    drawLabel(ctx, "深空时延  ·  单向可超过 20 分钟", 160, 460, C.cyan, b2);
    drawTitle(ctx, "地球来不及遥控的地方", 160, 545, 48, b2);
    drawParagraph(
      ctx,
      "HPSC 要解决的，是火星与更远距离上「问一声要等三刻钟」的物理事实。与此同时，产业叙事把数据中心也送上轨道： Terafab 的高端芯片清单里，明确写着太空数据中心。感知、决策、训练，正在同时离开地面。",
      160,
      600,
      940,
      26,
      b2
    );
    drawStat(ctx, "44", "分钟", "深空往返通信可及", 160, 850, C.cyan, b2);
    drawStat(ctx, "在轨", "", "推理与未来训练", 620, 850, C.amber, b2, 0.86);
  }
}

function drawClose(ctx, local) {
  const a = appear(local, 0.2, 0.8);
  drawLabel(ctx, "CODA", 120, 200, C.cyan, a);
  drawTitle(ctx, "三条仍会继续变陡的线", 120, 300, 64, a, lerp(18, 0, a));

  const lines = [
    [C.cyan, "速度", "前沿智能开始按「每秒有效工作」计价"],
    [C.blue, "落地", "大脑接到身体、卫星和工厂"],
    [C.amber, "能源", "没有存储与芯片，智能只是一张账单"],
  ];
  lines.forEach((ln, i) => {
    const ia = appear(local, 1.1 + i * 0.35, 0.5);
    drawCard(ctx, 120 + i * 560, 380, 520, 220, ln[0], ia);
    ctx.save();
    ctx.globalAlpha = ia;
    ctx.fillStyle = ln[0];
    font(ctx, 36, FONT.scb);
    ctx.fillText(ln[1], 156 + i * 560, 460);
    ctx.fillStyle = C.muted;
    font(ctx, 24, FONT.sc);
    const lines2 = wrapText(ctx, ln[2], 440, 24);
    lines2.forEach((t, k) => ctx.fillText(t, 156 + i * 560, 520 + k * 36));
    ctx.restore();
  });

  const a2 = appear(local, 4.2, 0.8);
  ctx.save();
  ctx.globalAlpha = a2;
  ctx.fillStyle = C.dim;
  font(ctx, 22, FONT.sc);
  ctx.textAlign = "left";
  ctx.fillText("依据 2026 年 2–8 月公开报道整理，测试中与预览中的能力并未等同于全面量产。", 120, 700);
  ctx.fillText("画面由 HTML Canvas 逐帧绘制，经 FFmpeg 封装。", 120, 740);
  ctx.fillStyle = C.text;
  font(ctx, 28, FONT.scb);
  ctx.fillText("半年很短。曲线已经不短。", 120, 820);
  ctx.restore();
}

const DRAWS = {
  open: (ctx, local) => drawOpen(ctx, local),
  toc: (ctx, local) => drawToc(ctx, local),
  ai: (ctx, local, t) => drawAi(ctx, local, t),
  robot: (ctx, local, t) => drawRobot(ctx, local, t),
  chips: (ctx, local, t) => drawChips(ctx, local, t),
  energy: (ctx, local, t) => drawEnergy(ctx, local, t),
  bio: (ctx, local, t) => drawBio(ctx, local, t),
  space: (ctx, local, t) => drawSpace(ctx, local, t),
  close: (ctx, local) => drawClose(ctx, local),
};

export function chapterAt(t) {
  return CHAPTERS.find((c) => t >= c.start && t < c.end) || CHAPTERS[CHAPTERS.length - 1];
}

export function drawFrame(ctx, time) {
  const t = clamp(time, 0, DURATION - 1 / FPS);
  drawWorld(ctx, t);
  const scene = chapterAt(t);
  const idx = CHAPTERS.indexOf(scene);
  const next = CHAPTERS[idx + 1];
  const local = t - scene.start;
  const edge = scene.end - t;
  if (next && edge < 0.7) {
    const k = easeInOutCubic(clamp(edge / 0.7, 0, 1));
    ctx.save();
    ctx.globalAlpha = k;
    DRAWS[scene.id](ctx, local, t);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 1 - k;
    DRAWS[next.id](ctx, t - next.start, t);
    ctx.restore();
  } else {
    DRAWS[scene.id](ctx, local, t);
  }
  drawVignette(ctx);
  drawChrome(ctx, t);
}

export const STILL_TIMES = [
  8, 22, 32, 44, 56, 70, 84, 102, 132, 150, 176, 196, 222, 240, 262, 276, 292,
];
