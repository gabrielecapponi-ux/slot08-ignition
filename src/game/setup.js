import { PHYSICS } from '../core/config.js';
export const DIFFICULTIES={rookie:{label:'Rookie',grip:1.25,pace:.79},club:{label:'Club',grip:1,pace:.88},pro:{label:'Pro',grip:.86,pace:.94}};
export function carSetup(difficulty='rookie',upgrades={}){const d=DIFFICULTIES[difficulty]||DIFFICULTIES.rookie;return{...PHYSICS,motorForce:PHYSICS.motorForce*(1+.10*(upgrades.motor||0)),maxSpeed:PHYSICS.maxSpeed*(1+.07*(upgrades.motor||0)),gripForce:PHYSICS.gripForce*d.grip*(1+.10*(upgrades.grip||0)),engineBrake:PHYSICS.engineBrake*(1+.15*(upgrades.brake||0))};}
