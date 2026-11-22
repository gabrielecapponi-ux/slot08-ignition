"""Build the bespoke slanted Railcut display and pit pictograms from stroke drawings."""
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from math import hypot
from pathlib import Path
import sys
# Each pair describes a point on the drawing grid; a space raises the pen.
letters={
'A':'09 033010405369 0363','B':'0900608172430303 03637586776909','C':'81017003060718096979','D':'090040627467498909','E':'700003090979 0363','F':'090070 0363','G':'71017003060718096979857343','H':'0009 7079 0474','I':'1060 3539 1969 3530','J':'007075675949291907','K':'0009 700506 3579','L':'000979','M':'090032407079','N':'09007970','O':'105072767859291907030110','P':'090050718273540404','Q':'105072767859291907030110 4579','R':'090050718273540404 4479','S':'7101502011031454757678592979 291908','T':'0070 3039','U':'0007182959687770','V':'00394970','W':'0019345970','X':'0079 7009','Y':'003470 3439','Z':'00700979',
'0':'20506273776759391907030120','1':'123039 1969','2':'0211205061727354080979','3':'0110506172735434 546576776859291908','4':'6560 6050040575 6569','5':'700004546576776859291908','6':'610150201103060718295968777665540404','7':'00704939','8':'20506172735424641302011120 24546576776859291907061524','9':'7555140312021120506172737677685939',
}
letters.update({
 'A':'09032040536369 0464','B':'0900507173530404 04547677685909',
 'C':'71015020110307081929596978', 'D':'0900406172737677685909',
 'G':'710150201103070819295969787444','I':'1060 3039 1969',
 'J':'107076675949291907','W':'001939445970','T':'0070 4049',
 'C':'7150200107185879','G':'715020010718285869787454',
 'D':'0900507177785909','E':'70000979 0464','O':'205071777859291907030120',
 'S':'715020010314546576776859291908','6':'615020010718295968777665540404',
 '8':'20506172735424641302011120 24546576776859291907061524',
 '8':'2050617273542403021120 24546576776859291907061524',
 '9':'755524130211205061727377685939','0':'205071777859291907030120',
 '2':'0211205061727354080979','R':'0900507173530404 3479',
 'Q':'205071777859291907030120 4579','Y':'003470 3439','U':'0007182959697870',
 'P':'0900507173530404','A':'09042040546469 0464',
})
# Input grid x,y uses 0-9 with y descending. A butt-ended joined outline is
# drawn per polyline. Drawing commands are small and kept in the editable source.
def strokes(pen, commands, stroke, slant):
 for line in commands.split():
  pts=[]
  for i in range(0,len(line),2):
   q=(int(line[i])*85,int(line[i+1])*83)
   q=(q[0]+slant*(747-q[1])+65,760-q[1])
   if not pts or q!=pts[-1]:pts.append(q)
  if len(pts)<2:continue
  closed=pts[0]==pts[-1]
  if closed: pts.pop()
  norms=[]
  for a,b in zip(pts,pts[1:]+([pts[0]] if closed else [])):
   dx=b[0]-a[0];dy=b[1]-a[1];l=hypot(dx,dy);norms.append((-dy/l,dx/l))
  left=[];right=[]
  for i,(x,y) in enumerate(pts):
   a=norms[i-1] if i or closed else norms[0]
   b=norms[i%len(norms)] if i<len(norms) or closed else norms[-1]
   k=stroke*.5/max(.38,1+a[0]*b[0]+a[1]*b[1])
   dx=(a[0]+b[0])*k;dy=(a[1]+b[1])*k
   left.append((round(x+dx),round(y+dy)));right.append((round(x-dx),round(y-dy)))
  for contour in ([left,right[::-1]] if closed else [left+right[::-1]]):
   pen.moveTo(contour[0]);[pen.lineTo(p) for p in contour[1:]];pen.closePath()
def build(out):
 symbols=False
 name='Railcut Paddock' if symbols else 'Railcut GT'
 fb=FontBuilder(1000,isTTF=True)
 gs={}; metrics={}; cmap={}
 for idx,(g,d) in enumerate(letters.items()):
  pen=TTGlyphPen(None);strokes(pen,d,68 if symbols else 95,0 if symbols else .095)
  gs[g]=pen.glyph(); metrics[g]=(835 if symbols else 802,min((p[0] for p in getattr(gs[g],'coordinates',[(0,0)])),default=0))
  cmap[(0xe900+idx) if symbols else ord(g)]=g
  if not symbols and g.isalpha():cmap[ord(g.lower())]=g
 for g in ['.notdef','space']:
  pen=TTGlyphPen(None);gs[g]=pen.glyph();metrics[g]=(330,0)
 cmap[32]='space'
 fb.setupGlyphOrder(['.notdef','space']+[g for g in gs if g not in ['.notdef','space']]);fb.setupCharacterMap(cmap)
 fb.setupGlyf(gs);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=880,descent=-120)
 fb.setupNameTable(dict(familyName=name,styleName='Regular',uniqueFontIdentifier=name+' 1.0',fullName=name,psName=name.replace(' ','')))
 fb.setupOS2(sTypoAscender=880,sTypoDescender=-120,usWinAscent=900,usWinDescent=120);fb.setupPost();fb.setupMaxp();fb.font.flavor='woff';fb.save(out)
if __name__=='__main__':
 base=Path(sys.argv[1]);build(base/'railcut-gt.woff')
