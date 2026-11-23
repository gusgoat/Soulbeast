// The five pose sequences are the authored native-rig poses from render-siege-roster.py.
// Apply them to the live skeleton; walking models, meshes and textures stay in place.
const patterns={
 blade:[[14,-18,3,-7,4,-5],[26,-49,16,-22,-6,-16],[-62,17,-12,23,11,16],[-16,8,-3,8,4,6]],
 heavy:[[12,-18,4,-7,3,-9],[-45,-48,9,-12,-5,-21],[-61,23,-12,12,11,15],[-13,9,-3,4,4,6]],
 gun:[[-26,-23,0,-4,-2,-9],[-48,-38,6,-8,-2,-11],[-57,-42,-12,-11,-8,-12],[-30,-22,-2,-5,2,-7]],
 bow:[[-16,-15,0,-5,0,-22],[-39,-53,4,-19,-2,-42],[-35,-27,-9,-12,-4,-39],[-14,-13,0,-3,2,-18]],
 magic:[[9,10,-4,-8,-2,-14],[18,18,-9,-14,-6,-25],[-31,-16,12,13,6,-39],[-8,-5,4,4,3,-17]],
};
const families={"swordsman-female":"blade","swordsman-male":"blade","samurai-female":"blade","samurai-male":"blade","kensei-female":"blade","kensei-male":"blade","shogun-female":"blade","shogun-male":"blade","spellblade-female":"blade","spellblade-male":"blade","sbsummon-female":"blade","sbsummon-male":"blade","sbwar-female":"blade","sbwar-male":"blade","gladiator-female":"heavy","gladiator-male":"heavy","paladin-female":"heavy","paladin-male":"heavy","templar-female":"heavy","templar-male":"heavy","eternal-female":"heavy","eternal-male":"heavy","berserker-female":"heavy","berserker-male":"heavy","warlord-female":"heavy","warlord-male":"heavy","bloodwar-female":"heavy","bloodwar-male":"heavy","archer-female":"bow","archer-male":"bow","ranger-female":"bow","ranger-male":"bow","sniper-female":"bow","sniper-male":"bow","wildlord-female":"bow","wildlord-male":"bow","bard-female":"magic","bard-male":"magic","maestro-female":"magic","maestro-male":"magic","dirge-female":"magic","dirge-male":"magic","mage-female":"magic","mage-male":"magic","sage-female":"magic","sage-male":"magic","archmage-female":"magic","archmage-male":"magic","elementalist-female":"magic","elementalist-male":"magic","warlock-female":"magic","warlock-male":"magic","necro-female":"magic","necro-male":"magic","enchanter-female":"magic","enchanter-male":"magic","merchant-female":"heavy","merchant-male":"heavy","blacksmith-female":"heavy","blacksmith-male":"heavy","mastersmith-female":"heavy","mastersmith-male":"heavy","mechanic-female":"heavy","mechanic-male":"heavy","alchemist-female":"heavy","alchemist-male":"heavy","biochem-female":"heavy","biochem-male":"heavy","goldalch-female":"heavy","goldalch-male":"heavy","gunner-female":"gun","gunner-male":"gun","marksman-female":"gun","marksman-male":"gun","gunsaint-female":"gun","gunsaint-male":"gun","bounty-female":"gun","bounty-male":"gun","artillery-female":"gun","artillery-male":"gun","cannoneer-female":"gun","cannoneer-male":"gun","demolisher-female":"gun","demolisher-male":"gun","druid-female":"magic","druid-male":"magic","feral-female":"magic","feral-male":"magic","wildgod-female":"magic","wildgod-male":"magic","packlord-female":"magic","packlord-male":"magic","grove-female":"magic","grove-male":"magic","archdruid-female":"magic","archdruid-male":"magic","stormcaller-female":"magic","stormcaller-male":"magic","thief-female":"blade","thief-male":"blade","rogue-female":"blade","rogue-male":"blade","masterthief-female":"blade","masterthief-male":"blade","trickster-female":"blade","trickster-male":"blade","assassin-female":"blade","assassin-male":"blade","ninja-female":"blade","ninja-male":"blade","ronin-female":"blade","ronin-male":"blade","summoner-female":"magic","summoner-male":"magic","tamer-female":"magic","tamer-male":"magic","beastking-female":"magic","beastking-male":"magic","sealmaster-female":"magic","sealmaster-male":"magic","soullink-female":"magic","soullink-male":"magic","soulsage-female":"magic","soulsage-male":"magic","spiritlord-female":"magic","spiritlord-male":"magic"};
const normalize=name=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
const smooth=t=>t*t*(3-2*t),radians=Math.PI/180;
export function siegeFamily(actorKey,kind){return families[actorKey]||({hammer:'heavy',gunner:'gun',archer:'bow',magic:'magic'})[kind]||'blade';}
export function siegePoseValues(family,progress){
 const p=Math.max(0,Math.min(1,progress)),phase=Math.min(3,p*4),index=Math.min(2,Math.floor(phase)),blend=smooth(Math.min(1,phase-index)),rows=patterns[family]||patterns.blade;
 const weight=smooth(Math.min(1,p/.1))*smooth(Math.min(1,(1-p)/.16));
 return rows[index].map((value,i)=>(value+(rows[index+1][i]-value)*blend)*weight);
}
export function createSiegePose(root,{Quaternion,Vector3,actorKey=''}){
 const nodes=new Map(),saved=new Map();root.updateMatrixWorld(true);
 root.traverse(node=>{if(node.isBone)nodes.set(normalize(node.name),{node,basis:node.getWorldQuaternion(new Quaternion())});});
 const x=new Vector3(1,0,0),up=new Vector3(0,1,0),rollAxis=new Vector3(0,0,-1);
 const turn=new Quaternion(),q=new Quaternion(),inverse=new Quaternion(),point=new Vector3();
 function restore(){for(const [node,rotation]of saved)node.quaternion.copy(rotation);saved.clear();}
 function rotate(name,pitch=0,yaw=0,roll=0){
  const entry=nodes.get(normalize(name));if(!entry)return;
  const {node,basis}=entry;saved.set(node,node.quaternion.clone());
  turn.setFromAxisAngle(up,yaw*radians).multiply(q.setFromAxisAngle(rollAxis,roll*radians)).multiply(q.setFromAxisAngle(x,pitch*radians));
  inverse.copy(basis).invert();turn.premultiply(inverse).multiply(basis);node.quaternion.multiply(turn);
 }
 function apply(action){
  if(!action)return;
  const family=siegeFamily(actorKey,action.kind);let[upper,elbow,wrist,twist,lean,other]=siegePoseValues(family,action.progress);
  const side=['goldalch-female','grove-female'].includes(actorKey)?'L':'R',free=side==='L'?'R':'L';
  if(actorKey==='bloodwar-female'){upper*=.72;elbow*=.70;wrist*=.70;}
  rotate('spine',lean*.45);rotate('chest',lean*.55,twist);rotate('head',-lean*.35,-twist*.65);
  rotate('upper_arm.'+side,upper,0,['blade','bow'].includes(family)?-twist*.55:-3*smooth(Math.min(1,action.progress/.1))*smooth(Math.min(1,(1-action.progress)/.16)));
  rotate('forearm.'+side,elbow,family==='bow'?twist*.5:0);rotate('hand.'+side,wrist);
  if(side==='L')other*=.24;
  rotate('upper_arm.'+free,other);rotate('forearm.'+free,other*(family==='bow'?.23:.58));rotate('hand.'+free,-other*.25);
 }
 function handPoint(camera){const side=['goldalch-female','grove-female'].includes(actorKey)?'L':'R',entry=nodes.get(normalize('hand.'+side));if(!entry)return null;entry.node.getWorldPosition(point);point.project(camera);return {x:(point.x+1)/2,y:(1-point.y)/2};}
 return {apply,restore,handPoint,get boneCount(){return nodes.size;}};
}
