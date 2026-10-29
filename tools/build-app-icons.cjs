// Resize the supplied Soulbeast artwork without changing its design.
const fs=require('fs'),path=require('path');
const sharp=require(process.env.SOULBEAST_SHARP||'sharp');
const root=path.resolve(__dirname,'..'),res=path.join(root,'mobile/android/app/src/main/res');
const source=path.join(root,'mobile/branding/soulbeast-icon-source.jpg');
const dark={r:6,g:13,b:24,alpha:1};
async function inset(size,artSize){
 const art=await sharp(source).resize(artSize,artSize,{fit:'contain',background:dark}).png().toBuffer();
 return sharp({create:{width:size,height:size,channels:4,background:dark}}).composite([{input:art,gravity:'centre'}]).png().toBuffer();
}
(async()=>{
 for(const [density,scale] of Object.entries({mdpi:1,hdpi:1.5,xhdpi:2,xxhdpi:3,xxxhdpi:4})){
  const dir=path.join(res,'mipmap-'+density);fs.mkdirSync(dir,{recursive:true});
  const size=Math.round(48*scale),legacy=await inset(size,Math.round(size*0.92));
  fs.writeFileSync(path.join(dir,'ic_launcher.png'),legacy);
  fs.writeFileSync(path.join(dir,'ic_launcher_round.png'),legacy);
  const canvas=Math.round(108*scale),artSize=Math.round(66*scale);
  const art=await sharp(source).resize(artSize,artSize).png().toBuffer();
  const foreground=await sharp({create:{width:canvas,height:canvas,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:art,gravity:'centre'}]).png().toBuffer();
  fs.writeFileSync(path.join(dir,'ic_launcher_foreground.png'),foreground);
 }
 fs.writeFileSync(path.join(root,'mobile/branding/play-store-icon-512.png'),await inset(512,472));
 const square=await inset(256,236);
 const round=await sharp(square).composite([{input:Buffer.from('<svg width="256" height="256"><circle cx="128" cy="128" r="128" fill="white"/></svg>'),blend:'dest-in'}]).png().toBuffer();
 const preview=await sharp({create:{width:620,height:310,channels:4,background:'#182535'}}).composite([{input:square,left:30,top:27},{input:round,left:334,top:27}]).png().toBuffer();
 const out=path.join(root,'outputs/android-icon-20261029');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'icon-preview.png'),preview);
 console.log('Generated five launcher densities, adaptive foregrounds, Play Store 512px icon and shape preview');
})().catch(e=>{console.error(e);process.exit(1)});
