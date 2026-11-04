(function(scope){'use strict';
const ITEM='beastRepellent',DURATION=10*60*1000,STORE_KEY='soulbeast-walk-preview-player-v1';
function remaining(player,now=Date.now()){const until=Number(player?.walkEffects?.repellentUntil);return Number.isFinite(until)?Math.max(0,until-now):0}
function activate(player,now=Date.now()){if(!player||!(player.items?.[ITEM]>0))return {ok:false,reason:'empty'};const left=remaining(player,now);player.items[ITEM]--;player.walkEffects={...player.walkEffects,repellentUntil:now+left+DURATION};return {ok:true,until:player.walkEffects.repellentUntil}}
function format(ms){const seconds=Math.ceil(Math.max(0,ms)/1000);return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}
const api={ITEM,DURATION,STORE_KEY,remaining,activate,format};scope.walkRepellent=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
