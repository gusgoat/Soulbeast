'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/payments');fs.mkdirSync(out,{recursive:true});
const cat=JSON.parse(fs.readFileSync(path.join(root,'content/payment-packs.test.json')));
require('./payment-catalog.cjs').validateCatalog(cat);
const values=cat.packs.map(p=>`('${p.id}',${p.coupons},${p.amountSatang},${p.promotion},'${p.priceId}')`).join(',\n');
fs.writeFileSync(path.join(out,'001-sandbox.sql'),fs.readFileSync(path.join(root,'server/payments/001-sandbox.sql'),'utf8').replace('/* PAYMENT_PACK_VALUES */',values));
for(const name of ['catalog-check','index']){
 const file=path.join(root,'server/payments/'+name+'.ts');if(!fs.existsSync(file))continue;
 let code=fs.readFileSync(file,'utf8').replace('/* PAYMENT_CATALOG */',JSON.stringify(cat));
 if(code.includes('/* PAYMENT_CORE */'))code=code.replace('/* PAYMENT_CORE */',fs.readFileSync(path.join(root,'server/payments/core.mjs'),'utf8').replace(/^export /gm,''));
 fs.writeFileSync(path.join(out,name+'.ts'),code);
}
console.log('Built sandbox payment server sources (no credentials)');
