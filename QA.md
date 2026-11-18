# Verifica SLOT 08 — Ignition
18 novembre 2026. Verifiche sul progetto e sulla build, non una certificazione per ogni dispositivo.

## Automazione
34 test Node superati. Inclusi: chiusura e tangenti delle piste; metrica e curvatura delle corsie; forza centripeta e deragliamento; inerzia e frenata; recupero di tre secondi senza doppia penalità; conteggio giri; pausa; indipendenza dal frame rate; scambio richiesto fuori X, esecuzione e annullamento; tutorial con azioni reali; premi non duplicati; sblocco e modifiche dei parametri fisici dopo l'acquisto; storage assente/corrotto. L'assistenza completa tutte le combinazioni 3 piste × 3 difficoltà con uno scambio e zero deragliamenti nella simulazione. In Pro manuale, tenere sempre il gas provoca un deragliamento.

## Browser reale
Anteprima desktop 1280×720 e viewport 390×844 nel browser integrato:
- Modelli Blender caricati, nessun errore/warning di console durante le gare 3D.
- Tutorial completato tramite Spazio, rilascio e Invio; cambiata realmente corsia.
- Gara Sunset completata: tre giri, secondo posto, zero uscite, 155 CR; sbloccata Skyline.
- Acquistato motore livello 1: saldo 155 → 55 CR e acquisto successivo disabilitato senza fondi.
- Gara Skyline completata: primo posto, zero uscite, 180 CR; sbloccata Neon Harbor.
- Gara Neon Harbor completata anche durante la verifica mobile: primo posto, zero uscite, 180 CR.
- Dopo il ricaricamento: crediti, potenziamento e circuiti sbloccati conservati.
- Camera drone, bordo pista e dall'alto azionabili; controlli principali leggibili sul layout mobile.
- In Pro manuale osservato il messaggio FUORI PISTA e il conto alla rovescia di rientro; il gas a interruttore si è disattivato all’uscita.
- Canvas2D forzato: circuito tecnico caricato, conto alla rovescia e HUD funzionanti, nessun errore di console.
- File unico SLOT08.html aperto via HTTP locale: caricamento del GLB incorporato riuscito, impostazioni e avvio gara funzionanti.

## Asset e prestazioni
Scena 3D Jutsu revisione 3: tre radici LEVEL, 70 parti della GT, 406 oggetti mesh, 19.674 poligoni sorgente e nessuna immagine esterna mancante. Il file locale è stato rigenerato con gli stessi script in Blender 5.2.1 e importato nel gioco.

La geometria viene raggruppata per materiale al caricamento. Osservazione durante un'inquadratura drone del porto: 21 chiamate di disegno, 35.714 triangoli visibili, 34 geometrie residenti. Numeri dipendenti da camera e frustum; non sono un massimo garantito. Non si promette uno specifico frame rate su dispositivi non provati.

## Limiti dichiarati
Non verificato l'avvio diretto file:// in questa sessione: la politica del browser di verifica non consente quella navigazione. Il packaging usa Blob ES modules e asset data URI e offre anche il server locale incluso. Non sono state provate tutte le combinazioni di browser, GPU, potenziamenti e preferenze di sistema.

Le IA non collidono fra loro o con il giocatore. Il ponte modifica l'altezza del modello, non la dinamica longitudinale o il carico verticale. Il recupero avviene al punto dell'uscita. Camera e introduzione rispettano prefers-reduced-motion tramite percorso di codice; la preferenza del sistema non è stata modificata nella prova.
