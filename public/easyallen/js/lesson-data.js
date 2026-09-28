// Bundled sweeps for the firing-patterns lab (same recordings as the original
// Colab notebook), stored as int16: voltage in 1/32 mV steps, then current in pA.

let metaPromise = null;
const cache = new Map();

export function lessonMeta() {
  if (!metaPromise) metaPromise = fetch("data/lesson.json", { cache: "no-cache" }).then((r) => {
    if (!r.ok) throw new Error("Could not load the lab recordings (data/lesson.json).");
    return r.json();
  });
  return metaPromise;
}

export async function lessonSweep(key) {
  if (cache.has(key)) return cache.get(key);
  const meta = (await lessonMeta())[key];
  const res = await fetch(meta.file, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Could not load ${meta.file}.`);
  const raw = new Int16Array(await res.arrayBuffer());
  const n = meta.n;
  const response = new Float32Array(n);
  const stimulus = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    response[i] = raw[i] * meta.v_scale;
    stimulus[i] = raw[n + i];
  }
  const out = { ...meta, response, stimulus, t0: meta.t0 };
  cache.set(key, out);
  return out;
}
