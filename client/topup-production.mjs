import {withLoading} from './online-loading.mjs';
import {connectAccounts,gameSessionId} from './account-client.mjs?v=qr-slip-2';
import {paymentApi,shopText,couponArtwork,couponCount,couponPrice} from './production-shop.mjs';
document.getElementById('shopBootWait')?.remove();
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=connectAccounts(()=>queueMicrotask(accountChanged)),api=paymentApi(client);let lang='th',state=null,catalog=null,busy=false,target='';
let manual=null, qrOrder=null, loadedSession=null;
function sessionKey(){
 const token=client.sessions.read()?.access_token;
 return token?(gameSessionId(token)||token):null;
}
function accountChanged(){
 if(!busy&&sessionKey()!==loadedSession)void boot();
}
const qr=$('qrTopup');
const manualApi=async(action,data={})=>client.request('/rest/v1/rpc/sb_manual_topup',{p_action:action,p_data:data},await client.sessions.token());
const t=k=>shopText(k,lang),text=(th,en,zh)=>[th,en,zh][lang==='en'?1:lang==='zh-CN'?2:0];
function notice(s){$('notice').textContent=s;}
function render(){
 document.documentElement.lang=lang;$('purchasePolicy').textContent=text('เงื่อนไขการซื้อและคืนเงิน','Purchase and refund policy','购买与退款说明');$('title').textContent=t('title');$('terms').textContent=text('ชำระครั้งเดียวผ่าน Thai QR · แนบสลิปแล้วรอผู้ดูแลตรวจยอด · ตรวจอัตราสุ่มก่อนซื้อ','One-time Thai QR payment. Upload a receipt for review. Check gacha rates before buying.','泰国二维码一次性付款。上传凭证后等待审核，购买前请查看扭蛋概率。');$('support').textContent=t('support');
 $('account').innerHTML=state?'<p>'+esc(state.email||client.user?.email||'')+'</p><button id="logout">'+text('ออกจากบัญชี','Sign out','退出')+'</button><button id="requestDelete">'+text('ขอลบบัญชี','Request account deletion','申请删除账户')+'</button>':'<h2>'+text('เข้าด้วยบัญชีเกมเดิม','Sign in with your game account','使用游戏账户登录')+'</h2><form id="login"><label>Email<input id="email" type="email" autocomplete="username" required></label><label>'+text('รหัสผ่าน','Password','密码')+'<input id="password" type="password" autocomplete="current-password" required></label><button '+(busy?'disabled':'')+'>'+text('เข้าสู่ระบบ','Sign in','登录')+'</button></form><a href="./accounts.html">'+text('สมัครบัญชี / ลืมรหัสผ่าน','Create account / forgot password','注册/忘记密码')+'</a>';
 const chars=manual?.characters||[];if(!chars.some(c=>c.code===target))target=chars[0]?.code||'';
 $('characters').innerHTML=state?'<label>'+t('recipient')+'<select id="recipient">'+chars.map(c=>'<option value="'+esc(c.code)+'" '+(target===c.code?'selected':'')+'>'+esc(c.name)+' · '+esc(c.code)+'</option>').join('')+'</select></label>':'';
 $('packs').innerHTML=[true,false].map(promotion=>'<div class="coupon-pack-section"><h2>'+t(promotion?'promotions':'regular')+'</h2><div class="coupon-pack-grid">'+(catalog?.packs||[]).filter(p=>p.promotion===promotion).map(p=>{const used=p.promotion&&manual?.blocked_promotions?.some(o=>o.code===target&&o.pack_id===p.id);return '<article class="coupon-pack"><button class="coupon-pack-button" data-pack="'+p.id+'" aria-label="'+esc(t('buy')+' '+couponCount(p.coupons,lang)+' · '+couponPrice(p.amountSatang,lang)+' · '+(promotion?text('ซื้อได้ครั้งเดียวต่อตัวละคร','Once per character','每个角色限购一次'):t('repeat')))+'" '+(busy||!state||!target||!manual?.enabled||manual.debt||used?'disabled':'')+'><img src="'+couponArtwork(p.coupons)+'.webp'+'" width="512" height="512" alt="" decoding="async"></button><div class="coupon-pack-caption"><strong>'+couponCount(p.coupons,lang)+'</strong><span class="coupon-pack-price">'+esc(couponPrice(p.amountSatang,lang))+'</span><small>'+(promotion?text('ซื้อได้ครั้งเดียวต่อตัวละคร','Once per character','每个角色限购一次'):t('repeat'))+'</small><small class="coupon-pack-state">'+(used?t('used'):'')+'</small></div></article>';}).join('')+'</div></div>').join('');
 renderLegacyHistory();
 renderManual();
 $('login')?.addEventListener('submit',e=>{e.preventDefault();const email=$('email').value.trim(),password=$('password').value;$('password').value='';run(async()=>{await client.login(email,password);loadedSession=sessionKey();await sync();void loadLegacyHistory();});});
 $('requestDelete')?.addEventListener('click',()=>{if(confirm(text('ส่งคำขอลบบัญชีและข้อมูลตัวละครทั้งหมดให้ผู้ดูแลตรวจสอบ? รายการชำระเงินและข้อมูลธุรกรรมต้องตรวจสอบก่อนดำเนินการ','Request deletion of your account and all characters? Payment and transaction records require review before deletion.','申请删除账户及全部角色？删除前需审核付款与交易记录。')))run(async()=>{const r=await api('request_delete',{confirmed:true});notice(text('บันทึกคำขอแล้ว เลขที่ ','Request recorded: ','申请已记录：')+r.request_id);});});
 $('logout')?.addEventListener('click',()=>run(async()=>{await client.logout();state=null;manual=null;target='';loadedSession=null;}));$('recipient')?.addEventListener('change',e=>{target=e.target.value;render();});
 document.querySelectorAll('[data-pack]').forEach(button=>button.onclick=()=>reservePack(button.dataset.pack));
}
function renderLegacyHistory(){
 $('history').innerHTML=state?'<h2>'+t('history')+'</h2><button id="refresh">'+t('refresh')+'</button><ul class="orders">'+state.orders.map(o=>'<li><b>'+esc(o.pack_id)+' · '+o.amount_satang/100+' THB</b><p>'+esc(t(o.status))+' · '+esc(o.code)+'</p><small>'+esc(o.id)+'</small>'+(['reserved','open','pending'].includes(o.status)?'<button data-check="'+o.id+'">'+t('refresh')+'</button><button data-resume="'+o.id+'">'+text('ชำระรายการเดิม','Continue payment','继续付款')+'</button><button data-cancel="'+o.id+'">'+text('ยกเลิกรายการ','Cancel order','取消订单')+'</button>':'')+'</li>').join('')+'</ul>':'';
 $('refresh')?.addEventListener('click',()=>run(loadLegacyHistory));
 document.querySelectorAll('[data-check],[data-resume],[data-cancel]').forEach(button=>button.onclick=()=>run(async()=>{
  const id=button.dataset.check||button.dataset.resume||button.dataset.cancel;
  const response=await api(button.dataset.cancel?'expire':'refresh',{order_id:id});
  if(button.dataset.resume)go(response.order);
  await loadLegacyHistory();
 }));
}
async function loadLegacyHistory(){
 const session=loadedSession;
 try{
  const legacy=await api('status');
  if(state&&session===loadedSession&&session===sessionKey()){
   state.orders=legacy.orders||[];
   renderLegacyHistory();
  }
 }catch{/* The QR shop remains available if legacy history is unavailable. */}
}
async function reservePack(pack){
 if(busy||!state||!target)return;
 const code=target, session=loadedSession;
 busy=true;
 notice(text('กำลังสร้างรายการชำระผ่าน QR…','Creating your QR order…','正在创建二维码订单…'));
 render();
 try{
  const order=await manualApi('reserve',{pack_id:pack,code});
  if(session!==sessionKey())return;
  manual.orders=[order,...manual.orders.filter(previous=>previous.id!==order.id)];
  notice(t('title'));
  openQr(order);
 }catch(error){notice(error.message==='promotion_unavailable'?t('used'):t('failed'));}
 finally{busy=false;render();accountChanged();}
}

function go(o){if(o.settled){notice(t(o.status==='credited'?'received':'review'));return;}if(o.checkout_url){const u=new URL(o.checkout_url);if(u.origin!=='https://checkout.stripe.com')throw Error('invalid_checkout_url');location.assign(u.href);}else notice(t('pending'));}
async function sync(){
 manual=await manualApi('list');
 state??={email:client.user?.email,orders:[]};
 if(manual.debt)notice(t('review'));
}
function orderLabel(o){return `${couponCount(o.coupons,lang)} · ${couponPrice(o.amount_satang,lang)} · ${o.code}`;}
function statusLabel(status){
 return ({awaiting_slip:text('รอแนบสลิป','Awaiting receipt','等待上传凭证'),pending:text('รอผู้ดูแลตรวจยอด','Awaiting bank payment review','等待人工核对'),credited:t('credited'),rejected:text('ไม่อนุมัติ','Rejected','未通过'),cancelled:text('ยกเลิกแล้ว','Cancelled','已取消')})[status]||status;
}
function renderManual(){
 const section=$('manualHistory');
 section.replaceChildren();
 if(!state||!manual)return;
 const heading=document.createElement('h2');heading.textContent=text('รายการชำระผ่าน QR','QR payment orders','二维码付款订单');
 const refresh=document.createElement('button');refresh.textContent=t('refresh');refresh.onclick=()=>run(sync);
 const list=document.createElement('ul');list.className='orders';
 for(const order of manual.orders){
  const item=document.createElement('li');
  const summary=document.createElement('b');summary.textContent=orderLabel(order);
  const status=document.createElement('p');status.textContent=statusLabel(order.status)+(order.rejection_reason?' · '+order.rejection_reason:'');
  const id=document.createElement('small');id.textContent=order.id;
  item.append(summary,status,id);
  if(order.status==='awaiting_slip'){
   const resume=document.createElement('button');resume.textContent=text('เปิด QR / แนบสลิป','Open QR / upload receipt','打开二维码 / 上传凭证');resume.onclick=()=>openQr(order);
   const cancel=document.createElement('button');cancel.textContent=text('ยกเลิกรายการ','Cancel order','取消订单');cancel.onclick=()=>{
    if(confirm(text('ยกเลิกเฉพาะรายการที่ยังไม่ได้โอนเงิน ยืนยันหรือไม่?','Cancel only if you have not paid. Continue?','请仅取消未付款的订单。是否继续？')))run(async()=>{await manualApi('cancel',{order_id:order.id});await sync();});
   };
   item.append(resume,cancel);
  }
  list.append(item);
 }
 section.append(heading,refresh,list);
}
function openQr(order){
 qrOrder=order;$('qrSlipForm').reset();$('qrNotice').textContent='';
 $('qrTitle').textContent=text('ชำระด้วย Thai QR','Pay by Thai QR','使用泰国二维码付款');
 $('qrOrder').textContent=orderLabel(order)+' · '+order.id;
 $('qrInstructions').textContent=text('สแกน QR ตำนานผนึกอสูร ตรวจชื่อผู้รับและโอนตามยอดที่แสดง แล้วแนบสลิปเพื่อให้ผู้ดูแลตรวจยอด','Scan the Soulbeast QR, verify the recipient, pay the exact total, then upload your receipt for review.','扫描 Soulbeast 二维码，核对收款方，按金额付款后上传凭证。');
 $('qrDownload').textContent=text('บันทึก QR ลงเครื่อง','Download QR','下载二维码');
 $('qrChoose').textContent=text('แนบสลิป','Choose receipt','选择付款凭证');
 $('qrSubmit').disabled=true;
 qr.querySelector('.qr-scroll').scrollTop=0;
 $('qrSlipLabel').textContent=text('สลิป JPG หรือ PNG ขนาดไม่เกิน 2 MB','JPG or PNG receipt, up to 2 MB','上传 JPG 或 PNG 凭证，最大 2 MB');
 $('qrSubmit').textContent=text('ส่งสลิปให้ตรวจ','Submit receipt','提交凭证');$('qrClose').textContent=t('close');
 if(!qr.open)qr.showModal();
}
function base64(file){return new Promise((resolve,reject)=>{
 const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);
});}
$('qrClose').onclick=()=>qr.close();
$('qrSlip').onchange=()=>{
 const file=$('qrSlip').files[0];
 const valid=Boolean(file&&['image/jpeg','image/png'].includes(file.type)&&file.size<=2097152);
 $('qrSubmit').disabled=!valid;
 $('qrNotice').textContent=valid?file.name:file?$('qrSlipLabel').textContent:'';
};
$('qrSlipForm').onsubmit=async event=>{
 event.preventDefault();
 const file=$('qrSlip').files[0],button=$('qrSubmit');
 if(button.disabled||!qrOrder)return;
 if(!file||!['image/jpeg','image/png'].includes(file.type)||file.size>2097152){$('qrNotice').textContent=$('qrSlipLabel').textContent;return;}
 button.disabled=true;$('qrSlip').disabled=true;$('qrClose').disabled=true;$('qrNotice').textContent=t('checking');
 try{
  const result=await manualApi('submit',{order_id:qrOrder.id,mime:file.type,content:await base64(file)});
  qr.close();notice(statusLabel(result.status));
  try{await sync();}finally{render();}
 }catch{$('qrNotice').textContent=text('ส่งสลิปไม่สำเร็จ ลองส่งซ้ำหรือกดตรวจรายการเดิม','Could not submit. Retry or check the existing order.','提交失败，请重试或查看原订单。');}
 finally{button.disabled=!$('qrSlip').files.length;$('qrSlip').disabled=false;$('qrClose').disabled=false;}
};
async function run(fn,label=t('checking')){
 if(busy)return;
 busy=true;render();
 try{await withLoading(document.querySelector('main'),label,fn);}
 catch(error){notice(error.message==='billing_review_required'?t('review'):error.message==='promotion_unavailable'?t('used'):t('failed'));}
 finally{busy=false;render();accountChanged();}
}
async function boot(){
 await run(async()=>{
  if(loadedSession!==sessionKey()){
   qr.close();state=null;manual=null;target='';
  }
  loadedSession=sessionKey();
  const catalogReady=catalog?Promise.resolve():api('catalog').then(result=>{catalog=result;});
  if(!loadedSession){
   await catalogReady;
   notice(text('เข้าสู่ระบบเพื่อเลือกแพ็กคูปอง','Sign in to choose a pack','登录后选择礼包'));
   return;
  }
  await Promise.all([catalogReady,client.identity()]);
  await sync();
  notice(manual.debt?t('review'):manual.enabled?t('title'):t('unavailable'));
  void loadLegacyHistory();
  const id=new URL(location.href).searchParams.get('order');
  if(/^[a-f0-9-]{36}$/i.test(id||'')){
   void api('refresh',{order_id:id}).then(()=>loadLegacyHistory()).catch(()=>{});
  }
 },t('loading'));
}
function changeLanguage(next){
 if(!['th','en','zh-CN'].includes(next)||next===lang)return;
 const previous=lang,old=$('notice').textContent;
 lang=next;$('shopLanguage').value=lang;
 for(const k of ['unavailable','received','pending','failed','review','title']){
  if(shopText(k,previous)===old)notice(t(k));
 }
 render();
}
lang=window.SoulbeastLocale?.get()||'th';
$('shopLanguage').value=lang;
$('shopLanguage').onchange=e=>{window.SoulbeastLocale?.set(e.target.value);changeLanguage(e.target.value);};
addEventListener('soulbeast-language-change',event=>changeLanguage(event.detail));
await boot();
