# Club 16 — verifica del 22 novembre 2026

**169 test superati** nella suite completa; controlli mirati di camera e scheduling ripetuti dopo la rifinitura finale. Build statica e HTML autonomo generati.

## Movimento e prestazioni

- Interpolazione condivisa fra camera e carrozzeria, testata su curve inclinate a 60 e 120 fps simulati. Test specifici per il passaggio angolare ±π, il rientro dopo un’uscita e la transizione fra camera di partenza e inseguimento.
- Distanza orbitale costante nell’officina; nove carrozzerie interamente contenute nelle quattro aree di anteprima durante 16 rotazioni.
- Scheduling verificato con callback schermo a 60, 120 e 144 Hz: il passo della simulazione resta 120 Hz e il rendering rispetta l’obiettivo selezionato.
- Buffer Ultra verificato a 3840×2160 su viewport 16:9, con limite hardware e budget pixel rispettati; formato verticale proporzionato. Adattamento della risoluzione provato con cadenza a 60/120 Hz e carico simulato.
- 24 piste riviste: minimo raggio, quattro corsie finite, distanza fra sezioni non adiacenti, assenza di scambi in curva e conservazione dei bivi.
- Materiali: conduttori con UV e rugosità mipmapped, carbonio dielettrico e geometrie finite su tutte le 50 tappe.

La verifica GPU e su iPhone fisico resta da eseguire: i test non certificano 120 fps reali né il fotorealismo. Nessun nuovo screenshot di gameplay è presentato come prova di questa versione. La verifica browser locale precedente era bloccata; il sito pubblicato nel browser di controllo richiedeva accesso ChatGPT.

## Verifiche precedenti

# Club 15.1 — inquadratura e colore · 22 novembre 2026

**161 test superati** con `npm test`; build statica e HTML autonomo generati correttamente.

Verifica matematica delle nove carrozzerie GLB: 16 angoli di rotazione per ciascuno dei quattro viewport (1365×930, 390×844, 844×390 e 320×568). Tutti gli estremi del modello restano nell’area libera dai menu; il centro coincide con il centro dell’anteprima. Nuovo test della camera di inseguimento durante le curve e nei tunnel, oltre alla conservazione delle tonalità nella resa più satura delle vernici.

Il controllo visivo dell’anteprima locale è stato bloccato dalla policy del browser. Non sono quindi dichiarati un collaudo visivo GPU né una prova su iPhone fisico. I test di proiezione non sostituiscono questi controlli. Le verifiche browser della versione 15.0 riportate sotto appartengono alla versione precedente.

## Verifiche precedenti

# Club 15.0 — verifica del 22 novembre 2026

**158 test superati** con `npm test`. Nessun cambiamento alla difficoltà, al motore o alle regole di salvataggio della 14.

## Geometrie e asset

- Tutte le 50 tappe: barriere opache, coordinate finite, montanti con piedi e quote coerenti; raggi di prova dalla carreggiata intercettano le facce visibili del guardrail.
- Scenografia nuova: quattro asset Blender, materiali opachi, basi a quota zero, distanze da entrambe le diramazioni e separazione fra landmark; fondazioni livellate.
- Nove auto: contratti di mesh e materiali, scala, proiezione, attributi finiti e modelli distinti. 40.004–57.682 triangoli per auto, 1,07–1,64 MB per GLB.
- Gallerie: pareti opache e tetto nascosto quando la vista deve vedere l’interno, senza simulare trasparenza delle pareti.
- Fallback software: nuovo test di profondità per pixel; due test verificano superfici che si incrociano, indipendenza dall’ordine dei triangoli e vetro davanti/dietro la carrozzeria.
- Suite preesistente: campagna, qualifiche, 50 gare simulate, sblocchi, collisioni, comandi e conservazione del profilo.

## Controlli visivi

I GLB definitivi delle auto sono stati reimportati in Blender e ispezionati dal davanti e dal retro. Verificati specchi ancorati, griglia, alettone, fanali e diffusore. Ispezionati anche i nuovi ambienti e un’esportazione delle mesh runtime di pista e guardrail in Blender. Sono render offline di geometria, non screenshot WebGL.

Nel browser: avvio Club 15, catalogo delle nove auto aggiornato, officina con carrozzeria senza i precedenti tagli fra triangoli, passaggio a Grand Prix, semafori, quattro concorrenti, gas, contatto tra auto, recupero e pausa. Il saldo di prova resta invariato. La correzione della profondità è stata controllata visivamente dopo aver osservato il difetto.

Il browser remoto ha WebGL esplicitamente disabilitato e usa il renderer di compatibilità. Non è stato effettuato un collaudo visivo GPU dell’intero circuito, né test FPS/memoria/touch su iPhone fisico. Il fallback software corregge le compenetrazioni della carrozzeria ma non riproduce i riflessi PBR del renderer 3D.

Build statica e HTML autonomo generati dai sorgenti. After Effects non è stato eseguito in questa sessione; rimane l’esportazione JSX esistente. Le miniature sono migliorate e originali, ma non equivalenti alla fotografia di riferimento.

## Verifiche precedenti

# Club 14.0 verifica del 22 novembre 2026

## Esito

**153 test superati** con `npm test`. Tutte le 50 gare della campagna completate in simulazione con guida assistita. Sono controllate anche unicità delle 50 geometrie, chiusura delle quattro corsie, raccordi dei rami separati, mesh Three.js finite per ogni evento, collisioni e barriere del bivio, due giri di qualifica, ordinamento e posizionamento della griglia, eliminazione, progressi per auto, assetti di fine sviluppo, evoluzione dei rivali e backup/ripristino della partita.

Il reset richiesto avviene solo una volta sul dispositivo, dopo aver salvato la partita precedente. Il test di quota esaurita verifica che un errore non distrugga i progressi. Corretto anche il risultato al quarto posto: non mostra stelle che non sono state assegnate.

## Controlli visivi e interattivi

- Home desktop con cinque modalità, Slot Sans, icone circolari e pannelli trasparenti; selezione Arcade, anteprima del percorso reale e tappe bloccate.
- Avvio delle qualifiche, HUD a due giri, audio e gas a interruttore. Qualifiche complete, classifica cronometrata e partenza dalla griglia verificate nei test di simulazione; non completate interattivamente nel browser.
- Officina mobile e reparto cerchi: miniature, navigazione tra reparti, anteprima vettura e saldo visibile.
- Layout provati con iframe a 390×844, 844×390 e 320×568. Nessun overflow orizzontale delle pagine e del pannello garage controllati. In orizzontale gas e scambio misurano 150×76 pixel CSS e restano ai lati; pausa 48×48.
- Il browser remoto non dispone di WebGL: la verifica visiva usa il fallback 2D e l’officina software. I materiali carbonio/clearcoat, i riflessi, i nuovi fumi e le nuove mesh sono implementati nel renderer 3D, ma non sono stati collaudati visivamente su GPU in questa sessione.
- Restano da provare su iPhone fisico touch, memoria, FPS, temperatura e fullscreen iOS. Le viste in iframe verificano il layout, non le prestazioni del telefono.

Build statica e HTML autonomo vengono generati dai sorgenti. Il JSX per After Effects rimane un’esportazione: non è un collegamento remoto attivo all’app Adobe.

## Verifiche delle versioni precedenti

# Club 13.0 — verifica del 22 novembre 2026

## Esito

`npm test`: **141 test superati**. Comprendono costruzione delle geometrie Three.js di tutte le quindici piste sia a due sia a quattro corsie, 50 gare di campagna completate in simulazione con guida assistita, conservazione del profilo e dei ricambi, collegamento delle quattro corsie attraverso gli scambi, impulsi nei tamponamenti, assenza di collisioni fra quote diverse, guardrail, condizioni facoltative, risultati e confezionamento sintattico del JSX After Effects.

La tenuta di base e il sovraccarico al massimo gas sono quelli della versione 12. Le nuove paraboliche a quattro corsie hanno un profilo dedicato (massimo 0,28 radianti) per mantenere regolare la corsia esterna. Il test del dosaggio analogico ora separa le vetture all'avvio: una vettura più veloce può altrimenti tamponare quella davanti, comportamento intenzionale.

## Verifiche nel browser

- Caricamento, lobby, officina, catalogo cerchi e anteprima meccanica.
- Anteprima Turbofan e del motore senza acquisto: saldo invariato a 275 CR.
- Semaforo a cinque luci, quattro vetture e classifica con Tu/Apex/Volt/Nitro.
- Layout mobile in viewport 390×844, 844×390 e 320×568 tramite iframe di prova. Nessun overflow orizzontale nei pannelli controllati. Pulsanti primari da 44 pixel o più, gas e scambio ai lati in orizzontale, miniature ricambi visibili in verticale.
- Il browser remoto non crea un contesto WebGL: verifica interattiva effettuata sul fallback 2D e sull'officina software. Le nuove geometrie 3D sono costruite e validate dai test, ma non rasterizzate via GPU in questa sessione.
- Non effettuati test touch su iPhone fisico, misure di FPS GPU o verifica nativa del fullscreen iOS. Risultati/premi verificati dalla simulazione; la sequenza d'arrivo completa non è stata ispezionata nel browser.

## After Effects

L'export JSX è autonomo, valida le stringhe e include composizione, cinque luci, marker degli eventi, cartelli contatto e risultato. Verificato come JavaScript compatibile con la sintassi usata da ExtendScript; non eseguito in Adobe After Effects, non disponibile in questo ambiente. Non è una connessione remota al Mac e non registra la gara: può importare una registrazione scelta dall'utente.

## Limiti del modello

Contatti tra rettangoli orientati, impulso e dissipazione; uscite con gravità e guardrail campionati. Nessuna deformazione della carrozzeria, ruota indipendente o soluzione di corpi rigidi completa. Restano da provare visivamente le condizioni limite dei contatti nelle spirali su GPU reale. Una persona contro tre AI; il multiplayer locale rimane a due/tre persone.
