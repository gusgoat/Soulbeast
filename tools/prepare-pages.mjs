import {execFileSync} from 'node:child_process';
import {copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {media, mediaSize, restoreMedia, directMediaRoot} from './media-storage.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const destination=process.argv[2];
if(!destination)throw new Error('Usage: node tools/prepare-pages.mjs <new output directory>');
const output=resolve(destination);
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});

const tracked=new Set(git('ls-files','--cached','-z').split('\0').filter(Boolean));
const files=new Set([...tracked,...Object.keys(media.paths)]);

// Archived client builds are retained in Git for regression tests and rollback.
const archivedClients=new Set([
 'game-app.87fd16861796bebd.js',
 'game-app.95c532bf5f401ce2.js',
 'game-app.b2e88f985255c7e9.js',
 'game-app.cd48b244025afef6.js',
]);
// Editing inputs. The game loads the processed tiles, props and sprites.
const sourceArt=new Set([
 'assets/dungeon-mine-v1/floor-source.png.webp',
 'assets/dungeon-mine-v1/gates-source.png.webp',
 'assets/dungeon-mine-v1/props-padded-source.png.webp',
 'assets/dungeon-mine-v1/props-source.png.webp',
 'assets/dungeon-mine-v1/water-source.png.webp',
 'assets/town-walk-preview/coupon-building-source-v1.png.webp',
 'assets/town-walk-preview/gacha-building-source-v1.png.webp',
 'assets/town-walk-preview/library-building-source-v1.png.webp',
 'assets/town-walk-preview/trees-raw-v1.png.webp',
 'assets/town-walk-preview/wall-h-raw-v1.png.webp',
 'assets/town-walk-preview/wall-v-raw-v1.png.webp',
]);
// The game streams these MP4s from Supabase Storage. Keep the WebP posters on Pages.
const streamedVideos=new Set(['assets/video/soulbeast-intro-v2.mp4']);
// Rigged 3D actors load from Storage; these atlas files are editing and rollback inputs.
const retiredSealerAtlas=/^assets\/player-walk\/[^/]+\/(?:idle|walk|run)-[a-z0-9-]+\.webp$/;
const retiredBeastAtlas=/^outputs\/(?:beast-walk-batch-20261102|dungeon-boss-walk-20261102|tricephalos-mount-rig-20261101)\/.+\/(?:idle|walk|run)-atlas\.webp$/;
const retiredRareAtlas=/^assets\/rare-beast-walk-20261103\/(?:qilin|baihu|frost_lich|vampire_queen)-walk-v1\.(?:webp|png)$/;
const streamedMusic=new Set([
 'assets/audio/20261020/0e86c1cf8adcec8f15b9849e.mp3',
 'assets/audio/20261020/394f1ddfb2570de3ddd2287b.mp3',
 'assets/audio/20261020/3a6e30249ec45093ab637c1a.mp3',
 'assets/audio/20261020/3cd84beba88a12405f414334.mp3',
 'assets/audio/20261020/41ac1161c8b26f5ceabbed1e.mp3',
 'assets/audio/20261020/575f7581ee845faaa338fc07.mp3',
 'assets/audio/20261020/6538f1cf93feddd03906328e.mp3',
 'assets/audio/20261020/737ee9690b117b734e2b0f46.mp3',
 'assets/audio/20261020/76e4f429449a697ad4f62e22.mp3',
 'assets/audio/20261020/7a5c276f6f6b562b608a663d.mp3',
 'assets/audio/20261020/7a614db3a17f8c107b8cdf87.mp3',
 'assets/audio/20261020/8a9202270cb18ed47f7fbd21.mp3',
 'assets/audio/20261020/8c35f0ad34b7ec2f4b180d7e.mp3',
 'assets/audio/20261020/8de45711bc58113e5b784c45.mp3',
 'assets/audio/20261020/8e33cb7d7bd641f84008c3d6.mp3',
 'assets/audio/20261020/8f3321d5c6fa9c923baca49a.mp3',
 'assets/audio/20261020/90b90549e0e6d373635a198e.mp3',
 'assets/audio/20261020/b19277d276ff682d9c42f968.mp3',
 'assets/audio/20261020/b6de92cbbf3d7e274a7df2c1.mp3',
 'assets/audio/20261020/b7dd7f5297a8d4dd9cb8c9dc.mp3',
 'assets/audio/20261020/c2767908a09854a9a8a493c6.mp3',
 'assets/audio/20261020/ca13cc0ffe4074e5b00b42e2.mp3',
 'assets/audio/20261020/d10a4722ba415641f3afe416.mp3',
 'assets/audio/20261020/d6d1eba3ad020dac83b3c06e.mp3',
 'assets/audio/20261020/d98d1e57f5f3fd9e7c8ac059.mp3',
 'assets/audio/20261020/db080662d0be653c321002a2.mp3',
 'assets/audio/20261020/dd0b44348182027f00e7ffd2.mp3',
 'assets/audio/20261020/ea5165438fefdb302044778b.mp3',
 'assets/audio/20261020/eb0e61e3b2780f033a741c54.mp3',
 'assets/audio/20261020/edbfc5290c656eb652e5b876.mp3',
 'assets/audio/20261020/ef2b03ffd1681e0a7530f3ab.mp3',
 'assets/audio/20261020/f2ef4b725655fce4a277d31f.mp3',
 'assets/audio/20261020/f34a2c356dbca3aed5b2171e.mp3',
 'assets/audio/competitive/activity-menu.mp3',
 'assets/audio/competitive/colosseum-arena.mp3',
 'assets/audio/gacha-shrine.mp3',
 'assets/audio/menu-and-results.mp3',
 'assets/media/0be49b0ed4b7696994eb2ab9.mp3',
 'assets/media/1982e3e87e1b5a7ab25a933d.mp3',
 'assets/media/223f8725e41c259516a7d97f.mp3',
 'assets/media/29faa2af94308777eafe7c38.mp3',
 'assets/media/549aa7ccf8246430a74f88d6.mp3',
 'assets/media/6e990032d2a1765046b83df1.mp3',
 'assets/media/ae90e5697f1bc67924075c93.mp3',
 'assets/media/c10edbdc49f40f77be3f0218.mp3',
 'assets/media/c84eeaa3edde5a71b8fe9177.mp3',
 'assets/media/f11e0ab2f409af4b1e6c1211.mp3',
]);
const signatureManifest='assets/vfx/signature-portraits-v9/available.js';
const signaturePng=/^assets\/vfx\/signature-portraits-(?:v9\/[a-z0-9_-]+|v7\/[a-z0-9_-]+-expanded)\.png$/;
const publishedSignatureManifest=files.has(signatureManifest)
 ?readFileSync(resolve(root,signatureManifest),'utf8')+
  'globalThis.SoulbeastSignaturePortraitRoot='+JSON.stringify(directMediaRoot)+';\n'
 :null;
for(let zone=1;zone<=8;zone++){
 for(const phase of ['before','after'])streamedVideos.add('assets/video/forest-story/zone-'+zone+'-'+phase+'.mp4');
}
const catalog='tools/rare-beast-walk-demo/catalog.js';
const originals=new Set();
const publishedCatalog=readFileSync(resolve(root,catalog),'utf8').replace(
 /("png":\s*")\/Soulbeast\/(assets\/rare-beast-walk-20261103\/[a-z0-9_]+-walk-v\d+\.png)(")/g,
 (entry,start,path,end)=>{
  if(!media.direct[path]||!files.has(path.replace(/\.png$/,'.webp')))return entry;
  originals.add(path);
  return start+directMediaRoot+path+end;
 },
);

let bytes=0, count=0, omittedBytes=0, streamedBytes=0, movementBytes=0, musicBytes=0, signatureBytes=0;
const staged=[];
const accountEntry=readFileSync(resolve(root,'accounts.html'),'utf8');
for(const file of files){
 if(file.startsWith('.github/')||['tools/prepare-pages.mjs','tools/media-storage.mjs','tools/media-storage.json'].includes(file))continue;
 if(archivedClients.has(file)&&!accountEntry.includes(file))continue;
 const source=resolve(root,file);
 const stored=!!media.paths[file]&&!tracked.has(file);
 const size=stored?mediaSize(file):statSync(source).size;
 if(streamedVideos.has(file)){streamedBytes+=size;continue;}
 if(retiredSealerAtlas.test(file)||retiredBeastAtlas.test(file)||retiredRareAtlas.test(file)){movementBytes+=size;continue;}
 if(streamedMusic.has(file)){musicBytes+=size;continue;}
 if(publishedSignatureManifest&&signaturePng.test(file)){signatureBytes+=size;continue;}
 if(sourceArt.has(file)||originals.has(file)){omittedBytes+=size;continue;}
 const rewritten=file===catalog?publishedCatalog:file===signatureManifest?publishedSignatureManifest:null;
 bytes+=rewritten===null?size:Buffer.byteLength(rewritten);
 staged.push({file,source,rewritten,stored});
 count++;
}
if(bytes>=1_000_000_000)throw new Error(`Pages would publish ${bytes} bytes. The site must be smaller than 1 GB.`);
if(process.argv.includes('--measure-only')){console.log(`PASS Pages size: ${bytes} bytes in ${count} files, below 1 GB; no output copy requested.`);process.exit(0);}

mkdirSync(output);
const fromStorage=[];
for(const {file,source,rewritten,stored} of staged){
 if(stored){fromStorage.push(file);continue;}
 const target=resolve(output,file);
 mkdirSync(dirname(target),{recursive:true});
 if(rewritten!==null)writeFileSync(target,rewritten);
 else copyFileSync(source,target);
}
await restoreMedia(fromStorage,output);
console.log(`Pages site: ${bytes} bytes in ${count} files. Excluded ${omittedBytes} bytes of source art and ${streamedBytes} bytes of streamed video and ${movementBytes} bytes of retired movement sprites and ${musicBytes} bytes of streamed music. ${signatureBytes} bytes of portrait PNGs are served from Supabase Storage.`);
