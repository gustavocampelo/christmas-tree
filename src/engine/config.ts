export const CONFIG = {
  seed: 7,
  foliage: { y0: 0.42, y1: 2.55, tiers: 24, density: 1, snowCoverage: 0.06 },
  background: '#06090d',
  font: 'Consolas, "Liberation Mono", "Courier New", monospace',
  maxDpr: 2,
  camera: { distance: 5.8, targetY: 1.36, elevation: 0.12, verticalSpan: 3.26, horizontalSpan: 2.75 },
  rotation: { speed: 0.314159265, step: 0.078539816, max: 0.942477796 },
  lighting: { ambient: 0.64, directional: 0.7, light: [-0.42, 0.72, 0.55] },
  snow: { count: 430, seed: 179, width: 6.8, height: 4.5, depth: 4.6 },
  timeline: { foliageStart: 0.4, foliageEnd: 7, ornamentsStart: 5, ornamentsEnd: 8.8, lightsStart: 7, complete: 10, fade: 0.48, frontier: 0.6 },
  // Material colors; shading is quantized to 32 levels in the glyph atlas.
  palette: [
    [55, 162, 102], [102, 200, 146], [131, 170, 151], // pine, tips, silver-green
    [123, 77, 44], [235, 43, 55], [225, 169, 66], // trunk, red, gold
    [234, 239, 222], [134, 178, 210], [66, 101, 193], // snow/ivory, icy snow, blue
    [255, 218, 130], [110, 128, 142], [202, 47, 64], // light, ground, red gift
  ] as readonly (readonly number[])[],
  qualities: {
    low: { label: 'Baixa', fontSize: 9, lineHeight: 8.6, sampleStride: 4, snowFraction: 0.6 },
    medium: { label: 'Média', fontSize: 6, lineHeight: 5.5, sampleStride: 2, snowFraction: 0.8 },
    high: { label: 'Alta', fontSize: 4.8, lineHeight: 4.5, sampleStride: 1, snowFraction: 1 },
  },
} as const;

export type Quality = keyof typeof CONFIG.qualities;
