"""SLOT Sans: original text face drawn from editable centreline curves.
No existing font outlines are read. Output includes a TrueType inspection source,
WOFF2 webfont, and a type specimen. Coordinates are font design units (1000/em).
"""
from pathlib import Path
from math import hypot, cos, sin, pi, atan2
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from PIL import Image,ImageFont,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets';OUT.mkdir(exist_ok=True)
GLYPHS={}; WIDTHS={}
# Geometry is deliberately smooth and open: 74-unit strokes at a 510-unit x-height.
def path(*cmd):return list(cmd)
def M(x,y):return ('M',x,y)
def L(x,y):return ('L',x,y)
def C(a,b,c,d,e,f):return ('C',a,b,c,d,e,f)
def ellipse(cx,cy,rx,ry):
 k=.55228475
 return path(M(cx+rx,cy),C(cx+rx,cy+ry*k,cx+rx*k,cy+ry,cx,cy+ry),C(cx-rx*k,cy+ry,cx-rx,cy+ry*k,cx-rx,cy),C(cx-rx,cy-ry*k,cx-rx*k,cy-ry,cx,cy-ry),C(cx+rx*k,cy-ry,cx+rx,cy-ry*k,cx+rx,cy))
def line(*points):return [M(*points[0])]+[L(*p) for p in points[1:]]
def add(ch,w,*paths):GLYPHS[ch]=paths;WIDTHS[ch]=w
# Capitals have subtly asymmetrical bowls and generous counters.
add('A',650,line((75,0),(280,660),(335,700),(575,0)),line((150,225),(494,225)))
add('B',625,line((95,0),(95,700)),path(M(95,700),L(320,700),C(500,700,548,625,548,525),C(548,420,470,360,320,360),L(95,360)),path(M(95,360),L(330,360),C(520,360,566,288,566,180),C(566,70,487,0,320,0),L(95,0)))
add('C',635,path(M(555,605),C(493,679,426,710,323,710),C(153,710,78,570,78,350),C(78,130,153,-10,323,-10),C(424,-10,499,32,558,108)))
add('D',665,line((95,0),(95,700)),path(M(95,700),L(300,700),C(490,700,585,575,585,350),C(585,125,490,0,300,0),L(95,0)))
add('E',575,line((510,700),(95,700),(95,0),(515,0)),line((95,359),(450,359)))
add('F',555,line((95,0),(95,700),(505,700)),line((95,365),(439,365)))
add('G',675,path(M(580,610),C(514,677,436,710,333,710),C(155,710,78,570,78,350),C(78,130,155,-10,333,-10),C(438,-10,520,30,585,88),L(585,330),L(362,330)))
add('H',655,line((95,0),(95,700)),line((560,0),(560,700)),line((95,355),(560,355)))
add('I',290,line((145,0),(145,700)),line((95,700),(195,700)),line((95,0),(195,0)))
add('J',480,path(M(395,700),L(395,165),C(395,44,346,-10,231,-10),C(157,-10,102,21,60,78)))
add('K',620,line((95,0),(95,700)),line((550,700),(95,285)),line((277,450),(568,0)))
add('L',535,line((95,700),(95,0),(485,0)))
add('M',800,line((90,0),(90,700),(400,160),(710,700),(710,0)))
add('N',690,line((95,0),(95,700),(595,0),(595,700)))
add('O',685,ellipse(342,350,264,360))
add('P',600,line((95,0),(95,700)),path(M(95,700),L(315,700),C(479,700,548,614,548,503),C(548,387,475,310,315,310),L(95,310)))
add('Q',685,ellipse(342,350,264,360),line((393,147),(614,-64)))
add('R',630,line((95,0),(95,700)),path(M(95,700),L(315,700),C(479,700,548,614,548,503),C(548,387,475,320,315,320),L(95,320)),line((325,320),(565,0)))
add('S',600,path(M(525,613),C(457,681,386,709,287,709),C(154,709,76,637,76,536),C(76,430,180,396,299,359),C(441,315,530,269,530,162),C(530,49,442,-10,306,-10),C(204,-10,127,20,65,89)))
add('T',605,line((48,700),(557,700)),line((302,700),(302,0)))
add('U',665,path(M(95,700),L(95,230),C(95,57,177,-10,333,-10),C(488,-10,570,57,570,230),L(570,700)))
add('V',635,line((60,700),(318,0),(575,700)))
add('W',890,line((58,700),(221,0),(445,575),(669,0),(832,700)))
add('X',620,line((70,700),(550,0)),line((550,700),(70,0)))
add('Y',610,line((60,700),(305,330),(550,700)),line((305,330),(305,0)))
add('Z',610,line((70,700),(540,700),(70,0),(540,0)))
# Lowercase is independently drawn; a/e/g have open forms and a tall x-height.
add('a',570,ellipse(278,250,190,260),path(M(470,510),L(470,60),C(470,13,484,0,510,0)))
add('b',580,line((95,0),(95,735)),path(M(95,400),C(143,478,212,510,299,510),C(443,510,502,400,502,250),C(502,100,440,-10,295,-10),C(209,-10,143,25,95,94)))
add('c',520,path(M(445,437),C(400,485,345,510,274,510),C(143,510,78,409,78,250),C(78,91,143,-10,274,-10),C(345,-10,400,18,445,66)))
add('d',580,line((485,0),(485,735)),path(M(485,400),C(437,478,368,510,281,510),C(137,510,78,400,78,250),C(78,100,140,-10,285,-10),C(371,-10,437,25,485,94)))
add('e',555,path(M(470,75),C(415,13,344,-10,268,-10),C(140,-10,78,92,78,250),C(78,408,150,510,278,510),C(403,510,477,419,477,281),L(82,281)))
add('f',350,path(M(132,0),L(132,560),C(132,705,204,762,321,727)),line((42,500),(295,500)))
add('g',580,path(M(480,510),L(480,0),C(480,-155,407,-205,280,-205),C(205,-205,141,-179,102,-146)),path(M(480,406),C(430,479,366,510,285,510),C(141,510,78,400,78,250),C(78,100,140,-10,285,-10),C(371,-10,437,25,480,94)))
add('h',585,line((95,0),(95,735)),path(M(95,360),C(147,466,221,510,311,510),C(432,510,490,433,490,302),L(490,0)))
add('i',250,line((125,0),(125,500)),ellipse(125,682,7,7))
add('j',270,path(M(155,500),L(155,-44),C(155,-167,117,-205,24,-205)),ellipse(155,682,7,7))
add('k',535,line((95,0),(95,735)),line((465,510),(95,179)),line((253,321),(473,0)))
add('l',285,path(M(110,735),L(110,66),C(110,13,135,-3,205,0)))
add('m',860,line((95,0),(95,500)),path(M(95,369),C(140,465,199,510,272,510),C(375,510,425,441,425,304),L(425,0)),path(M(425,369),C(470,465,529,510,602,510),C(705,510,765,441,765,304),L(765,0)))
add('n',585,line((95,0),(95,500)),path(M(95,360),C(147,466,221,510,311,510),C(432,510,490,433,490,302),L(490,0)))
add('o',575,ellipse(287,250,209,260))
add('p',580,line((95,-205),(95,500)),path(M(95,400),C(143,478,212,510,299,510),C(443,510,502,400,502,250),C(502,100,440,-10,295,-10),C(209,-10,143,25,95,94)))
add('q',580,line((485,-205),(485,500)),path(M(485,400),C(437,478,368,510,281,510),C(137,510,78,400,78,250),C(78,100,140,-10,285,-10),C(371,-10,437,25,485,94)))
add('r',390,line((95,0),(95,500)),path(M(95,354),C(156,470,231,519,342,500)))
add('s',490,path(M(417,444),C(369,491,313,511,246,511),C(145,511,79,454,79,380),C(79,300,161,274,245,249),C(339,223,419,195,419,119),C(419,41,345,-10,243,-10),C(167,-10,105,13,62,55)))
add('t',370,path(M(140,666),L(140,115),C(140,15,199,-19,310,15)),line((44,500),(310,500)))
add('u',585,path(M(95,500),L(95,193),C(95,58,154,-10,274,-10),C(362,-10,438,35,490,141)),line((490,0),(490,500)))
add('v',525,line((58,500),(263,0),(467,500)))
add('w',775,line((58,500),(205,0),(387,426),(570,0),(717,500)))
add('x',510,line((65,500),(445,0)),line((445,500),(65,0)))
add('y',525,path(M(467,500),L(247,-65),C(198,-176,152,-205,67,-197)),line((58,500),(263,0)))
add('z',500,line((68,500),(432,500),(68,0),(432,0)))
# Tabular figures with distinct 0/O and 1/l silhouettes.
add('0',600,ellipse(300,350,214,360),line((220,230),(380,470)))
add('1',600,line((160,560),(310,700),(310,0)),line((148,0),(478,0)))
add('2',600,path(M(85,573),C(112,663,190,710,302,710),C(435,710,511,638,511,529),C(511,410,413,335,284,230),L(83,54),L(83,0),L(521,0)))
add('3',600,path(M(92,623),C(153,680,215,710,304,710),C(435,710,504,638,504,537),C(504,436,432,365,294,365),L(239,365)),path(M(294,365),C(456,365,523,301,523,184),C(523,61,435,-10,303,-10),C(206,-10,129,20,77,84)))
add('4',600,line((399,0),(399,700),(76,222),(534,222)))
add('5',600,path(M(504,700),L(116,700),L(98,379),C(162,414,217,432,290,432),C(439,432,518,351,518,215),C(518,71,431,-10,295,-10),C(204,-10,135,18,77,77)))
add('6',600,path(M(480,642),C(424,689,374,710,299,710),C(142,710,78,569,78,327),C(78,96,150,-10,305,-10),C(443,-10,523,82,523,215),C(523,347,442,431,311,431),C(208,431,135,382,78,303)))
add('7',600,line((72,700),(529,700),(243,0)))
add('8',600,ellipse(300,532,207,178),ellipse(300,178,225,188))
add('9',600,path(M(120,58),C(176,11,226,-10,301,-10),C(458,-10,522,131,522,373),C(522,604,450,710,295,710),C(157,710,77,618,77,485),C(77,353,158,269,289,269),C(392,269,465,318,522,397)))
# Punctuation. Short circles gain rounded caps rather than sharp point squares.
add('.',230,ellipse(115,18,9,9));add(',',240,path(M(136,35),C(136,-38,115,-77,70,-111)))
add(':',250,ellipse(125,366,8,8),ellipse(125,18,8,8));add(';',250,ellipse(125,366,8,8),path(M(136,35),C(136,-38,115,-77,70,-111)))
add('!',280,line((140,700),(140,196)),ellipse(140,18,9,9))
add('?',530,path(M(75,594),C(110,671,179,710,269,710),C(393,710,459,638,459,544),C(459,461,408,409,330,361),C(261,316,249,266,249,194)),ellipse(249,18,9,9))
add('-',360,line((65,280),(295,280)));add('–',560,line((65,280),(495,280)));add('—',900,line((65,280),(835,280)));add('_',560,line((48,-130),(512,-130)))
add('+',560,line((280,495),(280,65)),line((65,280),(495,280)));add('=',560,line((65,375),(495,375)),line((65,185),(495,185)))
add('/',410,line((65,-100),(345,760)));add('\\',410,line((65,760),(345,-100)))
add('(',350,path(M(277,780),C(173,643,121,488,121,286),C(121,79,173,-67,277,-200)))
add(')',350,path(M(73,780),C(177,643,229,488,229,286),C(229,79,177,-67,73,-200)))
add('[',350,line((280,760),(115,760),(115,-160),(280,-160)));add(']',350,line((70,760),(235,760),(235,-160),(70,-160)))
add("'",210,line((115,735),(95,555)));add('"',350,line((110,735),(90,555)),line((270,735),(250,555)))
add('’',230,path(M(133,746),C(133,673,115,626,70,591)));add('‘',230,path(M(97,591),C(97,664,115,711,160,746)))
add('“',400,*[[(cmd[0],)+tuple(x+dx if j%2==0 else x for j,x in enumerate(cmd[1:])) for cmd in p] for dx in [0,170] for p in GLYPHS['‘']])
add('”',400,*[[(cmd[0],)+tuple(x+dx if j%2==0 else x for j,x in enumerate(cmd[1:])) for cmd in p] for dx in [0,170] for p in GLYPHS['’']])
add('%',800,ellipse(200,553,119,151),ellipse(600,147,119,151),line((160,0),(640,700)))
add('€',640,path(M(564,606),C(499,679,427,710,325,710),C(156,710,101,570,101,350),C(101,130,156,-10,325,-10),C(427,-10,499,31,564,104)),line((49,441),(437,441)),line((49,263),(403,263)))
add('&',740,path(M(640,0),L(205,460),C(89,579,120,710,257,710),C(386,710,409,604,340,521),C(276,447,82,349,82,194),C(82,63,190,-10,308,-10),C(465,-10,570,125,616,340)))
add('#',650,line((236,700),(155,0)),line((499,700),(417,0)),line((78,467),(585,467)),line((53,233),(560,233)))
add('*',420,line((210,710),(210,365)),line((62,626),(358,449)),line((62,449),(358,626)))
add('@',885,path(M(625,520),L(580,245),C(563,142,693,139,742,220),C(795,305,804,396,776,507),C(744,649,640,733,455,733),C(209,733,81,561,81,336),C(81,89,236,-70,464,-70),C(585,-70,675,-44,750,10)),ellipse(443,341,146,189))
add('<',530,line((447,567),(83,280),(447,-7)));add('>',530,line((83,567),(447,280),(83,-7)))
add('|',250,line((125,780),(125,-200)));add('·',270,ellipse(135,280,7,7));add('…',630,ellipse(115,18,9,9),ellipse(315,18,9,9),ellipse(515,18,9,9));add('•',330,ellipse(165,280,20,20))
# Curves are flattened into centreline samples, offset with round joins/caps.
def flatten(cmds):
 pts=[];p=(0,0)
 for cmd in cmds:
  if cmd[0] in 'ML':p=(cmd[1],cmd[2]);pts.append(p)
  else:
   a=p;b=(cmd[1],cmd[2]);c=(cmd[3],cmd[4]);d=(cmd[5],cmd[6])
   steps=max(6,int((hypot(b[0]-a[0],b[1]-a[1])+hypot(c[0]-b[0],c[1]-b[1])+hypot(d[0]-c[0],d[1]-c[1]))/25))
   for i in range(1,steps+1):
    t=i/steps;u=1-t;pts.append((u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]))
   p=d
 return pts

def contour(pen,pts):
 pts=[(round(x),round(y)) for x,y in pts]
 pen.moveTo(pts[0]);[pen.lineTo(p) for p in pts[1:]];pen.closePath()
def stroke(pen,cmds,weight=74):
 points=flatten(cmds);closed=hypot(points[0][0]-points[-1][0],points[0][1]-points[-1][1])<.1
 if closed:points.pop()
 r=weight/2;norms=[]
 if closed and max(max(p[0] for p in points)-min(p[0] for p in points),max(p[1] for p in points)-min(p[1] for p in points))<weight:
  cx=sum(p[0] for p in points)/len(points);cy=sum(p[1] for p in points)/len(points);radius=max(hypot(p[0]-cx,p[1]-cy) for p in points)+r
  contour(pen,[(cx+radius*cos(-i*pi/12),cy+radius*sin(-i*pi/12)) for i in range(24)]);return
 for a,b in zip(points,points[1:]+([points[0]] if closed else [])):
  dx=b[0]-a[0];dy=b[1]-a[1];length=hypot(dx,dy);norms.append((-dy/length,dx/length))
 left=[];right=[]
 for i,(x,y) in enumerate(points):
  a=norms[i-1] if i or closed else norms[0];b=norms[i%len(norms)] if i<len(norms) or closed else norms[-1]
  ratio=r/max(.45,1+a[0]*b[0]+a[1]*b[1]);dx=(a[0]+b[0])*ratio;dy=(a[1]+b[1])*ratio
  left.append((x+dx,y+dy));right.append((x-dx,y-dy))
 if closed:contour(pen,left);contour(pen,right[::-1]);return
 # Join open ends with semicircular caps; clockwise outer contour.
 last=points[-1];angle=atan2(norms[-1][1],norms[-1][0]);end=[(last[0]+r*cos(angle-i*pi/8),last[1]+r*sin(angle-i*pi/8)) for i in range(1,8)]
 first=points[0];angle=atan2(-norms[0][1],-norms[0][0]);start=[(first[0]+r*cos(angle-i*pi/8),first[1]+r*sin(angle-i*pi/8)) for i in range(1,8)]
 contour(pen,left+end+right[::-1]+start)
# Named accents permit real lowercase Italian and European menu copy.
accents={'à':('a','grave'),'è':('e','grave'),'é':('e','acute'),'ì':('i','grave'),'ò':('o','grave'),'ù':('u','grave'),'á':('a','acute'),'í':('i','acute'),'ó':('o','acute'),'ú':('u','acute'),'â':('a','circ'),'ê':('e','circ'),'î':('i','circ'),'ô':('o','circ'),'û':('u','circ'),'ä':('a','dier'),'ë':('e','dier'),'ï':('i','dier'),'ö':('o','dier'),'ü':('u','dier'),'ñ':('n','tilde'),'ç':('c','cedilla')}
accents.update({k.upper():(v[0].upper(),v[1]) for k,v in list(accents.items())})
for ch,(base,kind) in accents.items():
 w=WIDTHS[base];cx=w/2;y=820 if base.isupper() else 620
 paths=list(GLYPHS[base]);
 if base=='i':paths=[GLYPHS['i'][0]]
 if kind=='grave':paths.append(line((cx-65,y+108),(cx+35,y)))
 if kind=='acute':paths.append(line((cx-35,y),(cx+65,y+108)))
 if kind=='circ':paths.append(line((cx-90,y),(cx,y+95),(cx+90,y)))
 if kind=='dier':paths +=[ellipse(cx-75,y+35,5,5),ellipse(cx+75,y+35,5,5)]
 if kind=='tilde':paths.append(path(M(cx-110,y+20),C(cx-65,y+110,cx+20,y-60,cx+105,y+40)))
 if kind=='cedilla':paths.append(path(M(cx,0),L(cx-28,-85),C(cx+92,-85,cx+60,-204,cx-50,-178)))
 add(ch,w,*paths)
# Core arrows and symbols used in the timing UI.
for ch,points in [('←',((445,105),(200,350),(445,595))),('→',((155,105),(400,350),(155,595)))]:add(ch,600,line(*points),line((80,350),(520,350)))
add('↔',730,line((240,120),(50,350),(240,580)),line((490,120),(680,350),(490,580)),line((50,350),(680,350)))
add('−',560,*GLYPHS['+'][1:]);add('×',560,line((100,100),(460,460)),line((100,460),(460,100)))
add('°',350,ellipse(175,600,100,110))
add('★',700,line(*[(350+(295 if i%2==0 else 125)*sin(i*pi/5),350+(295 if i%2==0 else 125)*cos(i*pi/5)) for i in range(10)]+[(350,645)]))
add('☆',700,*GLYPHS['★']);add('✓',590,line((85,330),(240,110),(520,630)))

def build():
 fb=FontBuilder(1000,isTTF=True);gs={};metrics={};cmap={}
 for ch,paths in GLYPHS.items():
  name='uni%04X'%ord(ch);pen=TTGlyphPen(None)
  for p in paths:stroke(pen,p)
  glyph=pen.glyph();gs[name]=glyph
  metrics[name]=(WIDTHS[ch],min((p[0] for p in getattr(glyph,'coordinates',[(0,0)])),default=0));cmap[ord(ch)]=name
 for name in ['.notdef','space']:
  pen=TTGlyphPen(None)
  if name=='.notdef':stroke(pen,line((80,0),(80,700),(450,700),(450,0),(80,0)),50)
  gs[name]=pen.glyph();metrics[name]=(280 if name=='space' else 530,0)
 cmap[32]='space';cmap[160]='space'
 fb.setupGlyphOrder(['.notdef','space']+[k for k in gs if k not in ['.notdef','space']]);fb.setupCharacterMap(cmap);fb.setupGlyf(gs);fb.setupHorizontalMetrics(metrics)
 fb.setupHorizontalHeader(ascent=1000,descent=-250,lineGap=0)
 fb.setupNameTable(dict(familyName='Slot Sans',styleName='Regular',uniqueFontIdentifier='SLOT08 Slot Sans 1.0',fullName='Slot Sans',psName='SlotSans-Regular',version='Version 1.0',copyright='Original typeface drawn for SLOT08. No third-party outlines.'))
 fb.setupOS2(sTypoAscender=1000,sTypoDescender=-250,sTypoLineGap=0,usWinAscent=1000,usWinDescent=250,sxHeight=510,sCapHeight=700,usWeightClass=450)
 fb.setupPost();fb.setupMaxp();fb.font['head'].flags |= 8
 fb.save(OUT/'slot-sans.ttf');fb.font.flavor='woff2';fb.save(OUT/'slot-sans.woff2')
 # Make a screen-resolution specimen, drawn at 3x then reduced for stable antialiasing.
 scale=3;im=Image.new('RGB',(1080*scale,650*scale),'#0b191c');d=ImageDraw.Draw(im)
 def txt(x,y,text,size,color='#eaf4ef'):
  font=ImageFont.truetype(str(OUT/'slot-sans.ttf'),size*scale);d.text((x*scale,y*scale),text,font=font,fill=color)
 txt(48,20,'SLOT SANS / CLUB 14',32,'#f4c38a')
 txt(48,83,'Un carattere disegnato per leggere la gara.',20)
 txt(48,135,'14 px  •  Motore / Pneumatici / Cerchi / Banco prova',14)
 txt(48,170,'16 px  •  La prossima curva richiede precisione. Qualifiche · 2 giri',16)
 txt(48,212,'20 px  •  Più velocità, più controllo. La tua scuderia è pronta.',20)
 txt(48,268,'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789',20)
 txt(48,310,'abcdefghijklmnopqrstuvwxyz à è é ì ò ù À È É Ì Ò Ù',20)
 txt(48,356,'Il pilota 1 è in pista. 100% gas · 03:28.751 · 1 / 4 · +240 CR',16)
 txt(48,397,'Scegli un componente: l’anteprima è gratuita. Monta · 260 CR',14)
 txt(48,436,'8 stelle aprono il mondo successivo. Il motore Lv 20 è completo.',14)
 txt(48,487,'Aa Ee Gg Rr 0O 1Il 6b 9q     ! ? € % + − = # & @',24)
 txt(48,552,'Disegno originale · x-height alta · terminali morbidi · numeri tabulari',14,'#a5bcb5')
 im.resize((1080,650),Image.Resampling.LANCZOS).save(OUT/'slot-sans-specimen.png')
 print('Built',len(cmap),'characters',OUT/'slot-sans.woff2')
if __name__=='__main__':build()
