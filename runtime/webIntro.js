// Website introduction video. Independent of character saves and story chapters.
// @soulbeast-unit 1090-webIntro
const WEB_INTRO={
 key:'sealbeast_web_intro_v1',active:false,seenThisPage:false,resume:null,root:null,video:null,
 busyGame(){return !!(S.zone||S.battle||PVP.token||['waiting','lobby','active'].includes(PVP.room?.status)||WORLD.roomId||CAMP.roomId||GUILD_UI.warRoom?.replaying);},
 seen(){try{return this.seenThisPage||localStorage.getItem(this.key)==='seen';}catch{return this.seenThisPage;}},
 canOpen(replay=false){return !this.active&&!this.busyGame()&&(replay||!document.documentElement?.hasAttribute('data-skip-web-intro'))&&(replay||!this.seen());},
 open(resume,replay=false){
  const app=document.getElementById('app');
  if(!this.canOpen(replay)||typeof app?.appendChild!=='function')return false;
  const root=document.createElement('section');root.className='web-intro';root.id='webIntro';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','วิดีโอแนะนำ Soulbeast');
  root.innerHTML='<div class="web-intro-top"><span>SOULBEAST · แนะนำเกม</span><button type="button" class="btn web-intro-skip">ข้ามอินโทร ›</button></div><video id="webIntroVideo" class="web-intro-video" autoplay muted playsinline controls preload="metadata" poster="assets/video/soulbeast-intro-v2.webp" aria-label="วิดีโอแนะนำเกม Soulbeast"><source src="assets/video/soulbeast-intro-v2.mp4" type="video/mp4"></video><div class="web-intro-actions"><button type="button" class="btn web-intro-play" hidden>เล่นอินโทร</button><button type="button" class="btn web-intro-sound" aria-pressed="false">เปิดเสียง</button><small>กดข้ามเพื่อเข้าสู่เกมได้ทันที</small></div>';
  this.active=true;this.resume=resume;this.root=root;Sound.mute();Tutorial.clear();app.replaceChildren(root);
  const video=this.video=root.querySelector('video'),play=root.querySelector('.web-intro-play'),sound=root.querySelector('.web-intro-sound');
  video.muted=true;video.volume=Math.max(0,Math.min(1,Sound.volume));
  const attempt=()=>{try{const promise=video.play();if(promise?.catch)promise.catch(()=>{if(this.active&&this.video===video)play.hidden=false;});}catch{play.hidden=false;}};
  root.querySelector('.web-intro-skip').addEventListener('click',()=>this.finish());
  play.addEventListener('click',attempt);
  sound.addEventListener('click',()=>{video.muted=!video.muted;sound.textContent=video.muted?'เปิดเสียง':'ปิดเสียง';sound.setAttribute('aria-pressed',String(!video.muted));attempt();});
  video.addEventListener('play',()=>{play.hidden=true;});
  video.addEventListener('volumechange',()=>{sound.textContent=video.muted?'เปิดเสียง':'ปิดเสียง';sound.setAttribute('aria-pressed',String(!video.muted));});
  video.addEventListener('ended',()=>{if(this.video===video)this.finish();});
  // A broken/unsupported media file must never prevent entry into the game.
  video.addEventListener('error',()=>{if(this.video===video)this.finish(false);});
  video.querySelector('source')?.addEventListener('error',()=>{if(this.video===video)this.finish(false);});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.finish();}});
  root.querySelector('.web-intro-skip').focus();attempt();return true;
 },
 finish(remember=true){
  if(!this.active)return;
  const resume=this.resume,video=this.video;this.active=false;this.resume=null;this.video=null;
  if(remember){this.seenThisPage=true;try{localStorage.setItem(this.key,'seen');}catch{}}
  if(video){video.pause();video.removeAttribute('src');video.querySelectorAll('source').forEach(source=>source.removeAttribute('src'));video.load();}
  this.root?.remove();this.root=null;if(resume)resume();
 }
};
const webIntroRender=render;render=function(...args){if(WEB_INTRO.active)return;return webIntroRender(...args);};
const webIntroSoundSync=Sound.sync;Sound.sync=function(...args){if(WEB_INTRO.active){this.mute();return;}return webIntroSoundSync.apply(this,args);};
const webIntroSettings=vSettings;vSettings=function(){return webIntroSettings()+'<section class="card stack"><h3>วิดีโอแนะนำเกม</h3><button class="btn" data-a="webIntroReplay" '+(WEB_INTRO.busyGame()?'disabled':'')+'>ดูอินโทรอีกครั้ง</button></section>';};
handlers.webIntroReplay=()=>WEB_INTRO.open(()=>{render();Sound.sync();},true);
// @soulbeast-end 1090-webIntro
