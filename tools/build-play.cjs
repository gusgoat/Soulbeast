const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/play');fs.mkdirSync(out,{recursive:true});
const mapping=require('../content/billing-channels.json').android,packs=require('../content/payment-packs.test.json').packs.map(p=>({id:p.id,name:p.name,coupons:p.coupons,promotion:p.promotion,productId:mapping.products[p.id]}));
if(mapping.packageName!=='com.soulbeastgame.app'||packs.some(p=>!p.productId))throw Error('Play product/package mismatch');
const modules=['google-play-core.mjs','play-provider.mjs','play-service.mjs'].map(f=>fs.readFileSync(path.join(root,'server/payments',f),'utf8').replace(/^export /gm,'')).join('\n');
fs.writeFileSync(path.join(out,'index.ts'),fs.readFileSync(path.join(root,'server/payments/play-index.ts'),'utf8').replace('/* PLAY_MODULES */',modules).replace('/* PLAY_CATALOG */',JSON.stringify(packs)));
const values=packs.map(p=>`('${p.id}','${p.productId}',${p.coupons},${p.promotion})`).join(',\n');
fs.writeFileSync(path.join(out,'003-play-test.sql'),fs.readFileSync(path.join(root,'server/payments/003-play-test.sql'),'utf8').replace('/* PLAY_PACK_VALUES */',values));
console.log('Prepared Play TEST endpoint and atomic delivery migration, disabled without server flag/credentials');
