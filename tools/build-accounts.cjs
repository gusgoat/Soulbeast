const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/accounts');fs.mkdirSync(out,{recursive:true});
const baseline=process.argv[2]||path.join(root,'server/accounts/engine.ts');
const src=fs.readFileSync(baseline,'utf8'),marker="const sbCors={'Access-Control-Allow-Origin'";
if(src.split(marker).length>2)throw Error('Unexpected API layout; review current deployed source');
const core=src.includes(marker)?src.slice(0,src.indexOf(marker)):src;
if(!core.includes('function createGameService(')||core.includes('export default'))throw Error('Unexpected engine source');
const g=require('./game-context.cjs')('build/live-index.html',{tutorial:true});g.run('render=()=>{};toast=()=>{};');
const classes=JSON.parse(g.run('JSON.stringify(BASES)')),starters=JSON.parse(g.run('JSON.stringify(STARTERS)')),templates={};
for(const cls of classes){const n=g.run(`clsSum(${JSON.stringify(cls)})`);const groups=n===1?starters.map(s=>[s]):starters.flatMap((s,i)=>starters.slice(i+1).map(t=>[s,t]));
 for(const selected of groups){const state=JSON.parse(g.run(`S={screen:'start',ui:{cls:${JSON.stringify(cls)},gender:'male',starters:${JSON.stringify(selected)}}};handlers.newgame();JSON.stringify(S);`));delete state.P.code;delete state.P.pid;delete state.P.cpin;templates[cls+'|'+selected.slice().sort().join(',')]=state;}}
const templateCode=`const accountTemplates=${JSON.stringify(templates)};function accountNewCharacter(p){const key=p.cls+'|'+(Array.isArray(p.starters)?p.starters.slice().sort().join(','):'');const t=accountTemplates[key];if(!t)throw Error('bad_new_character');const d=structuredClone(t);d.P.name=p.name;d.P.gender=p.gender;return d;}`;
const gateway=['gateway.mjs','token-owner.mjs'].map(f=>fs.readFileSync(path.join(root,'server/accounts',f),'utf8').replace(/^export /gm,'')).join('\n');
const endpoint=`
const accountCors={'Access-Control-Allow-Origin':'https://gusgoat.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-soulbeast-environment','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'};
const accountReply=(value,status=200)=>Response.json(value,{status,headers:accountCors});
const accountHandler=withSupabase({auth:'none'},async(req,ctx)=>{
 if(req.method!=='POST')return accountReply({ok:false,error:'method_not_allowed'},405);
 const bearer=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!bearer)return accountReply({ok:false,error:'login_required'},401);
 const {data,error}=await ctx.supabaseAdmin.auth.getUser(bearer),user=data?.user;
 if(error||!user)return accountReply({ok:false,error:'login_required'},401);
 if(!user.email_confirmed_at)return accountReply({ok:false,error:'verified_account_required'},403);
 try{
 const text=await req.text();if(new TextEncoder().encode(text).length>600000)return accountReply({ok:false,error:'too_big'},413);
 const body=JSON.parse(text),env=req.headers.get('x-soulbeast-environment')||'test';
 const command=async(action,account,environment,packet)=>{const r=await ctx.supabaseAdmin.rpc('sb_player_account_command',{p_action:action,p_account:account,p_env:environment,p_data:packet});if(r.error)throw Error(['character_not_owned','request_payload_changed','character_limit'].find(x=>r.error.message?.includes(x))||'account_database_unavailable');return r.data;};
 const execute=createGameService({rpc:(name,args)=>ctx.supabaseAdmin.rpc(name,args),engineFactory:accountEngineFactory(createEngine,sbHash)});
 return accountReply(await accountGateway({command,execute,hash:sbHash,makeCharacter:accountNewCharacter})(user,body,env));
 }catch(e){const known=['character_not_owned','request_payload_changed','character_limit','bad_request_id','bad_new_character','character_create_retry','account_action_not_supported','verified_account_required','bad_data'];const error=known.includes(e.message)?e.message:'account_service_unavailable';return accountReply({ok:false,error},error==='character_not_owned'?403:known.includes(error)?400:503);}
});
export default {async fetch(req){if(req.method==='OPTIONS')return new Response(null,{status:204,headers:accountCors});return accountHandler(req);}};
`;
fs.writeFileSync(path.join(out,'index.ts'),core+'\n'+templateCode+'\n'+gateway+'\n'+endpoint);
fs.copyFileSync(path.join(root,'server/accounts/001-accounts.sql'),path.join(out,'001-accounts.sql'));
console.log('Built account gateway with unchanged engine SHA256 '+crypto.createHash('sha256').update(core).digest('hex'));
