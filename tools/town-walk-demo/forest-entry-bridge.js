/* Keep original forest rules, story clips and battle tutorials. */
if(screen==='wild'&&ZN.some(z=>z.id===previewZone)){
 function walkForestOutcome(){const b=B();return b?.over&&(b.over.res==='lose'||b.kind==='boss'&&b.over.res==='win')?b.over.res:null}
 function walkLeaveForest(outcome){if(B()&&!B().over)return toast('จบการต่อสู้ก่อนออกจากป่า');const result=(typeof outcome==='string'?outcome:null)||walkForestOutcome()||(!S.zone?(S.screen==='hospital'?'lose':'win'):null);if(!result)return toast('ออกจากป่าไม่ได้จนกว่าจะชนะบอสหรือพ่ายแพ้');S.zone=null;save();parent.postMessage({type:'walk-forest-exit',result,hospital:result==='lose'||result==='surrender',zone:previewZone},location.origin)}
 back.onclick=()=>walkLeaveForest();
 const forestBackRender=render;render=function(...a){const r=forestBackRender(...a);back.disabled=!!S.zone||!!B()&&!B().over;back.textContent=back.disabled?'อยู่ในป่า':'กลับหน้าป่า';for(const button of document.querySelectorAll('[data-a="go"][data-v="town"]')){button.disabled=!!S.zone;button.setAttribute('aria-disabled',String(!!S.zone));}return r};
 handlers.exitzone=()=>{if(!S.zone||S.zone.ev?.type!=='exit'||B()&&!B().over)return toast('ต้องพบแสงปลายทางก่อนจึงจะกลับเมืองได้');if(WorldTales.block())return toast('จบเรื่องที่กำลังฟัง ก่อนเดินทางต่อ');walkLeaveForest('exit')};
 const forestConfirmSurrender=handlers.surrender;handlers.surrender=function(...args){forestConfirmSurrender.apply(this,args);if(S.ui.confirm){S.ui.confirm.msg=S.ui.confirm.msg.replaceAll('กลับเมือง','ออกจากป่า');render()}};
 const forestSurrender=surrenderForest;
 surrenderForest=function(...args){if(!S.zone)return forestSurrender.apply(this,args);const originalRender=render;render=()=>{};try{forestSurrender.apply(this,args)}finally{render=originalRender}save();parent.postMessage({type:'walk-forest-exit',result:'surrender',hospital:true,zone:previewZone},location.origin)};
 const forestDone=handlers.bt;handlers.bt=function(v){const terminal=v==='done'&&walkForestOutcome();const r=forestDone(v);if(terminal)walkLeaveForest(terminal);return r};
 const forestNav=handlers.go;handlers.go=function(v){if(v==='town')return walkLeaveForest();return forestNav(v)};
 handlers.dozone(previewZone);render();
}
