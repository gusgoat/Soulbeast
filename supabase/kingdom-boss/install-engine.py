"""Add the kingdom boss handlers to the generated Supabase account function."""
from pathlib import Path
import sys

base = Path(__file__).parent
target = Path(sys.argv[1])
src = target.read_bytes().decode('utf-8')
crlf = '\r\n' in src
src = src.replace('\r\n', '\n')

def replace(old, new):
    global src
    if src.count(old) != 1:
        raise ValueError(f'Account engine anchor did not match exactly once: {old[:90]}')
    src = src.replace(old, new, 1)

if '/* KINGDOM_BOSS_RULES_START */' in src:
    raise ValueError('Use the pristine account function source as input.')
rules = '\n'.join(line.removeprefix('export ') for line in (base/'rules.mjs').read_text(encoding='utf-8').splitlines())
body = (base/'engine-body.js').read_text(encoding='utf-8').replace('__KINGDOM_BOSS_POINTS__', (base/'spawn-points.json').read_text(encoding='utf-8').strip())
marker = 'return {dispatch(packet){if(['
replace(marker, '/* KINGDOM_BOSS_ENGINE_START */\n' + body + '\n/* KINGDOM_BOSS_ENGINE_END */\nreturn {dispatch(packet){if(/^kingdom_boss_(tick|move|poll|leave)$/.test(packet?.action||\'\'))return kbDispatch(packet);if([')
replace('const SB_TABLES=', '/* KINGDOM_BOSS_RULES_START */\n'+rules+'\n/* KINGDOM_BOSS_RULES_END */\nconst SB_TABLES=')
replace('const digest=hash(sbStable(packet));', '''const digest=hash(sbStable(packet));
  const kbAction=/^kingdom_boss_(tick|move|poll|leave)$/.test(action);
  const kbInternal=action==='kingdom_boss_tick'&&packet?._kbInternal===true;''')
replace("await call('sb_engine_snapshot',{", "await call(kbAction?'sb_kingdom_boss_snapshot':'sb_engine_snapshot',{")
replace('if(packet!==null&&!tokenAuth){','if(packet!==null&&!tokenAuth&&!kbInternal){')
replace('if(result.ok&&code.length>=12&&!tokenAuth){','if(result.ok&&code.length>=12&&!tokenAuth&&!kbAction){')
replace('const changes=workbook.changes();', '''const changes=workbook.changes();
   if(kbAction&&Object.keys(changes).some(name=>name!=='GuildState'))throw Error('unexpected_kingdom_boss_write');''')
replace("if(body.newPin!=null||body._countryRetire!=null", "if(body._kbInternal!=null||body._kbTesting!=null||body.action==='kingdom_boss_tick'||body.newPin!=null||body._countryRetire!=null")
replace("if(!user.email_confirmed_at)return accountReply({ok:false,error:'verified_account_required'},403);", '''if(!user.email_confirmed_at)return accountReply({ok:false,error:'verified_account_required'},403);
 const env=req.headers.get('x-soulbeast-environment')||'test';
 if(!['live','test'].includes(env))return accountReply({ok:false,error:'bad_environment'},400);
 const text=await req.text();if(new TextEncoder().encode(text).length>600000)return accountReply({ok:false,error:'too_big'},413);
 let body;try{body=JSON.parse(text);}catch{return accountReply({ok:false,error:'bad_data'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return accountReply({ok:false,error:'bad_data'},400);
 const engine=packet=>createGameService({rpc:(name,args)=>ctx.supabaseAdmin.rpc(name,args),engineFactory:accountEngineFactory(createEngine,sbHash,{request:packet})})(packet,env);
 const feed=async()=>{const r=await ctx.supabaseAdmin.rpc('sb_kingdom_boss_feed',{p_env:env});if(r.error||!r.data)throw Error('database_unavailable');return r.data;};
 if(body.action==='kingdom_boss_status'){
  try{
   const cfg=await feed(),now=Number(cfg.serverTime),testing=cfg.testing===true;
   if(!cfg.enabled)return accountReply({ok:true,enabled:false,serverTime:now});
   const slot=kingdomBossWindow(now,testing);let event=cfg.event;
   if(slot&&event?.id!==String(slot.start)&&!(event?.status==='active'&&now<event.end)){
    const result=await engine({action:'kingdom_boss_tick',_kbInternal:true,_kbTesting:testing,_sbRequest:'kb-start-'+slot.start});
    if(!result.ok)throw Error(result.error);event=result.event;
   }
   if(event?.status==='active'&&now>=event.end)event={...event,status:'expired'};
   if(event&&now>event.end+1800000)event=null;
   return accountReply({ok:true,enabled:true,event,serverTime:now,nextStart:kingdomBossNextStart(now,testing),hours:KINGDOM_BOSS_HOURS[testing?'testing':'normal']});
  }catch{return accountReply({ok:false,error:'kingdom_boss_unavailable'},503);}
 }''')
replace("const text=await req.text();if(new TextEncoder().encode(text).length>600000)return accountReply({ok:false,error:'too_big'},413);\n const body=JSON.parse(text),env=req.headers.get('x-soulbeast-environment')||'test';", '''let kbConfig=null;
 if(/^kingdom_boss_(move|poll|leave)$/.test(body.action||'')){
  kbConfig=await feed();if(!kbConfig.enabled)return accountReply({ok:false,error:'kingdom_boss_disabled'},409);
 }''')
replace("const execute=(packet,environment)=>createGameService({rpc:(name,args)=>ctx.supabaseAdmin.rpc(name,args),engineFactory:accountEngineFactory(createEngine,sbHash,{request:packet})})(packet,environment);", "const execute=packet=>engine(kbConfig?{...packet,_kbTesting:kbConfig.testing===true}:packet);")

target.write_bytes((src.replace('\n','\r\n') if crlf else src).encode('utf-8'))
