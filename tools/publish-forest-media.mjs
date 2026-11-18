import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MOON_FRAMES} from '../assets/forest-walk/moonlight-frames.js';
import {BOSS_ROOM_FRAMES} from '../assets/forest-walk/boss-room-frames.js';
import {BOSS_STATUE_FRAMES} from '../assets/forest-walk/boss-statue-frames.js';
const root=new URL('../',import.meta.url),output=new URL('../../moonlight-publish-20261119/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=[];
for(const [folder,frames] of Object.entries({moonlight:MOON_FRAMES,'boss-rooms':BOSS_ROOM_FRAMES,'boss-statues':BOSS_STATUE_FRAMES})){
  for(const id of Object.keys(frames)){
    const file='assets/forest-walk/generated/'+folder+'/'+id+'.png',bytes=await readFile(new URL(file,root)),sha256=hash(bytes);
    manifest.push({file,key:folder+'/'+id,object:'forest-scenes-v1--'+folder+'--'+id+'--'+sha256.slice(0,16)+'.png',bytes:bytes.length,sha256});
  }
}
await mkdir(output,{recursive:true});await writeFile(new URL('media-manifest.json',output),JSON.stringify(manifest,null,2));
const writeModule=()=>writeFile(new URL('assets/forest-walk/published-scene-assets.js',root),'// Immutable Supabase objects; generated PNG originals stay out of Git.\nexport const PUBLISHED_FOREST_MEDIA = '+JSON.stringify(Object.fromEntries(manifest.map(m=>[m.key,m.object])),null,2)+';\n');
if(process.argv.includes('--prepare')){await writeModule();console.log(JSON.stringify({files:manifest.length,bytes:manifest.reduce((n,m)=>n+m.bytes,0)}));process.exit(0);}
let key=process.env.SOULBEAST_STORAGE_UPLOAD_KEY;
if(!key){const text=await readFile('D:/GameDev/soulbeast/private/supabase-storage-upload.env','utf8');key=text.match(/^\s*SOULBEAST_STORAGE_UPLOAD_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1].trim();}
if(!key||key==='PASTE_YOUR_SECRET_KEY_HERE')throw Error('Storage upload credential missing');
const base='https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/',bucket='soulbeast-game-assets/';
const headers=key.startsWith('sb_secret_')?{apikey:key}:{apikey:key,Authorization:'Bearer '+key};
const results=[];
for(const item of manifest){
  const url=base+'public/'+bucket+item.object,check=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(30000)});
  if(!check.ok){
    const res=await fetch(base+bucket+item.object,{method:'POST',headers:{...headers,'Content-Type':'image/png','x-upsert':'false','cache-control':'31536000'},body:await readFile(new URL(item.file,root)),signal:AbortSignal.timeout(90000)});
    if(!res.ok&&res.status!==409)throw Error(item.object+': upload HTTP '+res.status);
  }
  const res=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!res.ok)throw Error(item.object+': verify HTTP '+res.status);
  if(hash(Buffer.from(await res.arrayBuffer()))!==item.sha256)throw Error(item.object+': hash mismatch; existing object left untouched');
  results.push({...item,url,verified:true});await writeFile(new URL('storage-upload.json',output),JSON.stringify(results,null,2));
  console.log('VERIFIED '+results.length+'/'+manifest.length+' '+item.object);
}
await writeModule();console.log('PASS immutable forest media uploaded and SHA-256 verified');
