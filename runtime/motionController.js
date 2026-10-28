// @soulbeast-unit 1100-motionController
/* Opt-in presentation controller. No combat state, saves, network, or purchase calls. */
(()=>{
 // Image-space coordinates are independent of card size and cover/contain cropping.
 function projectAnchor({naturalWidth,naturalHeight,width,height,left=0,top=0,x,y,fit='contain',positionX=.5,positionY=.5}){
  const scale=(fit==='cover'?Math.max:Math.min)(width/naturalWidth,height/naturalHeight);
  const w=naturalWidth*scale,h=naturalHeight*scale;
  return {x:left+(width-w)*positionX+w*x/100,y:top+(height-h)*positionY+h*y/100};
 }
 class UnitMotion {
  constructor(card,{onChange=()=>{},paused=false}={}){
   this.card=card;this.phase='idle';this.paused=paused;this.combo=false;this.onChange=onChange;
   this.onEnd=e=>{
    if(!e.target.classList.contains('um-body'))return;
    if((this.phase==='threat'&&e.animationName==='um-threat')||(this.phase==='melee'&&['um-melee','um-melee-ram','um-melee-headbutt'].includes(e.animationName)))this.set('idle');
    else if(this.phase==='hit'&&e.animationName==='um-hit')this.set('idle');
    else if(this.phase==='windup'&&e.animationName==='um-windup'){
     const next=this.combo?'power':'idle';this.combo=false;this.set(next);
    }else if(this.phase==='power'&&e.animationName==='um-release')this.set('idle');
   };
   this.onVisibility=()=>this.sync();
   card.addEventListener('animationend',this.onEnd);
   document.addEventListener('visibilitychange',this.onVisibility);
   if(card.dataset.motionAnchorX!==undefined){
    this.anchorImage=card.querySelector('.um-art[data-pose="'+(card.dataset.motionAnchorPose||'windup')+'"]');
    this.anchorBody=card.querySelector('.um-body');
    this.updateAnchor=()=>{
     const melee=this.phase==='melee'&&card.dataset.motionMeleeAnchorX!==undefined;
     const img=melee?card.querySelector('.um-art[data-pose="melee"]'):this.anchorImage,body=this.anchorBody;
     if(!img?.naturalWidth||!body?.clientWidth||!body.clientHeight)return;
     // Computed layout sizes retain fractions and exclude breathing/recoil transforms.
     const css=typeof getComputedStyle==='function'?getComputedStyle(img):null;
     const bodyCss=typeof getComputedStyle==='function'?getComputedStyle(body):null;
     const px=(v,fallback)=>Number.isFinite(parseFloat(v))?parseFloat(v):fallback;
     const position=(css?.objectPosition||'50% 50%').split(' ');
     const point=projectAnchor({naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
      width:px(css?.width,img.clientWidth),height:px(css?.height,img.clientHeight),
      left:px(css?.left,img.offsetLeft),top:px(css?.top,img.offsetTop),
      x:Number(melee?card.dataset.motionMeleeAnchorX:card.dataset.motionAnchorX),y:Number(melee?card.dataset.motionMeleeAnchorY:card.dataset.motionAnchorY),
      fit:css?.objectFit||card.dataset.artFit||'contain',
      positionX:parseFloat(position[0])/100,positionY:parseFloat(position[1]||position[0])/100});
     card.style.setProperty('--um-x',100*point.x/px(bodyCss?.width,body.clientWidth)+'%');
     card.style.setProperty('--um-y',100*point.y/px(bodyCss?.height,body.clientHeight)+'%');
    };
    this.anchorImages=card.querySelectorAll?.('.um-art')||[this.anchorImage];
    for(const img of this.anchorImages)img?.addEventListener('load',this.updateAnchor);
    if(typeof ResizeObserver!=='undefined'){
     this.anchorObserver=new ResizeObserver(this.updateAnchor);
     this.anchorObserver.observe(this.anchorBody);
     if(this.anchorImage)this.anchorObserver.observe(this.anchorImage);
    }
    this.updateAnchor();
   }
   this.sync();
  }
  set(phase){this.phase=phase;this.updateAnchor?.();this.card.dataset.motionPhase=phase;this.sync();this.onChange(this);}
  play(action){
   if(this.paused||document.hidden||this.phase!=='idle')return false;
   if(['threat','melee'].includes(action)&&!this.card.querySelector?.('.um-art[data-pose="'+action+'"]'))return false;
   this.combo=action==='attack';this.set(this.combo?'windup':action);return true;
  }
  pause(value){this.paused=value;if(!value)this.card.setAttribute('data-motion-opt-in','');this.sync();this.onChange(this);}
  sync(){this.card.toggleAttribute('data-motion-paused',this.paused||document.hidden);}
  destroy(){this.card.removeEventListener('animationend',this.onEnd);document.removeEventListener('visibilitychange',this.onVisibility);for(const img of this.anchorImages||[])img?.removeEventListener('load',this.updateAnchor);this.anchorObserver?.disconnect();}
 }
 UnitMotion.projectAnchor=projectAnchor;
 window.SoulbeastUnitMotion=UnitMotion;
})();

// @soulbeast-end 1100-motionController
