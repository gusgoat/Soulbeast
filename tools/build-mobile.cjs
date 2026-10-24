// Explicit allowlist: never ship admin, SQL, service keys, Stripe checkout, QA mocks or old app bundles.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'mobile/www');
cp.execFileSync(process.execPath,[path.join(root,'tools/prepare-account-stage.cjs')],{cwd:root});
const html=fs.readFileSync(path.join(root,'accounts-staging.html'),'utf8');
const scripts=[...html.matchAll(/(?:src|href)="\.\/((?:game-[^"]+\.(?:js|css)))"/g)].map(x=>x[1]);
fs.mkdirSync(out,{recursive:true});
for(const f of scripts)fs.copyFileSync(path.join(root,f),path.join(out,f));
const clientFiles=['account-client.mjs','account.css','coupon-shop.css','topup-session.mjs','topup-email.mjs','billing-client.mjs','play-shop.mjs','production-shop.mjs'];
fs.mkdirSync(path.join(out,'client'),{recursive:true});for(const f of clientFiles)fs.copyFileSync(path.join(root,'client',f),path.join(out,'client',f));
fs.mkdirSync(path.join(out,'content'),{recursive:true});fs.copyFileSync(path.join(root,'content/billing-channels.json'),path.join(out,'content/billing-channels.json'));
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
// Contain the entire WebView, including fixed buttons/dialogs, inside Android system-bar/cutout insets.
// SystemBars native mode otherwise passes through edge-to-edge on WebView >= 140 when viewport-fit=cover.
let mobileHtml=html.replace('viewport-fit=cover','viewport-fit=contain').replace('<title>ตำนานผนึกอสูร</title>','<title>Soulbeast</title>').replace('<div id="app"></div>','<script src="./native-entry.js"></script><div id="app"></div>');
fs.writeFileSync(path.join(out,'index.html'),mobileHtml);
const esbuild=require(path.join(root,'mobile/node_modules/esbuild'));
esbuild.buildSync({entryPoints:[path.join(root,'mobile/native-entry.mjs')],outfile:path.join(out,'native-entry.js'),bundle:true,format:'iife',platform:'browser',target:['chrome107'],minify:true});
// Fail closed on leftovers from a prior build; never package extra files silently.
const allowed=new Set([...scripts,'index.html','native-entry.js',...clientFiles.map(f=>'client/'+f),'content/billing-channels.json']);
for(const f of fs.readdirSync(out,{recursive:true}).filter(f=>fs.statSync(path.join(out,f)).isFile())){const p=f.replaceAll('\\','/');if(!p.startsWith('assets/')&&!allowed.has(p))throw Error('Unapproved mobile asset: '+p);}
const inventory={version:1,environment:'test',platform:'android',billing:'google_play',purchasesEnabled:JSON.parse(fs.readFileSync(path.join(root,'content/billing-channels.json'),'utf8')).android.purchasesEnabled,files:[...allowed].map(p=>({path:p,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,p))).digest('hex')}))};
fs.writeFileSync(path.join(root,'build/mobile-manifest.json'),JSON.stringify(inventory,null,2));
console.log('Prepared Android internal bundle: test accounts, local art/audio, server-gated production Play billing; no admin/Stripe pages');
