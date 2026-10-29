// Capacitor serves public/assets through Android's AssetManager. Install-time
// packs share that namespace, so URLs and offline media remain unchanged.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),android=path.join(root,'mobile/android');
const source=path.join(android,'app/src/main/assets/public/assets');
const target=path.join(android,'gameassets/src/main/assets/public/assets');
assert(source.startsWith(android+path.sep)&&target.startsWith(android+path.sep));
assert(fs.existsSync(source),'Run cap sync android before preparing the asset pack');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.cpSync(source,target,{recursive:true});
let files=0,bytes=0;
for(const relative of fs.readdirSync(source,{recursive:true})){
 const original=path.join(source,relative);if(!fs.statSync(original).isFile())continue;
 const data=fs.readFileSync(original),copy=fs.readFileSync(path.join(target,relative));
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),crypto.createHash('sha256').update(copy).digest('hex'),relative);
 files++;bytes+=data.length;
}
// Delete only the verified generated copy, never source artwork.
fs.rmSync(source,{recursive:true});
assert(fs.existsSync(path.join(android,'app/src/main/assets/public/index.html')));
fs.writeFileSync(path.join(root,'build/android-asset-pack.json'),JSON.stringify({delivery:'install-time',pack:'gameassets',files,bytes,assetPrefix:'public/assets/'},null,2));
console.log('Verified install-time gameassets: '+files+' unchanged media files, '+bytes+' bytes');
