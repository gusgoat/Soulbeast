export function bindWalkJoystick(base,knob,{canStart=()=>true,onStart=()=>{},onStop=()=>{}}={}){
 const direction={x:0,y:0,reset};
 let pointer=null;
 function reset(){
  if(pointer===null)return;
  const id=pointer;
  pointer=null;
  if(base.hasPointerCapture(id))base.releasePointerCapture(id);
  direction.x=direction.y=0;
  knob.style.transform='';
  base.classList.remove('active');
  onStop();
 }
 function move(event){
  if(event.pointerId!==pointer)return;
  if(event.pointerType==='mouse'&&event.buttons===0){reset();return;}
  event.preventDefault();
  const bounds=base.getBoundingClientRect(),radius=bounds.width*.33;
  if(!radius)return;
  const x=(event.clientX-bounds.left-bounds.width/2)/radius;
  const y=(event.clientY-bounds.top-bounds.height/2)/radius;
  const magnitude=Math.hypot(x,y),scale=magnitude<.13?0:1/Math.max(1,magnitude);
  direction.x=x*scale;direction.y=y*scale;
  knob.style.transform=`translate(${direction.x*radius}px,${direction.y*radius}px)`;
 }
 base.addEventListener('pointerdown',event=>{
  if(pointer!==null||event.button!==0||!canStart())return;
  pointer=event.pointerId;
  base.classList.add('active');
  // Capture keeps the gesture over other controls. Window listeners also
  // keep tracking if the browser releases capture before the gesture ends.
  try{base.setPointerCapture(pointer);}catch{}
  move(event);onStart();
 });
 window.addEventListener('pointermove',move,{capture:true,passive:false});
 for(const type of ['pointerup','pointercancel'])window.addEventListener(type,event=>{
  if(event.pointerId===pointer)reset();
 },true);
 window.addEventListener('blur',reset);
 window.addEventListener('pagehide',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 return direction;
}

export function bindJoystickPosition(base,{button,panel,save,reset,cancel,canEdit,onEdit}){
 const area=base.parentElement,landscape=matchMedia('(orientation:landscape)');
 const storageKey='soulbeast-colosseum-stick-position';
 const defaultPosition={x:0,y:1};
 const clamp=value=>Math.max(0,Math.min(1,value));
 let positions={},draft=null,drag=null;
 try{positions=JSON.parse(localStorage.getItem(storageKey))||{};}catch{}
 const orientation=()=>landscape.matches?'landscape':'portrait';
 function stored(){
  const point=positions[orientation()];
  return Number.isFinite(point?.x)&&Number.isFinite(point.y)?{x:clamp(point.x),y:clamp(point.y)}:defaultPosition;
 }
 function apply(){
  const {x,y}=draft||stored();
  area.style.setProperty('--stick-x',x);
  area.style.setProperty('--stick-y',y);
  area.toggleAttribute('data-stick-on-right',x>.55&&y>.5);
 }
 function close(commit=false,focus=false){
  if(!draft)return;
  if(commit){
   positions={...positions,[orientation()]:draft};
   try{localStorage.setItem(storageKey,JSON.stringify(positions));}catch{}
  }
  if(drag&&base.hasPointerCapture(drag.id))base.releasePointerCapture(drag.id);
  draft=drag=null;
  panel.hidden=true;area.removeAttribute('data-editing');base.removeAttribute('tabindex');
  button.setAttribute('aria-expanded','false');
  onEdit(false);
  apply();
  if(focus)button.focus();
 }
 button.onclick=()=>{
  if(draft){close(false,true);return;}
  if(!canEdit())return;
  draft={...stored()};
  onEdit(true);
  panel.hidden=false;area.setAttribute('data-editing','');base.tabIndex=0;
  button.setAttribute('aria-expanded','true');
  base.focus();
 };
 save.onclick=()=>close(true,true);
 cancel.onclick=()=>close(false,true);
 reset.onclick=()=>{if(draft){draft={...defaultPosition};apply();}};
 landscape.addEventListener('change',()=>{close();apply();});
 base.addEventListener('pointerdown',event=>{
  if(!draft||drag||event.button!==0)return;
  event.preventDefault();
  const rect=base.getBoundingClientRect();
  drag={id:event.pointerId,x:event.clientX-rect.left,y:event.clientY-rect.top};
  base.setPointerCapture(drag.id);
 });
 base.addEventListener('pointermove',event=>{
  if(drag?.id!==event.pointerId)return;
  const rect=area.getBoundingClientRect();
  draft={
   x:clamp((event.clientX-rect.left-drag.x)/Math.max(1,rect.width-base.offsetWidth)),
   y:clamp((event.clientY-rect.top-drag.y)/Math.max(1,rect.height-base.offsetHeight))
  };
  apply();
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])base.addEventListener(type,event=>{
  if(drag?.id===event.pointerId)drag=null;
 });
 const arrows={ArrowLeft:[-.03,0],ArrowRight:[.03,0],ArrowUp:[0,-.03],ArrowDown:[0,.03]};
 base.addEventListener('keydown',event=>{
  const step=arrows[event.key];
  if(!draft||!step)return;
  event.preventDefault();
  draft={x:clamp(draft.x+step[0]),y:clamp(draft.y+step[1])};
  apply();
 });
 window.addEventListener('keydown',event=>{
  if(draft&&event.key==='Escape'){event.preventDefault();close(false,true);}
 });
 apply();
 return {get active(){return draft!==null;},close};
}
