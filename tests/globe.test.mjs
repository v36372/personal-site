import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_LOCATION, HOME_VIEW, projectLocation } from '../public/globe-location.js';

test('uses city-level Ho Chi Minh City coordinates', () => {
  assert.deepEqual(HOME_LOCATION, [10.8231, 106.6297]);
});

test('initial view centers the real marker, not its antipode', () => {
  const point = projectLocation(HOME_LOCATION, HOME_VIEW);
  assert.ok(point.visible);
  assert.ok(Math.abs(point.x - 0.5) < 1e-10);
  assert.ok(Math.abs(point.y - 0.5) < 1e-10);
});

test('the location stays visible throughout the gentle rotation', () => {
  for (let phase = 0; phase < Math.PI * 2; phase += 0.1) {
    const point = projectLocation(HOME_LOCATION, {
      ...HOME_VIEW,
      phi: HOME_VIEW.phi + Math.sin(phase) * 0.18,
    });
    assert.ok(point.visible);
    assert.ok(point.x > 0.4 && point.x < 0.6);
    assert.ok(point.y > 0.4 && point.y < 0.6);
  }
});

test('a marker behind the globe is hidden', () => {
  const antipode = [-HOME_LOCATION[0], HOME_LOCATION[1] - 180];
  assert.equal(projectLocation(antipode, HOME_VIEW).visible, false);
});

test('projection is normalized for responsive and retina canvases', () => {
  const point = projectLocation(HOME_LOCATION, HOME_VIEW);
  for (const size of [272, 380, 440, 880]) {
    assert.ok(Math.abs(point.x * size - size / 2) < 1e-7);
    assert.ok(Math.abs(point.y * size - size / 2) < 1e-7);
  }
});
