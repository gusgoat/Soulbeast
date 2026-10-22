const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {build}=require('./client-build.cjs');
// Account beta is a separate entry point. Production shell/assets remain byte-identical.
const manifest=JSON.parse(fs.readFileSync(path.join(root,'runtime/manifest.json'),'utf8'));
manifest.modules.accounts={file:'accounts.js',description:'Email account beta',units:1};
manifest.units['1091-playerAccounts']={module:'accounts',names:['ACCOUNT_GAME'],type:'PlayerAccountBeta'};
manifest.order.splice(manifest.order.indexOf('1076-ExpressionStatement'),0,'1091-playerAccounts');
const result=build(null,{write:false,readFile:file=>file===path.join(root,'runtime/manifest.json')?JSON.stringify(manifest):fs.readFileSync(file,'utf8')});
const app=result.assets.staging.find(x=>x.startsWith('game-app.'));
fs.writeFileSync(path.join(root,app),result.files[app]);
let html=result.files['staging-index.html'];
html=html.replace('<div id="app"></div>','<style>.account-page{max-width:600px;margin:8vh auto;padding:18px}.account-logo{width:260px;max-width:90%;margin:auto}.account-page input{display:block;width:100%;margin-top:8px}.account-page form{gap:16px}.account-error{color:#ffb5af;border:1px solid #bf6262;padding:12px;border-radius:12px}</style><div id="app"></div><script>window.SOULBEAST_ACCOUNTS=true;window.SHEET_URL="https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-accounts";</script>');
fs.writeFileSync(path.join(root,'accounts-staging.html'),html);
fs.writeFileSync(path.join(root,'accounts-preview.html'),html.replace('<div id="app"></div>','<div id="app"></div><script src="./client/accounts-preview.js"></script>'));
console.log('Prepared separate account staging entry '+app+'; production unchanged');
