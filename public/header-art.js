// Adapted from Aura's Capy renderer, Copyright (c) 2026 Mateo Cerquetella (MIT).
// Changes: website-only top banner, pause control, static fallback, and bounded
// rendering. Paper Shaders GLSL is Apache-2.0; see vendor/DITHER-NOTICES.txt.
import { VERTEX_SHADER, DITHERING_SHADER } from './vendor/aura-capy-shaders.js';
import { FRAME_INTERVAL, INITIAL_TIME, ANIMATION_SPEED, SHADER_SETTINGS, bufferSize } from './dither-settings.js';

const header = document.getElementById('art-header');
const surface = header.querySelector('.art-surface');
const canvas = document.getElementById('header-art-canvas');
const fallback = document.getElementById('art-fallback');
const control = document.getElementById('art-motion');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let manuallyPaused = false;
try { manuallyPaused = sessionStorage.getItem('tn-art-paused') === '1'; } catch { /* Storage may be disabled. */ }
let paused = reduced.matches || manuallyPaused;
let disposed = false;
let lost = false;
let visible = true;
let frame = 0;
let previous = null;
let lastDraw = 0;
let time = INITIAL_TIME;
let gl;
let program;
let buffer;
const shaders = [];
const uniforms = {};
let resizeObserver;
let intersectionObserver;

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  previous = null;
}

function release() {
  if (!gl) return;
  if (buffer) gl.deleteBuffer(buffer);
  if (program) gl.deleteProgram(program);
  shaders.forEach(shader => gl.deleteShader(shader));
}

function unavailable() {
  lost = true;
  stop();
  canvas.hidden = true;
  fallback.hidden = false;
  control.hidden = true;
  header.dataset.state = 'fallback';
}

function syncControl() {
  control.textContent = paused ? 'Play art' : 'Pause art';
  control.setAttribute('aria-label', paused ? 'Play header animation' : 'Pause header animation');
  header.dataset.paused = String(paused);
}

function uniform(name) {
  if (!(name in uniforms)) uniforms[name] = gl.getUniformLocation(program, name);
  return uniforms[name];
}

function palette() {
  if (disposed || lost) return;
  gl.useProgram(program);
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().replace('#', '');
  const rgb = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  gl.uniform4f(uniform('u_colorFront'), ...rgb, 0.74);
  gl.uniform4f(uniform('u_colorBack'), 0, 0, 0, 0);
}

function draw() {
  if (disposed || lost || !canvas.width || !canvas.height) return;
  gl.useProgram(program);
  gl.uniform1f(uniform('u_time'), time);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  canvas.hidden = false;
  fallback.hidden = true;
  header.dataset.state = 'ready';
}

function tick(now) {
  frame = 0;
  if (disposed || lost || paused || document.hidden || !visible) return;
  if (previous !== null) time += Math.min(now - previous, FRAME_INTERVAL) * 0.001 * ANIMATION_SPEED;
  previous = now;
  if (now - lastDraw >= FRAME_INTERVAL) {
    draw();
    lastDraw = now;
  }
  frame = requestAnimationFrame(tick);
}

function schedule() {
  stop();
  if (disposed || lost || document.hidden || !visible) return;
  draw();
  if (!paused) frame = requestAnimationFrame(tick);
}

function resize() {
  if (disposed || lost) return;
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

function changeMotion(event) {
  paused = event.matches || manuallyPaused;
  syncControl();
  schedule();
}

function changeTheme() {
  palette();
  schedule();
}

function pageHide(event) {
  stop();
  if (event.persisted) return;
  disposed = true;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  document.removeEventListener('visibilitychange', schedule);
  reduced.removeEventListener('change', changeMotion);
  window.removeEventListener('themechange', changeTheme);
  window.removeEventListener('pageshow', schedule);
  release();
}

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
    // Preserve Aura's precision upgrade on hardware with limited mediump.
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
  control.hidden = false;
  syncControl();
  control.addEventListener('click', () => {
    paused = !paused;
    manuallyPaused = paused;
    try { sessionStorage.setItem('tn-art-paused', paused ? '1' : '0'); } catch { /* In-memory preference. */ }
    syncControl();
    schedule();
  });
  canvas.addEventListener('webglcontextlost', unavailable);
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(surface);
  intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  intersectionObserver.observe(header);
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', changeMotion);
  window.addEventListener('themechange', changeTheme);
  window.addEventListener('pagehide', pageHide);
  window.addEventListener('pageshow', schedule);
  schedule();
} catch {
  release();
  unavailable();
}
