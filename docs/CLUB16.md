# Club 16 — Ottica, movimento e tracciati

Aggiornamento del 22 novembre 2026.

## Implementato

- Camera e carrozzeria leggono la stessa posa interpolata, compresi orientamento, inclinazione e deriva. Il passaggio angolare fra +π e −π segue il percorso breve. Il rientro dopo un incidente non viene interpolato attraverso l’ambiente.
- La camera segue immediatamente la traslazione dell’auto e smorza soltanto il braccio orbitale. Il cambio fra camera frontale di partenza e inseguimento percorre un arco attorno alla vettura. Orizzonte senza rollio della camera.
- L’officina mantiene costante la distanza della lente durante la rotazione, eliminando il continuo avvicinamento/allontanamento dello sfondo.
- Pannello Grafica con Adattiva, Fluidità, Dettaglio e Ultra 4K/120. Contatore della risoluzione del canvas e degli fps effettivamente disegnati, aggiornato due volte al secondo.
- Rendering fino a 120 fps sui display compatibili; limite a 60 nel profilo Dettaglio. La simulazione conserva il passo fisso di 1/120 s già presente, indipendente dal rendering.
- Profilo Ultra: lato lungo fino a 3840 pixel, massimo 8.294.400 pixel, proporzioni del viewport conservate e limite hardware rispettato. Il rendering Ultra resta fisso; gli altri profili riducono la risoluzione in presenza di carico sostenuto e la recuperano lentamente.
- Filtro anisotropico per superfici viste di sbieco, ombre e riflessioni con budget per profilo, geometria statica senza ricomporre ogni trasformazione locale a ogni frame, cache dei modelli delle auto durante la gara.
- Materiale della pista con resina dielettrica, carbonio sotto trasparente e micro rilievo più fine. Conduttori metallici con UV, spazzolatura anisotropa e rugosità mipmapped; riflessi meno sovraesposti. Acqua con IOR 1,333, rilievo più contenuto e riflessione non metallica.
- 24 geometrie di campagna rinnovate dal mondo 3: Sector Rally, Switchback GP e Split Chicane. Dieci o dodici curve di raggio differente, settori tecnici, raccordi altimetrici e bivi sulle gare previste. Scambi collocati sui rettilinei. Prime dieci tappe e geometrie crossover/spirali conservate.
- Le 24 piste modificate usano una nuova chiave dei record; crediti, auto, stelle, difficoltà e potenziamenti non vengono azzerati.

## Verifiche e limiti

Vedi [QA](../QA.md). I controlli geometrici e temporali non dimostrano 4K/120 fps su hardware reale. I 120 fps dipendono dalla frequenza del display, dalle condizioni del browser e dalla potenza disponibile. Su iPhone il profilo predefinito resta Adattiva.

Non sono stati prodotti nuovi modelli Blender o animazioni After Effects in questo intervento. I miglioramenti dei materiali sono eseguiti nel renderer 3D. Questo aggiornamento non costituisce una certificazione di fotorealismo o qualità AAA.

## Prossima verifica

Misurare almeno tre minuti di gara su iPhone fisico e desktop 120 Hz: fps sostenuti e minimi, temperatura, risoluzione effettiva e fluidità in curva. Controllare visivamente la spazzolatura dei binari e i nuovi settori di notte e di giorno. Solo dopo tale prova ha senso fissare un profilo 4K/120 specifico per un dispositivo.
