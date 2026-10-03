import createGlobe from './vendor/cobe-2.0.1.js';
import { HOME_LOCATION, HOME_VIEW, projectLocation } from './globe-location.js';

const canvas = document.getElementById('globe');
const stage = document.getElementById('globe-stage');
const pin = document.getElementById('globe-pin');
const control = document.getElementById('globe-motion');
const status = document.getElementById('globe-status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let globe;
let frame = 0;
let lastDraw = 0;
let previousTime = 0;
let motionTime = 0;
let inView = true;
let paused = reducedMotion.matches;
let destroyed = false;
const view = { ...HOME_VIEW };

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
  pin.hidden = true;
  control.hidden = true;
  status.hidden = false;
}

function syncControl() {
  control.textContent = paused ? 'Play motion' : 'Pause motion';
  control.setAttribute('aria-pressed', String(paused));
  stage.dataset.paused = String(paused);
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
    const position = projectLocation(HOME_LOCATION, view);
    pin.style.left = position.x * 100 + '%';
    pin.style.top = position.y * 100 + '%';
    pin.hidden = !position.visible;
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
  stage.hidden = false;
  const size = Math.round(stage.getBoundingClientRect().width);
  globe = createGlobe(canvas, {
    ...HOME_VIEW,
    width: size,
    height: size,
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    context,
    dark: 0,
    diffuse: 1.4,
    mapSamples: 16000,
    mapBrightness: 1.6,
    baseColor: [0.76, 0.79, 0.71],
    markerColor: [0.74, 0.45, 0.33],
    glowColor: [0.957, 0.949, 0.925],
    // No bindable IDs: the label uses our projection instead of CSS anchors,
    // keeping it compatible with browsers without anchor positioning.
    markers: [{ location: HOME_LOCATION, size: 0.055 }],
  });
  if (gl.isContextLost()) throw new Error('WebGL context lost');
  control.hidden = false;
  syncControl();
  control.addEventListener('click', () => {
    paused = !paused;
    previousTime = 0;
    syncControl();
  });
  reducedMotion.addEventListener('change', (event) => {
    paused = event.matches;
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
