(() => {
  const themes = ['warm', 'light', 'dark'];
  const labels = { warm: 'Warm', light: 'Light', dark: 'Dark' };
  const colors = { warm: '#282722', light: '#f8f7f3', dark: '#181d21' };
  let theme = 'warm';
  try {
    const saved = localStorage.getItem('tn-theme');
    if (themes.includes(saved)) theme = saved;
  } catch { /* Storage may be disabled. */ }
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[theme]);

  document.addEventListener('DOMContentLoaded', () => {
    const control = document.getElementById('theme-control');
    if (!control) return;
    const update = () => {
      const next = themes[(themes.indexOf(theme) + 1) % themes.length];
      control.textContent = 'Theme: ' + labels[theme];
      control.setAttribute('aria-label', 'Theme: ' + labels[theme] + '. Switch to ' + labels[next]);
      control.hidden = false;
    };
    update();
    control.addEventListener('click', () => {
      theme = themes[(themes.indexOf(theme) + 1) % themes.length];
      document.documentElement.dataset.theme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[theme]);
      try { localStorage.setItem('tn-theme', theme); } catch { /* Use in-memory theme. */ }
      update();
      window.dispatchEvent(new CustomEvent('themechange'));
    });
  });
})();
