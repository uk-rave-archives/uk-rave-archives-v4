(() => {
  const config = window.TAPE_ARCHIVE_CONFIG || {};
  const seeded = Array.isArray(window.TAPE_PACKS) ? window.TAPE_PACKS : [];
  const catalogue = document.querySelector('#tape-catalogue');
  if (!catalogue) return;

  const audio = document.querySelector('#audio-player');
  const playButton = document.querySelector('#play-button');
  const muteButton = document.querySelector('#mute-button');
  const seek = document.querySelector('#seek');
  const volume = document.querySelector('#volume');
  const currentTime = document.querySelector('#current-time');
  const duration = document.querySelector('#duration');
  const trackList = document.querySelector('#track-list');
  const playerTitle = document.querySelector('#player-title');
  const playingTitle = document.querySelector('#playing-title');
  const playingSubtitle = document.querySelector('#playing-subtitle');
  const playingStatus = document.querySelector('#playing-status');
  const sourceLink = document.querySelector('#source-link');
  const search = document.querySelector('#tape-search');
  const yearFilter = document.querySelector('#year-filter');
  const clearFilters = document.querySelector('#clear-filters');
  const resultsMessage = document.querySelector('#results-message');
  const manifestStatus = document.querySelector('#manifest-status');

  let packs = [];
  let activePack = null;
  let activeTrackIndex = -1;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const directUrl = file => `${config.downloadBase}${file.split('/').map(encodeURIComponent).join('/')}`;
  const pretty = value => decodeURIComponent(value).replace(/^\([^)]*\)\s*/, '').replace(/\.[^.]+$/, '').trim();
  const formatTime = value => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2,'0')}` : '0:00';

  function parseTrack(name) {
    const base = name.split('/').pop().replace(/\.mp3$/i, '');
    const side = (base.match(/\(Side\s+([AB])\)/i) || [])[1] || '';
    const year = Number((base.match(/\((19|20)\d{2}\)/) || [''])[0].replace(/[()]/g,'')) || null;
    let artist = base.replace(/^.*?\s-\s/, '').replace(/\s*\((19|20)\d{2}\).*$/,'').replace(/\s*\(Side\s+[AB]\).*$/i,'').trim();
    if (!artist) artist = 'Unknown artist';
    return { title: `${artist}${side ? ` — Side ${side}` : ''}`, artist, side, year, file: name, url: directUrl(name) };
  }

  function groupManifest(files) {
    const groups = new Map();
    files.filter(file => /\.mp3$/i.test(file.name || '') && (file.name || '').includes('/')).forEach(file => {
      const parts = file.name.split('/');
      if (parts.length < 3) return;
      const folder = parts.slice(0, -1).join('/');
      const eventFolder = parts[1] || parts[0];
      if (!groups.has(folder)) groups.set(folder, {folder, eventFolder, tracks: []});
      groups.get(folder).tracks.push(parseTrack(file.name));
    });
    return [...groups.values()].map((group, index) => {
      const title = pretty(group.eventFolder);
      const years = group.tracks.map(t => t.year).filter(Boolean);
      const year = years.length ? Math.min(...years) : null;
      return {
        id: `archive-${index}`,
        title,
        promoter: 'Helter Skelter',
        year,
        yearLabel: year ? String(year) : 'Date researching',
        venue: title.includes(' - ') ? title.split(' - ').slice(-1)[0] : 'Venue researching',
        genres: ['Hardcore', 'Drum & Bass'],
        format: 'Event tape pack',
        status: 'playable',
        artwork: config.artwork,
        source: `${config.detailsUrl}/${group.folder.split('/').map(encodeURIComponent).join('/')}`,
        summary: `${group.tracks.length} recording${group.tracks.length === 1 ? '' : 's'} mapped from the original event folder.`,
        tracks: group.tracks.sort((a,b) => a.title.localeCompare(b.title))
      };
    }).filter(pack => pack.tracks.length);
  }

  function seededFallback() {
    return seeded.map(pack => ({...pack, tracks: (pack.seedTracks || []).map(track => ({...track, url: directUrl(track.file)}))}));
  }

  function fillYears() {
    [...new Set(packs.map(p => p.year).filter(Boolean))].sort().forEach(year => {
      const option = document.createElement('option'); option.value = year; option.textContent = year; yearFilter.appendChild(option);
    });
  }

  function packCard(pack) {
    const artists = [...new Set(pack.tracks.map(t => t.artist))].slice(0,5);
    return `<article class="catalogue-card" data-pack-id="${esc(pack.id)}">
      <button class="catalogue-art select-pack" type="button"><img src="${esc(pack.artwork)}" alt="${esc(pack.title)} artwork" loading="lazy"><span>LOAD PLAYER</span></button>
      <div class="catalogue-copy"><span class="catalogue-label">${esc(pack.format)}</span><h3>${esc(pack.title)}</h3>
      <p>${esc(pack.summary)}</p><div class="meta-row"><span>${esc(pack.yearLabel)}</span><span>${esc(pack.venue)}</span><span class="availability playable">${pack.tracks.length} tracks</span></div>
      <div class="artist-preview">${artists.map(a => `<span>${esc(a)}</span>`).join('')}</div>
      <div class="card-actions"><button class="small-button select-pack" type="button">▶ Listen to this pack</button><a class="small-button secondary" href="${esc(pack.source)}" target="_blank" rel="noopener">Source</a></div></div>
    </article>`;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const year = yearFilter.value;
    const filtered = packs.filter(pack => {
      const hay = [pack.title,pack.venue,pack.yearLabel,...pack.tracks.map(t=>t.artist),...pack.tracks.map(t=>t.title)].join(' ').toLowerCase();
      return (year === 'all' || String(pack.year) === year) && (!q || hay.includes(q));
    });
    catalogue.innerHTML = filtered.map(packCard).join('');
    resultsMessage.textContent = `${filtered.length} event pack${filtered.length === 1 ? '' : 's'} shown`;
  }

  function loadPack(pack) {
    activePack = pack; activeTrackIndex = -1; audio.pause(); audio.removeAttribute('src');
    playerTitle.textContent = pack.title; sourceLink.href = pack.source;
    playingStatus.textContent = `${pack.tracks.length} VERIFIED RECORDINGS`;
    playingTitle.textContent = 'Choose a DJ set'; playingSubtitle.textContent = `${pack.yearLabel} · ${pack.venue}`;
    trackList.innerHTML = pack.tracks.map((track,index) => `<button type="button" class="track-row" data-track="${index}"><span class="track-number">${String(index+1).padStart(2,'0')}</span><span><strong>${esc(track.title)}</strong><small>${esc(pack.title)}</small></span><span class="track-play">▶</span></button>`).join('');
    document.querySelector('#player').scrollIntoView({behavior:'smooth', block:'start'});
  }

  function loadTrack(index, autoplay=true) {
    if (!activePack || !activePack.tracks[index]) return;
    activeTrackIndex = index; const track = activePack.tracks[index]; audio.src = track.url;
    playingTitle.textContent = track.title; playingSubtitle.textContent = `${activePack.title} · ${activePack.yearLabel}`;
    trackList.querySelectorAll('.track-row').forEach((row,i) => row.classList.toggle('active', i===index));
    if (autoplay) audio.play().catch(() => {});
  }

  catalogue.addEventListener('click', e => { const card = e.target.closest('[data-pack-id]'); if (!card || !e.target.closest('.select-pack')) return; const pack = packs.find(p=>p.id===card.dataset.packId); if (pack) loadPack(pack); });
  trackList.addEventListener('click', e => { const row=e.target.closest('.track-row'); if(row) loadTrack(Number(row.dataset.track)); });
  playButton.addEventListener('click', () => { if (!audio.src && activePack) loadTrack(0); else if (audio.paused) audio.play(); else audio.pause(); });
  audio.addEventListener('play', () => playButton.textContent='❚❚'); audio.addEventListener('pause', () => playButton.textContent='▶');
  audio.addEventListener('timeupdate', () => { seek.value = audio.duration ? (audio.currentTime/audio.duration)*100 : 0; currentTime.textContent=formatTime(audio.currentTime); });
  audio.addEventListener('loadedmetadata', () => duration.textContent=formatTime(audio.duration));
  audio.addEventListener('ended', () => { if(activePack && activeTrackIndex < activePack.tracks.length-1) loadTrack(activeTrackIndex+1); });
  seek.addEventListener('input', () => { if(audio.duration) audio.currentTime=(Number(seek.value)/100)*audio.duration; });
  volume.addEventListener('input', () => { audio.volume=Number(volume.value); audio.muted=false; muteButton.textContent='🔊'; });
  muteButton.addEventListener('click', () => { audio.muted=!audio.muted; muteButton.textContent=audio.muted?'🔇':'🔊'; });
  search.addEventListener('input', render); yearFilter.addEventListener('change', render); clearFilters.addEventListener('click',()=>{search.value='';yearFilter.value='all';render();});

  async function init() {
    try {
      const response = await fetch(config.metadataUrl, {mode:'cors'});
      if (!response.ok) throw new Error(`Metadata ${response.status}`);
      const metadata = await response.json();
      packs = groupManifest(metadata.files || []);
      if (!packs.length) throw new Error('No MP3 folders found');
      manifestStatus.textContent = 'Live';
    } catch (error) {
      packs = seededFallback();
      manifestStatus.textContent = 'Fallback';
      console.warn('Archive manifest unavailable; using verified seed tracks.', error);
    }
    document.querySelector('#record-count').textContent=packs.length;
    document.querySelector('#track-count').textContent=packs.reduce((n,p)=>n+p.tracks.length,0);
    fillYears(); render(); if(packs[0]) loadPack(packs[0]);
  }
  init();
})();
