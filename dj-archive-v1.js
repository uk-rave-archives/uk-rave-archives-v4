(() => {
 const DJS = [
  ['Carl Cox','carl-cox'],['Hixxy','hixxy'],['Slipmatt','slipmatt'],['Dougal','dougal'],['Vibes','vibes'],['Sy','sy'],['Clarkee','clarkee'],['DJ SS','dj-ss'],['Seduction','seduction'],['Ray Keith','ray-keith'],['Ellis Dee','ellis-dee'],['Grooverider','grooverider'],['Fabio','fabio'],['Mickey Finn','mickey-finn'],['Randall','randall'],['Kenny Ken','kenny-ken'],['Nicky Blackmarket','nicky-blackmarket'],['M-Zone','m-zone'],['Bass Generator','bass-generator'],['Brisk','brisk'],['Force & Styles','force-styles']
 ];
 const norm=s=>String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim();
 const tapeCounts={};
 (window.TAPE_PACKS||[]).forEach(pack=>(pack.seedTracks||[]).forEach(track=>{const key=norm(track.artist);tapeCounts[key]=(tapeCounts[key]||0)+1;}));
 const photos=window.DJ_PHOTOS||{};
 const grid=document.querySelector('.dj-grid');
 DJS.forEach(([name,slug])=>{
  const photo=photos[slug]; const initials=name.split(/\s|&/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const count=tapeCounts[norm(name)]||0;
  const card=document.createElement('a');card.className='dj-card';card.href=`person-record.html?name=${encodeURIComponent(name)}`;card.dataset.name=name.toLowerCase();card.dataset.tapes=count?'tapes':'none';
  card.innerHTML=`<div class="dj-photo">${photo?`<img src="${photo.src}" alt="${name}"><span class="real-photo-badge">REAL ARCHIVE PHOTO</span>`:`<div class="dj-photo-placeholder"><strong>${initials}</strong><span>Photo awaiting permission</span></div>`}</div><div class="dj-card-body"><h3>${name}</h3><div class="dj-meta"><span class="dj-tag">DJ profile</span><span class="dj-tag tapes">${count} mapped tape ${count===1?'set':'sets'}</span></div><p>Flyers, events, venues and recorded sets connected through the archive.</p><div class="dj-open"><span>ENTER PROFILE</span><span>→</span></div></div>`;
  grid.appendChild(card);
 });
 const search=document.querySelector('#djSearch'), filter=document.querySelector('#djFilter'), count=document.querySelector('#djCount'), empty=document.querySelector('.empty');
 function apply(){const q=search.value.trim().toLowerCase(), f=filter.value;let shown=0;document.querySelectorAll('.dj-card').forEach(c=>{const ok=(!q||c.dataset.name.includes(q))&&(f==='all'||c.dataset.tapes===f);c.hidden=!ok;if(ok)shown++;});count.textContent=`${shown} DJs`;empty.style.display=shown?'none':'block';}
 search.addEventListener('input',apply);filter.addEventListener('change',apply);apply();
})();
