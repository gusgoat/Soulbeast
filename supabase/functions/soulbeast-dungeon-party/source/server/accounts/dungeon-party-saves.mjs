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
  const rows=new Map(found.rows.map(({r})=>[r[0],r]));
  if(found.rows.length!==codes.length||rows.size!==codes.length)throw Error('server_save_missing');
  return rows;
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
  async persist(tx,{environment,roomId,serverNow,deferCode,flushCode,flushAll,stageAccountWrite},room,participants){
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
   const changed=[...deferred,...dirty];
   if(!changed.length)return pendingChanged;
   const rows=await read(tx,environment,changed.map(({member})=>member.code));
   const replacements=[];
   for(const {member,nextDigest} of changed){
    const previous=rows.get(member.code);
    if(await digest(decodePartySave(previous))!==member.saveDigest)throw Error('party_save_conflict');
    const next=encodePartySave(previous,member.save,serverNow);
    if(member.code===deferCode){
     member.pendingSaveDigest=nextDigest;
     pendingChanged=true;
    }else{
     replacements.push({code:member.code,previous,next});
     member.saveDigest=nextDigest;
     clearPending(member);
    }
   }
   if(replacements.length){
    const payload=JSON.stringify(replacements);
    const write=async()=>{
     await tx.query("select set_config('soulbeast.party_writer',$1,true)",[roomId]);
     // All legacy writers acquire the world revision first. The transaction's
     // lock timeout bounds the wait without making every contending room retry.
     const control=await tx.query('update public.sb_engine_control set revision=revision+1 where environment=$1 and mode=$1',[environment]);
     if(control.rowCount!==1)throw Error('world_not_ready');
     // Recheck the exact rows read before locking. Preserve order, metadata and
     // other players' latest saves, even if another room committed in between.
     const saved=await tx.query(`with changes as materialized (
       select * from jsonb_to_recordset($2::jsonb) as c(code text,previous jsonb,next jsonb)
      )
      update public.sb_engine_tables t set rows=(
       select jsonb_agg(coalesce(c.next,e.r) order by e.i)
       from jsonb_array_elements(t.rows) with ordinality e(r,i)
       left join changes c on c.code=e.r->>0
      ) where t.environment=$1 and t.name='Saves' and (
       select count(*)=count(*) filter(where e.r=c.previous) and count(*)=$3 and count(distinct c.code)=$3
       from jsonb_array_elements(t.rows) e(r) join changes c on c.code=e.r->>0
      )`,[environment,payload,replacements.length]);
     if(saved.rowCount!==1)throw Error('party_save_conflict');
    };
    if(stageAccountWrite)stageAccountWrite(write);else await write();
   }
   return pendingChanged;
  }
 };
}
