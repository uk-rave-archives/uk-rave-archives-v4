
const packs=window.BTOS_TAPE_PACKS||[];
const artists=window.BTOS_ARTISTS||[];
const byArtist=id=>artists.find(a=>a.id===id);
const grid=document.querySelector("#pack-grid");
const search=document.querySelector("#pack-search");
const yearFilter=document.querySelector("#year-filter");
const formatFilter=document.querySelector("#format-filter");
const empty=document.querySelector("#empty");
const audio=document.querySelector("#audio");
const cassette=document.querySelector("#cassette");
let selectedPack=null,selectedTrack=0;

document.querySelector(".menu-button")?.addEventListener("click",()=>{
 const nav=document.querySelector(".museum-nav"),open=nav.classList.toggle("open");
 document.querySelector(".menu-button").setAttribute("aria-expanded",String(open));
});

[...new Set(packs.map(p=>p.year).filter(Boolean))].sort().forEach(year=>{
 const o=document.createElement("option");o.value=String(year);o.textContent=year;yearFilter.appendChild(o);
});

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function imageMarkup(pack){
 if(!pack.cover)return `<div class="empty-note">Cover scan pending</div>`;
 const fallbacks=esc(JSON.stringify(pack.coverFallbacks||[]));
 return `<img src="${pack.cover}" data-fallbacks='${fallbacks}' data-index="0" alt="${esc(pack.name)}">`;
}
function bindFallbacks(node=document){
 node.querySelectorAll("img[data-fallbacks]").forEach(img=>img.addEventListener("error",()=>{
   let list=[];try{list=JSON.parse(img.dataset.fallbacks||"[]")}catch(e){}
   const i=Number(img.dataset.index||0);
   if(i<list.length){img.dataset.index=String(i+1);img.src=list[i];}
 }));
}
function render(){
 const q=search.value.trim().toLowerCase(),year=yearFilter.value,format=formatFilter.value;
 const filtered=packs.filter(pack=>{
   const text=[pack.name,pack.series,pack.year,pack.promoter?.name,pack.event?.name,pack.venue?.name,...pack.artists.map(a=>a.name)].join(" ").toLowerCase();
   return (!q||text.includes(q))&&(year==="all"||String(pack.year)===year)&&(format==="all"||pack.status===format);
 });
 grid.innerHTML=filtered.map(pack=>`
  <article class="pack-card ${selectedPack?.id===pack.id?"selected":""}" data-pack-id="${pack.id}">
   <div class="pack-cover">${imageMarkup(pack)}<span class="format-badge">${esc(pack.status==="playable"?"Cassette audio":pack.status==="video-linked"?"Video transfer":"Archive record")}</span></div>
   <div class="pack-body"><h3>${esc(pack.name)}</h3><p>${esc(pack.year||"Year pending")} · ${esc(pack.type)}</p>
   ${pack.promoter?.name?`<p>${esc(pack.promoter.name)}</p>`:""}
   ${pack.artists.length?`<p class="artists">${esc(pack.artists.map(a=>a.name).join(" · "))}</p>`:""}</div>
  </article>`).join("");
 empty.hidden=filtered.length!==0;
 grid.querySelectorAll("[data-pack-id]").forEach(card=>card.addEventListener("click",()=>selectPack(card.dataset.packId)));
 bindFallbacks(grid);
}
function selectPack(id){
 selectedPack=packs.find(p=>p.id===id);selectedTrack=0;if(!selectedPack)return;
 document.querySelector("#deck-pack-name").textContent=selectedPack.name;
 document.querySelector("#video-pack-name").textContent=selectedPack.name;
 document.querySelector("#tape-series").textContent=selectedPack.series||"Archive Tape";
 document.querySelector("#tape-title").textContent=selectedPack.name;
 document.querySelector("#tape-year").textContent=selectedPack.year||"Year pending";
 document.querySelector("#cover-credit").textContent=selectedPack.coverCredit||"Verified cover scan pending.";
 const source=selectedPack.sources?.[0];
 const sourceLink=document.querySelector("#deck-source");
 sourceLink.hidden=!source;if(source){sourceLink.href=source.href;sourceLink.textContent=`Open ${source.name} ↗`;}
 renderAudioList();renderVideos();render();document.querySelector("#listening-room").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderAudioList(){
 const list=document.querySelector("#audio-list"),tracks=selectedPack?.audio||[];
 if(!tracks.length){audio.pause();audio.removeAttribute("src");document.querySelector("#track-title").textContent="No confirmed cassette audio";document.querySelector("#track-meta").textContent="Video transfers are shown in the section below.";list.innerHTML="<p>No playable audio has been verified for this pack yet.</p>";return;}
 list.innerHTML=tracks.map((t,i)=>`<div class="audio-row"><button data-track="${i}">▶</button><div><strong>${esc(t.title)}</strong><small>${esc(t.side)} · ${esc(t.source)}</small></div><a href="${t.sourceHref}" target="_blank" rel="noopener">Source ↗</a></div>`).join("");
 list.querySelectorAll("[data-track]").forEach(b=>b.addEventListener("click",()=>loadTrack(Number(b.dataset.track),true)));
 loadTrack(0,false);
}
function loadTrack(index,autoplay){
 const tracks=selectedPack.audio||[];if(!tracks.length)return;selectedTrack=(index+tracks.length)%tracks.length;const t=tracks[selectedTrack];
 audio.src=t.src;document.querySelector("#track-title").textContent=t.title;document.querySelector("#track-meta").textContent=`${t.side} · ${selectedPack.name} · ${t.year}`;
 document.querySelector("#status").textContent="Ready";if(autoplay)audio.play().catch(()=>{});
}
function renderVideos(){
 const target=document.querySelector("#video-grid"),items=selectedPack?.videos||[];
 if(!items.length){target.innerHTML='<p class="empty-note">No verified video transfers are linked to this pack.</p>';return;}
 target.innerHTML=items.map(v=>`<article class="video-card"><a class="video-thumb" href="${v.url}" target="_blank" rel="noopener"><img src="${v.thumbnail}" data-fallbacks='${esc(JSON.stringify(v.thumbnailFallbacks||[]))}' data-index="0" alt="${esc(v.title)}"><span>▶</span></a><div class="video-body"><h3>${esc(v.title)}</h3><p>${esc(v.type||"Video transfer")} · ${esc(v.year||"")}</p><p>Source: ${esc(v.sourceCredit)}</p><a href="${v.url}" target="_blank" rel="noopener">Play on YouTube →</a></div></article>`).join("");
 bindFallbacks(target);
}
document.querySelector("#play").addEventListener("click",()=>audio.paused?audio.play():audio.pause());
document.querySelector("#previous").addEventListener("click",()=>loadTrack(selectedTrack-1,true));
document.querySelector("#next").addEventListener("click",()=>loadTrack(selectedTrack+1,true));
document.querySelector("#volume").addEventListener("input",e=>audio.volume=Number(e.target.value));
document.querySelector("#seek").addEventListener("input",e=>{if(audio.duration)audio.currentTime=audio.duration*Number(e.target.value)/100});
audio.addEventListener("play",()=>{cassette.classList.add("playing");document.querySelector("#play").textContent="❚❚";document.querySelector("#status").textContent="Playing"});
audio.addEventListener("pause",()=>{cassette.classList.remove("playing");document.querySelector("#play").textContent="▶";document.querySelector("#status").textContent="Paused"});
audio.addEventListener("ended",()=>loadTrack(selectedTrack+1,true));
function time(s){if(!Number.isFinite(s))return"0:00";const m=Math.floor(s/60);return`${m}:${String(Math.floor(s%60)).padStart(2,"0")}`}
audio.addEventListener("timeupdate",()=>{document.querySelector("#elapsed").textContent=time(audio.currentTime);document.querySelector("#duration").textContent=time(audio.duration);document.querySelector("#seek").value=audio.duration?audio.currentTime/audio.duration*100:0});
search.addEventListener("input",render);yearFilter.addEventListener("change",render);formatFilter.addEventListener("change",render);
render();
const params=new URLSearchParams(location.search);const requested=params.get("pack");if(requested&&packs.some(p=>p.id===requested))selectPack(requested);
