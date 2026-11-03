(function(g){'use strict';
const PRICE=100,tiers={"swordsman":1,"samurai":2,"kensei":3,"shogun":3,"spellblade":2,"sbsummon":3,"sbwar":3,"gladiator":1,"paladin":2,"templar":3,"eternal":3,"berserker":2,"warlord":3,"bloodwar":3,"archer":1,"ranger":2,"sniper":3,"wildlord":3,"bard":2,"maestro":3,"dirge":3,"mage":1,"sage":2,"archmage":3,"elementalist":3,"warlock":2,"necro":3,"enchanter":3,"merchant":1,"blacksmith":2,"mastersmith":3,"mechanic":3,"alchemist":2,"biochem":3,"goldalch":3,"gunner":1,"marksman":2,"gunsaint":3,"bounty":3,"artillery":2,"cannoneer":3,"demolisher":3,"druid":1,"feral":2,"wildgod":3,"packlord":3,"grove":2,"archdruid":3,"stormcaller":3,"thief":1,"rogue":2,"masterthief":3,"trickster":3,"assassin":2,"ninja":3,"ronin":3,"summoner":1,"tamer":2,"beastking":3,"sealmaster":3,"soullink":2,"soulsage":3,"spiritlord":3},BASE='/Soulbeast/assets/ui/world-polish-20261103/';
function owned(p){return p?.entitlements?.premiumNameplates===true}
function tier(p){return tiers[p?.cls]||1}
function balance(p){return Math.max(0,Math.floor(Number(p?.walkCoupons)||0))}
function buy(p){if(!p)return {ok:false,reason:'character'};if(owned(p))return {ok:false,reason:'owned'};if(balance(p)<PRICE)return {ok:false,reason:'funds'};p.walkCoupons=balance(p)-PRICE;p.entitlements||={};p.entitlements.premiumNameplates=true;return {ok:true}}
function asset(p){return BASE+'nameplate-'+(owned(p)?'premium':'normal')+'-'+tier(p)+'.png.webp'}
const api={PRICE,tiers,BASE,owned,tier,balance,buy,asset};g.WalkNameplates=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
