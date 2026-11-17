import type { Quality } from './config';

// Packed point layout: position (3), normal (3), color index, kind,
// revealTime, phase, shine, tone. All geometry is immutable after generation.
export const STRIDE = 12;
export const Kind = { NEEDLE: 0, TRUNK: 1, BALL: 2, LIGHT: 3, GARLAND: 4, GIFT: 5, RIBBON: 6, SNOWCAP: 7, GROUND: 8, STAR: 9 } as const;
export type PointKind = typeof Kind[keyof typeof Kind];
export interface Geometry { data: Float32Array; count: number; indices: Record<Quality, Uint32Array> }
export interface SceneOptions { paused: boolean; snow: boolean; quality: Quality; speed: number; debug: boolean }
export interface Diagnostics { fps: number; time: number; points: number; sampled: number; cells: number; angle: number; speed: number; quality: Quality; renderMs: number }
export type Action = 'pause' | 'restart' | 'slower' | 'faster' | 'snow' | 'debug' | 'export';
