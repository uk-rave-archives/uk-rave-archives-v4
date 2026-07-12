
(() => {
  const page = location.pathname.split("/").pop() || "index.html";
  document.body.classList.add(page === "index.html" ? "page-home" : "page-" + page.replace(/\.html$/,"").replace(/[^a-z0-9]+/gi,"-"));

  const navs = document.querySelectorAll(".museum-nav,.museum-main-nav,.mobile-nav");
  const buttons = document.querySelectorAll(".menu-button");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const controlled = button.getAttribute("aria-controls");
      let nav = controlled ? document.getElementById(controlled) : null;
      if (!nav) nav = button.closest("header")?.querySelector(".museum-nav,.museum-main-nav,.mobile-nav");
      if (!nav) return;
      const open = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });
  });

  const aliases = {"people.html":"djs.html","tapepacks.html":"packs.html","timeline.html":"events.html"};
  const current = aliases[page] || page;
  navs.forEach(nav => nav.querySelectorAll("a").forEach(a => {
    const href = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
    const normalized = aliases[href] || href;
    const active = normalized === current;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current","page");
  }));

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    navs.forEach(nav => nav.classList.remove("open"));
    buttons.forEach(button => button.setAttribute("aria-expanded","false"));
  });
})();
