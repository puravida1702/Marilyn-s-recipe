// Shares added / edited recipes between all phones using a Firebase Realtime Database (plain web requests, no key needed).
const DB='https://marilyn-s-recipe-default-rtdb.firebaseio.com';
const KINDS=['custom','ovr'];
const url=p=>`${DB}/${p}.json`;
let pending=0,busy=false;const last={},first={custom:true,ovr:true};

window.Cloud={
  put:(kind,id,obj)=>{pending++;return fetch(url(kind+'/'+id),{method:'PUT',body:JSON.stringify(JSON.stringify(obj))})
    .catch(e=>console.warn(e)).finally(()=>{pending--;poll()})},
  del:(kind,id)=>{pending++;return fetch(url(kind+'/'+id),{method:'DELETE'})
    .catch(e=>console.warn(e)).finally(()=>{pending--;poll()})}
};

async function pull(kind){
  const r=await fetch(url(kind));if(!r.ok)return;
  const v=(await r.json())||{},map={};
  for(const id in v){try{map[id]=JSON.parse(v[id])}catch(e){}}
  if(first[kind]){
    first[kind]=false;
    // one time: send what was already saved on this phone before sync existed
    if(!localStorage.getItem('synced_'+kind)){
      const loc=window.localData?window.localData(kind):{};
      for(const id in loc)if(!(id in map)){window.Cloud.put(kind,id,loc[id]);map[id]=loc[id]}
      localStorage.setItem('synced_'+kind,'1');
    }
  }
  const s=JSON.stringify(map);
  if(s!==last[kind]){last[kind]=s;if(window.onCloudData)window.onCloudData(kind,map)}
}
async function poll(){
  if(busy||pending)return;busy=true;
  try{for(const k of KINDS)await pull(k)}catch(e){console.warn('sync',e)}
  busy=false;
}
poll();
setInterval(poll,10000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
addEventListener('online',poll);
