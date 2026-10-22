// Visual QA only. All application API calls are local fixtures; no email or payment is sent.
const fixture=await (await fetch('./content/payment-packs.test.json')).json();
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};};
const local=storage(),session=storage(),scenario=new URL(location.href).searchParams.get('scenario')||'rate';
Object.defineProperty(window,'localStorage',{value:local});Object.defineProperty(window,'sessionStorage',{value:session});
const expiry=Math.floor(Date.now()/1000)+(scenario==='offline'?-60:3600);
if(scenario!=='rate')local.setItem('soulbeast_shop_test_auth_v1',JSON.stringify({access_token:'qa.not-a-real.token',refresh_token:'qa-not-a-real-refresh',expires_at:expiry}));
window.fetch=async(url,options={})=>{
 const body=JSON.parse(options.body||'{}');
 if(String(url).includes('/auth/v1/otp'))return Response.json({error_code:'over_email_send_rate_limit',msg:'email rate limit exceeded'},{status:429,headers:{'Retry-After':'90'}});
 if(String(url).includes('/auth/v1/token'))return Response.json({msg:'QA simulated temporary server failure'},{status:503});
 if(body.action==='catalog')return Response.json({ok:true,packs:fixture.packs,purchasesEnabled:true});
 if(body.action==='status')return Response.json({ok:true,email:'qa@example.invalid',characters:[{game_env:'test',code:'SHOPQATEST001',name:'ตัวละครทดสอบ'}],orders:[],balances:[],promotions:[]});
 throw Error('QA blocks all other API requests');
};
await import('./topup-test.js');
