# Club 13 — quattro corsie, officina e contatti

Aggiornamento del 22 novembre 2026. Il sito mantiene progressi, crediti e acquisti precedenti. I record nuovi sono separati perché il layout e i contatti cambiano.

## Implementato

- Campagna e Grand Prix: quattro auto, una persona contro tre piloti AI, quindici circuiti a quattro corsie. La campagna mantiene dieci mondi e cinque eventi per mondo. Non sono cinquanta geometrie uniche.
- Scambi adiacenti alternati: moduli 1↔2 / 3↔4 e moduli centrali 2↔3. Ai bordi una prenotazione aspetta uno scambio compatibile. Nessun salto diretto da corsia 1 a 4. Ponti, paraboliche, gallerie, giunti, binari, banchine e guardrail si allargano insieme alla carreggiata.
- Le quattro corsie richiedono un profilo di sopraelevazione dedicato, limitato a 0,28 radianti per evitare inversioni troppo brusche della curvatura sulle corsie esterne. Le impostazioni di aderenza Rookie/Club/Pro e il carico del gas sono quelli della versione 12, come richiesto. I potenziamenti del motore continuano a cambiare la guidabilità.
- Tamponamenti tra auto agganciate: rettangoli orientati, quota del ponte, impulso con perdita di energia, spinta e distacco del pattino per impatti forti. Rimosso il limite invisibile di velocità dietro una vettura. Gli avversari decidono di frenare attraverso lo stesso acceleratore; possono sbagliare. Il pilota può entrare in uno scambio occupato, rischiando il contatto.
- Uscite più basse e collisioni con il guardrail continuo: riflessione della velocità, dissipazione, rotazione e urti fra auto. Restano tre secondi di recupero. Il modello è una simulazione semplificata, non un motore di corpi rigidi completo o una scocca deformabile.
- Fondo più lucido sui binari e nelle traiettorie delle gomme, segnali di frenata e indicatori a bordo pista.
- Imprevisti facoltativi: foglie, polvere e umidità in tratti fissi e segnalati, con effetto sull'aderenza comune a tutti. Spenti per impostazione iniziale per conservare la difficoltà precedente. Non presenti dove mancano curve a quota bassa adatte; nessun oggetto compare sotto una vettura.
- Menu del club e officina ridisegnati. Catalogo di 69 miniature renderizzate realmente in Blender: 60 varianti, 6 riferimenti di serie, 3 gruppi meccanici. I tre gruppi meccanici sono immagini rappresentative, mentre l'anteprima sulla vettura mostra il prossimo livello reale. Anteprima gratuita, acquisto solo con Monta.
- Semaforo a cinque luci, presentazione d'arrivo con stelle animate, crediti, promozione e auto sbloccate. Movimento ridotto rispettato. Avanzamento automatico preesistente conservato, sospeso quando si apre Studio video.

## After Effects

Nel risultato: **Studio video → After Effects → Scarica composizione JSX**. Il file contiene i tempi della gara appena giocata, il semaforo, i contatti e l'arrivo. Sul computer aprire After Effects → File → Script → Esegui file di script. Si può scegliere una registrazione reale della gara come sfondo oppure annullare per la sola grafica. I marker permettono di rifinire il montaggio. Esempio nel repository: `motion/slot08-regia-demo.jsx`.

Il browser non controlla After Effects sul Mac e non registra automaticamente un video. Il collegamento Adobe trovato non espone il controllo remoto di After Effects. Il file JSX è stato verificato sintatticamente ma non eseguito nell'applicazione Adobe in questa sessione. Per una consegna finale servono prova desktop e render della composizione. Gli incidenti giocabili restano nel motore 3D, per reagire alle posizioni reali delle auto.

Riferimento ufficiale: https://helpx.adobe.com/it/after-effects/desktop/automate-in-after-effects/automate-animation/scripts.html

## Prossimi interventi

- Test del rendering WebGL e FPS su iPhone fisico e Mac con GPU; verifica delle corsie esterne nelle spirali.
- Esecuzione del JSX e rifinitura tipografica/video in After Effects.
- Danni visivi della carrozzeria, deformazione e sospensioni: ancora da sviluppare.
- Quattro persone sullo stesso dispositivo o online: non implementato; la nuova modalità è una persona contro tre AI. Le modalità locali per due/tre persone restano disponibili.
