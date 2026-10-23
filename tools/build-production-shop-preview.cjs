// Local fixture only: never authenticate, create a checkout, or call a payment provider.
const fs=require('fs'),catalog=require('../content/payment-packs.production.json');
fs.mkdirSync('build',{recursive:true});
const fixture=`
const catalog=${JSON.stringify(catalog)};
Object.defineProperty(window,'localStorage',{value:{getItem:()=>null,setItem(){},removeItem(){}}});
Object.defineProperty(window,'sessionStorage',{value:{getItem:()=>null,setItem(){},removeItem(){}}});
window.fetch=async(url,options)=>{const body=JSON.parse(options?.body||'{}');if(body.action==='catalog')return Response.json({ok:true,mode:'production',enabled:{stripe:false,google_play:true},packageName:catalog.packageName,packs:catalog.packs});if(body.action==='status')return Response.json({ok:true,debt:0,orders:[],characters:[{code:'FIXTURECHARACTER1',name:'ตัวอย่างผู้ผนึก'}]});throw Error('Preview blocks real authentication and purchases');};
await import('../client/topup-production.mjs');
const note=document.createElement('p');note.textContent='ตัวอย่างหน้าร้าน · ไม่มีการรับเงินหรือเข้าบัญชีจริง';document.querySelector('header').prepend(note);
const demo=document.createElement('button');demo.textContent='Android · เปิดตัวอย่างร้าน Google Play';document.querySelector('header').append(demo);demo.onclick=async()=>{const {openProductionPlayShop}=await import('../client/production-shop.mjs');await openProductionPlayShop({client:{sessions:{token:async()=>'fixture'}},code:'FIXTURECHARACTER1',native:{getCapabilities:async()=>({enabled:true,packageName:catalog.packageName}),getProducts:async()=>({products:catalog.packs.map(p=>({id:p.productId,formattedPrice:p.amountSatang/100+' THB'}))}),getPurchases:async()=>({purchases:[]}),purchase:async()=>{throw Error('Purchases blocked in preview')}},config:{android:{purchasesEnabled:true}},notify:()=>{},lang:document.documentElement.lang});};
`;
fs.writeFileSync('build/production-shop-fixture.mjs',fixture);
fs.writeFileSync('build/production-shop-preview.html',fs.readFileSync('topup.html','utf8').replace('<head>','<head><base href="../">').replace('./client/topup-production.mjs','./build/production-shop-fixture.mjs'));
console.log('Prepared isolated web/Android shop preview in three languages; all real purchases/authentication blocked');
