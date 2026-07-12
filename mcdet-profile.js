(() => {
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.main-nav');
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('[data-scroll]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelector(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth'});
  }));

  const bio = document.querySelector('.bio-copy');
  const bioToggle = document.getElementById('bio-toggle');
  bioToggle?.addEventListener('click', () => {
    const collapsed = bio.dataset.collapsed === 'true';
    bio.dataset.collapsed = String(!collapsed);
    bioToggle.textContent = collapsed ? 'SHOW LESS ↑' : 'READ FULL BIOGRAPHY ↓';
  });

  const timelineNotes = {
    'early-90s': 'Rinse FM and Resident Advisor both place MC Det on Kool FM during the formative jungle and drum-and-bass years.',
    '1995': 'Out of Det was released on Sour Records. Rinse FM says the album found audiences in the UK, America, Japan and Europe.',
    'late-90s': 'Det recorded with Red Snapper and Cut La Roc and toured in live-band settings, demonstrating a wider range than rave MC work alone.',
    '2000-05': 'The archive records continued club, rave, radio and collaborative work through 2005; individual dates will be added only when verified.'
  };
  const detail = document.getElementById('timeline-detail');
  document.querySelectorAll('.timeline-item').forEach(item => item.addEventListener('click', () => {
    document.querySelectorAll('.timeline-item').forEach(x => x.classList.remove('active'));
    item.classList.add('active');
    detail.textContent = timelineNotes[item.dataset.year] || '';
  }));
  document.querySelector('.timeline-item.active')?.click();

  const strip = document.getElementById('photo-strip');
  document.getElementById('photo-scroll')?.addEventListener('click', () => strip.scrollBy({left:520,behavior:'smooth'}));

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox?.querySelector('img');
  document.querySelectorAll('.photo-card[data-full]').forEach(card => card.addEventListener('click', () => {
    lightboxImg.src = card.dataset.full;
    lightbox.hidden = false;
  }));
  lightbox?.querySelector('button')?.addEventListener('click', () => lightbox.hidden = true);
  lightbox?.addEventListener('click', e => { if(e.target === lightbox) lightbox.hidden = true; });

  const sections = [...document.querySelectorAll('.content-column>section, #overview')];
  const sideLinks = [...document.querySelectorAll('.side-nav a')];
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible) return;
    sideLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${visible.target.id}`));
  }, {rootMargin:'-20% 0px -65% 0px',threshold:[0,.25,.6]});
  sections.forEach(s => s.id && observer.observe(s));
})();
