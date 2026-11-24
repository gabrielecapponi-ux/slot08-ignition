// Editable optical cross-section of the tunnel ceiling strip.
(function () {
    app.beginUndoGroup("SLOT08 | Diffusore galleria");
    try {
        if (!app.project) app.newProject();
        var comp = app.project.items.addComp("Diffusore opalino | Galleria", 384, 64, 1, 1, 30);
        comp.layers.addSolid([.055,.12,.15], "Profilo in alluminio",384,64,1);
        comp.layers.addSolid([.24,.60,.65], "Bordo satinato",366,45,1);
        comp.layers.addSolid([.55,.88,.91], "Diffusore",352,30,1);
        comp.layers.addSolid([.86,.99,1], "Nucleo LED",344,12,1);
    } finally { app.endUndoGroup(); }
}());
