// Fractions are relative to the base setup, shared by the garage and race physics.
export const partEffects={
 wheels:[['grip',.005]],wing:[['grip',.006],['drag',.003]],
 hood:[['drive',.0025]],aero:[['drag',-.006]],exhaust:[['speed',.002]]
};
const labels={grip:'tenuta',drag:'resistenza all’aria',drive:'spinta',speed:'velocità massima'};
export function describePart(key,level){
 return (partEffects[key]??[]).map(([stat,rate])=>
  labels[stat]+' '+(rate>=0?'+':'−')+(Math.abs(rate)*level*100).toLocaleString('it-IT',{maximumFractionDigits:2})+'%'
 ).join(' · ');
}
export function applyParts(car){
 const scale={grip:1,drag:1,drive:1,speed:1};
 for(const [key,effects] of Object.entries(partEffects)){
  const level=Math.min(10,Math.max(0,Number(car.appearance?.[key])||0));
  for(const [stat,rate] of effects)scale[stat]+=rate*level;
 }
 car.maxGrip*=scale.grip;car.setup.aerodynamicDrag*=scale.drag;
 car.setup.motorForce*=scale.drive;car.setup.maxSpeed*=scale.speed;
}
