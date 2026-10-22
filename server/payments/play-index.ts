import {withSupabase} from 'jsr:@supabase/server@^1';
/* PLAY_MODULES */
const PLAY_CATALOG=/* PLAY_CATALOG */;
const PACKAGE='com.soulbeastgame.app';
const allowed=['https://localhost','https://gusgoat.github.io'];
const accountHandler=withSupabase({auth:'none'},async(req,ctx)=>{
 try{
  if(req.method!=='POST')return Response.json({ok:false,error:'method_not_allowed'},{status:405});
  const bearer=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!bearer)return Response.json({ok:false,error:'login_required'},{status:401});
  const {data,error}=await ctx.supabaseAdmin.auth.getUser(bearer),user=data?.user;
  if(error||!user?.email_confirmed_at)return Response.json({ok:false,error:'verified_account_required'},{status:401});
  const raw=await req.text();if(raw.length>16384)return Response.json({ok:false,error:'body_too_large'},{status:413});const body=JSON.parse(raw);
  const rpc=async(name,args)=>{const r=await ctx.supabaseAdmin.rpc(name,args);if(r.error){const known=['promotion_unavailable','character_not_owned','request_changed','order_not_found','order_rate_limit','purchase_token_changed','invalid_purchase_binding','grant_required'].find(c=>String(r.error.message).includes(c));throw Error(known||'billing_database_unavailable');}return r.data;};
  const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');
  const enabled=Deno.env.get('SB_PLAY_TEST_ENABLED')==='true';
  const provider=enabled?googlePlayProvider({credentials:JSON.parse(Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')||'null'),packageName:PACKAGE}):null;
  const service=playBillingService({enabled,packageName:PACKAGE,catalog:PLAY_CATALOG,hash:digest,
   command:(action,account,value)=>rpc('sb_play_test_command',{p_action:action,p_account:account,p_data:value}),
   snapshot:code=>rpc('sb_engine_snapshot',{p_env:'test',p_request:crypto.randomUUID(),p_code:code}),
   google:provider?{...provider,verify:verifyPlayPurchase}:null});
  return Response.json(await service(user,body));
 }catch(e){const known=['play_billing_disabled','bad_order','bad_billing_action','bad_purchase_token','wrong_payment_provider','invalid_google_play_purchase','live_play_purchase_forbidden','purchase_already_consumed','purchase_token_changed','promotion_unavailable','character_not_owned','request_changed','order_not_found','order_rate_limit','coupon_account_unavailable','invalid_coupon_balance','billing_busy_retry','play_credentials_missing','play_authorization_failed','google_play_verification_failed','billing_database_unavailable','test_environment_required'];const code=known.includes(e.message)?e.message:'play_service_unavailable';return Response.json({ok:false,error:code},{status:code==='play_billing_disabled'?503:known.includes(code)?409:503});}
});
export default {async fetch(req){const origin=req.headers.get('origin');const response=req.method==='OPTIONS'?new Response(null,{status:204}):await accountHandler(req);const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',allowed.includes(origin)?origin:allowed[1]);headers.set('Vary','Origin');headers.set('Cache-Control','no-store');headers.set('Access-Control-Allow-Headers','authorization,apikey,content-type');headers.set('Access-Control-Allow-Methods','POST,OPTIONS');return new Response(response.body,{status:response.status,headers});}};
