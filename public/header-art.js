// Adapted from Aura's Capy renderer, Copyright (c) 2026 Mateo Cerquetella (MIT).
// Changes: lazy header/footer bands, shared motion control/clock, static
// fallback, and bounded rendering. GLSL is Apache-2.0; see vendor/DITHER-NOTICES.txt.
import { VERTEX_SHADER, DITHERING_SHADER } from './vendor/aura-capy-shaders.js';
import { FRAME_INTERVAL, INITIAL_TIME, ANIMATION_SPEED, SHADER_SETTINGS, bufferSize } from './dither-settings.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let manuallyPaused = false;
try { manuallyPaused = sessionStorage.getItem('tn-art-paused') === '1'; } catch { /* Storage may be disabled. */ }
let paused = reduced.matches || manuallyPaused;
let disposed = false;
let pageHidden = false;
let frame = 0;
let previous = null;
let lastDraw = 0;
let time = INITIAL_TIME;

function createBand(banner) {
  const surface = banner.querySelector('.art-surface');
  const canvas = surface.querySelector('canvas');
  const fallback = surface.querySelector('.art-fallback');
  const phase = banner.dataset.art === 'footer' ? 12 : 0;
  let visible = false;
  let lost = false;
  let gl;
  let program;
  let buffer;
  const shaders = [];
  const uniforms = {};

  function syncMotion() {
    banner.dataset.paused = String(paused);
  }

  function release() {
    if (!gl) return;
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
    buffer = null;
    program = null;
    shaders.length = 0;
  }

  function unavailable() {
    lost = true;
    release();
    canvas.hidden = true;
    fallback.hidden = false;
    banner.dataset.state = 'fallback';
    schedule();
  }

  function uniform(name) {
    if (!(name in uniforms)) uniforms[name] = gl.getUniformLocation(program, name);
    return uniforms[name];
  }

  function palette() {
    if (!gl || lost || disposed) return;
    gl.useProgram(program);
    const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().replace('#', '');
    const rgb = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    gl.uniform4f(uniform('u_colorFront'), ...rgb, 0.74);
    gl.uniform4f(uniform('u_colorBack'), 0, 0, 0, 0);
  }

  function draw() {
    if (!gl || lost || disposed || !visible || !canvas.width || !canvas.height) return;
    gl.useProgram(program);
    gl.uniform1f(uniform('u_time'), time + phase);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.hidden = false;
    fallback.hidden = true;
    banner.dataset.state = 'ready';
  }

  function resize() {
    if (!gl || lost || disposed || !visible) return;
    const bounds = surface.getBoundingClientRect();
    const size = bufferSize(bounds.width, bounds.height);
    if (!size) return;
    canvas.width = size.width;
    canvas.height = size.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.uniform2f(uniform('u_resolution'), canvas.width, canvas.height);
    gl.uniform1f(uniform('u_pixelRatio'), size.pixelRatio);
    draw();
  }

  function initialize() {
    // Do not allocate a second WebGL context until the footer is on screen.
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true, antialias: false, depth: false, stencil: false,
        premultipliedAlpha: true, preserveDrawingBuffer: false,
      });
      if (!gl) throw new Error('WebGL2 unavailable');
      program = gl.createProgram();
      buffer = gl.createBuffer();
      if (!program || !buffer) throw new Error('WebGL allocation failed');
      const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
      for (const [type, original] of [[gl.VERTEX_SHADER, VERTEX_SHADER], [gl.FRAGMENT_SHADER, DITHERING_SHADER]]) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Shader allocation failed');
        shaders.push(shader);
        const source = precision && precision.precision < 23
          ? original.replace(/precision mediump float/g, 'precision highp float') : original;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compile failed');
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed');
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      for (const [name, value] of Object.entries(SHADER_SETTINGS)) gl.uniform1f(uniform(name), value);
      palette();
      resize();
      if (gl.isContextLost()) throw new Error('WebGL context lost');
    } catch {
      unavailable();
    }
  }

  function setVisible(value) {
    visible = value;
    if (!visible || lost || disposed) return;
    if (!gl) initialize();
    else { palette(); resize(); }
  }

  function destroy() {
    canvas.removeEventListener('webglcontextlost', unavailable);
    release();
  }

  canvas.addEventListener('webglcontextlost', unavailable);
  syncMotion();
  return { banner, surface, syncMotion, palette, draw, resize, setVisible, destroy,
    get active() { return visible && !lost && !!program; } };
}

const bands = Array.from(document.querySelectorAll('[data-art]'), createBand);
const byBanner = new Map(bands.map(band => [band.banner, band]));
const bySurface = new Map(bands.map(band => [band.surface, band]));

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  previous = null;
}

function tick(now) {
  frame = 0;
  if (disposed || pageHidden || paused || document.hidden || !bands.some(band => band.active)) return;
  if (previous !== null) time += Math.min(now - previous, FRAME_INTERVAL) * 0.001 * ANIMATION_SPEED;
  previous = now;
  if (now - lastDraw >= FRAME_INTERVAL) {
    bands.forEach(band => band.draw());
    lastDraw = now;
  }
  frame = requestAnimationFrame(tick);
}

function schedule() {
  stop();
  if (disposed || pageHidden || document.hidden) return;
  bands.forEach(band => band.draw());
  if (!paused && bands.some(band => band.active)) frame = requestAnimationFrame(tick);
}

function changeSharedMotion(event) {
  paused = event.detail.paused;
  manuallyPaused = event.detail.manuallyPaused;
  bands.forEach(band => band.syncMotion());
  schedule();
}

function changeMotion(event) {
  paused = event.matches || manuallyPaused;
  bands.forEach(band => band.syncMotion());
  schedule();
}

function changeTheme() {
  bands.forEach(band => band.palette());
  schedule();
}

const resizeObserver = new ResizeObserver(entries => {
  entries.forEach(entry => bySurface.get(entry.target)?.resize());
});
const intersectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => byBanner.get(entry.target)?.setVisible(entry.isIntersecting));
  schedule();
});
bands.forEach(band => {
  resizeObserver.observe(band.surface);
  intersectionObserver.observe(band.banner);
});

function pageHide(event) {
  pageHidden = true;
  stop();
  if (event.persisted) return;
  disposed = true;
  resizeObserver.disconnect();
  intersectionObserver.disconnect();
  document.removeEventListener('visibilitychange', schedule);
  reduced.removeEventListener('change', changeMotion);
  window.removeEventListener('themechange', changeTheme);
  window.removeEventListener('motionchange', changeSharedMotion);
  window.removeEventListener('pagehide', pageHide);
  window.removeEventListener('pageshow', pageShow);
  bands.forEach(band => band.destroy());
}

function pageShow() {
  pageHidden = false;
  schedule();
}

document.addEventListener('visibilitychange', schedule);
reduced.addEventListener('change', changeMotion);
window.addEventListener('themechange', changeTheme);
window.addEventListener('motionchange', changeSharedMotion);
window.addEventListener('pagehide', pageHide);
window.addEventListener('pageshow', pageShow);
