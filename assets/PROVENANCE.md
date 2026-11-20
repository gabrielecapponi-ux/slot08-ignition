# Provenienza degli asset — Ignition

- Geometrie GT, piste, box, città, porto, materiali, scritte e render: creazione procedurale originale in Blender 5.2 tramite Higgsfield 3D Jutsu, progetto `8c2e8aed-d52f-4ac8-89af-cdbda6850d8c`, revisione 3. Versione locale ricostruita con i medesimi script in Blender 5.2.1 dopo un'interruzione del trasferimento remoto.
- `slot08.glb`: export glTF binario della scena locale; include `CAR_GT` e `LEVEL_0..2`. Non dipende da texture esterne.
- `poster.png`: render effettivo della scena, non una fotografia o concept generato.
- `blender/slot08.blend`: scena editabile. Script e dati delle traiettorie inclusi.
- Three.js 0.180.0: libreria MIT, file originali e licenza in `vendor/`.
- Audio: sintetizzato durante l'esecuzione; nessun campione musicale o registrazione di terzi.
- Riferimento prompts-chat documentato in `docs/DESIGN_BRIEF.md`; nessun codice o asset di quel prompt copiato.
- Nessuna affiliazione con marchi di giocattoli. Modello e marchio SLOT 08 originali.

## Worlds 6.0 — 20 novembre 2026

- Catalogo originale: 89 elementi (60 parti GT, 27 props, due elementi animabili). Creati con `blender/build_worldkit.py`, Blender 5.2, progetto gratuito 3D Jutsu `f751b35d-ea52-4fc7-b8e6-a8f802bd90f1`, revisione 1. Nessun modello acquistato o generazione a pagamento.
- Generazione remota usata perché Blender locale si arrestava nella rilevazione Metal. Sorgenti GLB e BLEND trasferiti con verifica SHA-256.
- GLB decodificato SHA-256: `e6428d9669fa43dc8e51334e067733bd7a2f5e3fcde620b4a9d480bab2ad0b95`.
- BLEND decodificato SHA-256: `140be738e4ac01d28eb16d4c79771017d43ee5557909374bba4eb923540e2be5`.
- Distribuzione senza perdita: `worldkit.glb.gz` e `worldkit.blend.xz`; le copie non compresse sono ricostruibili con `scripts/unpack-assets.py`. Posizioni e ingrandimenti da catalogo vengono normalizzati dal loader.
- Il render del catalogo 6.0 è stato ispezionato. `worldkit-preview.png` e gli screenshot Worlds 5 restano immagini storiche del catalogo precedente, non anteprime 6.0.
- Cieli, terreno e geometria esatta delle piste sono generati dal renderer Three.js; gli oggetti decorativi e i componenti della GT sono mesh Blender.
