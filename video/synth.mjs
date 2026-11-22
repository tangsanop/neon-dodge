// Tiny chiptune bed for the video: Am - F - C - G arpeggios at 132 BPM,
// square-wave lead with decay, soft bass, kick + hat. Writes music.wav.
// Pure synthesis, no samples, deterministic.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SR = 44100;
const BPM = 132;
const BEAT = 60 / BPM;
const DUR = 42; // seconds

const N = {
  A2: 110.0, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0,
  A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.0,
};
// chords: [root, arp notes...] one bar each, 4 bars looping
const CHORDS = [
  { bass: N.A2, arp: [N.A3, N.C4, N.E4, N.A4, N.E4, N.C4] },
  { bass: N.F3, arp: [N.F3, N.A3, N.C4, N.F4, N.C4, N.A3] },
  { bass: N.C3, arp: [N.C3, N.E3, N.G3, N.C4, N.G3, N.E3] },
  { bass: N.G3, arp: [N.G3, N.B3, N.D4, N.G4, N.D4, N.B3] },
];

const total = Math.floor(SR * DUR);
const out = new Float32Array(total);

function square(ph) { const x = ph % 1; return x < 0.5 ? 1 : -1; }
function addTone(t0, len, freq, vol, wave) {
  const start = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  for (let i = 0; i < n && start + i < total; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 5.5);
    const v = (wave === "square" ? square(t * freq) : Math.sin(2 * Math.PI * freq * t)) * env * vol;
    out[start + i] += v;
  }
}
function addKick(t0) {
  const start = Math.floor(t0 * SR);
  const n = Math.floor(0.16 * SR);
  for (let i = 0; i < n && start + i < total; i++) {
    const t = i / SR;
    const f = 130 - 90 * (t / 0.16);
    const env = Math.exp(-t * 22);
    out[start + i] += Math.sin(2 * Math.PI * f * t) * env * 0.5;
  }
}
function addHat(t0) {
  const start = Math.floor(t0 * SR);
  const n = Math.floor(0.05 * SR);
  let seed = 12345;
  for (let i = 0; i < n && start + i < total; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const noise = seed / 0x7fffffff * 2 - 1;
    const env = Math.exp(-i / SR * 90);
    out[start + i] += noise * env * 0.05;
  }
}

const BAR = BEAT * 4;
for (let bar = 0; bar * BAR < DUR; bar++) {
  const c = CHORDS[bar % CHORDS.length];
  const t0 = bar * BAR;
  // bass on beats 1 and 3
  addTone(t0, BEAT * 1.8, c.bass, 0.22, "sine");
  addTone(t0 + BEAT * 2, BEAT * 1.8, c.bass, 0.22, "sine");
  // 8th-note arpeggio
  for (let i = 0; i < 8; i++) {
    const f = c.arp[i % c.arp.length];
    addTone(t0 + i * BEAT / 2, BEAT * 0.42, f, 0.085, "square");
  }
  // kick on every beat, hat on off-beats
  for (let b = 0; b < 4; b++) addKick(t0 + b * BEAT);
  for (let b = 0; b < 4; b++) addHat(t0 + b * BEAT + BEAT / 2);
}
// gentle master fade out over the last 2 s
for (let i = 0; i < total; i++) {
  const t = i / SR;
  if (t > DUR - 2) out[i] *= (DUR - t) / 2;
  if (out[i] > 0.95) out[i] = 0.95;
  if (out[i] < -0.95) out[i] = -0.95;
}

// write 16-bit stereo WAV
const data = Buffer.alloc(44 + total * 4);
data.write("RIFF", 0); data.writeUInt32LE(36 + total * 4, 4); data.write("WAVE", 8);
data.write("fmt ", 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20);
data.writeUInt16LE(2, 22); data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 4, 28);
data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34);
data.write("data", 36); data.writeUInt32LE(total * 4, 40);
for (let i = 0; i < total; i++) {
  const s = Math.round(out[i] * 32767);
  data.writeInt16LE(s, 44 + i * 4);
  data.writeInt16LE(s, 44 + i * 4 + 2);
}
fs.writeFileSync(path.join(__dirname, "music.wav"), data);
console.log("music.wav written", DUR + "s");
