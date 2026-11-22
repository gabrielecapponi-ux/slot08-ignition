// SLOT 08 | Modulo di telemetria per grafica video trasparente.
// After Effects: File > Scripts > Run Script File.
(function () {
    app.beginUndoGroup("SLOT 08 | Rientro");
    try {
        if (!app.project) app.newProject();
        var duration = 3, width = 624, height = 96, left = 24;
        var comp = app.project.items.addComp("SLOT 08 | Rientro in corsia", width, height, 1, duration, 60);
        function solid(name, color, w, h, x, y) {
            var layer = comp.layers.addSolid(color, name, w, h, 1, duration);
            layer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
            layer.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
            return layer;
        }
        solid("Fondo antracite", [0.035, 0.071, 0.105], width, height, 0, 0);
        solid("Guida", [0.28, 0.30, 0.32], width-2*left, 4, left, height-10);
        var rail = solid("Tempo di recupero", [1, 0.72, 0.30], width-2*left, 4, left, height-10);
        var scale = rail.property("ADBE Transform Group").property("ADBE Scale");
        scale.setValueAtTime(0,[0,100]);
        scale.setValueAtTime(duration,[100,100]);
        scale.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR);
        scale.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR);
        function label(name, start, end) {
            var layer = comp.layers.addText(name);
            var source = layer.property("ADBE Text Properties").property("ADBE Text Document");
            var doc = source.value;
            doc.fontSize = 34;
            doc.fillColor = [1,0.92,0.82];
            doc.tracking = 55;
            source.setValue(doc);
            layer.property("ADBE Transform Group").property("ADBE Position").setValue([left,57]);
            layer.inPoint = start;
            layer.outPoint = end;
        }
        label("FUORI PISTA",0,2.2);
        label("RIENTRO IN CORSIA",2.2,duration);
        comp.openInViewer();
    } finally {
        app.endUndoGroup();
    }
}());
