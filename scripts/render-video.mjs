import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { attachSurfaces, drawFrame, WIDTH, HEIGHT, DURATION, FPS, STILL_TIMES } from "../src/film.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function registerFonts() {
  const fonts = [
    ["fonts/NotoSansSC-400.ttf", "NotoSansSC"],
    ["fonts/NotoSansSC-500.ttf", "NotoSansSCMedium"],
    ["fonts/NotoSansSC-700.ttf", "NotoSansSCBold"],
    ["fonts/NotoSans-400.ttf", "NotoSans"],
    ["fonts/NotoSans-600.ttf", "NotoSans"],
    ["fonts/NotoSans-700.ttf", "NotoSansBold"],
    ["fonts/wqy-microhei.ttc", "WenQuanYi Micro Hei"],
  ];
  for (const [rel, name] of fonts) {
    const p = resolve(root, rel);
    if (existsSync(p)) GlobalFonts.registerFromPath(p, name);
  }
}

function ensureAudio() {
  const wav = resolve(root, "output/score.wav");
  if (existsSync(wav)) return Promise.resolve(wav);
  return new Promise((res, rej) => {
    const child = spawn(process.execPath, [resolve(root, "scripts/make-audio.mjs")], {
      stdio: "inherit",
    });
    child.on("exit", (code) => (code === 0 ? res(wav) : rej(new Error(`audio exit ${code}`))));
  });
}

registerFonts();
attachSurfaces((w, h) => createCanvas(w, h));

const stillsOnly = process.argv.includes("--stills");
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");
ctx.textDrawingMode = "path";

if (stillsOnly) {
  const dir = resolve(root, "stills");
  mkdirSync(dir, { recursive: true });
  for (const t of STILL_TIMES) {
    drawFrame(ctx, t);
    const file = resolve(dir, `t${String(Math.round(t)).padStart(3, "0")}.png`);
    writeFileSync(file, canvas.toBuffer("image/png"));
    console.log("still", file);
  }
  process.exit(0);
}

mkdirSync(resolve(root, "output"), { recursive: true });
const wav = await ensureAudio();
const mp4 = resolve(root, "output/tech-2026-h1.mp4");
const frames = DURATION * FPS;

const ff = spawn(
  "ffmpeg",
  [
    "-y",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgba",
    "-s",
    `${WIDTH}x${HEIGHT}`,
    "-r",
    String(FPS),
    "-i",
    "-",
    "-i",
    wav,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "19",
    "-preset",
    "medium",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-shortest",
    "-movflags",
    "+faststart",
    mp4,
  ],
  { stdio: ["pipe", "inherit", "inherit"] }
);

const started = Date.now();
for (let i = 0; i < frames; i++) {
  drawFrame(ctx, i / FPS);
  const ok = ff.stdin.write(Buffer.from(ctx.getImageData(0, 0, WIDTH, HEIGHT).data));
  if (!ok) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 48 === 0) {
    const sec = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`frame ${i}/${frames}  t=${(i / FPS).toFixed(1)}s  elapsed=${sec}s`);
  }
}

ff.stdin.end();
const code = await new Promise((res) => ff.on("close", res));
if (code !== 0) {
  console.error("ffmpeg failed", code);
  process.exit(code ?? 1);
}
console.log(`wrote ${mp4}`);
