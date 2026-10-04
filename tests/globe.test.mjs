import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_LOCATION, SERVER_LOCATION, HOME_VIEW, approximateLocation,
  globeConnections, connectionView, projectLocation,
} from '../public/globe-location.js';

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
  for (const size of [200, 240, 480]) {
    assert.ok(Math.abs(point.x * size - size / 2) < 1e-7);
    assert.ok(Math.abs(point.y * size - size / 2) < 1e-7);
  }
});

test('without a visitor location, only home is marked and there are no arcs', () => {
  const scene = globeConnections(null);
  assert.deepEqual(scene.markers.map(marker => marker.location), [HOME_LOCATION]);
  assert.deepEqual(scene.arcs, []);
});

test('consent adds Singapore and the visitor, connecting every pair', () => {
  const visitor = [51.5, -0.1];
  const scene = globeConnections(visitor);
  assert.deepEqual(SERVER_LOCATION, [1.3521, 103.8198]);
  assert.deepEqual(scene.markers.map(marker => marker.location), [HOME_LOCATION, SERVER_LOCATION, visitor]);
  assert.deepEqual(scene.arcs, [
    { from: HOME_LOCATION, to: SERVER_LOCATION },
    { from: HOME_LOCATION, to: visitor },
    { from: SERVER_LOCATION, to: visitor },
  ]);
  // Native anchor IDs inject dynamic CSS, which our strict CSP disallows.
  assert.ok([...scene.markers, ...scene.arcs].every(item => !('id' in item)));
});

test('coincident locations do not create a zero-length arc', () => {
  for (const visitor of [HOME_LOCATION, SERVER_LOCATION]) {
    assert.equal(globeConnections(visitor).arcs.length, 2);
    assert.ok(globeConnections(visitor).arcs.every(arc => arc.from !== arc.to));
  }
});

test('visitor precision is reduced to tenths of a degree', () => {
  assert.deepEqual(approximateLocation({ latitude: 51.507351, longitude: -0.127758 }), [51.5, -0.1]);
  assert.deepEqual(approximateLocation({ latitude: -0.01, longitude: 0.01 }), [0, 0]);
  assert.deepEqual(approximateLocation({ latitude: -90, longitude: 180 }), [-90, 180]);
  for (const coords of [null, {}, { latitude: '51', longitude: 0 },
    { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity },
    { latitude: 90.1, longitude: 0 }, { latitude: 0, longitude: -180.1 }]) {
    assert.equal(approximateLocation(coords), null);
  }
});

test('connected views keep all three markers visible, even for distant visitors', () => {
  const visitors = [HOME_LOCATION, SERVER_LOCATION, [-HOME_LOCATION[0], HOME_LOCATION[1] - 180]];
  for (let latitude = -90; latitude <= 90; latitude += 15) {
    for (let longitude = -180; longitude <= 180; longitude += 15) visitors.push([latitude, longitude]);
  }
  for (const visitor of visitors) {
    const view = connectionView(visitor);
    assert.ok(Number.isFinite(view.phi) && Number.isFinite(view.theta));
    assert.ok(view.rotation >= 0 && view.rotation <= 0.08);
    for (const shift of [-view.rotation, 0, view.rotation]) {
      for (const location of [HOME_LOCATION, SERVER_LOCATION, visitor]) {
        assert.ok(projectLocation(location, { ...view, phi: view.phi + shift }).visible,
          `visitor ${visitor}, marker ${location}, shift ${shift}`);
      }
    }
  }
});
