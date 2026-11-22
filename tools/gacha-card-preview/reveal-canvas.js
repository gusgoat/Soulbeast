(function(scope){
'use strict';
const themes={white:{rgb:'202,226,255',light:'#f3f8ff',rank:0,count:12},green:{rgb:'86,225,159',light:'#c5ffe0',rank:1,count:16},blue:{rgb:'79,175,255',light:'#d7f3ff',rank:2,count:22},purple:{rgb:'191,114,255',light:'#f1d7ff',rank:3,count:28},gold:{rgb:'255,196,83',light:'#fff1bf',rank:4,count:52},red:{rgb:'245,70,99',light:'#ffe4b4',rank:5,count:68}};
const duration=780,cap=6,particleCap=160;
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>1-(1-v)**3;
function create(){
 const canvas=document.createElement('canvas');canvas.className='gacha-reveal-canvas';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;document.body.append(canvas);
 const ctx=canvas.getContext('2d'),motion=scope.matchMedia?.('(prefers-reduced-motion: reduce)');
 let bursts=[],raf=0,disposed=false,frames=0,total=0,ratio=1,seed=4291,lastColors=[];
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 function fit(){const next=Math.min(1.5,scope.devicePixelRatio||1),w=Math.max(1,Math.round(innerWidth*next)),h=Math.max(1,Math.round(innerHeight*next));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ratio=next;ctx.setTransform(ratio,0,0,ratio,0,0);}
 function clear(){if(raf)cancelAnimationFrame(raf);raf=0;bursts=[];if(ctx){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);}canvas.hidden=true;canvas.dataset.active='0';}
 function star(x,y,size,color,alpha){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size*.24,y-size*.24);ctx.lineTo(x+size,y);ctx.lineTo(x+size*.24,y+size*.24);ctx.lineTo(x,y+size);ctx.lineTo(x-size*.24,y+size*.24);ctx.lineTo(x-size,y);ctx.lineTo(x-size*.24,y-size*.24);ctx.closePath();ctx.fill();}
 function grandeur(b,now,focus=false){
  if(b.reduced||b.theme.rank<4)return;
  const rect=b.card.getBoundingClientRect(),age=now-b.at,x=rect.left+rect.width/2,y=rect.top+rect.height*.51,w=rect.width,red=b.theme.rank===5;
  const strength=clamp(age/110)*clamp((b.duration-age)/280),u=clamp(age/900),r=w*(.34+.48*ease(u)),color=red?'255,94,112':'255,210,119';
  if(focus){
   const shade=ctx.createRadialGradient(x,y,w*.12,x,y,Math.max(innerWidth,innerHeight)*.85);shade.addColorStop(0,'rgba(5,3,14,0)');shade.addColorStop(1,`rgba(5,3,14,${strength*.3})`);ctx.save();ctx.fillStyle=shade;ctx.fillRect(0,0,innerWidth,innerHeight);ctx.restore();return;
  }
  ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';
  // A rising pillar and a fan of tapered rays make high-tier reveals read at phone size.
  const beam=ctx.createLinearGradient(0,-w*1.8,0,w*.18);beam.addColorStop(0,`rgba(${color},0)`);beam.addColorStop(.7,`rgba(${color},${strength*.22})`);beam.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(-w*.1,0);ctx.lineTo(-w*.3,-w*1.8);ctx.lineTo(w*.3,-w*1.8);ctx.lineTo(w*.1,0);ctx.closePath();ctx.fill();
  const ray=ctx.createRadialGradient(0,0,w*.1,0,0,r*1.5);ray.addColorStop(0,`rgba(${color},${strength*.34})`);ray.addColorStop(.6,`rgba(${color},${strength*.11})`);ray.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=ray;
  const rays=red?18:12;for(let i=0;i<rays;i++){const a=i/rays*Math.PI*2+u*.18,spread=(i%2?.025:.055),reach=r*(i%2?1.15:1.5);ctx.beginPath();ctx.moveTo(Math.cos(a-spread)*w*.1,Math.sin(a-spread)*w*.1);ctx.lineTo(Math.cos(a-spread)*reach,Math.sin(a-spread)*reach*.78);ctx.lineTo(Math.cos(a+spread)*reach,Math.sin(a+spread)*reach*.78);ctx.closePath();ctx.fill();}
  ctx.strokeStyle=red?'#ffb3a1':'#ffe6a3';ctx.lineWidth=Math.max(1,w/220);ctx.globalAlpha=strength*.78;
  for(let layer=0;layer<3;layer++){const radius=r*(1-layer*.17),angle=(layer%2?-1:1)*u*.7;ctx.save();ctx.scale(1,.66);ctx.rotate(angle);ctx.beginPath();ctx.arc(0,0,radius,layer*.8,layer*.8+Math.PI*1.75);ctx.stroke();ctx.globalAlpha=strength*.48;const sides=layer===1?8:12;ctx.beginPath();for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,px=Math.cos(a)*radius*.96,py=Math.sin(a)*radius*.96;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.stroke();ctx.restore();}
  ctx.globalAlpha=strength*.8;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2-u*.4,px=Math.cos(a)*r,py=Math.sin(a)*r*.66;star(px,py,w*(i%3?.012:.025),i%3?b.theme.light:'#fff9df',strength*.85);}
  if(red){
   // Crimson fractures surround a black eclipse disc, edged by a bright gold corona.
   ctx.strokeStyle='#ff788b';ctx.lineWidth=Math.max(1,w/170);ctx.globalAlpha=strength*.82;
   for(let i=0;i<5;i++){const a=i/5*Math.PI*2+u*.2;ctx.beginPath();for(let j=0;j<5;j++){const d=w*(.2+j*.11),bend=Math.sin(j*2.2+i+u*8)*.12,px=Math.cos(a+bend)*d,py=Math.sin(a+bend)*d*.75;if(j)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.stroke();}
   ctx.globalCompositeOperation='source-over';ctx.globalAlpha=strength*.9;ctx.fillStyle='#190b28';ctx.beginPath();ctx.arc(0,0,w*.12,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffdda0';ctx.lineWidth=w*.012;ctx.beginPath();ctx.arc(0,0,w*.132,0,Math.PI*2);ctx.stroke();
   const corona=ctx.createRadialGradient(0,0,w*.13,0,0,w*.23);corona.addColorStop(0,`rgba(255,188,90,${strength*.65})`);corona.addColorStop(1,'rgba(255,90,70,0)');ctx.fillStyle=corona;ctx.beginPath();ctx.arc(0,0,w*.23,0,Math.PI*2);ctx.arc(0,0,w*.13,0,Math.PI*2,true);ctx.fill('evenodd');
  }else{star(0,0,w*.11*strength,'#fff2cc',strength*.8);}
  ctx.restore();
 }
 function draw(b,now){
  const rect=b.card.getBoundingClientRect(),t=clamp((now-b.at)/b.duration),x=rect.left+rect.width/2,y=rect.top+rect.height*.51,w=rect.width,theme=b.theme;
  if(!rect.width||!rect.height)return;
  grandeur(b,now);
  const pulse=Math.sin(Math.PI*t),r=Math.max(18,w*(.18+.5*ease(t))),fade=(1-t)**1.3;
  ctx.save();ctx.globalCompositeOperation='lighter';
  const glow=ctx.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,`rgba(${theme.rgb},${pulse*.22})`);glow.addColorStop(.42,`rgba(${theme.rgb},${pulse*.11})`);glow.addColorStop(1,`rgba(${theme.rgb},0)`);ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,r*2,r*2);
  if(b.reduced){ctx.globalAlpha=fade*.65;ctx.strokeStyle=theme.light;ctx.lineWidth=2;ctx.strokeRect(rect.left-2,rect.top-2,rect.width+4,rect.height+4);ctx.restore();return;}
  ctx.translate(x,y);ctx.scale(1,.64);ctx.rotate(.15+t*.45);
  ctx.globalAlpha=fade*.8;ctx.strokeStyle=`rgb(${theme.rgb})`;ctx.lineWidth=Math.max(1,w/190);ctx.shadowColor=theme.light;ctx.shadowBlur=5;
  for(const scale of [1,.84]){ctx.beginPath();ctx.ellipse(0,0,r*scale,r*scale,0,t*2,t*2+Math.PI*(1.35+theme.rank*.08));ctx.stroke();}
  ctx.shadowBlur=0;ctx.globalAlpha=fade*.62;
  const runes=6+theme.rank*2;
  for(let i=0;i<runes;i++){const a=i/runes*Math.PI*2,px=Math.cos(a)*r*.93,py=Math.sin(a)*r*.93,s=Math.max(2,w*.016);ctx.save();ctx.translate(px,py);ctx.rotate(a);ctx.beginPath();ctx.moveTo(-s,-s);ctx.lineTo(s,0);ctx.lineTo(-s,s);ctx.closePath();ctx.stroke();ctx.restore();}
  ctx.restore();
  const release=clamp((t-.2)/.8);
  if(release>0){ctx.save();ctx.globalCompositeOperation='lighter';for(const p of b.particles){const d=(w*.08+p.travel*w*.65)*ease(release),px=x+Math.cos(p.angle)*d,py=y+Math.sin(p.angle)*d*.7+w*release*release*.09;star(px,py,p.size*Math.min(1,w/200)*(1-release*.6),p.bright?theme.light:`rgb(${theme.rgb})`,(1-release)**1.6*.85);}ctx.restore();}
  // The eclipse seal appears only after the player has chosen to reveal this card.
  if(theme.rank===5&&t>.12&&t<.6){const seal=Math.sin((t-.12)/.48*Math.PI),sr=w*.09*seal;ctx.save();ctx.globalAlpha=seal*.3;ctx.strokeStyle='#ffe2a4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,sr+3,0,Math.PI*2);ctx.stroke();ctx.restore();}
 }
 function frame(now){
  raf=0;if(disposed||document.hidden||scope.SoulbeastCinematics?.isOpen()){clear();return;}
  bursts=bursts.filter(b=>b.card.isConnected&&now-b.at<b.duration);if(!bursts.length){clear();return;}
  fit();ctx.clearRect(0,0,innerWidth,innerHeight);frames++;const focus=bursts.filter(b=>b.theme.rank>=4&&!b.reduced).sort((a,b)=>b.theme.rank-a.theme.rank)[0];if(focus)grandeur(focus,now,true);for(const b of bursts)draw(b,now);canvas.dataset.active=String(bursts.length);raf=requestAnimationFrame(frame);
 }
 function play(cards){
  if(disposed||!ctx||document.hidden||scope.SoulbeastCinematics?.isOpen())return;
  bursts=bursts.filter(b=>b.card.isConnected&&performance.now()-b.at<b.duration);
  let budget=particleCap-bursts.reduce((n,b)=>n+b.particles.length,0);const now=performance.now(),reduced=!!motion?.matches;
  const visible=cards.filter(card=>{const r=card.getBoundingClientRect();return card.isConnected&&r.width>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;});
  const kind=card=>Object.keys(themes).find(k=>card.classList.contains('rarity-'+k))||'white';
  visible.sort((a,b)=>themes[kind(b)].rank-themes[kind(a)].rank);
  for(const card of visible){if(bursts.length>=cap)break;if(bursts.some(b=>b.card===card))continue;const color=kind(card),theme=themes[color],count=reduced?0:Math.min(theme.count,budget);if(!reduced&&count<6)continue;budget-=count;const particles=Array.from({length:count},()=>({angle:random()*Math.PI*2,travel:.2+random()*.8,size:2+random()*3,bright:random()>.45}));bursts.push({card,theme,at:now,duration:reduced?180:theme.rank>=4?1200:duration,reduced,particles});total++;lastColors.push(color);if(lastColors.length>20)lastColors.shift();}
  if(bursts.length){canvas.hidden=false;canvas.dataset.active=String(bursts.length);if(!raf)raf=requestAnimationFrame(frame);}
 }
 const visibility=()=>{if(document.hidden)clear();},hide=e=>{if(e.persisted)clear();else dispose();};
 function dispose(){if(disposed)return;clear();disposed=true;document.removeEventListener('visibilitychange',visibility);scope.removeEventListener('pagehide',hide);canvas.remove();}
 document.addEventListener('visibilitychange',visibility);scope.addEventListener('pagehide',hide);
 return {play,clear,dispose,stats:()=>({active:bursts.length,frames,total,colors:[...lastColors],scheduled:!!raf,pixelRatio:ratio,particles:bursts.reduce((n,b)=>n+b.particles.length,0),disposed})};
}
scope.GachaRevealCanvas={create};
})(window);
