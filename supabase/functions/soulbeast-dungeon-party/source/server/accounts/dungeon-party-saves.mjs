const chunkSize=44995;
const encoder=new TextEncoder();
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(stable(value))))),b=>b.toString(16).padStart(2,'0')).join('');}
export function decodePartySave(row){
 const parts=row.slice(6).map(v=>String(v||''));
 const text=parts[0]?.startsWith('SB64:')?new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(parts.map(p=>p.slice(5)).join('')),c=>c.charCodeAt(0))):parts.join('');
 const save=JSON.parse(text);
 if(!save?.P||save.P.code!==row[0])throw Error('invalid_server_save');
 return save;
}
export function encodePartySave(row,save,serverNow){
 if(save?.P?.code!==row[0])throw Error('save_identity_changed');
 const bytes=encoder.encode(JSON.stringify(save));let binary='';
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 const encoded=btoa(binary);if(encoded.length>chunkSize*5)throw Error('save_inventory_full');
 const copy=row.slice(0,6);
 copy[5]=new Date(Math.max(serverNow,Date.parse(row[5]) + 1||0)).toISOString();
 return [...copy,...Array.from({length:5},(_,i)=>'SB64:'+encoded.slice(i*chunkSize,(i+1)*chunkSize))];
}
export function partySaveRepository({engine,spawnPoint}){
 async function read(tx,environment,codes){
  const found=await tx.query(`select e.r from public.sb_engine_tables t cross join lateral jsonb_array_elements(t.rows) e(r)
   where t.environment=$1 and t.name='Saves' and e.r->>0=any($2::text[])`,[environment,codes]);
  if(found.rows.length!==codes.length)throw Error('server_save_missing');
  return new Map(found.rows.map(({r})=>[r[0],r]));
 }
 return {
  async initialize(tx,{environment,codes,floor}){
   const rows=await read(tx,environment,codes),members=[];
   for(const code of codes){
    const save=decodePartySave(rows.get(code)),p=save.P;
    if(save.battle)throw Error('finish_other_battle');
    const team=engine.team(p,code,members.length),hero=team.team[0];
    if(hero.hp<=0)throw Error('player_defeated');
    members.push({code,name:p.name,cls:p.cls,level:p.lv,gender:p.gender,country:p.country,
     hp:hero.hp,mp:hero.mp,maxHp:hero.st.hp,maxMp:hero.st.mp,ailments:structuredClone(p.ailments||{}),
     exploring:true,position:await spawnPoint(floor,code),save,saveDigest:await digest(save)});
   }
   return {members};
  },
  async persist(tx,{environment,roomId,serverNow,deferCode,flushCode,flushAll,background},room,participants){
   // Only dirty saves take the legacy engine lock. It is also the lock used by
   // existing account commits; bump its revision so stale snapshots retry.
   const dirty=[],deferred=[];
   let pendingChanged=false;
   const clearPending=member=>{
    if(member.pendingSaveDigest){delete member.pendingSaveDigest;pendingChanged=true;}
   };
   for(const member of participants){
    const p=member.save?.P;if(!p)throw Error('server_save_required');
    Object.assign(p,{hp:member.hp,mp:member.mp,ailments:structuredClone(member.ailments||{})});
    const nextDigest=await digest(member.save);
    if(member.pendingSaveDigest&&nextDigest===member.pendingSaveDigest&&!flushAll&&member.code!==flushCode)continue;
    if(nextDigest===member.saveDigest){clearPending(member);continue;}
    (member.code===deferCode?deferred:dirty).push({member,nextDigest});
   }
   if(deferred.length){
    const rows=await read(tx,environment,deferred.map(({member})=>member.code));
    for(const {member,nextDigest} of deferred){
     const old=rows.get(member.code);
     if(await digest(decodePartySave(old))!==member.saveDigest)throw Error('party_save_conflict');
     encodePartySave(old,member.save,serverNow); // Check the account save fits before confirming the result.
     member.pendingSaveDigest=nextDigest;
     pendingChanged=true;
    }
   }
   if(!dirty.length)return pendingChanged;
   const control=await tx.query('select mode from public.sb_engine_control where environment=$1 for update'+(background?' nowait':''),[environment]);
   if(control.rows[0]?.mode!==environment)throw Error('world_not_ready');
   const rows=await read(tx,environment,dirty.map(({member})=>member.code));
   await tx.query("select set_config('soulbeast.party_writer',$1,true)",[roomId]);
   for(const {member,nextDigest} of dirty){
    const old=rows.get(member.code);
    if(await digest(decodePartySave(old))!==member.saveDigest)throw Error('party_save_conflict');
    const next=encodePartySave(old,member.save,serverNow);
    await tx.query(`update public.sb_engine_tables set rows=(select jsonb_agg(case when e.r->>0=$2 then $3::jsonb else e.r end order by e.i)
     from jsonb_array_elements(rows) with ordinality e(r,i)) where environment=$1 and name='Saves'`,[environment,member.code,JSON.stringify(next)]);
    member.saveDigest=nextDigest;
    clearPending(member);
   }
   await tx.query('update public.sb_engine_control set revision=revision+1 where environment=$1',[environment]);
   return pendingChanged;
  }
 };
}
