
const records = window.BTOS_ARTISTS || [];
const params = new URLSearchParams(location.search);
const id = params.get("id") || "";
const artist = records.find(item => item.id === id);
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

const listCards = (items, type) => {
  if (!items?.length) return "";
  return `<div class="year-link-grid">${items.map(item => `
    <a class="year-link-card" href="${item.href}">
      ${item.image ? `<img src="${item.image}" alt="${esc(item.title)}">` : ""}
      <span class="year-link-type">${esc(type)}</span>
      <strong>${esc(item.title)}</strong>
      <em>Open record →</em>
    </a>`).join("")}</div>`;
};

const photoCards = photos => {
  if (!photos?.length) return "";
  return `<div class="year-photo-grid">${photos.map(photo => `
    <figure class="year-photo">
      <button type="button" class="photo-open" data-full="${photo.src}" aria-label="Open ${esc(photo.caption || "photo")}">
        <img src="${photo.src}" alt="${esc(photo.caption || artist.name)}">
      </button>
      <figcaption>
        <strong>${esc(photo.caption || "Archive photograph")}</strong>
        <small>Photo: ${esc(photo.credit || "Credit recorded in archive")}</small>
      </figcaption>
    </figure>`).join("")}</div>`;
};

if (!publishable(artist)) {
  root.innerHTML = `<section class="not-public">
    <h1>Profile not published</h1>
    <p>This artist is either not in the database or has not passed the publication checks.</p>
    <a href="djs.html">Return to the DJ &amp; MC Archive</a>
  </section>`;
} else {
  document.title = `${artist.name} — ${artist.role} Profile | Back to the Old Skool Archive`;
  const fallbackEnvironment = artist.role === "MC"
    ? "artist-env-mc-stage.jpg"
    : (artist.activeFrom && artist.activeFrom <= 1990)
      ? "artist-env-early-warehouse.jpg"
      : (artist.activeFrom && artist.activeFrom >= 1997)
        ? "artist-env-superclub-hangar.jpg"
        : "artist-env-jungle-warehouse.jpg";
  document.documentElement.style.setProperty(
    "--artist-environment",
    `url("${artist.environment || fallbackEnvironment}")`
  );

  const fact = (label, value) => `<div class="fact"><small>${esc(label)}</small><b>${esc(value || "Researching")}</b></div>`;
  const yearData = artist.yearData || {};
  const availableYears = Object.keys(yearData).sort((a,b) => Number(a) - Number(b));
  const startYear = Math.max(1988, Number(artist.activeFrom || 1988));
  const endYear = Math.min(2005, Number(artist.archiveTo || 2005));
  const years = Array.from({length: endYear - startYear + 1}, (_,i) => String(startYear + i));

  root.innerHTML = `
    <section class="profile-hero">
      <div class="profile-photo"><img src="${artist.image}" alt="${esc(artist.name)}"><span class="photo-credit">Photo: ${esc(artist.photoCredit)}</span></div>
      <div class="profile-copy"><p class="kicker">${esc(artist.role)} archive profile</p><h1>${esc(artist.name)}</h1><p class="summary">${esc(artist.summary)}</p>
        <div class="facts">
          ${fact("Role", artist.role)}${fact("Origin", artist.origin)}
          ${fact("Archive period", `${artist.activeFrom || "?"}–${artist.archiveTo || 2005}`)}
          ${fact("Styles", artist.styles.join(", "))}
        </div>
      </div>
    </section>
    <nav class="profile-nav"><a href="#biography">Biography</a><a href="#timeline">Timeline</a><a href="#tapes">Tape sets</a><a href="#flyers">Flyers</a><a href="#events">Events</a><a href="#sources">Sources</a></nav>
    <div class="profile-main">
      <section class="panel" id="biography"><h2>Biography</h2>${artist.biography.map(p => `<p>${esc(p)}</p>`).join("")}</section>

      <section class="panel interactive-timeline" id="timeline">
        <div class="timeline-heading">
          <div>
            <p class="timeline-kicker">Explore the archive year by year</p>
            <h2>Career timeline to 2005</h2>
          </div>
          <p>Choose an active year to open photographs, history and connected archive records.</p>
        </div>
        <div class="year-strip" role="tablist" aria-label="${esc(artist.name)} career years">
          ${years.map(year => {
            const enabled = !!yearData[year];
            return `<button type="button" class="year-button ${enabled ? "" : "is-empty"}" data-year="${year}" role="tab" aria-selected="false" ${enabled ? "" : "disabled"}>${year}</button>`;
          }).join("")}
        </div>
        <div class="year-view" id="year-view">
          ${availableYears.length
            ? `<p class="year-prompt">Select a highlighted year to explore the archive.</p>`
            : `<div class="researching"><b>Timeline research active</b>No verified year records have been added yet.</div>`}
        </div>
      </section>

      <section class="panel" id="tapes"><h2>All linked tape recordings</h2><div class="connections">${listCards(artist.tapes || [], "Tape set") || `<div class="researching"><b>Tape matching active</b>No verified linked recordings have been added yet.</div>`}</div></section>
      <section class="panel" id="flyers"><h2>All linked flyer appearances</h2><div class="connections">${listCards(artist.flyers || [], "Flyer") || `<div class="researching"><b>Flyer matching active</b>No verified linked flyers have been added yet.</div>`}</div></section>
      <section class="panel" id="events"><h2>All linked events</h2><div class="connections">${listCards(artist.events || [], "Event") || `<div class="researching"><b>Event matching active</b>No verified linked events have been added yet.</div>`}</div></section>
      <section class="panel" id="sources"><h2>Sources and photo credits</h2>${artist.sources?.length ? `<ul class="sources">${artist.sources.map(item => `<li><a href="${item.href}" target="_blank" rel="noopener">${esc(item.title)}</a></li>`).join("")}</ul>` : `<div class="researching"><b>Source research active</b>Verified references will be recorded here.</div>`}</section>
    </div>
    <dialog class="photo-lightbox" id="photo-lightbox">
      <button class="lightbox-close" type="button" aria-label="Close photo">×</button>
      <img src="" alt="">
    </dialog>`;

  const view = document.querySelector("#year-view");
  const buttons = [...document.querySelectorAll(".year-button:not([disabled])")];

  function openYear(year, scroll = false) {
    const data = yearData[year];
    if (!data) return;
    buttons.forEach(button => {
      const selected = button.dataset.year === year;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
    });

    const sections = [];
    if (data.photos?.length) sections.push(`<section class="year-block"><h4>Photos</h4>${photoCards(data.photos)}</section>`);
    if (data.details?.length) sections.push(`<section class="year-block"><h4>More information</h4>${data.details.map(text => `<p>${esc(text)}</p>`).join("")}</section>`);
    if (data.tapes?.length) sections.push(`<section class="year-block"><h4>Tape packs and recordings</h4>${listCards(data.tapes, "Tape set")}</section>`);
    if (data.flyers?.length) sections.push(`<section class="year-block"><h4>Flyers</h4>${listCards(data.flyers, "Flyer")}</section>`);
    if (data.events?.length) sections.push(`<section class="year-block"><h4>Events and venues</h4>${listCards(data.events, "Event")}</section>`);
    if (data.releases?.length) sections.push(`<section class="year-block"><h4>Releases and projects</h4>${listCards(data.releases, "Release")}</section>`);
    if (data.links?.length) sections.push(`<section class="year-block"><h4>Sources and further archive links</h4>${listCards(data.links, "Source")}</section>`);

    view.innerHTML = `
      <article class="year-exhibit">
        <header><span class="year-number">${esc(year)}</span><div><h3>${esc(data.title)}</h3><p>${esc(data.summary || "")}</p></div></header>
        ${sections.join("") || `<p class="year-prompt">No additional verified archive material is linked to this year yet.</p>`}
      </article>`;
    bindPhotoLightbox();
    history.replaceState(null, "", `#year-${year}`);
    if (scroll) view.scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  buttons.forEach(button => button.addEventListener("click", () => openYear(button.dataset.year, true)));

  const hashMatch = location.hash.match(/^#year-(\d{4})$/);
  const initialYear = hashMatch && yearData[hashMatch[1]] ? hashMatch[1] : availableYears[0];
  if (initialYear) openYear(initialYear);

  function bindPhotoLightbox() {
    const dialog = document.querySelector("#photo-lightbox");
    const dialogImage = dialog.querySelector("img");
    document.querySelectorAll(".photo-open").forEach(button => {
      button.addEventListener("click", () => {
        dialogImage.src = button.dataset.full;
        dialogImage.alt = button.querySelector("img")?.alt || artist.name;
        dialog.showModal();
      });
    });
  }
  document.querySelector(".lightbox-close")?.addEventListener("click", () => document.querySelector("#photo-lightbox").close());
  document.querySelector("#photo-lightbox")?.addEventListener("click", event => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });
}
