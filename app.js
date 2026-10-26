const app=document.getElementById('app'),back=document.getElementById('back'),search=document.getElementById('search');
const CATS=["Breakfast & Snacks","Drinks","Salads","Main Dishes","Desserts"];
const UI={
en:{summary:"Summary",search:"Search recipes or ingredients…",ingredients:"Ingredients",prep:"Preparation",know:"Good to know",by:"Recipe by ",recipe:"Recipe",add:"+ Add a recipe",edit:"Edit",del:"Delete",confirmDel:"Delete this recipe?",addTitle:"Add a recipe",editTitle:"Edit recipe",title:"Title",cat:"Category",byOpt:"Recipe by (optional)",ingLbl:"Ingredients",ingHelp:"one per line: quantity | ingredient (a line in capitals = section title)",stepsLbl:"Preparation",stepsHelp:"one step per line",notesLbl:"Good to know",notesHelp:"one note per line",save:"Save recipe",reset:"Reset to original",confirmReset:"Remove your changes to this recipe?",needTitle:"Please enter a title.",
 cats:{}},
fr:{summary:"Sommaire",search:"Rechercher une recette ou un ingrédient…",ingredients:"Ingrédients",prep:"Préparation",know:"Bon à savoir",by:"Recette de ",recipe:"Recette",add:"+ Ajouter une recette",edit:"Modifier",del:"Supprimer",confirmDel:"Supprimer cette recette ?",addTitle:"Ajouter une recette",editTitle:"Modifier la recette",title:"Titre",cat:"Catégorie",byOpt:"Recette de (facultatif)",ingLbl:"Ingrédients",ingHelp:"un par ligne : quantité | ingrédient (une ligne en majuscules = titre de section)",stepsLbl:"Préparation",stepsHelp:"une étape par ligne",notesLbl:"Bon à savoir",notesHelp:"une note par ligne",save:"Enregistrer la recette",reset:"Rétablir l'original",confirmReset:"Annuler vos modifications de cette recette ?",needTitle:"Veuillez entrer un titre.",
 cats:{"Breakfast & Snacks":"Déjeuners et collations","Drinks":"Boissons","Salads":"Salades","Main Dishes":"Plats principaux","Desserts":"Desserts"}},
es:{summary:"Índice",search:"Buscar recetas o ingredientes…",ingredients:"Ingredientes",prep:"Preparación",know:"Es bueno saber",by:"Receta de ",recipe:"Receta",add:"+ Agregar una receta",edit:"Editar",del:"Eliminar",confirmDel:"¿Eliminar esta receta?",addTitle:"Agregar una receta",editTitle:"Editar receta",title:"Título",cat:"Categoría",byOpt:"Receta de (opcional)",ingLbl:"Ingredientes",ingHelp:"uno por línea: cantidad | ingrediente (una línea en mayúsculas = título de sección)",stepsLbl:"Preparación",stepsHelp:"un paso por línea",notesLbl:"Es bueno saber",notesHelp:"una nota por línea",save:"Guardar receta",reset:"Restablecer original",confirmReset:"¿Quitar tus cambios en esta receta?",needTitle:"Por favor escribe un título.",
 cats:{"Breakfast & Snacks":"Desayunos y meriendas","Drinks":"Bebidas","Salads":"Ensaladas","Main Dishes":"Platos principales","Desserts":"Postres"}}};
const roman=n=>['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][n]||n+1;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const load=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let lang=load('lang');if(!UI[lang])lang='en';
const t=k=>UI[lang][k];
const cl=c=>UI[lang].cats[c]||c;
const view={name:'home',id:''};
const cache={custom:load('custom')||[],ovr:load('ovr')||{}};
const custom=()=>cache.custom;
const cloud=(f,...a)=>{try{window.Cloud&&window.Cloud[f](...a)}catch(e){}};
function putCustom(r){cache.custom=cache.custom.filter(x=>x.id!==r.id).concat([r]);save('custom',cache.custom);cloud('put','custom',r.id,r)}
function delCustom(id){cache.custom=cache.custom.filter(x=>x.id!==id);save('custom',cache.custom);cloud('del','custom',id)}
function putOvr(id,o){cache.ovr[id]=o;save('ovr',cache.ovr);cloud('put','ovr',id,o)}
function delOvr(id){delete cache.ovr[id];save('ovr',cache.ovr);cloud('del','ovr',id)}
const all=()=>RECIPES.map((r,i)=>({...r,id:'b'+i})).concat(custom().map(r=>({...r,mine:true})));
const find=id=>all().find(r=>r.id===id);
const ovr=()=>cache.ovr;
const tr=r=>{const x=lang!=='en'&&!r.mine&&TR[lang]&&TR[lang][r.title];let o=x?{...r,...x}:r;
  const v=!r.mine&&ovr()[r.id];
  if(v){o={...o};if(v.cat)o.cat=v.cat;if(v[lang]){Object.assign(o,v[lang]);o.edited=true}}
  return o};

function home(q=''){
  view.name='home';back.hidden=true;q=q.toLowerCase();
  let h=q?'':`<img class="logo" src="icon-192.png" alt="Marilyn's Recipe"><h1>${t('summary')}</h1>`;
  const list=all().map(tr).filter(r=>!q||(r.title+' '+r.ing.map(x=>x[1]).join(' ')).toLowerCase().includes(q));
  CATS.concat([...new Set(list.map(r=>r.cat))].filter(c=>!CATS.includes(c))).forEach(c=>{
    const rs=list.filter(r=>r.cat===c);if(!rs.length)return;
    h+=`<h2 class="cat">${esc(cl(c))}</h2>`+rs.map(r=>`<button class="item" data-id="${r.id}">${esc(r.title)}</button>`).join('');
  });
  if(!q)h+=`<button class="add" id="add">${t('add')}</button>`;
  app.innerHTML=h;scrollTo(0,0);
}
function show(id){
  const raw=find(id);if(!raw)return home();
  const r=tr(raw);view.name='show';view.id=id;back.hidden=false;
  let h=`<div class="by">${r.by?t('by')+esc(r.by):t('recipe')}</div><h1>${esc(r.title)}</h1><div class="sub">${t('ingredients')}</div><table>`;
  r.ing.forEach(([q,n])=>h+=n?`<tr><td class="q">${esc(q)}</td><td>${esc(n)}</td></tr>`:`<tr><td class="g" colspan="2">${esc(q)}</td></tr>`);
  h+=`</table>`;
  if(r.steps.length){h+=`<div class="sub">${t('prep')}</div><ol>`;r.steps.forEach((s,k)=>h+=`<li><b>${roman(k)}</b><span>${esc(s)}</span></li>`);h+=`</ol>`}
  if(r.notes&&r.notes.length)h+=`<div class="sub">${t('know')}</div>`+r.notes.map(n=>`<p class="note">${esc(n)}</p>`).join('');
  h+=`<p class="tools"><button data-edit="${r.id}">${t('edit')}</button>`+(r.mine?` <button data-del="${r.id}">${t('del')}</button>`:'')+(ovr()[r.id]?` <button data-reset="${r.id}">${t('reset')}</button>`:'')+`</p>`;
  app.innerHTML=h;scrollTo(0,0);
}

/* ---------- Add / edit (custom recipes, saved on this device) ---------- */
const ingToText=ing=>ing.map(([q,n])=>n?`${q} | ${n}`:q).join('\n');
const textToIng=s=>s.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
  const i=l.indexOf('|');return i<0?[l.toUpperCase(),'']:[l.slice(0,i).trim(),l.slice(i+1).trim()]});
const lines=s=>s.split('\n').map(l=>l.trim()).filter(Boolean);
const $=id=>document.getElementById(id);

function form(r={}){
  view.name='form';back.hidden=false;
  app.innerHTML=`<h1>${r.id?t('editTitle'):t('addTitle')}</h1>
  <label>${t('title')}<input id="f-title" value="${esc(r.title||'')}"></label>
  <label>${t('cat')}<select id="f-cat">${CATS.map(c=>`<option value="${esc(c)}"${c===r.cat?' selected':''}>${esc(cl(c))}</option>`).join('')}</select></label>
  <label>${t('byOpt')}<input id="f-by" value="${esc(r.by||'')}"></label>
  <label>${t('ingLbl')} <small>${t('ingHelp')}</small>
  <textarea id="f-ing" rows="8">${esc(ingToText(r.ing||[]))}</textarea></label>
  <label>${t('stepsLbl')} <small>${t('stepsHelp')}</small><textarea id="f-steps" rows="8">${esc((r.steps||[]).join('\n'))}</textarea></label>
  <label>${t('notesLbl')} <small>${t('notesHelp')}</small><textarea id="f-notes" rows="3">${esc((r.notes||[]).join('\n'))}</textarea></label>
  <button class="add" id="save" data-id="${r.id||''}">${t('save')}</button>`;
  scrollTo(0,0);
}
const readForm=id=>({id:id||'',title:$('f-title').value.trim(),cat:$('f-cat').value,by:$('f-by').value.trim(),
  ing:textToIng($('f-ing').value),steps:lines($('f-steps').value),notes:lines($('f-notes').value)});
function saveForm(id){
  const r=readForm(id);if(!r.title){alert(t('needTitle'));return}
  if(/^b\d+$/.test(id)){const o=ovr()[id]?JSON.parse(JSON.stringify(ovr()[id])):{};o.cat=r.cat;
    o[lang]={title:r.title,by:r.by,ing:r.ing,steps:r.steps,notes:r.notes};putOvr(id,o);show(id);return}
  r.id=id||'c'+Date.now();
  putCustom(r);show(r.id);
}

/* ---------- Language toggle ---------- */
const lb=document.createElement('div');lb.id='lang';
['en','fr','es'].forEach(l=>{const b=document.createElement('button');b.textContent=l.toUpperCase();b.dataset.l=l;lb.appendChild(b)});
document.getElementById('top').appendChild(lb);
function setLang(l,first){
  const d=(!first&&view.name==='form')?readForm($('save').dataset.id):null;
  lang=l;save('lang',l);document.documentElement.lang=l;
  search.placeholder=t('search');back.textContent='‹ '+t('summary');
  [...lb.children].forEach(b=>b.classList.toggle('on',b.dataset.l===l));
  if(d)form(d);else if(view.name==='show')show(view.id);else home(search.value);
}
lb.addEventListener('click',e=>{const l=e.target.dataset.l;if(l)setLang(l)});

app.addEventListener('click',e=>{
  const x=e.target,b=x.closest('.item');
  if(b)return show(b.dataset.id);
  if(x.id==='add')return form();
  if(x.id==='save')return saveForm(x.dataset.id);
  if(x.dataset.edit)return form(tr(find(x.dataset.edit)));
  if(x.dataset.reset&&confirm(t('confirmReset'))){delOvr(x.dataset.reset);return show(x.dataset.reset)}
  if(x.dataset.del&&confirm(t('confirmDel'))){delCustom(x.dataset.del);home()}
});
back.onclick=()=>{search.value='';home()};
search.oninput=()=>home(search.value);
setLang(lang,true);
/* ---------- Shared sync (Firebase) ---------- */
window.localData=kind=>kind==='custom'?Object.fromEntries(cache.custom.map(r=>[r.id,r])):cache.ovr;
window.onCloudData=(kind,map)=>{
  cache[kind]=kind==='custom'?Object.values(map):map;save(kind,cache[kind]);
  const y=scrollY;
  if(view.name==='home')home(search.value);else if(view.name==='show')show(view.id);
  scrollTo(0,y);
};
import('./sync.js').catch(e=>console.warn('sync off',e));
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
