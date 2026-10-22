const fs=require('fs'),assert=require('assert/strict');
(async()=>{for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run,store=new Map([['sealbeast_save_v1','original player save']]);
 g.ctx.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 const made=[];let rejectPlay=false;
 function element(){return {listeners:{},attrs:{},hidden:false,addEventListener(n,fn){this.listeners[n]=fn;},setAttribute(n,v){this.attrs[n]=v;},removeAttribute(n){delete this.attrs[n];},focus(){this.focused=true;},remove(){this.removed=true;}};}
 function createRoot(){const root=element(),video=element(),source=element(),skip=element(),play=element(),sound=element();play.hidden=true;video.muted=true;video.play=()=>rejectPlay?Promise.reject(Error('autoplay blocked')):Promise.resolve();video.pause=()=>video.paused=true;video.load=()=>video.unloaded=true;video.querySelector=()=>source;video.querySelectorAll=()=>[source];root.querySelector=s=>s==='video'?video:s==='.web-intro-play'?play:s==='.web-intro-sound'?sound:skip;Object.assign(root,{video,source,skip,play,sound});made.push(root);return root;}
 const app={appendChild(){},replaceChildren(root){this.root=root;}};
 g.ctx.document.getElementById=id=>id==='app'?app:null;g.ctx.document.createElement=createRoot;g.ctx.document.documentElement={hasAttribute:()=>false};
 r("S={screen:'start',ui:{introSeen:false}};PVP.token='';PVP.room=null;WORLD.roomId='';CAMP.roomId='';GUILD_UI.warRoom=null;var resumed=0;Sound.mute=()=>{};");
 assert.equal(r('WEB_INTRO.open(()=>resumed++)'),true);let root=made.at(-1);assert.equal(root.video.muted,true);assert(root.skip.focused);assert.equal(r('resumed'),0);
 root.sound.listeners.click();assert.equal(root.video.muted,false);assert.equal(root.sound.attrs['aria-pressed'],'true');
 root.skip.listeners.click();r('WEB_INTRO.finish();');assert.equal(r('resumed'),1);assert.equal(store.get('sealbeast_web_intro_v1'),'seen');assert(root.video.paused&&root.video.unloaded);assert(root.removed);assert.equal(r('S.ui.introSeen'),false,'Website video must not skip story intro');assert.equal(r('WEB_INTRO.open(()=>resumed++)'),false);
 const saved=r('JSON.stringify(S)');assert(r('WEB_INTRO.open(()=>resumed++,true)'));root=made.at(-1);root.video.listeners.ended();assert.equal(r('resumed'),2);assert.equal(r('JSON.stringify(S)'),saved);
 // Storage unavailability still remembers this page; failure continues without marking watched.
 store.delete('sealbeast_web_intro_v1');r('WEB_INTRO.seenThisPage=false;');assert(r('WEB_INTRO.open(()=>resumed++)'));const stale=made.at(-1);stale.source.listeners.error();assert.equal(r('resumed'),3);assert.equal(r('WEB_INTRO.seen()'),false);
 assert(r('WEB_INTRO.open(()=>resumed++)'));root=made.at(-1);stale.video.listeners.error();stale.video.listeners.ended();assert.equal(r('WEB_INTRO.active'),true,'Stale media event must not close a later replay');root.listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(r('resumed'),4);
 g.ctx.localStorage.setItem=()=>{throw Error('storage blocked');};assert(r('WEB_INTRO.open(()=>resumed++,true)'));made.at(-1).skip.listeners.click();assert.equal(r('WEB_INTRO.active'),false);assert.equal(r('resumed'),5);
 // Blocked autoplay leaves an explicit play button and immediately usable skip.
 rejectPlay=true;assert(r('WEB_INTRO.open(()=>resumed++,true)'));root=made.at(-1);await Promise.resolve();await Promise.resolve();assert.equal(root.play.hidden,false);root.skip.listeners.click();rejectPlay=false;
 for(const busy of ["S.zone={id:1}","S.battle={v:4}","PVP.token='existing-room'","PVP.room={status:'active'}","WORLD.roomId='existing-world'","CAMP.roomId='existing-camp'","GUILD_UI.warRoom={replaying:true}"]){r("S.zone=null;S.battle=null;PVP.token='';PVP.room=null;WORLD.roomId='';CAMP.roomId='';GUILD_UI.warRoom=null;");r(busy);assert.equal(r('WEB_INTRO.open(()=>resumed++,true)'),false);}
 assert.equal(store.get('sealbeast_save_v1'),'original player save');
 store.delete('sealbeast_web_intro_v1');g.ctx.localStorage.setItem=(k,v)=>store.set(k,v);
 r("S.zone=null;S.battle=null;PVP.token='';PVP.room=null;WORLD.roomId='';CAMP.roomId='';GUILD_UI.warRoom=null;WEB_INTRO.seenThisPage=false;var bootRenders=0,bootClouds=0;load=()=>{S={screen:'start',ui:{introSeen:false}}};migrate=()=>{};render=()=>bootRenders++;cloudInit=()=>bootClouds++;boot();");
 assert.equal(r('bootRenders'),0);assert.equal(r('bootClouds'),0);made.at(-1).skip.listeners.click();assert.equal(r('bootRenders'),1);assert.equal(r('bootClouds'),1);assert.equal(r('S.ui.introSeen'),false);r('boot();');assert.equal(r('bootRenders'),2);assert.equal(r('bootClouds'),2);

 console.log('PASS '+file+': first-visit/skip/end/revisit/replay, muted autoplay fallback, Escape, media error, stale event guards, unchanged story/save, active-game bypass');
}
const mp4=fs.readFileSync('assets/video/soulbeast-intro-v1.mp4'),atoms=[];for(let p=0;p+8<=mp4.length;){let n=mp4.readUInt32BE(p);atoms.push(mp4.toString('ascii',p+4,p+8));if(n===1)n=Number(mp4.readBigUInt64BE(p+8));if(n<8)break;p+=n;}assert(atoms.indexOf('moov')>=0&&atoms.indexOf('moov')<atoms.indexOf('mdat'),'MP4 must stream before full download');assert(mp4.length<40*1024*1024);assert(fs.statSync('assets/video/soulbeast-intro-v1.webp').size>1000);console.log('PASS MP4 faststart, web-sized video and poster');
})().catch(e=>{console.error(e);process.exitCode=1;});
