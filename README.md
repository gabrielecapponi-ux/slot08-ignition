# SLOT 08 — IGNITION / WORLDS 5.0

**[Gioca dal telefono o dal computer](https://gabrielecapponi-ux.github.io/slot08-ignition/)** — il Mac non deve restare acceso. Browser 3D, senza account o servizi a pagamento. Three.js 0.180.0 è incluso nel repository.

## Cosa cambia

- **Tutti i 15 circuiti rinnovati**, in sette ambientazioni: bosco, Alpi, porto, costa, canyon, deserto, notte. Modelli originali di alberi, animali, edifici e portali creati realmente in Blender. Uccelli, piccoli movimenti degli animali e pale dei mulini animati; animazioni ambientali ferme con movimento ridotto.
- **Gallerie percorribili**, incroci su cavalcavia e paraboliche che inclinano la pista e la GT. Tre piste contengono una vera spirale; Double Helix sale di 5,2 metri con due giri aggiuntivi. Le corsie sovrapposte hanno almeno 1,8 metri di separazione verticale. In panoramica, i tetti diventano trasparenti per seguire le auto.
- **Gas più leggibile:** pulsanti 65%, 85%, 100% indipendenti per ciascun pilota; P1 usa anche 1, 2, 3. Il gas sale in modo progressivo, il rilascio resta rapido. La sbandata avvisa prima del deragliamento e può essere recuperata. Nei test di riferimento, mezzo secondo di sbandata moderata lascia ancora tempo per salvarsi; non è una garanzia a qualsiasi velocità.
- **Garage con anteprima 3D reale:** 30 componenti in sei categorie (ali, cerchi, cofani, kit aerodinamici, luci, scarichi), 16 vernici e 8 livree. Tre inquadrature e anteprima gratuita prima dell'acquisto. Le parti acquistate si rimontano senza pagarle di nuovo. Colori e livree sono gratuiti.
- **12 livelli ciascuno** per motore, magneti/pneumatici e freno motore. In modalità Automatico, gruppi di livelli cambiano anche cofano, scarichi, cerchi o kit aerodinamico. Un componente manuale prevale sull'aspetto automatico. I componenti estetici non aggiungono bonus fisici nascosti.
- **Stesse regole per giocatore e bot:** stessi potenziamenti, tenuta, sbandata e tre secondi di recupero. I bot stimano male alcune curve e possono uscire. Niente accelerazioni in base alla classifica o teletrasporti.

Restano il tutorial pratico, il coach di frenata, quattro telecamere, gare contro due bot, Time Attack e gare locali per due/tre persone sullo stesso dispositivo. La musica originale a 136 BPM e i suoni di motore, rilascio, gomme e impatto sono sintetizzati dal gioco. Premi Attiva audio; il mixer separa musica ed effetti. Nessun autoplay.

## Comandi

| Comando | Azione |
| --- | --- |
| Spazio / ACCELERA / pressione sulla pista | Gas; il rilascio frena |
| 1 / 2 / 3, oppure pulsanti 65% / 85% / 100% | Potenza del gas di P1 |
| Invio / SCAMBIO | Prenota la prossima X; seconda pressione annulla |
| Shift / frecce laterali | Alternative a Invio |
| C | Drone, bordo pista, panoramica, dall'alto |
| P / Esc | Pausa / riprendi |
| Gas a interruttore nel menu | Un tocco accende, un altro spegne |

In locale: P1 Spazio/Invio, P2 W/E, P3 I/O. Ogni pilota ha pulsanti touch e potenza indipendenti. Dopo il primo arrivo, gli altri hanno 30 secondi. Non è multiplayer tra telefoni. Le auto non si urtano.

Per iniziare: scegli Rookie, gas 65% e coach acceso. Passa all'85% quando riconosci le curve e al 100% sui rettilinei. Il gas ridotto non garantisce di superare ogni curva. La guida assistita frena al posto tuo ed è una scelta separata, più prudente. Perdere il focus mette in pausa e spegne il gas.

## Circuiti

Le lunghezze sono riferite al percorso centrale in pianta: l'effettiva distanza percorsa dipende da corsia, pendenza e scambi.

| # | Circuito | Lunghezza | Carattere |
| --- | --- | ---: | --- |
| 1 | Bosco delle Volpi | 32.1 m | Tra pini, animali e una galleria di pietra. |
| 2 | Passo dei Cervi | 44.3 m | Due rami incrociati, ponte alto e galleria. |
| 3 | Porto delle Lanterne | 58.3 m | Banchine, fari e curve sul lungomare. |
| 4 | Palm Coast | 75.5 m | Un lungo allungo tra palme e case sul mare. |
| 5 | Red Rock Canyon | 77.8 m | Mesas, galleria nel canyon e curve opposte. |
| 6 | Spirale del Bosco | 84.0 m | Una vera spirale sopraelevata tra gli alberi. |
| 7 | Alpine Crossing | 60.7 m | Doppio senso di curva, incrocio a due quote. |
| 8 | Dune Paraboliche | 106.8 m | Curve inclinate e un rettilineo nel deserto. |
| 9 | Harbor Flyover | 72.2 m | Un cavalcavia attraversa il porto illuminato. |
| 10 | Copper Spiral | 118.3 m | Un giro elicoidale fra pareti di roccia. |
| 11 | Neon Junction | 80.1 m | Ponte incrociato, gallerie e insegne notturne. |
| 12 | Glacier Summit | 157.7 m | Rampe, tunnel e rifugi nel paesaggio alpino. |
| 13 | Coastal Switchback | 87.9 m | Doppio tracciato incrociato lungo la costa. |
| 14 | Grand Forest Tour | 179.0 m | Il grande circuito tra mulini e villaggi. |
| 15 | Double Helix | 169.8 m | Due giri di spirale, 5,2 metri di dislivello. |

## Progressione e salvataggi

Tutte le piste sono aperte. Le gare contro i bot assegnano stelle e crediti: 105–180 CR di base, moltiplicati fino a due sulle piste lunghe. Gare locali e Time Attack non attribuiscono crediti. I prezzi dei 12 livelli sono 100, 180, 280, 350, 430, 520, 620, 730, 850, 980, 1120, 1270 CR. I componenti estetici costano 30, 60, 95, 140 o 200 CR.

Il vecchio profilo viene conservato, inclusi crediti, medaglie e potenziamenti. I record della nuova fisica usano la chiave worlds-5: quelli precedenti restano salvati ma non sono confrontati con i nuovi circuiti. Il salvataggio è locale al browser, senza sincronizzazione tra Mac e telefono. Se lo storage non è disponibile si può comunque giocare.

## Architettura e fisica

- src/track: geometria analitica, catalogo, spirali, sopraelevazione e tunnel. ScenicTrack decora il percorso base. Rendering, auto, coach e IA leggono la stessa superficie.
- src/physics: motore puro senza DOM, passo fisso a 120 Hz. Accelerazione, inerzia, frenata, aderenza e recupero. La velocità segue la distanza tridimensionale della corsia, incluse pendenze e scambi quintici.
- La domanda laterale è m·v²·|κ|. La sopraelevazione riduce la forza da sostenere con magneti e gomme: max(0, m·v²·|κ|·cos(φ) − m·g·sin(|φ|)). La piena apertura riduce del 10% la tenuta disponibile. L'instabilità cresce nel tempo e si riduce con il rilascio; la scocca ruota intorno al pattino anteriore prima di staccarsi.
- È fisica arcade: non simula il carico verticale dinamico o l'effetto della gravità sulla velocità lungo una salita. Deragliamento con scivolamento e gravità, progresso sul giro congelato e rientro nello stesso punto dopo tre secondi, senza doppia penalità.
- src/ai: solo input di gas e scambio, previsione di frenata, reazioni e errori riproducibili. src/game: gare, profilo, coach e catalogo officina. src/input: comandi e potenza. src/audio: motori, effetti e sequencer.
- src/render: geometrie modulari, props Blender istanziati, pool limitati di fumo e segni, gestione delle risorse condivise. Un solo renderer WebGL, riutilizzato dal garage. src/camera/rig.js possiede la regia. Il garage statico viene ridisegnato solo quando cambia.
- Pixel ratio massimo 1,5; niente postprocessing pesante o download durante la gara. Il kit nuovo pesa circa 1,9 MB. Canvas2D è il fallback senza WebGL: consente di giocare, ma non mostra componenti o scenari 3D.

## Avvio, test e build

Node 20 o successivo. Non serve npm install.

```sh
npm start
npm test
npm run build
npm run standalone
```

Anteprima su http://127.0.0.1:4173. Build statico in dist/. SLOT08.html incorpora anche entrambi i GLB ed è escluso dal versionamento. Per i telefoni è consigliato il link online, perché alcune anteprime dei file scaricati limitano JavaScript.

Pages pubblica main, cartella root. Incrementare package.json, eseguire test e build, verificare e pubblicare. Il build aggiorna gli URL di tutti i moduli applicativi e del CSS per evitare cache miste. Nessuna chiave API o dipendenza CDN.

## Asset Blender modificabili

- blender/worldkit.blend: catalogo completo dei 49 elementi nuovi, disposto su un tavolo per ispezionarlo. I componenti della GT sono ingranditi 6× nel catalogo; il GLB è esportato prima di questo allestimento, nella scala corretta.
- blender/build_worldkit.py: generatore originale riproducibile; usa una scena pulita. Eseguire in un processo Blender separato: blender --background --python blender/build_worldkit.py. Produce assets/worldkit.glb, scena editabile e contact sheet assets/worldkit-preview.png.
- blender/slot08.blend e assets/slot08.glb: modello GT originale. I vecchi diorami restano nel sorgente per riferimento; Worlds costruisce tutte le piste dalla geometria corrente e non li visualizza.
- Il riferimento Higgsfield del precedente progetto Ignition rimane https://higgsfield.ai/3d-jutsu/8c2e8aed-d52f-4ac8-89af-cdbda6850d8c . I nuovi modelli Worlds sono stati generati ed esportati direttamente con Blender locale.

Vedi QA.md per le verifiche. Prototipo originale, non affiliato a Hot Wheels o Carrera. Nessun multiplayer online, editor delle piste, urti tra auto, loop verticali o salti guidati.
