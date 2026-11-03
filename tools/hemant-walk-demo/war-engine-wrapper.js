const workbookKey='soulbeast-walk-war-workbook-v1',code='WALKWARPREVIEW01',pin='123456';
let queue=Promise.resolve();
async function run(P,packet){
 let input;try{input=JSON.parse(sessionStorage.getItem(workbookKey)||'{}')}catch{input={}}
 const hashes=new Map();
 async function operation(tables,d){
  for(let retry=0;retry<12;retry++){
   const missing=new Set(),book=createWorkbook(tables),utilities=createUtilities(text=>{if(!hashes.has(text)){missing.add(text);return new Uint8Array(32)}return hashes.get(text)},()=>crypto.randomUUID());
   const result=createEngine(book,utilities).dispatch(d);
   if(missing.size){for(const text of missing)hashes.set(text,new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))));continue}
   return {result,tables:book.tables};
  }throw Error('Preview hash preparation failed');
 }
 const rows=input.GuildState||[],hasMember=rows.some(row=>row[0]==='cw:m:'+code);
 if(!hasMember){
  const state={P:{...structuredClone(P),code,cpin:pin},ui:{},screen:'town'};
  const saved=await operation(input,{action:'save',code,pin,name:P.name||'ผู้ผนึกทดสอบ',lv:P.lv,data:JSON.stringify(state)});
  if(!saved.result.ok)throw Error(saved.result.error);input=saved.tables;
 }
 const out=await operation(input,{...packet,code,pin});
 if(out.result.ok){sessionStorage.setItem(workbookKey,JSON.stringify(out.tables));window.walkWar?.update(out.result)}
 return out.result;
}
window.walkWarEngine={dispatch(P,packet){const work=queue.then(()=>run(P,packet));queue=work.catch(()=>{});return work}};
