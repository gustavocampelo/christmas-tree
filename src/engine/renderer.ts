import { CONFIG, type Quality } from './config';
import { makeSnow, snowPosition } from './animation';
import { clamp, smoothstep } from './math';
import { Kind, type Geometry } from './types';

const GLYPHS = ' .,:;irsXA253hMHGS#9B&@*+-|/\\';
const SHADES = 32;

export class AsciiRenderer {
  private context: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private columns = 0;
  private rows = 0;
  private cellWidth = 1;
  private cellHeight = 1;
  private sourceWidth = 1;
  private sourceHeight = 1;
  private focal = 1;
  private atlas = document.createElement('canvas');
  private depth = new Float32Array(0);
  private colors = new Uint16Array(0);
  private glyphs = new Uint8Array(0);
  private materials = new Uint8Array(0);
  private snow = makeSnow();
  private snowPoint = new Float64Array(3);
  quality: Quality = 'medium';
  cells = 0;
  sampled = 0;
  renderMs = 0;

  constructor(private canvas: HTMLCanvasElement, private geometry: Geometry) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Não foi possível iniciar o Canvas 2D neste navegador.');
    this.context = context;
  }

  resize(width: number, height: number, quality = this.quality) {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    if (this.width === width && this.height === height && this.quality === quality && this.dpr === dpr) return;
    this.width = Math.max(1, width); this.height = Math.max(1, height);
    this.quality = quality; this.dpr = dpr;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.context.imageSmoothingEnabled = false;
    const q = CONFIG.qualities[quality], responsive = clamp(width / 600, 0.76, 1);
    const fontSize = q.fontSize * responsive;
    this.context.font = `bold ${fontSize}px ${CONFIG.font}`;
    const metrics = this.context.measureText('M');
    this.cellWidth = Math.max(2, metrics.width);
    this.cellHeight = Math.max(q.lineHeight * responsive, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 0.3);
    this.columns = Math.ceil(this.width / this.cellWidth);
    this.rows = Math.ceil(this.height / this.cellHeight);
    const size = this.columns * this.rows;
    this.depth = new Float32Array(size);
    this.colors = new Uint16Array(size);
    this.glyphs = new Uint8Array(size);
    this.materials = new Uint8Array(size);
    this.focal = Math.min(this.width / CONFIG.camera.horizontalSpan, this.height / CONFIG.camera.verticalSpan) * CONFIG.camera.distance;
    this.buildAtlas(fontSize);
  }

  private buildAtlas(fontSize: number) {
    this.sourceWidth = Math.ceil(this.cellWidth * this.dpr);
    this.sourceHeight = Math.ceil(this.cellHeight * this.dpr);
    this.atlas.width = this.sourceWidth * GLYPHS.length;
    this.atlas.height = this.sourceHeight * CONFIG.palette.length * SHADES;
    const ctx = this.atlas.getContext('2d')!;
    ctx.font = `bold ${fontSize * this.dpr}px ${CONFIG.font}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let color = 0; color < CONFIG.palette.length; color++) {
      for (let shade = 0; shade < SHADES; shade++) {
        const intensity = shade / (SHADES - 1) * 1.5;
        const base = CONFIG.palette[color];
        ctx.fillStyle = `rgb(${Math.min(255, base[0] * intensity)} ${Math.min(255, base[1] * intensity)} ${Math.min(255, base[2] * intensity)})`;
        const y = (color * SHADES + shade) * this.sourceHeight;
        for (let g = 1; g < GLYPHS.length; g++) {
          ctx.fillText(GLYPHS[g], g * this.sourceWidth + this.sourceWidth / 2, y + this.sourceHeight / 2);
        }
      }
    }
  }

  render(time: number, angle: number, snowEnabled: boolean) {
    const start = performance.now();
    const { width, height, columns, rows, cellWidth, cellHeight, focal } = this;
    if (!width || !height) return;
    this.depth.fill(Infinity); this.glyphs.fill(0); this.materials.fill(255);
    const data = this.geometry.data, selected = this.geometry.indices[this.quality];
    this.sampled = selected.length;
    const c = Math.cos(angle), s = Math.sin(angle);
    const cp = Math.cos(CONFIG.camera.elevation), sp = Math.sin(CONFIG.camera.elevation);
    const { distance, targetY } = CONFIG.camera;
    const light = CONFIG.lighting.light;
    for (let p = 0; p < selected.length; p++) {
      const i = selected[p], age = time - data[i + 8];
      if (age <= 0) continue;
      const fade = age < CONFIG.timeline.fade ? smoothstep(age / CONFIG.timeline.fade) : 1;
      if (fade < 0.025) continue;
      const kind = data[i + 7];
      const worldFixed = kind === Kind.GROUND || kind === Kind.STAR;
      const x = worldFixed ? data[i] : data[i] * c + data[i + 2] * s;
      const z = worldFixed ? data[i + 2] : -data[i] * s + data[i + 2] * c;
      const y = data[i + 1] - targetY;
      const depth = distance - z * cp + y * sp;
      if (depth < 0.2) continue;
      const px = width / 2 + x * focal / depth;
      const py = height / 2 - (y * cp + z * sp) * focal / depth;
      const col = Math.floor(px / cellWidth), row = Math.floor(py / cellHeight);
      if (col < 0 || col >= columns || row < 0 || row >= rows) continue;
      const cell = row * columns + col;
      if (depth >= this.depth[cell]) continue;
      const nx = worldFixed ? data[i + 3] : data[i + 3] * c + data[i + 5] * s;
      const ny = data[i + 4];
      const nz = worldFixed ? data[i + 5] : -data[i + 3] * s + data[i + 5] * c;
      const diffuse = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
      let brightness = (CONFIG.lighting.ambient + CONFIG.lighting.directional * diffuse) * data[i + 11];
      let color = data[i + 6];
      let glyph = 0;
      if (kind === Kind.LIGHT || kind === Kind.STAR) {
        brightness = (kind === Kind.STAR ? 1.22 + 0.12 * Math.sin(time * 1.4) : 0.92 + 0.26 * Math.sin(time * 1.7 + data[i + 9])) * data[i + 11];
        glyph = kind === Kind.LIGHT ? 22 : 12 + Math.floor(diffuse * 7);
      } else {
        const specular = data[i + 10] > 0 ? Math.pow(Math.max(0, -0.23 * nx + 0.39 * ny + 0.891 * nz), 32) * data[i + 10] : 0;
        brightness += specular * 0.7;
        if ((kind === Kind.NEEDLE || kind === Kind.TRUNK) && age < CONFIG.timeline.frontier && time < CONFIG.timeline.foliageEnd + CONFIG.timeline.frontier) {
          color = 6; brightness = 0.9 + 0.4 * (1 - age / CONFIG.timeline.frontier);
        }
        if (kind === Kind.GROUND) {
          brightness *= 1.1;
          glyph = data[i + 9] > 3.7 ? 2 : 1;
        } else if (kind === Kind.SNOWCAP) glyph = 2 + Math.floor(data[i + 9] * 0.6);
        else if (kind === Kind.GARLAND || kind === Kind.RIBBON) glyph = 9 + Math.floor(data[i + 9] * 1.3);
        else if (kind === Kind.NEEDLE) glyph = 2 + Math.floor(clamp(brightness * 0.65 + data[i + 9] * 0.035) * 15);
        else glyph = 7 + Math.floor(clamp(brightness) * 12);
      }
      brightness *= fade * clamp(1.1 - (depth - 4.5) * 0.065, 0.65, 1.1);
      const shade = Math.max(1, Math.min(SHADES - 1, Math.round(brightness / 1.5 * (SHADES - 1))));
      this.depth[cell] = depth;
      this.colors[cell] = color * SHADES + shade;
      this.glyphs[cell] = glyph;
      this.materials[cell] = kind;
    }

    if (snowEnabled) {
      const count = Math.floor(CONFIG.snow.count * CONFIG.qualities[this.quality].snowFraction);
      for (let p = 0; p < count; p++) {
        const i = p * 7;
        snowPosition(this.snow, i, time, this.snowPoint);
        const y = this.snowPoint[1] - targetY, z = this.snowPoint[2];
        const depth = distance - z * cp + y * sp;
        const col = Math.floor((width / 2 + this.snowPoint[0] * focal / depth) / cellWidth);
        const row = Math.floor((height / 2 - (y * cp + z * sp) * focal / depth) / cellHeight);
        if (col < 0 || col >= columns || row < 0 || row >= rows) continue;
        const cell = row * columns + col;
        if (depth >= this.depth[cell]) continue;
        this.depth[cell] = depth;
        this.colors[cell] = 7 * SHADES + Math.round((this.snow[i + 5] * (z > 0 ? 1 : 0.55)) * 20);
        this.glyphs[cell] = z > 0.9 && this.snow[i + 6] > 0.75 ? 22 : z > 0 ? 3 : 1;
        this.materials[cell] = 11;
      }
    }

    // Only visible emissive cells cast ASCII halos. Opaque foreground cells
    // always win; the effect never uses blur or erases the character texture.
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < columns - 1; col++) {
        const cell = row * columns + col, material = this.materials[cell];
        if (material !== Kind.LIGHT && material !== Kind.STAR) continue;
        if (this.colors[cell] % SHADES < 12) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const neighbor = cell + dy * columns + dx;
            if (this.depth[neighbor] <= this.depth[cell] + 0.035) continue;
            if (this.glyphs[neighbor] && this.materials[neighbor] !== Kind.GROUND && this.materials[neighbor] !== 12) continue;
            this.glyphs[neighbor] = Math.abs(dx) + Math.abs(dy) === 1 ? 2 : 1;
            this.colors[neighbor] = 9 * SHADES + (material === Kind.STAR ? 7 : 4);
            this.depth[neighbor] = this.depth[cell] + 0.04;
            this.materials[neighbor] = 12;
          }
        }
      }
    }
    const ctx = this.context;
    ctx.fillStyle = CONFIG.background; ctx.fillRect(0, 0, width, height);
    let occupied = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const cell = row * columns + col, glyph = this.glyphs[cell];
        if (!glyph) continue;
        occupied++;
        ctx.drawImage(this.atlas, glyph * this.sourceWidth, this.colors[cell] * this.sourceHeight, this.sourceWidth, this.sourceHeight, col * cellWidth, row * cellHeight, cellWidth, cellHeight);
      }
    }
    this.cells = occupied;
    this.renderMs = performance.now() - start;
  }

  exportPng(time: number) {
    this.canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `noite-de-natal-${time.toFixed(1)}s.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }, 'image/png');
  }
}
