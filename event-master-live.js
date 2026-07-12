
const params=new URLSearchParams(location.search);
const id=params.get("id")||params.get("event")||"";
const event=(window.BTOS_EVENTS||[]).find(e=>e.id===id);
const root=document.querySelector("#event-root");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.querySelector(".menu-button")?.addEventListener("click",()=>document.querySelector(".museum-nav")?.classList.toggle("open"));
if(!event){
 root.innerHTML='<section class="not-public"><h1>Event not found</h1><a href="events.html">Return to timeline</a></section>';
}else{
 document.title=`${event.name} | Back to the Old Skool Archive`;
 const promoter=event.promoter?`<a href="promoters.html?promoter=${event.promoter.id}">${esc(event.promoter.name)}</a>`:"Not confirmed";
 const venue=event.venue?`<a href="venues.html?venue=${event.venue.id}">${esc(event.venue.name)}</a>`:"Not confirmed";
 const radio=event.radio?`<a href="radio.html?station=${event.radio.id}">${esc(event.radio.name)}</a>`:"";
 root.innerHTML=`
 <section class="event-hero">
   <div class="event-hero-copy"><p class="kicker">Event archive</p><h1>${esc(event.name)}</h1><p>${esc(event.date||event.year||"")}</p></div>
 </section>
 <section class="event-panel">
   <div class="event-facts"><div><small>Promoter</small><b>${promoter}</b></div><div><small>Venue</small><b>${venue}</b></div>${radio?`<div><small>Radio</small><b>${radio}</b></div>`:""}</div>
 </section>
 <section class="event-panel"><h2>Artists</h2><div class="artist-links">${event.artists.length?event.artists.map(a=>`<a href="artist.html?id=${a.id}">${esc(a.name)}</a>`).join(""):"No linked artists yet."}</div></section>
 <section class="event-panel"><h2>Tape packs</h2><div class="artist-links">${event.tapePacks.length?event.tapePacks.map(p=>`<a href="packs.html?pack=${p.id}">${esc(p.name)}</a>`).join(""):"No linked tape packs yet."}</div></section>
 <section class="event-panel"><h2>Videos</h2><div class="video-grid">${event.videos.length?event.videos.map(v=>`<article class="video-card"><a href="${v.url}" target="_blank" rel="noopener"><img src="${v.thumbnail}" alt="${esc(v.title)}"></a><div><h3>${esc(v.title)}</h3><a href="${v.url}" target="_blank" rel="noopener">Open on YouTube →</a></div></article>`).join(""):"No linked videos yet."}</div></section>
 <section class="event-panel"><h2>Playable recordings</h2><div class="audio-list">${event.audio.length?event.audio.map(r=>`<audio controls preload="none" src="${r.audioUrl}"></audio><p>${esc(r.title)}</p>`).join(""):"No confirmed audio yet."}</div></section>`;
}
