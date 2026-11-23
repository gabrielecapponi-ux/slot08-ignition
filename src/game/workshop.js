export const UPGRADE_LIMIT=30;
export const UPGRADE_PRICES=[100,180,280,350,430,520,620,730,850,980,1120,1270,1430,1600,1780,1970,2170,2380,2600,2830,...Array.from({length:10},(_,i)=>3100+300*i)];
export const PARTS=Object.freeze({
 wing:{label:'Alettone',names:['Automatico','Club','Touring','GT3','Doppio piano','Time Attack','Ducktail','Swan Neck','Le Mans','Hillclimb','Ala a delta']},
 wheels:{label:'Cerchi e pneumatici',names:['Automatico','Sei razze','Oro Sport','Multirazza','Endurance','Oro Forged','Turbofan','Disco Aero','Cinque razze','Mesh oro','Track Slick']},
 hood:{label:'Cofano e aspirazione',names:['Automatico','Ventilato','Triple vent','Racing','Ram Air','Supercharger','NACA Twin','Velocity Stacks','V8 esposto','Doppia presa','Endurance scoop']},
 aero:{label:'Kit aerodinamico',names:['Automatico','Street','Club','Widebody','GT','Prototype','Canard','Fender kit','Longtail','Hillclimb','Aero estremo']},
 lights:{label:'Luci',names:['Automatico','Sottoscocca','Due LED','Tre LED','Quattro LED','Rally bar','Fendinebbia','Rally tondi','LED ambra','Light pod','Endurance LED']},
 exhaust:{label:'Scarichi',names:['Automatico','Twin','Twin XL','Quad','Quad XL','Titanium','Laterali','Centrale','Triplo','Uscite alte','Sidewinder']},
});
export const PAINTS=['#c6f568','#ff854e','#8bbcff','#ef6763','#f1cf68','#f0eee2','#293b53','#c1a2ed','#51b5a0','#b7c3cd','#d65eaa','#7b4637','#dd9b65','#337593','#e9aaaf','#6f7856','#96ff00','#ff300a','#00dfff','#ff007c','#ffbe00','#6734ff'];
export const DECALS=['Serie','Doppia striscia','Monostrip','Tricolore','Scacchi','Rally','Lampo','Carbon','GTE Argento','Endurance Fucsia','GT Acqua'];
export const TRIM={glass:[["#30404c","Fumé"],["#486881","Azzurro"],["#5d6952","Verde"]],seat:[["#333e49","Grafite"],["#a83232","Rosso corsa"],["#ae8157","Cuoio"]]};
export const DEFAULT_APPEARANCE=Object.freeze({glass:"#30404c",seat:"#333e49",paint:PAINTS[0],decal:0,wing:0,wheels:0,hood:0,aero:0,lights:0,exhaust:0});
export function sanitizeAppearance(raw={}){const a={...DEFAULT_APPEARANCE};for(const key of ["glass","seat"])if(TRIM[key].some(([color])=>color===raw[key]))a[key]=raw[key];if(PAINTS.includes(raw.paint))a.paint=raw.paint;a.decal=Math.max(0,Math.min(DECALS.length-1,Math.floor(Number(raw.decal)||0)));for(const key of Object.keys(PARTS))a[key]=Math.max(0,Math.min(PARTS[key].names.length-1,Math.floor(Number(raw[key])||0)));return a;}
export function partPrice(variant){return [0,30,60,95,140,200,260,330,410,500,600][variant]??Infinity;}
export function effectiveParts(car){const look=sanitizeAppearance(car.appearance),u=car.upgrades??{};return {...look,hood:look.hood||Math.min(10,Math.ceil((u.motor||0)/2)),exhaust:look.exhaust||Math.min(10,Math.floor((u.motor||0)/2)),wheels:look.wheels||Math.min(10,Math.ceil((u.grip||0)/2)),aero:look.aero||Math.min(10,Math.floor((u.brake||0)/2))};}

export const PART_DETAILS={
 wing:['Segue il modello di serie.','Profilo basso su due supporti.','Ala più larga, terminali arancioni.','Profilo GT con carico visivo più pronunciato.','Due profili sovrapposti.','Ala alta per un look da cronoscalata.','Labbro integrato alla coda.','Supporti curvi sopra il profilo.','Ala sottile e larga con pinna centrale.','Tre profili e grandi derive laterali.','Profilo a freccia, estremità inclinate.'],
 wheels:['Segue i livelli di pneumatici e magneti.','Razze metalliche e pneumatico stradale.','Finitura oro.','Più razze a vista.','Cerchio scuro da endurance.','Cerchio oro e canale maggiorato.','Ventola con pale inclinate.','Disco carenato, bulloni a vista.','Cinque razze larghe.','Rete di razze incrociate oro.','Gomma larga, cerchio nero e bordo colorato.'],
 hood:['Segue i livelli del motore.','Feritoie sulla copertura carbonio.','Tre aperture per il raffreddamento.','Griglia da competizione.','Bocca di aspirazione rialzata.','Presa d’aria voluminosa.','Due condotti incassati.','Sei tromboncini di aspirazione.','Blocco V8 e otto condotti visibili.','Due prese separate.','Presa centrale allungata con griglia.'],
 aero:['Segue i livelli del freno motore.','Splitter e minigonne discreti.','Diffusore più ampio.','Profilo largo da GT.','Minigonne e splitter estesi.','Molte pinne nel diffusore.','Alette ai lati del muso.','Passaruota allargati.','Coda allungata e diffusore profondo.','Splitter con tiranti metallici.','Passaruota, alette e pinne supplementari.'],
 lights:['Fari di serie.','Luce sotto le minigonne.','Due LED sul tetto.','Tre LED sul tetto.','Quattro LED sul tetto.','Barra luminosa sul tetto.','Due proiettori nel paraurti.','Quattro fari tondi da rally.','Luce ambra e LED anteriori.','Pod di quattro proiettori sul cofano.','Sei LED frontali in una carenatura.'],
 exhaust:['Segue i livelli del motore.','Due terminali posteriori.','Doppio terminale allungato.','Quattro scarichi.','Quattro scarichi allungati.','Quattro terminali a vista.','Scarichi ai due lati.','Un grande scarico centrale.','Tre uscite centrali.','Uscite posteriori rialzate.','Collettori esterni lungo le fiancate.'],
};
