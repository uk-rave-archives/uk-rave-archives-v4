
const engine=window.BTOS_ARCHIVE_ENGINE;
const id=new URLSearchParams(location.search).get("id")||new URLSearchParams(location.search).get("event")||"";
const event=(window.BTOS_EVENT_NETWORK||[]).find(x=>x.id===id);
const root=document.querySelector("#event-root");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
if(!event){root.innerHTML='<section class="relationship-panel"><h1>Event not found</h1></section>'}
else{
 const promoter=event.promoterId?engine.get("promoters",event.promoterId):null;
 const venue=event.venueId?engine.get("venues",event.venueId):null;
 const djs=event.djIds.map(x=>engine.get("artists",x)).filter(Boolean);
 const mcs=event.mcIds.map(x=>engine.get("artists",x)).filter(Boolean);
 const flyers=event.flyerIds.map(x=>engine.get("flyers",x)).filter(Boolean);
 const videos=event.videoIds.map(x=>engine.get("videos",x)).filter(Boolean);
 const packs=event.tapePackIds.map(x=>engine.get("tapePacks",x)).filter(Boolean);
 document.title=`${event.name} | Event Archive`;
 root.innerHTML=`<section class="event-hero"><div class="event-hero-copy"><p class="kicker">${esc(event.eventType||"Event")}</p><h1>${esc(event.name)}</h1><p>${esc(event.date||event.year||"Date review")}</p></div></section>
 <section class="relationship-panel"><div class="breadcrumb"><a href="events.html">Timeline</a><span>→</span><b>${esc(event.name)}</b></div>
 <div class="fact-grid"><div><small>Promoter</small>${promoter?`<a href="promoters.html?promoter=${promoter.id}">${esc(promoter.name)}</a>`:"Review required"}</div><div><small>Venue</small>${venue?`<a href="venues.html?venue=${venue.id}">${esc(venue.name)}</a>`:"Review required"}</div><div><small>Year</small>${esc(event.year||"Review required")}</div><div><small>Type</small>${esc(event.eventType||"Event")}</div></div></section>
 <section class="relationship-panel"><h2>DJs</h2><div class="record-links">${djs.length?djs.map(a=>`<a href="artist.html?id=${a.id}">${esc(a.name)}</a>`).join(""):"No linked DJs yet."}</div><h2>MCs</h2><div class="record-links">${mcs.length?mcs.map(a=>`<a href="artist.html?id=${a.id}">${esc(a.name)}</a>`).join(""):"No linked MCs yet."}</div></section>
 <section class="relationship-panel"><h2>Flyers</h2><div class="media-grid">${flyers.length?flyers.map(f=>`<a class="media-card" href="flyer-record.html?id=${f.id}"><img src="${f.image}" alt="${esc(f.title)}"><b>${esc(f.title)}</b></a>`).join(""):"No linked flyers yet."}</div></section>
 <section class="relationship-panel"><h2>Tape packs and videos</h2><div class="record-links">${packs.map(p=>`<a href="packs.html?pack=${p.id}">${esc(p.name)}</a>`).join("")}${videos.map(v=>`<a href="${v.url}" target="_blank" rel="noopener">${esc(v.title)}</a>`).join("")||"No linked media yet."}</div></section>`;
}
