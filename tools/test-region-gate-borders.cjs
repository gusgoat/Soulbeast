const assert=require('node:assert/strict'),fs=require('node:fs');
const plan=require('../content/country-regions-v5-plan.json'),maps=require('./hemant-walk-demo/country-regions-data.js').countries;
const {shared}=require('./region-gate-placement.cjs'),rows=[];
function distance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);}
for(const [country,c]of Object.entries(maps))for(const [code,d]of Object.entries(c.regions))for(const gate of d.gates){
 const region=plan.countries[country].regions.find(r=>r.code===code),other=plan.countries[gate.targetCountry].regions.find(r=>r.code===gate.targetRegion),edges=shared(region.polygon,other.polygon),o=d.regionOrigin;
 assert(edges.length,'Expected a real shared border');
 const p=[(gate.x-o.pad)/o.scale+o.left,(gate.y-o.topPad)*d.flatten/o.scale+o.top],gap=Math.min(...edges.map(([a,b])=>distance(p,a,b)))*o.scale;
 assert(gap<=200+1e-7,country+code+' gate too far from intended border: '+gate.id+' '+gap);
 const border=gate.borderPosition;assert(Math.min(...edges.map(([a,b])=>distance(border,a,b)))<1e-6,'Gate assigned to wrong border');
 const footGap=Math.hypot(p[0]-border[0],p[1]-border[1])*o.scale;assert(footGap<=200+1e-7,'Doorway slid inland from border');
 rows.push({country,region:code,id:gate.id,borderGap:+gap.toFixed(1),footGap:+footGap.toFixed(1),width:gate.gateWidth});
}
assert.equal(rows.length,46);console.log('PASS all 46 doorways beside their actual shared border (at most 200 projected units)');console.table(rows);
if(process.env.REGION_BORDER_AUDIT_OUTPUT)fs.writeFileSync(process.env.REGION_BORDER_AUDIT_OUTPUT,JSON.stringify({passed:true,maxGap:Math.max(...rows.map(r=>r.borderGap)),gates:rows},null,2));
