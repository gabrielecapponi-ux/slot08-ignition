# Worlds 5.0 — verifica del 19 novembre 2026

## Simulazione automatica

`npm test`: **95 test superati**. Sono inclusi audio, clock fisso, input, gare, profili e i nuovi casi Worlds.

- Tutte le 15 piste: chiusura e continuità, pose finite, scambi su rettilinei, due corsie sopra il terreno, curve inclinate e gallerie.
- Su tutte le piste, il 100% continuato porta al deragliamento; l'assistenza conclude tre giri senza uscite, anche con uno scambio prenotato. Questo test è riferito alla configurazione Club di serie, non a ogni combinazione possibile di potenziamenti.
- Sbandata di riferimento: dopo 0,5 s l'auto è ancora agganciata, con scivolamento visibile. Il rilascio recupera stabilità; continuare ad accelerare porta fuori pista. Il margine effettivo varia con velocità, raggio e hardware.
- Deragliamento estremo, traiettoria tangente, progresso congelato e recupero di esattamente 3 secondi. Nessuna penalità aggiunta due volte.
- Le spirali condividono le coordinate orizzontali ma mantengono oltre 1,8 m di separazione tra passaggi; la pendenza modifica la distanza reale della corsia.
- La sopraelevazione inclina le corsie e aumenta il limite di velocità. La superficie inclinata resta sopra il terreno.
- Giocatore, bot e tre piloti locali usano hardware identico anche al livello 12. Gas 65/85/100 produce accelerazioni distinte. I bot possono uscire attraverso la stessa fisica, senza incidenti imposti.
- Migrazione del profilo, 12 livelli meccanici, vernici/livree, pagamento dei componenti una sola volta, componenti automatici e selezioni manuali.
- Il GLB contiene tutte le 30 varianti e gli elementi ambientali richiesti, sotto 2,5 MB.

## Prove nel browser

Browser integrato sul Mac, 1280×720 e viewport simulato 390×844. Queste verifiche del layout non sostituiscono prove su hardware iPhone/Android reale.

- Tutte le 15 piste selezionate dall'interfaccia senza errori. Bosco, animali, gallerie, guardrail, segnaletica e doppia spirale verificati visivamente.
- Tutte le 30 varianti del garage provate in anteprima. Acquistati nel profilo locale di test un alettone GT3 e cerchi Oro Sport: 95 + 60 CR; 545 → 390 CR. Vernice arancione e livrea Tricolore applicate gratuitamente. Componenti e colori ancora presenti dopo il ricaricamento.
- Garage mobile: macchina interamente visibile, tre inquadrature, pannello scorrevole e pulsanti di acquisto. Corretto lo zoom troppo ravvicinato della prima iterazione.
- Selettore 65% e scambio touch verificati; tre gas indipendenti attivati via Spazio/W/I. Tutti e tre i piloti sono usciti di pista e rientrati, con gas spento e una uscita ciascuno.
- Blocco dei controlli durante il primo caricamento: evita che una selezione venga sovrascritta dalla configurazione iniziale.
- Pacchetto standalone aperto nel browser, entrambi i GLB caricati, nessun errore di URL relativo ai moduli Blob.
- Fallback Canvas2D verificato, con avviso che i componenti 3D non sono visibili.
- Nessun errore o warning di console durante i cambi di circuito o le 30 anteprime. Il fallback 2D deliberato emette il suo avviso previsto.
- Campione della doppia spirale: 128 draw call, 130.790 triangoli e 134 geometrie dopo aver selezionato tutti i circuiti. Circa 120 fps nel campione su questo Mac; non è una promessa di prestazioni sui telefoni. Un solo renderer, DPR massimo 1,5, props istanziati e risorse condivise.

## Artifact e riproducibilità

`npm run build` e `npm run standalone` completati. Il file autonomo pesa circa 10,8 MB, inclusi motore, codice, poster e modelli. Gli URL di tutti i moduli applicativi e del CSS riportano la versione 5.0.0.

Blender 5.2.1 LTS eseguito realmente in background: 49 radici esportate in `assets/worldkit.glb`, scena editabile `blender/worldkit.blend` e contact sheet. Materiali sRGB convertiti in lineare, gomma separata dal metallo. Nessun nuovo modello remoto o placeholder non esportato.

Screenshot:
- `docs/qa-worlds-garage-mobile.jpg` — officina mobile e configurazione acquistata;
- `docs/qa-worlds-helix.jpg` — doppia spirale completa e gallerie.

## Limiti dichiarati

Fisica arcade, senza gravità longitudinale o carico verticale dinamico. Nessun urto tra auto, multiplayer online, sincronizzazione tra dispositivi, editor delle piste, loop verticali o salti guidati. Nei dispositivi senza WebGL resta la modalità 2D, senza anteprima delle parti 3D. Non è stata certificata una frequenza minima su telefoni reali.

## Pubblicazione verificata

GitHub Pages ha distribuito con successo il commit applicativo `be1c7a6c0aa262b89825f4acdbb7b1dd38bebf97` (run `44523930387`). Sul link pubblico verificati titolo Worlds, footer 5.0, carico dei modelli Blender, garage a 12 livelli, anteprima Doppio piano, guida in Bosco delle Volpi e coach. Nessun errore di console. Non sono stati acquistati componenti sul profilo pubblico.

- `docs/qa-worlds-live-garage.jpg`: garage pubblicato, anteprima di un alettone non acquistato.
- `docs/qa-worlds-live-forest.jpg`: guida e coach nel nuovo bosco dal link GitHub Pages.

Il gioco pubblico è stato lasciato al menu, audio spento e gas disattivato. Il viewport di prova è stato ripristinato; le schede locali sono state chiuse.
