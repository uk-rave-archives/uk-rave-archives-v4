
const events=window.BTOS_EVENTS||[];
const artists=window.BTOS_ARTISTS||[];
const videos=window.BTOS_YOUTUBE||[];
const params=new URLSearchParams(location.search);
const eventId=params.get("id")||"helter-skelter-milwaukees-1991";
const event=events.find(item=>item.id===eventId);
const root=document.querySelector("#event-root");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

document.querySelector(".menu-button")?.addEventListener("click",()=>{const nav=document.querySelector(".museum-nav");const open=nav.classList.toggle("open");document.querySelector(".menu-button").setAttribute("aria-expanded",String(open));});

if(!event){root.innerHTML='<section class="missing"><h1>Event not found</h1><a href="events.html">Return to the timeline</a></section>';}
else{
 document.title=`${event.name} | Back to the Old Skool Archive`;
 const eventVideos=(event.videos||[]).map(id=>videos.find(v=>v.id===id)).filter(Boolean);
 const facts=[
   `<span><b>Date</b>${esc(event.date)}</span>`,
   `<span><b>Type</b>${esc(event.type)}</span>`,
   event.promoter?`<a href="${event.promoter.href}"><b>Promoter</b>${esc(event.promoter.name)}</a>`:"",
   event.venue?`<a href="${event.venue.href}"><b>Venue / station</b>${esc(event.venue.name)}</a>`:""
 ].filter(Boolean).join("");
 const lineup=(event.artists||[]).map(a=>`<a class="artist-card" href="artist.html?id=${a.id}"><span>${esc(a.role)}</span><b>${esc(a.name)}</b></a>`).join("");
 const videoCards=eventVideos.map(v=>`<article class="video-card"><img src="${v.thumbnail}" onerror="this.src='https://i.ytimg.com/vi/${v.id}/hqdefault.jpg'" alt="${esc(v.title)}"><div class="video-body"><span>${esc(v.displayType||v.type)}</span><strong>${esc(v.title)}</strong><a href="${v.url}" target="_blank" rel="noopener">Open on YouTube →</a></div></article>`).join("");
 const archiveLinks=[...(event.tapePacks||[]).map(x=>({...x,type:"Tape pack"})),...(event.flyers||[]).map(x=>({...x,type:"Flyer"}))].map(x=>`<a class="archive-link" href="${x.href}"><span>${x.type}</span><b>${esc(x.name||x.title)}</b></a>`).join("");
 root.innerHTML=`
 <section class="event-hero"><div class="event-copy"><p class="kicker">Event archive exhibit</p><h1>${esc(event.name)}</h1><p class="event-summary">${esc(event.summary)}</p><div class="event-facts">${facts}</div></div></section>
 <div class="event-main">
  ${lineup?`<section class="panel"><h2>DJ & MC lineup</h2><div class="lineup">${lineup}</div></section>`:""}
  <section class="panel" id="audio"><h2>Cassette listening station</h2><p class="panel-intro">Confirmed playable recordings from this event appear here. Video-only sets remain in the separate video exhibit.</p>${event.audio?.length?cassetteMarkup(event.audio):'<div class="empty-audio">No confirmed direct audio recording has been linked to this event yet.</div>'}</section>
  ${videoCards?`<section class="panel"><h2>Video sets</h2><div class="video-grid">${videoCards}</div></section>`:""}
  ${archiveLinks?`<section class="panel"><h2>Connected archive</h2><div class="link-grid">${archiveLinks}</div></section>`:""}
  <section class="panel"><h2>Sources</h2><ul class="sources">${(event.sources||[]).map(s=>`<li><a href="${s.href}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("")}</ul></section>
 </div>`;
 if(event.audio?.length) setupCassette(event.audio);
}

function cassetteMarkup(tracks){
 const first=tracks[0];
 return `<div class="cassette-shell" id="cassette-shell"><audio id="cassette-audio" preload="metadata"></audio><div class="cassette-top"><div class="cassette-label"><small>Back to the Old Skool Archive</small><strong id="tape-title">${esc(first.title)}</strong><span id="tape-meta">${esc(first.artist)} · ${esc(first.year)} · ${esc(first.source)}</span></div><div class="side-badge" id="side-badge">${esc(first.side)}</div></div><div class="cassette-window"><div class="tape-strip"></div><div class="reel left"></div><div class="reel right"></div></div><div class="cassette-controls"><button class="deck-button" id="prev-track" type="button">◀</button><button class="deck-button" id="play-pause" type="button">▶</button><div class="progress-wrap"><span id="elapsed">00:00</span><input id="progress" class="progress" type="range" min="0" max="1000" value="0"><span id="duration">00:00</span></div><input id="volume" class="volume" type="range" min="0" max="1" step="0.01" value="0.85" aria-label="Volume"></div></div><div class="playlist">${tracks.map((t,i)=>`<button type="button" data-index="${i}"><span class="side">${esc(t.side)}</span><b>${esc(t.title)}</b><small>${esc(t.source)}</small></button>`).join("")}</div>`;
}
function setupCassette(tracks){
 const audio=document.querySelector('#cassette-audio'),shell=document.querySelector('#cassette-shell'),play=document.querySelector('#play-pause'),prev=document.querySelector('#prev-track'),progress=document.querySelector('#progress'),volume=document.querySelector('#volume'),elapsed=document.querySelector('#elapsed'),duration=document.querySelector('#duration');let index=0;
 const fmt=s=>{if(!Number.isFinite(s))return'00:00';const m=Math.floor(s/60),sec=Math.floor(s%60);return`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`};
 function load(i,autoplay=false){index=(i+tracks.length)%tracks.length;const t=tracks[index];audio.src=t.src;document.querySelector('#tape-title').textContent=t.title;document.querySelector('#tape-meta').textContent=`${t.artist} · ${t.year} · ${t.source}`;document.querySelector('#side-badge').textContent=t.side;document.querySelectorAll('.playlist button').forEach((b,n)=>b.classList.toggle('active',n===index));progress.value=0;elapsed.textContent='00:00';duration.textContent='00:00';if(autoplay)audio.play().catch(()=>{});}
 play.addEventListener('click',()=>audio.paused?audio.play().catch(()=>{}):audio.pause());prev.addEventListener('click',()=>load(index-1,true));document.querySelectorAll('.playlist button').forEach(b=>b.addEventListener('click',()=>load(Number(b.dataset.index),true)));audio.addEventListener('play',()=>{shell.classList.add('playing');play.textContent='❚❚'});audio.addEventListener('pause',()=>{shell.classList.remove('playing');play.textContent='▶'});audio.addEventListener('ended',()=>load(index+1,true));audio.addEventListener('loadedmetadata',()=>duration.textContent=fmt(audio.duration));audio.addEventListener('timeupdate',()=>{elapsed.textContent=fmt(audio.currentTime);progress.value=audio.duration?Math.round(audio.currentTime/audio.duration*1000):0});progress.addEventListener('input',()=>{if(audio.duration)audio.currentTime=Number(progress.value)/1000*audio.duration});volume.addEventListener('input',()=>audio.volume=Number(volume.value));audio.volume=Number(volume.value);load(0,false);
}
