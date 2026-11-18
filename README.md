# SLOT 08 — IGNITION

Gioco slot-car 3D originale per browser, senza account, dipendenze CDN o servizi a pagamento. Three.js 0.180.0 è incluso. Auto, piste e scenografie sono modellate in Blender; progetto Higgsfield 3D Jutsu incluso nei riferimenti.

## Gioca online

**[Apri SLOT 08 Ignition](https://gabrielecapponi-ux.github.io/slot08-ignition/)** — funziona dal telefono e dal computer; il Mac non deve rimanere acceso.

Sul telefono, tieni premuto **ACCELERA** per dare gas e tocca **SCAMBIO** per prenotare il cambio corsia. Puoi anche attivare **Gas a interruttore** nel menu: un tocco accende il gas, il successivo lo spegne. Il gioco si adatta a schermo verticale e orizzontale. La prima partenza include un tutorial pratico.

Progressi e crediti si salvano nel browser del dispositivo: non sono sincronizzati fra telefono e Mac. Non serve un account GitHub per giocare.

## Avvio e sviluppo locali

```sh
npm start
```
Apri http://127.0.0.1:4173. Non occorre `npm install`; serve Node 20 o superiore. `npm run build` crea `dist/`, pronto per un qualsiasi hosting statico.

`npm run standalone` genera `SLOT08.html`, un singolo file con codice, motore grafico e modelli incorporati. Il link online è il modo consigliato per giocare dal telefono; le anteprime dei file scaricati possono limitare JavaScript.

## Pubblicazione GitHub Pages

Il sito usa il ramo **main**, cartella **/(root)**. Tutti i percorsi sono relativi, incluso l'import map di Three.js, quindi funziona anche sotto `/slot08-ignition/`. Il file `.nojekyll` disabilita l'elaborazione Jekyll. Non servono chiavi API, CDN o un server applicativo.

Per aggiornare il sito: esegui `npm test`, verifica il gioco con `npm start`, poi pubblica le modifiche su `main`. GitHub Pages distribuisce automaticamente l'ultima revisione. Il sorgente, il GLB e la scena Blender sono inclusi nel repository; i pacchetti generati sono esclusi dal versionamento.

## Comandi

| Comando | Azione |
| --- | --- |
| Spazio / ACCELERA / pressione sulla pista | Gas; rilasciare rallenta |
| Invio / SCAMBIO | Prenota lo scambio alla prossima X; seconda pressione annulla |
| Shift / freccia destra o sinistra | Alternative a Invio |
| C | Drone → bordo pista → panoramica → dall'alto |
| P / Esc | Pausa |
| Gas a interruttore | Un clic/tasto avvia il gas, un altro lo spegne |

La prima partenza apre una scuola guida con tre prove reali. Puoi saltarla o ripeterla. Due pulsanti grandi funzionano anche con mouse e puntatori assistivi. Il gas si disattiva quando la finestra perde il focus; la gara va in pausa.

## Gare e progressione
Tre circuiti: Sunset Speedway 32,14 m; Skyline Eight 32,99 m (ponte); Neon Harbor 43,42 m. Gara da tre giri contro due IA o Time Attack libero. Completa una gara per sbloccare il livello successivo. Guadagni 105–180 crediti secondo posizione e uscite; compra tre livelli di motore, magneti o freno (100 / 180 / 280 CR). Le stelle premiano posizione e guida pulita. Progressi e record restano nel browser tramite localStorage; senza storage il gioco funziona ma non conserva i progressi dopo la chiusura.

Rookie aumenta il margine di tenuta; Club usa la taratura base; Pro riduce il margine e rende più rapidi gli avversari. La guida assistita è indipendente e dosa il gas prima delle curve. Nessuna sterzata manuale. Il tachimetro mostra km/h equivalenti in scala 1:18: `velocità modello × 3,6 × 18`. Non è una misura della velocità reale del giocattolo.

## Motore e scelte tecniche
- Passo fisso 120 Hz; rendering indipendente con interpolazione. Recupero frame limitato per evitare grandi salti dopo una sospensione.
- Domanda laterale `F = m v² |κ|`; deragliamento se supera la tenuta magnetica. Frenata al rilascio e resistenza aerodinamica.
- Velocità misurata lungo la corsia effettiva: la metrica corregge corsie interne/esterne e scambi quintici. L'ovale e l'otto sono analitici; il porto usa Catmull-Rom con tabella di lunghezza precalcolata e derivate analitiche.
- L'auto deragliata scivola lungo la tangente con attrito e gravità, mentre il progresso sul giro resta fermo. Ritorna nello stesso punto dopo tre secondi. Il timer continua: nessuna seconda penalità duplicata.
- Enter prenota un cambio persistente; l'esecuzione avviene esclusivamente nella sezione X. Le IA e l'assistenza percorrono la stessa fisica, compresa la curva dello scambio.
- I record sono distinti per pista, modalità, difficoltà, assistenza e potenziamenti.
- Una sola camera e un solo renderer; Canvas2D è il fallback per dispositivi senza WebGL. Audio sintetico opt-in. Asset statici raggruppati per materiale; pixel ratio limitato.

## Struttura
```
src/core/       configurazione, matematica, ciclo a passo fisso
src/track/      geometria e catalogo circuiti
src/physics/    stato auto, accelerazione, tenuta, deragliamento
src/ai/         previsione curve e controllo del gas
src/game/       gare, tutorial, progressione e tarature
src/input/      tastiera, mouse, pulsanti e gas a interruttore
src/camera/     regia, inseguimento e accessibilità del movimento
src/render/     Three.js e alternativa Canvas2D
src/ui/         telemetria e minimappa
src/audio/      sintesi del motore e segnali
blender/        scena editabile e generatori delle geometrie
assets/         modello GLB e render
vendor/         Three.js e licenza MIT
scripts/        server locale e packaging
tests/         test di fisica, progressione e assistenza
```

## Modificare le scene
Apri `blender/slot08.blend`. `CAR_GT` è la radice del modellino; `LEVEL_0`, `LEVEL_1`, `LEVEL_2` sono i tre diorami. Le tre radici sono separate nello spazio in Blender; il gioco centra solo quella attiva. Il file GLB include tutte le geometrie senza texture esterne.

`node scripts/export-track-data.mjs` genera i campioni condivisi. `blender/upgrade_ignition.py` documenta la costruzione della versione Ignition sulla scena v1; non eseguirlo ripetutamente sulla v2 perché aggiunge dettagli alla GT. Per rigenerare da zero, usa `blender --background --python blender/rebuild.py` dopo aver esportato i dati del tracciato. Lo script ricostruisce una scena nuova; non lanciarlo su lavoro non salvato. L'esportazione finale usa trasformazioni/modificatori applicati. La camera di gioco è controllata da `src/camera/rig.js`, non dalla camera Blender.

Progetto 3D Jutsu: https://higgsfield.ai/3d-jutsu/8c2e8aed-d52f-4ac8-89af-cdbda6850d8c — scena Ignition revisione 3. Il modello locale è stato rigenerato con gli stessi script in Blender 5.2.1 dopo l'interruzione del trasferimento.

## Verifica
```sh
npm test
```
Vedi `QA.md` per prove e limiti. È un prototipo giocabile: niente multiplayer, collisioni fra auto, editor piste, loop verticali o salti balistici vincolati alla pista. La fisica laterale usa la proiezione orizzontale del tracciato; la pendenza del ponte è visiva, senza variazione del carico magnetico. Non è un prodotto affiliato a Hot Wheels o Carrera.
