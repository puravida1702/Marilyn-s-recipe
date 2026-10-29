/* Tiny offline QR code generator: byte mode, error correction M, versions 1-10 (links up to ~210 characters).
   QR.svg(text) returns an <svg> string, or '' if the text is too long. */
const QR=(()=>{
  const ECC=[-1,10,16,26,18,24,16,18,22,22,26],BLK=[-1,1,1,1,2,2,4,4,4,5,5];
  const raw=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
  const dataWords=v=>Math.floor(raw(v)/8)-ECC[v]*BLK[v];
  const bit=(x,i)=>((x>>>i)&1)===1;
  /* Reed-Solomon over GF(256) */
  const mul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z&255};
  const rsDiv=n=>{const r=new Array(n).fill(0);r[n-1]=1;let root=1;for(let i=0;i<n;i++){for(let j=0;j<n;j++){r[j]=mul(r[j],root);if(j+1<n)r[j]^=r[j+1]}root=mul(root,2)}return r};
  const rsRem=(data,div)=>{const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>{r[i]^=mul(c,f)})}return r};

  function encode(text){
    const bytes=Array.from(new TextEncoder().encode(text));
    let ver=1;
    for(;ver<=10;ver++){if(4+(ver<10?8:16)+bytes.length*8<=dataWords(ver)*8)break}
    if(ver>10)return null;
    /* data bits */
    const bits=[],put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>>i)&1)};
    put(4,4);put(bytes.length,ver<10?8:16);bytes.forEach(b=>put(b,8));
    const cap=dataWords(ver)*8;
    put(0,Math.min(4,cap-bits.length));put(0,(8-bits.length%8)%8);
    for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)put(p,8);
    const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(''),2));
    /* error correction + interleave */
    const nb=BLK[ver],el=ECC[ver],rawW=Math.floor(raw(ver)/8),ns=nb-rawW%nb,sl=Math.floor(rawW/nb);
    const div=rsDiv(el),blocks=[];
    for(let i=0,k=0;i<nb;i++){
      const d=data.slice(k,k+sl-el+(i<ns?0:1));k+=d.length;
      const e=rsRem(d,div);if(i<ns)d.push(0);blocks.push(d.concat(e));
    }
    const words=[];
    for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==sl-el||j>=ns)words.push(b[i])});
    /* grid */
    const size=ver*4+17,m=[],fn=[];
    for(let i=0;i<size;i++){m.push(new Array(size).fill(false));fn.push(new Array(size).fill(false))}
    const set=(x,y,d)=>{m[y][x]=d;fn[y][x]=true};
    for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
    const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
      const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;
      if(x>=0&&x<size&&y>=0&&y<size)set(x,y,d!==2&&d!==4)}};
    finder(3,3);finder(size-4,3);finder(3,size-4);
    const ap=[];
    if(ver>1){const n=Math.floor(ver/7)+2,step=Math.ceil((ver*4+4)/(n*2-2))*2;ap.push(6);for(let p=size-7,k=1;k<n;k++,p-=step)ap.splice(1,0,p)}
    ap.forEach((ax,i)=>ap.forEach((ay,j)=>{
      if((i===0&&j===0)||(i===0&&j===ap.length-1)||(i===ap.length-1&&j===0))return;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ax+dx,ay+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
    }));
    const format=mask=>{ /* error correction level M = 0 */
      let rem=mask;for(let i=0;i<10;i++)rem=(rem<<1)^((rem>>>9)*0x537);
      const bits=((mask<<10)|rem)^0x5412;
      for(let i=0;i<=5;i++)set(8,i,bit(bits,i));
      set(8,7,bit(bits,6));set(8,8,bit(bits,7));set(7,8,bit(bits,8));
      for(let i=9;i<15;i++)set(14-i,8,bit(bits,i));
      for(let i=0;i<8;i++)set(size-1-i,8,bit(bits,i));
      for(let i=8;i<15;i++)set(8,size-15+i,bit(bits,i));
      set(8,size-8,true);
    };
    format(0);
    if(ver>=7){
      let rem=ver;for(let i=0;i<12;i++)rem=(rem<<1)^((rem>>>11)*0x1F25);
      const bits=(ver<<12)|rem;
      for(let i=0;i<18;i++){const c=bit(bits,i),a=size-11+i%3,b=Math.floor(i/3);set(a,b,c);set(b,a,c)}
    }
    /* place data */
    let k=0;
    for(let right=size-1;right>=1;right-=2){
      if(right===6)right=5;
      for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){
        const x=right-j,y=(((right+1)&2)===0)?size-1-vert:vert;
        if(!fn[y][x]&&k<words.length*8){m[y][x]=bit(words[k>>>3],7-(k&7));k++}
      }
    }
    /* mask choice */
    const cond=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,
      (x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,
      (x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
    const apply=mk=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!fn[y][x]&&cond[mk](x,y))m[y][x]=!m[y][x]};
    const penalty=()=>{
      let p=0,dark=0;
      const rows=[];
      for(let y=0;y<size;y++){rows.push(m[y].map(Number));m[y].forEach(v=>{if(v)dark++})}
      for(let x=0;x<size;x++)rows.push(m.map(r=>Number(r[x])));
      rows.forEach(l=>{
        let run=1;
        for(let i=1;i<=size;i++){if(i<size&&l[i]===l[i-1])run++;else{if(run>=5)p+=run-2;run=1}}
        const s=l.join('');
        for(let i=0;i+11<=size;i++){const w=s.substr(i,11);if(w==='10111010000'||w==='00001011101')p+=40}
      });
      for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const v=m[y][x];if(v===m[y][x+1]&&v===m[y+1][x]&&v===m[y+1][x+1])p+=3}
      return p+Math.floor(Math.abs(dark*100/(size*size)-50)/5)*10;
    };
    let best=0,bestP=1e9;
    for(let mk=0;mk<8;mk++){format(mk);apply(mk);const p=penalty();if(p<bestP){bestP=p;best=mk}apply(mk)}
    format(best);apply(best);
    return m;
  }

  function svg(text,quiet=4){
    const q=encode(text);if(!q)return '';
    const n=q.length+quiet*2;let d='';
    q.forEach((row,y)=>{let x=0;while(x<row.length){
      if(row[x]){const s=x;while(x<row.length&&row[x])x++;d+=`M${s+quiet} ${y+quiet}h${x-s}v1h${s-x}z`}else x++}});
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  return {svg,encode};
})();

const app=document.getElementById('app'),back=document.getElementById('back'),search=document.getElementById('search');
const CATS=["Breakfast & Snacks","Drinks","Salads","Main Dishes","Desserts"];
const UI={
en:{summary:"Summary",search:"Search recipes or ingredients…",ingredients:"Ingredients",prep:"Preparation",know:"Good to know",by:"Recipe by ",recipe:"Recipe",add:"+ Add a recipe",edit:"Edit",del:"Delete",confirmDel:"Delete this recipe?",addTitle:"Add a recipe",editTitle:"Edit recipe",title:"Title",cat:"Category",byOpt:"Recipe by (optional)",ingLbl:"Ingredients",ingHelp:"one per line: quantity | ingredient (a line in capitals = section title)",stepsLbl:"Preparation",stepsHelp:"one step per line",notesLbl:"Good to know",notesHelp:"one note per line",save:"Save recipe",reset:"Reset to original",translating:"Translating to the other languages…",txDone:"Translated to the other languages ✓",txPartial:"Some lines could not be translated and were copied as written.",confirmReset:"Remove your changes to this recipe?",needTitle:"Please enter a title.",share:"Share",scan:"Scan to open this recipe",shareBtn:"Share link",copied:"Link copied",loading:"Loading…",notFound:"This recipe is not available.",
 cats:{}},
fr:{summary:"Sommaire",search:"Rechercher une recette ou un ingrédient…",ingredients:"Ingrédients",prep:"Préparation",know:"Bon à savoir",by:"Recette de ",recipe:"Recette",add:"+ Ajouter une recette",edit:"Modifier",del:"Supprimer",confirmDel:"Supprimer cette recette ?",addTitle:"Ajouter une recette",editTitle:"Modifier la recette",title:"Titre",cat:"Catégorie",byOpt:"Recette de (facultatif)",ingLbl:"Ingrédients",ingHelp:"un par ligne : quantité | ingrédient (une ligne en majuscules = titre de section)",stepsLbl:"Préparation",stepsHelp:"une étape par ligne",notesLbl:"Bon à savoir",notesHelp:"une note par ligne",save:"Enregistrer la recette",reset:"Rétablir l'original",translating:"Traduction vers les autres langues…",txDone:"Traduit dans les autres langues ✓",txPartial:"Certaines lignes n'ont pas pu être traduites et ont été copiées telles quelles.",confirmReset:"Annuler vos modifications de cette recette ?",needTitle:"Veuillez entrer un titre.",share:"Partager",scan:"Scanner pour ouvrir cette recette",shareBtn:"Partager le lien",copied:"Lien copié",loading:"Chargement…",notFound:"Cette recette n'est pas disponible.",
 cats:{"Breakfast & Snacks":"Déjeuners et collations","Drinks":"Boissons","Salads":"Salades","Main Dishes":"Plats principaux","Desserts":"Desserts"}},
es:{summary:"Índice",search:"Buscar recetas o ingredientes…",ingredients:"Ingredientes",prep:"Preparación",know:"Es bueno saber",by:"Receta de ",recipe:"Receta",add:"+ Agregar una receta",edit:"Editar",del:"Eliminar",confirmDel:"¿Eliminar esta receta?",addTitle:"Agregar una receta",editTitle:"Editar receta",title:"Título",cat:"Categoría",byOpt:"Receta de (opcional)",ingLbl:"Ingredientes",ingHelp:"uno por línea: cantidad | ingrediente (una línea en mayúsculas = título de sección)",stepsLbl:"Preparación",stepsHelp:"un paso por línea",notesLbl:"Es bueno saber",notesHelp:"una nota por línea",save:"Guardar receta",reset:"Restablecer original",translating:"Traduciendo a los otros idiomas…",txDone:"Traducido a los otros idiomas ✓",txPartial:"Algunas líneas no se pudieron traducir y se copiaron tal cual.",confirmReset:"¿Quitar tus cambios en esta receta?",needTitle:"Por favor escribe un título.",share:"Compartir",scan:"Escanea para abrir esta receta",shareBtn:"Compartir enlace",copied:"Enlace copiado",loading:"Cargando…",notFound:"Esta receta no está disponible.",
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
let viewOnly=false,waited=false;   // viewOnly = opened from a shared QR link: that recipe only, no editing, no other recipes
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
/* ---------- QR code / share link ---------- */
const slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const keyOf=raw=>raw.mine?raw.id:slug(raw.title);          // original recipes: English title; your own: their id
const byKey=k=>all().find(r=>r.mine?r.id===k:slug(r.title)===k)||find(k);
const linkTo=raw=>location.href.split('#')[0]+'#view/'+keyOf(raw)+'@'+lang;   // view-only link, opens in the language being viewed
function qrBlock(raw,title){
  const u=linkTo(raw),q=QR.svg(u);
  return `<div class="sub">${t('share')}</div><div class="qr">${q}${q?`<p>${t('scan')}</p>`:''}<p class="tools"><button data-share="${esc(u)}" data-title="${esc(title)}">${t('shareBtn')}</button></p></div>`}
function shareLink(u,title){
  if(navigator.share)navigator.share({title,url:u}).catch(()=>{});
  else if(navigator.clipboard)navigator.clipboard.writeText(u).then(()=>toast(t('copied'),2000),()=>{})}
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:
`.qr{text-align:center}.qr svg{display:block;width:176px;height:176px;margin:0 auto;border:1px solid #e6d3b3;border-radius:8px}
.qr p{margin:8px 0 0;color:var(--soft,#7a6a5c);font-style:italic}.qr .tools{margin-top:4px;font-style:normal}`}));

function wait(){view.name='wait';back.hidden=true;app.innerHTML=`<p class="note">${t(waited?'notFound':'loading')}</p>`}
function home(q=''){
  if(viewOnly)return wait();
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
  const r=tr(raw);view.name='show';view.id=id;back.hidden=viewOnly;
  let h=`<div class="by">${r.by?t('by')+esc(r.by):t('recipe')}</div><h1>${esc(r.title)}</h1><div class="sub">${t('ingredients')}</div><table>`;
  r.ing.forEach(([q,n])=>h+=n?`<tr><td class="q">${esc(q)}</td><td>${esc(n)}</td></tr>`:`<tr><td class="g" colspan="2">${esc(q)}</td></tr>`);
  h+=`</table>`;
  if(r.steps.length){h+=`<div class="sub">${t('prep')}</div><ol>`;r.steps.forEach((s,k)=>h+=`<li><b>${roman(k)}</b><span>${esc(s)}</span></li>`);h+=`</ol>`}
  if(r.notes&&r.notes.length)h+=`<div class="sub">${t('know')}</div>`+r.notes.map(n=>`<p class="note">${esc(n)}</p>`).join('');
  if(!viewOnly)h+=qrBlock(raw,r.title)+`<p class="tools"><button data-edit="${r.id}">${t('edit')}</button>`+(r.mine?` <button data-del="${r.id}">${t('del')}</button>`:'')+`</p>`;
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
function setLang(l,first,nosave){
  const d=(!first&&view.name==='form')?readForm($('save').dataset.id):null;
  lang=l;if(!nosave)save('lang',l);document.documentElement.lang=l;
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
  if(x.dataset.share)return shareLink(x.dataset.share,x.dataset.title);
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
  if(want){const r=byKey(want);if(r){want=null;if(!viewOnly)clearHash();show(r.id);return}}
  const y=scrollY;
  if(view.name==='home')home(search.value);else if(view.name==='show')show(view.id);
  scrollTo(0,y);
};
/* ---------- Shared links (#recipe-name@fr) ---------- */
let want=null;
const clearHash=()=>{try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}};
function route(){
  let h='';try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}
  if(!h)return;
  viewOnly=h.startsWith('view/');if(viewOnly)h=h.slice(5);
  search.style.display=viewOnly?'none':'';
  const [k,l]=h.split('@');
  if(LANGS.includes(l)&&l!==lang)setLang(l,true,true);
  const r=byKey(k);
  if(r){want=null;if(!viewOnly)clearHash();show(r.id)}   // view-only links keep their address, so a reload stays view-only
  else{want=k;if(viewOnly){wait();setTimeout(()=>{waited=true;if(view.name==='wait')wait()},10000)}}   // maybe still syncing: opened as soon as it arrives
}
addEventListener('hashchange',route);
route();
import('./sync.js').catch(e=>console.warn('sync off',e));
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');