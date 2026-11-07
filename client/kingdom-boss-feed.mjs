import {AccountClient} from './account-client.mjs?v=admin-session-20261107';

const key='soulbeast-online-walk-v1';
const countryNames={blue:'เหมันตคีรี',green:'พนาสมุทร',red:'อัคนีบรรพต'};
export function gameContext(){try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}}
export function mountKingdomBossFeed(announcements){
 const context=gameContext();
 if(!context?.code||!['live','test'].includes(context.environment))return;
 const account=new AccountClient({storage:localStorage,legacy:sessionStorage,
  lock:fn=>navigator.locks?.request?navigator.locks.request('soulbeast_shop_test_auth_v1-refresh',fn):fn()});
 let timer,request=null,event=null,lastRead=0,offset=0;
 function accept(next,serverTime){
  if(Number.isFinite(serverTime))offset=serverTime-Date.now();
  if(next&&event&&(next.start<event.start||(next.id===event.id&&next.rev<event.rev)))return;
  event=next;
  if(event)announcements.publish({...event,serverManaged:true,location:'แผนที่ประเทศ'+(countryNames[event.country]||'')});
  dispatchEvent(new CustomEvent('soulbeast-kingdom-boss-update',{detail:event}));
 }
 function schedule(ms){clearTimeout(timer);if(!document.hidden)timer=setTimeout(refresh,ms);}
 function refresh(){
  if(document.hidden||request)return request;
  request=(async()=>{
   try{
    const body=await account.game('kingdom_boss_status',{},context.environment);
    lastRead=Date.now();accept(body.event||null,body.serverTime);
    if(!body.event)announcements.clear();
    if(!body.enabled){announcements.clear();schedule(300000);return;}
    const now=Date.now()+offset,active=event?.status==='active';
    const boundary=active?event.end:body.nextStart;
    schedule(Math.min(active?15000:120000,Math.max(750,(boundary||now+60000)-now+150)));
   }catch(error){if(error.status===401||['login_required','session_expired','session_replaced'].includes(error.message)){announcements.clear();event=null;}schedule(30000);}
   finally{request=null;}
  })();return request;
 }
 window.SoulbeastKingdomBoss=Object.freeze({get event(){return event;},now:()=>Date.now()+offset,refresh,accept});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else if(Date.now()-lastRead>500)void refresh();else schedule(750);});
 addEventListener('pageshow',e=>{if(e.persisted)void refresh();});
 void refresh();
}
