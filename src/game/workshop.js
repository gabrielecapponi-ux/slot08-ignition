export const UPGRADE_LIMIT=12;
export const UPGRADE_PRICES=[100,180,280,350,430,520,620,730,850,980,1120,1270];
export const PARTS=Object.freeze({
 wing:{label:'Alettone',names:['Automatico','Club','Touring','GT3','Doppio piano','Time Attack']},
 wheels:{label:'Cerchi e pneumatici',names:['Automatico','Sei razze','Oro Sport','Multirazza','Endurance','Oro Forged']},
 hood:{label:'Cofano e aspirazione',names:['Automatico','Ventilato','Triple vent','Racing','Ram Air','Supercharger']},
 aero:{label:'Kit aerodinamico',names:['Automatico','Street','Club','Widebody','GT','Prototype']},
 lights:{label:'Luci',names:['Automatico','Sottoscocca','Due LED','Tre LED','Quattro LED','Rally bar']},
 exhaust:{label:'Scarichi',names:['Automatico','Twin','Twin XL','Quad','Quad XL','Titanium']},
});
export const PAINTS=['#c6f568','#ff854e','#8bbcff','#ef6763','#f1cf68','#f0eee2','#293b53','#c1a2ed','#51b5a0','#b7c3cd','#d65eaa','#7b4637','#dd9b65','#337593','#e9aaaf','#6f7856'];
export const DECALS=['Serie','Doppia striscia','Monostrip','Tricolore','Scacchi','Rally','Lampo','Carbon'];
export const DEFAULT_APPEARANCE=Object.freeze({paint:PAINTS[0],decal:0,wing:0,wheels:0,hood:0,aero:0,lights:0,exhaust:0});
export function sanitizeAppearance(raw={}){const a={...DEFAULT_APPEARANCE};if(PAINTS.includes(raw.paint))a.paint=raw.paint;a.decal=Math.max(0,Math.min(7,Math.floor(Number(raw.decal)||0)));for(const key of Object.keys(PARTS))a[key]=Math.max(0,Math.min(5,Math.floor(Number(raw[key])||0)));return a;}
export function partPrice(variant){return [0,30,60,95,140,200][variant]??Infinity;}
export function effectiveParts(car){const look=sanitizeAppearance(car.appearance),u=car.upgrades??{};return {...look,hood:look.hood||Math.min(4,Math.ceil((u.motor||0)/3)),exhaust:look.exhaust||Math.min(4,Math.floor((u.motor||0)/3)),wheels:look.wheels||Math.min(4,Math.ceil((u.grip||0)/3)),aero:look.aero||Math.min(4,Math.floor((u.brake||0)/3))};}
