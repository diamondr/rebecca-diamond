const search = document.getElementById('paper-search');
const topic = document.getElementById('topic-filter');
if (search && topic) {
  document.documentElement.classList.add('js');
  const papers = [...document.querySelectorAll('[data-paper]')];
  const groups = [...document.querySelectorAll('.research-group')];
  const count = document.getElementById('search-count');
  const empty = document.getElementById('no-results');
  const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function filter() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const paper of papers) {
      const matchesText = words.every(word => normalize(paper.dataset.search).includes(word));
      const matchesTopic = !topic.value || paper.dataset.topics.split('|').includes(topic.value);
      paper.hidden = !(matchesText && matchesTopic);
      if (!paper.hidden) shown++;
    }
    for (const group of groups) {
      group.hidden = ![...group.querySelectorAll('[data-paper]')].some(p => !p.hidden);
      const link = document.querySelector(`.research-sidebar a[href="#${group.id}"]`);
      if (link) link.hidden = group.hidden;
    }
    count.textContent = words.length || topic.value ? `${shown} ${shown === 1 ? 'paper' : 'papers'} found` : '';
    empty.hidden = shown !== 0;
    const params = new URLSearchParams();
    if (search.value.trim()) params.set('q', search.value.trim());
    if (topic.value) params.set('topic', topic.value);
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
  }
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') || '';
  const selected = params.get('topic') || '';
  if ([...topic.options].some(option => option.value === selected)) topic.value = selected;
  search.addEventListener('input', filter);
  topic.addEventListener('change', filter);
  document.getElementById('clear-search').addEventListener('click', () => { search.value = ''; topic.value = ''; filter(); search.focus(); });
  filter();
}
