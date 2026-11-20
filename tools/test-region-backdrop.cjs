const assert=require('node:assert/strict'),maps=require('./hemant-walk-demo/country-regions-data.js').countries,B=require('./hemant-walk-demo/region-backdrop.js'),C=require('./hemant-walk-demo/region-coast.js'),T=require('./hemant-walk-demo/terrain.js');
let count=0;
for(const [id,c]of Object.entries(maps))for(const [code,d]of Object.entries(c.regions)){
 assert.equal(d.worldMainlands.length,3);const ranges=B.plan(d),coast=C.segments(d);assert(ranges.length>0,id+code+' empty backdrop');
 for(const r of ranges){assert(B.onLand(d,r.x,r.y));assert(!T.inside(r.x,r.y,d.regionPolygon));assert(!coast.some(e=>e.a===d.regionPolygon[r.edge]&&e.b===d.regionPolygon[(r.edge+1)%d.regionPolygon.length]),id+code+' range on beach');
  for(const g of d.gates){const dx=r.x-g.x,dy=(r.y-g.y)*d.flatten,ix=g.inward.x,iy=g.inward.y*d.flatten,along=-(dx*ix+dy*iy),side=Math.abs(dx*iy-dy*ix);assert(Math.hypot(dx,dy)>=220);assert(!(along> -80&&along<850&&side<175),id+code+' background closes doorway approach');}
 }
 count+=ranges.length;
}
console.log('PASS '+count+' cached background ranges across 12 regions, on world land outside playable areas, with coast and gate approaches clear');
