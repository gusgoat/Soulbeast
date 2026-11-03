/* Local characters can read the live board, but never publish test scores. */
vLeader=function(){return walkLeaderViewWithEndpoint()};
function walkLeaderViewWithEndpoint(){
 // The original view requires a configured endpoint; render its ranking body with
 // a dedicated read-only local view instead of enabling unrelated online writes.
 const tab=S.ui.lb||'score',T=LBTAB[tab],rows=(LB.rows||[]).filter(r=>Number.isFinite(r.level)).sort((a,b)=>T.k(b)-T.k(a)).slice(0,20);
 return '<div class="stack"><h2>หอเกียรติยศ</h2><p class="sub">อันดับผู้เล่นออนไลน์ · ตัวละครทดสอบในเครื่องไม่ส่งคะแนนเข้ากระดานจริง</p><div class="tabs">'+Object.entries(LBTAB).map(([k,t])=>'<button class="'+(tab===k?'on':'')+'" data-a="lbtab" data-v="'+k+'">'+esc(t.n)+'</button>').join('')+'</div>'+(LB.err?'<p role="alert">'+esc(LB.err)+'</p>':'')+(LB.busy?'<p>กำลังโหลดอันดับ...</p>':rows.map((r,i)=>'<div class="item lbrow"><b class="lbn">'+(i+1)+'</b>'+portrait('cls:'+(CLS[r.cls]?r.cls:'swordsman'),34,{gender:r.gender})+'<div class="grow"><b>'+esc(r.name||'ผู้ผนึก')+'</b><small>'+esc(r.clsName||'')+' · Lv '+r.level+'</small></div><b>'+esc(T.v(r))+'</b></div>').join('')||'<p>ยังไม่มีอันดับให้แสดง</p>')+'<button class="btn" data-a="lbload" '+(LB.busy?'disabled':'')+'>รีเฟรช</button></div>';
}
lbLoad=async function(){if(LB.busy)return;LB.busy=1;LB.err='';render();const wait=window.WalkLoading?.begin('กำลังโหลดอันดับผู้เล่น…');try{if(!window.WALK_LEADER_URL)throw Error('ยังไม่ได้ตั้งค่ากระดานออนไลน์');const response=await fetch(window.WALK_LEADER_URL,{method:'GET',headers:{apikey:SB_KEY,'x-soulbeast-environment':'live'},cache:'no-store',signal:AbortSignal.timeout(25000)});const data=await response.json();if(!response.ok||!data.ok||!Array.isArray(data.rows))throw Error('โหลดอันดับไม่สำเร็จ');LB.rows=data.rows;}catch(e){LB.err='โหลดอันดับออนไลน์ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วกดรีเฟรช';LB.rows=LB.rows||[];}finally{wait?.finish();LB.busy=0;render()}};
if(S.screen==='leader')lbLoad();
