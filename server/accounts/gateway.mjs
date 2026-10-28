// Reuses the current authoritative game engine; every character is authorized before dispatch.
export function accountGateway({command,execute,hash,makeCharacter,syncName=async()=>{},uuid=()=>crypto.randomUUID()}){
 const safe=c=>({code:c.code,name:c.name,cls:c.class_id,lv:c.level,status:c.status,...(c.class_label?{className:c.class_label}:{}),...(['male','female'].includes(c.gender)?{gender:c.gender}:{})});
 const fail=message=>{throw Error(message);};
 const profile=async(c,result,env,user)=>{
  if(!result?.ok)return c;
  let player;try{player=JSON.parse(result.data||'null')?.P;}catch{}
  const name=result.account?.name||player?.name;
  if(typeof name!=='string'||!name.trim())return c;
  const renamedAt=Number(result.account?.renameAt||player?.renameAt||0);
  // Only authoritative engine output reaches the service-only registry update.
  // A projection failure must not turn a committed rename into a failed rename.
  try{await syncName(user.id,env,c.code,name,renamedAt);}catch{}
  return {...c,name};
 };
 const materialize=async(c,env,user)=>{
  if(c.status==='deleted')fail('character_deleted');
  if(c.status==='active')return c;
  const data=structuredClone(c.draft);data.P.code=c.code;delete data.P.cpin;
  const r=await execute({action:'save',code:c.code,pin:c.engine_pin,data:JSON.stringify(data),name:data.P.name,lv:3,_sbRequest:c.request_id},env);
  if(!r.ok)fail(r.error||'character_create_failed');
  await command('activate',user.id,env,{code:c.code});return {...c,status:'active'};
 };
 return async(user,body,env)=>{
  if(!user?.id||!user.email_confirmed_at)fail('verified_account_required');
  if(!['test','live'].includes(env)||!body||typeof body!=='object'||Array.isArray(body))fail('bad_data');
  if(body.action==='account_list'){
   const chars=await command('list',user.id,env,{}),out=[];
   for(const c of chars.filter(c=>c.status!=='deleted')){
    const active=await materialize(c,env,user);
    out.push(safe(active));
   }
   const capacity=await command('capacity',user.id,env,{});
   return {ok:true,email:user.email,characters:out,characterLimit:capacity.limit||5,slotsUsed:capacity.used};
  }
  if(body.action==='account_create'){
   if(!/^[a-f0-9-]{36}$/i.test(body.request_id||''))fail('bad_request_id');
   const P=body.data?.P;
   if(P?.country!=null&&!['blue','green','red'].includes(P.country))fail('bad_new_character');
   if(!P||!['male','female'].includes(P.gender)||typeof P.name!=='string'||!P.name.trim()||P.name.length>20)fail('bad_new_character');
   // Stats, items, gold and pets are rebuilt from canonical starting templates, never granted from a submitted save.
   const d=makeCharacter({name:P.name.trim(),cls:P.cls,gender:P.gender,country:P.country,starters:P.pets?.map(p=>p.sp)});
   const code=uuid().replaceAll('-','').slice(0,16).toUpperCase(),engine_pin=uuid().replaceAll('-','').slice(0,12);
   // A random collision with any legacy save must never claim or overwrite it.
   const probe=await execute({action:'load',code,pin:engine_pin,_sbRequest:uuid()},env);
   if(probe.ok||probe.error!=='notfound')fail('character_create_retry');
   const c=await command('reserve',user.id,env,{code,engine_pin,request_id:body.request_id,digest:hash(JSON.stringify(d)),draft:d});
   const active=await materialize(c,env,user);
   return {ok:true,character:safe(active)};
  }
  // PINs are generated on the server and never returned to a browser. A code or PvP token alone is insufficient.
  const code=String(body.code||'').toUpperCase();
  if(!/^[A-Z0-9]{16}$/.test(code))fail('character_not_owned');
  const c=await command('get',user.id,env,{code});
  if(body.action==='account_delete'){
   if(body.confirm!==true)fail('delete_confirmation_required');
   if(c.status==='deleted'){await execute({action:'country_retire',code,pin:c.engine_pin,_countryRetire:true},env);return {ok:true,code,deleted:true};}
   const check=await execute({action:'account_retire_check',code,pin:c.engine_pin,_sbRequest:uuid()},env);
   if(!check.ok)fail(check.error||'finish other battle');
   await command('delete',user.id,env,{code});await execute({action:'country_retire',code,pin:c.engine_pin,_countryRetire:true},env);return {ok:true,code,deleted:true};
  }
  if(c.status==='deleted')fail('character_deleted');
  if(c.status!=='active')fail('character_not_ready');
  if(body.newPin!=null||body._countryRetire!=null||body._internalCountryJob!=null||body.action==='country_job_tick'||body.action==='delete')fail('account_action_not_supported');
  const result=await execute({...body,code,pin:c.engine_pin},env);
  if(['camp_profile','load','save'].includes(body.action))await profile(c,result,env,user);
  return result;
 };
}
