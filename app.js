const app=document.getElementById('app'),back=document.getElementById('back'),search=document.getElementById('search');
const CATS=["Breakfast & Snacks","Drinks","Salads","Main Dishes","Desserts"];
const roman=n=>['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][n]||n+1;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const load=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const custom=()=>load('custom')||[];
const all=()=>RECIPES.map((r,i)=>({...r,id:'b'+i})).concat(custom().map(r=>({...r,mine:true})));
const find=id=>all().find(r=>r.id===id);

function home(q=''){
  back.hidden=true;q=q.toLowerCase();
  let h=q?'':`<img class="logo" src="icons/icon-192.png" alt="Marilyn's Recipe"><h1>Summary</h1>`;
  const list=all().filter(r=>!q||(r.title+r.ing.map(x=>x[1]).join(' ')).toLowerCase().includes(q));
  CATS.concat([...new Set(list.map(r=>r.cat))].filter(c=>!CATS.includes(c))).forEach(c=>{
    const rs=list.filter(r=>r.cat===c);if(!rs.length)return;
    h+=`<h2 class="cat">${esc(c)}</h2>`+rs.map(r=>`<button class="item" data-id="${r.id}">${esc(r.title)}</button>`).join('');
  });
  if(!q)h+=`<button class="add" id="add">+ Add a recipe</button>`;
  app.innerHTML=h;scrollTo(0,0);
}
function show(id){
  const r=find(id);if(!r)return home();back.hidden=false;
  let h=`<div class="by">${r.by?'Recipe by '+esc(r.by):'Recipe'}</div><h1>${esc(r.title)}</h1><div class="sub">Ingredients</div><table>`;
  r.ing.forEach(([q,n])=>h+=n?`<tr><td class="q">${esc(q)}</td><td>${esc(n)}</td></tr>`:`<tr><td class="g" colspan="2">${esc(q)}</td></tr>`);
  h+=`</table>`;
  if(r.steps.length){h+=`<div class="sub">Preparation</div><ol>`;r.steps.forEach((s,k)=>h+=`<li><b>${roman(k)}</b><span>${esc(s)}</span></li>`);h+=`</ol>`}
  if(r.notes&&r.notes.length)h+=`<div class="sub">Good to know</div>`+r.notes.map(n=>`<p class="note">${esc(n)}</p>`).join('');
  if(r.mine)h+=`<p class="tools"><button data-edit="${r.id}">Edit</button> <button data-del="${r.id}">Delete</button></p>`;
  app.innerHTML=h;scrollTo(0,0);
}

/* ---------- Add / edit ---------- */
const ingToText=ing=>ing.map(([q,n])=>n?`${q} | ${n}`:q).join('\n');
const textToIng=t=>t.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
  const i=l.indexOf('|');return i<0?[l.toUpperCase(),'']:[l.slice(0,i).trim(),l.slice(i+1).trim()]});
const lines=t=>t.split('\n').map(l=>l.trim()).filter(Boolean);

function form(r={},msg=''){
  back.hidden=false;
  app.innerHTML=`<h1>${r.id?'Edit recipe':'Add a recipe'}</h1>
  <label>Title<input id="f-title" value="${esc(r.title||'')}"></label>
  <label>Category<select id="f-cat">${CATS.map(c=>`<option${c===r.cat?' selected':''}>${c}</option>`).join('')}</select></label>
  <label>Recipe by (optional)<input id="f-by" value="${esc(r.by||'')}"></label>
  <label>Ingredients <small>one per line: quantity | ingredient (a line in capitals = section title)</small>
  <textarea id="f-ing" rows="8">${esc(ingToText(r.ing||[]))}</textarea></label>
  <label>Preparation <small>one step per line</small><textarea id="f-steps" rows="8">${esc((r.steps||[]).join('\n'))}</textarea></label>
  <label>Good to know <small>one note per line</small><textarea id="f-notes" rows="3">${esc((r.notes||[]).join('\n'))}</textarea></label>
  <button class="add" id="save" data-id="${r.id||''}">Save recipe</button>`;
  scrollTo(0,0);
}
function saveForm(id){
  const title=document.getElementById('f-title').value.trim();
  if(!title){alert('Please enter a title.');return}
  const r={id:id||'c'+Date.now(),title,cat:document.getElementById('f-cat').value,by:document.getElementById('f-by').value.trim(),
    ing:textToIng(document.getElementById('f-ing').value),steps:lines(document.getElementById('f-steps').value),notes:lines(document.getElementById('f-notes').value)};
  const list=custom().filter(x=>x.id!==r.id);list.push(r);save('custom',list);show(r.id);
}
app.addEventListener('click',e=>{
  const t=e.target,b=t.closest('.item');
  if(b)return show(b.dataset.id);
  if(t.id==='add')return form();
  if(t.id==='save')return saveForm(t.dataset.id);
  if(t.dataset.edit)return form(find(t.dataset.edit));
  if(t.dataset.del&&confirm('Delete this recipe?')){save('custom',custom().filter(x=>x.id!==t.dataset.del));home()}
});
back.onclick=()=>{search.value='';home()};
search.oninput=()=>home(search.value);
home();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
