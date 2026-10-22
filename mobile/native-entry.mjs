import {registerPlugin} from '@capacitor/core';
import {App} from '@capacitor/app';
const billing=registerPlugin('SoulbeastBilling');
window.SOULBEAST_PLATFORM='android';
window.SB_NATIVE={billing};
let backAt=0;
App.addListener('backButton',()=>{
 if(window.SB_ACCOUNT_BACK?.())return;
 if(Date.now()-backAt<2000){App.exitApp();return;}
 backAt=Date.now();const message=document.createElement('div');message.className='toast';message.textContent='กดย้อนกลับอีกครั้งเพื่อออกเกม';document.body.appendChild(message);setTimeout(()=>message.remove(),1900);
});
App.addListener('appStateChange',({isActive})=>{if(!isActive)window.SB_ACCOUNT_PAUSE?.();});
