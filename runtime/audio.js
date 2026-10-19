// Music, sound effects and mixer
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0155-MUSIC_ASSETS


/* ================= PORTRAITS & TEXT ================= */
/* Procedural audio: preferences are separate from game saves. */

// Uploaded music is embedded so the game also works when opened as a local file.
const MUSIC_ASSETS=SoulbeastContent.MUSIC_ASSETS();
// @soulbeast-end 0155-MUSIC_ASSETS
// @soulbeast-unit 0156-Music

const Music={tracks:{},current:'',serial:0,
 track(key){if(this.tracks[key])return this.tracks[key];const audio=new Audio(MUSIC_ASSETS[key]);audio.preload='none';audio.loop=key!=='step';const source=Sound.ctx.createMediaElementSource(audio),gain=Sound.ctx.createGain();gain.gain.value=0;source.connect(gain);gain.connect(audioBus(audioTrackKind(key)));return this.tracks[key]={audio,gain}},
 play(key,level){try{const t=this.track(key);t.gain.gain.cancelScheduledValues(Sound.ctx.currentTime);t.gain.gain.setValueAtTime(0,Sound.ctx.currentTime);t.gain.gain.linearRampToValueAtTime(level,Sound.ctx.currentTime+.6);const p=t.audio.play();if(p)p.catch(()=>{});return t}catch(e){return null}},
 sync(){if(!Sound.enabled||document.hidden||Sound.ctx?.state!=='running'){this.stop();return}const battle=S.screen==='battle'&&S.battle||S.screen==='pvp'&&PVP.room?.status==='active'||S.screen==='camp'&&CAMP.room?.status==='active';const key=!S.P||S.screen==='start'?'intro':battle?'tense':S.zone?(['spring','revival','cleanse'].includes(S.zone.ev?.type)?'water':'forest'):'town';const scene=key+':'+(isBossDoorScene()?'boss-door':'')+':'+S.screen+':'+(S.zone?.ev?.type||'')+':'+(S.battle?.over?.res||'');if(this.current===key&&this.scene===scene)return;this.scene=scene;if(this.current){const old=this.tracks[this.playing||this.current];if(old){old.audio.pause();old.audio.currentTime=0}}this.current=key;let selected=key;if(key==='tense')selected=ExtraAudio.choose('battleMusic')||key;else if(key==='town'&&S.screen==='hospital')selected=ExtraAudio.choose('peaceMusic')||key;else if(key==='town'&&S.screen==='story')selected=ExtraAudio.choose('pianoMusic')||key;else if(key==='forest'&&isBossDoorScene())selected=ExtraAudio.choose('hauntMusic')||'tense';else if(key==='forest'&&['mist','ruins'].includes(S.zone?.ev?.type))selected=ExtraAudio.choose('hauntMusic')||key;if(S.battle?.over?.res==='lose')selected=ExtraAudio.choose('sadMusic')||selected;this.playing=selected;this.play(selected,.38)},
 step(){if(!Sound.enabled||document.hidden)return;Sound.run(()=>{const t=this.track('step');t.audio.pause();t.audio.currentTime=0;this.play('step',.65)})},
 stop(){this.current='';for(const t of Object.values(this.tracks)){t.audio.pause();t.audio.currentTime=0}}
};
// @soulbeast-end 0156-Music
// @soulbeast-unit 0157-ExtraAudio



const ExtraAudio={groups:{"peaceMusic": ["a0"], "charge": ["a1"], "grand": ["a2", "a38"], "fairy": ["a3", "a27"], "water": ["a4"], "psychicStrong": ["a5"], "psychic": ["a6"], "fireStrong": ["a7"], "boss": ["a8", "a11"], "roar": ["a9", "a10", "a21", "a79", "a80", "a81"], "hauntMusic": ["a12"], "sadMusic": ["a13"], "gun": ["a14"], "windStrong": ["a15", "a34"], "electricStrong": ["a16", "a22"], "battleMusic": ["a17"], "wind": ["a18"], "ghost": ["a19"], "sea": ["a20"], "quest": ["a23", "a96"], "healTeam": ["a24"], "pianoMusic": ["a25"], "ground": ["a26"], "waterStrong": ["a28"], "iceStrong": ["a29"], "ice": ["a30"], "dark": ["a31"], "darkStrong": ["a32", "a33"], "warp": ["a35"], "rockStrong": ["a36"], "rock": ["a37"], "heal": ["a39"], "fire": ["a40"], "tiger": ["a41"], "bird": ["a42", "a48", "a77", "a87", "a92"], "electric": ["a43", "a44"], "level": ["a45"], "axe": ["a46"], "axeStrong": ["a47", "a49", "a53"], "dagger": ["a50", "a57", "a58", "a62", "a69", "a75"], "maceStrong": ["a51"], "mace": ["a52"], "bowTeam": ["a54"], "bowStrong": ["a55"], "seal": ["a56"], "equip": ["a59"], "forge": ["a60"], "coin": ["a61", "a71", "a72", "a73"], "win": ["a63"], "evolution": ["a64"], "drink": ["a65"], "bow": ["a66"], "miss": ["a67", "a68"], "buy": ["a70"], "warn": ["a74"], "whip": ["a76"], "sword": ["a78"], "shield": ["a82"], "poison": ["a83"], "status": ["a84"], "lose": ["a85", "a94"], "insect": ["a86"], "cat": ["a88"], "small": ["a89", "a93"], "frog": ["a90"], "elephant": ["a91"], "error": ["a95"]},counts:{},active:[],last:{},warningTimer:null,warned:'',
 choose(g){const list=this.groups[g]||this.groups.grand;if(!list?.length)return '';const i=this.counts[g]||0;this.counts[g]=i+1;return list[i%list.length]},
 play(g,delay=0){if(!Sound.enabled||document.hidden)return;const now=Date.now();if(now-(this.last[g]||0)<140)return;this.last[g]=now;const key=this.choose(g);if(!key)return;Sound.run(()=>{try{const t=Music.track(key);t.audio.loop=false;t.audio.pause();t.audio.currentTime=0;this.active=this.active.filter(x=>x!==t&&!x.audio.ended);while(this.active.length>=6)this.active.shift().audio.pause();this.active.push(t);Music.play(key,.55)}catch(e){}})},
 skill(id,u,strong=false){const sk=SK[id];if(!sk)return false;if(sk.t==='heal'||sk.cure){this.play(sk.tg==='team'?'healTeam':'heal');return true}if(sk.t==='form'||sk.t==='revert'){this.play('warp');return true}if(sk.t==='rest'){this.play('heal');return true}if(sk.t==='buff'){this.play(sk.bf&&(sk.bf.pdef||sk.bf.mdef)?'shield':'fairy');return true}const high=strong||(sk.pw||0)>=160||sk.ct;const magic=sk.t==='m'||sk.t==='auto'&&u?.atkType==='m';if(magic){const el=sk.el||'psychic',map={fire:'fire',water:'water',ice:'ice',electric:'electric',psychic:'psychic',dark:'dark',ghost:'dark',rock:'rock',ground:'ground',flying:'wind',fairy:'fairy',dragon:'fire'};let g=map[el]||'grand';if(high&&this.groups[g+'Strong'])g+='Strong';this.play(g);return true}const wt=u?.cls?clsWeapon(u.cls):u?.form==='hawk'?'bow':'sword';let g=wt;if(wt==='bow'&&sk.all)g='bowTeam';if(high&&this.groups[wt+'Strong'])g=wt+'Strong';if(!this.groups[g])g=high?'grand':'roar';this.play(g);return true},
 cry(sp,death){if(!SP[sp])return false;const types=SP[sp].t;let g=sp==='demonlord'?'boss':sp==='erawan'?'elephant':['nekomata','baihu','rajasi'].includes(sp)?'tiger':['tanuki','jackalope'].includes(sp)?'small':['kappa','amabie'].includes(sp)?'frog':sp==='scarab'?'insect':types.includes('ghost')?'ghost':sp==='kraken'?'sea':['garuda','roc','harpy','tengu','thunderbird','kinnaree','phoenix','griffin'].includes(sp)?'bird':sp==='kitsune'?'cat':'roar';this.play(death?'lose':g);return true},
 stop(){clearTimeout(this.warningTimer);for(const t of this.active)t.audio.pause();this.active=[]},
 syncWarning(){clearTimeout(this.warningTimer);const room=PVP.room;if(!Sound.enabled||document.hidden||S.screen!=='pvp'||room?.status!=='active')return;const stamp=room.id+':'+room.rev;if(this.warned===stamp)return;const wait=room.deadline-room.serverTime-(Date.now()-(PVP.audioAt||Date.now()))-5000;this.warningTimer=setTimeout(()=>{if(PVP.room?.rev===room.rev&&S.screen==='pvp'){this.warned=stamp;this.play('warn')}},Math.max(0,wait))}
};
// @soulbeast-end 0157-ExtraAudio
// @soulbeast-unit 0158-MUSIC_ASSETS-Object

Object.assign(MUSIC_ASSETS,SoulbeastContent.MUSIC_ASSETS_additions_1());
// @soulbeast-end 0158-MUSIC_ASSETS-Object
// @soulbeast-unit 0159-MUSIC_ASSETS-Object



// New recordings: explicit species identity and weapon-specific gun sounds.
Object.assign(MUSIC_ASSETS,SoulbeastContent.MUSIC_ASSETS_additions_2());
// @soulbeast-end 0159-MUSIC_ASSETS-Object
// @soulbeast-unit 0160-ExtraAudio-groups
Object.assign(ExtraAudio.groups,{"voice_vampire": ["newvoice0", "newvoice1", "newvoice10", "newvoice11"], "voice_treant": ["newvoice2"], "voice_demon": ["newvoice3"], "voice_rockfall": ["newvoice4"], "voice_phoenix": ["newvoice5"], "voice_gorilla": ["newvoice6"], "voice_lion": ["newvoice7"], "voice_dog": ["newvoice8", "newvoice25"], "voice_zombie": ["newvoice9"], "voice_meow": ["newvoice12"], "voice_croc": ["newvoice13"], "voice_horse": ["newvoice14"], "voice_imp": ["newvoice15"], "voice_witch": ["newvoice16"], "voice_eagle": ["newvoice17"], "voice_crow": ["newvoice18"], "voice_goblin": ["newvoice19"], "voice_kodama": ["newvoice20"], "voice_mermaid": ["newvoice21"], "voice_mandrake": ["newvoice22"], "voice_bear": ["newvoice23"], "voice_wolf": ["newvoice24"], "voice_fox": ["newvoice26"], "voice_gunRapid": ["newvoice27"], "voice_gunBlast": ["newvoice28"], "voice_gunCannon": ["newvoice29"], "voice_gunCrit": ["newvoice30"], "voice_gunSingle": ["newvoice31"]});
// @soulbeast-end 0160-ExtraAudio-groups
// @soulbeast-unit 0161-SPECIES_VOICE

const SPECIES_VOICE=SoulbeastContent.SPECIES_VOICE();
// @soulbeast-end 0161-SPECIES_VOICE
// @soulbeast-unit 0163-ExtraAudio-cry

ExtraAudio.cry=function(sp,death){const voice=SPECIES_VOICE[sp];if(!voice)return originalRecordedCry(sp,death);this.play('voice_'+voice);return true};
// @soulbeast-end 0163-ExtraAudio-cry
// @soulbeast-unit 0165-ExtraAudio-skill

ExtraAudio.skill=function(id,u,strong=false){const sk=SK[id];if(!sk)return false;if(sk.t==='form'&&sk.form==='wolf'){this.play('voice_wolf');return true}if(sk.t==='form'&&sk.form==='bear'){this.play('voice_bear');return true}if(u?.cls&&clsWeapon(u.cls)==='gun'&&['auto','p','h'].includes(sk.t)){this.play(strong?'voice_gunCrit':sk.ct?'voice_gunCannon':sk.all?'voice_gunBlast':sk.hits>=3?'voice_gunRapid':'voice_gunSingle');return true}if(sk.el==='ground'&&(sk.all||strong)){this.play('voice_rockfall');return true}return originalRecordedSkill(id,u,strong)};
// @soulbeast-end 0165-ExtraAudio-skill
// @soulbeast-unit 0166-Sound


const Sound={ctx:null,master:null,noise:null,enabled:false,volume:.35,voices:new Set(),pending:[],amb:null,ambType:'',unlocking:null,
 load(){try{const p=JSON.parse(localStorage.getItem('sealbeast_audio_v1')||'{}');this.enabled=p.enabled===true;if(Number.isFinite(p.volume))this.volume=Math.max(0,Math.min(1,p.volume))}catch(e){}},
 save(){try{localStorage.setItem('sealbeast_audio_v1',JSON.stringify({enabled:this.enabled,volume:this.volume}))}catch(e){}},
 async unlock(){if(!this.enabled)return false;try{if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C){this.enabled=false;this.save();return false}this.ctx=new C();this.master=this.ctx.createGain();const comp=this.ctx.createDynamicsCompressor();this.master.gain.value=this.volume;comp.threshold.value=-18;comp.ratio.value=8;this.master.connect(comp);comp.connect(this.ctx.destination);const rate=this.ctx.sampleRate;this.noise=this.ctx.createBuffer(1,rate*2,rate);const data=this.noise.getChannelData(0);let seed=9173;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296*2-1)}}
  if(this.ctx.state!=='running'){if(!this.unlocking)this.unlocking=this.ctx.resume().finally(()=>{this.unlocking=null});await this.unlocking}
  if(this.enabled&&this.ctx.state==='running'){const jobs=this.pending.splice(0);jobs.forEach(f=>f());this.sync();return true}return false}catch(e){this.pending=[];return false}},
 run(job){if(!this.enabled||document.hidden)return;if(this.ctx?.state==='running'){try{job()}catch(e){}}else if(this.pending.length<8)this.pending.push(job)},
 tone(freq,end,duration=.15,level=.07,type='sine',delay=0){if(!this.ctx||this.voices.size>=24)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(level,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audioBus('effects'));this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect()};o.start(t);o.stop(t+duration+.02)},
 hiss(duration=.2,level=.05,frequency=1000,delay=0,kind='bandpass'){if(!this.ctx||this.voices.size>=24)return;const t=this.ctx.currentTime+delay,s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=this.noise;f.type=kind;f.frequency.value=frequency;f.Q.value=.8;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(level,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(g);g.connect(audioBus('effects'));this.voices.add(s);s.onended=()=>{this.voices.delete(s);s.disconnect();f.disconnect();g.disconnect()};s.start(t);s.stop(t+duration+.02)},
 fx(kind,delay=0){const mapped={charge:'charge',shield:'shield',revive:'healTeam',blessing:'heal',win:'win',lose:'lose',coins:'coin',chest:'coin',shot:'gun',blade:'sword',arrow:'bow',water:'water',ice:'ice',storm:'electricStrong',flame:'fire',spirit:'dark',eclipse:'darkStrong',quake:'ground',music:'quest'}[kind];if(mapped){ExtraAudio.play(mapped,delay);return}this.run(()=>{const tone=(a,b,d=.2,v=.07,w='sine',off=0)=>this.tone(a,b,d,v,w,delay+off),noise=(d,v,f,off=0,ty='bandpass')=>this.hiss(d,v,f,delay+off,ty);
  if(kind==='click')tone(780,520,.065,.035);
  else if(kind==='step'){noise(.09,.06,180,0,'lowpass');noise(.09,.05,220,.17,'lowpass')}
  else if(kind==='blade'||kind==='claw'||kind==='shadow'){noise(.16,.09,2500);tone(650,110,.12,.055,'sawtooth');if(kind==='shadow')tone(180,70,.25,.04)}
  else if(kind==='shot'){noise(.09,.10,1100);tone(100,35,.12,.075,'triangle')}
  else if(kind==='arrow'||kind==='wing'){noise(.28,.07,1600);tone(850,220,.18,.04,'triangle')}
  else if(kind==='water'){noise(.55,.055,650);for(let i=0;i<4;i++)tone(380+i*90,650+i*75,.10,.035,'sine',i*.085)}
  else if(kind==='ice'){for(let i=0;i<4;i++)tone(1200+i*260,800+i*200,.22,.035,'sine',i*.035)}
  else if(kind==='storm'){noise(.16,.09,3500);tone(85,35,.35,.07,'sawtooth');tone(1400,500,.09,.03,'square',.07)}
  else if(kind==='flame'||kind==='dragon'||kind==='phoenix'){noise(.45,.085,400,0,'lowpass');tone(kind==='dragon'?90:160,50,.4,.065,'sawtooth')}
  else if(kind==='quake'){tone(80,28,.4,.085,'triangle');noise(.35,.07,180,0,'lowpass')}
  else if(kind==='shield'){tone(240,180,.2,.06,'triangle');tone(1200,900,.3,.035,'sine',.02)}
  else if(kind==='spirit'||kind==='eclipse'){tone(170,55,.5,.06,'sawtooth');tone(520,180,.45,.04);noise(.4,.04,450)}
  else if(kind==='roots'){noise(.4,.07,900);tone(210,340,.3,.035,'triangle')}
  else if(kind==='mist'){noise(.65,.055,700);tone(330,280,.6,.02)}
  else if(kind==='blessing'||kind==='revive'||kind==='rune'||kind==='charge'){for(let i=0;i<4;i++)tone([392,494,587,784][i],[392,494,587,784][i]*1.01,.35,.045,'sine',i*.075)}
  else if(kind==='music'||kind==='coins'||kind==='chest'||kind==='win'){for(let i=0;i<3;i++)tone([523,659,784][i],[523,659,784][i],.22,.05,'triangle',i*.1)}
  else if(kind==='lose'){tone(300,100,.5,.055,'triangle');tone(220,65,.55,.04,'sine',.12)}
 })},
 skill(id,u){if(ExtraAudio.skill(id,u))return;if(id==='rest'){this.fx('blessing');return}if(id==='attack'){if(u?.kind==='player'||u?.kind==='human'){const wt=u.cls?clsWeapon(u.cls):'sword';this.fx(wt==='gun'?'shot':wt==='bow'?'arrow':['sword','axe','dagger','mace'].includes(wt)?'blade':'rune')}else this.fx('claw');return}this.fx(skillLook(id)[0])},
 cry(sp,death=false,delay=0){if(ExtraAudio.cry(sp,death))return;if(!sp||!SP[sp])return;this.run(()=>{let hash=0;for(const ch of sp)hash=(hash*31+ch.charCodeAt(0))>>>0;const el=SP[sp].t[0],bird=['pixie','kinnaree','garuda','griffin','thunderbird','roc','harpy','tengu'].includes(sp),deep=['dragon','naga','hydra','demonlord','behemoth','golem','nidhogg','jormungandr','kraken'].includes(sp),ghost=['ghost','psychic','fairy'].includes(el);const base=(bird?650:deep?65:ghost?350:130)+(hash%90);this.tone(base,base*(death?.42:1.35),death?.5:.32,deep?.085:.055,bird||ghost?'sine':'sawtooth',delay);if(!death)this.tone(base*1.1,base*.85,.22,.04,bird?'sine':'triangle',delay+.22);if(!bird)this.hiss(death?.35:.45,.05,deep?220:ghost?900:550,delay,'lowpass')})},
 stopAmb(){if(this.amb){try{this.amb.source.stop()}catch(e){}this.amb.source.disconnect();this.amb.filter.disconnect();this.amb.gain.disconnect();this.amb=null}this.ambType=''},
 sync(){this.stopAmb();Music.sync();ExtraAudio.syncWarning()},
 mute(){ExtraAudio.stop();Music.stop();this.pending=[];this.stopAmb();for(const s of this.voices){try{s.stop()}catch(e){}}},
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.03);this.save()}
};
// @soulbeast-end 0166-Sound
// @soulbeast-unit 0167-Sound-load
Sound.load();
// @soulbeast-end 0167-Sound-load
// @soulbeast-unit 0168-soundPanel

function soundPanel(){return `<div class="card stack"><div class="row"><h3 class="grow">เสียงเกม</h3><button class="btn sm" data-a="soundtoggle" aria-pressed="${Sound.enabled}">${Sound.enabled?'🔊 เปิดอยู่':'🔇 กดเพื่อเปิดเสียง'}</button></div><label class="row"><span>ระดับเสียง</span><input id="soundVolume" type="range" min="0" max="100" value="${Math.round(Sound.volume*100)}" style="flex:1;min-width:0" aria-label="ระดับเสียงเกม"><output id="soundPercent">${Math.round(Sound.volume*100)}%</output></label><small class="sub">เพลงและเสียงบรรยากาศจากไฟล์ที่คุณส่งมา พร้อมเสียงสกิลและอสูร ปรับเสียงเบาก่อนเริ่มเล่น</small></div>`}
// @soulbeast-end 0168-soundPanel
// @soulbeast-unit 0442-ExtraAudio-syncWarning

ExtraAudio.syncWarning=()=>{};
// @soulbeast-end 0442-ExtraAudio-syncWarning
// @soulbeast-unit 0469-musicSceneFull

const musicSceneFull=Music.sync;
// @soulbeast-end 0469-musicSceneFull
// @soulbeast-unit 0470-Music-sync
Music.sync=function(){const q=S.ui.cinema||(!S.P&&!S.ui.introSeen?{chapter:0,index:S.ui.introFrame||0}:null);if(!q)return musicSceneFull.call(this);if(!Sound.enabled||document.hidden||Sound.ctx?.state!=='running'){this.stop();return}const f=storyFrames(q.chapter,q.after)[q.index||0],key=f?.music||'intro',selected=ExtraAudio.groups[key]?.[0]||key;if(this.current==='cinema:'+key)return;this.stop();this.current='cinema:'+key;this.playing=selected;this.play(selected,.32)};
// @soulbeast-end 0470-Music-sync
// @soulbeast-unit 0840-AUDIO_PREF_KEY


// Keep audio preferences on this device, separate from player progression.
const AUDIO_PREF_KEY=SB_ENV==='test'?'sealbeast_audio_v1':'sealbeast_audio_v1';
// @soulbeast-end 0840-AUDIO_PREF_KEY
// @soulbeast-unit 0841-audioLevel

const audioLevel=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):1;
// @soulbeast-end 0841-audioLevel
// @soulbeast-unit 0842-Sound-musicVolume

Sound.musicVolume=1;
// @soulbeast-end 0842-Sound-musicVolume
// @soulbeast-unit 0843-Sound-effectsVolume
Sound.effectsVolume=1;
// @soulbeast-end 0843-Sound-effectsVolume
// @soulbeast-unit 0844-mixerLoadBase

const mixerLoadBase=Sound.load;
// @soulbeast-end 0844-mixerLoadBase
// @soulbeast-unit 0845-Sound-load

Sound.load=function(){mixerLoadBase.call(this);try{const p=JSON.parse(localStorage.getItem(AUDIO_PREF_KEY)||'{}');this.musicVolume=audioLevel(p.musicVolume);this.effectsVolume=audioLevel(p.effectsVolume);}catch(e){this.musicVolume=1;this.effectsVolume=1;}};
// @soulbeast-end 0845-Sound-load
// @soulbeast-unit 0846-Sound-load

Sound.load();
// @soulbeast-end 0846-Sound-load
// @soulbeast-unit 0847-mixerSaveBase

const mixerSaveBase=Sound.save;
// @soulbeast-end 0847-mixerSaveBase
// @soulbeast-unit 0848-Sound-save

Sound.save=function(){mixerSaveBase.call(this);try{localStorage.setItem(AUDIO_PREF_KEY,JSON.stringify({enabled:this.enabled,volume:this.volume,musicVolume:this.musicVolume,effectsVolume:this.effectsVolume}));}catch(e){}};
// @soulbeast-end 0848-Sound-save
// @soulbeast-unit 0849-audioTrackKind

function audioTrackKind(key){return ['forest','intro','tense','town','water'].includes(key)||Object.entries(ExtraAudio.groups).some(([group,keys])=>group.endsWith('Music')&&keys.includes(key))?'music':'effects';}
// @soulbeast-end 0849-audioTrackKind
// @soulbeast-unit 0850-audioBus

function audioBus(kind){if(!Sound.ctx||!Sound.master)return Sound.master;if(Sound.mixContext!==Sound.ctx){Sound.mixContext=Sound.ctx;Sound.musicBus=Sound.ctx.createGain();Sound.effectsBus=Sound.ctx.createGain();Sound.musicBus.gain.value=Sound.musicVolume;Sound.effectsBus.gain.value=Sound.effectsVolume;Sound.musicBus.connect(Sound.master);Sound.effectsBus.connect(Sound.master);}return kind==='music'?Sound.musicBus:Sound.effectsBus;}
// @soulbeast-end 0850-audioBus
// @soulbeast-unit 0851-Sound-setChannelVolume

Sound.setChannelVolume=function(kind,value){if(!['music','effects'].includes(kind))return;this[kind+'Volume']=audioLevel(Number(value));const bus=this[kind+'Bus'];if(bus&&this.ctx)bus.gain.setTargetAtTime(this[kind+'Volume'],this.ctx.currentTime,.03);this.save();};
// @soulbeast-end 0851-Sound-setChannelVolume
// @soulbeast-unit 0852-soundPanel

soundPanel=function(){const slider=(id,label,value,output)=>'<label class="row"><span>'+label+'</span><input id="'+id+'" type="range" min="0" max="100" step="1" value="'+Math.round(value*100)+'" style="flex:1;min-width:0" aria-label="'+label+'"><output id="'+output+'" style="min-width:3em;text-align:right">'+Math.round(value*100)+'%</output></label>';return '<div class="card stack"><div class="row"><h3 class="grow">'+ct('เสียงเกม','Game audio','游戏声音')+'</h3><button class="btn sm" data-a="soundtoggle" aria-pressed="'+Sound.enabled+'">'+(Sound.enabled?ct('🔊 เปิดอยู่','🔊 On','🔊 已开启'):ct('🔇 กดเพื่อเปิดเสียง','🔇 Enable audio','🔇 开启声音'))+'</button></div>'+slider('soundVolume',ct('เสียงรวม','Master volume','总音量'),Sound.volume,'soundPercent')+slider('soundMusicVolume',ct('เสียงเพลง','Music volume','音乐音量'),Sound.musicVolume,'soundMusicPercent')+slider('soundEffectsVolume',ct('เสียงเอฟเฟกต์','Effects volume','音效音量'),Sound.effectsVolume,'soundEffectsPercent')+'<small class="sub">'+ct('ปรับได้ทันที 0–100% เสียงรวมควบคุมทุกเสียง และจำระดับเสียงไว้ในเครื่องนี้','Changes apply immediately. Master volume controls all audio. Preferences are saved on this device.','即时调整0–100%。总音量控制所有声音，设置保存在此设备。')+'</small></div>';};
// @soulbeast-end 0852-soundPanel
// @soulbeast-unit 0901-progressionSoundFx

const progressionSoundFx=Sound.fx;
// @soulbeast-end 0901-progressionSoundFx
// @soulbeast-unit 0902-Sound-fx

Sound.fx=function(...args){return optionalProgressEffect(()=>progressionSoundFx.apply(this,args));};
// @soulbeast-end 0902-Sound-fx
// @soulbeast-unit 0904-ExtraAudio-play

ExtraAudio.play=function(...args){return optionalProgressEffect(()=>progressionExtraPlay.apply(this,args));};
// @soulbeast-end 0904-ExtraAudio-play
