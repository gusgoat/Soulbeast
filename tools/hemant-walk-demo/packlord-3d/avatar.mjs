import {
 AmbientLight, AnimationMixer, Box3, DirectionalLight, Group, OrthographicCamera,
 Scene, Vector3, WebGLRenderer, GLTFLoader, MeshoptDecoder,
} from './vendor/three-gltf.mjs';

const modelUrl=new URL('packlord-female-v1.glb',import.meta.url);

export async function createAvatar(){
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl.href);
 const asset=gltf.scene;
 const bounds=new Box3().setFromObject(asset,true),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3());
 if(!(size.y>0))throw new Error('Packlord model has no height');
 asset.position.set(-center.x,-bounds.min.y,-center.z);
 const turntable=new Group();
 turntable.add(asset);

 const scene=new Scene();
 scene.add(turntable,new AmbientLight(0xffffff,1.65));
 const key=new DirectionalLight(0xffeddc,2.15);
 key.position.set(-3,5,4);
 scene.add(key);
 const fill=new DirectionalLight(0xd7e7ff,.85);
 fill.position.set(3,3,-4);
 scene.add(fill);

 const span=size.y*1.14,half=span/2;
 const camera=new OrthographicCamera(-half,half,half,-half,.1,30);
 const centerHeight=size.y*.51;
 camera.position.set(0,centerHeight+3.5,5.5);
 camera.lookAt(0,centerHeight,0);
 camera.updateMatrixWorld();
 const ground=new Vector3().project(camera);
 const anchorY=(1-ground.y)/2;
 const renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 const frame=renderer.domElement;
 renderer.setClearColor(0,0);
 renderer.setSize(320,320,false);

 const mixer=new AnimationMixer(asset);
 const actions=Object.fromEntries(gltf.animations.map(clip=>[clip.name.toLowerCase(),mixer.clipAction(clip)]));
 if(!actions.idle||!actions.walk||!actions.run){
  renderer.dispose();
  throw new Error('Packlord animations are incomplete');
 }
 let motion='idle',angle=null,last=null,lost=false;
 actions.idle.play();
 frame.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;});
 frame.addEventListener('webglcontextrestored',()=>{lost=false;last=null;});

 return {
  draw(ctx,x,y,width,direction,moving,running,now){
   if(lost)return false;
   const dt=last===null?1/60:Math.min(.08,Math.max(0,now-last));
   last=now;
   const target=-direction*Math.PI/4;
   angle=angle===null?target:angle+Math.atan2(Math.sin(target-angle),Math.cos(target-angle))*(1-Math.exp(-dt*19));
   turntable.rotation.y=angle;
   const next=moving?(running?'run':'walk'):'idle';
   if(next!==motion){
    const from=actions[motion],to=actions[next];
    to.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
    to.crossFadeFrom(from,.16,false);
    motion=next;
   }
   mixer.update(dt);
   renderer.render(scene,camera);
   ctx.drawImage(frame,x-width*.5,y-width*anchorY,width,width);
   return true;
  },
  get motion(){return motion},
  get angle(){return angle},
  dispose(){
   mixer.stopAllAction();
   asset.traverse(node=>{
    if(!node.isMesh)return;
    node.geometry.dispose();
    for(const mat of [node.material].flat()){
     for(const value of Object.values(mat))if(value?.isTexture)value.dispose();
     mat.dispose();
    }
   });
   renderer.dispose();
  }
 };
}
