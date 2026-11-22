# Club 14 Stories

22 novembre 2026. Stessa simulazione di base e comandi: Spazio per accelerare, Esc per prenotare uno scambio. La campagna ricomincia da zero una sola volta, al primo avvio della versione 14 sul dispositivo, conservando la partita precedente.

## Implementato

- Home con Arcade, Time Trial, Grand Prix, Ultimo rimasto e Club locale. Slot Sans è un nuovo font originale (153 caratteri, minuscole, accenti italiani e cifre tabulari). Sedici icone vettoriali circolari, pannelli trasparenti e navigazione orizzontale dell’officina.
- 50 geometrie distinte per gli eventi della campagna, in cinque famiglie con varianti per mondo: sprint, crossover a quote diverse, chicane, spirali ascendenti/discendenti e due rami separati. Restano 15 circuiti liberi. Anteprima isometrica disegnata dalla geometria effettiva delle quattro corsie.
- Qualifiche facoltative di due giri. Le auto non si urtano in questa fase; il miglior giro determina la griglia sfalsata della gara di tre giri. Si aspettano gli avversari per un massimo di 35 secondi dopo l’arrivo del giocatore; un rivale senza giri validi resta in fondo.
- Ultimo rimasto: quattro auto, prima eliminazione dopo 45 secondi e successive ogni 35; vince l’unica superstite. Nessun limite di tre giri in questa modalità.
- Dieci brevi capitoli, con anteprima e titolo del circuito, selezione delle tappe sbloccate, due stelle per accedere alla gara successiva e otto per aprire il mondo successivo. Dopo il risultato automatico appare per sei secondi il prossimo circuito; intervenire nel menu ferma la partenza automatica.
- Motore, gomme/magneti, freno, ricambi, vernice e vittorie separati per auto. Non si trasferiscono automaticamente i livelli comprando o selezionando un altro telaio. I ricambi rimangono visibili in anteprima prima dell’acquisto.
- A motore livello 20, assetti gratuiti Bilanciato, Sprint (+4,5% spinta, −1,5% tenuta) ed Endurance (+6% freno motore, −2% velocità). I valori si applicano solo alla macchina selezionata, senza superare il limite dei livelli.
- I tre rivali sviluppano l’assetto solo tra le gare: livello base del mondo più una correzione arrotondata da −1 a +2, dipendente dai risultati. Nessuna variazione di potenza o tenuta mentre si corre. Il loro sviluppo non copia il motore del giocatore.
- Carbonio twill procedurale con materiale Physical, strato trasparente, mappe di ruvidità e micro rilievo; conduttori metallici a sezione bombata più lucidi. Le luci ambientali producono riflessi variabili con il punto di vista. Nessun ray tracing o riflesso planare dinamico.
- Fumo di sgommata con particelle morbide e orientate verso la camera. Tamponamenti e uscite a catena restano fisici e non vengono sostituiti con un filmato.
- Animazioni di ingresso nel menu e nell’anteprima, cambi reparto, semafori, stelle del risultato e illuminazione della vittoria; le transizioni rispettano la preferenza di movimento ridotto.

## Implementazione

`src/track/championship.js` costruisce cinque famiglie parametriche deterministiche per dieci mondi. `src/track/fork.js` separa le due coppie di corsie con una funzione sin⁴ e raccordi di posizione, pendenza e curvatura continui. Pose delle auto, mesh della strada, binari, vista 2D, anteprima e barriere condividono la deviazione. Nessuno scambio può attraversare il vuoto del bivio. Le curve brevi limitano l’ampiezza dell’inclinazione in base alla lunghezza per evitare rampe laterali impossibili per un motore di serie.

`RaceSession.beginQualifying()` apre la sessione cronometrata; `finishQualifying()` ordina i migliori tempi; `startGrid()` mantiene l’ordine e ricrea la gara. Il record distingue qualifiche, gara, pista, modello e assetto. `Profile` conserva i dati per chassis e un rating distinto per ciascun rivale. `Journey` coordina scelta modalità, capitoli e anteprime.

Il profilo principale resta `slot08.profile.v2`. Prima dell’azzeramento richiesto viene salvato `slot08.before-club14`. Un errore di scrittura impedisce l’azzeramento. Il campo `season:14` impedisce di ripeterlo ai caricamenti successivi. Il pulsante Ripristina la partita precedente conserva a sua volta la partita nuova in `slot08.club14-current-backup`. Tutti i dati restano locali al dispositivo/browser: non c’è sincronizzazione cloud.

## Verifica riproducibile

```sh
npm test
npm run build
npm run standalone
```

I test coprono 50 gare complete con assistenza, unicità e chiusura delle geometrie, i giunti delle biforcazioni, mesh finite, qualifiche, griglia, eliminazione, progressione per auto, recupero del salvataggio, errore di quota, assetti e rivali. QA.md riporta l’esito della verifica finale e i limiti del browser di prova.

## Ancora da sviluppare

- Backflip e loop verticali: richiedono una geometria tridimensionale con orientamento completo del pattino, forza normale e perdita di contatto. Non sono simulati con un’animazione finta nella versione 14.
- Più di quattro vetture in una gara e multiplayer in rete. Il locale rimane a due o tre giocatori sullo stesso dispositivo.
- Riflessi dinamici degli oggetti vicini, danni e deformazioni delle carrozzerie, telecamere anti-occlusione più evolute, scene narrative recitate e filmati originali per ogni mondo.
- Collaudo del renderer 3D e delle prestazioni su GPU desktop e iPhone reale. La resa AAA rimane un obiettivo artistico; questa versione non ne certifica il raggiungimento.
- After Effects: resta l’esportazione JSX della gara. L’app Adobe sul Mac non è controllata a distanza; i materiali e le animazioni interattive funzionano nel renderer del gioco.
