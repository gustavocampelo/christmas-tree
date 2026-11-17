export const TAU = Math.PI * 2;
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const smoothstep = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const mod = (x: number, n: number) => ((x % n) + n) % n;
