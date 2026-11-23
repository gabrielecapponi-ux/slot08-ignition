// After Effects · File > Scripts > Run Script File.
// Two seamless square tiles. Each finish and pigment stays editable.
(function(){
  app.beginUndoGroup("SLOT 08 | Materiali");
  try {
    if(!app.project)app.newProject();
    var size=256,folder=app.project.items.addFolder("SLOT 08 | Campioni materiali");
    function comp(name){
      var c=app.project.items.addComp(name,size,size,1,1,24);
      c.parentFolder=folder;return c;
    }
    function layer(c,name,color){
      var l=c.layers.addShape();l.name=name;
      var shapes=l.property("ADBE Root Vectors Group");
      var fill=shapes.addProperty("ADBE Vector Graphic - Fill");fill.property("ADBE Vector Fill Color").setValue(color);
      return shapes;
    }
    function patch(group,points){
      var geo=group.addProperty("ADBE Vector Shape - Group"),shape=new Shape();
      shape.vertices=points;shape.closed=true;geo.property("ADBE Vector Shape").setValue(shape);geo.moveTo(1);
    }
    function rect(g,x,y,w,h){patch(g,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);}
    var carbon=comp("Carbonio | Twill 2 su 2");
    carbon.layers.addSolid([.16,.18,.20],"Resina grafite",size,size,1);
    var strands=layer(carbon,"Fasci intrecciati",[.28,.30,.32]),ridges=layer(carbon,"Riflessi delle fibre",[.35,.37,.38]);
    for(var j=0;j<16;j++)for(var i=0;i<16;i++){
      var x=i*16-128,y=j*16-128,warp=((i-j+16)%4)<2;
      rect(strands,x+(warp?2:0),y+(warp?0:2),warp?12:16,warp?16:12);
      for(var k=0;k<3;k++)rect(ridges,x+(warp?4+3*k:0),y+(warp?0:4+3*k),warp?1:16,warp?16:1);
    }
    var rail=comp("Guardrail | Acciaio zincato e smalto");
    rail.layers.addSolid([.54,.59,.61],"Acciaio satinato",size,size,1);
    var grain=layer(rail,"Spazzolatura longitudinale",[.60,.65,.67]);
    for(j=0;j<64;j++)rect(grain,-128,j*4-128,256,.55);
    var panel=layer(rail,"Inserto grafite",[.12,.15,.17]);rect(panel,-72,-84,134,164);
    var amber=layer(rail,"Segnaletica ambra",[.96,.75,.14]);
    for(i=0;i<2;i++){x=-67+64*i;patch(amber,[[x,-84],[x+25,-84],[x+4,80],[x-5,80],[x-5,-15]]);}
    carbon.openInViewer();
  }finally{app.endUndoGroup();}
})();
