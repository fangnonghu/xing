import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DURATION = 300;
const SR = 44100;
const CHAPTERS = [0, 16, 28, 78, 118, 162, 210, 248, 286];

function env(t, start, attack, hold, release) {
  if (t < start) return 0;
  const u = t - start;
  if (u < attack) return u / attack;
  if (u < attack + hold) return 1;
  if (u < attack + hold + release) return 1 - (u - attack - hold) / release;
  return 0;
}

function make() {
  const n = Math.floor(SR * DURATION);
  const L = new Float64Array(n);
  const R = new Float64Array(n);
  let brown = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const fade =
      t < 2.5 ? t / 2.5 : t > DURATION - 3.2 ? Math.max(0, (DURATION - t) / 3.2) : 1;

    const drone =
      Math.sin(2 * Math.PI * 46.25 * t) * (0.07 + 0.02 * Math.sin(2 * Math.PI * 0.045 * t)) +
      Math.sin(2 * Math.PI * 69.3 * t) * (0.045 + 0.015 * Math.sin(2 * Math.PI * 0.031 * t + 1.2)) +
      Math.sin(2 * Math.PI * 92.5 * t) * 0.018;

    const shimmer =
      Math.sin(2 * Math.PI * 369.99 * t) * 0.01 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.07 * t)) +
      Math.sin(2 * Math.PI * 493.88 * t) * 0.006 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.053 * t + 0.7));

    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;
    const air = brown * 0.035;

    let bell = 0;
    for (const c of CHAPTERS) {
      const e = env(t, c, 0.02, 0.08, 1.8);
      if (e > 0) {
        bell +=
          Math.sin(2 * Math.PI * 523.25 * (t - c)) * e * 0.045 +
          Math.sin(2 * Math.PI * 784.0 * (t - c)) * e * 0.02;
      }
    }

    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / 8));
    const sample = (drone * (0.85 + 0.15 * pulse) + shimmer + air + bell) * fade;
    const width = 0.12 * Math.sin(2 * Math.PI * 0.02 * t);
    L[i] = sample * (1 - width);
    R[i] = sample * (1 + width);
  }

  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const gain = 0.72 / peak;
  const bytes = Buffer.alloc(44 + n * 4);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + n * 4, 4);
  bytes.write("WAVE", 8);
  bytes.write("fmt ", 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(SR, 24);
  bytes.writeUInt32LE(SR * 4, 28);
  bytes.writeUInt16LE(4, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(n * 4, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, Math.tanh(L[i] * gain * 1.1)));
    const r = Math.max(-1, Math.min(1, Math.tanh(R[i] * gain * 1.1)));
    bytes.writeInt16LE((l * 32767) | 0, o);
    bytes.writeInt16LE((r * 32767) | 0, o + 2);
    o += 4;
  }
  return bytes;
}

const out = resolve(__dirname, "../output/score.wav");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, make());
console.log(`wrote ${out}`);
