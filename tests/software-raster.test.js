import test from 'node:test';
import assert from 'node:assert/strict';
import {rasterizeTriangles} from '../src/render/software-raster.js';
const image=()=>({width:8,height:8,data:new Uint8ClampedArray(8*8*4)});
const points=[{x:0,y:0,z:.8},{x:8,y:0,z:.2},{x:0,y:8,z:.8},{x:0,y:0,z:.4},{x:8,y:0,z:.7},{x:0,y:8,z:.4}];
const faces=[{ia:0,ib:1,ic:2,opacity:1,shade:'#ff0000',depth:1.8},{ia:3,ib:4,ic:5,opacity:1,shade:'#0000ff',depth:1.5}];
const pixel=(im,x,y)=>Array.from(im.data.slice((y*8+x)*4,(y*8+x)*4+4));
test('intersecting car surfaces occlude per pixel, independent of triangle draw order',()=>{
 const a=rasterizeTriangles(image(),points,faces),b=rasterizeTriangles(image(),points,[...faces].reverse());
 assert.deepEqual(a.data,b.data);assert.deepEqual(pixel(a,1,1),[0,0,255,255]);assert.deepEqual(pixel(a,5,1),[255,0,0,255]);
});
test('glass behind bodywork stays hidden; glass in front blends with the body',()=>{
 const points=[{x:0,y:0,z:.5},{x:8,y:0,z:.5},{x:0,y:8,z:.5},{x:0,y:0,z:.8},{x:8,y:0,z:.8},{x:0,y:8,z:.8}];
 const body={ia:0,ib:1,ic:2,opacity:1,shade:'#ff0000',depth:1.5},glass={ia:3,ib:4,ic:5,opacity:.5,shade:'#0000ff',depth:2.4};
 assert.deepEqual(pixel(rasterizeTriangles(image(),points,[glass,body]),1,1),[255,0,0,255]);
 for(const p of points.slice(3))p.z=.2;
 assert.deepEqual(pixel(rasterizeTriangles(image(),points,[glass,body]),1,1),[128,0,128,255]);
});
