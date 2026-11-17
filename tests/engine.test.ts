import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateGeometry, envelope } from '../src/engine/geometry.ts';
import { initialState, makeSnow, SceneClock, snowPosition } from '../src/engine/animation.ts';
import { CONFIG } from '../src/engine/config.ts';
import { Kind, STRIDE } from '../src/engine/types.ts';

test('geometria reproduzível, finita, com todas as partes e normais unitárias', () => {
  const first = generateGeometry();
  const second = generateGeometry();
  const hash = (data: Float32Array) => createHash('sha256').update(new Uint8Array(data.buffer)).digest('hex');
  assert.equal(hash(first.data), hash(second.data));
  assert.ok(first.count > 250_000);
  const kinds = new Set<number>();
  for (let i = 0; i < first.data.length; i += STRIDE) {
    const d = first.data;
    for (let j = 0; j < STRIDE; j++) assert.ok(Number.isFinite(d[i + j]));
    assert.ok(Math.abs(Math.hypot(d[i + 3], d[i + 4], d[i + 5]) - 1) < 1e-6);
    kinds.add(d[i + 7]);
    assert.ok(d[i + 8] + CONFIG.timeline.fade <= 10);
  }
  assert.equal(kinds.size, Object.keys(Kind).length);
  assert.ok(first.indices.low.length < first.indices.medium.length);
  assert.ok(first.indices.medium.length < first.indices.high.length);
  assert.equal(first.indices.high.length, first.count);
  assert.ok(Math.abs(envelope(0.42) - 0.87) < 1e-9);
  assert.equal(envelope(2.55), 0.03);
});

test('timeline independe do FPS, pausa congela e retorno da aba não salta', () => {
  const a = new SceneClock(), b = new SceneClock();
  for (let i = 0; i <= 420; i++) a.tick(i * 1000 / 30);
  for (let i = 0; i <= 840; i++) b.tick(i * 1000 / 60);
  assert.ok(Math.abs(a.time - 14) < 1e-10);
  assert.ok(Math.abs(a.time - b.time) < 1e-10);
  assert.ok(Math.abs(a.angle - b.angle) < 1e-10);
  const angle = a.angle, time = a.time;
  a.setPaused(true); a.tick(60_000); a.tick(70_000);
  assert.equal(a.time, time); assert.equal(a.angle, angle);
  a.setPaused(false); a.tick(90_000);
  assert.equal(a.time, time);
  a.tick(190_000);
  assert.ok(a.time - time <= 0.050001);
  a.suspend(); a.tick(500_000);
  assert.ok(a.time - time <= 0.050001);
  a.reset(); assert.equal(a.time, 0); assert.equal(a.angle, 0);
});

test('neve depende do tempo absoluto, sem estado integrado ou sorteios por frame', () => {
  const snow = makeSnow(), other = makeSnow(), a = new Float64Array(3), b = new Float64Array(3);
  assert.deepEqual(snow, other);
  snowPosition(snow, 0, 14, a);
  for (let t = 0; t < 14; t += 0.1) snowPosition(other, 0, t, b);
  snowPosition(other, 0, 14, b);
  assert.deepEqual(a, b);
  assert.ok(a[1] >= -0.2 && a[1] < CONFIG.snow.height - 0.2);
});

test('parâmetros de URL e preferência de movimento reduzido', () => {
  assert.deepEqual(initialState('?t=8&paused=1&debug=1&quality=high&snow=0', false), { time: 8, paused: true, debug: true, quality: 'high', snow: false });
  assert.equal(initialState('', true).time, 14);
  assert.equal(initialState('', true).paused, true);
  assert.equal(initialState('?t=invalido&quality=invalida', false).time, 0);
  assert.equal(initialState('?t=-2', false).time, 0);
  assert.equal(initialState('?paused=0', true).paused, false);
});
