/** Export an editable AE composition. The desktop app is never driven from the browser. */
export function afterEffectsScript({track,lanes,duration,events=[],rank,credits,stars}){
 const data={track:String(track),lanes:Number(lanes)||2,duration:Math.max(10,Math.min(10800,Number(duration)+9||10)),events:events.slice(0,256).map(e=>({time:Math.max(0,Number(e.time)||0),type:String(e.type),name:String(e.name||'')})),rank:Number(rank)||0,credits:Number(credits)||0,stars:Number(stars)||0};
 return '// SLOT08 — composizione generata dalla gara. File > Script > Esegui file di script.\n'+
 '(function(){var race='+JSON.stringify(data).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n'+String(buildComposition)+'\nbuildComposition(race);})();';
}
function buildComposition(race){
 app.beginUndoGroup('SLOT08 / Regia gara');
 try{
  if(!app.project)app.newProject();
  var comp=app.project.items.addComp('SLOT08 / '+race.track,1920,1080,1,race.duration,60);
  comp.bgColor=[.035,.075,.08];
  function solid(name,color,w,h,x,y,start,end){
   var layer=comp.layers.addSolid(color,name,w,h,1,race.duration);
   layer.property('ADBE Transform Group').property('ADBE Position').setValue([x,y]);layer.inPoint=start;layer.outPoint=end;return layer;
  }
  function title(text,x,y,size,start,end){
   var layer=comp.layers.addText(text),source=layer.property('ADBE Text Properties').property('ADBE Text Document'),doc=source.value;
   doc.font='Arial-BoldMT';doc.fontSize=size;doc.fillColor=[1,.95,.84];source.setValue(doc);
   var tr=layer.property('ADBE Transform Group');tr.property('ADBE Position').setValue([x,y]);
   tr.property('ADBE Opacity').setValueAtTime(start,0);tr.property('ADBE Opacity').setValueAtTime(start+.16,100);
   tr.property('ADBE Opacity').setValueAtTime(Math.max(start+.18,end-.18),100);tr.property('ADBE Opacity').setValueAtTime(end,0);
   layer.inPoint=start;layer.outPoint=end;return layer;
  }
  // Optional real gameplay recording is the background; no synthetic replay is claimed.
  var video=File.openDialog('Seleziona una registrazione della gara (Annulla per la sola grafica)');
  if(video){var footage=app.project.importFile(new ImportOptions(video)),back=comp.layers.add(footage);back.moveToEnd();}
  title('SLOT 08 / '+race.lanes+' CORSIE',90,110,28,0,3);
  title(race.track.toUpperCase(),90,220,72,0,3);
  for(var i=0;i<5;i++){
   var light=solid('Semaforo '+(i+1),[1,.12,.035],78,78,660+i*150,510,i*.5,3);
   var ellipse=light.property('ADBE Mask Parade').addProperty('ADBE Mask Atom'),shape=new Shape();
   shape.vertices=[[39,0],[78,39],[39,78],[0,39]];shape.inTangents=[[-21.54,0],[0,-21.54],[21.54,0],[0,21.54]];shape.outTangents=[[21.54,0],[0,21.54],[-21.54,0],[0,-21.54]];shape.closed=true;ellipse.property('ADBE Mask Shape').setValue(shape);
  }
  title('VIA',800,580,126,3,3.65);
  for(var e=0;e<race.events.length;e++){
   var event=race.events[e],t=Math.min(race.duration-.2,event.time),marker=new MarkerValue(event.type+' / '+event.name);
   comp.markerProperty.setValueAtTime(t,marker);
   if(event.type==='derail'||event.type==='contact'){
    var end=Math.min(race.duration,t+(event.type==='derail'?3:.8));
    solid('Cartello contatto '+e,[.04,.085,.09],920,130,560,930,t,end);
    title((event.type==='derail'?'FUORI PISTA / ':'CONTATTO / ')+event.name,140,950,32,t,end);
    if(event.type==='derail'){
     var bar=solid('Rientro 3 secondi '+e,[1,.42,.19],840,6,560,982,t,end),scale=bar.property('ADBE Transform Group').property('ADBE Scale');
     scale.setValueAtTime(t,[0,100]);scale.setValueAtTime(end,[100,100]);
    }
   }
  }
  var finish=race.duration-6;
  solid('Risultato',[.04,.085,.09],1040,460,960,540,finish,race.duration);
  title(race.rank===1?'VITTORIA':'TRAGUARDO / P'+race.rank,510,440,78,finish,race.duration);
  title(race.stars+' STELLE     +'+race.credits+' CR',510,565,48,finish+.3,race.duration);
  title('SLOT08 / IL PROSSIMO GIRO TI ASPETTA',510,665,24,finish+.5,race.duration);
  comp.openInViewer();
 }catch(error){alert('SLOT08: '+error.toString());}finally{app.endUndoGroup();}
}
