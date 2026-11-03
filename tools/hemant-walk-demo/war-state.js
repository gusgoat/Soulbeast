(function(scope){'use strict';
const playerKey='soulbeast-walk-preview-player-v1',warKey='soulbeast-walk-war-view-v1';
function read(key){try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}}
function playerCountry(){const id=read(playerKey)?.country;return ['blue','green','red'].includes(id)?id:null}
function owner(id){return read(warKey)?.map?.locations?.find(n=>n.id===id)?.owner||id.split('-')[0]}
function canEnter(id){return !!playerCountry()&&owner(id)===playerCountry()}
function requirement(id){const view=read(warKey),top=scope.walkWarTopology;if(top){const locations=Object.fromEntries((view?.map?.locations||[]).map(n=>[n.id,n]));return top.attackRequirement({locations},playerCountry(),id)}const cached=view?.map?.locations?.find(n=>n.id===id);return cached?.attack||{allowed:false,connected:false,held:0,required:id.includes('-village-')?0:2,total:4}}
const visitKey='soulbeast-war-visit-v1',identity=p=>p?.walkId||p?.code||p?.name+'|'+p?.cls;
function beginVisit(source,target){const token=crypto.randomUUID();sessionStorage.setItem(visitKey,JSON.stringify({token,source,target,player:identity(read(playerKey))}));return token}
function visit(token){const v=read(visitKey);return v&&v.token===token&&v.player===identity(read(playerKey))?v:null}
function endVisit(){sessionStorage.removeItem(visitKey)}

function status(){return read(warKey)}
function update(view){if(!view?.countryWarVersion)return;sessionStorage.setItem(warKey,JSON.stringify(view));const p=read(playerKey);if(p?.walkId)try{localStorage.setItem('soulbeast-walk-war-save:'+p.walkId,JSON.stringify({view:sessionStorage.getItem(warKey),workbook:sessionStorage.getItem('soulbeast-walk-war-workbook-v1')}))}catch{}}
scope.walkWar={playerCountry,owner,canEnter,requirement,status,update,beginVisit,visit,endVisit};
})(typeof window==='undefined'?globalThis:window);
