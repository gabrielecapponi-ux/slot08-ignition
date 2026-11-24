# Asset Club 15 — 22 novembre 2026

Le nove auto `fleet-0.glb`–`fleet-8.glb` sono modelli originali generati con Blender 4.3.2 dal sorgente `scripts/art/build_fleet.py`. Le foto Corvette fornite dall’utente sono riferimenti visivi, non texture incorporate, scansioni o asset acquisiti. Marchi e sponsor fotografici non sono riprodotti. Il sorgente modificabile GT è `scripts/art/fleet15-master.blend`; il generatore ricostruisce tutti i telai.

Hotel, torre luminosa, cascata e parete alpina sono modelli originali del generatore `scripts/art/scenery15.py`, con sorgente `scenery15.blend`, colori/materiali e texture originali. Le foto Las Vegas, foresta e lago allegate servono da riferimento; non sono pubblicate nel gioco. Il kit distribuito è `scenery15.glb.gz`.

I render `fleet15-proof-*` sono prove offline di asset Blender reimportati dal GLB, non schermate del gioco. Le miniature del catalogo sono ricavate dagli stessi GLB del gioco. In questa release non è stata eseguita una lavorazione nell’app After Effects né una generazione Higgsfield; restano disponibili gli asset e le esportazioni delle versioni precedenti.

# Provenienza degli asset — Ignition

- Geometrie GT, piste, box, città, porto, materiali, scritte e render: creazione procedurale originale in Blender 5.2 tramite Higgsfield 3D Jutsu, progetto `8c2e8aed-d52f-4ac8-89af-cdbda6850d8c`, revisione 3. Versione locale ricostruita con i medesimi script in Blender 5.2.1 dopo un'interruzione del trasferimento remoto.
- `slot08.glb`: export glTF binario della scena locale; include `CAR_GT` e `LEVEL_0..2`. Non dipende da texture esterne.
- La copertina 8.1 in `poster.png` è un’immagine promozionale generata della GT 08. Il circuito di gara è disegnato in tempo reale.
- `impact-spark.png` è una texture di scintille creata in Higgsfield. Il gioco la applica nei punti di contatto.
- Railcut GT e i pittogrammi di guida sono originali del progetto.
- `blender/slot08.blend`: scena editabile. Script e dati delle traiettorie inclusi.
- Three.js 0.180.0: libreria MIT, file originali e licenza in `vendor/`.
- Audio: sintetizzato durante l'esecuzione; nessun campione musicale o registrazione di terzi.
- Riferimento prompts-chat documentato in `docs/DESIGN_BRIEF.md`; nessun codice o asset di quel prompt copiato.
- Nessuna affiliazione con marchi di giocattoli. Modello e marchio SLOT 08 originali.

## Worlds 6.0 — 20 novembre 2026

- Catalogo originale: 89 elementi (60 parti GT, 27 props, due elementi animabili). Creati con `blender/build_worldkit.py`, Blender 5.2, progetto gratuito 3D Jutsu `f751b35d-ea52-4fc7-b8e6-a8f802bd90f1`, revisione 1. Nessun modello acquistato o generazione a pagamento.
- Generazione remota usata perché Blender locale si arrestava nella rilevazione Metal. Sorgenti GLB e BLEND trasferiti con verifica SHA-256.
- GLB decodificato SHA-256: `e6428d9669fa43dc8e51334e067733bd7a2f5e3fcde620b4a9d480bab2ad0b95`.
- BLEND decodificato SHA-256: `140be738e4ac01d28eb16d4c79771017d43ee5557909374bba4eb923540e2be5`.
- Distribuzione senza perdita: `worldkit.glb.gz` e `worldkit.blend.xz`; le copie non compresse sono ricostruibili con `scripts/unpack-assets.py`. Posizioni e ingrandimenti da catalogo vengono normalizzati dal loader.
- Il render del catalogo 6.0 è stato ispezionato. `worldkit-preview.png` e gli screenshot Worlds 5 restano immagini storiche del catalogo precedente, non anteprime 6.0.
- Cieli, terreno e geometria esatta delle piste sono generati dal renderer Three.js; gli oggetti decorativi e i componenti della GT sono mesh Blender.

## Botanica da pista

Quercia, conifera, palma e felce in `botanical.glb` sono modelli originali costruiti in Blender 4.3.2. Le fronde, gli aghi, le foglie lobate e la corteccia utilizzano un atlante originale generato con Pillow. Gli script riproducibili sono in `scripts/botany/`. Le geometrie sono istanziate, illuminate e proiettano ombre in tempo reale.

## Scuderia 9.0

Nove modelli originali in Blender sono distribuiti separatamente da `fleet-0.glb` a `fleet-8.glb`. Il generatore è in `scripts/art/build_fleet.py`. Le miniature della scuderia mostrano render dei modelli. I sessanta ricambi, comprese le dieci serie di ruote, sono in `parts.glb.gz`. La trama del composito di carbonio è stata realizzata in Higgsfield e applicata in Blender. Il sorgente è in `scripts/art/precision-parts.py`.

## Materiali del diorama

Foglie cadute, muschio, sabbia, rocce stratificate, calcestruzzo e pietrisco sono materiali originali. Il generatore in `scripts/art/trackside-materials.py` crea le mappe di colore, normali tangenti e ruvidità di `trackside-pbr.webp` a partire dalla microgeometria delle superfici. La banchina di ogni circuito è costruita lungo i binari e si allarga all'esterno delle curve. Le chiome della vista 2D in `diorama-surface.webp` provengono dai modelli Blender del progetto.

## Catalogo ricambi 13.0

`parts-catalog.webp` contiene 69 anteprime originali renderizzate in Blender Cycles dalle geometrie del gioco: 60 ricambi di `parts.glb.gz`, sei riferimenti di serie estratti da `fleet-0.glb` e tre sistemi meccanici ricostruiti con dimensioni e materiali di `installHardware` in `src/render/atelier.js`. Le viste meccaniche illustrano il livello 8 e non sono un'immagine dinamica di ogni livello acquistabile. La prima colonna è un riferimento della GT-08 di serie: la modalità automatica può mostrare componenti differenti seguendo gli upgrade. Le anteprime dei cerchi mostrano una singola ruota del kit di quattro. Nessuna immagine generativa o fotografia di prodotto è usata come sostituto della geometria.

Riproduzione: `blender -b -t 4 -P scripts/art/parts-catalogue.py -- /tmp/slot-parts-catalogue`, quindi `python scripts/art/pack-parts-catalogue.py /tmp/slot-parts-catalogue`. Atlante di 11 colonne e 7 righe; tile da 256 × 192 pixel. Mapping in `parts-catalog.json`.


## Club 14 — original small UI typography and round instrument icons

- `slot-sans.woff2` and `slot-sans.ttf`: **Slot Sans**, an original proportional rounded text face authored for SLOT08 in `scripts/art/slot-sans.py`. All outlines are generated from independently drawn centerline Bézier curves; no existing font outlines, font conversions, or font-derived paths were used. True lowercase, high x-height, tabular numbers and Italian accented uppercase/lowercase are supported. 153 mapped characters. Slot Sans is separate from the Railcut display face. Font metadata and editable construction source accompany the assets.
- `icons14/*.svg` and `slot-icons.svg`: 16 original vector instrument icons authored in `scripts/art/slot-icons.py`, with a consistent broken circular bezel, rounded strokes, and transparent background. Names: wheel, motor, garage, arcade, chrono, duel, audio, fullscreen, play, pause, trophy, spark, paint, chevron, reset, brake. No external icon library or copied vector paths were used. Individual SVGs have accessible Italian names; symbol IDs use `slot-` followed by the name.
- `slot-sans-specimen.png`, `slot-icons-specimen.svg`, and `slot-icons-specimen.png` are inspection sheets generated from the original font/vectors. Font inspected at 14, 16 and 20 pixels; icons inspected on a dark tinted circular lens. Preview lens backgrounds are not included in the individual icon assets.
- Build commands: `/usr/bin/python3 scripts/art/slot-sans.py` (FontTools + Pillow + Brotli), then `/usr/bin/python3 scripts/art/slot-icons.py` (Pillow + Inkscape). Runtime game assets need no build-time libraries.

## Photographic race environments

- Forest Grove, Poly Haven (CC0). Tonemapped from the 1K Radiance panorama. https://polyhaven.com/a/forest_grove
- Margerie Glacier, National Park Service (NPS Photo). Cropped and mirrored for the race horizon. https://www.nps.gov/places/margerie-glacier.htm
- Apollo 17 surface panorama, NASA JSC, jsc2004e52776. Reframed for the lunar horizon. https://images.nasa.gov/details/jsc2004e52776
- Great Observatories' Unique Views of the Milky Way, NASA, ESA, SSC, CXC and STScI, PIA12348. Multiwavelength composite adapted for the fictional solar circuit. https://images.nasa.gov/details/PIA12348
- Active lava lake at the summit of Kīlauea, USGS (public domain). Adapted as a projected caldera surface. https://www.usgs.gov/media/images/active-lava-lake-summit-kilauea-volcano
