// Only this server path changes gameplay positions. Broadcasts are visual hints.
export function movePartyMember(room, member, packet, now, navigation, speed) {
 if(packet.floor!==room.floor)throw Error('movement_wrong_floor');
 if(!Number.isSafeInteger(packet.seq)||packet.seq<1||!Array.isArray(packet.path)||packet.path.length>16||
  packet.path.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>20000||Math.abs(p.y)>20000)||
  !Number.isFinite(speed)||speed<=0||speed>2000)throw Error('bad_movement');
 const prior=member.movement||{seq:0,at:now};
 if(packet.seq<=prior.seq)return {position:{...member.position},seq:prior.seq};
 if(member.hp<=0)throw Error('player_defeated');
 if(member.exploring!==true||Object.values(room.battles||{}).some(b=>b.status==='active'&&b.participants?.includes(member.code)))throw Error('already_fighting');
 // Cover delayed packets without letting idle clients bank unlimited distance.
 const previousTime=Number.isFinite(prior.at)?prior.at:now;
 const acceptedTime=Math.max(now,previousTime);
 let budget=speed*Math.min(1,(acceptedTime-previousTime)/1000);
 let position={...member.position};
 for(const target of packet.path){
  const distance=navigation.distance(position,target);
  if(!Number.isFinite(distance))throw Error('bad_movement');
  if(distance<.001)continue;
  const portion=Math.min(1,budget/distance);
  const next={x:position.x+(target.x-position.x)*portion,y:position.y+(target.y-position.y)*portion};
  if(!navigation.clear(position,next))break;
  position=next;budget-=distance*portion;if(portion<1||budget<=0)break;
 }
 member.position=position;member.movement={seq:packet.seq,at:acceptedTime};
 return {position:{...position},seq:packet.seq};
}
