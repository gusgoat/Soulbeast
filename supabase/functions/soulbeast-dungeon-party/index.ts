import {Pool} from 'npm:pg@8.16.3';
import {createHash,randomUUID} from 'node:crypto';
import {createDungeonPartyApp} from './source/server/accounts/dungeon-party-app.mjs';
import {createEngine,createWorkbook,createUtilities} from './engine.mjs';

const required=(name:string)=>{const value=Deno.env.get(name);if(!value)throw new Error('Missing server configuration: '+name);return value;};
const url=required('SUPABASE_URL');
const apiKey=required('SUPABASE_ANON_KEY');
const environment=required('DUNGEON_PARTY_ENV');
if(!['test','live'].includes(environment))throw new Error('Invalid party environment');
const pool=new Pool({connectionString:required('SUPABASE_DB_URL'),max:2,idleTimeoutMillis:20000,connectionTimeoutMillis:5000,statement_timeout:10000});
const app=createDungeonPartyApp({pool,environment,uuid:randomUUID,broadcast:true,
 createEngine:()=>createEngine(createWorkbook(),createUtilities((value:string)=>createHash('sha256').update(value).digest(),randomUUID)).partyCombat,
 origins:required('DUNGEON_PARTY_ORIGINS').split(',').map(v=>v.trim()).filter(Boolean),
 async verifyToken(token:string){
  const response=await fetch(url+'/auth/v1/user',{headers:{apikey:apiKey,authorization:'Bearer '+token},signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('login_required');
  const user=await response.json();if(!user.id||!user.email_confirmed_at)throw Error('login_required');return {id:user.id};
 },
 report(event:{action:string;error:{code?:string}}){console.error(JSON.stringify({kind:'party_failure',action:event.action,code:event.error?.code||'internal'}));}
});
Deno.serve(async(request:Request)=>{
 // Environment is pinned server-side: a test build cannot operate live characters.
 if(request.method==='POST'){
  const len=Number(request.headers.get('content-length')||0);
  if(len>32768)return new Response(null,{status:413});
  // The actual bounded read and bearer verification remain in the HTTP adapter.
 }
 return app.handle(request);
});
