# SLOT08 — Club Precision 15

Aggiornamento del 22 novembre 2026, a partire da Club Stories 14.

## Interventi implementati

| Area | Modifica | Sorgente |
| --- | --- | --- |
| Guardrail | Profilo metallico chiuso a W, pannelli neri/gialli smaltati, catadiottri e piedini imbullonati lungo entrambi i lati, inclusi i rami separati | `src/render/safety-rail.js` |
| Appoggi | Montanti e piedi usano quote/inclinazioni reali; i pilastri evitano gli impalcati inferiori agli incroci; sostegni dei portali estesi al terreno | `modular-track.js`, `world.js` |
| Spazio scenico | La distanza dalla pista considera entrambi i rami; fondazioni dei landmark livellate e distanza minima da carreggiata/altri asset | `track/landscape.js`, `render/landmarks.js` |
| Auto | Nove GLB Blender, tetti/vetri rimodellati, ottiche separate, cerchi e pneumatici, diffusori, rollcage, supporti degli specchi e degli alettoni | `scripts/art/build_fleet.py` |
| Ambienti | Edifici notturni con finestre emissive, torre, cascata con bacino e pareti alpine | `scripts/art/scenery15.py` |
| Riflessi | Una sonda cubica statica per pista include scenografia e guardrail; 128 px per faccia mobile, 256 desktop | `render/scene3d.js` |
| Trasparenze | Guardrail e scenografia opachi; tetto galleria nascosto nelle viste aperte/interne invece di pareti semitrasparenti | `render/world.js` |
| Catalogo | Miniature delle auto rigenerate dagli stessi GLB caricati in gara | `assets/fleet-catalog.webp` |

La sonda non riflette gli avversari in movimento e non è ray tracing. La sua generazione avviene una volta quando il circuito e gli asset sono pronti. Le auto si scaricano su richiesta; restano i livelli di qualità e la risoluzione adattiva della versione precedente. Aggiunta un’ombra di contatto sotto le auto, nascosta durante il recupero fuori pista.

Aggiunto un rasterizzatore con profondità per pixel anche nel garage di compatibilità: elimina i triangoli di superfici posteriori che attraversavano la carrozzeria. I materiali del fallback restano semplificati rispetto al WebGL.

## Implementazione riproducibile

1. Ricostruire le auto con Blender in background usando `scripts/art/build_fleet.py`; controllare il manifest e i nove GLB. Il file `.blend` conserva il modello GT modificabile.
2. Ricostruire il kit ambienti con `scripts/art/scenery15.py`, aggiornando sia il GLB sorgente sia `assets/scenery15.glb.gz`.
3. Eseguire `npm test`. Le prove comprendono geometrie di tutte le 50 tappe, visibilità delle facce dei guardrail, materiali opachi, ancoraggi, asset e distanza dei nuovi ambienti dalla pista.
4. Eseguire `npm run build` e `npm run standalone`. La build esclude i sorgenti Blender e il GLB scenografico non compresso. Tutti gli asset della versione autonoma sono incorporati nel file HTML.
5. Verificare la gara su GPU e su iPhone fisico prima di considerare concluso il collaudo grafico/prestazionale.

## Limiti e prossimi interventi

- I modelli sono miniature originali più articolate; non sono equivalenti al fotorealismo delle fotografie. Per quel livello servono modellazione manuale della carrozzeria, texture PBR controllate e ulteriore revisione artistica ravvicinata.
- Il browser di collaudo remoto non dispone di WebGL. Sono verificati caricamento e interfaccia in compatibilità, geometria tramite test e render offline Blender; l’intero mondo 3D del gioco non è stato verificato visivamente su GPU qui.
- Da misurare FPS, memoria e temperatura su iPhone fisico e Safari. Nessun valore prestazionale viene inventato.
- After Effects resta disponibile mediante le esportazioni JSX già presenti nello Studio video; il Mac dell’utente non è collegato a questa sessione. Gli errori di compenetrazione si correggono nelle mesh e nei posizionamenti del gioco.
- Acqua e fondali richiedono ulteriori dettagli e movimento dei riflessi per avvicinarsi alle foto; gli edifici sono scenografie originali ispirate a una città notturna, non una ricostruzione fedele di Las Vegas.

## Giocabilità

Nessun nuovo reset. Difficoltà, tenuta, potenza, profilo, sblocchi e progressione conservano il comportamento della 14. Spazio accelera, Esc prenota lo scambio, P mette in pausa. I materiali visivi dei guardrail seguono l’involucro di collisione esistente.
