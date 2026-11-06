(function(g){'use strict';
function state(p){
 const s=p.worldQuests||(p.worldQuests={version:1});
 s.accepted||={};s.completed||={};if(!Array.isArray(s.events))s.events=[];
 return s;
}
function countryOf(place){return /(?:^|:)(blue|green|red)(?:-|:|$)/.exec(String(place||''))?.[1]||null}
function objectiveCountry(q,o){return o.country||countryOf(o.place)||(o.zone!=null?(Number(o.zone)===7?q.country:({1:'green',2:'blue',3:'red',4:'red',5:'green',6:'blue',8:'green'})[o.zone]):null)}
function prerequisites(p,q){const s=state(p);return (!q.requires||!!s.completed[q.requires])&&(!q.promotion||(p.country===q.country&&(q.promotion!==40||!!s.completed[q.country+'-capital:promotion25'])))}
function available(p,q){const s=state(p);return p.lv>=q.level&&!s.accepted[q.id]&&!s.completed[q.id]&&prerequisites(p,q)}
function blockedReason(p,q){if(p.lv<q.level)return 'ต้องการเลเวล '+q.level;if(q.promotion&&p.country!==q.country)return 'รับบททดสอบเลื่อนอาชีพที่เมืองหลวงประเทศของตน';if(q.promotion===40&&!state(p).completed[q.country+'-capital:promotion25'])return 'ต้องส่งบททดสอบเลื่อนอาชีพระดับ 25 ก่อน';return 'ต้องจบภารกิจก่อนหน้า'}
function selectedRoute(p,q){const a=state(p).accepted[q.id],id=a?.choice||state(p).outcomes?.[q.id]?.choice;return q.choices?.find(c=>c.id===id)}
function steps(p,q){return selectedRoute(p,q)?.steps||q.steps}
function validRoute(p,q){return !q.choices||!!selectedRoute(p,q)}
function accept(p,q,choice){
 if(!available(p,q))return false;const c=q.choices?.find(c=>c.id===choice);
 if(q.choices&&!c)return false;const cost=c?.cost||0;
 if(!Number.isFinite(cost)||cost<0||(p.gold||0)<cost)return false;
 p.gold=(p.gold||0)-cost;state(p).accepted[q.id]={step:0,count:0,choice:c?.id};return true;
}
function current(p,q){
 const s=state(p),a=s.accepted[q.id];
 if(!a||s.completed[q.id]||!validRoute(p,q)||!prerequisites(p,q)||!Number.isInteger(a.step)||a.step<0)return null;
 const o=steps(p,q)[a.step];return o?{a,o}:null;
}
function searchDepth(o){return o.depth|| (o.target==='moon-gem'?3:2)}
function matches(q,a,o,event){
 if(o.type!==event.type||event.questId!=null&&event.questId!==q.id)return false;
 if(['place','target','zone','kind'].some(k=>o[k]!=null&&String(o[k])!==String(event[k])))return false;
 const expected=objectiveCountry(q,o),country=event.country||countryOf(event.place);
 if(expected&&country!==expected)return false;
 if(o.type==='forestSearch'&&(event.questId!==q.id||event.objectiveStep!==a.step||!Number.isFinite(event.depth)||event.depth<searchDepth(o)))return false;
 return true;
}
function searchObjectives(p,quests,context){return quests.flatMap(q=>{const c=current(p,q);if(!c||c.o.type!=='forestSearch')return [];const event={...context,type:'forestSearch',target:c.o.target,questId:q.id,objectiveStep:c.a.step};return matches(q,c.a,c.o,event)?[{quest:q,objective:c.o,questId:q.id,objectiveStep:c.a.step}]:[]})}
function emit(p,quests,event){
 const s=state(p);if(!event?.id||s.events.includes(event.id))return false;
 const amount=event.count==null?1:Number(event.count);if(!Number.isFinite(amount)||amount<=0||!Number.isInteger(amount))return false;
 s.events.push(event.id);if(s.events.length>500)s.events.shift();let changed=false;
 for(const q of quests){const c=current(p,q);if(!c||!matches(q,c.a,c.o,event))continue;
 const {a,o}=c;a.count=(Number.isInteger(a.count)&&a.count>=0?a.count:0)+Math.min(10,amount);
 if(a.count>=(o.count||1)){a.step++;a.count=0}changed=true;
 }return changed;
}
// Resolve only the current step; later objectives and unaccepted quests never mark targets.
function isTarget(p,quests,probe){if(!p)return false;const s=state(p),services={guide:'library',guild:'guild',world:'hall',camp:'camp',arena:'tower',hospital:'hospital',shop:'shop',forge:'forge'};return quests.some(q=>{const a=s.accepted[q.id];if(!a||s.completed[q.id]||!validRoute(p,q)||!prerequisites(p,q)||!Number.isInteger(a.step)||a.step<0||a.step>steps(p,q).length)return false;const o=steps(p,q)[a.step];if(!o){return probe.place===q.place&&(probe.type==='place'||probe.type==='npc'&&(probe.target===q.npc||probe.target==='questboard'&&!q.cast))}const country=probe.country||countryOf(probe.place),expected=objectiveCountry(q,o);if(expected&&country!==expected)return false;if(probe.type==='place'){if(o.type==='dungeonBoss')return probe.place==='seven-floor-dungeon'&&probe.country==='red';if(o.place)return probe.place===o.place;if(o.zone!=null)return Number(probe.zone)===Number(o.zone)&&(Number(o.zone)!==7||probe.country===q.country);return false}if(o.place&&probe.place!==o.place)return false;if(probe.type==='npc'){const target=o.type==='talk'?o.target:o.type==='visit'||o.type==='activity'?services[o.target]:({heal:'hospital',craft:'forge',buySeal:'shop'})[o.type];return !!target&&probe.target===target}if(probe.type==='enemy')return o.type==='defeat'&&o.kind===probe.kind;if(probe.type==='chest')return o.type==='chest'&&!probe.opened;return false})}
function rewardList(q){return (q.rewards||[]).map(r=>({...g.WorldQuestData?.rewards?.[r.key],qty:r.qty,key:r.key}))}
function rewardText(q){return rewardList(q).map(r=>r.name+' ×'+r.qty+(r.grade? ' ('+({crafted:'อุปกรณ์คราฟ',rare:'อุปกรณ์หายาก',legendary:'อุปกรณ์ในตำนาน',beast:'อสูรหายาก'}[r.grade]||r.grade)+')':'')).join(' · ')}
function validRewards(q){return rewardList(q).every(r=>r.id&&r.name&&['item','gear','beast'].includes(r.kind)&&Number.isInteger(r.qty)&&r.qty>0&&r.qty<=10&&!/solar|eclipse|coupon|สุริยคราส|คูปอง/i.test(r.id+' '+r.name)&&(r.kind!=='beast'||r.grade==='beast'&&r.template?.sp===r.id))}
function grant(p,q){for(const r of rewardList(q)){if(r.kind==='item'){p.items||={};p.items[r.id]=(p.items[r.id]||0)+r.qty}else if(r.kind==='gear'){p.owned||=[];for(let i=0;i<r.qty;i++)p.owned.push(r.id)}else{p.pets||=[];p.uid=Math.max(Number(p.uid)||1,...p.pets.map(v=>v.uid+1));for(let i=0;i<r.qty;i++){const pet=JSON.parse(JSON.stringify(r.template));pet.uid=p.uid++;p.pets.push(pet)}p.seen||={};p.caught||={};p.seenForms||={};p.seen[r.id]=1;p.caught[r.id]=1;p.seenForms[r.id]||=[0]}}}
function claim(p,q,place,npc){
 const s=state(p),a=s.accepted[q.id],route=steps(p,q),choice=selectedRoute(p,q),gold=choice?.gold??q.gold;
 const correctNpc=npc===q.npc||npc==='questboard'&&!q.cast;
 if(!a||!validRoute(p,q)||!prerequisites(p,q)||!Number.isInteger(a.step)||a.step!==route.length||q.place!==place||!correctNpc||s.completed[q.id]||!validRewards(q)||!Number.isFinite(gold)||gold<0)return false;
 s.outcomes||={};s.outcomes[q.id]={choice:a.choice,ending:choice?.ending||q.ending,gold,rewards:rewardList(q)};
 grant(p,q);s.completed[q.id]=Date.now();delete s.accepted[q.id];p.gold=(p.gold||0)+gold;return true;
}
const api={state,available,blockedReason,steps,accept,emit,claim,isTarget,rewardList,rewardText,countryOf,objectiveCountry,searchObjectives};g.WalkQuestEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
