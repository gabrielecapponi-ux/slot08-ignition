// Part names are shared by the Blender kit and the procedural powertrain.
const hardware={motor:/Cassa motore|Avvolgimento|Dissipatore|Aletta dissipatore/,grip:/Magnete di trazione/,brake:/Scheda freno|Contatto freno|Pinza/};
export function installedGroup(node){
  for(let n=node;n;n=n.parent){
    const kit=/^PART_(wheels|hood|wing|lights|exhaust|aero)_/.exec(n.name);
    if(kit)return kit[1];
    for(const [key,pattern] of Object.entries(hardware))if(pattern.test(n.name))return key;
  }
  return '';
}
export function fittingOffset(key,elapsed){
  const t=Math.max(0,Math.min(1,elapsed/850)),ease=(1-t)**3;
  return ease*(key==='brake'||key==='motor'||key==='grip'?-.048:.065);
}
