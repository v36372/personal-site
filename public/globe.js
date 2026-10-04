import createGlobe from './vendor/cobe-2.0.1.js';
import {
  HOME_LOCATION, SERVER_LOCATION, HOME_VIEW,
  globeConnections, connectionView, projectLocation,
} from './globe-location.js';
import { setupGeolocation } from './globe-geolocation.js';

const canvas = document.getElementById('globe');
const stage = document.getElementById('globe-stage');
const fallback = document.getElementById('globe-fallback');
const control = document.getElementById('globe-motion');
const status = document.getElementById('globe-status');
const labels = document.getElementById('globe-labels');
const homeLabel = document.getElementById('globe-label-home');
const serverLabel = document.getElementById('globe-label-server');
const visitorLabel = document.getElementById('globe-label-visitor');
const locationButton = document.getElementById('globe-location');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let globe;
let locationControl;
let visitorLocation = null;
let baseView = HOME_VIEW;
let size = 240;
let frame = 0;
let lastDraw = 0;
let previousTime = 0;
let motionTime = 0;
let inView = true;
let manuallyPaused = false;
try { manuallyPaused = sessionStorage.getItem('tn-art-paused') === '1'; } catch { /* Storage may be disabled. */ }
let paused = reducedMotion.matches || manuallyPaused;
let destroyed = false;
const view = { ...HOME_VIEW };

function globeAppearance() {
  const style = getComputedStyle(document.documentElement);
  const rgb = (property) => {
    const hex = style.getPropertyValue(property).trim().replace('#', '');
    return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  };
  const light = document.documentElement.dataset.theme === 'light';
  return {
    dark: light ? 0 : 1,
    mapBrightness: light ? 1.6 : 6,
    baseColor: light ? [0.76, 0.79, 0.71] : [0.9, 0.85, 0.72],
    markerColor: rgb('--pin'),
    arcColor: rgb('--accent'),
    glowColor: rgb('--paper'),
  };
}

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  previousTime = 0;
}

function unavailable() {
  stop();
  destroyed = true;
  locationControl?.destroy();
  locationButton.hidden = true;
  globe?.destroy();
  globe = undefined;
  stage.dataset.state = 'unavailable';
  control.hidden = true;
  fallback.removeAttribute('hidden');
  status.hidden = false;
}

function syncControl() {
  const action = paused ? 'Play' : 'Pause';
  const location = visitorLocation
    ? 'Markers for Ho Chi Minh City, Vietnam, your approximate location, and Singapore (server).'
    : 'Based in Ho Chi Minh City, Vietnam.';
  control.setAttribute('aria-label', action + ' animations. ' + location);
  control.title = action + ' animations';
  control.setAttribute('aria-pressed', String(paused));
  stage.dataset.paused = String(paused);
  // The existing globe control also handles the decorative art; no banner buttons.
  window.dispatchEvent(new CustomEvent('motionchange', { detail: { paused, manuallyPaused } }));
}

function updateLabels() {
  const placed = [];
  for (const [label, location, offset] of [
    [homeLabel, HOME_LOCATION, -12],
    [serverLabel, visitorLocation ? SERVER_LOCATION : null, 18],
    [visitorLabel, visitorLocation, -12],
  ]) {
    const point = location && projectLocation(location, view);
    label.toggleAttribute('hidden', !point?.visible);
    if (!point?.visible) continue;
    const x = Math.max(22, Math.min(218, point.x * 240));
    let y = Math.max(12, Math.min(228, point.y * 240 + offset));
    // The home/server dots are close; keep their short labels on opposite sides.
    for (const shift of [0, 20, -20, 40, -40]) {
      const candidate = Math.max(12, Math.min(228, y + shift));
      if (!placed.some(other => Math.abs(x - other.x) < 40 && Math.abs(candidate - other.y) < 15)) {
        y = candidate;
        break;
      }
    }
    label.setAttribute('x', x.toFixed(2));
    label.setAttribute('y', y.toFixed(2));
    placed.push({ x, y });
  }
}

function applyLocation(location) {
  visitorLocation = location;
  if (destroyed) return;
  baseView = location ? connectionView(location) : HOME_VIEW;
  motionTime = 0;
  previousTime = 0;
  Object.assign(view, baseView);
  globe.update({ ...view, ...globeConnections(visitorLocation, size) });
  updateLabels();
  syncControl();
}

function schedule() {
  if (!destroyed && globe && inView && !document.hidden && !frame) {
    frame = requestAnimationFrame(render);
  }
}

function render(time) {
  frame = 0;
  if (destroyed || !inView || document.hidden) return;
  // Keep rendering a static view at a low rate when paused: COBE's embedded
  // texture loads asynchronously and does not trigger a render itself.
  const interval = paused ? 250 : 1000 / 30;
  if (time - lastDraw >= interval) {
    if (!paused && previousTime) motionTime += Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    lastDraw = time;
    // The default view keeps home visible; consent frames all three locations.
    view.phi = baseView.phi + Math.sin(motionTime * 0.35) * (baseView.rotation ?? 0.18);
    globe.update({ phi: view.phi, theta: view.theta });
    updateLabels();
    stage.dataset.state = 'ready';
    labels.removeAttribute('hidden');
  }
  schedule();
}

function resize() {
  if (destroyed) return;
  size = Math.round(stage.getBoundingClientRect().width);
  if (size > 0) globe.update({ width: size, height: size, ...globeConnections(visitorLocation, size) });
}

try {
  const context = { alpha: true, stencil: false, antialias: true, depth: false };
  const gl = canvas.getContext('webgl2', context) || canvas.getContext('webgl', context);
  if (!gl) throw new Error('WebGL unavailable');
  control.hidden = false;
  stage.hidden = false;
  size = Math.round(stage.getBoundingClientRect().width);
  globe = createGlobe(canvas, {
    ...HOME_VIEW,
    width: size,
    height: size,
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    context,
    ...globeAppearance(),
    diffuse: 1.4,
    mapSamples: 16000,
    // No server/visitor marker or arcs exist until explicit location consent.
    ...globeConnections(null, size),
    arcWidth: 0.8,
    arcHeight: 0.2,
  });
  if (gl.isContextLost()) throw new Error('WebGL context lost');
  fallback.setAttribute('hidden', '');
  syncControl();
  locationControl = setupGeolocation({
    button: locationButton,
    status: document.getElementById('globe-location-status'),
    onLocation: applyLocation,
  });
  control.addEventListener('click', () => {
    paused = !paused;
    manuallyPaused = paused;
    try { sessionStorage.setItem('tn-art-paused', paused ? '1' : '0'); } catch { /* In-memory preference. */ }
    previousTime = 0;
    syncControl();
  });
  reducedMotion.addEventListener('change', (event) => {
    paused = event.matches || manuallyPaused;
    previousTime = 0;
    syncControl();
  });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) schedule();
    else stop();
  });
  intersectionObserver.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else schedule();
  });
  window.addEventListener('themechange', () => { if (!destroyed) globe.update(globeAppearance()); });
  canvas.addEventListener('webglcontextlost', unavailable);
  window.addEventListener('pagehide', (event) => {
    stop();
    // Discard location even when this page is retained in the back/forward cache.
    locationControl.clear();
    if (!event.persisted) {
      destroyed = true;
      locationControl.destroy();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      globe?.destroy();
      globe = undefined;
    }
  });
  window.addEventListener('pageshow', schedule);
  schedule();
} catch (error) {
  unavailable();
}
