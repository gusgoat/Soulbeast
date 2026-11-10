import {SHIELDS} from './ranking.mjs';

export const RANKED_EXPAND_MS=4*60_000;
export const RANKED_FILL_MS=6*60_000;
export const RANKED_RECONNECT_MS=60_000;

const tier=entry=>SHIELDS.findLastIndex(s=>entry.rating>=s.minimum);
const byAge=(a,b)=>a.enteredAt-b.enteredAt;

export function compatiblePlayers(anchor,entries,now){
 const close=(a,b)=>Math.abs(a.rating-anchor.rating)-Math.abs(b.rating-anchor.rating)||byAge(a,b);
 if(now-anchor.enteredAt>=RANKED_EXPAND_MS)return [anchor,...entries.filter(e=>e!==anchor).sort(close)];
 const level=tier(anchor);
 const band=bottom=>entries.filter(e=>e!==anchor&&tier(e)>=bottom&&tier(e)<=bottom+1).sort(close);
 const lower=band(level-1),upper=band(level);
 return [anchor,...(lower.length>=upper.length?lower:upper)];
}

export function rankedGroup(entries,mode,now){
 const waiting=entries.filter(e=>e.peer?.ws.readyState===1).sort(byAge);
 for(const first of waiting){
  const eligible=compatiblePlayers(first,waiting,now);
  if(eligible.length>=10)return eligible.slice(0,10);
  if(now-first.enteredAt<RANKED_FILL_MS)continue;
  const count=mode==='team'?eligible.length-eligible.length%2:eligible.length;
  if(count>0)return eligible.slice(0,count);
 }
 return null;
}

export function premadeRankTotal(room){
 return room.players.reduce((sum,p)=>p.bot?sum:sum+(p.rating||0),0);
}

export function premadeRankPair(rooms,now){
 const waiting=rooms.filter(room=>room.rankSearch!=null&&room.canSearchRankTeam()).sort((a,b)=>a.rankSearch-b.rankSearch);
 for(const [index,first] of waiting.entries()){
  const total=premadeRankTotal(first);
  const limit=Math.min(100,25*(1+Math.floor((now-first.rankSearch)/60_000)));
  const distance=room=>Math.abs(total-premadeRankTotal(room));
  const other=waiting.slice(index+1).filter(room=>distance(room)<=limit)
   .sort((a,b)=>distance(a)-distance(b)||a.rankSearch-b.rankSearch)[0];
  if(other)return [first,other];
 }
 return null;
}

export function balanceRankedTeams(entries,random=Math.random){
 const half=entries.length/2,total=entries.reduce((sum,p)=>sum+p.rating,0);
 let best=Infinity,choices=[];
 function visit(index,group,score){
  if(group.length===half){
   const gap=Math.abs(total-2*score);
   if(gap<best){best=gap;choices=[];}
   if(gap===best)choices.push(group);
   return;
  }
  for(let i=index;i<=entries.length-half+group.length;i++)
   visit(i+1,[...group,entries[i]],score+entries[i].rating);
 }
 visit(0,[],0);
 const first=choices[Math.floor(random()*choices.length)];
 return [first,entries.filter(p=>!first.includes(p))];
}

export function rankedBanMessage(status){
 if(status.permanent)return 'บัญชีนี้ถูกระงับการเล่นจัดอันดับถาวร · ดูจดหมายจัดอันดับ';
 const until=Date.parse(status.blockedUntil);
 if(until>Date.now()){
  const end=new Date(until).toLocaleString('th-TH',{timeZone:'Asia/Bangkok',dateStyle:'short',timeStyle:'short'});
  return 'ถูกระงับการเล่นจัดอันดับถึง '+end+' · ดูจดหมายจัดอันดับ';
 }
 return '';
}
