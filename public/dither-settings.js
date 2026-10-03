// Bounded defaults adapted from Aura's Capy renderer; see vendor/DITHER-NOTICES.txt.
export const FRAME_INTERVAL = 1000 / 15;
export const INITIAL_TIME = 40;
export const ANIMATION_SPEED = 0.5;
export const MAX_BUFFER_PIXELS = 96000;
export const MAX_BUFFER_SIDE = 4096;
export const SHADER_SETTINGS = Object.freeze({
  u_originX: 0.5, u_originY: 0.5,
  u_worldWidth: 0, u_worldHeight: 0,
  u_fit: 0, u_scale: 2, u_rotation: 0,
  u_offsetX: 0, u_offsetY: 0,
  u_shape: 1, u_type: 4, u_pxSize: 3,
});

export function bufferSize(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const scale = Math.min(1 / 3, Math.sqrt(MAX_BUFFER_PIXELS / (width * height)),
    MAX_BUFFER_SIDE / width, MAX_BUFFER_SIDE / height);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    pixelRatio: Math.max(1, Math.floor(width * scale)) / width,
  };
}
