import {BOSS_ROOM_THEMES,bossRoomScenery} from '../../assets/forest-walk/boss-rooms.js?v=desert-release-1';
const $=id=>document.getElementById(id),stage=$('stage'),pieces=$('pieces');
const labels=['พื้นและบันได','ผนังหลัง','ผนังซ้าย','ผนังขวา','ซุ้มเหนือประตู','บานประตูปิด','รูปปั้นบอสด้านซ้าย','รูปปั้นบอสด้านขวา'];
let current,room,request=0,separate=false;
function canvasContext(canvas){
  const {width,height}=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);return {ctx,width,height};
}
function paint(){
  if(!room)return;
  const parts=room.props.filter(p=>p.source);
  if(separate){
    for(const [i,canvas] of [...pieces.querySelectorAll('canvas')].entries()){
      const {ctx,width,height}=canvasContext(canvas),p=parts[i],s=p.source,k=Math.min((width-16)/s[2],(height-16)/s[3]);
      ctx.drawImage(room.tiles[p.art],...s,(width-s[2]*k)/2,(height-s[3]*k)/2,s[2]*k,s[3]*k);
    }
    return;
  }
  const {ctx,width,height}=canvasContext(stage),gradient=ctx.createLinearGradient(0,0,0,height);
  gradient.addColorStop(0,current.color);gradient.addColorStop(1,'#101d22');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  const rects=parts.map(p=>{const h=p.width*p.source[3]/p.source[2];return {p,x:p.x-p.width/2,y:-p.z*.64-(p.elevation||0)-h*p.pivot,w:p.width,h};});
  const minX=Math.min(...rects.map(r=>r.x)),minY=Math.min(...rects.map(r=>r.y)),maxX=Math.max(...rects.map(r=>r.x+r.w)),maxY=Math.max(...rects.map(r=>r.y+r.h));
  const k=Math.min((width-40)/(maxX-minX),(height-40)/(maxY-minY)),ox=(width-(maxX-minX)*k)/2,oy=(height-(maxY-minY)*k)/2;
  rects.sort((a,b)=>Number(!!b.p.ground)-Number(!!a.p.ground)||b.p.z-a.p.z);
  for(const r of rects)ctx.drawImage(room.tiles[r.p.art],...r.p.source,ox+(r.x-minX)*k,oy+(r.y-minY)*k,r.w*k,r.h*k);
  stage.dataset.theme=current.theme;stage.dataset.parts=String(parts.length);
}
function mode(value){separate=value;stage.hidden=value;pieces.hidden=!value;$('assembled').setAttribute('aria-pressed',String(!value));$('separate').setAttribute('aria-pressed',String(value));paint();}
async function choose(theme){
  const ticket=++request;current=theme;room=null;stage.removeAttribute('data-theme');pieces.replaceChildren();
  $('title').textContent=theme.name;$('boss').textContent=theme.boss+' · Lv. '+theme.level;$('motif').textContent=theme.motif;
  $('availability').textContent=theme.walking?'มีฉากเดินให้ลองแล้ว':'แบบเตรียมไว้สำหรับฉากเดินของพื้นที่นี้';
  $('play').hidden=!theme.walking;$('play').href=theme.walking?'http://127.0.0.1:'+({training:8832,moonlight:8833,desert:8834,dragon:8835,heaven:8836}[theme.theme])+'/?v=dragon-preview-1&scene=boss':'';
  for(const b of $('themes').children)b.setAttribute('aria-pressed',String(b.dataset.theme===theme.theme));
  const url=new URL(location.href);url.searchParams.set('theme',theme.theme);history.replaceState(null,'',url);
  $('status').textContent='กำลังโหลดชิ้นส่วนประตู…';
  try{
    const loaded=await bossRoomScenery(theme.theme);if(ticket!==request)return;room=loaded;
    for(const label of labels){const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');caption.textContent=label;canvas.setAttribute('aria-label',label);figure.append(canvas,caption);pieces.append(figure);}
    $('status').textContent='PNG โปร่งใส 8 ชิ้น · ประตูปิดและรูปปั้นบอสคู่';paint();
  }catch(e){if(ticket===request)$('status').textContent='โหลดภาพไม่สำเร็จ: '+e.message;}
}
for(const theme of BOSS_ROOM_THEMES){const button=document.createElement('button'),small=document.createElement('small');button.dataset.theme=theme.theme;button.append(document.createTextNode(theme.name));small.textContent=theme.boss;button.append(small);button.onclick=()=>choose(theme);$('themes').append(button);}
$('assembled').onclick=()=>mode(false);$('separate').onclick=()=>mode(true);
new ResizeObserver(paint).observe(document.querySelector('main'));
choose(BOSS_ROOM_THEMES.find(t=>t.theme===new URLSearchParams(location.search).get('theme'))||BOSS_ROOM_THEMES[1]);
