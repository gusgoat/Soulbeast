// The original game's stat functions provide the exact maxima used in battle.
function restoreDungeonTeam(){
 const host=S.P;let count=0;
 function restore(p){try{S.P=p;const st=pStats();p.hp=st.hp;p.mp=st.mp;count++;for(const uid of [...new Set(p.party||[])].slice(0,Math.min(3,clsSum(p.cls)))){const pet=p.pets?.find(x=>x.uid===uid);if(!pet||!SP[pet.sp])continue;const max=calcPet(pet);pet.hp=max.hp;pet.mp=max.mp;count++}}finally{S.P=host}}
 restore(host);
 let team=null;try{team=JSON.parse(sessionStorage.getItem('soulbeast-dungeon-party-v1')||'null')}catch{}
 const hostId=host.code||host.walkId||(host.name+'|'+host.cls+'|'+host.country);
 if(team?.host===hostId&&CLS[team.friend?.cls]){restore(team.friend);sessionStorage.setItem('soulbeast-dungeon-party-v1',JSON.stringify(team))}
 save();return count;
}
if(params.get('rest')==='sacred-well'&&dungeonFloor?.rest&&!previewEncounter){S.zone=null;const count=restoreDungeonTeam();parent.postMessage({type:'dungeon-rest-result',count},location.origin)}
