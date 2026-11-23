import { EnduranceTrack } from './endurance.js';
import { stuntBase } from './stunts.js';

// Each number is the lateral position of a bend on the return leg.
// A capital letter adds a square hairpin; lowercase makes a diagonal chicane.
const layouts=[
 ['Radice inversa','4A2c6','loop'],['Ponte delle lucciole','a53B','cross'],['Denti di felce','B2C4a','hairpin'],['Canopia','5c2A4','up'],['Salto del larice','2B56c','jump'],
 ['Marea lunga','6a24C','long'],['Molo incrociato','3B6c1','cross'],['Salsedine','A4b65','down'],['Frangiflutti','c3A6B','hairpin'],['Doppia orbita','6B3a1','double'],
 ['Cava rossa','B5a32','down'],['Serpe di rame','2a4c6B','hairpin'],['Cresta spezzata','5B1c4','jump'],['Taglio di faglia','4bA61','cross'],['Forno solare','C61b3','up'],
 ['Passo del prisma','6B2a5','up'],['Ago di ghiaccio','A4C2b6','hairpin'],['Sotto il seracco','5cB32','cross'],['Cornice bianca','1a6B4','long'],['Salto del rifugio','4C1b6','jump'],
 ['Gru di mezzanotte','2cA53','cross'],['Bacino secco','6aC4B','hairpin'],['Argano','A31c6','up'],['Scalo nove','B6c14','loop'],['Boa di ritorno','3b5C2','down'],
 ['Circuito a impulsi','C1b6A','double'],['Rampa UV','3A6b2','jump'],['Nodo laser','6cB41','cross'],['Sincopata','aC4B26','hairpin'],['Corona al neon','2B6a4','long'],
 ['Promontorio','5aB26','long'],['Cala sommersa','C24a5','down'],['Ago del faro','2c6B1','cross'],['Tre risacche','A6b1C4','hairpin'],['Salto di marea','4bC52','jump'],
 ['Elica madre','B1c46','up'],['Pozzo viola','5a2C6','down'],['Controfase','b6A35','double'],['Cavatappi','C5a2B','cross'],['Doppio apice','6B1cA3','hairpin'],
 ['Arco sospeso','A26c5','cross'],['Viadotto Est','2aC54','jump'],['Ritorno a destra','C4b16','cross'],['Balcone orbitale','6c3A2','long'],['Scala di Orione','B2a6C','up'],
 ['Corona interna','c4A62','loop'],['Pendolo solare','B6a4C2','hairpin'],['Eclisse','3C2b5','down'],['Transito radente','a2B65','cross'],['Ultima parabola','6A3cB5','double']
];
layouts.push(
  ["Sentiero delle felci", "b1253a", "long"],
  ["Trincea del muschio", "64C3acB", "up"],
  ["Ramo sospeso", "C4Ca12", "hairpin"],
  ["Tornante del gufo", "C12c54b", "cross"],
  ["Anello della radura", "6514a2", "jump"],
  ["Porta del sale", "562A3b4", "loop"],
  ["Approdo corallo", "114Ca5", "double"],
  ["Onda di ritorno", "4cA1A1B", "long"],
  ["Gorgo blu", "A6B1a2", "up"],
  ["Faro gemello", "bBa1A64", "hairpin"],
  ["Dorso di basalto", "abA465", "jump"],
  ["Ponte delle cave", "43cbB1A", "down"],
  ["Cresta di rame", "C5234A", "loop"],
  ["Forra ocra", "1b1A413", "double"],
  ["Pietra rovescia", "6ba453", "long"],
  ["Passo del corvo", "6cA5a4B", "hairpin"],
  ["Cengia di vetro", "Cc5B12", "cross"],
  ["Galleria glaciale", "C3b4A6b", "jump"],
  ["Croce di neve", "b2B5A4", "down"],
  ["Cresta nord", "C3cb42a", "loop"],
  ["Argine delle gru", "C43aB1", "long"],
  ["Corridoio container", "C62B51c", "up"],
  ["Molo dei cavi", "C5ab62", "hairpin"],
  ["Bacino numero tre", "154c3Ca", "cross"],
  ["Dogana alta", "A5Bc1C", "jump"],
  ["Sottovia laser", "65B24A3", "loop"],
  ["Reticolo viola", "53BbA4", "double"],
  ["Slalom ionico", "cB2A61b", "long"],
  ["Bifora elettrica", "6aB532", "up"],
  ["Arco di mercurio", "33144C5", "hairpin"],
  ["Bocca del faro", "Abb5C5", "jump"],
  ["Tuffo pelagico", "21A65ac", "down"],
  ["Baia delle ancore", "aA2CbB", "loop"],
  ["Risacca stretta", "54abBc2", "double"],
  ["Promontorio ovest", "42a65A", "long"],
  ["Spira doppia", "623aCcb", "hairpin"],
  ["Pendio cobalto", "AaBcb4", "cross"],
  ["Gradino elicoidale", "Bb214C6", "jump"],
  ["Volta di quarzo", "4AcC1b", "down"],
  ["Chiocciola alta", "b5326B1", "loop"],
  ["Pilastri sospesi", "25CbB3", "long"],
  ["Ansa del viadotto", "caC21A3", "up"],
  ["Torre di strallo", "35CcaA", "hairpin"],
  ["Rampa dei tiranti", "156A4cB", "cross"],
  ["Sotto le campate", "3cB6Ca", "jump"],
  ["Zenit rosso", "1A4C6Bb", "loop"],
  ["Frontiera orbitale", "6B2b34", "double"],
  ["Anello di plasma", "4B5aA2c", "long"],
  ["Croce dei pianeti", "A1C42a", "up"],
  ["Orbita finale", "A2B1baC", "hairpin"]
);
const features={loop:'Loop verticale e ritorno tecnico',double:'Doppia inversione e tornanti',up:'Avvitamento in salita',down:'Avvitamento in discesa',long:'Parabolica a raggio lungo',cross:'Scavalco, sottopasso e uscita a destra',hairpin:'Chicane ravvicinate e curve a gomito',jump:'Salto sul rettilineo · minimo 155 km/h'};
export const courseName=id=>layouts[id][0];
export const courseFeature=id=>features[layouts[id][2]];
export const courseRevision=id=>[2,11,21,38,46].includes(id)?23:21;
export function championshipBase(id){
  const [,code,kind]=layouts[id],world=Math.floor(id%50/5),cross=kind==='cross';
  const step=10+(id%3)+(id>=50?1.5:0),w=(code.length+2)*step,h=12+world*.36;
  const points=[[0,0],[w,0],[w+3,h],[w-step*.5,h+3]];
  for(const [i,k] of [...code].entries()){
    const x=w-(i+1.5)*step;
    if(cross && i===1){points.push([x,h],[x,-9]);continue;}
    const side=cross&&i>1?-1:1;
    if(/[A-C]/.test(k)){
      const depth=4+(k.charCodeAt(0)-65)*1.4;
      points.push([x+step*.4,side*(h+2)],[x+step*.4,side*depth],[x-step*.35,side*depth]);
    }else points.push([x,side*(/[a-c]/.test(k)?5+(k.charCodeAt(0)-97)*2:7+Number(k)*1.8)]);
  }
  points.push([0,cross?-h:h]);
  // Vary the outbound half as well as the technical return. Keep a launch straight
  // clear for the grid, forks, loops and jump.
  const endPoint=points[1];
  if(kind==='long'){endPoint[0]+=15;points[2]=[w-1,h+9];points[3]=[w-step*.5,h+5];}
  if(!cross){
    const x=w*.46,d=5+(id%5)*1.25;
    const approaches=[
      [[x,0],[x+7,-d],[w-9,-d]],
      [[x,0],[x+4,-d],[x+8,-d],[x+11,.7],[w-7,.7]],
      [[x,0],[x+4,-d],[w-12,-d*1.8],[w-3,-d]],
      [[x,0],[x+9,-d*.7],[w-8,-d*1.5]],
      [[x,0],[x+7,-d],[w-10,-d],[w-6,-d*.4]]
    ];
    points.splice(1,0,...approaches[id%5]);
  }
  const apex=points.indexOf(endPoint);
  const radius=points.map((_,i)=>i===apex?(kind==='long'?9:4):i===apex+1?4.5:2);
  const base=['loop','double'].includes(kind)?stuntBase({points,turnRadius:radius,radius:1.28+world*.025,loops:kind==='double'?2:1}):new EnduranceTrack({points,radius});
  if(kind==='jump')base.jump={start:12,length:1.25,minSpeed:155/64.8};
  const spiral=['up','down'].includes(kind),arc=base.segments[(apex-1)*2+1];
  if(spiral){
    arc.length+=2*Math.PI*arc.radius;base.spiral=arc;base.length=0;
    for(const seg of base.segments){seg.start=base.length;base.length+=seg.length;}
    base.switches=base.segments.filter(s=>s.type==='line'&&s.length>6).map((s,id)=>({id,start:s.start+.7,activationEnd:s.start+1.2,end:s.start+3.9}));
  }
  const flat=base.sample.bind(base);
  if(spiral||cross||base.jump)base.sample=distance=>{
    const p=flat(distance);let z=0;
    if(spiral){
      const end=arc.start+arc.length,lift=2.6;
      if(p.s>=arc.start&&p.s<=end)z=lift*(p.s-arc.start)/arc.length;
      if(p.s>end)z=lift*(1-(p.s-end)/(base.length-end));
      if(kind==='down')z=lift-z;
    }else if(cross&&p.section===0){
      const mid=w-2.5*step,delta=(p.x-mid)/13;
      if(Math.abs(delta)<1)z=2.2*Math.cos(Math.PI*delta/2)**2;
    }else if(base.jump){
      const d=p.s-base.jump.start;
      if(d>=-3&&d<0)z=.34*(1+d/3)**2;
      else if(d>=0&&d<=base.jump.length)z=.34;
      else if(d>base.jump.length&&d<base.jump.length+3)z=.34*(1-(d-base.jump.length)/3)**2;
    }
    return {...p,z,bridge:z>.08};
  };
  // A raised axial roll on the long launch straight. Entrance and exit have zero slope.
  if([2,11,21,38,46].includes(id)){
    const sample=base.sample.bind(base),start=6,span=14;
    base.rollZone={start,end:start+span,span,radius:1.2,axial:true};
    base.sample=distance=>{
      const p=sample(distance),u=(p.s-start)/span;
      if(u<=0||u>=1)return p;
      const t=u*u*(3-2*u),roll=(id%2?1:-1)*2*Math.PI*t;
      return {...p,z:p.z+1.42*Math.sin(Math.PI*u)**2,stuntRoll:roll,bridge:true};
    };
  }
  return base;
}
