import {connectAccounts} from '../../client/account-client.mjs?v=referral-1';

const tr=(th,en,zh)=>({'en':en,'zh-CN':zh})[window.SoulbeastLocale?.get()]??th;
const open=document.getElementById('couponInvite');
let character;
try{
 const ctx=JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1')||'null');
 if(ctx?.environment==='live'&&!ctx.exiting)character=ctx.code;
}catch{}

function element(tag,text,cls){
 const el=document.createElement(tag);
 if(text)el.textContent=text;
 if(cls)el.className=cls;
 return el;
}
function button(text,handler){
 const el=element('button',text);
 el.type='button';el.onclick=handler;return el;
}
function copyRow(label,value,status){
 const row=element('div',null,'invite-copy-row'),actions=element('div'),input=element('input');
 row.append(element('span',label));
 input.readOnly=true;input.value=value;input.setAttribute('aria-label',label);
 actions.append(input,button(tr('คัดลอก','Copy','复制'),async()=>{
  let copied=false;
  try{
   if(navigator.clipboard){await navigator.clipboard.writeText(value);copied=true;}
  }catch{}
  if(!copied){
   input.focus();input.select();input.setSelectionRange(0,value.length);
   try{copied=document.execCommand('copy')}catch{}
  }
  status.textContent=copied?tr('คัดลอกแล้ว','Copied','已复制'):
   tr('แตะค้างที่ข้อความเพื่อคัดลอก','Press and hold the text to copy it','长按文字进行复制');
 }));
 row.append(actions);return row;
}
if(open&&character){
 open.hidden=false;
 open.textContent=tr('ชวนเพื่อน','Invite friends','邀请好友');
 open.onclick=async()=>{
  const dialog=element('dialog',null,'invite-dialog'),title=element('h2',open.textContent),body=element('div',null,'invite-body');
  title.id='invite-title';dialog.setAttribute('aria-labelledby',title.id);
  const message=element('p',tr('กำลังโหลดรหัสชวน…','Loading your invite code…','正在加载邀请码…'));
  message.setAttribute('role','status');
  const close=button(tr('ปิด','Close','关闭'),()=>dialog.close());
  body.append(message);dialog.append(title,body,close);
  dialog.addEventListener('close',()=>{dialog.remove();open.focus();},{once:true});
  document.body.append(dialog);dialog.showModal();close.focus();
  try{
   const data=await connectAccounts(()=>{}).referralStatus(character);
   if(!dialog.open)return;
   if(!/^[0-9A-F]{16}$/.test(data.code))throw Error('bad referral status');
   const link=new URL('/Soulbeast/accounts.html',location.origin);
   link.searchParams.set('invite',data.code);
   body.replaceChildren(
    element('p',tr('เพื่อนใหม่ต้องใช้รหัสตอนสมัคร เมื่อมีตัวละครใดตัวหนึ่งถึง Lv 10 คุณจะได้ 10 คูปอง สูงสุด 100 คูปองจากเพื่อน 10 บัญชี',
     'Your friend must use the code at signup. Earn 10 coupons when any of their characters reaches Lv 10, up to 100 coupons from 10 accounts.',
     '新好友须在注册时使用邀请码。好友任意角色达到 10 级后，你可获得 10 张兑换券；最多计入 10 个账号，共 100 张。')),
    element('p',tr(`ได้รับแล้ว ${data.coupons}/100 คูปอง · ${data.rewarded}/10 คน`,
     `${data.coupons}/100 coupons earned · ${data.rewarded}/10 friends`,`已获 ${data.coupons}/100 张兑换券 · ${data.rewarded}/10 名好友`)),
    element('p',tr(`ส่งคูปองให้ตัวละคร: ${data.walletName||character}`,
     `Reward character: ${data.walletName||character}`,`奖励角色：${data.walletName||character}`)),
    ...(data.ready? [element('p',tr(`รอรับรางวัล ${data.ready} คน`,`${data.ready} reward(s) queued`,`${data.ready} 份奖励等待发放`))]:[]),
    ...(data.rewarded>=data.cap?[element('p',tr('รับคูปองครบแล้ว ยังแชร์ลิงก์ให้เพื่อนได้','Reward limit reached. You can still share the link.','已达奖励上限，仍可分享链接。'))]:[]),
    copyRow(tr('ลิงก์สมัครเกม','Signup link','注册链接'),link.href,message),
    copyRow(tr('รหัสชวน','Invite code','邀请码'),data.code,message),
    message,
   );
   message.textContent='';
  }catch{
   message.textContent=tr('ยังโหลดระบบชวนเพื่อนไม่ได้ กรุณาปิดแล้วลองใหม่','Could not load invites. Close and try again.','暂时无法加载邀请，请关闭后重试。');
  }
 };
}
