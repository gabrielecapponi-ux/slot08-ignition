# Verifica SLOT 08 — Overdrive 4.0

18 novembre 2026. La fisica di Rivalry 3.0 resta invariata: scivolamento, perdita del pattino, rientro di tre secondi e hardware identico per umani e bot.

## Test automatici

**86 test Node superati** (`npm test`). Build statico e standalone completati.

- Tutte le 12 nuove piste: chiusura geometrica, continuità delle tangenti fra moduli, curvature finite in entrambe le corsie, scambi interamente sui rettilinei.
- Su tutte le nuove piste in Club: il gas fisso provoca un deragliamento; l’assistenza completa tre giri e uno scambio senza uscite. Restano i test precedenti su tre difficoltà e sulle prime tre piste.
- Coach su Coast Run: un controllo manuale che rilascia quando indicato completa un giro senza uscite. Il coach non modifica il comando; migliorare il freno sposta in avanti il punto consigliato.
- Tre giocatori: comandi indipendenti, scambi e uscite separati, stesso hardware; classifica per tempi reali. La gara aspetta gli altri e termina all’ultimo arrivo oppure 30 secondi dopo il primo.
- Gas a interruttore isolato per pilota; recuperare un’auto non cancella il gas delle altre.
- Migrazione da tre a quindici medaglie senza perdere crediti, record o potenziamenti. Premi assegnati una sola volta e solo nelle gare contro i bot.
- Audio: test del controllo del grafo con un dispositivo simulato. Motore, rilascio e gomme seguono lo stato; pausa e rimozione di un rivale azzerano le sue voci. Volumi separati e limitati a 0–100%. Lo scheduler non duplica battiti durante frame ripetuti e non accumula raffiche dopo un ritardo.
- Rimangono le regressioni su fisica a 120 Hz, recupero sbandata, errori dei bot, attraversamento del traguardo nello stesso tick, tutorial e parità della griglia.

## Verifiche nel browser

Browser integrato desktop, viewport 390×844 e 844×390. Sono prove responsive, non test su telefoni fisici.

- Selezione delle 15 piste e avvio locale in tre; P1 Spazio, P2 W e P3 I accelerano in modo indipendente.
- Gara locale assistita conclusa: P2 40,199 s, P1 41,125 s, P3 41,775 s; tutti senza uscite, classifica e pulsante rivincita corretti. Nessun premio accreditato.
- Tre uscite reali al primo tornante di Coast Run dopo aver lasciato acceso il gas. Recuperi e comandi separati.
- Su touch simulato, P2 e P3 accelerano mentre P1 rimane fermo. Tutti i pannelli restano visibili in verticale e orizzontale.
- Camera condivisa insegue il gruppo, allargando quando i piloti si separano. Etichette colorate P1/P2/P3 distinguono le auto.
- Coast Run in manuale: avviso ambra «FRENA TRA 4.0 M · 138 KM/H» a circa 237 km/h equivalenti. Strisce sulla pista prima del tornante.
- Audio attivabile; mixer modifica e conserva musica/effetti separatamente. Apertura mixer mette in pausa. Test di sintesi e browser senza misurazione acustica né prova con altoparlanti di telefoni fisici.
- Circuito finale Endless Summit caricato in 3D, con il rettilineo lungo e minimappa corretta. Fallback 2D provato sullo stesso circuito in tre: solo P2 accelera con W, senza errori di console.
- Un errore iniziale del marcatore prima del primo aggiornamento fisico è stato riprodotto e corretto con una guardia sul dato assente.

## Architettura e limiti

GT e primi tre diorami provengono dal progetto Blender/Higgsfield esistente. Le dodici nuove piste vengono costruite direttamente dai moduli geometrici usati dalla fisica: rail, slot, cordoli, moduli a X, supporti e bandiere. Nessuna immagine generata viene usata come sostituto della pista giocabile.

Musica ed effetti sono sintesi Web Audio originale, non un brano Suno. Il catalogo collegato non esponeva il modello Suno. Funzionano senza rete dopo il caricamento del gioco; per iniziare è necessaria l’attivazione audio dell’utente.

Nessun multiplayer online, collisioni fra auto o sincronizzazione del profilo. Pendenza visiva, con forze laterali calcolate sulla proiezione orizzontale. In gara locale il coach testuale è individuale; l’avviso audio di frenata e il marcatore 3D fanno riferimento a P1. Le auto condividono difficoltà, assistenza e potenziamenti. La gara locale non attribuisce crediti per evitare premi con avversari fermi. Su alcune tastiere il gas a interruttore evita i limiti dei tasti premuti simultaneamente.

Il fallback 2D resta giocabile; gli effetti tridimensionali, le bandiere e il marcatore di frenata sulla pista richiedono WebGL. Nessuna garanzia di frame rate su hardware non provato.
