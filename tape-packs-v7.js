(() => {
  const packs = Array.isArray(window.BTOS_TAPE_PACKS) ? window.BTOS_TAPE_PACKS : [];
  const years = window.BTOS_TAPE_YEARS || [];
  const $ = selector => document.querySelector(selector);
  const yearStrip = $('#year-strip');
  const packGrid = $('#pack-grid');
  const search = $('#tape-search');
  const empty = $('#empty-state');
  const audio = $('#audio');
  let selectedYear = packs[0]?.year || 1988;
  let activePack = null;
  let activeTrack = -1;

  $('#pack-total').textContent = packs.length;
  $('#track-total').textContent = packs.reduce((sum, pack) => sum + pack.tracks.length, 0);

  const format = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,'0')}` : '0:00';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const countForYear = year => packs.filter(pack => pack.year === year).length;

  function renderYears() {
    yearStrip.innerHTML = years.map(year => {
      const count = countForYear(year);
      return `<button class="year-button ${year === selectedYear ? 'active' : ''}" data-year="${year}" ${count ? '' : 'disabled'}><strong>${year}</strong><span>${count ? `${count} pack${count===1?'':'s'}` : 'researching'}</span></button>`;
    }).join('');
  }

  function filteredPacks() {
    const q = search.value.trim().toLowerCase();
    if (q) return packs.filter(pack => [pack.title,pack.promoter,pack.venue,pack.location,...pack.genres,...pack.tracks.map(t=>t.artist)].join(' ').toLowerCase().includes(q));
    return packs.filter(pack => pack.year === selectedYear);
  }

  function renderPacks() {
    const matches = filteredPacks();
    $('#gallery-title').textContent = search.value.trim() ? 'Search results' : `${selectedYear} tape packs`;
    $('#gallery-note').textContent = matches.length ? `${matches.length} verified event ${matches.length===1?'pack':'packs'} in this gallery.` : 'No verified material has been added to this view yet.';
    empty.hidden = matches.length > 0;
    packGrid.innerHTML = matches.map(pack => `<article class="pack-card ${activePack?.id===pack.id?'active':''}" data-pack="${esc(pack.id)}" tabindex="0">
      <div class="mini-cassette"><strong>${esc(pack.shortTitle)}<br>${pack.year}</strong></div>
      <div class="pack-copy"><small>${esc(pack.promoter)} · ${pack.tracks.length} RECORDINGS</small><h3>${esc(pack.title)}</h3><p>${esc(pack.venue)}${pack.location ? `, ${esc(pack.location)}` : ''}. ${esc(pack.summary)}</p><div class="pack-tags">${pack.genres.map(g=>`<span>${esc(g)}</span>`).join('')}</div></div>
    </article>`).join('');
  }

  function selectPack(pack, scroll = true) {
    activePack = pack; activeTrack = -1; audio.pause(); audio.removeAttribute('src'); audio.load();
    $('#player-pack-title').textContent = pack.title;
    $('#pack-source').href = pack.source;
    $('#cassette-promoter').textContent = pack.promoter.toUpperCase();
    $('#cassette-title').textContent = pack.shortTitle.toUpperCase();
    $('#cassette-year').textContent = `${pack.year} · ${pack.venue}`;
    $('#cover-status').textContent = pack.coverStatus;
    $('#player-status').textContent = 'PACK LOADED';
    $('#track-title').textContent = 'Choose a recording';
    $('#track-meta').textContent = `${pack.tracks.length} correctly matched recordings from this event folder.`;
    $('#recordings').innerHTML = pack.tracks.map((track,index)=>`<div class="recording" data-track="${index}" tabindex="0"><span class="side">${esc(track.side)}</span><span><strong>${esc(track.title)}</strong><small>${esc(pack.title)} · ${track.year}</small></span><a href="${esc(track.source)}" target="_blank" rel="noopener" title="Open this recording at Archive.org">SOURCE ↗</a></div>`).join('');
    renderPacks();
    if (scroll) $('#listening-room').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function loadTrack(index, autoplay = true) {
    if (!activePack || !activePack.tracks[index]) return;
    activeTrack = index;
    const track = activePack.tracks[index];
    audio.src = track.url;
    $('#track-title').textContent = track.title;
    $('#track-meta').innerHTML = `<a href="person-record.html?name=${encodeURIComponent(track.artist)}">${esc(track.artist)} DJ profile</a> · ${esc(activePack.title)} · ${track.year}`;
    $('#player-status').textContent = 'LOADING RECORDING';
    document.querySelectorAll('.recording').forEach((row,i)=>row.classList.toggle('active',i===index));
    if (autoplay) audio.play().catch(()=>{$('#player-status').textContent='PRESS PLAY TO START';});
  }

  yearStrip.addEventListener('click', event => { const button=event.target.closest('[data-year]'); if(!button)return; selectedYear=Number(button.dataset.year); search.value=''; renderYears(); renderPacks(); });
  search.addEventListener('input', renderPacks);
  packGrid.addEventListener('click', event => { const card=event.target.closest('[data-pack]'); if(card) selectPack(packs.find(pack=>pack.id===card.dataset.pack)); });
  packGrid.addEventListener('keydown', event => { if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-pack]')){event.preventDefault();selectPack(packs.find(pack=>pack.id===event.target.dataset.pack));} });
  $('#recordings').addEventListener('click', event => { if(event.target.closest('a'))return; const row=event.target.closest('[data-track]'); if(row)loadTrack(Number(row.dataset.track)); });
  $('#recordings').addEventListener('keydown', event => { if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-track]')){event.preventDefault();loadTrack(Number(event.target.dataset.track));} });
  $('#play-pause').addEventListener('click',()=>{if(!activePack)return;if(activeTrack<0){loadTrack(0);return;}audio.paused?audio.play():audio.pause();});
  $('#previous-track').addEventListener('click',()=>{if(activePack)loadTrack(Math.max(0,activeTrack-1));});
  $('#next-track').addEventListener('click',()=>{if(activePack)loadTrack(Math.min(activePack.tracks.length-1,activeTrack+1));});
  $('#seek').addEventListener('input',event=>{if(audio.duration)audio.currentTime=(Number(event.target.value)/100)*audio.duration;});
  $('#mute').addEventListener('click',()=>{audio.muted=!audio.muted;$('#mute').textContent=audio.muted?'MUTED':'VOL';});
  audio.addEventListener('play',()=>{$('#play-pause').textContent='❚❚';$('#player-status').textContent='NOW PLAYING';});
  audio.addEventListener('pause',()=>{$('#play-pause').textContent='▶';});
  audio.addEventListener('canplay',()=>{$('#player-status').textContent='READY TO PLAY';});
  audio.addEventListener('error',()=>{$('#player-status').textContent='STREAM ERROR — USE SOURCE LINK';});
  audio.addEventListener('timeupdate',()=>{$('#seek').value=audio.duration?(audio.currentTime/audio.duration)*100:0;$('#elapsed').textContent=format(audio.currentTime);$('#remaining').textContent=format(audio.duration);});
  audio.addEventListener('loadedmetadata',()=>{$('#remaining').textContent=format(audio.duration);});
  audio.addEventListener('ended',()=>{if(activePack&&activeTrack<activePack.tracks.length-1)loadTrack(activeTrack+1);});

  renderYears(); renderPacks(); if(packs.length) selectPack(packs[0],false);
})();
