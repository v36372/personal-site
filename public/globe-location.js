// City-level coordinates only; this is not a precise address.
export const HOME_LOCATION = Object.freeze([10.8231, 106.6297]);
// Singapore city center, not the VM's physical address.
export const SERVER_LOCATION = Object.freeze([1.3521, 103.8198]);
const radians = (degrees) => degrees * Math.PI / 180;

// Discard precise coordinates immediately; nothing is persisted or sent away.
export function approximateLocation(coords) {
  const { latitude, longitude } = coords || {};
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return [latitude, longitude].map(value => Math.round(value * 10) / 10 || 0);
}

export function globeConnections(visitor, size = 240) {
  const locations = visitor ? [HOME_LOCATION, SERVER_LOCATION, visitor] : [HOME_LOCATION];
  const markers = locations.map(location => ({ location, size: Math.min(0.05, 7 / size) }));
  const arcs = [];
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      // Avoid degenerate arcs when a visitor is at one of the existing markers.
      if (locations[i].some((value, axis) => Math.abs(value - locations[j][axis]) > 0.001)) {
        arcs.push({ from: locations[i], to: locations[j] });
      }
    }
  }
  return { markers, arcs };
}

const dot = (a, b) => a.reduce((sum, value, axis) => sum + value * b[axis], 0);
const normalize = (point) => {
  const length = Math.hypot(...point);
  return length > 1e-8 ? point.map(value => value / length) : null;
};
const unitLocation = ([latitude, longitude]) => [
  Math.cos(radians(latitude)) * Math.cos(radians(longitude)),
  Math.sin(radians(latitude)),
  -Math.cos(radians(latitude)) * Math.sin(radians(longitude)),
];

// Find a hemisphere-centered view of all three markers, including faraway
// visitors. Pair midpoints and the spherical circumcenter cover the candidates.
export function connectionView(visitor) {
  const points = [HOME_LOCATION, SERVER_LOCATION, visitor].map(unitLocation);
  const candidates = [normalize(points[0].map((_, axis) =>
    points.reduce((sum, point) => sum + point[axis], 0)))];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      candidates.push(normalize(points[i].map((value, axis) => value + points[j][axis])));
    }
  }
  const a = points[1].map((value, axis) => value - points[0][axis]);
  const b = points[2].map((value, axis) => value - points[0][axis]);
  const normal = normalize([
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]);
  if (normal) candidates.push(normal, normal.map(value => -value));
  const clearance = point => Math.min(...points.map(location => dot(point, location)));
  const center = candidates.filter(Boolean).sort((a, b) => clearance(b) - clearance(a))[0];
  return {
    ...HOME_VIEW,
    phi: 3 * Math.PI / 2 - Math.atan2(-center[2], center[0]),
    theta: Math.asin(Math.max(-1, Math.min(1, center[1]))),
    scale: 1,
    // At the limb (e.g. antipodes), don't rotate a marker out of view.
    rotation: Math.min(0.08, Math.max(0, clearance(center)) / 2),
  };
}

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
