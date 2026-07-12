
const menuButton=document.querySelector(".menu-button");
const menu=document.querySelector(".museum-nav");
menuButton?.addEventListener("click",()=>{
  const open=menu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded",String(open));
});

const cards=[...document.querySelectorAll(".person-row")];
const search=document.querySelector("#people-search");
const filter=document.querySelector("#people-filter");
const alphabet=document.querySelector("#people-alphabet");
const empty=document.querySelector("#people-empty");
let activeLetter="all";

"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter=>{
  const b=document.createElement("button");
  b.type="button";b.dataset.letter=letter;b.textContent=letter;
  alphabet.appendChild(b);
});

function apply(){
  const q=search.value.trim().toLowerCase();
  const type=filter.value;
  let visible=0;
  cards.forEach(card=>{
    const name=card.dataset.name.toLowerCase();
    const show=(!q||name.includes(q))&&(type==="all"||card.dataset.type===type)&&(activeLetter==="all"||name.startsWith(activeLetter.toLowerCase()));
    card.hidden=!show;if(show)visible++;
  });
  empty.hidden=visible!==0;
}
search.addEventListener("input",apply);
filter.addEventListener("change",apply);
alphabet.addEventListener("click",event=>{
  const b=event.target.closest("[data-letter]");if(!b)return;
  alphabet.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");activeLetter=b.dataset.letter;apply();
});
document.querySelectorAll("[data-set-filter]").forEach(link=>{
  link.addEventListener("click",()=>{
    filter.value=link.dataset.setFilter;activeLetter="all";
    alphabet.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x.dataset.letter==="all"));
    apply();
  });
});
