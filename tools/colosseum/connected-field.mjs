// Present the current encounter. The Colosseum match owns turns, targeting and results.
export function encounterView(b, me, mode, now, pending) {
  const ownSide = b.teams[1].includes(me.id) ? 1 : 0;
  const units = [b.allies, b.enemies].flatMap((team, side) => team.map(u => ({
    ...u, side: side === ownSide ? 'ally' : 'enemy',
    status: Object.fromEntries((u.statuses || []).map(name => [name, 1])),
  })));
  const current = units.find(u => u.id === b.cur);
  const skills = b.commands.map(s => {
    const friendly = units.some(u => u.side === 'ally' && s.targets.includes(u.id));
    return {id:s.id, n:s.name, t:s.t || (friendly?'heal':'p'), tg:s.tg,
      rev:s.rev, all:s.all, element:s.el || current?.types?.[0] || 'normal',
      available:true, cost:s.mp};
  });
  return {battle:'colosseum:'+b.id, revision:b.turn, current:b.cur, round:b.round,
    turn:b.round, clockKey:b.id+':'+b.turn, seconds:Math.max(0,Math.ceil((b.deadline-now)/1000)),
    units, skills, queue:[], context:{mode:'colosseum',online:true,stage:'colosseum-1',
      modeLabel:mode==='survival'?'โคลอสเซียมเดี่ยว':'โคลอสเซียมทีม',autoHospital:false},
    auto:b.auto, autoAllowed:!b.finished, autoPet:false, petAutoAllowed:false,
    waiting:!skills.length || pending || now<b.openAt || now>=b.deadline || b.finished,
    speed:1, items:[], seals:[], summons:[], captureTargets:[], canEscape:false, log:b.log};
}

export function createConnectedField(submit, toggleAuto) {
  let frame, fallback, timer, ready=false, channel, latest, previous, key, failed, speed=1;
  let latestBattle, latestTime, pendingTurn, lastRequest=0;
  let awaitingSequence=null, releaseTimer, releaseRequested=false, warmFailed=false;
  const post=(type,body)=>frame?.contentWindow?.postMessage({type,channel,...body},location.origin);
  function deactivate() {
    clearTimeout(timer); clearTimeout(releaseTimer);
    if(frame){frame.style.visibility='hidden';frame.inert=true;}
    fallback?.remove();fallback=null;
    awaitingSequence=null; releaseRequested=false; latestBattle=null;
    previous=null; latest=null; key=null; pendingTurn=null; lastRequest=0;
  }
  function dispose() {
    deactivate();frame?.remove();frame=null;ready=false;
  }
  function close() {
    if(!latest)return;
    if(latestBattle.finished && awaitingSequence!==null){
      if(!releaseRequested){
        releaseRequested=true;
        releaseTimer=setTimeout(dispose,6500);
      }
      return;
    }
    if(awaitingSequence!==null)dispose();else deactivate();
  }
  function prepare() {
    if(frame)return;
    channel=crypto.randomUUID();
    frame=document.createElement('iframe');
    frame.title='สนามต่อสู้โคลอสเซียม';frame.allow='autoplay';
    frame.inert=true;
    Object.assign(frame.style,{position:'fixed',inset:'0',width:'100%',height:'100%',border:'0',zIndex:10000,visibility:'hidden'});
    frame.src='/Soulbeast/battle-ui-v1/colosseum.html?connected=ordinary&ui=colosseum-v3';
    document.body.append(frame);
  }
  function exitField(){
    if(!latestBattle)warmFailed=true;
    failed=latestBattle?.id;dispose();
  }
  function publish(){if(ready && latest)post('ordinary-state',{view:{...latest,speed}});}
  window.addEventListener('message',event=>{
    if(!frame || event.source!==frame.contentWindow || event.origin!==location.origin)return;
    const m=event.data;
    if(m?.type==='ordinary-ready'){ready=true;publish();return;}
    if(m?.type==='ordinary-render-error' && (!ready || (m.channel===channel && (!m.battle || m.battle===latest?.battle)))){
      if(latestBattle?.finished){
        awaitingSequence=null;
        if(releaseRequested)dispose();
      }else exitField();
      return;
    }
    if(!latest || m?.channel!==channel || m.battle!==latest.battle)return;
    if(m.type==='ordinary-field-ready'){
      clearTimeout(timer);
      frame.style.visibility='visible';frame.inert=false;
      return;
    }
    if(m.type==='ordinary-presented' && m.sequence===awaitingSequence){
      awaitingSequence=null;
      if(releaseRequested)deactivate();
      return;
    }
    if(m.type!=='ordinary-command' || m.revision!==latest.revision || !Number.isSafeInteger(m.request) || m.request<=lastRequest)return;
    lastRequest=m.request;
    if(m.command==='speed'){speed=m.speed===2?2:1;publish();return;}
    if(m.command==='auto'){toggleAuto(!latest.auto);return;}
    if(m.command!=='skill'||latest.waiting || pendingTurn===latest.revision)return;
    const skill=latestBattle.commands.find(s=>s.id===m.id);
    if(!skill || latestTime()>=latestBattle.deadline)return;
    const target=skill.targets.length===1?skill.targets[0]:[m.friend,m.target].find(id=>skill.targets.includes(id));
    if(!target)return;
    if(submit(latest.revision,skill.id,target)){
      pendingTurn=latest.revision;latest.waiting=true;publish();
    }
  });
  return {close,warm(){if(!warmFailed)prepare();},reset(){dispose();failed=null;warmFailed=false;},rejected(){pendingTurn=null;key=null;},
    show(b,me,mode,time){
      if(!b || b.id===failed){close();return false;}
      if(latest && latest.battle!=='colosseum:'+b.id)dispose();
      if(b.finished && !latest)return true;
      const now=time();
      prepare();
      if(!latest){
        fallback=document.createElement('button');fallback.textContent='ใช้สนามเดิม';fallback.onclick=exitField;
        Object.assign(fallback.style,{position:'fixed',right:'8px',top:'56px',zIndex:10001});
        document.body.append(fallback);timer=setTimeout(()=>{if(!latestBattle?.finished)exitField();},30000);
      }
      latestTime=time;latestBattle=b;
      const stamp=[b.id,b.turn,b.cur,b.last?.n,b.finished,b.auto,now>=b.openAt,now>=b.deadline,pendingTurn,b.commands.length,
        ...b.allies.map(u=>u.hp),...b.enemies.map(u=>u.hp)].join('|');
      if(key===stamp)return true;
      key=stamp;previous=latest;latest=encounterView(b,me,mode,now,pendingTurn===b.turn);
      const a=b.last;
      if(ready && previous && a && previous.lastNumber!==a.n){
        const support=['heal','buff'].includes(a.kind);
        awaitingSequence=a.n;
        post('ordinary-action',{sequence:a.n,before:{...previous,speed},view:{...latest,speed},
          action:{actor:a.actor,name:a.skill,skill:a.skillId,target:a.target,friend:a.target,support,
            all:!!a.all,range:a.kind==='melee'?'melee':'ranged',events:b.effects||[]}});
      }else publish();
      latest.lastNumber=a?.n;
      return true;
    }};
}
