(function(){
  const header=document.querySelector('.home-header');
  const toggle=document.querySelector('.nav-toggle');
  const nav=document.querySelector('.home-nav');
  const updateHeader=()=>header.classList.toggle('compact',window.scrollY>40);
  updateHeader(); window.addEventListener('scroll',updateHeader,{passive:true});
  toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
  nav.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');});
  const items=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}}),{threshold:.12});items.forEach(el=>io.observe(el));}else{items.forEach(el=>el.classList.add('visible'));}
})();
