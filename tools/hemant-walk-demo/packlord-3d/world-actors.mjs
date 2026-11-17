import {
 AmbientLight, AnimationMixer, Box3, DirectionalLight, Group, OrthographicCamera,
 Scene, Vector3, WebGLRenderer, GLTFLoader, MeshoptDecoder, cloneSkeleton,
} from './vendor/three-gltf-v2.mjs';

const SIDE=256;
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache=new Map();
const waiting=[];
let active=0,shared=null;
function pump(){
 while(active<3&&waiting.length){
  const {url,resolve,reject}=waiting.shift();
  active++;
  loader.loadAsync(url).then(resolve,reject).finally(()=>{active--;pump();});
 }
}
function retain(url){
 let entry=cache.get(url);
 if(!entry){
  const ready=new Promise((resolve,reject)=>waiting.push({url,resolve,reject}));
  entry={count:0,ready};
  cache.set(url,entry);
  pump();
 }
 entry.count++;
 clearTimeout(entry.timer);
 return entry;
}
function discardAsset(gltf){
 const textures=new Set(),materials=new Set(),geometries=new Set();
 gltf.scene.traverse(node=>{
  if(!node.isMesh)return;
  geometries.add(node.geometry);
  for(const material of [node.material].flat()){
   materials.add(material);
   for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
  }
 });
 for(const resource of [...textures,...materials,...geometries])resource.dispose();
 for(const image of new Set([...textures].map(texture=>texture.source?.data)))image?.close?.();
}
function release(url,entry){
 if(--entry.count>0)return;
 entry.timer=setTimeout(()=>{
  if(entry.count||cache.get(url)!==entry)return;
  cache.delete(url);
  entry.ready.then(discardAsset,()=>{});
 },12000);
}
function renderer(){
 if(shared)return shared;
 const webgl=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 webgl.setSize(SIDE,SIDE,false);
 webgl.setClearColor(0,0);
 const scene=new Scene();
 const key=new DirectionalLight(0xffeddc,2.15);
 key.position.set(-3,5,4);
 const fill=new DirectionalLight(0xd7e7ff,.85);
 fill.position.set(3,3,-4);
 scene.add(key,fill,new AmbientLight(0xffffff,1.65));
 shared={webgl,scene,lost:false,generation:0};
 webgl.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();shared.lost=true;});
 webgl.domElement.addEventListener('webglcontextrestored',()=>{shared.lost=false;shared.generation++;});
 return shared;
}

export async function createActor(url,{beast=false,primary=false}={}){
 const raster=renderer(),ref=retain(url);
 try{
  const model=await ref.ready;
  const asset=cloneSkeleton(model.scene);
  const bounds=new Box3().setFromObject(asset,true);
  const size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3());
  if(!(size.y>0))throw new Error('Invalid actor bounds');
  asset.position.set(-center.x,-bounds.min.y,-center.z);
  const pivot=new Group();
  pivot.add(asset);
  const span=beast?Math.max(size.y*1.2,Math.hypot(size.x,size.z)*1.14):size.y*1.14;
  const half=span/2;
  const camera=new OrthographicCamera(-half,half,half,-half,.1,30+span);
  camera.position.set(0,size.y*.51+3.5,5.5);
  camera.lookAt(0,size.y*.51,0);
  camera.updateMatrixWorld();
  const anchor=(1-new Vector3().project(camera).y)/2;
  const cached=document.createElement('canvas');
  cached.width=cached.height=SIDE;
  const pixels=cached.getContext('2d');
  const mixer=new AnimationMixer(asset);
  const actions=Object.fromEntries(model.animations.map(clip=>[clip.name.toLowerCase(),mixer.clipAction(clip)]));
  if(beast){
   actions.run??=actions.walk;
   actions.walk??=actions.run;
  }
  if(!actions.idle||!actions.walk||!actions.run)throw new Error('Incomplete actor animation');
  let motion='idle',angle=null,last=null,painted=-Infinity,generation=-1,disposed=false;
  actions.idle.play();
  return {
   draw(ctx,x,y,width,heading,moving,running){
    if(disposed||raster.lost)return false;
    const now=performance.now()/1000,next=moving?(running?'run':'walk'):'idle';
    if(now-painted>=(primary?.029:.079)||next!==motion||generation!==raster.generation){
     const dt=last===null?1/60:Math.min(.12,Math.max(0,now-last));
     last=now;
     const target=-heading*Math.PI/4;
     angle=angle===null?target:angle+Math.atan2(Math.sin(target-angle),Math.cos(target-angle))*(1-Math.exp(-dt*19));
     pivot.rotation.y=angle;
     if(next!==motion){
      const to=actions[next],from=actions[motion],speed=next==='run'&&to===actions.walk?1.35:1;
      if(to===from)to.setEffectiveTimeScale(speed);
      else to.reset().setEffectiveWeight(1).setEffectiveTimeScale(speed).play().crossFadeFrom(from,.16,false);
      motion=next;
     }
     mixer.update(dt);
     raster.scene.add(pivot);
     try{
      raster.webgl.render(raster.scene,camera);
      pixels.clearRect(0,0,SIDE,SIDE);
      pixels.drawImage(raster.webgl.domElement,0,0);
     }finally{raster.scene.remove(pivot);}
     painted=now;
     generation=raster.generation;
    }
    ctx.drawImage(cached,x-width*.5,y-width*anchor,width,width);
    return true;
   },
   get motion(){return motion;},
   get angle(){return angle;},
   dispose(){
    if(disposed)return;
    disposed=true;
    mixer.stopAllAction();
    mixer.uncacheRoot(asset);
    asset.traverse(node=>{if(node.isSkinnedMesh)node.skeleton.dispose();});
    cached.width=cached.height=1;
    release(url,ref);
   },
  };
 }catch(error){release(url,ref);throw error;}
}
