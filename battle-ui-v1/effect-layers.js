(() => {
 const spells=new Set(['ms_mage40','mist_sig_astral_dragon']);
 const masks=new Map();
 async function paintedMask(src){
  const image=new Image();
  image.crossOrigin='anonymous';
  image.src=src;
  await image.decode();
  const scale=128/Math.max(image.naturalWidth,image.naturalHeight);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(2,Math.round(image.naturalWidth*scale));canvas.height=Math.max(2,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height;
  ctx.drawImage(image,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h);
  let left=w,top=h,right=0,bottom=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   if(pixels.data[(y*w+x)*4+3]<=8)continue;
   left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);
  }
  if(right<=left||bottom<=top)return '';
  const cx=(left+right)/2,cy=(top+bottom)/2,rx=(right-left)/2,ry=(bottom-top)/2;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const distance=Math.hypot((x+.5-cx)/rx,(y+.5-cy)/ry);
   const t=Math.max(0,Math.min(1,(.99-distance)/.42));
   pixels.data[(y*w+x)*4+3]=Math.round(255*t*t*(3-2*t));
  }
  ctx.putImageData(pixels,0,0);
  return 'url('+canvas.toDataURL()+')';
 }
 function apply(image){
  if(image.tagName!=='IMG'||image.closest('[data-signature-portrait],.battle-signature-reveal')||!image.naturalWidth)return;
  const src=image.currentSrc||image.src;
  if(!src)return;
  if(!masks.has(src)){
   if(masks.size>=96)masks.delete(masks.keys().next().value);
   masks.set(src,paintedMask(src).catch(()=>''));
  }
  masks.get(src).then(mask=>{
   if(!mask||image.currentSrc!==src)return;
   image.style.setProperty('--meteor-mask',mask);
   image.style.setProperty('mask-size',getComputedStyle(image).objectFit==='contain'?'contain':'100% 100%','important');
   image.dataset.meteorMask='alpha';
  });
 }
 window.BattleEffectLayers={create(host){
  const root=host.attachShadow({mode:'open'});
  if(!spells.has(host.dataset.legacySkill||host.dataset.projectileSkill))return root;
  const style=document.createElement('style');
  style.textContent='img:not([data-signature-portrait]),.battle-projectile-art{mask-image:var(--meteor-mask,radial-gradient(ellipse closest-side,#000 50%,rgba(0,0,0,.9) 65%,transparent 99%))!important;mask-position:center!important;mask-repeat:no-repeat!important}';
  root.append(style);
  root.addEventListener('load',event=>apply(event.target),true);
  // Cached art can finish loading before the renderer attaches it to this layer.
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.tagName==='IMG')apply(node);else node.querySelectorAll('img').forEach(apply);}}).observe(root,{childList:true,subtree:true});
  return root;
 }};
})();
