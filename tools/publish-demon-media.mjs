import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DEMON_FRAMES} from '../assets/forest-walk/demon-frames.js';
import {DEMON_ROOM_FRAMES} from '../assets/forest-walk/demon-room-frames.js';
import {PUBLISHED_FOREST_MEDIA} from '../assets/forest-walk/published-scene-assets.js';
const root=new URL('../',import.meta.url),output=new URL('../../demon-publish-20261119/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex'),manifest=[];
for(const [folder,ids]of Object.entries({demon:Object.keys(DEMON_FRAMES),'demon-interior':[...Object.keys(DEMON_ROOM_FRAMES),'services-v2','town-exit-v1','village-front-v1']})){
 for(const id of ids){
  const file='assets/forest-walk/generated/'+folder+'/'+id+'.png',bytes=await readFile(new URL(file,root)),sha256=hash(bytes);
  manifest.push({file,key:folder+'/'+id,object:'forest-scenes-v1--'+folder+'--'+id+'--'+sha256.slice(0,16)+'.png',type:'image/png',bytes:bytes.length,sha256});
 }
}
await mkdir(output,{recursive:true});await writeFile(new URL('media-manifest.json',output),JSON.stringify(manifest,null,2));
if(process.argv.includes('--inventory')){console.log(JSON.stringify({files:manifest.length,bytes:manifest.reduce((n,m)=>n+m.bytes,0)}));process.exit(0);}
let key=process.env.SOULBEAST_STORAGE_UPLOAD_KEY;
if(!key){const env=await readFile('D:/GameDev/soulbeast/private/supabase-storage-upload.env','utf8');key=env.match(/^\s*SOULBEAST_STORAGE_UPLOAD_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1].trim();}
if(!key||key==='PASTE_YOUR_SECRET_KEY_HERE')throw Error('Storage upload credential missing');
const base='https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/',bucket='soulbeast-game-assets/';
const headers=key.startsWith('sb_secret_')?{apikey:key}:{apikey:key,Authorization:'Bearer '+key},results=[];
for(const item of manifest){
 const url=base+'public/'+bucket+item.object,check=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(30000)});
 if(!check.ok){
  if(check.status!==404){const probe=await fetch(url,{signal:AbortSignal.timeout(30000)}),detail=await probe.json().catch(()=>({}));if(detail.code!=='NoSuchKey'&&detail.error!=='not_found')throw Error(item.object+': preflight HTTP '+check.status);}
  const res=await fetch(base+bucket+item.object,{method:'POST',headers:{...headers,'Content-Type':item.type,'x-upsert':'false','cache-control':'31536000'},body:await readFile(new URL(item.file,root)),signal:AbortSignal.timeout(90000)});
  if(!res.ok&&res.status!==409)throw Error(item.object+': upload HTTP '+res.status);
 }
 const res=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!res.ok)throw Error(item.object+': verify HTTP '+res.status);
 if(hash(Buffer.from(await res.arrayBuffer()))!==item.sha256)throw Error(item.object+': hash mismatch; existing object left untouched');
 results.push({...item,url,verified:true});await writeFile(new URL('storage-upload.json',output),JSON.stringify(results,null,2));console.log('VERIFIED '+results.length+'/'+manifest.length+' '+item.key);
}
const next={...PUBLISHED_FOREST_MEDIA,...Object.fromEntries(manifest.map(m=>[m.key,m.object]))};
await writeFile(new URL('assets/forest-walk/published-scene-assets.js',root),'// Immutable Supabase objects; generated PNG originals stay out of Git.\nexport const PUBLISHED_FOREST_MEDIA = '+JSON.stringify(next,null,2)+';\n');
console.log('PASS '+manifest.length+' castle PNGs uploaded and SHA-256 verified; existing media preserved');
