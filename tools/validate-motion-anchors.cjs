const fs=require('fs'),crypto=require('crypto');
module.exports=function validateMotionAnchors(actors,root=process.cwd()){
 const read=asset=>fs.readFileSync(require('path').resolve(root,asset));
 for(const a of actors){
  const p=a.source?.anchor;
  const asset=a.poseAssets?.windup||`${a.assetBase||'assets/beasts/motion/'+a.id}-windup-v1.webp`;
  if(!p||p.pose!=='windup'||p.asset!==asset||![p.x,p.y].every(n=>Number.isFinite(n)&&n>=0&&n<=100))throw Error('Invalid image anchor: '+a.id);
  const hash=crypto.createHash('sha256').update(read(asset)).digest('hex');
  if(a.meleeSource){const m=a.meleeSource;if(m.pose!=='melee'||m.asset!==a.poseAssets?.melee||![m.x,m.y].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||crypto.createHash('sha256').update(read(m.asset)).digest('hex')!==m.sha256)throw Error('Melee changed; recalibrate emission anchor: '+a.id);}
  const fx=a.meleeSource?.effect;if(fx&&(fx.asset!==a.poseAssets?.meleeEffect||![fx.x,fx.y].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||crypto.createHash('sha256').update(read(fx.asset)).digest('hex')!==fx.sha256))throw Error('Melee effect changed; recalibrate contact point: '+a.id);
  const power=a.source.effect;
  if(power){const asset=a.poseAssets?.power||a.powerAsset||`${a.assetBase||'assets/beasts/motion/'+a.id}-power-v1.webp`;
   if(!Number.isFinite(power.originX??50)||(power.originX??50)<0||(power.originX??50)>100||(power.originX??50)!==(a.source.effectOriginX??50))throw Error('Power effect changed; recalibrate horizontal emission origin: '+a.id);
   if(power.asset!==asset||!Number.isFinite(power.originY)||power.originY<0||power.originY>100||power.originY!==(a.source.effectOriginY??50)||crypto.createHash('sha256').update(read(asset)).digest('hex')!==power.sha256)throw Error('Power effect changed; recalibrate emission origin: '+a.id);
  }
  if(hash!==p.sha256)throw Error('Windup changed; recalibrate emission anchor before building: '+a.id);
 }
};
