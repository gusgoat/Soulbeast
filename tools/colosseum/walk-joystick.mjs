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
