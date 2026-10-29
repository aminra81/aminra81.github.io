// Keep explicit index.html visits at the same clean URL used by navigation.
if (location.pathname.endsWith('/index.html')) {
  history.replaceState(null, '', location.pathname.slice(0, -10) + location.search + location.hash);
}
document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  navigation?.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  navigation?.classList.toggle('is-open', expanded);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 721px)').addEventListener('change', closeMenu);

const paperSearch = document.querySelector('#paper-search');
if (paperSearch) {
  const papers = [...document.querySelectorAll('[data-paper]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const count = document.querySelector('[data-result-count]');
  let activeFilter = 'all';
  document.querySelector('[data-controls]').hidden = false;
  const searchable = papers.map(p => ({ element:p, text:(p.textContent+' '+p.dataset.tags).toLocaleLowerCase(), tags:p.dataset.tags.toLocaleLowerCase().split(' ') }));
  function update() {
    const query = paperSearch.value.toLocaleLowerCase().trim();
    let visible = 0;
    for (const { element, text, tags } of searchable) {
      const matches = (!query || text.includes(query)) && (activeFilter === 'all' || tags.includes(activeFilter.toLocaleLowerCase()));
      element.hidden = !matches;
      visible += Number(matches);
    }
    count.textContent = `${visible} ${visible === 1 ? 'publication' : 'publications'}${query || activeFilter !== 'all' ? ` of ${papers.length}` : ''}`;
    document.querySelector('[data-empty]').hidden = visible !== 0;
  }
  paperSearch.addEventListener('input', update);
  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => {
      const selected = filter === button;
      filter.classList.toggle('active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    update();
  }));
  const revealHash = () => {
    const paper = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (paper?.matches('[data-paper]')) paper.querySelector('details')?.setAttribute('open', '');
  };
  revealHash();
  window.addEventListener('hashchange', revealHash);
}
