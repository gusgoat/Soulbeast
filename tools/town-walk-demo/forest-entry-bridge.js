/* Keep original forest rules, story clips and battle tutorials. */
if(screen==='wild'&&ZN.some(z=>z.id===previewZone)){
 function walkForestOutcome(){const b=B();return b?.over&&(b.over.res==='lose'||b.kind==='boss'&&b.over.res==='win')?b.over.res:null}
 function walkLeaveForest(outcome){const result=(typeof outcome==='string'?outcome:null)||walkForestOutcome()||(!S.zone?(S.screen==='hospital'?'lose':'win'):null);if(!result)return toast('ออกจากป่าไม่ได้จนกว่าจะชนะบอสหรือพ่ายแพ้');S.zone=null;save();parent.postMessage({type:'walk-forest-exit',result,hospital:result==='lose'||S.P.hp*5<pStats().hp*4},location.origin)}
 back.onclick=()=>walkLeaveForest();
 const forestBackRender=render;render=function(...a){const r=forestBackRender(...a);back.disabled=!!S.zone&&!walkForestOutcome();back.textContent=back.disabled?'อยู่ในป่า · ชนะบอสหรือพ่ายแพ้เพื่อออก':'กลับฉากเดิน';return r};
 handlers.exitzone=()=>{if(!S.zone||S.zone.ev?.type!=='exit'||B()&&!B().over)return toast('ต้องพบแสงปลายทางก่อนจึงจะกลับเมืองได้');if(WorldTales.block())return toast('จบเรื่องที่กำลังฟัง ก่อนเดินทางต่อ');walkLeaveForest('exit')};
 const forestConfirmSurrender=handlers.surrender;handlers.surrender=function(...args){forestConfirmSurrender.apply(this,args);if(S.ui.confirm){S.ui.confirm.msg=S.ui.confirm.msg.replaceAll('กลับเมือง','ออกจากป่า').replace('ที่โรงพยาบาล','บริเวณหน้าป่า');render()}};
 const forestSurrender=surrenderForest;
 surrenderForest=function(...args){if(!S.zone)return forestSurrender.apply(this,args);const originalRender=render;render=()=>{};try{forestSurrender.apply(this,args)}finally{render=originalRender}save();parent.postMessage({type:'walk-forest-exit',result:'surrender',hospital:false},location.origin)};
 const forestDone=handlers.bt;handlers.bt=function(v){const terminal=v==='done'&&walkForestOutcome();const r=forestDone(v);if(terminal)walkLeaveForest(terminal);return r};
 const forestNav=handlers.go;handlers.go=function(v){if(v==='town')return walkLeaveForest();return forestNav(v)};
 handlers.dozone(previewZone);render();
}
