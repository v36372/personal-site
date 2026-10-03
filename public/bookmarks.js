const controls = document.getElementById('bookmark-controls');
const input = document.getElementById('bookmark-search');
const tags = document.getElementById('bookmark-tag');
const stats = document.getElementById('bookmark-stats');
const collection = document.getElementById('bookmark-collection');
const noResults = document.getElementById('bookmark-no-results');
const typeButtons = [...document.querySelectorAll('.bookmark-type-tabs button')];
const viewButtons = [...document.querySelectorAll('.bookmark-view-tabs button')];
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const entries = [...document.querySelectorAll('#bookmark-collection .bookmark-row')].map(node => ({
  node,
  kind: node.dataset.kind,
  tags: JSON.parse(node.dataset.tags),
  text: normalize(node.dataset.search),
}));
const groups = [...document.querySelectorAll('#bookmark-collection .bookmark-group')];
const state = { kind: 'all', view: 'list' };
const initial = new URLSearchParams(location.search);
input.value = initial.get('q') || '';
if (typeButtons.some(button => button.dataset.kind === initial.get('type'))) state.kind = initial.get('type');
if ([...tags.options].some(option => option.value === initial.get('tag'))) tags.value = initial.get('tag');
if (initial.get('view') === 'timeline') state.view = 'timeline';

function update() {
  const query = normalize(input.value.trim());
  const terms = query.split(/\s+/).filter(Boolean);
  let count = 0;
  for (const entry of entries) {
    const matches = terms.every(term => entry.text.includes(term))
      && (state.kind === 'all' || entry.kind === state.kind)
      && (!tags.value || entry.tags.includes(tags.value));
    entry.node.hidden = !matches;
    if (matches) count++;
  }
  for (const group of groups) {
    const visible = group.querySelectorAll('.bookmark-row:not([hidden])').length;
    group.hidden = visible === 0;
    group.querySelector('.bookmark-group-count').textContent = String(visible);
  }
  typeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.kind === state.kind)));
  viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
  if (collection) collection.dataset.view = state.view;
  stats.textContent = entries.length ? count + ' of ' + entries.length + ' saved links' + (query || tags.value || state.kind !== 'all' ? ' match' : ' · newest first') : '0 saved links';
  if (noResults) noResults.hidden = count !== 0;

  const parameters = new URLSearchParams();
  if (input.value.trim()) parameters.set('q', input.value.trim());
  if (state.kind !== 'all') parameters.set('type', state.kind);
  if (tags.value) parameters.set('tag', tags.value);
  if (state.view !== 'list') parameters.set('view', state.view);
  const search = parameters.toString();
  history.replaceState(null, '', location.pathname + (search ? '?' + search : '') + location.hash);
}

controls.hidden = false;
input.addEventListener('input', update);
tags.addEventListener('change', update);
typeButtons.forEach(button => button.addEventListener('click', () => { state.kind = button.dataset.kind; update(); }));
viewButtons.forEach(button => button.addEventListener('click', () => { state.view = button.dataset.view; update(); }));
document.getElementById('bookmark-clear')?.addEventListener('click', () => {
  input.value = '';
  tags.value = '';
  state.kind = 'all';
  update();
  input.focus();
});
update();
