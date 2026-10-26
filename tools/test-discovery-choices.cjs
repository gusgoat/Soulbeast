const assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r('render=()=>{};Sound.fx=()=>{};');
 const setup=zone=>r(`handlers.newgame();S.ui={};S.P.lv=60;S.P.gold=100000;S.P.items.pot=20;S.P.hp=pStats().hp;S.P.mp=pStats().mp;S.zone={id:${zone},depth:5,log:[]};S.screen='zone';WorldTales.run();`);
 const hidden=html=>{for(const text of ['คำเตือน:','50% ของ HP เต็ม','ของ MP เต็ม','รางวัลเมื่อจบเหตุการณ์','คำตัดสินนี้จะถูกจดจำ','ผลบางอย่างอาจกลับมา','ตัดสินใจได้ครั้งเดียว','ค่าแรงและวัสดุ','ออร่าบอส:','แพ้เสียเงิน'])assert(!html.includes(text),'Unexpected preview: '+text);};
 const definitions=JSON.parse(r('JSON.stringify([...TALES_DATA.quests,...TALES_DATA.special])'));
 for(const d of definitions){setup(d.zone);g.ctx.choiceId=d.id;r("S.zone.taleSession={id:choiceId,mode:choiceId.startsWith('encounter-')?'special':'question',token:'test',result:[]};");hidden(r('WorldTales.view()'));}
 for(const d of JSON.parse(r('JSON.stringify(SECRET_DATA.locations)'))){for(const event of d.tutorial||d.events?.intro?.next==='encounter'?['encounter','decision']:['puzzle','encounter','decision']){setup(d.zone);g.ctx.secretId=d.id;g.ctx.secretEvent=event;r('S.zone.secretSession={id:secretId,event:secretEvent,revision:0,puzzleAttempts:0};Secret.record(secretId);');hidden(r('Secret.view()'));}}
 for(const d of JSON.parse(r('JSON.stringify(FOREST_RIDDLES)'))){setup(d.zone);g.ctx.riddleId=d.id;r("S.zone.riddleSession={id:riddleId,token:'riddle',answered:false,phase:'question',results:[]};");hidden(r('ForestRiddle.view()'));}
 for(const d of JSON.parse(r('JSON.stringify(SECRET_DATA.repeatableEvents)'))){setup(d.zone);r("S.zone.specialSession={token:'repeat',claimed:false,results:[]};");hidden(r('ForestSpecial.view()'));}
 for(const phase of ['gate','lightning','chase','escape']){setup(6);g.ctx.trialPhase=phase;r("S.zone.falseBoss={id:'trial',rev:0,phase:trialPhase};");hidden(r('FalseBoss.view()'));}
 setup(1);r("WorldTales.record('secret:1',1,'Yggdrasil',0,'น้ำถึงหมู่บ้าน');WorldTales.state().serial++;WorldTales.startAfter('secret:1',false);");hidden(r('WorldTales.view()'));
 setup(1);r("S.zone.taleSession={id:'moon-0',mode:'question',token:'paid',result:[]};WorldTales.state().quests['moon-0']={id:'moon-0',kind:'short',status:'active'};var mpBefore=S.P.mp;WorldTales.choose('paid',1);");assert(r('S.P.mp<mpBefore'));assert(r('WorldTales.session().result.some(t=>t.includes("ใช้ MP"))'),'Actual payment still reported after choice');
 setup(1);r("S.zone.taleSession={id:'encounter-1',mode:'special',token:'confirm',result:[]};WorldTales.request('confirm',0);");hidden(r('S.ui.confirm.msg'));assert(r('S.ui.confirm.msg.includes(WorldTales.choiceData().actions[0].label)'));
 setup(1);r("var sd=SECRET_DATA.locations.find(d=>d.zone===1);S.zone.secretSession={id:sd.id,event:'puzzle',revision:0};Secret.record(sd.id);handlers.secretLeave(Secret.token());");assert.equal(r('S.ui.confirm.msg'),'ออกจากสถานที่ลับหรือไม่?');
 console.log('PASS '+file+': all secret/quest/event/riddle previews hide outcomes; actual costs and post-choice results preserved');
}
