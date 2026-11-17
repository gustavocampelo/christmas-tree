import { CONFIG, type Quality } from './config.ts';
import { clamp, TAU } from './math.ts';
import { random } from './random.ts';
import { Kind, STRIDE, type Geometry, type PointKind } from './types.ts';

export function envelope(y: number): number {
  const f = clamp((y - CONFIG.foliage.y0) / (CONFIG.foliage.y1 - CONFIG.foliage.y0));
  return 0.03 + 0.84 * Math.pow(1 - f, 1.08);
}

let cachedGeometry: Geometry | undefined;
export function getGeometry(): Geometry { return cachedGeometry ??= generateGeometry(); }

export function generateGeometry(seed = CONFIG.seed): Geometry {
  const rng = random(seed);
  const range = (a: number, b: number) => a + (b - a) * rng();
  const values: number[] = [];
  function add(x: number, y: number, z: number, nx: number, ny: number, nz: number, color: number, kind: PointKind, reveal: number, tone = 1, shine = 0, phase = rng() * TAU) {
    const length = Math.hypot(nx, ny, nz) || 1;
    values.push(x, y, z, nx / length, ny / length, nz / length, color, kind, reveal, phase, shine, tone);
  }

  const { y0, y1, tiers, density, snowCoverage } = CONFIG.foliage;
  const timeline = CONFIG.timeline;
  // Each tier has a different azimuth. Feather-shaped sprays along each bough
  // leave small air pockets; tips sag, while individual needles fan upward.
  for (let tier = 0; tier < tiers; tier++) {
    const y = y0 + 0.02 + (y1 - y0 - 0.06) * tier / (tiers - 1);
    const f = (y - y0) / (y1 - y0);
    const radius = envelope(y);
    const branches = Math.floor(7 + 11 * (1 - f));
    for (let branch = 0; branch < branches; branch++) {
      const a = TAU * branch / branches + tier * 0.618 * TAU + range(-0.15, 0.15);
      const dx = Math.cos(a), dz = Math.sin(a);
      const length = radius * range(0.82, 1.06);
      const n = Math.floor((250 + 1400 * length) * density);
      const droop = range(0.16, 0.26);
      const bend = range(-0.13, 0.13);
      const snowy = rng() < 0.38;
      const revealBase = timeline.foliageStart + (timeline.foliageEnd - timeline.foliageStart - 0.5) * f;
      for (let p = 0; p < n; p++) {
        const s = Math.pow(rng(), 0.65);
        const r = length * s;
        // Discrete side shoots make the silhouette organic, not a cone shell.
        const shoot = Math.sin(s * 27 + branch) * 0.22 + 0.78;
        const spread = (rng() + rng() - 1) * (0.027 + 0.17 * length) * Math.sin(Math.PI * s) * shoot;
        const curvature = bend * s * s;
        const x = dx * r - dz * (spread + curvature);
        const z = dz * r + dx * (spread + curvature);
        const yy = y + 0.07 * s - length * droop * s * s + range(-0.025, 0.038) + Math.abs(spread) * 0.12;
        const tone = (0.35 + 0.65 * Math.pow(s, 1.3)) * range(0.75, 1.15);
        const reveal = revealBase + s * 0.38 + range(0, 0.13);
        add(x, yy, z, dx * 0.75 + range(-0.3, 0.3), 0.55, dz * 0.75 + range(-0.3, 0.3), rng() < 0.2 ? 2 : s > 0.72 ? 1 : 0, Kind.NEEDLE, reveal, tone);
        if (snowy && s > 0.48 && rng() < snowCoverage * (0.7 + s)) {
          add(x, yy + 0.027, z, dx * 0.25, 1, dz * 0.25, rng() < 0.8 ? 6 : 7, Kind.SNOWCAP, reveal, range(0.55, 0.95));
        }
      }
    }
  }

  for (let i = 0; i < 5000; i++) {
    const a = rng() * TAU, y = range(0.03, 2.52), r = 0.085 * (1 - y * 0.3);
    add(Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(a), 0, Math.sin(a), 3, Kind.TRUNK, Math.max(0, timeline.foliageStart + (y - y0) / (y1 - y0) * (timeline.foliageEnd - timeline.foliageStart - 0.5)), range(0.5, 0.9));
  }

  function sphere(x: number, y: number, z: number, radius: number, color: number, reveal: number) {
    const count = 900;
    for (let i = 0; i < count; i++) {
      const ny = 1 - 2 * (i + 0.5) / count, theta = i * 2.3999632297;
      const ring = Math.sqrt(1 - ny * ny), nx = Math.cos(theta) * ring, nz = Math.sin(theta) * ring;
      add(x + nx * radius, y + ny * radius, z + nz * radius, nx, ny, nz, color, Kind.BALL, reveal, 1, 0.7);
    }
    for (let i = 0; i < 35; i++) {
      const a = rng() * TAU;
      add(x + Math.cos(a) * 0.014, y + radius + rng() * 0.022, z + Math.sin(a) * 0.014, Math.cos(a), 0.4, Math.sin(a), 5, Kind.GARLAND, reveal);
    }
  }
  for (let i = 0; i < 48; i++) {
    const f = (i + 0.5) / 48, y = 0.48 + f * 1.87;
    const a = i * 2.39996323 + range(-0.14, 0.14), r = envelope(y) * range(0.92, 1.035);
    sphere(Math.cos(a) * r, y - 0.035, Math.sin(a) * r, range(0.042, 0.065) * (1 - f * 0.28), i % 3 ? 4 : 5, timeline.ornamentsStart + f * 2.5 + rng() * 0.35);
  }

  for (let i = 0; i < 2600; i++) {
    const u = i / 2599, y = 0.48 + 1.98 * u, a = u * 3.6 * TAU + 0.7;
    const r = envelope(y) + 0.025;
    add(Math.cos(a) * r + range(-0.009, 0.009), y - 0.04 * Math.sin(a * 2) ** 2 + range(-0.009, 0.009), Math.sin(a) * r + range(-0.009, 0.009), Math.cos(a), 0.5, Math.sin(a), 5, Kind.GARLAND, timeline.ornamentsStart + u * (timeline.ornamentsEnd - timeline.ornamentsStart), range(0.75, 1.1), 0.2);
  }
  for (let i = 0; i < 170; i++) {
    const u = (i + 0.5) / 170, y = 0.44 + u * 2.03, a = i * 2.39996323;
    const r = envelope(y) * range(0.88, 1.04) + 0.018, phase = rng() * TAU;
    add(Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(a), 0.3, Math.sin(a), 9, Kind.LIGHT, timeline.lightsStart + u * 2.4, 1, 1, phase);
  }

  // Filled five-point star, slightly faceted/extruded. The renderer rotates its
  // position with the tree but faces it toward the camera to preserve all tips.
  const vertices = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.068 : 0.18;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  for (let edge = 0; edge < 10; edge++) {
    const v1 = vertices[edge], v2 = vertices[(edge + 1) % 10];
    for (let i = 0; i < 160; i++) {
      let u = rng(), v = rng();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const x = u * v1[0] + v * v2[0], yy = u * v1[1] + v * v2[1];
      const z = 0.028 * (1 - Math.hypot(x, yy) / 0.18);
      add(x, 2.67 + yy, z, x * 4, yy * 4, 1, 9, Kind.STAR, 9.1, edge % 2 ? 0.9 : 1.1, 1);
    }
  }

  function gift(cx: number, cz: number, w: number, h: number, d: number, angle: number, color: number, ribbon: number, reveal: number) {
    const c = Math.cos(angle), s = Math.sin(angle), step = 0.009;
    function point(x: number, y: number, z: number, nx: number, ny: number, nz: number, isRibbon: boolean) {
      add(cx + x * c + z * s, y + 0.025, cz - x * s + z * c, nx * c + nz * s, ny, -nx * s + nz * c, isRibbon ? ribbon : color, isRibbon ? Kind.RIBBON : Kind.GIFT, reveal, range(0.82, 1.05), isRibbon ? 0.15 : 0);
    }
    for (let x = -w / 2; x <= w / 2; x += step) {
      for (let z = -d / 2; z <= d / 2; z += step) point(x, h, z, 0, 1, 0, Math.abs(x) < w * 0.095 || Math.abs(z) < d * 0.09);
      for (let y = 0; y <= h; y += step) {
        for (const side of [-1, 1]) point(x, y, side * d / 2, 0, 0, side, Math.abs(x) < w * 0.095 || y > h * 0.94);
      }
    }
    for (let z = -d / 2; z <= d / 2; z += step) {
      for (let y = 0; y <= h; y += step) {
        for (const side of [-1, 1]) point(side * w / 2, y, z, side, 0, 0, Math.abs(z) < d * 0.09 || y > h * 0.94);
      }
    }
    for (let i = 0; i < 300; i++) {
      const a = i / 300 * TAU;
      point(Math.sin(a) * w * 0.3, h + 0.018 + Math.sin(a * 2) ** 2 * 0.06, Math.sin(a * 2) * d * 0.13, 0, 1, 0, true);
    }
  }
  gift(-0.71, 0.41, 0.34, 0.27, 0.29, -0.22, 11, 5, 8.55);
  gift(0.68, 0.36, 0.34, 0.21, 0.30, 0.22, 8, 5, 8.9);
  gift(0.41, -0.62, 0.25, 0.32, 0.28, -0.3, 11, 6, 9.15);
  gift(-0.32, 0.72, 0.25, 0.16, 0.22, 0.18, 6, 11, 9.4);
  gift(-0.61, -0.34, 0.25, 0.19, 0.24, 0.44, 8, 6, 9.05);

  // Fixed world-space ground. A softly bounded oval avoids a visible square edge.
  for (let x = -2.5; x < 2.5; x += 0.045) {
    for (let z = -2.5; z < 2.5; z += 0.065) {
      const r = Math.hypot(x, z * 0.9);
      if (r > 2.4 || rng() > 0.86) continue;
      const tone = Math.pow(1 - r / 2.4, 0.7) * range(0.35, 0.8);
      add(x + range(-0.012, 0.012), 0, z + range(-0.012, 0.012), 0, 1, 0, 10, Kind.GROUND, -1, tone);
    }
  }
  const data = new Float32Array(values), count = data.length / STRIDE;
  const indices = {} as Geometry['indices'];
  for (const quality of Object.keys(CONFIG.qualities) as Quality[]) {
    const stride = CONFIG.qualities[quality].sampleStride;
    const selected: number[] = [];
    for (let i = 0; i < count; i++) {
      const kind = data[i * STRIDE + 7];
      if (kind !== Kind.NEEDLE || i % stride === 0) selected.push(i * STRIDE);
    }
    indices[quality] = new Uint32Array(selected);
  }
  return { data, count, indices };
}
