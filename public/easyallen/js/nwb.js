// Main-thread client for the NWB worker. Keeps a small in-memory cache of
// recently viewed sweeps so flipping back and forth is instant.

let worker = null;
let nextId = 1;
const pending = new Map();
const cache = new Map(); // "url#sweep" -> sweep
const CACHE_MAX = 8;

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker("js/nwb-worker.js");
  worker.onmessage = (ev) => {
    const m = ev.data;
    const p = pending.get(m.id);
    if (!p) return;
    if (m.type === "progress") {
      if (p.onProgress) p.onProgress(m.bytes);
      return;
    }
    pending.delete(m.id);
    if (m.type === "done") p.resolve(m.result);
    else p.reject(new Error(m.message));
  };
  worker.onerror = (ev) => {
    const err = new Error(ev.message || "The recording reader failed to start. Check your internet connection and reload.");
    for (const p of pending.values()) p.reject(err);
    pending.clear();
    worker = null;
  };
  return worker;
}

// Resolves to { response: Float32Array (mV), stimulus: Float32Array (pA), rate, sweep }.
export function loadSweep(url, sweep, onProgress) {
  const key = `${url}#${sweep}`;
  if (cache.has(key)) {
    const hit = cache.get(key);
    cache.delete(key);
    cache.set(key, hit);
    return Promise.resolve(hit);
  }
  const w = ensureWorker();
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, {
      onProgress,
      resolve: (r) => {
        sanityScale(r);
        cache.set(key, r);
        if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
        resolve(r);
      },
      reject,
    });
    w.postMessage({ id, type: "sweep", url, sweep });
  });
}

// Guard against files whose unit metadata disagrees with the SDK's rules:
// a membrane potential should sit in the tens of mV.
function sanityScale(r) {
  const v = r.response;
  const probe = Math.abs(v[Math.floor(v.length * 0.05)] || v[0] || 0);
  if (probe > 5000) for (let i = 0; i < v.length; i++) v[i] /= 1000; // was already mV
  else if (probe > 0 && probe < 0.5) for (let i = 0; i < v.length; i++) v[i] *= 1000; // still volts
}
