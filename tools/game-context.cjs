const fs=require('fs'),vm=require('vm');
module.exports=function(path='recovered/adventure/index.html',options={}){
 const html=require('./read-game-document.cjs')(path);
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
 const app={innerHTML:'',dataset:{},querySelector:()=>({scrollTop:0}),classList:{remove(){},add(){}}};
 const els={app,nm:{value:'ทดสอบ'},imgIn:{addEventListener(){}},saveFile:{addEventListener(){}}};
 const ctx={console,window:{SHEET_URL:options.sheetURL||''},document:{hidden:false,addEventListener(){},getElementById:id=>els[id]||null,querySelectorAll:()=>[],querySelector:()=>({scrollTo(){}}),createElement:()=>({remove(){}}),body:{appendChild(){}}},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},setInterval:()=>1,setTimeout:()=>1,clearTimeout(){},Uint8Array,crypto:require('crypto').webcrypto,fetch:()=>{throw Error('No network in tests')}};
 vm.createContext(ctx);vm.runInContext(scripts[1].slice(0,scripts[1].indexOf('window.claude?.hot?.snapshot')),ctx);
 const run=s=>vm.runInContext(s,ctx);if(options.beforeNewGame)run(options.beforeNewGame);run(`S={screen:'start',ui:{}};handlers.newgame();S.P.code='CHECKTEST2345';`);
 return {ctx,run,app,html};
};
