// Mulberry32; independent instances keep geometry and snowfall decoupled.
export function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    let t = state += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
