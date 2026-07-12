(() => {
  const records = Array.isArray(window.TAPE_PACKS) ? window.TAPE_PACKS : [];
  const years = Array.isArray(window.TAPE_ARCHIVE_YEARS) ? window.TAPE_ARCHIVE_YEARS : [];
  const catalogue = document.querySelector('#tape-catalogue');
  if (!catalogue) return;

  const yearRail = document.querySelector('#year-rail');
  const promoterSelect = document.querySelector('#promoter-filter');
  const genreSelect = document.querySelector('#genre-filter');
  const statusSelect = document.querySelector('#status-filter');
  const searchInput = document.querySelector('#tape-search');
  const clearButton = document.querySelector('#clear-filters');
  const emptyState = document.querySelector('#empty-state');
  const resultsMessage = document.querySelector('#results-message');
  const coverageGrid = document.querySelector('#coverage-grid');
  let selectedYear = 'all';

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const unique = values => [...new Set(values.filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b)));

  function fillSelect(select, values) {
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  fillSelect(promoterSelect, unique(records.map(item => item.promoter)));
  fillSelect(genreSelect, unique(records.flatMap(item => item.genres || [])));
  document.querySelector('#record-count').textContent = records.length;
  document.querySelector('#playable-count').textContent = records.filter(item => item.status === 'playable').length;

  function yearCount(year) { return records.filter(item => item.year === year).length; }
  const allButton = document.createElement('button');
  allButton.className = 'year-button active';
  allButton.type = 'button';
  allButton.dataset.year = 'all';
  allButton.innerHTML = 'ALL<small>' + records.length + ' records</small>';
  yearRail.appendChild(allButton);
  years.forEach(year => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'year-button';
    button.dataset.year = String(year);
    const count = yearCount(year);
    button.innerHTML = year + '<small>' + count + (count === 1 ? ' record' : ' records') + '</small>';
    yearRail.appendChild(button);
  });

  function cardTemplate(item) {
    const tags = (item.genres || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
    const play = item.player ? `<a class="small-button" href="${escapeHtml(item.page)}#player">▶ Listen</a>` : '';
    return `<article class="catalogue-card">
      <a class="catalogue-art" href="${escapeHtml(item.page)}"><img src="${escapeHtml(item.artwork)}" alt="${escapeHtml(item.title)} artwork" loading="lazy"></a>
      <div class="catalogue-copy">
        <span class="catalogue-label">${escapeHtml(item.format || 'TAPE PACK')}</span>
        <h3><a href="${escapeHtml(item.page)}">${escapeHtml(item.title)}</a></h3>
        <p>${escapeHtml(item.summary)}</p>
        <div class="meta-row"><span>${escapeHtml(item.yearLabel || item.year || 'Date researching')}</span><span>${escapeHtml(item.promoter)}</span><span class="availability ${escapeHtml(item.status)}">${escapeHtml(item.status === 'playable' ? 'Playable' : item.status)}</span></div>
        <div class="tag-row">${tags}</div>
        <div class="card-actions">${play}<a class="small-button secondary" href="${escapeHtml(item.page)}">Open exhibit</a></div>
      </div>
    </article>`;
  }

  function filteredRecords() {
    const query = searchInput.value.trim().toLowerCase();
    return records.filter(item => {
      const haystack = [item.title,item.promoter,item.venue,item.yearLabel,item.summary,...(item.genres || [])].join(' ').toLowerCase();
      return (selectedYear === 'all' || String(item.year) === selectedYear) &&
        (promoterSelect.value === 'all' || item.promoter === promoterSelect.value) &&
        (genreSelect.value === 'all' || (item.genres || []).includes(genreSelect.value)) &&
        (statusSelect.value === 'all' || item.status === statusSelect.value) &&
        (!query || haystack.includes(query));
    });
  }

  function render() {
    const filtered = filteredRecords();
    catalogue.innerHTML = filtered.map(cardTemplate).join('');
    emptyState.hidden = filtered.length !== 0;
    resultsMessage.textContent = `${filtered.length} ${filtered.length === 1 ? 'record' : 'records'} shown` + (selectedYear !== 'all' ? ` for ${selectedYear}` : '');
  }

  yearRail.addEventListener('click', event => {
    const button = event.target.closest('.year-button');
    if (!button) return;
    selectedYear = button.dataset.year;
    yearRail.querySelectorAll('.year-button').forEach(item => item.classList.toggle('active', item === button));
    render();
  });
  [promoterSelect, genreSelect, statusSelect].forEach(control => control.addEventListener('change', render));
  searchInput.addEventListener('input', render);
  clearButton.addEventListener('click', () => {
    selectedYear = 'all'; searchInput.value = ''; promoterSelect.value = 'all'; genreSelect.value = 'all'; statusSelect.value = 'all';
    yearRail.querySelectorAll('.year-button').forEach(button => button.classList.toggle('active', button.dataset.year === 'all'));
    render();
  });
  document.querySelector('#show-all').addEventListener('click', () => clearButton.click());
  document.querySelectorAll('.view-toggle').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.view-toggle').forEach(item => item.classList.toggle('active', item === button));
    catalogue.classList.toggle('list-view', button.dataset.view === 'list');
  }));

  years.forEach(year => {
    const count = yearCount(year);
    const percentage = records.length ? Math.min(100, Math.max(count ? 18 : 2, (count / records.length) * 100)) : 0;
    coverageGrid.insertAdjacentHTML('beforeend', `<div class="coverage-year"><strong>${year}</strong><span>${count ? `${count} catalogued` : 'Research queue open'}</span><div class="coverage-bar"><i style="width:${percentage}%"></i></div></div>`);
  });
  render();
})();
