// Reuses the current authoritative game engine; every character is authorized before dispatch.
export function accountGateway({command,execute,hash,makeCharacter,uuid=()=>crypto.randomUUID()}){
 const safe=c=>({code:c.code,name:c.name,cls:c.class_id,lv:c.level,status:c.status});
 const fail=message=>{throw Error(message);};
 const materialize=async(c,env,user)=>{
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
   for(const c of chars)out.push(safe(await materialize(c,env,user)));
   return {ok:true,email:user.email,characters:out};
  }
  if(body.action==='account_create'){
   if(!/^[a-f0-9-]{36}$/i.test(body.request_id||''))fail('bad_request_id');
   const P=body.data?.P;
   if(!P||!['male','female'].includes(P.gender)||typeof P.name!=='string'||!P.name.trim()||P.name.length>20)fail('bad_new_character');
   // Stats, items, gold and pets are rebuilt from canonical starting templates, never granted from a submitted save.
   const d=makeCharacter({name:P.name.trim(),cls:P.cls,gender:P.gender,starters:P.pets?.map(p=>p.sp)});
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
  if(c.status!=='active')fail('character_not_ready');
  if(body.newPin!=null||body.action==='delete')fail('account_action_not_supported');
  return execute({...body,code,pin:c.engine_pin},env);
 };
}
