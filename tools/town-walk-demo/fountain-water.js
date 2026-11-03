(()=>{'use strict';
// Coordinates follow the water surfaces in fountain-v1.png.webp; stone stays still.
window.drawFountainWater=function(c,x,y,w,h,time){
c.save();c.translate(x,y);c.scale(w,h);c.globalCompositeOperation='screen';
const falls=[
 [.374,.322,.357,.437],[.622,.324,.642,.441],
 [.302,.482,.291,.634],[.698,.484,.713,.638],
 [.419,.505,.404,.664],[.584,.507,.603,.663]
];
for(let i=0;i<falls.length;i++){
 const [a,b,d,e]=falls[i],sway=Math.sin(time*2.3+i)*.002;
 c.lineCap='round';c.strokeStyle='#a7efff55';c.lineWidth=.012;
 c.beginPath();c.moveTo(a,b);c.quadraticCurveTo(d+sway,b+.04,d+sway,e);c.stroke();
 c.strokeStyle='#ecffffc0';c.lineWidth=.003;c.setLineDash([.012,.018]);c.lineDashOffset=-time*.19-i*.017;c.stroke();c.setLineDash([]);
 for(let n=0;n<4;n++){
  const k=(time*.9+n*.25+i*.13)%1,px=a+(d-a)*k+sway*k,py=b+(e-b)*k;
  c.fillStyle='rgba(232,255,255,'+(.25+.5*Math.sin(k*Math.PI))+')';c.beginPath();c.ellipse(px,py,.0025,.006,0,0,Math.PI*2);c.fill();
 }
 // Small expanding splash rings where each stream meets the next basin.
 for(let n=0;n<2;n++){const k=(time*.8+n*.5+i*.16)%1;c.strokeStyle='rgba(213,255,255,'+((1-k)*.5)+')';c.lineWidth=.0014;c.beginPath();c.ellipse(d,e,.005+k*.017,.002+k*.006,0,0,Math.PI*2);c.stroke()}
}
for(const [cx,cy,rx,ry,offset]of [[.5,.307,.115,.027,0],[.5,.465,.175,.047,1],[.5,.665,.305,.087,2]]){
 c.save();c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);c.clip();
 for(let n=0;n<7;n++){
  const k=(time*.18+n/7+offset*.12)%1,py=cy-ry+k*ry*2;
  c.strokeStyle='rgba(196,251,255,'+(.08+.2*Math.sin(k*Math.PI))+')';c.lineWidth=.0018;
  c.beginPath();for(let j=0;j<=24;j++){const px=cx-rx+j/24*rx*2,yy=py+Math.sin(j*.65+time*2.8+n)*.003;j?c.lineTo(px,yy):c.moveTo(px,yy)}c.stroke();
 }
 for(let i=0;i<9;i++){const px=cx+Math.sin(i*2.4+offset)*rx*.8,py=cy+Math.cos(i*1.9)*ry*.7,alpha=Math.max(0,Math.sin(time*3.2+i*1.7))*.6;c.fillStyle='rgba(235,255,255,'+alpha+')';c.beginPath();c.ellipse(px,py,.0027,.0018,0,0,7);c.fill()}
 c.restore();
}
c.restore();
};
window.drawHospitalWater=function(c,x,y,w,h,time){
 c.save();c.translate(x,y);c.scale(w,h);c.globalCompositeOperation='screen';c.lineCap='round';
 for(const [a,b,d,e]of [[.306,.694,.293,.772],[.334,.7,.325,.774],[.736,.701,.751,.79],[.766,.708,.782,.797]]){
  c.beginPath();c.moveTo(a,b);c.quadraticCurveTo(d,b+.035,d,e);c.strokeStyle='#aaf1ff55';c.lineWidth=.012;c.stroke();c.strokeStyle='#efffffc0';c.lineWidth=.0028;c.setLineDash([.009,.013]);c.lineDashOffset=-time*.18;c.stroke();c.setLineDash([]);
  const k=(time*.9+a)%1;c.strokeStyle='rgba(220,255,255,'+((1-k)*.6)+')';c.lineWidth=.0018;c.beginPath();c.ellipse(d,e,.004+k*.019,.002+k*.006,0,0,7);c.stroke();
 }
 for(const [cx,cy,rx,ry]of [[.275,.827,.108,.038],[.747,.851,.13,.045]]){
  c.save();c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,7);c.clip();
  for(let i=0;i<6;i++){const k=(time*.25+i/6)%1;c.lineWidth=.0018;c.strokeStyle='rgba(214,255,255,'+((1-k)*.4)+')';c.beginPath();c.ellipse(cx,cy,rx*k,ry*k,0,0,7);c.stroke()}
  c.restore();
 }
 c.restore();
};
})();
