(function(g){'use strict';
const colors={blue:'11,22,54',green:'10,25,42',red:'28,18,42',dungeon:'11,15,38'};
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function at(now){
 const time=g.SoulBeastClock.at(now),{hour}=time;
 const night=hour<12?1-smooth((hour-5)/2):smooth((hour-17)/2);
 const twilight=hour<12?Math.max(0,1-Math.abs(hour-6)):Math.max(0,1-Math.abs(hour-18));
 return {...time,night,twilight};
}
function create(country){
 let veil,veilCtx;
 function draw(c,w,h,light,openings){
  if(light.twilight>.005){c.fillStyle='rgba(255,167,97,'+(light.twilight*(country==='dungeon'?.06:.13))+')';c.fillRect(0,0,w,h);}
  if(light.night<=.005)return;
  const shade='rgba('+(colors[country]||colors.blue)+','+(light.night*(country==='dungeon'?.34:.58))+')';
  if(!openings){c.fillStyle=shade;c.fillRect(0,0,w,h);return;}
  if(!veil){veil=g.document.createElement('canvas');veilCtx=veil.getContext('2d');}
  const vw=Math.max(1,Math.ceil(w/3)),vh=Math.max(1,Math.ceil(h/3));
  if(veil.width!==vw||veil.height!==vh){veil.width=vw;veil.height=vh;}
  veilCtx.setTransform(1,0,0,1,0,0);
  veilCtx.globalCompositeOperation='source-over';
  veilCtx.clearRect(0,0,vw,vh);veilCtx.fillStyle=shade;veilCtx.fillRect(0,0,vw,vh);
  veilCtx.globalCompositeOperation='destination-out';
  veilCtx.setTransform(vw/w,0,0,vh/h,0,0);openings(veilCtx);
  c.drawImage(veil,0,0,w,h);
 }
 return {draw};
}
g.CountryDaylight={at,create};
})(window);
