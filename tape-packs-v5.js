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
  const playerArt = document.querySelector('#player-art');
  const playingTitle = document.querySelector('#playing-title');
  const playingSubtitle = document.querySelector('#playing-subtitle');
  const playingStatus = document.querySelector('#playing-status');
  const sourceLink = document.querySelector('#source-link');
  const search = document.querySelector('#tape-search');
  const yearFilter = document.querySelector('#year-filter');
  const clearFilters = document.querySelector('#clear-filters');
  const resultsMessage = document.querySelector('#results-message');
  const manifestStatus = document.querySelector('#manifest-status');

  const FALLBACK_ART = 'tape-artwork-unavailable.svg';
  let packs = [];
  let activePack = null;
  let activeTrackIndex = -1;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const cleanText = value => {
    let text = String(value || '');
    try { text = decodeURIComponent(text); } catch (_) {}
    return text.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  const pathUrl = file => `${config.downloadBase}${String(file).split('/').map(part => encodeURIComponent(part)).join('/')}`;
  const detailsUrl = folder => `${config.detailsUrl}/${String(folder).split('/').map(part => encodeURIComponent(part)).join('/')}`;
  const pretty = value => cleanText(value).replace(/^\([^)]*\)\s*/, '').replace(/\.[^.]+$/, '').trim();
  const formatTime = value => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2,'0')}` : '0:00';

  function parseTrack(name) {
    const filename = cleanText(name.split('/').pop()).replace(/\.mp3$/i, '');
    const side = (filename.match(/(?:\(|\b)Side\s*([AB])(?:\)|\b)/i) || [])[1] || '';
    const year = Number((filename.match(/\b(?:19|20)\d{2}\b/) || [''])[0]) || null;
    let artist = filename
      .replace(/^.*?\s-\s/, '')
      .replace(/\s*\((?:19|20)\d{2}\).*$/,'')
      .replace(/\s*\(?Side\s*[AB]\)?.*$/i,'')
      .trim();
    if (!artist) artist = 'Unknown artist';
    return {
      title: `${artist}${side ? ` — Side ${side.toUpperCase()}` : ''}`,
      artist,
      side: side.toUpperCase(),
      year,
      file: name,
      url: pathUrl(name)
    };
  }

  function imageScore(file) {
    const name = cleanText(file.name || '').toLowerCase();
    let score = 0;
    if (/front|cover|artwork|inlay|pack/.test(name)) score += 60;
    if (/back|rear/.test(name)) score += 20;
    if (/thumb|spectrogram|waveform|__ia_thumb|itemimage/.test(name)) score -= 100;
    if (/\.jpe?g$/i.test(name)) score += 12;
    if (/\.png$/i.test(name)) score += 8;
    const size = Number(file.size || 0);
    if (size > 100000) score += 10;
    if (size > 500000) score += 8;
    return score;
  }

  function chooseArtwork(group, allFiles) {
    const folderPrefix = `${group.folder}/`;
    const sameFolder = allFiles.filter(file => {
      const name = file.name || '';
      return name.startsWith(folderPrefix) && !name.slice(folderPrefix.length).includes('/') && /\.(?:jpe?g|png|webp)$/i.test(name);
    });
    const eventPrefix = `${group.root}/${group.eventFolder}/`;
    const eventImages = allFiles.filter(file => (file.name || '').startsWith(eventPrefix) && /\.(?:jpe?g|png|webp)$/i.test(file.name || ''));
    const candidates = [...sameFolder, ...eventImages].filter((file, index, array) => array.findIndex(x => x.name === file.name) === index);
    candidates.sort((a,b) => imageScore(b) - imageScore(a));
    return candidates[0] ? pathUrl(candidates[0].name) : FALLBACK_ART;
  }

  function groupManifest(files) {
    const mp3s = files.filter(file => /\.mp3$/i.test(file.name || '') && (file.name || '').includes('/'));
    const groups = new Map();
    mp3s.forEach(file => {
      const parts = file.name.split('/');
      if (parts.length < 3) return;
      const folder = parts.slice(0, -1).join('/');
      const root = parts[0];
      const eventFolder = parts[1] || parts[0];
      if (!groups.has(folder)) groups.set(folder, {folder, root, eventFolder, tracks: []});
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
        artwork: chooseArtwork(group, files),
        source: detailsUrl(group.folder),
        summary: `${group.tracks.length} recording${group.tracks.length === 1 ? '' : 's'} mapped from the original event folder.`,
        tracks: group.tracks.sort((a,b) => a.title.localeCompare(b.title, undefined, {numeric:true}))
      };
    }).filter(pack => pack.tracks.length);
  }

  function seededFallback() {
    return seeded.map(pack => ({
      ...pack,
      artwork: pack.artwork && !pack.artwork.includes('/services/img/') ? pack.artwork : FALLBACK_ART,
      tracks: (pack.seedTracks || []).map(track => ({...track, url: pathUrl(track.file)}))
    }));
  }

  function fillYears() {
    yearFilter.querySelectorAll('option:not([value="all"])').forEach(option => option.remove());
    [...new Set(packs.map(p => p.year).filter(Boolean))].sort().forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });
  }

  function packCard(pack) {
    const artists = [...new Set(pack.tracks.map(t => t.artist))].slice(0,5);
    return `<article class="catalogue-card" data-pack-id="${esc(pack.id)}">
      <button class="catalogue-art select-pack" type="button"><img src="${esc(pack.artwork)}" alt="${esc(pack.title)} artwork" loading="lazy" onerror="this.src='${FALLBACK_ART}'"><span>LOAD PLAYER</span></button>
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
      const hay = [pack.title, pack.venue, pack.yearLabel, ...pack.tracks.map(t=>t.artist), ...pack.tracks.map(t=>t.title)].join(' ').toLowerCase();
      return (year === 'all' || String(pack.year) === year) && (!q || hay.includes(q));
    });
    catalogue.innerHTML = filtered.map(packCard).join('');
    resultsMessage.textContent = `${filtered.length} event pack${filtered.length === 1 ? '' : 's'} shown`;
  }

  function loadPack(pack) {
    activePack = pack;
    activeTrackIndex = -1;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    playerTitle.textContent = pack.title;
    playerArt.src = pack.artwork || FALLBACK_ART;
    playerArt.alt = `${pack.title} artwork`;
    playerArt.onerror = () => { playerArt.onerror = null; playerArt.src = FALLBACK_ART; };
    sourceLink.href = pack.source;
    playingStatus.textContent = `${pack.tracks.length} VERIFIED RECORDING${pack.tracks.length === 1 ? '' : 'S'}`;
    playingTitle.textContent = 'Choose a DJ set';
    playingSubtitle.textContent = `${pack.yearLabel} · ${pack.venue}`;
    currentTime.textContent = '0:00';
    duration.textContent = '0:00';
    seek.value = 0;
    trackList.innerHTML = pack.tracks.map((track,index) => `<div class="track-row-wrap"><button type="button" class="track-row" data-track="${index}"><span class="track-number">${String(index+1).padStart(2,'0')}</span><span><strong>${esc(track.title)}</strong><small>${esc(pack.title)}</small></span><span class="track-play">▶</span></button><a class="track-source" href="${esc(track.url)}" target="_blank" rel="noopener" aria-label="Open ${esc(track.title)} directly">↗</a></div>`).join('');
    document.querySelector('#player').scrollIntoView({behavior:'smooth', block:'start'});
  }

  function loadTrack(index, autoplay=true) {
    if (!activePack || !activePack.tracks[index]) return;
    activeTrackIndex = index;
    const track = activePack.tracks[index];
    playingTitle.textContent = track.title;
    playingSubtitle.textContent = `${activePack.title} · ${activePack.yearLabel}`;
    playingStatus.textContent = 'LOADING RECORDING';
    audio.src = track.url;
    audio.load();
    trackList.querySelectorAll('.track-row').forEach((row,i) => row.classList.toggle('active', i===index));
    if (autoplay) {
      const result = audio.play();
      if (result && typeof result.catch === 'function') result.catch(() => {
        playingStatus.textContent = 'PRESS PLAY TO START';
      });
    }
  }

  catalogue.addEventListener('click', e => {
    const card = e.target.closest('[data-pack-id]');
    if (!card || !e.target.closest('.select-pack')) return;
    const pack = packs.find(p => p.id === card.dataset.packId);
    if (pack) loadPack(pack);
  });
  trackList.addEventListener('click', e => {
    const row = e.target.closest('.track-row');
    if (row) loadTrack(Number(row.dataset.track));
  });
  playButton.addEventListener('click', () => {
    if (!audio.src && activePack) loadTrack(0);
    else if (audio.paused) audio.play().catch(() => { playingStatus.textContent = 'AUDIO COULD NOT START'; });
    else audio.pause();
  });
  audio.addEventListener('loadstart', () => { if (activeTrackIndex >= 0) playingStatus.textContent = 'LOADING RECORDING'; });
  audio.addEventListener('canplay', () => { if (activeTrackIndex >= 0) playingStatus.textContent = 'READY TO PLAY'; });
  audio.addEventListener('play', () => { playButton.textContent='❚❚'; playingStatus.textContent = 'NOW PLAYING'; });
  audio.addEventListener('pause', () => playButton.textContent='▶');
  audio.addEventListener('error', () => {
    playButton.textContent = '▶';
    playingStatus.textContent = 'STREAM UNAVAILABLE — OPEN DIRECT LINK';
    const row = trackList.querySelector(`.track-row[data-track="${activeTrackIndex}"]`);
    if (row) row.classList.add('error');
  });
  audio.addEventListener('timeupdate', () => {
    seek.value = audio.duration ? (audio.currentTime/audio.duration)*100 : 0;
    currentTime.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata', () => duration.textContent = formatTime(audio.duration));
  audio.addEventListener('ended', () => {
    if(activePack && activeTrackIndex < activePack.tracks.length-1) loadTrack(activeTrackIndex+1);
  });
  seek.addEventListener('input', () => { if(audio.duration) audio.currentTime=(Number(seek.value)/100)*audio.duration; });
  volume.addEventListener('input', () => { audio.volume=Number(volume.value); audio.muted=false; muteButton.textContent='🔊'; });
  muteButton.addEventListener('click', () => { audio.muted=!audio.muted; muteButton.textContent=audio.muted?'🔇':'🔊'; });
  search.addEventListener('input', render);
  yearFilter.addEventListener('change', render);
  clearFilters.addEventListener('click',()=>{search.value='';yearFilter.value='all';render();});

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
    document.querySelector('#record-count').textContent = packs.length;
    document.querySelector('#track-count').textContent = packs.reduce((n,p)=>n+p.tracks.length,0);
    fillYears();
    render();
    if(packs[0]) loadPack(packs[0]);
  }
  init();
})();
