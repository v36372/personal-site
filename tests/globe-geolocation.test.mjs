import test from 'node:test';
import assert from 'node:assert/strict';
import { setupGeolocation } from '../public/globe-geolocation.js';

class Button extends EventTarget {
  hidden = true;
  disabled = false;
  textContent = 'Connect your location';
  attributes = new Map();
  setAttribute(name, value) { this.attributes.set(name, value); }
  click() { this.dispatchEvent(new Event('click')); }
}

function fixture({ geolocation, permissions = null } = {}) {
  const requests = [];
  const locations = [];
  const button = new Button();
  const status = { textContent: '' };
  const controller = setupGeolocation({
    button, status, permissions,
    geolocation: geolocation === undefined ? {
      getCurrentPosition(success, error, options) { requests.push({ success, error, options }); },
    } : geolocation,
    onLocation(location) { locations.push(location); },
  });
  return { requests, locations, button, status, controller };
}

const position = { coords: { latitude: 51.507351, longitude: -0.127758 } };

test('does not ask for location on load, even when permission is already granted', async () => {
  const permission = new EventTarget();
  permission.state = 'granted';
  const f = fixture({ permissions: { query: async () => permission } });
  await Promise.resolve();
  assert.equal(f.requests.length, 0);
  assert.deepEqual(f.locations, []);
  assert.equal(f.button.hidden, false);
  f.controller.destroy();
});

test('location API unavailable keeps the marker-only default and hides the button', () => {
  const f = fixture({ geolocation: null });
  assert.equal(f.button.hidden, true);
  assert.deepEqual(f.locations, []);
  f.controller.destroy();
});

test('an explicit click requests a one-shot, low-accuracy position and rounds it', () => {
  const f = fixture();
  f.button.click();
  assert.equal(f.requests.length, 1);
  assert.deepEqual(f.requests[0].options, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
  assert.equal(f.button.disabled, true);
  f.requests[0].success(position);
  assert.deepEqual(f.locations, [[51.5, -0.1]]);
  assert.equal(f.button.disabled, false);
  assert.equal(f.button.textContent, 'Remove my location');
  assert.equal(f.button.attributes.get('aria-pressed'), 'true');
  assert.match(f.status.textContent, /Singapore/);
  f.controller.destroy();
});

test('denial, unavailable position, and timeout never add visitor/server markers', () => {
  for (const code of [1, 2, 3]) {
    const f = fixture();
    f.button.click();
    f.requests[0].error({ code });
    assert.deepEqual(f.locations, [null]);
    assert.equal(f.button.disabled, false);
    assert.equal(f.button.textContent, 'Connect your location');
    assert.equal(f.button.attributes.get('aria-pressed'), 'false');
    assert.match(f.status.textContent, /Only the Ho Chi Minh City marker/);
    f.controller.destroy();
  }
});

test('invalid coordinates and a synchronous API error fail closed', () => {
  const f = fixture();
  f.button.click();
  f.requests[0].success({ coords: { latitude: 100, longitude: 0 } });
  assert.deepEqual(f.locations, [null]);
  f.controller.destroy();
  const throwing = fixture({ geolocation: { getCurrentPosition() { throw new Error('blocked'); } } });
  throwing.button.click();
  assert.deepEqual(throwing.locations, [null]);
  assert.equal(throwing.button.disabled, false);
  throwing.controller.destroy();
});

test('repeated clicks cannot start concurrent permission requests', () => {
  const f = fixture();
  f.button.click();
  f.button.click();
  assert.equal(f.requests.length, 1);
  f.controller.destroy();
});

test('the visitor can remove their location and explicitly reconnect', () => {
  const f = fixture();
  f.button.click();
  f.requests[0].success(position);
  f.button.click();
  assert.deepEqual(f.locations, [[51.5, -0.1], null]);
  assert.equal(f.button.textContent, 'Connect your location');
  f.button.click();
  assert.equal(f.requests.length, 2);
  f.requests[1].success({ coords: { latitude: -33.8688, longitude: 151.2093 } });
  assert.deepEqual(f.locations.at(-1), [-33.9, 151.2]);
  f.controller.destroy();
});

test('pagehide clearing invalidates pending results but permits a new click after restore', () => {
  const f = fixture();
  f.button.click();
  f.controller.clear();
  f.requests[0].success(position);
  assert.deepEqual(f.locations, [null]);
  f.button.click();
  f.requests[1].success(position);
  assert.deepEqual(f.locations, [null, [51.5, -0.1]]);
  f.controller.clear();
  assert.equal(f.locations.at(-1), null);
  f.controller.destroy();
});

test('destroy removes the button listener and ignores late permission/position results', async () => {
  let resolvePermission;
  const permission = new EventTarget();
  const f = fixture({ permissions: {
    query: () => new Promise(resolve => { resolvePermission = resolve; }),
  } });
  f.button.click();
  f.controller.destroy();
  f.requests[0].success(position);
  f.button.click();
  resolvePermission(permission);
  await Promise.resolve();
  permission.state = 'denied';
  permission.dispatchEvent(new Event('change'));
  assert.deepEqual(f.locations, [null]);
  assert.equal(f.requests.length, 1);
  assert.equal(f.button.hidden, true);
});

test('revoking permission removes existing arcs and invalidates pending results', async () => {
  const permission = new EventTarget();
  permission.state = 'granted';
  const f = fixture({ permissions: { query: async () => permission } });
  await Promise.resolve();
  f.button.click();
  f.requests[0].success(position);
  permission.state = 'denied';
  permission.dispatchEvent(new Event('change'));
  assert.deepEqual(f.locations, [[51.5, -0.1], null]);
  f.button.click();
  permission.dispatchEvent(new Event('change'));
  f.requests[1].success(position);
  assert.equal(f.locations.at(-1), null);
  f.controller.destroy();
  const count = f.locations.length;
  permission.dispatchEvent(new Event('change'));
  assert.equal(f.locations.length, count);
});

test('resetting permission to ask again also removes the location', async () => {
  const permission = new EventTarget();
  permission.state = 'granted';
  const f = fixture({ permissions: { query: async () => permission } });
  await Promise.resolve();
  f.button.click();
  f.requests[0].success(position);
  permission.state = 'prompt';
  permission.dispatchEvent(new Event('change'));
  assert.deepEqual(f.locations, [[51.5, -0.1], null]);
  f.controller.destroy();
  const count = f.locations.length;
  f.controller.destroy();
  assert.equal(f.locations.length, count);
});

test('unsupported permission inspection does not prevent explicit geolocation', async () => {
  for (const query of [() => Promise.reject(new Error('unsupported')), () => { throw new Error('unsupported'); }]) {
    const f = fixture({ permissions: { query } });
    await Promise.resolve();
    f.button.click();
    f.requests[0].success(position);
    assert.deepEqual(f.locations, [[51.5, -0.1]]);
    f.controller.destroy();
  }
});
