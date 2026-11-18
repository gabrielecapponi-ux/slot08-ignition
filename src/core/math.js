export const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const mod = (x, n) => ((x % n) + n) % n;
export const smoothstep = t => t * t * (3 - 2 * t);
export function smootherstep(t) {
  t = clamp(t, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '—:—.———';
  const ms = Math.floor(Math.max(0, seconds) * 1000);
  return `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}
