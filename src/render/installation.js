// Part names are shared by the Blender kit and the procedural powertrain.
const hardware={brush:/Treccia in rame/,gearing:/Corona dentata|Dente corona/,diffuser:/Deriva fondo/,motor:/Cassa motore|Avvolgimento|Dissipatore|Aletta dissipatore/,grip:/Magnete di trazione/,brake:/Scheda freno|Contatto freno|Pinza/};
export function installedGroup(node){
  for(let n=node;n;n=n.parent){
    const kit=/^PART_(wheels|hood|wing|lights|exhaust|aero)_/.exec(n.name);
    if(kit)return kit[1];
    for(const [key,pattern] of Object.entries(hardware))if(pattern.test(n.name))return key;
  }
  return '';
}
export function mechanicalView(key){return Object.hasOwn(hardware,key);}
export function inspectionShell(name,material){
  return /^(MAT_lime_enamel|MAT_smoked_glass)/.test(material)||name==='Piastra telaio';
}

// Travel in car-local metres. Side assemblies enter from the matching wheel arch.
const travel={
  motor:[-.026,-.070,.032],grip:[0,-.055,0],brake:[.014,-.052,.035],
  brush:[.063,-.037,0],gearing:[-.014,-.027,.073],diffuser:[-.082,-.033,0],
  wing:[-.043,.087,0],hood:[.053,.083,0],wheels:[0,.012,.088],
  aero:[-.028,-.017,.064],lights:[.070,.022,0],exhaust:[-.082,-.019,0]
};
export function fittingTravel(key,elapsed){
 const v=travel[key];if(!v)return [0,0,0];
 const t=Math.max(0,Math.min(1,(elapsed-180)/1020));
 const ease=1-t*t*(3-2*t);
 return [v[0]*ease,v[1]*ease+.009*Math.sin(Math.PI*t)*ease,v[2]*ease];
}
