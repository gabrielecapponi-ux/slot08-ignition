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
 // Enter on the service axis, align on the guide, then seat the last millimetres.
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const approach=1-smooth(t/.64),seat=1-smooth((t-.64)/.36);
 const ease=.86*approach+.14*seat;
 const guide=4*t*(1-t)*approach;
 const transverse=['wheels','gearing','brush','aero'].includes(key);
 const lift=['hood','wing','lights'].includes(key);
 const align=transverse?.012:lift?.019:.009;
 return [v[0]*ease+(transverse?align*guide:0),v[1]*ease+align*guide,v[2]*(transverse?(.72*approach+.28*seat):ease)];
}
