
const artists = window.BTOS_ARTISTS || [];
const youtubeVideos = window.BTOS_YOUTUBE || [];
const archiveRelations = window.BTOS_ARCHIVE_RELATIONS || {};
const relationCollections = {
  eventId: archiveRelations.events || [],
  tapePackId: archiveRelations.tapePacks || [],
  promoterId: archiveRelations.promoters || [],
  venueId: archiveRelations.venues || [],
  radioId: archiveRelations.radio || []
};
const relationRecord = (field, id) =>
  id ? (relationCollections[field] || []).find(item => item.id === id) : null;
const videoRelationLinks = video => {
  const rel = video.relationships || {};
  return ["eventId","tapePackId","promoterId","venueId","radioId"]
    .map(field => ({field, item: relationRecord(field, rel[field])}))
    .filter(entry => entry.item);
};
const params = new URLSearchParams(location.search);
const artistId = params.get("id") || "";
const artist = artists.find(item => item.id === artistId);
const root = document.querySelector("#artist-profile");

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));

document.querySelector(".menu-button")?.addEventListener("click", () => {
  const nav = document.querySelector(".museum-nav");
  const open = nav.classList.toggle("open");
  document.querySelector(".menu-button").setAttribute("aria-expanded", String(open));
});

const publishable = item =>
  item && item.public === true && item.name && item.role && item.image &&
  item.photoCredit && item.summary && Array.isArray(item.biography) &&
  item.biography.length > 0;

const environmentFor = item => {
  if (item.environment) return item.environment;
  if (item.role === "MC") return "artist-env-mc-stage.jpg";
  if (item.activeFrom && item.activeFrom <= 1990) return "artist-env-early-warehouse.jpg";
  if (item.activeFrom && item.activeFrom >= 1997) return "artist-env-superclub-hangar.jpg";
  return "artist-env-jungle-warehouse.jpg";
};

const cardGrid = (items, type) => {
  if (!items?.length) return "";
  return `<div class="exhibit-grid">${items.map(item => `
    <a class="exhibit-card" href="${item.href}">
      ${item.image ? `<img src="${item.image}" alt="${esc(item.title)}">` : ""}
      <span class="exhibit-card-body">
        <span class="exhibit-type">${esc(type)}</span>
        <strong>${esc(item.title)}</strong>
        <em>Open record →</em>
      </span>
    </a>`).join("")}</div>`;
};

const photoGrid = photos => {
  if (!photos?.length) return "";
  return `<div class="photo-grid">${photos.map(photo => `
    <figure class="photo-tile">
      <button class="photo-button" type="button" data-full="${photo.src}">
        <img src="${photo.src}" alt="${esc(photo.caption || artist.name)}">
      </button>
      <figcaption>
        <strong>${esc(photo.caption || "Archive photograph")}</strong>
        <small>Photo: ${esc(photo.credit || "Credit recorded in archive")}</small>
      </figcaption>
    </figure>`).join("")}</div>`;
};

const simpleLinks = (items, type) => {
  if (!items?.length) return "";
  return `<div class="connection-group"><h3>${esc(type)}</h3>${items.map(item => `<a href="${item.href}">${esc(item.title)} →</a>`).join("")}</div>`;
};


const videoTypeLabel = type => ({
  "dj-set":"Live DJ set","dj-mix":"DJ mix / compilation","radio-set":"Radio set","track-appearance":"Track appearance"
}[type] || "YouTube archive");

const thumbnailMarkup = video => {
  const fallbacks = JSON.stringify(video.thumbnailFallbacks || []);
  return `<img src="${video.thumbnail}" data-fallbacks='${esc(fallbacks)}' data-fallback-index="0" alt="${esc(video.title)}" loading="lazy">`;
};

const installThumbnailFallbacks = rootNode => {
  rootNode.querySelectorAll("img[data-fallbacks]").forEach(image => {
    image.addEventListener("error", () => {
      let fallbacks = [];
      try { fallbacks = JSON.parse(image.dataset.fallbacks || "[]"); } catch (_) {}
      const index = Number(image.dataset.fallbackIndex || 0);
      if (index < fallbacks.length) {
        image.dataset.fallbackIndex = String(index + 1);
        image.src = fallbacks[index];
      } else {
        image.closest(".video-play")?.classList.add("thumbnail-unavailable");
      }
    });
  });
};

const videosForArtist = item => youtubeVideos.filter(video =>
  (video.artists || []).includes(item.id) || (video.trackAppearances || []).includes(item.id)
);

const videoGrid = videos => {
  if (!videos?.length) return "";
  return `<div class="video-grid">${videos.map(video => {
    const isTrackAppearance = !(video.artists || []).includes(artist.id) && (video.trackAppearances || []).includes(artist.id);
    const type = isTrackAppearance ? "track-appearance" : video.type;
    const directCredits = (video.artists || [])
      .map(id => artists.find(item => item.id === id)?.name)
      .filter(Boolean);
    return `<article class="video-card">
      <button class="video-play" type="button" data-video-id="${video.id}" aria-label="Play ${esc(video.title)}">
        ${thumbnailMarkup(video)}
        <span class="play-mark">▶</span>
        <span class="video-year-badge">${esc(video.year || "")}</span>
      </button>
      <div class="video-card-body">
        <span class="exhibit-type">${esc(videoTypeLabel(type))}</span>
        <strong>${esc(video.title)}</strong>
        ${directCredits.length ? `<p><b>DJ credit:</b> ${esc(directCredits.join(" & "))}</p>` : ""}
        ${video.event ? `<p><b>Event / release:</b> ${esc(video.event)}</p>` : ""}
        ${video.date ? `<p><b>Date:</b> ${esc(video.date)}</p>` : ""}
        ${isTrackAppearance ? `<p class="relationship-note">${esc(artist.name)} is linked as a track appearance, not as the performing DJ.</p>` : ""}
        <small>Source: ${esc(video.sourceCredit || video.channel)}</small>
        ${videoRelationLinks(video).length ? `
          <div class="archive-relationship-links">
            ${videoRelationLinks(video).map(link => `
              <a href="${link.item.href}">
                <span>${esc({
                  eventId:"Event",
                  tapePackId:"Tape pack",
                  promoterId:"Promoter",
                  venueId:"Venue",
                  radioId:"Radio"
                }[link.field])}</span>
                <b>${esc(link.item.name)}</b>
              </a>`).join("")}
          </div>` : ""}
        <div class="video-actions">
          <button type="button" class="video-play-link youtube-play" data-video-id="${video.id}">Play here</button>
          <a href="${video.url}" target="_blank" rel="noopener">Open on YouTube →</a>
        </div>
      </div>
    </article>`;
  }).join("")}</div>`;
};

if (!publishable(artist)) {
  root.innerHTML = `<section class="not-public">
    <h1>Profile not published</h1>
    <p>This artist profile has not passed the archive’s publication checks.</p>
    <a href="djs.html">Return to the DJ &amp; MC Archive</a>
  </section>`;
} else {
  document.title = `${artist.name} — ${artist.role} Profile | Back to the Old Skool Archive`;
  document.documentElement.style.setProperty("--artist-environment", `url("${environmentFor(artist)}")`);

  const yearData = artist.yearData || {};
  const enabledYears = Object.keys(yearData).sort((a,b) => Number(a) - Number(b));
  const startYear = Math.max(1988, Number(artist.activeFrom || 1988));
  const endYear = Math.min(2005, Number(artist.archiveTo || 2005));
  const years = Array.from({length:endYear-startYear+1},(_,i)=>String(startYear+i));

  const fact = (label, value) => `<div class="fact"><small>${esc(label)}</small><b>${esc(value || "Not recorded")}</b></div>`;

  root.innerHTML = `
    <section class="profile-hero">
      <div class="profile-photo">
        <img src="${artist.image}" alt="${esc(artist.name)}">
        <span class="photo-credit">Photo: ${esc(artist.photoCredit)}</span>
      </div>
      <div class="profile-copy">
        <p class="kicker">${esc(artist.role)} archive exhibit</p>
        <h1>${esc(artist.name)}</h1>
        <p class="summary">${esc(artist.summary)}</p>
        <div class="facts">
          ${fact("Role",artist.role)}
          ${fact("Origin",artist.origin)}
          ${fact("Archive period",`${artist.activeFrom || "?"}–${artist.archiveTo || 2005}`)}
          ${fact("Styles",(artist.styles || []).join(", "))}
        </div>
      </div>
    </section>

    <nav class="profile-nav">
      <a href="#biography">Biography</a>
      <a href="#timeline">Timeline</a>
      <a href="#connections">Archive links</a>
      <a href="#sources">Sources</a>
    </nav>

    <div class="profile-main">
      <section class="panel biography-panel" id="biography">
        <div class="biography-copy">
          <h2>Biography</h2>
          ${artist.biography.map(p=>`<p>${esc(p)}</p>`).join("")}
        </div>
        <aside class="profile-summary-card">
          <strong>Archive profile</strong>
          <span>Only verified information and linked archive material are shown on this page.</span>
        </aside>
      </section>

      <section class="panel" id="timeline">
        <div class="timeline-intro">
          <div>
            <p class="timeline-label">Explore the career</p>
            <h2>Interactive timeline</h2>
          </div>
          <p>Select a highlighted year to open its photographs, history, tape sets, flyers, events, releases and sources.</p>
        </div>

        <div class="timeline-rail-wrap">
          <div class="timeline-rail" role="tablist" aria-label="${esc(artist.name)} career timeline">
            ${years.map(year => {
              const active = !!yearData[year];
              return `<button class="year-node ${active ? "is-active" : ""}" type="button" data-year="${year}" ${active ? "" : "disabled"} aria-selected="false"><span>${year}</span></button>`;
            }).join("")}
          </div>
        </div>

        <div class="year-stage" id="year-stage">
          ${enabledYears.length ? `<div class="year-placeholder">Select a highlighted year on the timeline.</div>` : `<div class="year-placeholder">No verified year-by-year material has been added yet.</div>`}
        </div>
      </section>

      <section class="panel" id="connections">
        <h2>Connected archive</h2>
        <div class="connections-panel">
          ${simpleLinks(artist.tapes || [],"Tape recordings")}
          ${simpleLinks(artist.flyers || [],"Flyers")}
          ${simpleLinks(artist.events || [],"Events")}
          ${videosForArtist(artist).length ? `<div class="connection-group"><h3>YouTube archive</h3><a href="#youtube-archive">View linked sets and mixes →</a></div>` : ""}
        </div>
        ${videosForArtist(artist).length ? `<section class="youtube-profile-section" id="youtube-archive"><h3>HappyHardcore95to99 Backup</h3><p>Sets and mixes linked from the video title, artist credit, event name and year. Comment track lists are not used in this phase.</p>${videoGrid(videosForArtist(artist))}</section>` : ""}
      </section>

      <section class="panel" id="sources">
        <h2>Sources and photo credits</h2>
        ${artist.sources?.length ? `<ul class="sources">${artist.sources.map(item=>`<li><a href="${item.href}" target="_blank" rel="noopener">${esc(item.title)}</a></li>`).join("")}</ul>` : `<p>No verified source list has been added yet.</p>`}
      </section>
    </div>

    <dialog class="video-lightbox" id="video-lightbox">
      <button class="lightbox-close video-close" type="button" aria-label="Close video">×</button>
      <div class="video-frame"></div>
    </dialog>

    <dialog class="photo-lightbox" id="photo-lightbox">
      <button class="lightbox-close" type="button" aria-label="Close photo">×</button>
      <img src="" alt="">
    </dialog>
  `;

  installThumbnailFallbacks(root);

  const stage = document.querySelector("#year-stage");
  const buttons = [...document.querySelectorAll(".year-node.is-active")];

  function renderYear(year, scroll=false){
    const data = yearData[year];
    if(!data) return;

    buttons.forEach(button=>{
      const selected = button.dataset.year === year;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-selected", String(selected));
    });

    const blocks = [];
    if(data.photos?.length) blocks.push(`<section class="year-section"><h4>Photographs</h4>${photoGrid(data.photos)}</section>`);
    if(data.details?.length) blocks.push(`<section class="year-section"><h4>More information</h4><div class="text-list">${data.details.map(text=>`<p>${esc(text)}</p>`).join("")}</div></section>`);
    if(data.tapes?.length) blocks.push(`<section class="year-section"><h4>Tape packs and recordings</h4>${cardGrid(data.tapes,"Tape set")}</section>`);
    if(data.flyers?.length) blocks.push(`<section class="year-section"><h4>Flyers</h4>${cardGrid(data.flyers,"Flyer")}</section>`);
    if(data.events?.length) blocks.push(`<section class="year-section"><h4>Events and venues</h4>${cardGrid(data.events,"Event")}</section>`);
    if(data.releases?.length) blocks.push(`<section class="year-section"><h4>Releases and projects</h4>${cardGrid(data.releases,"Release")}</section>`);
    const yearVideos = videosForArtist(artist).filter(video => Number(video.year) === Number(year));
    if(yearVideos.length) blocks.push(`<section class="year-section"><h4>Video and audio archive</h4>${videoGrid(yearVideos)}</section>`);
    if(data.links?.length) blocks.push(`<section class="year-section"><h4>Sources and further reading</h4>${cardGrid(data.links,"Source")}</section>`);

    stage.innerHTML = `
      <article class="year-exhibit">
        <header class="year-exhibit-header">
          <span class="year-big">${esc(year)}</span>
          <div><h3>${esc(data.title)}</h3><p>${esc(data.summary || "")}</p></div>
        </header>
        ${blocks.join("") || `<div class="year-placeholder">No additional verified material is linked to this year yet.</div>`}
      </article>
    `;

    bindLightbox();
    bindVideos();
    installThumbnailFallbacks(stage);
    history.replaceState(null,"",`#year-${year}`);
    if(scroll) stage.scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  buttons.forEach(button=>button.addEventListener("click",()=>renderYear(button.dataset.year,true)));

  const hash = location.hash.match(/^#year-(\d{4})$/);
  const initial = hash && yearData[hash[1]] ? hash[1] : enabledYears[0];
  if(initial) renderYear(initial);

  function bindLightbox(){
    const dialog = document.querySelector("#photo-lightbox");
    const image = dialog.querySelector("img");
    document.querySelectorAll(".photo-button").forEach(button=>{
      button.addEventListener("click",()=>{
        image.src = button.dataset.full;
        image.alt = button.querySelector("img")?.alt || artist.name;
        dialog.showModal();
      });
    });
  }

  function bindVideos(){
    const dialog=document.querySelector("#video-lightbox");
    const frame=dialog?.querySelector(".video-frame");
    document.querySelectorAll(".video-play").forEach(button=>{
      if(button.dataset.bound) return;
      button.dataset.bound="1";
      button.addEventListener("click",()=>{
        const id=button.dataset.videoId;
        frame.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1" title="YouTube archive video" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
        dialog.showModal();
      });
    });
  }
  bindVideos();
  document.querySelector(".video-close")?.addEventListener("click",()=>{
    const dialog=document.querySelector("#video-lightbox");
    dialog.querySelector(".video-frame").innerHTML="";
    dialog.close();
  });
  document.querySelector(".lightbox-close:not(.video-close)")?.addEventListener("click",()=>document.querySelector("#photo-lightbox").close());
  document.querySelector("#photo-lightbox")?.addEventListener("click",event=>{
    if(event.target===event.currentTarget) event.currentTarget.close();
  });
}
