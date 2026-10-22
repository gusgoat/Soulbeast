// Apply only appearance metadata to a freshly downloaded API source.
const fs=require('fs');
function patch(source){
 const replacements=[
  ["'คะแนนสะสม', 'รูปโปรไฟล์'];", "'คะแนนสะสม', 'รูปโปรไฟล์', 'gender'];"],
  ["profile:profileImage_(r[14])", "profile:profileImage_(r[14]),gender:['male','female'].includes(r[15])?r[15]:undefined"],
  ["profileImage_(d.profile)];", "profileImage_(d.profile),['male','female'].includes(d.gender)?d.gender:''];"],
  ["return communityLeaderboardBase(d);", "return communityLeaderboardBase({...d,gender:auth.P.gender});"],
  ["img:'player',cls:P.cls})", "img:'player',cls:P.cls,gender:['male','female'].includes(P.gender)?P.gender:undefined})"],
  ["const COMMUNITY_DIRECTORY=['publicId','code','name','level','class','avatar','lastSave'];", "const COMMUNITY_DIRECTORY=['publicId','code','name','level','class','avatar','lastSave','gender'];"],
  ["profileImage_(P.profile),Date.now()];if(i<0)sh.appendRow(v)", "profileImage_(P.profile),Date.now(),['male','female'].includes(P.gender)?P.gender:''];if(i<0)sh.appendRow(v)"],
  ["avatar:profileImage_(r[5]),lastSave:Number(r[6])||0,online:", "avatar:profileImage_(r[5]),gender:['male','female'].includes(r[7])?r[7]:undefined,lastSave:Number(r[6])||0,online:"],
  ["avatar:p?.avatar||'',lastOnline:", "avatar:p?.avatar||'',gender:p?.gender,lastOnline:"],
  ["combatRules:4,...data", "combatRules:4,genderVersion:1,...data"],
  ["{ apiVersion: API_VERSION, mistVersion:", "{ apiVersion: API_VERSION, genderVersion: 1, mistVersion:"]
 ];
 for(const [from,to]of replacements){if(source.split(from).length!==2)throw Error('Expected exactly one API target: '+from);source=source.replace(from,to);}
 return source;
}
module.exports=patch;
if(require.main===module){if(!process.argv[2]||!process.argv[3])throw Error('Provide baseline source and output path');fs.writeFileSync(process.argv[3],patch(fs.readFileSync(process.argv[2],'utf8')));console.log('Prepared appearance metadata patch; no combat rules or player balances changed');}
