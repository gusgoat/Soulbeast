export const SHIELDS=[
 {minimum:-Infinity,id:'iron',name:'โล่เหล็ก'},
 {minimum:11,id:'copper',name:'โล่ทองแดง'},
 {minimum:21,id:'silver',name:'โล่เงิน'},
 {minimum:31,id:'gold',name:'โล่ทอง'},
 {minimum:41,id:'platinum',name:'โล่แพลทินัม'},
 {minimum:51,id:'diamond',name:'โล่เพชร'},
 {minimum:61,id:'guardian',name:'โล่ผู้พิทักษ์'},
 {minimum:81,id:'legend',name:'โล่ตำนาน'},
 {minimum:101,id:'eclipse',name:'โล่ตำนานสุริยคราส'},
];

export function shieldFor(score){
 return Number.isFinite(score)?SHIELDS.findLast(shield=>score>=shield.minimum):null;
}

export function shieldUrl(shield){
 return new URL('../../assets/ui/colosseum-shields/'+shield.id+'.webp?v=2',import.meta.url).href;
}

export function teamResults(players){
 return [0,1].map(side=>players.filter(p=>p.side===side)
  .sort((a,b)=>b.earned-a.earned||b.kills-a.kills)
  .map(({id,name,earned,kills,bot,rating,retired},index,team)=>({
   id,name,points:earned,kills,bot:Boolean(bot),rating,mvp:!retired&&index===team.findIndex(p=>!p.retired),
  })));
}

export function matchRankChanges(room){
 if(!room.ranked||room.reason==='error')return [];
 const mvp=new Set(room.results?.map(team=>team.find(p=>p.mvp)?.id));
 return room.players.flatMap(player=>{
  if(!player.character||player.bot||player.retired)return [];
  const rank=player.placement;
  const winner=player.side===room.winner;
  const isMvp=mvp.has(player.id);
  const result=room.winner===-1?0:room.solo?([3,2,2,1,1][rank-1]??-1):
   isMvp?(winner?2:1):(winner?1:-1);
  const violation=!room.solo&&player.earned<20&&!player.helpedFight?'inactive':null;
  if(!result&&!violation)return [];
  const delta=violation?Math.min(0,result):result;
  player.rankDelta=delta;
  player.rankSaved=false;
  return [{code:player.character.code,name:player.name,delta,violation}];
 });
}
