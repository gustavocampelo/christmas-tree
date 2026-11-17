import { CONFIG, type Quality } from './config.ts';
import { clamp, mod, TAU } from './math.ts';
import { random } from './random.ts';

export class SceneClock {
  time: number;
  angle: number;
  paused: boolean;
  speed: number = CONFIG.rotation.speed;
  private previous: number | null = null;

  constructor(time = 0, paused = false) {
    this.time = time;
    this.angle = time * this.speed;
    this.paused = paused;
  }
  tick(now: number): number {
    const dt = this.previous === null ? 0 : clamp((now - this.previous) / 1000, 0, 0.05);
    this.previous = now;
    if (!this.paused) { this.time += dt; this.angle += dt * this.speed; }
    return dt;
  }
  reset() { this.time = 0; this.angle = 0; this.previous = null; }
  suspend() { this.previous = null; }
  setPaused(paused: boolean) { this.paused = paused; this.suspend(); }
}

export function initialState(search: string, reducedMotion: boolean) {
  const params = new URLSearchParams(search);
  const rawTime = params.get('t');
  const parsed = rawTime === null ? NaN : Number(rawTime);
  const time = Number.isFinite(parsed) ? clamp(parsed, 0, 86400) : reducedMotion ? 14 : 0;
  const paused = params.has('paused') ? params.get('paused') === '1' : reducedMotion;
  const requested = params.get('quality');
  const quality: Quality = requested === 'low' || requested === 'high' ? requested : 'medium';
  return { time, paused, quality, debug: params.get('debug') === '1', snow: params.get('snow') !== '0' };
}

// Absolute-time trajectories, not accumulated integration: jumping directly to
// ?t=14 is pixel-identical to reaching that time from zero (same viewport).
export function makeSnow() {
  const rng = random(CONFIG.snow.seed), particles = new Float32Array(CONFIG.snow.count * 7);
  for (let i = 0; i < particles.length; i += 7) {
    particles[i] = (rng() - 0.5) * CONFIG.snow.width;
    particles[i + 1] = rng() * CONFIG.snow.height;
    particles[i + 2] = (rng() - 0.5) * CONFIG.snow.depth;
    particles[i + 3] = 0.07 + rng() * 0.12;
    particles[i + 4] = rng() * TAU;
    particles[i + 5] = 0.2 + rng() * 0.65;
    particles[i + 6] = rng();
  }
  return particles;
}
export function snowPosition(particles: Float32Array, i: number, time: number, out: Float64Array) {
  out[0] = particles[i] + Math.sin(time * 0.38 + particles[i + 4]) * 0.09 + Math.sin(time * 0.13 + particles[i + 4]) * 0.13;
  out[1] = mod(particles[i + 1] - time * particles[i + 3], CONFIG.snow.height) - 0.2;
  out[2] = particles[i + 2];
}
