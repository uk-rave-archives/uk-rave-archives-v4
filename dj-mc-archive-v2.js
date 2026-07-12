
const menuButton=document.querySelector(".menu-button");
const menu=document.querySelector(".museum-nav");
menuButton?.addEventListener("click",()=>{
  const open=menu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded",String(open));
});

const grid=[...document.querySelectorAll(".artist-card")];
const search=document.querySelector("#artist-search");
const era=document.querySelector("#era-filter");
const role=document.querySelector("#role-filter");
const alphabet=document.querySelector("#alphabet");
const noResults=document.querySelector("#no-results");
let activeLetter="all";

"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter=>{
  const button=document.createElement("button");
  button.type="button";
  button.dataset.letter=letter;
  button.textContent=letter;
  alphabet.appendChild(button);
});

function applyFilters(){
  const query=(search.value||"").trim().toLowerCase();
  const eraValue=era.value;
  const roleValue=role.value;
  let shown=0;
  grid.forEach(card=>{
    const name=card.dataset.name.toLowerCase();
    const visible=
      (!query||name.includes(query)) &&
      (eraValue==="all"||card.dataset.era.includes(eraValue)) &&
      (roleValue==="all"||card.dataset.role===roleValue) &&
      (activeLetter==="all"||name.startsWith(activeLetter.toLowerCase()));
    card.hidden=!visible;
    if(visible) shown++;
  });
  noResults.hidden=shown!==0;
}

search.addEventListener("input",applyFilters);
era.addEventListener("change",applyFilters);
role.addEventListener("change",applyFilters);

alphabet.addEventListener("click",event=>{
  const button=event.target.closest("[data-letter]");
  if(!button) return;
  alphabet.querySelectorAll("button").forEach(item=>item.classList.remove("active"));
  button.classList.add("active");
  activeLetter=button.dataset.letter;
  applyFilters();
});

document.querySelector("#browse-az").addEventListener("click",()=>{
  alphabet.scrollIntoView({behavior:"smooth",block:"center"});
});

document.querySelectorAll("[data-era-jump]").forEach(button=>{
  button.addEventListener("click",()=>{
    era.value=button.dataset.eraJump;
    applyFilters();
    document.querySelector("#artists").scrollIntoView({behavior:"smooth"});
  });
});
