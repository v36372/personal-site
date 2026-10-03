import test from 'node:test';
import assert from 'node:assert/strict';
import { bufferSize, MAX_BUFFER_PIXELS, MAX_BUFFER_SIDE, FRAME_INTERVAL, INITIAL_TIME, SHADER_SETTINGS } from '../public/dither-settings.js';
import { VERTEX_SHADER, DITHERING_SHADER } from '../public/vendor/aura-capy-shaders.js';

test('retains the Capy simplex / Bayer8 / 3px pipeline', () => {
  assert.equal(SHADER_SETTINGS.u_shape, 1);
  assert.equal(SHADER_SETTINGS.u_type, 4);
  assert.equal(SHADER_SETTINGS.u_pxSize, 3);
  assert.equal(SHADER_SETTINGS.u_scale, 2);
  assert.equal(INITIAL_TIME, 40);
  assert.equal(FRAME_INTERVAL, 1000 / 15);
  assert.ok(VERTEX_SHADER.startsWith('#version 300 es'));
  assert.ok(DITHERING_SHADER.includes('getSimplexNoise'));
  assert.ok(DITHERING_SHADER.includes('uniform float u_time'));
});

test('Bayer8 is a complete ordered threshold matrix', () => {
  const source = DITHERING_SHADER.match(/const int bayer8x8\[64\] = int\[64\]\(([\s\S]*?)\);/)[1];
  const matrix = source.match(/\d+/g).map(Number);
  assert.equal(matrix.length, 64);
  assert.deepEqual([...matrix].sort((a, b) => a - b), Array.from({ length: 64 }, (_, i) => i));
});

test('renders a one-third-size framebuffer, not retina/full-page resolution', () => {
  assert.deepEqual(bufferSize(1440, 150), { width: 480, height: 50, pixelRatio: 1 / 3 });
  assert.deepEqual(bufferSize(390, 100), { width: 130, height: 33, pixelRatio: 1 / 3 });
});

test('bounds GPU work on ultrawide and pathological dimensions', () => {
  for (const [width, height] of [[7680, 150], [100000, 100], [1, 10000000], [10000000, 1]]) {
    const size = bufferSize(width, height);
    assert.ok(size.width * size.height <= MAX_BUFFER_PIXELS);
    assert.ok(size.width <= MAX_BUFFER_SIDE && size.height <= MAX_BUFFER_SIDE);
    assert.ok(size.width >= 1 && size.height >= 1);
    assert.equal(size.pixelRatio, size.width / width);
  }
});

test('ignores zero-size, hidden, and invalid layouts', () => {
  for (const [width, height] of [[0, 150], [1440, 0], [-1, 150], [NaN, 150], [Infinity, 150]]) {
    assert.equal(bufferSize(width, height), null);
  }
});
