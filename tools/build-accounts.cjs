const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/accounts');fs.mkdirSync(out,{recursive:true});
const baseline=process.argv[2]||path.join(root,'server/accounts/engine.ts');
const src=fs.readFileSync(baseline,'utf8'),marker="const sbCors={'Access-Control-Allow-Origin'";
if(src.split(marker).length>2)throw Error('Unexpected API layout; review current deployed source');
let core=src.includes(marker)?src.slice(0,src.indexOf(marker)):src;
const cwTopology=fs.readFileSync(path.join(root,'server/country-war/topology.mjs'),'utf8').replace(/^export /gm,'');
const cwBody=fs.readFileSync(path.join(root,'server/country-war/engine-body.js'),'utf8').replace('__COUNTRY_WAR_MAP__',fs.readFileSync(path.join(root,'content/country-war-map-v1.json'),'utf8'));
const cwMarker="return {dispatch(packet){if(packet?.action==='account_retire_check')";
if(!core.includes(cwMarker))throw Error('Country-war engine injection point missing');
core=core.replace(cwMarker,cwTopology+'\n'+cwBody+"\nreturn {dispatch(packet){if(packet?.action==='country_job_tick'&&packet._internalCountryJob===true){cwTick();return {ok:true};}if(/^(country_|mail_)/.test(packet?.action||''))return cwDispatch(packet);if(packet?.action==='account_retire_check')");
if(!core.includes('function createGameService(')||core.includes('export default'))throw Error('Unexpected engine source');
const g=require('./game-context.cjs')('build/live-index.html',{tutorial:true});g.run('render=()=>{};toast=()=>{};');
const classes=JSON.parse(g.run('JSON.stringify(BASES)')),starters=JSON.parse(g.run('JSON.stringify(STARTERS)')),templates={};
for(const cls of classes){const n=g.run(`clsSum(${JSON.stringify(cls)})`);const groups=n===1?starters.map(s=>[s]):starters.flatMap((s,i)=>starters.slice(i+1).map(t=>[s,t]));
 for(const selected of groups){const state=JSON.parse(g.run(`S={screen:'start',ui:{cls:${JSON.stringify(cls)},gender:'male',starters:${JSON.stringify(selected)}}};handlers.newgame();JSON.stringify(S);`));delete state.P.code;delete state.P.pid;delete state.P.cpin;templates[cls+'|'+selected.slice().sort().join(',')]=state;}}
const templateCode=`const accountTemplates=${JSON.stringify(templates)};function accountNewCharacter(p){const key=p.cls+'|'+(Array.isArray(p.starters)?p.starters.slice().sort().join(','):'');const t=accountTemplates[key];if(!t)throw Error('bad_new_character');const d=structuredClone(t);d.P.name=p.name;d.P.gender=p.gender;if(p.country)d.P.country=p.country;return d;}`;
const gateway=['gateway.mjs','token-owner.mjs'].map(f=>fs.readFileSync(path.join(root,'server/accounts',f),'utf8').replace(/^export /gm,'')).join('\n');
const endpoint=`
const accountCors={'Access-Control-Allow-Origin':'https://gusgoat.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-soulbeast-environment','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store','Vary':'Origin'};
const accountReply=(value,status=200)=>Response.json(value,{status,headers:accountCors});
const accountHandler=withSupabase({auth:'none'},async(req,ctx)=>{
 if(req.method!=='POST')return accountReply({ok:false,error:'method_not_allowed'},405);
 const job=req.headers.get('x-country-war-job');
 if(job){const secret=globalThis.Deno?.env?.get('SB_COUNTRY_WAR_JOB_SECRET');if(!secret||!sbEqual(job,secret))return accountReply({ok:false,error:'unauthorized'},401);try{const body=await req.json(),env=body.environment||'test';if(!['test','live'].includes(env))throw Error('bad environment');for(let attempt=0;attempt<5;attempt++){const request='country-week-'+env+'-'+new Date().toISOString().slice(0,16)+'-'+attempt;const snap=await ctx.supabaseAdmin.rpc('sb_engine_snapshot',{p_env:env,p_request:request,p_code:''});if(snap.error||snap.data?.mode!==env)throw Error('database unavailable');if(snap.data.receipt)return accountReply(snap.data.receipt.result);const book=createWorkbook(snap.data.tables);createEngine(book,createUtilities(s=>sha256(new TextEncoder().encode(s)),()=>crypto.randomUUID())).dispatch({action:'country_job_tick',_internalCountryJob:true});const result=await ctx.supabaseAdmin.rpc('sb_engine_commit',{p_env:env,p_expected:snap.data.revision,p_request:request,p_digest:sbHash(request),p_changes:book.changes(),p_result:{ok:true}});if(result.error)throw Error('database unavailable');if(result.data.conflict)continue;if(result.data.error)throw Error(result.data.error);return accountReply({ok:true});}throw Error('busy');}catch{return accountReply({ok:false,error:'country_job_failed'},503);}}
 const bearer=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!bearer)return accountReply({ok:false,error:'login_required'},401);
 const {data,error}=await ctx.supabaseAdmin.auth.getUser(bearer),user=data?.user;
 if(error||!user)return accountReply({ok:false,error:'login_required'},401);
 if(!user.email_confirmed_at)return accountReply({ok:false,error:'verified_account_required'},403);
 try{
 const text=await req.text();if(new TextEncoder().encode(text).length>600000)return accountReply({ok:false,error:'too_big'},413);
 const body=JSON.parse(text),env=req.headers.get('x-soulbeast-environment')||'test';
 const command=async(action,account,environment,packet)=>{const r=await ctx.supabaseAdmin.rpc('sb_player_account_command',{p_action:action,p_account:account,p_env:environment,p_data:packet});if(r.error)throw Error(['character_not_owned','request_payload_changed','character_limit','character_deleted'].find(x=>r.error.message?.includes(x))||'account_database_unavailable');return r.data;};
 const execute=(packet,environment)=>createGameService({rpc:(name,args)=>ctx.supabaseAdmin.rpc(name,args),engineFactory:accountEngineFactory(createEngine,sbHash,{request:packet})})(packet,environment);
 const syncName=async(account,environment,code,name,renamedAt)=>{const r=await ctx.supabaseAdmin.rpc('sb_player_sync_name',{p_account:account,p_env:environment,p_code:code,p_name:name,p_renamed_at:renamedAt});if(r.error)throw Error('profile_sync_unavailable');};
 return accountReply(await accountGateway({command,execute,hash:sbHash,makeCharacter:accountNewCharacter,syncName})(user,body,env));
 }catch(e){const known=['character_not_owned','request_payload_changed','character_limit','bad_request_id','bad_new_character','character_create_retry','account_action_not_supported','verified_account_required','bad_data','character_deleted','delete_confirmation_required','finish other battle'];const error=known.includes(e.message)?e.message:'account_service_unavailable';return accountReply({ok:false,error},error==='character_not_owned'?403:known.includes(error)?400:503);}
});
export default {async fetch(req){const response=req.method==='OPTIONS'?new Response(null,{status:204,headers:accountCors}):await accountHandler(req);const headers=new Headers(response.headers);if(req.headers.get('origin')==='https://localhost')headers.set('Access-Control-Allow-Origin','https://localhost');return new Response(response.body,{status:response.status,headers});}};
`;
fs.writeFileSync(path.join(out,'index.ts'),core+'\n'+templateCode+'\n'+gateway+'\n'+endpoint);
fs.copyFileSync(path.join(root,'server/accounts/001-accounts.sql'),path.join(out,'001-accounts.sql'));
fs.copyFileSync(path.join(root,'server/accounts/002-character-management.sql'),path.join(out,'002-character-management.sql'));
fs.copyFileSync(path.join(root,'server/accounts/003-character-names.sql'),path.join(out,'003-character-names.sql'));
for(const file of ['004-test-capacity.sql','005-character-summaries.sql'])fs.copyFileSync(path.join(root,'server/accounts',file),path.join(out,file));
fs.copyFileSync(path.join(root,'server/country-war/001-weekly-schedule.sql'),path.join(out,'country-war-weekly-schedule.sql'));
fs.copyFileSync(path.join(root,'server/country-war/DEPLOYMENT.txt'),path.join(out,'country-war-deployment.txt'));
console.log('Built account gateway with country-war engine SHA256 '+crypto.createHash('sha256').update(core).digest('hex'));
