
const engine=window.BTOS_ARCHIVE_ENGINE,q=document.querySelector("#q"),type=document.querySelector("#type"),etype=document.querySelector("#event-type"),role=document.querySelector("#role"),results=document.querySelector("#results");
const labels={artists:"Artist",flyers:"Flyer",events:"Event",venues:"Venue",promoters:"Promoter",tapePacks:"Tape pack",videos:"Video",recordings:"Recording",radio:"Radio"};
Object.entries(engine.archive.collections).filter(([,rows])=>rows.length).forEach(([k])=>{const o=document.createElement("option");o.value=k;o.textContent=labels[k]||k;type.appendChild(o)});
[...new Set((window.BTOS_EVENT_NETWORK||[]).map(x=>x.eventType).filter(Boolean))].sort().forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;etype.appendChild(o)});
const href=(t,r)=>({artists:`artist.html?id=${r.id}`,flyers:`flyer-record.html?id=${r.id}`,events:`event.html?id=${r.id}`,venues:`venues.html?venue=${r.id}`,promoters:`promoters.html?promoter=${r.id}`,tapePacks:`packs.html?pack=${r.id}`,videos:r.url,recordings:r.sourceHref||"",radio:`radio.html?station=${r.id}`}[t]||"");
const title=r=>r.name||r.title||r.id;
const image=r=>r.image||r.thumbnail||r.cover||"";
function draw(){
 const term=q.value.trim(),wanted=type.value,eventType=etype.value,wantedRole=role.value;
 let rows=term?engine.search(term):[];
 rows=rows.filter(x=>wanted==="all"||x.type===wanted).filter(x=>wantedRole==="all"||x.type!=="artists"||x.record.role===wantedRole).filter(x=>{
   if(eventType==="all")return true;
   if(x.type==="events")return x.record.eventType===eventType;
   if(x.type==="flyers")return x.record.eventType===eventType;
   return false;
 }).slice(0,200);
 results.innerHTML=rows.map(x=>`<a class="search-card" href="${href(x.type,x.record)}"><span>${labels[x.type]||x.type}</span>${image(x.record)?`<img src="${image(x.record)}">`:""}<b>${title(x.record)}</b><small>${x.record.year||x.record.role||x.record.status||""}</small></a>`).join("");
}
[q,type,etype,role].forEach(el=>el.addEventListener(el===q?"input":"change",draw));
const recent=(window.BTOS_RECENT_ARCHIVE||[]).slice(0,24);
document.querySelector("#recent").innerHTML=recent.map(r=>`<a class="media-card" href="${r.href}">${r.image?`<img src="${r.image}">`:""}<b>${r.title}</b></a>`).join("");
document.querySelector("#random-record").onclick=()=>{
 const choices=[];
 for(const [t,rows] of Object.entries(engine.archive.collections))for(const r of rows){const h=href(t,r);if(h)choices.push(h)}
 if(choices.length)location.href=choices[Math.floor(Math.random()*choices.length)];
};
