// Spike-train analysis. Same definitions as the original course notebook:
// a spike is an upward crossing of a voltage threshold (default −20 mV).

export const DEFAULT_THRESHOLD = -20; // mV

// Returns spike times in seconds. t(i) = t0 + i / rate.
export function detectSpikes(v, rate, { threshold = DEFAULT_THRESHOLD, t0 = 0, from = 0, to = Infinity } = {}) {
  const out = [];
  const i0 = Math.max(0, Math.ceil((from - t0) * rate));
  const i1 = Math.min(v.length - 1, Math.floor((to - t0) * rate));
  for (let i = i0; i < i1; i++) {
    if (v[i] < threshold && v[i + 1] >= threshold) out.push(t0 + i / rate);
  }
  return out;
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const std = (a) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length);
};

// Ratio of mean(last n ISIs) / mean(first n ISIs). >1 means the cell slowed down.
export function adaptationRatio(spikes, n = 3) {
  const isi = diff(spikes);
  if (isi.length < 2 * n) return null;
  return mean(isi.slice(-n)) / mean(isi.slice(0, n));
}

export function diff(a) {
  const out = [];
  for (let i = 1; i < a.length; i++) out.push(a[i] - a[i - 1]);
  return out;
}

export function rollingMean(arr, window = 3) {
  const out = arr.slice();
  const half = Math.floor(window / 2);
  for (let i = half; i < arr.length - half; i++) out[i] = mean(arr.slice(i - half, i + half + 1));
  return out;
}

export function spikeStats(spikes) {
  const isi = diff(spikes); // s
  const ifr = isi.map((x) => 1 / x); // Hz
  const tIfr = isi.map((_, i) => (spikes[i] + spikes[i + 1]) / 2);
  const s = {
    count: spikes.length,
    spikes,
    isi,
    ifr,
    tIfr,
    firstIsi: isi.slice(0, 3).map((x) => x * 1000),
    lastIsi: isi.slice(-3).map((x) => x * 1000),
    ar: adaptationRatio(spikes),
    cv: isi.length >= 2 ? std(isi) / mean(isi) : null,
    ifrFirst: ifr.length ? ifr[0] : null,
    ifrLast: ifr.length ? ifr[ifr.length - 1] : null,
    latency: null,
    meanRate: null,
  };
  return s;
}

// Baseline (pre-stimulus) voltage and steady-state voltage near the end of the step.
export function levels(v, rate, t0, stimStart, stimEnd) {
  const avg = (a, b) => {
    const i0 = Math.max(0, Math.floor((a - t0) * rate));
    const i1 = Math.min(v.length, Math.floor((b - t0) * rate));
    if (i1 <= i0) return null;
    let s = 0;
    for (let i = i0; i < i1; i++) s += v[i];
    return s / (i1 - i0);
  };
  return {
    baseline: stimStart ? avg(Math.max(t0, stimStart - 0.1), stimStart - 0.005) : null,
    steady: stimEnd ? avg(stimEnd - 0.1, stimEnd - 0.005) : null,
  };
}

// Find the stimulus step from the current trace when metadata is missing:
// the longest run where the current is far from its starting value.
export function findStimulus(i, rate, t0 = 0) {
  let maxAbs = 0;
  const base = i[0] || 0;
  for (let k = 0; k < i.length; k++) maxAbs = Math.max(maxAbs, Math.abs(i[k] - base));
  if (!maxAbs) return null;
  const thr = maxAbs * 0.5;
  let best = null;
  let runStart = -1;
  for (let k = 0; k <= i.length; k++) {
    const on = k < i.length && Math.abs(i[k] - base) > thr;
    if (on && runStart < 0) runStart = k;
    if (!on && runStart >= 0) {
      if (!best || k - runStart > best[1] - best[0]) best = [runStart, k];
      runStart = -1;
    }
  }
  return best ? { start: t0 + best[0] / rate, end: t0 + best[1] / rate } : null;
}
