"""Original SLOT08 circular instrument icons. SVGs are authored here, not copied.
Run /usr/bin/python3 scripts/art/slot-icons.py. Inkscape renders the specimen.
Symbol IDs are `slot-{name}`. Individual SVGs work as CSS masks or inline images.
"""
from pathlib import Path
import subprocess
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets';ICON=OUT/'icons14';ICON.mkdir(exist_ok=True)
# 64-unit instrument dial. The broken bezel and two register marks are shared.
BEZEL='<path d="M27 5.5A27 27 0 1 0 37 5.5" opacity=".48" stroke-width="1.4"/><path d="M30 5h4M7 32h3M54 32h3" opacity=".72" stroke-width="1.4"/>'
ART={
'wheel': '<circle cx="32" cy="32" r="17"/><circle cx="32" cy="32" r="5"/><path d="M32 15v12m16 0-11 4m5 15-7-10m-13 10 7-10m-13-9 11 4"/><path d="M19 20l3 3m20-3-3 3m-20 20 3-3m20 3-3-3" stroke-width="1.2" opacity=".7"/>',
'motor': '<path d="M19 24h25v19H19zM24 19h15v5M16 30h3m25-3h4v13h-4M14 27v13m7-20h-5v5"/><path d="m32 27-5 9h6l-2 7 8-12h-7z" stroke-width="1.6"/><path d="M23 47h17" opacity=".6"/>',
'garage': '<path d="m15 28 17-13 17 13M19 27v20h26V27M23 47V30h18v17M23 35h18m-18 5h18"/><path d="M28 20h8" opacity=".6"/>',
'arcade': '<path d="M21 49V17c9-7 15 7 24 0v20c-9 7-15-7-24 0"/><path d="M29 17v20m8-17v20M21 27c9-7 15 7 24 0" stroke-width="1.5"/><path d="M21 18c3-2 6-2 8-1v10c-2-1-5-1-8 1zM37 20c3 1 6 0 8-2v9c-2 2-5 3-8 2zM29 27c3 0 5 2 8 2v10c-3 0-5-2-8-2z" fill="currentColor" stroke="none"/>',
'chrono': '<circle cx="32" cy="35" r="15"/><path d="M32 20v-6m-5 0h10m7 10 4-4M32 35l7-8M20 35h2m20 0h2M32 45v2"/><circle cx="32" cy="35" r="2" fill="currentColor" stroke="none"/>',
'duel': '<path d="m18 18 28 28m0-28L18 46M17 17l9 3-6 6zM47 17l-9 3 6 6zM15 40l9 9m16-1 9-9"/><path d="m32 21 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor" stroke="none"/>',
'audio': '<path d="M17 27h7l9-8v26l-9-8h-7zM40 25c5 4 5 10 0 14m5-20c9 7 9 19 0 26"/><path d="M14 48h7m4 0h8m4 0h7" stroke-width="1.3" opacity=".55"/>',
'fullscreen': '<path d="M18 27v-9h9m10 0h9v9m0 10v9h-9m-10 0h-9v-9M18 18l9 9m19-9-9 9m9 19-9-9m-19 9 9-9"/>',
'play': '<path d="m26 19 20 13-20 13z" stroke-width="2.7"/><path d="M19 25v14" stroke-width="1.4" opacity=".6"/>',
'pause': '<path d="M22 20h6v24h-6zM36 20h6v24h-6z" stroke-width="2.5"/>',
'trophy': '<path d="M23 17h18v13c0 8-4 12-9 12s-9-4-9-12zM23 21h-7v5c0 6 3 9 9 10m16-15h7v5c0 6-3 9-9 10M32 42v7m-8 0h16"/><path d="m32 23 1.5 4.5H38l-3.5 3 1.5 4.5-4-2.5-4 2.5 1.5-4.5-3.5-3h4.5z" stroke-width="1.3"/>',
'spark': '<path d="m37 16-17 20h12l-5 13 18-22H33z"/><path d="m19 17 3 4m23 22 3 4M15 28l5 1m24 6 5 1" stroke-width="1.5" opacity=".75"/>',
'paint': '<path d="m18 21 10-7 18 22-10 7zM20 24l16-12M29 43c-2 3-5 7-5 9m22-11c-3 4-5 6-5 9a5 5 0 0 0 10 0c0-3-2-5-5-9z"/><path d="m23 27 13-10M32 37l9-7" stroke-width="1.3" opacity=".7"/>',
'chevron': '<path d="m28 20 12 12-12 12" stroke-width="3"/><path d="M18 32h20" stroke-width="1.5" opacity=".65"/>',
'reset': '<path d="M19 27a15 15 0 1 1 1 14M17 17v11h11"/><path d="M32 24v10l6 4" stroke-width="1.7"/>',
'brake': '<circle cx="32" cy="32" r="15"/><circle cx="32" cy="32" r="5"/><path d="M40 17h8v18h-8z" fill="#102326"/><path d="m25 22-2 4m-2 7 2 4m4 5h5m4-23-4 2m6 19 2-4" stroke-width="2"/>',
}
LABELS={'wheel':'Cerchi','motor':'Motore','garage':'Box','arcade':'Arcade','chrono':'Time trial','duel':'Duello','audio':'Audio','fullscreen':'Schermo','play':'Partenza','pause':'Pausa','trophy':'Trofeo','spark':'Energia','paint':'Livrea','chevron':'Avanti','reset':'Riprova','brake':'Freni'}
def artwork(name):return f'<g fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">{BEZEL}{ART[name]}</g>'
for name in ART:
 (ICON/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" color="#edf5ee" role="img" aria-label="{LABELS[name]}">{artwork(name)}</svg>\n')
symbols='\n'.join(f'<symbol id="slot-{name}" viewBox="0 0 64 64">{artwork(name)}</symbol>' for name in ART)
(OUT/'slot-icons.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg"><defs>\n{symbols}\n</defs></svg>\n')
# Preview deliberately contains no white tiles. Each icon sits inside a tinted circular lens.
shapes=[]
for i,name in enumerate(ART):
 col=i%8;row=i//8;x=44+col*126;y=48+row*175
 shapes.append(f'<g transform="translate({x} {y})" color="#edf5ee"><circle cx="42" cy="42" r="42" fill="#193034" fill-opacity=".75"/><g transform="scale(1.3125)">{artwork(name)}</g></g>')
sheet=f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="430" viewBox="0 0 1080 430"><rect width="1080" height="430" fill="#0b191c"/>{"".join(shapes)}</svg>'
preview=OUT/'slot-icons-specimen.svg';preview.write_text(sheet)
subprocess.run(['inkscape',str(preview),'--export-type=png',f'--export-filename={OUT/"slot-icons-specimen.png"}'],check=True,capture_output=True)
im=Image.open(OUT/'slot-icons-specimen.png').convert('RGB');draw=ImageDraw.Draw(im)
font=ImageFont.truetype(str(OUT/'slot-sans.ttf'),16)
small=ImageFont.truetype(str(OUT/'slot-sans.ttf'),14)
for i,name in enumerate(ART):
 x=86+(i%8)*126;y=147+(i//8)*175
 draw.text((x,y),LABELS[name],font=font,fill='#edf5ee',anchor='mt')
draw.text((44,395),'SLOT 08 / 16 strumenti originali · contorno circolare · fondo trasparente',font=small,fill='#a5bcb5')
im.save(OUT/'slot-icons-specimen.png')
print('Created',len(ART),'original icons:',', '.join(ART))
