// Advanced classes inherit equipment from their parent in the game catalog.
module.exports=function classWeapon(classes,cls){
 const seen=new Set();
 while(cls&&!seen.has(cls)){seen.add(cls);const c=classes[cls];if(!c)return null;if(c.w)return c.w;cls=c.p;}
 return null;
};
