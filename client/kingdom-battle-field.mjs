import {dungeonView} from '../tools/labyrinth-demo/online-party-field.mjs?v=dungeon-entry-1';
import {partySkills} from '../tools/labyrinth-demo/party-skill-display.mjs';

export function kingdomBattleField(frame,code,terrain,withdraw,fallback){
 const channel=crypto.randomUUID();
 let prior=null,visible=false,speed=1,waiting=null,timer;
 const button=document.createElement('button');
 button.type='button';button.className='btn sm';button.textContent='ถอนตัว';
 button.style.cssText='position:fixed;top:8px;right:12px;z-index:10001';
 button.onclick=withdraw;document.body.append(button);
 const watch=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(document.hidden)watch();else fallback();},45000);};
 const post=(type,data)=>frame.contentWindow.postMessage({type,channel,...data},location.origin);
 function show(fight){
  const b=fight.battle,ended=fight.status!=='active',before=prior;
  const v=dungeonView({run:{...fight,presentation:null},code,auto:true},1,speed,false);
  v.context={mode:'kingdom-boss',online:true,stage:terrain,autoHospital:false,returnLabel:'เดินต่อ'};
  v.autoAllowed=false;v.waiting=true;v.clockKey=fight.id+'/'+fight.turn;v.revision=fight.turn;
  if(ended)v.over={res:fight.result,title:fight.result==='win'?'ชัยชนะ':'จบการต่อสู้',lines:fight.reward?['รางวัลรอบนี้ส่งไปที่จดหมาย']:fight.result==='expired'?['หมดเวลาของกิจกรรมบอสอาณาจักร']:[]};
  button.hidden=ended;prior=v;
  const events=b.effects||[],cast=events.find(e=>e.k==='cast'||e.k==='charge');
  if(visible&&before&&before.revision!==v.revision&&events.length){
   const actor=cast?.source||cast?.id||before.current||b.cur;
   const caster=before.units.find(u=>u.id===actor);
   if(caster){
    const id=cast?.skill||events.find(e=>e.skill)?.skill||'attack',skill=partySkills[id]||{};
    const support=['buff','heal','form','summon','rest','revert'].includes(skill.t);
    const side=v.units.filter(u=>support?u.side===caster.side:u.side!==caster.side);
    const target=side.find(u=>events.some(e=>e.id===u.id))||side[0];
    waiting=v.revision;watch();
    post('ordinary-action',{before,view:v,sequence:waiting,action:{actor,skill:id,name:skill.n||id,support,all:!!skill.all||skill.tg==='team',range:skill.range||(['m','h'].includes(skill.t)?'ranged':'melee'),target:target?.id,friend:skill.tg==='self'?actor:target?.id||actor,events}});return;
   }
  }
  post('ordinary-state',{view:v});
 }
 function message(m){
  if(m?.type==='ordinary-ready')return {type:'party-battle-ready'};
  if(m?.type==='ordinary-render-error'&&(!m.channel||m.channel===channel)){fallback();return;}
  if(!prior||m?.channel!==channel||m.battle!==prior.battle)return;
  if(m.type==='ordinary-field-ready'){visible=true;clearTimeout(timer);return {type:'party-battle-visible',battle:m.battle};}
  if(m.type==='ordinary-presented'&&m.sequence===waiting){waiting=null;clearTimeout(timer);return {type:'party-battle-presented',battle:m.battle,turn:m.sequence};}
  if(m.type==='ordinary-command'&&m.command==='done'&&prior.over)return {type:'party-battle-done',battle:m.battle};
  if(m.type==='ordinary-command'&&m.command==='speed'&&[1,2].includes(m.speed)){speed=m.speed;prior={...prior,speed};if(waiting===null)post('ordinary-state',{view:prior});}
 }
 watch();frame.allow='autoplay';frame.src=new URL('../battle-ui-v1/test-effects.html?connected=ordinary&ui=activity-v1',import.meta.url);
 return {show,message,stop(){clearTimeout(timer);button.remove();}};
}
