// A four-pick 2/2 twill. Rounded tows alternate which bundle passes over the other.
export function carbonTow(x,y){
  const u=x/8,v=y/8;
  const warp=((Math.floor(u)-Math.floor(v)+64)%4)<2;
  const across=warp?u:v,along=warp?v:u;
  const crown=Math.sin(Math.PI*(across-Math.floor(across)))**.65;
  const filaments=Math.cos(2*Math.PI*across*3);
  return -22+34*crown+5*crown*filaments+5*Math.sin(along*Math.PI/2)*crown;
}
// Zinc shoulders and a folded lip frame the painted retroreflective insert.
export function barrierPixel(x,y){
  const panel=x>56&&x<190&&y>43&&y<207,stripe=(x+Math.round(y*.28))%64<28;
  const grain=3*Math.cos(y*2*Math.PI*51/256)+2*Math.sin((x+3*y)*2*Math.PI/256);
  if(panel)return stripe?[241+grain,188+grain,37+grain]:[34+grain,39+grain,42+grain];
  const lip=10*Math.cos(2*Math.PI*y/64);
  return [135+grain+lip,149+grain+lip,155+grain+lip];
}
