# Worlds 6.0 — verifica del 20 novembre 2026

## Ambito

Aggiornamento di tutti i 15 scenari, tre spirali con curve opposte all’uscita, controllo fine del gas, sbandata più recuperabile, 60 componenti e 20 livelli meccanici. I progressi precedenti vengono migrati; i record sono separati con la chiave worlds-6.

## Verifiche automatiche

`npm test`: **100 test superati**, inclusa la decompressione del kit e il caricamento reale delle mesh. `npm run build`, `npm run standalone` e `git diff --check` completati. Standalone: 9,09 MB; kit distribuito: 650.856 byte compressi.

- Simulazione di un giro su tutte le 15 piste con GT Club di serie, gas costante al 65%: zero uscite. Non è una garanzia per configurazioni potenziate, scambi o difficoltà diverse.
- Sovraccarico laterale moderato del 145%: 800 ms ancora agganciati in Rookie, Club e Pro; rilascio recuperabile. Sovraccarico prolungato o estremo provoca comunque il distacco.
- Il gas pieno continua a provocare uscite sulle piste tecniche. Sulle piste più ampie e sopraelevate può essere sostenuto: è una conseguenza voluta della guida più permissiva. La vecchia aspettativa “uscita obbligatoria su ogni pista” è stata aggiornata.
- Recupero di tre secondi, invariabilità al frame rate, nessuna fisica speciale per i bot, guida assistita, gare locali e tutorial.
- Cursore, +/−, preselezioni e tastiera isolati fra tre piloti. Perdita del focus e rientro spengono il gas.
- Venti livelli meccanici, sessanta acquisti distinti, conservazione del vecchio profilo, nessun pagamento ripetuto.
- Geometria finita e chiusa, corsie libere dal terreno, spirali con separazione verticale, superfici inclinate coerenti con la fisica.
- Decompressione GZIP e parser GLTFLoader reali: tutti i sessanta componenti presenti e alla scala dell’auto. Costruzione delle quindici scene Three.js e di tutti i tracciati: vertici e trasformazioni validi. Canvas simulato solo per le texture procedurali; questi test non effettuano rasterizzazione WebGL.

## Blender

Il programma locale si arresta prima dello script nella rilevazione Metal. Modelli generati con Blender 5.2 nel progetto gratuito 3D Jutsu `f751b35d-ea52-4fc7-b8e6-a8f802bd90f1`, revisione 1: 89 radici, 60 componenti e 27 props, più due elementi animabili. Esportazioni GLB e BLEND scaricate e controllate con SHA-256. Materiali e forme provengono dallo script originale `blender/build_worldkit.py`.

Il GLB contiene l’allestimento del catalogo, con parti ingrandite 6×; AssetKit normalizza la scala a 1 e la posizione a zero. La sorgente Blender conserva l’allestimento per ispezione. Il generatore locale esporta prima dell’allestimento: entrambe le forme sono supportate dal loader.

Render del catalogo ispezionato. Non è una schermata del gioco.

## Limiti di verifica

La connessione al browser si è bloccata ed è poi risultata indisponibile. Non sono state effettuate nuove prove visive dell’app, prove touch su telefono o misurazioni FPS. Gli screenshot della versione 5.0 restano uno storico, non attestano l’aspetto 6.0. Non sono stati acquistati componenti nel profilo del browser dell’utente.

Prima del prossimo affinamento visivo controllare desktop e mobile: garage con ciascuna categoria, leggibilità dei controlli aggiunti, gallerie nelle quattro telecamere e frame rate della doppia spirale.

Fisica arcade, nessun urto tra auto, multiplayer online o editor delle piste. Restano i limiti descritti nel README.

## Storico

La verifica della versione precedente è conservata in `docs/QA_WORLDS5.md`.
