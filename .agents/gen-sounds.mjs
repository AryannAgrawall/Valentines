// Synthesizes two custom SFX tuned to the site's warm, candlelit mood:
//   sounds/chime.wav      — a music-box-style ascending major arpeggio (on "Yes")
//   sounds/seal-break.wav — a soft paper/envelope open (on opening the letter)
// Pure Node, no deps. 44.1kHz mono 16-bit PCM.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SR = 44100;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function writeWav(file, samples) {
    // soft-limit + normalize to -1.5 dBFS, then fade the last 8ms to kill clicks.
    let peak = 0;
    for (const s of samples) peak = Math.max(peak, Math.abs(s));
    const norm = peak > 0 ? (0.84 / peak) : 1;
    const fade = Math.min(samples.length, Math.floor(0.008 * SR));
    const n = samples.length;
    const buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
    buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
    buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
    buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) {
        let v = samples[i] * norm;
        if (i > n - fade) v *= (n - i) / fade;          // tail fade
        v = Math.tanh(v * 1.1);                           // gentle saturation for warmth
        buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), 44 + i * 2);
    }
    fs.writeFileSync(file, buf);
    console.log('wrote', path.relative(root, file), `(${(buf.length / 1024).toFixed(0)} KB, ${(n / SR).toFixed(2)}s)`);
}

// --- Schroeder reverb: a soft tail so notes bloom like a warm room -----------
function reverb(dry, wetMix) {
    const combs = [[1116, 0.74], [1188, 0.72], [1277, 0.70], [1356, 0.68]];
    const allpass = [[556, 0.5], [441, 0.5]];
    const out = new Float64Array(dry.length);
    for (const [D, g] of combs) {
        const z = new Float64Array(dry.length + D);
        for (let i = 0; i < dry.length; i++) {
            const y = dry[i] + g * z[i];
            z[i + D] = y;
            out[i] += y;
        }
    }
    for (let i = 0; i < out.length; i++) out[i] *= 0.25;
    for (const [D, g] of allpass) {
        const z = new Float64Array(out.length + D);
        for (let i = 0; i < out.length; i++) {
            const x = out[i];
            const y = -g * x + z[i];
            z[i + D] = x + g * y;
            out[i] = y;
        }
    }
    const mixed = new Float64Array(dry.length);
    for (let i = 0; i < dry.length; i++) mixed[i] = dry[i] * (1 - wetMix) + out[i] * wetMix;
    return mixed;
}

// ============================ CHIME ==========================================
function makeChime() {
    const dur = 2.3, N = Math.floor(dur * SR);
    const buf = new Float64Array(N);
    // Ascending major arpeggio C6-E6-G6-C7, the last note softer (a sparkle).
    const notes = [
        { f: 1046.50, t: 0.00, g: 1.00 },
        { f: 1318.51, t: 0.11, g: 0.95 },
        { f: 1567.98, t: 0.22, g: 0.90 },
        { f: 2093.00, t: 0.34, g: 0.55 },
    ];
    // Warm, music-box-ish partial set (slightly inharmonic for shimmer).
    const partials = [1, 2, 3, 4.16, 5.43, 6.81];
    const pAmp = [1.0, 0.55, 0.26, 0.12, 0.06, 0.03];
    for (const note of notes) {
        const start = Math.floor(note.t * SR);
        for (let i = start; i < N; i++) {
            const t = (i - start) / SR;
            const atk = Math.min(1, t / 0.004);          // 4ms soft attack (no click)
            let s = 0;
            for (let k = 0; k < partials.length; k++) {
                const tau = 0.34 / (1 + 0.55 * k);        // higher partials fade faster
                s += pAmp[k] * Math.exp(-t / tau) * Math.sin(2 * Math.PI * note.f * partials[k] * t);
            }
            buf[i] += s * atk * note.g * 0.5;
        }
    }
    writeWav(path.join(root, 'sounds', 'chime.wav'), reverb(buf, 0.28));
}

// ========================== SEAL-BREAK =======================================
// A soft paper/envelope open: a low flap thud + gently-filtered crinkle texture,
// kept warm (not hissy) so it sits under the music rather than cutting through.
function makeSeal() {
    const dur = 0.72, N = Math.floor(dur * SR);
    const buf = new Float64Array(N);

    // 1) Low, soft "flap" thud at the very start.
    for (let i = 0; i < N; i++) {
        const t = i / SR;
        buf[i] += 0.6 * Math.exp(-t / 0.07) * Math.sin(2 * Math.PI * 116 * t);
    }

    // 2) Crinkle: low-passed noise shaped by a soft swell, with a few paper grains.
    let lp = 0, hp = 0, prev = 0;
    const grains = [0.02, 0.09, 0.15, 0.23, 0.31, 0.4].map(t => ({ t, a: 0.4 + Math.random() * 0.5 }));
    for (let i = 0; i < N; i++) {
        const t = i / SR;
        // overall envelope: quick swell then decay across ~0.5s
        const env = Math.min(1, t / 0.03) * Math.exp(-t / 0.26);
        // grain emphasis (little crinkles)
        let g = 0.5;
        for (const gr of grains) g += gr.a * Math.exp(-Math.pow((t - gr.t) / 0.025, 2));
        let nz = (Math.random() * 2 - 1) * env * g;
        // one-pole low-pass (~5.5kHz) to soften, then high-pass (~400Hz) to de-rumble
        lp += (nz - lp) * 0.55;
        hp = 0.92 * (hp + lp - prev); prev = lp;
        buf[i] += hp * 0.5;
    }
    writeWav(path.join(root, 'sounds', 'seal-break.wav'), reverb(buf, 0.08));
}

makeChime();
makeSeal();
