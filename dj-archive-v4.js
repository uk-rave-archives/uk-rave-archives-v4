
document.addEventListener("DOMContentLoaded", () => {
  const oldHeader = document.querySelector("header");
  if (!oldHeader) return;

  const header = document.createElement("header");
  header.className = "museum-home-header";
  header.innerHTML = `
    <a class="museum-home-header__brand" href="index.html" aria-label="Back to the Old Skool Archive home">
      Back to the Old Skool Archive
    </a>
    <button class="museum-home-header__menu" type="button" aria-expanded="false" aria-controls="museum-home-nav">
      Menu
    </button>
    <nav class="museum-home-header__nav" id="museum-home-nav" aria-label="Main navigation">
      <a href="index.html">Home</a>
      <a href="flyers.html">Flyers</a>
      <a href="packs.html">Tape Packs</a>
      <a href="djs.html" aria-current="page">DJs &amp; MCs</a>
      <a href="venues.html">Venues</a>
      <a href="promoters.html">Promoters</a>
      <a href="events.html">Timeline</a>
      <a href="radio.html">Radio</a>
      <a href="stories.html">Stories</a>
      <a href="search.html">Search</a>
    </nav>
  `;
  oldHeader.replaceWith(header);

  if (!document.querySelector('link[href="dj-header-home-match.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "dj-header-home-match.css";
    document.head.appendChild(link);
  }

  const button = header.querySelector(".museum-home-header__menu");
  const nav = header.querySelector(".museum-home-header__nav");
  button.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    });
  });

  // Keep the existing DJ directory search/filter useful if present.
  const search = document.querySelector('input[type="search"], #dj-search, [data-dj-search]');
  const cards = [...document.querySelectorAll("[data-dj-card], .dj-card, .research-card, .artist-card")];
  if (search && cards.length) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      cards.forEach((card) => {
        card.hidden = q && !card.textContent.toLowerCase().includes(q);
      });
    });
  }
});
