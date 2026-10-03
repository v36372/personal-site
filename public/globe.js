import createGlobe from './vendor/cobe-2.0.1.js';
import { HOME_LOCATION, HOME_VIEW } from './globe-location.js';

const canvas = document.getElementById('globe');
const stage = document.getElementById('globe-stage');
const fallback = document.getElementById('globe-fallback');
const control = document.getElementById('globe-motion');
const status = document.getElementById('globe-status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let globe;
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
  globe?.destroy();
  stage.dataset.state = 'unavailable';
  control.hidden = true;
  fallback.removeAttribute('hidden');
  status.hidden = false;
}

function syncControl() {
  const action = paused ? 'Play' : 'Pause';
  control.setAttribute('aria-label', action + ' animations. Based in Ho Chi Minh City, Vietnam');
  control.title = action + ' animations';
  control.setAttribute('aria-pressed', String(paused));
  stage.dataset.paused = String(paused);
  // The existing globe control also handles the decorative art; no banner buttons.
  window.dispatchEvent(new CustomEvent('motionchange', { detail: { paused, manuallyPaused } }));
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
    // A gentle, bounded rotation keeps Ho Chi Minh City visible at all times.
    view.phi = HOME_VIEW.phi + Math.sin(motionTime * 0.35) * 0.18;
    globe.update({ phi: view.phi, theta: view.theta });
    stage.dataset.state = 'ready';
  }
  schedule();
}

function resize() {
  const size = Math.round(stage.getBoundingClientRect().width);
  if (size > 0) globe.update({ width: size, height: size });
}

try {
  const context = { alpha: true, stencil: false, antialias: true, depth: false };
  const gl = canvas.getContext('webgl2', context) || canvas.getContext('webgl', context);
  if (!gl) throw new Error('WebGL unavailable');
  control.hidden = false;
  stage.hidden = false;
  const size = Math.round(stage.getBoundingClientRect().width);
  globe = createGlobe(canvas, {
    ...HOME_VIEW,
    width: size,
    height: size,
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    context,
    ...globeAppearance(),
    diffuse: 1.4,
    mapSamples: 16000,
    // A small city marker stays legible on the larger About globe.
    markers: [{ location: HOME_LOCATION, size: Math.min(0.05, 7 / size) }],
  });
  if (gl.isContextLost()) throw new Error('WebGL context lost');
  fallback.setAttribute('hidden', '');
  syncControl();
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
    if (!event.persisted) {
      destroyed = true;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      globe.destroy();
    }
  });
  window.addEventListener('pageshow', schedule);
  schedule();
} catch (error) {
  unavailable();
}
