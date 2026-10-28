const app=document.getElementById('app'),back=document.getElementById('back'),search=document.getElementById('search');
const CATS=["Breakfast & Snacks","Drinks","Salads","Main Dishes","Desserts"];
const UI={
en:{summary:"Summary",search:"Search recipes or ingredients…",ingredients:"Ingredients",prep:"Preparation",know:"Good to know",by:"Recipe by ",recipe:"Recipe",add:"+ Add a recipe",edit:"Edit",del:"Delete",confirmDel:"Delete this recipe?",addTitle:"Add a recipe",editTitle:"Edit recipe",title:"Title",cat:"Category",byOpt:"Recipe by (optional)",ingLbl:"Ingredients",ingHelp:"one per line: quantity | ingredient (a line in capitals = section title)",stepsLbl:"Preparation",stepsHelp:"one step per line",notesLbl:"Good to know",notesHelp:"one note per line",save:"Save recipe",reset:"Reset to original",translating:"Translating to the other languages…",txDone:"Translated to the other languages ✓",txPartial:"Some lines could not be translated and were copied as written.",confirmReset:"Remove your changes to this recipe?",needTitle:"Please enter a title.",
 cats:{}},
fr:{summary:"Sommaire",search:"Rechercher une recette ou un ingrédient…",ingredients:"Ingrédients",prep:"Préparation",know:"Bon à savoir",by:"Recette de ",recipe:"Recette",add:"+ Ajouter une recette",edit:"Modifier",del:"Supprimer",confirmDel:"Supprimer cette recette ?",addTitle:"Ajouter une recette",editTitle:"Modifier la recette",title:"Titre",cat:"Catégorie",byOpt:"Recette de (facultatif)",ingLbl:"Ingrédients",ingHelp:"un par ligne : quantité | ingrédient (une ligne en majuscules = titre de section)",stepsLbl:"Préparation",stepsHelp:"une étape par ligne",notesLbl:"Bon à savoir",notesHelp:"une note par ligne",save:"Enregistrer la recette",reset:"Rétablir l'original",translating:"Traduction vers les autres langues…",txDone:"Traduit dans les autres langues ✓",txPartial:"Certaines lignes n'ont pas pu être traduites et ont été copiées telles quelles.",confirmReset:"Annuler vos modifications de cette recette ?",needTitle:"Veuillez entrer un titre.",
 cats:{"Breakfast & Snacks":"Déjeuners et collations","Drinks":"Boissons","Salads":"Salades","Main Dishes":"Plats principaux","Desserts":"Desserts"}},
es:{summary:"Índice",search:"Buscar recetas o ingredientes…",ingredients:"Ingredientes",prep:"Preparación",know:"Es bueno saber",by:"Receta de ",recipe:"Receta",add:"+ Agregar una receta",edit:"Editar",del:"Eliminar",confirmDel:"¿Eliminar esta receta?",addTitle:"Agregar una receta",editTitle:"Editar receta",title:"Título",cat:"Categoría",byOpt:"Receta de (opcional)",ingLbl:"Ingredientes",ingHelp:"uno por línea: cantidad | ingrediente (una línea en mayúsculas = título de sección)",stepsLbl:"Preparación",stepsHelp:"un paso por línea",notesLbl:"Es bueno saber",notesHelp:"una nota por línea",save:"Guardar receta",reset:"Restablecer original",translating:"Traduciendo a los otros idiomas…",txDone:"Traducido a los otros idiomas ✓",txPartial:"Algunas líneas no se pudieron traducir y se copiaron tal cual.",confirmReset:"¿Quitar tus cambios en esta receta?",needTitle:"Por favor escribe un título.",
 cats:{"Breakfast & Snacks":"Desayunos y meriendas","Drinks":"Bebidas","Salads":"Ensaladas","Main Dishes":"Platos principales","Desserts":"Postres"}}};
const roman=n=>['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][n]||n+1;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const load=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let lang=load('lang');if(!UI[lang])lang='en';
const t=k=>UI[lang][k];
const L3=(a,b,c)=>lang==='fr'?b:lang==='es'?c:a;
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
const LANGS=['en','fr','es'];
const ver=(r,l)=>{
  if(r.mine){const v=r.v&&(r.v[l]||r.v[Object.keys(r.v)[0]]);return v?{...r,...v}:r}
  const x=l!=='en'&&TR[l]&&TR[l][r.title];let o=x?{...r,...x}:r;
  const w=ovr()[r.id];
  if(w){o={...o};if(w.cat)o.cat=w.cat;if(w[l]){Object.assign(o,w[l]);o.edited=true}}
  return o};
const tr=r=>ver(r,lang);

function home(q=''){
  view.name='home';back.hidden=true;q=q.toLowerCase();
  let h=q?'':`<img class="logo" src="icon-192.png" alt="Marilyn's Recipe"><h1>${t('summary')}</h1>`;
  const list=all().map(tr).filter(r=>!q||(r.title+' '+r.ing.map(x=>x[1]).join(' ')).toLowerCase().includes(q));
  CATS.concat([...new Set(list.map(r=>r.cat))].filter(c=>!CATS.includes(c))).forEach(c=>{
    const rs=list.filter(r=>r.cat===c);if(!rs.length)return;
    h+=`<h2 class="cat">${esc(cl(c))}</h2>`+rs.map(r=>`<button class="item" data-id="${r.id}">${esc(r.title)}</button>`).join('');
  });
  if(!q)h+=`<button class="add" id="add">${t('add')}</button>`+`<button class="add" id="bk">${L3('Backup &amp; recover','Sauvegarde et récupération','Copia y recuperación')}</button>`;
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
  h+=`<p class="tools"><button data-edit="${r.id}">${t('edit')}</button>`+(r.mine?` <button data-del="${r.id}">${t('del')}</button>`:'')+`</p>`;
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
const BUILTIN=/^b\d+$/;
const clone=o=>JSON.parse(JSON.stringify(o));
function saveForm(id){
  const d=readForm(id);if(!d.title){alert(t('needTitle'));return}
  const data={title:d.title,by:d.by,ing:d.ing,steps:d.steps,notes:d.notes};
  const src=lang,before={};
  if(BUILTIN.test(id)){
    const raw=find(id);LANGS.forEach(l=>before[l]=ver(raw,l));
    const o=ovr()[id]?clone(ovr()[id]):{};o.cat=d.cat;o[src]=data;putOvr(id,o);show(id);
    autoTranslate(id,src,before,data,o);return;
  }
  const nid=id||'c'+Date.now();
  const old=custom().find(x=>x.id===nid);
  if(old)LANGS.forEach(l=>before[l]=ver({...old,mine:true},l));
  const v=old&&old.v?clone(old.v):(old&&old.title?{[old.lang||'en']:{title:old.title,by:old.by||'',ing:old.ing||[],steps:old.steps||[],notes:old.notes||[]}}:{});
  v[src]=data;
  const nr={id:nid,cat:d.cat,v};putCustom(nr);show(nid);
  autoTranslate(nid,src,before,data,nr);
}

/* ---------- Automatic translation (free MyMemory service) ---------- */
const decodeHtml=x=>{const e=document.createElement('textarea');e.innerHTML=x;return e.value};
async function translate(text,from,to){
  text=text.trim();if(!/[A-Za-zÀ-ÿ]/.test(text))return text;
  const key=from+'|'+to+'|'+text,c=load('txc')||{};if(c[key])return c[key];
  const chunks=[];let cur='';
  for(const p of text.split(/(?<=[.!?])\s+/)){if(cur&&(cur+' '+p).length>450){chunks.push(cur);cur=p}else cur=cur?cur+' '+p:p}
  if(cur)chunks.push(cur);
  const out=[];
  for(const ch of chunks){
    const r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(ch)+'&langpair='+from+'|'+to);
    const j=await r.json();const tt=j&&j.responseData&&j.responseData.translatedText;
    if(!tt||String(j.responseStatus)!=='200'||/MYMEMORY WARNING|QUERY LENGTH|INVALID/i.test(tt))return null;
    out.push(decodeHtml(tt));
  }
  const res=out.join(' ');c[key]=res;save('txc',c);return res;
}
const fixCase=(src,res)=>{
  if(/^[a-zà-ÿ]/.test(src))res=res.charAt(0).toLowerCase()+res.slice(1);
  if(!/[.!?]$/.test(src))res=res.replace(/\.$/,'');
  return res};
async function translateData(n,oS,oT,from,to){
  let failed=false;
  const tx=async x=>{try{const r=await translate(x,from,to);if(r==null){failed=true;return x}return r}catch(e){failed=true;return x}};
  const mapList=async(nl,ol,tl,fn)=>{const out=[];
    for(const it of nl){const k=JSON.stringify(it),i=ol?ol.findIndex(x=>JSON.stringify(x)===k):-1;
      out.push(i>=0&&tl&&tl.length===ol.length?tl[i]:await fn(it))}
    return out};
  const title=(oS&&oT&&oS.title===n.title)?oT.title:await tx(n.title);
  const ing=await mapList(n.ing,oS&&oS.ing,oT&&oT.ing,async([q,x])=>x
    ?[fixCase(q,await tx(q)),fixCase(x,await tx(x))]:[(await tx(q)).toUpperCase(),'']);
  const steps=await mapList(n.steps,oS&&oS.steps,oT&&oT.steps,tx);
  const notes=await mapList(n.notes,oS&&oS.notes,oT&&oT.notes,tx);
  return {data:{title,by:n.by,ing,steps,notes},failed};
}
function toast(msg,ms){
  let el=$('toast');if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el)}
  el.textContent=msg;el.style.display='block';clearTimeout(toast.t);if(ms)toast.t=setTimeout(()=>el.style.display='none',ms)}
async function autoTranslate(id,src,before,data,obj){
  toast(t('translating'));let failed=false;
  try{
    for(const to of LANGS){if(to===src)continue;
      const r=await translateData(data,before[src],before[to],src,to);
      if(r.failed)failed=true;
      if(BUILTIN.test(id))obj[to]=r.data;else obj.v[to]=r.data;
    }
  }catch(e){failed=true}
  if(BUILTIN.test(id))putOvr(id,obj);else putCustom(obj);
  if(view.name==='show'&&view.id===id)show(id);
  toast(failed?t('txPartial'):t('txDone'),failed?6000:2500);
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
  if(d)form(d);else if(view.name==='show')show(view.id);else if(view.name==='backup')backupPage();else home(search.value);
}
lb.addEventListener('click',e=>{const l=e.target.dataset.l;if(l)setLang(l)});

app.addEventListener('click',e=>{
  const x=e.target,b=x.closest('.item');
  if(b)return show(b.dataset.id);
  if(x.id==='add')return form();
  if(x.id==='bk')return backupPage();
  if(x.id==='bk-exp')return exportBackup();
  if(x.dataset.snap!==undefined)return restoreSnap(+x.dataset.snap);
  if(x.id==='save')return saveForm(x.dataset.id);
  if(x.dataset.edit)return form(tr(find(x.dataset.edit)));
  if(x.dataset.reset&&confirm(t('confirmReset'))){delOvr(x.dataset.reset);return show(x.dataset.reset)}
  if(x.dataset.del&&confirm(t('confirmDel'))){delCustom(x.dataset.del);home()}
});
back.onclick=()=>{search.value='';home()};
search.oninput=()=>home(search.value);
setLang(lang,true);
/* ---------- Backup & recover ---------- */
function snap(){try{const d=new Date(),day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  let S=load('snaps')||[];if(S.length&&S[0].d===day)return;
  if(!cache.custom.length&&!Object.keys(cache.ovr).length)return;
  S.unshift({d:day,custom:cache.custom,ovr:cache.ovr});save('snaps',S.slice(0,7))}catch(e){}}
function applyData(c,o){
  const oc=cache.custom,oo=cache.ovr;
  cache.custom=c;cache.ovr=o;save('custom',c);save('ovr',o);
  c.forEach(r=>cloud('put','custom',r.id,r));oc.filter(r=>!c.some(x=>x.id===r.id)).forEach(r=>cloud('del','custom',r.id));
  Object.keys(o).forEach(k=>cloud('put','ovr',k,o[k]));Object.keys(oo).filter(k=>!(k in o)).forEach(k=>cloud('del','ovr',k));
  backupPage();}
function backupPage(){
  view.name='backup';back.hidden=false;const S=load('snaps')||[];
  app.innerHTML=`<h1>${L3('Backup &amp; recover','Sauvegarde et récupération','Copia y recuperación')}</h1>
  <p class="note">${L3('One file with your own recipes and your changes to the original recipes. Keep it in Google Drive or send it to yourself.','Un fichier avec vos propres recettes et vos modifications aux recettes d\'origine. Gardez-le dans Google Drive ou envoyez-le vous-même.','Un archivo con sus propias recetas y sus cambios a las recetas originales. Guárdelo en Google Drive o envíelo a usted mismo.')}</p>
  <button class="add" id="bk-exp">${L3('Export backup','Exporter la sauvegarde','Exportar copia')}</button>
  <label class="add" style="display:block;text-align:center;cursor:pointer">${L3('Recover from a backup file','Récupérer depuis un fichier','Recuperar desde un archivo')}<input id="bk-file" type="file" accept=".json,application/json" hidden></label>
  <div class="sub">${L3('Automatic copies','Copies automatiques','Copias automáticas')}</div>
  <p class="note">${L3('A copy is saved on this phone once a day. The last 7 are kept.','Une copie est enregistrée sur ce téléphone chaque jour. Les 7 dernières sont gardées.','Se guarda una copia en este teléfono cada día. Se conservan las últimas 7.')}</p>`
  +(S.length?S.map((s,i)=>`<button class="item" data-snap="${i}">${esc(s.d)} · ${s.custom.length} ${L3('own recipes','recettes à vous','recetas propias')} · ${Object.keys(s.ovr).length} ${L3('edits','modifs','cambios')}</button>`).join(''):`<p class="note">${L3('Nothing yet.','Rien pour l\'instant.','Nada por ahora.')}</p>`);
  scrollTo(0,0);}
function exportBackup(){
  const d=new Date(),day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:'MarilynRecipe',v:1,saved:day,custom:cache.custom,ovr:cache.ovr})],{type:'application/json'}));
  a.download='marilyns-recipe-backup-'+day+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},500);
  toast(L3('Backup file created ✓','Fichier de sauvegarde créé ✓','Archivo de copia creado ✓'),2500);}
function restoreSnap(i){const s=(load('snaps')||[])[i];if(!s)return;
  if(confirm(L3('Restore the copy of '+s.d+'? Your current recipes will be replaced.','Restaurer la copie du '+s.d+' ? Vos recettes actuelles seront remplacées.','¿Restaurar la copia del '+s.d+'? Sus recetas actuales serán reemplazadas.'))){snap();applyData(s.custom||[],s.ovr||{})}}
app.addEventListener('change',e=>{
  if(e.target.id!=='bk-file')return;const f=e.target.files[0];e.target.value='';if(!f)return;
  const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);
    if(!o||o.app!=='MarilynRecipe'||!Array.isArray(o.custom)||typeof o.ovr!=='object'||!o.ovr)throw 0;
    if(!confirm(L3('Replace your recipes with this backup?','Remplacer vos recettes par cette sauvegarde ?','¿Reemplazar sus recetas con esta copia?')))return;
    snap();applyData(o.custom,o.ovr);toast(L3('Backup restored ✓','Sauvegarde restaurée ✓','Copia restaurada ✓'),2500)}
    catch(err){alert(L3('This file is not a valid backup.','Ce fichier n\'est pas une sauvegarde valide.','Este archivo no es una copia válida.'))}};
  r.readAsText(f)});
snap();
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