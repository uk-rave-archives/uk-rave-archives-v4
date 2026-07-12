(() => {
  const DJs = [
    {name:'Bass Generator',slug:'bass-generator'}, {name:'Brisk',slug:'brisk'}, {name:'Carl Cox',slug:'carl-cox'},
    {name:'Clarkee',slug:'clarkee'}, {name:'DJ SS',slug:'dj-ss'}, {name:'Dougal',slug:'dougal'},
    {name:'Ellis Dee',slug:'ellis-dee'}, {name:'Fabio',slug:'fabio'}, {name:'Force & Styles',slug:'force-styles'},
    {name:'Hixxy',slug:'hixxy'}, {name:'Kenny Ken',slug:'kenny-ken'}, {name:'M-Zone',slug:'m-zone'},
    {name:'Mickey Finn',slug:'mickey-finn'}, {name:'Nicky Blackmarket',slug:'nicky-blackmarket'}, {name:'Randall',slug:'randall'},
    {name:'Ray Keith',slug:'ray-keith'}, {name:'Seduction',slug:'seduction'}, {name:'Slipmatt',slug:'slipmatt'},
    {name:'Sy',slug:'sy'}, {name:'Vibes',slug:'vibes'}
  ];
  const norm = s => String(s || '').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim();
  const counts = {};
  (window.TAPE_PACKS || []).forEach(pack => (pack.tracks || pack.seedTracks || []).forEach(track => {
    const key = norm(track.artist || track.dj || ''); if(key) counts[key] = (counts[key] || 0) + 1;
  }));
  const totalTapeLinks = Object.values(counts).reduce((a,b)=>a+b,0);
  const tapeStat = document.querySelector('#tapeLinks'); if(tapeStat) tapeStat.textContent = totalTapeLinks;
  const roster = document.querySelector('#djRoster');
  DJs.forEach(dj => {
    const c = counts[norm(dj.name)] || 0;
    const a = document.createElement('a');
    a.href = `person-record.html?name=${encodeURIComponent(dj.name)}`;
    a.className = 'roster-item';
    a.dataset.name = dj.name.toLowerCase();
    a.dataset.letter = dj.name.charAt(0).toUpperCase();
    a.dataset.status = 'research';
    a.dataset.tapes = c ? 'yes' : 'no';
    a.innerHTML = `<div><strong>${dj.name}</strong><span>${c ? `${c} mapped tape ${c===1?'set':'sets'}` : 'Profile research in progress'}</span></div><em>→</em>`;
    roster.appendChild(a);
  });
  const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const az = document.querySelector('#azNav');
  letters.forEach(letter => {
    const b = document.createElement('button'); b.type='button'; b.textContent=letter; b.dataset.letter=letter; if(letter==='ALL') b.classList.add('active'); az.appendChild(b);
  });
  let activeLetter = 'ALL';
  const search = document.querySelector('#djSearch'); const filter = document.querySelector('#statusFilter'); const resultCount = document.querySelector('#resultCount'); const empty = document.querySelector('#emptyState');
  function apply(){
    const q = search.value.trim().toLowerCase(); const f = filter.value; let shown=0;
    document.querySelectorAll('.roster-item').forEach(item => {
      const okSearch = !q || item.dataset.name.includes(q);
      const okLetter = activeLetter==='ALL' || item.dataset.letter===activeLetter;
      const okStatus = f==='all' || (f==='research' && item.dataset.status==='research') || (f==='tapes' && item.dataset.tapes==='yes');
      const show = okSearch && okLetter && okStatus; item.hidden=!show; if(show) shown++;
    });
    resultCount.textContent = `${shown} ${shown===1?'name':'names'}`; empty.hidden = shown!==0;
    document.querySelector('.complete-profiles').hidden = f==='research' || f==='tapes' || q || activeLetter!=='ALL';
  }
  az.addEventListener('click', e => { if(e.target.tagName!=='BUTTON') return; activeLetter=e.target.dataset.letter; az.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===e.target)); apply(); });
  search.addEventListener('input',apply); filter.addEventListener('change',apply); apply();
  const toggle=document.querySelector('.menu-toggle'), nav=document.querySelector('.main-nav');
  toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open)});
})();
