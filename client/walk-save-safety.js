(function(root){'use strict';
 const contextKey='soulbeast-online-walk-v1',playerKey='soulbeast-walk-preview-player-v1';
 const transient=new Set(['gsAt','cpin','walkId']);
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
 const clean=p=>Object.fromEntries(Object.entries(p||{}).filter(([k])=>!transient.has(k)));
 const copy=v=>v===undefined?undefined:structuredClone(v);
 function mergeWalkPlayer(base,local,remote){
  const conflicts=[];
  function merge(a,b,c,path){
   if(path==='walkTutorialSeen')return Object.fromEntries([a,b,c].flatMap(v=>Object.entries(v||{})).filter(([,seen])=>seen===true));
   if(equal(b,c))return copy(b);if(equal(a,b))return copy(c);if(equal(a,c))return copy(b);
   if(path==='pets'&&[a,b,c].every(v=>Array.isArray(v)&&v.every(p=>p&&Number.isSafeInteger(p.uid))&&new Set(v.map(p=>p.uid)).size===v.length)){
    const maps=[a,b,c].map(v=>new Map(v.map(p=>[p.uid,p]))),out=[];
    for(const id of new Set([...c.map(p=>p.uid),...b.map(p=>p.uid),...a.map(p=>p.uid)])){
     const value=merge(...maps.map(m=>m.get(id)),path+'.'+id);if(value!==undefined)out.push(value);
    }return out;
   }
   const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
   if(object(a)&&object(b)&&object(c)){
    const out={};for(const k of new Set([...Object.keys(a),...Object.keys(b),...Object.keys(c)])){
     const value=merge(a[k],b[k],c[k],path?path+'.'+k:k);if(value!==undefined)out[k]=value;
    }return out;
   }
   conflicts.push(path);return undefined;
  }
  const player=merge(clean(base),clean(local),clean(remote),'');
  const tutorial=[base?.walkTutorialSeen,local?.walkTutorialSeen,remote?.walkTutorialSeen];
  if(player&&tutorial.some(Boolean))player.walkTutorialSeen=merge(...tutorial,'walkTutorialSeen');
  return conflicts.length?{ok:false,conflicts}:{ok:true,player};
 }
 const backupKey=c=>'soulbeast_unsaved_walk_v2:'+c.environment+':'+c.owner+':'+c.code;
 function backups(storage,context){try{return JSON.parse(storage.getItem(backupKey(context))||'[]');}catch{return [];}}
 function backupWalkDraft(storage,context,player,reason='save'){
  try{
   if(!storage||!context?.owner||!context.code||player?.code!==context.code||!context.snapshot?.P)return false;
   const rows=backups(storage,context),data=clean(player),basePlayer=clean(context.snapshot.P);
   if(equal(data,basePlayer)&&!context.request)return false;
   if(rows.some(r=>equal(r.player,data)&&equal(r.basePlayer,basePlayer)))return true;
   rows.push({at:Date.now(),environment:context.environment,owner:context.owner,code:context.code,revision:context.revision,reason,player:data,basePlayer});
   const highest=rows.reduce((a,b)=>Number(b.player?.lv)>Number(a.player?.lv)?b:a),recent=rows.slice(-3);
   if(!recent.includes(highest))recent.unshift(highest);
   storage.setItem(backupKey(context),JSON.stringify(recent));return true;
  }catch{return false;}
 }
 function backupActiveWalk(storage,session,reason){try{return backupWalkDraft(storage,JSON.parse(session.getItem(contextKey)||'null'),JSON.parse(session.getItem(playerKey)||'null'),reason);}catch{return false;}}
 root.WalkSaveSafety={clean,equal,mergeWalkPlayer,backupKey,backups,backupWalkDraft,backupActiveWalk};
})(globalThis);
