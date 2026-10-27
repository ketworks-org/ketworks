// Loaded before the stylesheet on every page so saved colors apply before painting.
(() => {
  const key = 'ketworks-appearance';
  const defaults = {palette: 'cool', plot: 'charcoal'};
  const normalize = value => ({
    palette: ['white', 'cool', 'warm'].includes(value?.palette) ? value.palette : defaults.palette,
    plot: ['charcoal', 'blue'].includes(value?.plot) ? value.plot : defaults.plot,
  });
  const parse = raw => { try { return normalize(JSON.parse(raw)); } catch { return {...defaults}; } };
  let preferences;
  try { preferences = parse(localStorage.getItem(key)); } catch { preferences = {...defaults}; }
  const apply = () => {
    document.documentElement.dataset.palette = preferences.palette;
    document.documentElement.dataset.plot = preferences.plot;
  };
  apply();

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appearance-form');
    if (!form) return;
    const status = document.getElementById('appearance-status');
    const sync = () => {
      form.elements.namedItem('palette').value = preferences.palette;
      form.elements.namedItem('plot').value = preferences.plot;
    };
    const save = reset => {
      apply(); sync();
      try {
        if (reset) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(preferences));
        status.textContent = reset ? 'Default appearance restored.' : 'Appearance saved.';
      } catch {
        status.textContent = 'Appearance applied for this visit. Your browser could not save the preference.';
      }
    };
    sync();
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('change', () => {
      preferences = normalize(Object.fromEntries(new FormData(form)));
      save(false);
    });
    document.getElementById('appearance-reset').addEventListener('click', () => {
      preferences = {...defaults};
      save(true);
    });
  });

  // Keep open articles and settings in sync when another tab changes the preference.
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preferences = parse(event.newValue);
    apply();
    const form = document.getElementById('appearance-form');
    if (form) {
      form.elements.namedItem('palette').value = preferences.palette;
      form.elements.namedItem('plot').value = preferences.plot;
      document.getElementById('appearance-status').textContent = '';
    }
  });
})();
