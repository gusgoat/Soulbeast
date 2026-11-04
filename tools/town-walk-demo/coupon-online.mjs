const contextKey = 'soulbeast-online-walk-v1';
const playerKey = 'soulbeast-walk-preview-player-v1';

if (sessionStorage.getItem(contextKey)) {
 const summary = document.querySelector('main header p');
 const sections = ['couponItems', 'premiumNameplates'].map(id => document.getElementById(id));
 summary.setAttribute('role', 'status');
 summary.textContent = 'กำลังโหลดยอดคูปองออนไลน์…';
 for (const section of sections) {
  const button = section.querySelector('button');
  button.disabled = true;
  button.setAttribute('aria-disabled', 'true');
  section.querySelectorAll('small').forEach(note => note.remove());
  for (const line of section.querySelectorAll('p')) {
   if (line.textContent.includes('คูปองทดลอง') || line.textContent.startsWith('คูปองคงเหลือ')) line.remove();
  }
 }

 try {
  const {connectOnlineWalk} = await import('../../client/online-walk.mjs');
  const connection = connectOnlineWalk();
  let wallet;
  try {
   wallet = await connection.social('walk_coupon_status');
  } catch {
   wallet = await connection.social('gacha_status');
  }
  const showBalance = () => {
   if (!Number.isFinite(wallet.coupons)) throw Error('coupon balance missing');
   summary.textContent = 'คูปองคงเหลือ ' + wallet.coupons.toLocaleString('th-TH') + ' คูปอง';
  };
  showBalance();

  if (wallet.entitlements) {
   const products = [
    {key:'beastFusion', label:'ผนึกรวมร่าง', price:50, section:sections[0]},
    {key:'premiumNameplates', label:'ป้ายชื่อพรีเมียม', price:100, section:sections[1]}
   ];
   const status = document.createElement('p');
   status.setAttribute('role', 'status');
   summary.after(status);
   let busy = false;
   function refresh() {
    showBalance();
    for (const item of products) {
     const owned = wallet.entitlements[item.key] === true;
     item.button.disabled = busy || owned || wallet.coupons < item.price;
     item.button.textContent = owned ? 'ครอบครองถาวรแล้ว' : 'ซื้อ ' + item.label + ' · ' + item.price + ' คูปอง';
    }
   }
   for (const item of products) {
    const original = item.section.querySelector('button');
    item.button = original.cloneNode();
    item.button.removeAttribute('aria-disabled');
    original.replaceWith(item.button);
    item.button.onclick = async () => {
     if (busy) return;
     busy = true;
     refresh();
     try {
      wallet = await connection.social('walk_coupon_buy', {item:item.key});
      const player = JSON.parse(sessionStorage.getItem(playerKey) || 'null');
      if (player) {
       player.entitlements = {...player.entitlements, ...wallet.entitlements};
       sessionStorage.setItem(playerKey, JSON.stringify(player));
       parent.postMessage({type:'walk-player-saved'},location.origin);
      }
      status.textContent = 'ได้รับ ' + item.label + ' แล้ว';
     } catch {
      status.textContent = 'ซื้อไม่สำเร็จ กรุณาเปิดร้านใหม่เพื่อตรวจยอดและสิทธิ์';
     } finally {
      busy = false;
      refresh();
     }
    };
   }
   refresh();
  } else {
   const notice = document.createElement('p');
   notice.textContent = 'รายการด้านล่างจะซื้อได้เมื่อระบบซื้อออนไลน์พร้อมใช้งาน';
   summary.after(notice);
  }
 } catch {
  summary.textContent = 'โหลดยอดคูปองออนไลน์ไม่สำเร็จ กรุณาเปิดร้านใหม่';
 }
}
