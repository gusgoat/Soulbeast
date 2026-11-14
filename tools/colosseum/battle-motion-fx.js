(() => {
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function layer(parent,className,style){
  const node=document.createElement('i');
  node.className=className;
  Object.assign(node.style,{position:'absolute',pointerEvents:'none',...style});
  parent.append(node);
  return node;
 }
 function play(node,frames,duration,rate,delay=0){
  const animation=node.animate(frames,{duration,delay,fill:'both'});
  animation.playbackRate=rate;
  return animation;
 }
 function lightning(node,art,rate){
  const powerful=art.asset==='electric-high';
  const svgNS='http://www.w3.org/2000/svg';
  const overlay=document.createElementNS(svgNS,'svg');
  overlay.classList.add('battle-motion-lightning');
  overlay.setAttribute('viewBox','0 0 240 100');
  overlay.setAttribute('preserveAspectRatio','none');
  overlay.setAttribute('aria-hidden','true');
  Object.assign(overlay.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',mixBlendMode:'screen'});
  const color=powerful?'#ffe2a3':'#b3eeff';
  const paths=[
   'M4 51 L28 46 47 55 65 44 85 51 105 42 124 52 146 46 165 55 186 41 209 52 235 49',
   'M47 55 L54 43 50 35 66 29 77 14',
   'M85 51 L99 63 97 72 119 78 126 91',
   'M146 46 L153 34 148 27 169 20 174 8',
   'M186 41 L192 32 209 31 218 18 232 16',
   'M209 52 L217 63 212 72 227 84',
  ];
  if(powerful)paths.push(
   'M65 44 L74 34 82 38 90 24 106 17',
   'M124 52 L136 66 148 63 157 75 151 88',
   'M165 55 L175 66 189 62 197 78 205 82'
  );
  paths.forEach((points,index)=>{
   const path=document.createElementNS(svgNS,'path');
   path.setAttribute('d',points);
   path.setAttribute('pathLength','1');
   path.setAttribute('fill','none');
   path.setAttribute('stroke-linecap','round');
   path.setAttribute('stroke-linejoin','round');
   path.setAttribute('stroke',index===0?'#ecfaff':color);
   path.setAttribute('stroke-width',index===0?'2.2':powerful?'1.55':'1.25');
   path.setAttribute('vector-effect','non-scaling-stroke');
   path.setAttribute('stroke-dasharray',index===0?'.28 1':'1');
   path.style.filter='drop-shadow(0 0 2px '+(powerful?'#ffb446':'#3dbfff')+')';
   overlay.append(path);
   const delay=index===0?10:45+index*31;
   play(path,[{strokeDashoffset:'1',opacity:0},
    {opacity:.9,offset:.23},{strokeDashoffset:'0',opacity:.8,offset:.7},
    {strokeDashoffset:index===0?'-.25':'0',opacity:0}],index===0?480:265,rate,delay);
  });
  node.append(overlay);
 }
 const flame={color:'#ffb047',glow:'#ff6227',shape:'flame',count:9};
 const ice={color:'#dcfaff',glow:'#63d5ff',shape:'shard',count:9};
 const earth={color:'#c49b6b',glow:'#785839',shape:'rock',count:8};
 const holy={color:'#fff4b5',glow:'#ffd566',shape:'spark',count:8};
 const dark={color:'#c49bff',glow:'#713bc9',shape:'vapor',count:7,inward:true};
 const recipes={
  fire:flame,'fire-high':flame,ice,'ice-high':ice,
  'water-high':{color:'#c0f7ff',glow:'#308af4',shape:'drop',count:10},
  'earth-high':earth,slam:earth,impact:earth,
  nature:{color:'#b6ea68',glow:'#4f9c37',shape:'leaf',count:8},
  dark,'dark-high':dark,holy,'holy-high':holy,
  'ghost-high':{color:'#9dffe5',glow:'#48c0cf',shape:'vapor',count:8},
  'dragon-high':{color:'#fae0ff',glow:'#b965ff',shape:'scale',count:9},
  'poison-high':{color:'#c9ed79',glow:'#559329',shape:'bubble',count:8},
  'psychic-high':{color:'#f6b3ff',glow:'#b768fb',shape:'ring',count:5},
  music:{color:'#ffe4ff',glow:'#c66aee',shape:'note',count:6},
  shuriken:{color:'#e1f2ff',glow:'#789bbf',shape:'spark',count:5},
  melee:{color:'#fff2d0',glow:'#ffad51',shape:'spark',count:6},
 };
 const shapes={
  flame:{width:7,height:17,borderRadius:'90% 8% 65% 42%',rotate:55},
  shard:{width:5,height:13,clipPath:'polygon(50% 0,100% 66%,60% 100%,0 48%)'},
  rock:{width:8,height:7,clipPath:'polygon(7% 19%,53% 0,97% 31%,83% 85%,23% 100%,0 61%)'},
  leaf:{width:9,height:5,borderRadius:'80% 0 80% 0'},
  drop:{width:6,height:9,borderRadius:'70% 45% 58% 58%'},
  vapor:{width:15,height:13,borderRadius:'50%',soft:true},
  scale:{width:8,height:8,clipPath:'polygon(50% 0,100% 40%,70% 100%,30% 100%,0 40%)'},
  spark:{width:11,height:11,clipPath:'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)'},
  bubble:{width:7,height:7,borderRadius:'50%',ring:true},
  ring:{width:21,height:21,borderRadius:'50%',ring:true},
  note:{width:15,height:16},
 };
 function particles(node,recipe,rate,kind){
  const shape=shapes[recipe.shape],impact=kind==='impact'||kind==='eruption';
  for(let i=0;i<recipe.count;i++){
   const lane=i%2===0?1:-1;
   const spread=12+(i*7)%21;
   const start=impact?50:kind==='beam'?12+i*77/recipe.count:36+i*31/recipe.count;
   const height=impact?67:46+lane*(i%4)*5;
   const endX=impact?(i/(recipe.count-1)-.5)*110:recipe.inward?-18:17+(i*3)%22;
   const endY=impact?-22-(i*7)%29:lane*(recipe.inward?-spread:spread);
   const particle=layer(node,'battle-motion-particle',{
    left:start+'%',top:height+'%',width:shape.width+'px',height:shape.height+'px',
    borderRadius:shape.borderRadius,clipPath:shape.clipPath,
    color:recipe.color,border:shape.ring?'1px solid '+recipe.color:'',
    background:shape.ring||recipe.shape==='note'?'transparent':shape.soft?
     'radial-gradient(ellipse,'+recipe.color+',transparent 67%)':
     'linear-gradient(135deg,'+recipe.color+', '+recipe.glow+')',
    filter:'drop-shadow(0 0 4px '+recipe.glow+')',
   });
   particle.dataset.motif=recipe.shape;
   if(recipe.shape==='note'){
    particle.textContent=i%2?'♫':'♪';particle.style.font='bold 15px system-ui';
   }
   const turn=(shape.rotate||0)+lane*(28+i*11);
   play(particle,[{transform:'translate(-50%,-50%) scale(.35)',opacity:0},
    {opacity:.88,offset:.24},
    {transform:'translate('+endX+'px,'+endY+'px) rotate('+turn+'deg) scale('+(shape.soft?1.85:.78)+')',opacity:0}],
   355+i%3*45,rate,i*24);
  }
 }
 function impact(parent,image,asset,rate){
  const recipe=recipes[asset];
  if(!recipe||reduced()||!image.animate)return;
  const bounds=layer(parent,'battle-motion-impact',{left:image.style.left,top:image.style.top,
   width:image.style.width,height:image.style.height,transform:'translate(-50%,-50%)'});
  particles(bounds,recipe,rate,'impact');
 }
 function flight(node,image,art,rate){
  if(reduced()||!node.animate)return;
  if(art.kind==='meteor'){
   const heat=layer(node,'battle-motion-heat',{inset:'0',mixBlendMode:'screen',background:'radial-gradient(ellipse at 76% 76%, #ffd183aa, #ff6d2540 20%, transparent 39%)'});
   play(heat,[{opacity:.24},{opacity:.68},{opacity:.3},{opacity:.9},{opacity:.38}],620,rate);
   for(let i=0;i<9;i++){
    const size=2+i%3,spread=(i%5-2)*4;
    const ember=layer(node,'battle-motion-ember',{left:(82-i*3+spread)+'%',top:(79-i*3-spread)+'%',
     width:size+'px',height:size*2.8+'px',borderRadius:'70%',background:i%3?'#ffac48':'#fff0b3',
     boxShadow:'0 0 6px 1px #ff752d',mixBlendMode:'screen'});
    play(ember,[{transform:'rotate(-43deg) scale(.5)',opacity:0},
     {transform:'translate(-12px,-13px) rotate(-43deg) scale(1)',opacity:1,offset:.3},
     {transform:'translate('+(-38-i*2)+'px,'+(-42+i*2)+'px) rotate(-60deg) scale(.35)',opacity:0}],390,rate,i*43);
   }
  }else if(art.kind==='vortex'){
   for(let i=0;i<4;i++){
    const ring=layer(node,'battle-motion-wind',{top:(18+i*16)+'%',left:(11+i*8)+'%',
     width:(78-i*16)+'%',aspectRatio:'1',transform:'scaleY(.27) rotate(-12deg)',transformOrigin:'50% 18%'});
    const current=layer(ring,'battle-motion-current',{inset:'0',borderRadius:'50%',
     border:'3px solid transparent',borderTopColor:'#d8f8ff',borderRightColor:'var(--c)',
     filter:'drop-shadow(0 0 4px var(--c))'});
    const angle=i*95;
    play(current,[{transform:'rotate('+angle+'deg)',opacity:.35},
     {transform:'rotate('+(angle+205)+'deg)',opacity:.87,offset:.48},
     {transform:'rotate('+(angle+450)+'deg)',opacity:.4}],570,rate);
   }
  }else if(art.asset==='lightning'||art.asset==='electric-high'){
   lightning(node,art,rate);
  }else if(art.kind==='beam'||art.asset==='crescent'){
   const glow=image.cloneNode(false);
   glow.className='battle-motion-glow';glow.alt='';
   glow.style.filter=(art.tint==='none'?'':art.tint+' ')+'brightness(1.85) drop-shadow(0 0 7px var(--c))';
   glow.style.mixBlendMode='screen';
   node.append(glow);
   play(glow,[{opacity:.08},{opacity:.72,offset:.24},{opacity:.32,offset:.56},{opacity:.62,offset:.79},{opacity:0}],art.kind==='beam'?750:560,rate);
   if(art.kind==='beam'){
    const surge=layer(node,'battle-motion-surge',{inset:'0',mixBlendMode:'screen',
     background:'linear-gradient(90deg,transparent,#fff9 46%,#fff 50%,transparent 62%)',
     maskImage:'radial-gradient(ellipse 68% 10% at center,black,transparent)',backgroundSize:'220% 100%'});
    play(surge,[{backgroundPosition:'95% 50%',opacity:0},{opacity:.88,offset:.36},
     {backgroundPosition:'4% 50%',opacity:0}],700,rate);
   }
  }
  const recipe=recipes[art.asset];
  if(recipe)particles(node,recipe,rate,art.kind);
  if(art.asset==='shuriken')
   play(image,[{rotate:'0deg'},{rotate:'900deg'}],560,rate);
 }
 function debris(shell,rate,seed,wide){
  if(reduced()||!shell.animate)return;
  const dust=layer(shell,'battle-motion-dust',{left:'0',top:'0',width:'85px',height:'25px',
   borderRadius:'50%',background:'radial-gradient(ellipse,#bfa58b91, #98816830 47%, transparent 72%)'});
  play(dust,[{transform:'translate(-50%,-50%) scale(.3)',opacity:0},
   {transform:'translate(-50%,-58%) scale(1.1)',opacity:.85,offset:.17},
   {transform:'translate(-50%,-85%) scale(1.9)',opacity:0}],640,rate);
  const count=wide?11:7;
  for(let i=0;i<count;i++){
   const size=4+(seed+i*7)%8,dx=(i/(count-1)-.5)*(wide?184:137),height=20+(seed+i*19)%53;
   const spin=(i%2?-1:1)*(145+i*34);
   const rock=layer(shell,'battle-motion-rock',{left:'0',top:'0',width:size+'px',height:(size*.83)+'px',
    clipPath:i%2?'polygon(13% 27%,48% 0,85% 13%,100% 58%,65% 100%,8% 82%)':'polygon(0 42%,32% 4%,82% 0,100% 68%,53% 100%,11% 78%)',
    background:i%2?'linear-gradient(145deg,#edc9a6,#765741 49%,#352c2a 51%,#967257)':'linear-gradient(155deg,#cdc5b8,#8e8271 45%,#544c46 52%,#312823)'});
   play(rock,[{transform:'translate(0,0) scale(.52)',opacity:0},
    {transform:'translate('+dx*.12+'px,-'+height*.36+'px) scale(1)',opacity:1,offset:.13},
    {transform:'translate('+dx*.62+'px,-'+height+'px) rotate('+spin*.6+'deg)',opacity:1,offset:.49},
    {transform:'translate('+dx+'px,'+(5+i%3*5)+'px) rotate('+spin+'deg) scale(.72)',opacity:0}],580,rate,i%3*16);
  }
 }
 globalThis.SoulbeastBattleMotion={flight,impact,debris};
})();
