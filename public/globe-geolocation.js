import { approximateLocation } from './globe-location.js';

// Permission is requested only by an explicit click. No IP lookup, watcher,
// storage, analytics, or network request receives the visitor's coordinates.
export function setupGeolocation({ button, status, onLocation,
  geolocation = navigator.geolocation, permissions = navigator.permissions }) {
  let active = true;
  let connected = false;
  let request = 0;
  let permission;

  function reset(message = '') {
    request++;
    connected = false;
    button.disabled = false;
    button.textContent = 'Connect your location';
    button.setAttribute('aria-pressed', 'false');
    status.textContent = message;
    onLocation(null);
  }

  function failed() {
    reset('Location not shared. Only the Ho Chi Minh City marker is shown.');
  }

  function click() {
    if (!active || button.disabled) return;
    if (connected) {
      reset('Your location was removed. Only the Ho Chi Minh City marker is shown.');
      return;
    }
    const current = ++request;
    button.disabled = true;
    button.textContent = 'Locating…';
    status.textContent = 'Waiting for location permission. Your approximate position stays in this browser.';
    const isCurrent = () => active && current === request;
    try {
      geolocation.getCurrentPosition(position => {
        if (!isCurrent()) return;
        const location = approximateLocation(position?.coords);
        if (!location) { failed(); return; }
        connected = true;
        button.disabled = false;
        button.textContent = 'Remove my location';
        button.setAttribute('aria-pressed', 'true');
        status.textContent = 'Arcs connect your approximate location, Ho Chi Minh City, and Singapore (server). Your location is not saved or sent to this website.';
        onLocation(location);
      }, () => { if (isCurrent()) failed(); }, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      });
    } catch { if (isCurrent()) failed(); }
  }

  function revoked() {
    if (permission.state !== 'granted') failed();
  }

  button.hidden = !geolocation;
  if (geolocation) {
    button.addEventListener('click', click);
    // Observing permission changes never prompts. Revocation also clears any
    // displayed location and invalidates an outstanding result.
    try {
      permissions?.query({ name: 'geolocation' }).then(result => {
        if (!active) return;
        permission = result;
        permission.addEventListener('change', revoked);
      }).catch(() => { /* Permission inspection isn't supported everywhere. */ });
    } catch { /* The native permission prompt still works without inspection. */ }
  }

  return {
    clear: () => { if (active) reset(); },
    destroy: () => {
      if (!active) return;
      reset();
      active = false;
      button.hidden = true;
      button.removeEventListener('click', click);
      permission?.removeEventListener('change', revoked);
    },
  };
}
