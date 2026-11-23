(function(scope){
'use strict';
if(scope.SoulbeastGachaPresentation||typeof handlers==='undefined'||typeof gachaRevealScene!=='function')return;
let effects=null;
const clear=()=>effects?.clear();
function engine(){if(!effects&&scope.GachaRevealCanvas)effects=scope.GachaRevealCanvas.create();return effects;}
const originalFront=gachaFrontContent;
gachaFrontContent=function(reward,index,fresh){
 const html=originalFront(reward,index,fresh);if(reward.type!=='pet')return html;
 const holder=document.createElement('template');holder.innerHTML=html;const art=holder.content.querySelector('.gacha-face-art');if(!art)return html;
 // Use the approved full-portrait composition with the actual species and form.
 // Older sprite-only beasts retain their original renderer as a fallback.
 let src=SP[reward.key]?.art;
 if(!src&&typeof atlasFace==='function'){const face=document.createElement('template');face.innerHTML=atlasFace(reward.key,reward.form||0);src=face.content.querySelector('img')?.getAttribute('src');}
 if(src){const portrait=document.createElement('span');portrait.className='gacha-portrait';const backdrop=document.createElement('img');backdrop.className='gacha-art-ambience';backdrop.src=src;backdrop.alt='';backdrop.setAttribute('aria-hidden','true');backdrop.decoding='async';const image=document.createElement('img');image.className='gacha-beast-preview';image.src=src;image.alt='';image.decoding='async';portrait.append(backdrop,image);art.replaceChildren(portrait);}
 return holder.innerHTML;
};
const originalScene=gachaRevealScene;
gachaRevealScene=function(...args){return originalScene.apply(this,args).replace('class="gacha-reveal gacha-results"','class="gacha-reveal gacha-results gacha-live"').replace(/gacha-reveal-v1\/(white|green|blue|purple|gold|red)\.png(?!\.webp)/g,'gacha-reveal-v1/$1.png.webp').replace(/gacha-reveal-v2\/summoning-open\.png(?!\.webp)/g,'gacha-reveal-v2/summoning-open.png.webp');};
const originalSync=gachaRevealSync;
gachaRevealSync=function(...args){const previous=GachaReveal.receipt,result=originalSync.apply(this,args);if(previous!==GachaReveal.receipt)clear();return result;};
for(const name of ['gachaRevealOne','gachaRevealAll']){
 const original=handlers[name];handlers[name]=function(value){
  const before=new Set(GachaReveal.opened),result=original.call(this,value),cards=[];
  for(const i of GachaReveal.opened)if(!before.has(i)){const card=document.querySelector('.gacha-live [data-a="gachaRevealOne"][data-v="'+i+'"]');if(card)cards.push(card);}
  if(cards.length)engine()?.play(cards);return result;
 };
}
scope.SoulbeastGachaPresentation={version:'live-gacha-20261123',stats:()=>effects?.stats()||{active:0,frames:0,total:0,scheduled:false,particles:0},clear};
if(typeof S!=='undefined'&&S?.screen==='gacha'&&S.P)render();
})(window);
