(function(g){'use strict';const KEY='soulbeast-device-controls-v1',storage=g.localStorage;const defaults={joystick:{x:.02,y:1},hideHud:false};const clamp=(n,def)=>Number.isFinite(Number(n))?Math.max(0,Math.min(1,Number(n))):def;
function read(){let p={};try{p=JSON.parse(storage.getItem(KEY)||'{}')||{}}catch{}return {joystick:{x:clamp(p.joystick?.x,defaults.joystick.x),y:clamp(p.joystick?.y,defaults.joystick.y)},hideHud:p.hideHud===true}}
function write(patch){const old=read(),p={joystick:{...old.joystick,...patch.joystick},hideHud:patch.hideHud??old.hideHud};p.joystick={x:clamp(p.joystick.x,.02),y:clamp(p.joystick.y,1)};try{storage.setItem(KEY,JSON.stringify(p))}catch{}return p}
function position(w,h,jw,jh,top,bottom,p){const left=12,base=bottom+14,spanX=Math.max(0,w-jw-24),spanY=Math.max(0,h-top-base-jh-12);return {left:left+spanX*p.x,bottom:base+spanY*(1-p.y),spanX,spanY,base}}
const api={KEY,defaults,read,write,position};g.WalkDevicePrefs=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
