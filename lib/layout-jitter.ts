/**
 * Deterministic pseudo-random in [-1, 1] from a string id (stable across renders).
 */
export function hash01(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to [-1, 1]
  return ((h >>> 0) % 10000) / 5000 - 1;
}

/** Deterministic jitter magnitude in px for seeding node positions. */
export function seedJitterPx(id: string, amplitude = 12): number {
  return hash01(id) * amplitude;
}
