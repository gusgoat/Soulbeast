const fs=require('fs');
const file='content/country-war-map-v1.json',map=JSON.parse(fs.readFileSync(file,'utf8'));
for(const c of map.countries)c.flag='assets/ui/country-war/flag-'+c.id+'-v1.webp';
for(const n of map.nodes){
 const city=n.type==='city'?n:map.nodes.find(c=>c.type==='city'&&map.edges.some(e=>e.a===n.id&&e.b===c.id||e.b===n.id&&e.a===c.id));
 const group=city?.number||0;
 n.terrain=n.country==='blue'?'snow':n.country==='green'?(group===4?'coast':group===1||group===3?'mountain':'forest'):(group===4?'coast':'volcano');
 n.dailyGold=n.type==='city'?100:n.type==='village'?10:0;
}
fs.writeFileSync(file,JSON.stringify(map,null,2)+'\n');
const runtime='runtime/countryWar.js';let s=fs.readFileSync(runtime,'utf8');
const client={...map,nodes:map.nodes.map(({id,type,country,placeName,x,y,number,terrain})=>({id,type,country,placeName,x,y,number,terrain}))};
s=s.replace(/const COUNTRY_WAR_MAP=.*?;\r?\nconst COUNTRY_WAR=/s,'const COUNTRY_WAR_MAP='+JSON.stringify(client)+';\nconst COUNTRY_WAR=');
fs.writeFileSync(runtime,s);
