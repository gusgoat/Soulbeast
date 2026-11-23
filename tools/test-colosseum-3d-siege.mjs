import assert from 'node:assert/strict';
import {Group,Vector3} from './hemant-walk-demo/packlord-3d/vendor/three-gltf-v2.mjs';
import {createSiegePose,siegeFamily,siegePoseValues} from './hemant-walk-demo/packlord-3d/siege-pose.mjs';
const Quaternion=(new Group()).quaternion.constructor;
for(const [actorKey,kind,family]of [['swordsman-male','melee','blade'],['blacksmith-male','hammer','heavy'],['archer-female','archer','bow'],['gunner-male','gunner','gun'],['mage-female','magic','magic']]){
 assert.equal(siegeFamily(actorKey,kind),family);
 const root=new Group(),bones=[];for(const name of ['spine','chest','head','upper_arm.R','forearm.R','hand.R','upper_arm.L','forearm.L','hand.L']){const b=new Group();b.isBone=true;b.name=name;b.quaternion.setFromAxisAngle(new Vector3(0,0,1),.13);root.add(b);bones.push(b);}
 const original=bones.map(b=>b.quaternion.clone()),pose=createSiegePose(root,{Quaternion,Vector3,actorKey});
 assert.equal(pose.boneCount,9);
 for(const progress of [0,.16,.34,.52,.74,1]){pose.restore();pose.apply({kind,progress});for(const b of bones)assert(Math.abs(b.quaternion.length()-1)<1e-6);const changed=bones.some((b,i)=>b.quaternion.angleTo(original[i])>.02);assert.equal(changed,progress>0&&progress<1,'Neutral endpoints and animated mid-strike');}
 pose.restore();for(const [i,b]of bones.entries())assert(b.quaternion.angleTo(original[i])<1e-6,'No accumulated pose drift after strike');
 assert(siegePoseValues(family,.45).some(v=>Math.abs(v)>10));
}
assert.equal(siegePoseValues('blade',.5)[0],-62,'Strike aligns with original Blender frame 13 and projectile release');
console.log('PASS five original weapon poses, live rig rotation, neutral endpoints and exact restoration');
