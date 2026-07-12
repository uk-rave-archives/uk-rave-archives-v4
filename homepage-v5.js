(() => {
  const image = document.querySelector('.museum-poster__image');
  if (!image) return;
  image.addEventListener('contextmenu', event => event.preventDefault());
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    });
  });
})();
