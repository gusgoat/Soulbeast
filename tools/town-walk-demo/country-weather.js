(function(scope){'use strict';
function draw(c,width,height,time,id,compact){
 // The town scene has its own winter layer. Country maps pass a detail mode.
 if(id==='blue'&&compact===undefined)return;
 c.save();
 if(id==='blue'){
  c.fillStyle='#ffffffb0';
  for(let i=0;i<(compact?25:45);i++){
   const x=(i*97+time*(14+i%4*3))%(width+20)-10;
   const y=(i*61+time*(20+i%5*4))%(height+20)-10;
   const radius=i%3?1.2:2;
   c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();
  }
 }else if(id==='green'){
  for(let i=0;i<(compact?10:16);i++){
   const x=(i*173+time*(8+i%3)*2)%(width+60)-30+Math.sin(time*.7+i)*18;
   const y=(i*97+Math.sin(time*.45+i*2)*50+50)%(height+60)-20;
   const flap=.25+Math.abs(Math.sin(time*8+i));
   c.save();c.translate(x,y);c.rotate(Math.sin(time*.6+i)*.4);
   c.fillStyle=['#f2c561dd','#77b4f2dd','#d38bd2dd'][i%3];
   c.beginPath();c.ellipse(-2*flap,0,3.5*flap,2,-.4,0,Math.PI*2);c.fill();
   c.beginPath();c.ellipse(2*flap,0,3.5*flap,2,.4,0,Math.PI*2);c.fill();
   c.fillStyle='#354536';c.fillRect(-.5,-2,1,4);c.restore();
  }
 }else{
  for(let i=0;i<(compact?26:50);i++){
   const x=(i*113+time*(10+i%7))%(width+30)-15+Math.sin(time*.3+i)*6;
   const y=(i*83+time*(8+i%9))%(height+30)-15;
   c.fillStyle=i%5===0?'#8a4e3299':'#17141788';c.beginPath();
   c.ellipse(x,y,i%3===0?1.8:.8,i%3===0?1:.6,time+i,0,Math.PI*2);c.fill();
  }
 }
 c.restore();
}
scope.countryWeather={draw};if(typeof module!=='undefined')module.exports={draw};
})(typeof window==='undefined'?globalThis:window);
