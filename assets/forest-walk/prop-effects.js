// Presentation only: animate pixels from the original prop, never event state/RNG.
const cache=new WeakMap();
const fire=area=>({kind:'fire',area});
const water=(polygon,flow=[1,.3])=>({kind:'water',polygon,flow});
const cascade=(polygon,flow=[-.2,1])=>({...water(polygon,flow),cascade:true});
export function propEffectSpec(prop){
  const id=prop.effectId||prop.art;
  if(id==='heaven-traps#2')return [fire([.10,0,.9,.63])];
  if(id==='heaven-camp#5')return [fire([.14,0,.44,.4])];
  if(id==='heaven-lantern#5')return [fire([.70,.47,.78,.63])];
  if(id==='heaven-shrine#1')return [fire([.50,.70,.56,.74])];
  if(id==='heaven-shrine#4')return [fire([.46,.46,.67,.66])];
  if(id==='heaven-storm#3')return [water([[.24,.18],[.66,.18],[.86,.38],[.78,.59],[.5,.73],[.21,.6],[.12,.39]],[.3,.2])];
  if(id==='heaven-traps#1')return [water([[.25,.26],[.68,.15],[.9,.48],[.57,.82],[.15,.67]],[.2,.2])];
  if(id==='heaven-spring#1'){
    const stream=[[.70,.22],[.80,.22],[.80,.53],[.76,.75],[.67,.87],[.37,.9],[.34,.82],[.53,.74],[.64,.55]];
    return [cascade(stream)];
  }
  if(id==='heaven-spring#5')return [water([[.31,.46],[.58,.43],[.71,.49],[.67,.58],[.43,.63],[.24,.55]],[.3,.2])];
  if(id==='heaven-garden#1')return [water([[.29,.54],[.7,.54],[.81,.63],[.67,.72],[.44,.76],[.24,.69]],[.2,.3])];
  if(id==='dragon-traps#2')return [fire([.12,.01,.88,.6])];
  if(id==='dragon-forge#1')return [fire([.32,.57,.58,.8])];
  if(id==='dragon-beacon#1')return [fire([.4,.57,.65,.78])];
  if(id==='dragon-beacon#2')return [fire([.38,0,.67,.39])];
  if(id==='dragon-forge#3')return [water([[.12,.25],[.61,.13],[.92,.32],[.64,.58],[.15,.46]],[.2,.3])];
  if(id==='dragon-traps#1')return [water([[.25,.29],[.68,.16],[.88,.48],[.56,.8],[.16,.67]],[.2,.2])];
  if(id==='dragon-spring#1')return [cascade([[.47,.48],[.59,.48],[.57,.96],[.32,.96]],[-.3,1])];
  if(id==='desert-traps#2')return [fire([.12,.01,.86,.6])];
  if(/^desert-waterways#[01235]$/.test(id))return [water([[0,0],[1,0],[1,1],[0,1]],[.3,.7])];
  if(id==='desert-spring#1')return [cascade([[.46,.4],[.57,.4],[.65,1],[.49,1]],[0,1])];
  if(id==='well-spring')return [cascade([[.59,.24],[.64,.25],[.60,.32],[.62,.36],[.57,.40],[.49,.39],[.53,.34],[.55,.29]])];
  if(id==='trap-fire'||id==='training-png-trap-fire')return [fire([.16,.42,.32,.72]),fire([.32,.4,.5,.7]),fire([.52,.41,.68,.69]),fire([.68,.42,.85,.65])];
  if(id==='lantern#4'||id==='seedmap#4')return [fire([.38,.58,.68,.91])];
  if(id==='waterways#4')return [{kind:'light',area:[.57,.43,.85,.73],color:'190,228,255'}];
  if(id==='yggdrasil#0')return [water([[.17,.91],[.4,.95],[.57,.7],[.66,.45],[.98,.26],[.93,.12],[.61,.3],[.43,.59]],[-.6,1])];
  if(id==='reflections#0')return [water([[.8,.08],[.5,.12],[.28,.24],[.18,.44],[.21,.65],[.42,.8],[.77,.9],[.9,.76],[.61,.63],[.45,.54],[.48,.38],[.71,.28]],[.3,.1])];
  if(id==='waterways#0')return [water([[.16,.98],[.49,.99],[.68,.55],[.85,.02],[.57,.01],[.42,.48]],[-.2,1])];
  if(id==='waterways#5')return [water([[.48,.27],[.67,.36],[.71,.57],[.96,.78],[.85,.91],[.58,.67],[.51,.49]],[.7,1])];
  if(id==='bandit-camp')return [fire([.53,.48,.58,.54]),fire([.425,.657,.455,.705]),fire([.704,.645,.737,.705]),fire([.242,.574,.267,.623])];
  if(id==='shrine')return [fire([.354,.56,.389,.602]),fire([.568,.535,.595,.575]),fire([.622,.558,.653,.608])];
  return [];
}
export function inPolygon(x,y,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [ax,ay]=polygon[i],[bx,by]=polygon[j];
    if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  }
  return inside;
}
export function firePixel(r,g,b,a){return a>10&&r>160&&g>65&&((r-b>65&&g-b>20)||(r>225&&g>185&&r>b+12));}
export function waterPixel(r,g,b,a){return a>20&&b-r>7&&g-r>2&&b>=g*.95;}
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

export function createPropEffects(art,source,specs){
  if(!specs.length||!art)return null;
  const rect=source||[0,0,art.width,art.height];
  const key=JSON.stringify([rect,specs]);let entries=cache.get(art);
  if(!entries){entries=new Map();cache.set(art,entries);}if(entries.has(key))return entries.get(key);
  const scale=Math.min(1,384/Math.max(rect[2],rect[3]));
  const w=Math.max(1,Math.round(rect[2]*scale)),h=Math.max(1,Math.round(rect[3]*scale));
  const original=canvas(w,h),base=canvas(w,h),frame=canvas(w,h);
  const ctx=original.getContext('2d',{willReadFrequently:true});ctx.drawImage(art,...rect,0,0,w,h);
  let pixels;try{pixels=ctx.getImageData(0,0,w,h);}catch{return null;}
  const baseCtx=base.getContext('2d'),basePixels=new ImageData(new Uint8ClampedArray(pixels.data),w,h);
  const layers=specs.map((spec,index)=>{
    const mask=canvas(w,h),m=mask.getContext('2d'),data=m.createImageData(w,h);let count=0;
    if(spec.kind!=='light')for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],a=pixels.data[i+3],u=x/w,v=y/h;
      const inArea=spec.area&&u>=spec.area[0]&&u<=spec.area[2]&&v>=spec.area[1]&&v<=spec.area[3];
      const foam=a>20&&Math.min(r,g,b)>145&&Math.max(r,g,b)-Math.min(r,g,b)<45;
      const waterColor=spec.cascade?waterPixel(r,g,b,a)||foam:spec.foam?foam:waterPixel(r,g,b,a);
      const selected=spec.kind==='fire'?inArea&&firePixel(r,g,b,a):inPolygon(u,v,spec.polygon)&&waterColor;
      if(!selected)continue;
      data.data[i]=r;data.data[i+1]=g;data.data[i+2]=b;data.data[i+3]=a;count++;
      if(spec.kind==='fire')basePixels.data[i+3]=Math.round(a*.10);
    }
    m.putImageData(data,0,0);const scratch=spec.kind==='water'?canvas(w,h):null;
    return {...spec,mask,index,count,scratch,scratchCtx:scratch?.getContext('2d')};
  });
  baseCtx.putImageData(basePixels,0,0);
  const f=frame.getContext('2d');let last=-Infinity;
  const result={base,kinds:[...new Set(specs.map(s=>s.kind))],cascade:specs.some(s=>s.cascade),masks:layers.map(s=>({kind:s.kind,pixels:s.count})),
    paint(target,left,top,width,height,now,reduced=false){
      if(reduced)return;
      const seconds=now/1000;
      if(now-last>=60){
        last=now;f.clearRect(0,0,w,h);
        for(const layer of layers){
          if(layer.kind==='light')continue;
          const phase=seconds*(layer.kind==='fire'?7.5:1.3)+layer.index*1.7;
          if(layer.kind==='fire'){
            const [u0,v0,u1,v1]=layer.area,x0=u0*w,y0=v0*h,mw=(u1-u0)*w,mh=(v1-v0)*h;
            for(let sy=y0;sy<y0+mh;sy+=3){
              const sh=Math.min(3,y0+mh-sy),lift=(1-(sy-y0)/mh),wave=Math.sin(phase+sy*.12)*mw*.07*lift;
              const stretch=1+.08*Math.sin(phase*.73+layer.index),dy=y0+mh-(y0+mh-sy)*stretch;
              f.globalAlpha=.88+.12*Math.sin(phase+sy*.04);
              f.drawImage(layer.mask,x0,sy,mw,sh,x0+wave,dy,mw,sh*stretch+1);
            }
          }else{
            const moving=layer.scratch,mc=layer.scratchCtx;mc.globalCompositeOperation='source-over';mc.clearRect(0,0,w,h);
            if(layer.cascade){
              // Advect the painted stream downhill; crossfade wraps without a visible jump.
              const span=16,fall=(seconds*28)%span;
              mc.globalAlpha=1-fall/span;mc.drawImage(layer.mask,fall*layer.flow[0],fall);
              mc.globalAlpha=fall/span;mc.drawImage(layer.mask,(fall-span)*layer.flow[0],fall-span);
              mc.globalAlpha=1;
            }else for(let sy=0;sy<h;sy+=4){const sh=Math.min(4,h-sy),drift=Math.sin(phase+sy*.09)*1.7;
              mc.drawImage(layer.mask,0,sy,w,sh,drift*layer.flow[0],sy+Math.sin(phase*.8+sy*.12)*layer.flow[1],w,sh+1);
            }
            mc.globalCompositeOperation='destination-in';mc.drawImage(layer.mask,0,0);
            f.globalAlpha=.68+.12*Math.sin(phase);f.drawImage(moving,0,0);
          }
          f.globalAlpha=1;
        }
      }
      target.drawImage(frame,left,top,width,height);
      for(const layer of layers){
        if(!layer.area)continue;
        const [u0,v0,u1,v1]=layer.area,cx=left+(u0+u1)*width/2,cy=top+(v0+v1)*height/2;
        const radius=Math.max(2,(u1-u0)*width*.85),pulse=.10+.04*Math.sin(seconds*8+layer.index*2);
        const glow=target.createRadialGradient(cx,cy,0,cx,cy,radius);
        glow.addColorStop(0,`rgba(${layer.color||'255,169,60'},${pulse})`);glow.addColorStop(1,`rgba(${layer.color||'255,169,60'},0)`);
        target.fillStyle=glow;target.fillRect(cx-radius,cy-radius,radius*2,radius*2);
      }
    }
  };
  entries.set(key,result);return result;
}
