// @soulbeast-unit 1104-battleSpeed
const FOREST_ORDER=[7,1,2,3,4,5,6,8];
function forestNext(id){return FOREST_ORDER[FOREST_ORDER.indexOf(Number(id))+1]||null;}
function forestUnlocked(id){const at=FOREST_ORDER.indexOf(Number(id));return at>=0&&FOREST_ORDER.slice(0,at).every(k=>(S.P.forestClears?.[k]||0)>0);}
for(const key of ['zone','dozone']){const original=handlers[key];handlers[key]=function(v){if(!forestUnlocked(Number(v))){toast('ชนะบอสในดินแดนก่อนหน้าเพื่อปลดล็อก');return;}return original(v);};}
const BattleSpeed={
 value:1,pending:null,
 rate(){return typeof MotionTimeline!=='undefined'&&MotionTimeline.active()?this.value:1;},
 ms(ms){return ms/this.rate();},
 visual(){if(!document.getAnimations)return;for(const a of document.getAnimations()){const n=a.effect?.target;if(n?.closest?.('.battle-motion,.motion-contact-layer,#vfx,.online-combat-board'))a.playbackRate=this.rate();}},
 sync(){if(!MotionTimeline.busy()&&this.pending){this.value=this.pending;this.pending=null;}const controls=document.querySelector?.('.battle-command-controls');if(!controls?.append)return;controls.classList.add('has-battle-speed');let button=document.getElementById('battleSpeed');if(!button){button=document.createElement('button');button.id='battleSpeed';button.className='btn sm battle-speed';button.dataset.a='battleSpeed';controls.append(button);}button.textContent='×'+(this.pending||this.value)+(this.pending?' ⏳':'');button.title=this.pending?'เปลี่ยนความเร็วในท่าถัดไป':'ความเร็วต่อสู้';button.setAttribute('aria-label','ความเร็วต่อสู้ ×'+(this.pending||this.value));this.visual();}
};
handlers.battleSpeed=()=>{const next=(BattleSpeed.pending||BattleSpeed.value)===1?2:1;if(MotionTimeline.busy())BattleSpeed.pending=next;else BattleSpeed.value=next;BattleSpeed.sync();};
const speedRender=render;render=function(...args){const out=speedRender(...args);BattleSpeed.sync();return out;};
if(typeof MutationObserver!=='undefined'){const observer=new MutationObserver(()=>BattleSpeed.visual());observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-motion-phase']});}
const speedTrack=Music.track;Music.track=function(key){const t=speedTrack.call(this,key);if(t?.audio)t.audio.playbackRate=audioTrackKind(key)==='effects'?BattleSpeed.rate():1;return t;};
const speedTone=Sound.tone;Sound.tone=function(f,e,d=.15,v=.07,t='sine',delay=0){return speedTone.call(this,f,e,d/BattleSpeed.rate(),v,t,delay/BattleSpeed.rate());};
const speedHiss=Sound.hiss;Sound.hiss=function(d=.2,v=.05,f=1000,delay=0,k='bandpass'){return speedHiss.call(this,d/BattleSpeed.rate(),v,f,delay/BattleSpeed.rate(),k);};
// @soulbeast-end 1104-battleSpeed
