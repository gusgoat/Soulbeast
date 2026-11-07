(function(g){'use strict';
const rules=g.IslandRules;
const read=()=>JSON.parse(sessionStorage.getItem(rules.key)||'null');
const active=()=>!!sessionStorage.getItem(rules.onlineKey);
const context=()=>JSON.parse(sessionStorage.getItem(rules.onlineKey)||'null');
function owns(player){
 const session=context();
 return !!(!session?.exiting&&session?.owner&&session.code&&session.code===player?.code&&session.code===session.snapshot?.P?.code);
}
function hasVisit(player,country){
 const ticket=context()?.snapshot?.P?.islandAccount?.active,visit=player?.islandProgress?.visit;
 return owns(player)&&ticket?.country===country&&visit?.id===ticket.id&&visit.country===country;
}
let connection;
async function connect(){
 if(!owns(read()))throw Error('character_not_owned');
 if(!connection){
  const api=await import('../../client/online-walk.mjs?v=island-account-2');
  connection=api.connectOnlineWalk();
 }
 return connection;
}
async function checkpoint({background=false}={}){
 await (await connect()).flush(true,!background);
 const player=read();
 if(!owns(player))throw Error('character_not_owned');
 return player;
}
async function command(action,country,visitId,resumeOnly=false){
 const client=await connect();
 try{return await client.island(action,{country,visitId,resumeOnly});}
 catch(error){
  const code=error.code||error.message;
  if(code==='island_resume_missing'){await client.reloadWalk();throw error;}
  if(code!=='save_conflict')throw error;
  await client.reloadWalk();
  return client.island(action,{country,visitId,resumeOnly});
 }
}
g.IslandAccount={active,owns,hasVisit,checkpoint,command};
})(window);
