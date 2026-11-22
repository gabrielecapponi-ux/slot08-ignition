"""Pack 69 real 3D product renders; run after parts-catalogue.py."""
from pathlib import Path
from PIL import Image
import json,sys
ROOT=Path(__file__).resolve().parents[2];folder=Path(sys.argv[1])
rows=['wing','wheels','hood','aero','lights','exhaust','mechanics'];W,H=256,192
atlas=Image.new('RGB',(11*W,7*H),(168,177,180));entries={}
for r,key in enumerate(rows):
    for c in range(3 if key=='mechanics' else 11):
        image=Image.open(folder/f'{r}-{c}.png').convert('RGB')
        if image.size!=(W,H):raise ValueError('Unexpected tile resolution')
        atlas.paste(image,(c*W,r*H))
        name=['motor','grip','brake'][c] if key=='mechanics' else f'{key}_{c}'
        entries[name]={'column':c,'row':r}
atlas.save(ROOT/'assets/parts-catalog.webp',quality=86,method=6)
(ROOT/'assets/parts-catalog.json').write_text(json.dumps({'image':'parts-catalog.webp','tileWidth':W,'tileHeight':H,'columns':11,'rows':7,'automaticReference':'Stock GT-08. Automatic appearance in-game follows installed upgrades.','entries':entries},ensure_ascii=False,indent=2)+'\n')
print('Atlas bytes:',(ROOT/'assets/parts-catalog.webp').stat().st_size)
