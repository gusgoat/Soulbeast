import {LAYER_FRAMES} from './training-layer-frames.js';

// An assembly contains physical pieces, each with its own ground depth and elevation.
// Numbers below are presentation coordinates; no event/contact/reward rules live here.
export function placeLayers(id, art, x, z, width) {
  const frames = LAYER_FRAMES[id];
  if (!frames) return null;
  const props = [];
  function part(cell, dx, dz, w, extra = {}) {
    const source = frames[cell];
    const p = {kind:'training-prop', art, sceneId:id, effectId:id+'#'+cell, source, x:x+dx, z:z+dz,
      width:w, pivot:1, layered:true, ...extra};
    if (p.height) p.width = p.height * source[2] / source[3];
    props.push(p);
    return p;
  }
  const floor = (w=width) => part(0,0,0,w,{ground:true,pivot:.5});
  const roof = (cell,w,elevation,depth=-3) => part(cell,0,depth,w,{elevation,
    reveal:{x,z,rx:width*.42,rz:7}, minOpacity:.08});
  floor();
  if (id === 'training-bells') {
    // Four supports sit on the floor. Beams and roof attach at their true height.
    for (const dz of [3.4,-3.4]) {
      for (const dx of [-5.6,5.6]) part(2,dx,dz,0,{height:8.2,radius:.65});
      part(3,0,dz,13.8,{elevation:7.5});
    }
    roof(1,19,8.5,-3.4);
    part(4,0,.7,10.2,{elevation:7.3,pivot:0,minOpacity:.18});
    for (const dx of [-7,7]) part(5,dx,-4,4.5,{ground:true,pivot:.7});
  } else if (id === 'training-3') {
    part(1,0,3.5,11.5);
    part(2,-4.2,-1.8,7.8);
    part(3,5.8,-1.8,6.5);
    roof(4,18.8,6.5,-2.3);
    part(5,-7,-5,6);
  } else if (id === 'villager') {
    part(1,0,3.5,13);
    part(2,-6,-3,0,{height:9,radius:.55});
    part(3,6,-3,0,{height:9,radius:.55});
    roof(4,15,6.8,-3);
    part(5,7,-3.5,5.5);
  } else if (id === 'training-footprints' || id === 'training-thorns') {
    part(1,0,4,8);
    for (const [cell,dx] of [[2,-5],[3,5]]) part(cell,dx,-1,0,{height:7.8,radius:.6});
    roof(4,14,6.6,-1);
    part(5,6.7,-3,4.5,{ground:true,pivot:.7});
  } else if (id === 'training') {
    part(1,0,1,12);
    part(2,-5.4,-1.2,4);
    part(3,5.4,-1.2,4);
    roof(4,14.5,5.2,-1.5);
    part(5,6.8,-3.5,3.2);
  } else if (id === 'boss') {
    part(1,0,4.5,16);
    part(2,-8,-1.5,8);
    part(3,8,-1.5,8);
    roof(4,22,6.8,-1);
    part(5,0,-6.5,19,{ground:true,pivot:.7});
  } else if (id === 'firstpact') {
    part(1,0,2,7.5);
    part(2,-6,0,5.5);part(3,6,0,5.5);
    part(4,0,1.9,7,{elevation:6,pivot:0});
    part(5,7,-3.5,5,{ground:true,pivot:.7});
  } else if (id === 'after-training') {
    part(1,0,2,8);part(2,-6,3,0,{height:13});
    part(3,5,-1.8,3.5);part(4,-5,3,3,{elevation:5,pivot:0});
    part(5,0,-4,12,{ground:true,pivot:.7});
  } else if (id === 'training-2') {
    part(1,0,2,0,{height:7});part(2,1,2,2,{elevation:6,pivot:0});
    part(3,-1.3,1.8,2,{elevation:2.2});part(4,0,1.5,2,{elevation:2.3});
    part(5,3,-1.7,3,{ground:true,pivot:.7});
  } else {
    // Small objects keep their natural scale and leave the centre approach open.
    const s = width / 12;
    part(1,0,2,5*s);
    part(2,-3*s,.5,3*s);
    part(3,3*s,-.3,3*s);
    part(4,1*s,1.5,2.8*s);
    part(5,-2*s,-2,3.5*s,{ground:true,pivot:.7});
  }
  return props;
}

// The actor's screen silhouette must remain readable even behind tall cutouts.
// Ground pieces never use this path. Depth still decides front/back ordering.
export function layerOpacity(prop, player, rect, actor) {
  if (!prop.layered || prop.ground || prop.z > player.z) return 1;
  const inside = prop.reveal && Math.abs(player.x-prop.reveal.x)<prop.reveal.rx
    && Math.abs(player.z-prop.reveal.z)<prop.reveal.rz;
  const overlap = rect.left < actor.right && rect.right > actor.left
    && rect.top < actor.bottom && rect.bottom > actor.top;
  return inside || overlap ? prop.minOpacity ?? .24 : 1;
}
