// City-level coordinates only; this is not a precise address.
export const HOME_LOCATION = Object.freeze([10.8231, 106.6297]);
const radians = (degrees) => degrees * Math.PI / 180;

// COBE's longitude convention places the front meridian at 3π/2 - longitude.
export const HOME_VIEW = Object.freeze({
  phi: 3 * Math.PI / 2 - radians(HOME_LOCATION[1]),
  theta: radians(HOME_LOCATION[0]),
  scale: 1.12,
  markerElevation: 0.02,
});

// Match COBE 2's projection to keep the HTML label attached to its WebGL dot.
// The canvas is square, so x/y are normalized CSS coordinates, not pixels.
export function projectLocation(location, view) {
  const latitude = radians(location[0]);
  const longitude = radians(location[1]);
  const radius = 0.8 + view.markerElevation;
  const point = [
    radius * Math.cos(latitude) * Math.cos(longitude),
    radius * Math.sin(latitude),
    -radius * Math.cos(latitude) * Math.sin(longitude),
  ];
  const { phi, theta, scale } = view;
  const x = Math.cos(phi) * point[0] + Math.sin(phi) * point[2];
  const y = Math.sin(phi) * Math.sin(theta) * point[0]
    + Math.cos(theta) * point[1] - Math.cos(phi) * Math.sin(theta) * point[2];
  const z = -Math.sin(phi) * Math.cos(theta) * point[0]
    + Math.sin(theta) * point[1] + Math.cos(phi) * Math.cos(theta) * point[2];
  return {
    x: (x * scale + 1) / 2,
    y: (-y * scale + 1) / 2,
    visible: z >= 0 || x * x + y * y >= 0.8 ** 2,
  };
}
