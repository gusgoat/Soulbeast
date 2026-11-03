/* Same-machine preview roster. Only public character and combat loadout data are shared. */
(()=>{'use strict';const key='soulbeast-walk-preview-player-v1',channel=new BroadcastChannel('soulbeast-dungeon-party-v1'),session=crypto.randomUUID(),roster=new Map();let last=0;
function player(){try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}}
function id(p){return p?.code||p?.walkId||(p?.name+'|'+p?.cls+'|'+p?.country)}
function profile(p){if(!p)return null;const out={};for(const k of ['code','walkId','name','cls','gender','lv','country','pts','eq','hp','mp','party','pets','worldPower'])if(p[k]!==undefined)out[k]=p[k];return JSON.parse(JSON.stringify(out))}
function publish(force=false){const now=Date.now();if(!force&&now-last<1000)return;last=now;const p=profile(player());if(p)channel.postMessage({type:'profile',session,id:id(p),player:p})}
channel.onmessage=({data:d})=>{if(!d||d.session===session)return;if(d.type==='hello'){publish(true);return}if(d.type==='leave'){roster.delete(d.session);return}if(d.type==='profile'&&d.player?.cls&&Number.isFinite(d.player.lv))roster.set(d.session,{...d,seen:Date.now()})};
function list(){const me=id(player()),out=new Map();for(const r of roster.values())if(Date.now()-r.seen<6000&&r.id!==me)out.set(r.id,r);return [...out.values()]}
function friends(){try{return JSON.parse(localStorage.getItem('soulbeast-local-friends-v1')||'[]')}catch{return []}}
function addFriend(value){localStorage.setItem('soulbeast-local-friends-v1',JSON.stringify([...new Set([...friends(),value])]))}
function eligible(r,p=player()){return !!r&&Date.now()-r.seen<6000&&r.id!==id(p)&&Math.abs(r.player.lv-p.lv)<=10&&friends().includes(r.id)}
setInterval(()=>publish(),1000);addEventListener('pagehide',()=>channel.postMessage({type:'leave',session}));channel.postMessage({type:'hello',session});publish(true);window.DungeonPartyPresence={player,id,profile,publish,list,friends,addFriend,eligible};
})();
