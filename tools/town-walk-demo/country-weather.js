(function(scope){'use strict';
function draw(c,width,height,time,id){
 if(id==='blue')return;
 c.save();
 if(id==='green')for(let i=0;i<16;i++){
  const x=(i*173+time*(8+i%3)*2)%(width+60)-30+Math.sin(time*.7+i)*18,y=(i*97+Math.sin(time*.45+i*2)*50)%(height+60),flap=.25+Math.abs(Math.sin(time*8+i));
  c.save();c.translate(x,y);c.rotate(Math.sin(time*.6+i)*.4);c.fillStyle=['#f2c561bb','#77b4f2bb','#d38bd2bb'][i%3];c.beginPath();c.ellipse(-2*flap,0,3.5*flap,2, -.4,0,Math.PI*2);c.ellipse(2*flap,0,3.5*flap,2,.4,0,Math.PI*2);c.fill();c.fillStyle='#354536';c.fillRect(-.5,-2,1,4);c.restore();
 }else for(let i=0;i<50;i++){
  const x=(i*113+time*(10+i%7))%(width+30)-15+Math.sin(time*.3+i)*6,y=(i*83+time*(8+i%9))%(height+30)-15;c.fillStyle=i%5===0?'#8a4e3299':'#17141788';c.beginPath();c.ellipse(x,y,i%3===0?1.8:.8,i%3===0?1:.6,time+i,0,Math.PI*2);c.fill();
 }c.restore();
}
scope.countryWeather={draw};if(typeof module!=='undefined')module.exports={draw};
})(typeof window==='undefined'?globalThis:window);
