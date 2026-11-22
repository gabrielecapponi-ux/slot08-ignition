"""Build the SLOT 08 fleet in Blender. Run blender -b -P this_file -- output_directory."""
import bpy, bmesh, math, sys, os
from collections import defaultdict
from math import sin,cos,pi,sqrt,exp
from mathutils import Vector
from pathlib import Path

# Tail overhang, nose overhang, width, deck heights, cabin bounds/crest, roof height, body family.
CARS=[
 ('GT-08',.151,.154,.084,[.057,.067,.059,.050,.045],[-.103,-.064,-.013,.043],.097,'gt'),
 ('RS Touring',.159,.154,.083,[.068,.077,.076,.069,.059],[-.110,-.063,.015,.072],.136,'saloon'),
 ('LM Prototipo',.163,.162,.094,[.053,.061,.064,.048,.033],[-.074,-.027,.012,.071],.106,'lm'),
 ('Rally',.135,.144,.084,[.071,.084,.08,.066,.061],[-.118,-.10,.012,.077],.142,'rally'),
 ('Berlinetta',.161,.169,.084,[.053,.065,.068,.061,.042],[-.118,-.057,-.012,.047],.111,'classic'),
 ('Endurance GT',.163,.153,.091,[.057,.072,.068,.058,.043],[-.108,-.048,.004,.066],.116,'endurance'),
 ('Targa',.151,.157,.086,[.057,.071,.071,.062,.049],[-.100,-.054,.001,.056],.115,'targa'),
 ('Gruppo C',.174,.166,.095,[.054,.063,.060,.047,.032],[-.081,-.029,.018,.085],.104,'groupc'),
 ('Hypercar',.164,.159,.095,[.051,.065,.063,.050,.035],[-.105,-.058,-.004,.081],.110,'hyper')]
OUT=Path(sys.argv[sys.argv.index('--')+1]);OUT.mkdir(parents=True,exist_ok=True)
def mat(name,col,metal,rough,coat=0,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=coat
 if emission:p.inputs['Emission Color'].default_value=(*col,1);p.inputs['Emission Strength'].default_value=emission
 return m
def mix(x,points):
 if x<=points[0][0]:return points[0][1]
 for (a,y),(b,z) in zip(points,points[1:]):
  if x<=b:
   t=(x-a)/(b-a);t=t*t*(3-2*t);return y+(z-y)*t
 return points[-1][1]
def build(index):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 name,tail,nose,width,heights,roofx,roofh,family=CARS[index]
 proto=family in ('lm','groupc','hyper')
 materials={
 'paint':mat('MAT_lime_enamel',(.92,.57,.012),.26,.235,1.0),
 'glass':mat('MAT_smoked_glass',(.025,.041,.049),.10,.095,1.0),
 'seat':mat('MAT_seat',(.065,.074,.079),.03,.59),
 'ivory':mat('MAT_race_ivory',(.82,.81,.73),.07,.46),
 'tyre':mat('MAT_vulcanized_rubber',(.019,.021,.024),.02,.70),
 'black':mat('MAT_carbon',(.010,.014,.019),.08,.32,.7),
 'trim':mat('MAT_anthracite',(.06,.071,.082),.66,.28),
 'alloy':mat('MAT_forged_aluminium',((.060,.070,.080) if family=='gt' else (.28,.32,.35)),.88,.235),
 'disc':mat('MAT_turned_rotor',(.22,.25,.27),.86,.36),
 'lamp':mat('MAT_headlamp',(.78,.91,1),.35,.16,.5,1.7),
 'red':mat('MAT_tail_lens',(.74,.012,.017),.32,.18,.7,.45),
 'copper':mat('MAT_brass',(.44,.23,.082),.72,.33),
 'grille':mat('MAT_recessed_grille',(.003,.004,.005),0,.84),
 'lens':mat('MAT_optical_lens',(.12,.20,.26),.15,.08,1),
 'chrome':mat('MAT_optical_reflector',(.72,.78,.8),.95,.12),
 'blue':mat('MAT_tyre_transfer',(.065,.17,.34),.05,.53),
 'whiteink':mat('MAT_tyre_ink',(.76,.79,.76),.02,.58),
 'accent':mat('MAT_coral_marking',(.9,.025,.012),.12,.22,.8)}
 glass=materials['glass'];glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.76
 glass.surface_render_method='BLENDED'
 # Independent geometry buckets preserve the stock-part visibility contract.
 buckets=defaultdict(lambda:[[],[]])
 def surface(group,material,rows,loop=False):
  v,f=buckets[group,material];start=len(v);n=len(rows[0]);v.extend(p for row in rows for p in row)
  for i in range(len(rows)-1):
   for j in range(n if loop else n-1):
    a=start+i*n+j;b=start+i*n+(j+1)%n
    f.append((a,b,b+n,a+n))
 def tube(group,material,points,r,n=6):
  rows=[]
  for i,p in enumerate(points):
   d=(Vector(points[min(len(points)-1,i+1)])-Vector(points[max(0,i-1)])).normalized()
   side=d.cross(Vector((0,0,1)))
   if side.length<.02:side=d.cross(Vector((1,0,0)))
   side.normalize();up=d.cross(side);rows.append([tuple(Vector(p)+r*(side*cos(2*pi*j/n)+up*sin(2*pi*j/n))) for j in range(n)])
  surface(group,material,rows,True)
 def shell(group,material,points):
  # Caps are used only on planar, convex faces.
  v,f=buckets[group,material];start=len(v);v.extend(points);f.append(tuple(range(start,start+len(points))))
 def segment(group,material,a,b,r):tube(group,material,[a,b],r)
 def revolve(group,material,center,profile,n=40):
  x,y,z=center;rows=[[(x+r*cos(i*2*pi/n),y+h,z+r*sin(i*2*pi/n)) for i in range(n)] for h,r in profile]
  surface(group,material,rows,True)
 def lobe(x,center,sigma):return exp(-((x-center)/sigma)**2)
 wheelx=[-.091,.096]
 def half(x):
  u=(x+tail)/(tail+nose)
  return width*mix(u,[(0,.83 if proto else .87),(.085,.98),(.18,1),(.47,.88 if proto else .945),(.77,1),(.89,.97),(1,.64 if proto else .84)])
 def deck(x):
  u=(x+tail)/(tail+nose)
  return mix(u,list(zip([0,.24,.49,.79,1],heights)))
 def arch(x):return max([.024]+[.033+sqrt(max(0,.0355**2-(x-a)**2)) if abs(x-a)<=.0355 else .024 for a in wheelx])
 def well(x):return sum(lobe(x,a,.031) for a in wheelx)
 def shoulder(x):return max(deck(x)-.003+(.021 if proto else .011)*well(x),arch(x)+.0025)
 def top(x,q):
  # Shallow central bonnet and raised sculpted wheel pod.
  h=deck(x);s=shoulder(x);u=abs(q)
  # Defined shoulder ridge with a gently recessed bonnet; avoid a single soap-bar dome.
  ridge=.0022*exp(-((u-.71)/.11)**2)*max(0,1-abs(x-.09)/.16)
  return h+(s-h)*u**3.0+.0012*sin(pi*u)+ridge
 # Actual notch in each side sill for independent rubber tyres.
 stations=sorted(set([round(-tail+(tail+nose)*i/68,6) for i in range(69)]+[round(a+.0355*cos(j*pi/18),6) for a in wheelx for j in range(19)]))
 rows=[]
 for x in stations:
  w=half(x);s=shoulder(x);bottom=arch(x);arc=bottom>.027
  row=[(x,q*w,top(x,q)) for q in [-.91,-.70,-.48,-.25,0,.25,.48,.70,.91]]
  for sign in [1,-1]:
   side=[(x,sign*w,s-.0012),(x,sign*w*1.003,bottom+(s-bottom)*.52),(x,sign*w*.998,bottom),(x,sign*w*(.78 if arc else .93),bottom-.001),(x,sign*w*.65,.023)]
   row.extend(side if sign==1 else list(reversed(side)))
  rows.append(row)
 # Remove the deck underneath the cabin; dark tub walls back the opening.
 a,b,c,d=roofx
 cutstart=next(j for j,x in enumerate(stations) if x>=a+.011)
 cutend=next(j for j,x in enumerate(stations) if x>=d-.010)
 first,last=(2,6) if proto else (1,7)
 for j in range(len(stations)-1):
  for k in range(len(rows[0])):
   if cutstart<=j<cutend and first<=k<last:continue
   m=(k+1)%len(rows[0]);surface('GT_body','paint',[[row[k],row[m]] for row in rows[j:j+2]])
 for index0 in (first,last):
  surface('GT_cockpit_tub','black',[[row[index0],(row[index0][0],row[index0][1],.040)] for row in rows[cutstart:cutend+1]])
 for j in [cutstart,cutend]:
  surface('GT_cockpit_tub','black',[[point,(point[0],point[1],.040)] for point in rows[j][first:last+1]])
 surface('GT_cockpit_floor','black',[[(row[i][0],row[i][1],.040) for i in (first,last)] for row in rows[cutstart:cutend+1]])
 for row in [rows[0],rows[-1]]:shell('GT_body','paint',row)
 # Cabin cross-sections. Roof, pillar frames and glass are distinct removable objects.
 a,b,c,d=roofx;cabw=width*(.58 if proto else .79)
 def cab(x,t):
  height=mix(x,[(a,0),(b,1),(c,1),(d,0)])
  base=deck(x)+.001
  crest=base+(roofh-base)*height
  w=cabw*mix(x,[(a,.87),(b,.94),(c,1),(d,.92)])
  cross=mix(abs(t),[(0,1),(.60,.985),(.72,.94),(.83,.74),(1,.03)])
  return (x,t*w*(1-.16*height*max(0,1-abs(t))),base+(crest-base)*cross)
 xs=[a+(d-a)*i/44 for i in range(45)]
 ts=[-1+i/12 for i in range(25)]
 for i in range(len(xs)-1):
  for j in range(len(ts)-1):
   x=(xs[i]+xs[i+1])*.5;t=(ts[j]+ts[j+1])*.5
   isroof=b<=x<=c and abs(t)<.67
   group,m=('GT_roof','paint') if isroof else ('GT_glazing','glass')
   if family=='targa' and isroof and x>b+.009:continue
   surface(group,m,[[cab(xi,tj) for tj in ts[j:j+2]] for xi in xs[i:i+2]])
 for sign in [-1,1]:
  tube('GT_roof_pillar','trim',[cab(x,sign*.995) for x in xs],.0016)
  for x1,x2 in [(a,b),(d,c)]:
   pts=[cab(x1+(x2-x1)*j/16,sign*(.98-.33*j/16)) for j in range(17)]
   tube('GT_roof_pillar','paint',pts,.0027 if not proto else .002)
  tube('GT_roof_seal','black',[cab(b+(c-b)*j/10,sign*.67) for j in range(11)],.0012)
  if family in ('rally','saloon','targa','gt','endurance'):tube('GT_roof_pillar','black',[cab(b+.008,sign*t) for t in [.65,.74,.83,.92,1]],.0038)
  # Discernible door shut lines, flush latch and rear cooling ribs.
  px0=b-.003;px1=min(.051,d-.007)
  door=[(px0,.95,deck(px0)),(px0-.005,1.005,.049),(px0+.007,.995,.034),(px1-.014,.996,.032),(px1,.999,.049),(px1,.965,deck(px1))]
  tube('GT_door_seam','black',[(x,sign*half(x)*q,z) for x,q,z in door],.0007)
  segment('GT_door_latch','alloy',(px0+.007,sign*half(px0+.007)*1.003,.055),(px0+.019,sign*half(px0+.019)*1.003,.055),.0013)
  mirrorz=shoulder(.027)+.018
  tube('GT_mirror_stalk','black',[(.027,sign*half(.027)*.985,shoulder(.027)-.003),(.033,sign*width*1.025,mirrorz-.004),(.037,sign*width*1.07,mirrorz)],.0021,8)
  # aerofoil section mirrors, front splitter, wheel pod accents
  def pod(group,material,x,y,z,l,w,h):
   sections=[]
   for k in range(13):
    t=k*pi/12
    sections.append([(x+l*cos(t),y+w*sin(t)*cos(m*pi/8),z+h*sin(t)*sin(m*pi/8)) for m in range(16)])
   surface(group,material,sections,True)
  pod('GT_mirror','accent' if family in ('gt','endurance') else 'paint',.037,sign*width*1.07,mirrorz,.011,.0065,.0046)
  for x in wheelx:
   pts=[(x+.0364*cos(j*pi/28),sign*half(x+.0364*cos(j*pi/28))*1.003,.033+.0364*sin(j*pi/28)) for j in range(29)]
   tube('GT_arch_edge','trim',pts,.0011)
  for j in range(4 if proto else 2):
   x=-.064+j*.0033
   tube('GT_cooling_louvre','black',[(x,sign*(.043+m*.005),top(x,(.043+m*.005)/half(x))+.00065) for m in range(5)],.0009)
  for x,sg in [(nose,1)]:
   # Lenses wrap from bumper face into front quarter panels.
   z=deck(x)-.007;pts=[(x+sg*.0007,sign*half(x)*.51,z),(x+sg*.001,sign*half(x)*.85,z+.0005),(x-sg*.004,sign*half(x-sg*.004)*.969,z+.002),(x-sg*.018,sign*half(x-sg*.018)*.995,z+.006)]
   tube('GT_headlight' if sg>0 else 'GT_taillight','black',pts,.0039)
   tube('GT_LED_signature' if sg>0 else 'GT_tail_signature','lamp' if sg>0 else 'red',[(lx+sg*.0012,ly*1.014,lz+.0009) for lx,ly,lz in pts],.00145)
  for k in range(5):
   z=.030+k*.0025
   segment('GT_intake_vanes','trim',(nose+.0007,sign*.008,z),(nose+.0011,sign*half(nose)*.50,z+.001),.00065)
  segment('GT_side_skirt','black',(-.052,sign*half(0),.024),(.055,sign*half(0),.024),.0027)
 if family in ('lm','endurance','groupc','hyper','gt'):
  for sign in [-1,1]:segment('GT_wing_stay','black',(-.107,sign*.039,.059),(-.124,sign*.041,.093 if proto else .095),.003)
  z=.094 if proto else .096
  for j in range(15):
   y0=(j/15-.5)*width*2.05;y1=((j+1)/15-.5)*width*2.05
   def air(y):return [(-.139,y,z+.002),(-.119,y,z+.005),(-.112,y,z+.003),(-.136,y,z)]
   surface('GT_rear_wing','black',[air(y0),air(y1)],True)
 if family in ('groupc','hyper','lm'):
  for sign in [-1,1]:tube('GT_dorsal_fairing','paint',[(-.145+i*.004,sign*.040,.060+.029*sin(pi*i/20)) for i in range(21)],.0038)
 # Housings are sunk into the bonnet. Layered projector strips rise a fraction
 # above the smoked surround and continue into the visible bumper signature.
 for sign in (-1,1):
  if family in ('classic','targa'):
   hx=nose-.026;hy=sign*half(hx)*.78;hz=top(hx,.78)
   pod('GT_headlight_surround','trim',hx,hy,hz+.001,.012,.010,.005)
   pod('GT_headlight_lens','lamp',hx+.001,hy,hz+.003,.009,.008,.0042)
  else:
   length=.044 if proto else .027
   def headpoint(u,v):
    x=nose-.004-u*length
    q=.60+.22*u + (.30-.17*u)*v
    return (x,sign*q*half(x),top(x,q)+.0016)
   us=[j/10 for j in range(11)]
   surface('GT_headlight_surround','black',[[headpoint(u,t) for t in (0,.5,1)] for u in us])
   for strip in ([.19,.70] if family not in ('lm','hyper') else [.18,.46,.76]):
    tube('GT_LED_signature','lamp',[(x,y,z+.0009) for x,y,z in [headpoint(u,strip) for u in us[1:-1]]],.00092)
  # Side blade and intake ahead of the back axle, following the body surface.
  ix=-.049 if proto else -.045
  pts=[(ix-.006,.052),(ix+.023,.049),(ix+.028,.046),(ix+.012,.036),(ix+.004,.034)]
  shell('GT_quarter_intake','black',[(x,sign*half(x)*1.009,z) for x,z in pts])
  segment('GT_side_skirt','trim',(ix+.005,sign*half(ix)*1.010,.035),(ix+.025,sign*half(ix+.025)*1.010,.045),.0013)
  # Tiny door handles, quarterlight seals and bonnet panel gaps.
  q=.52 if proto else .58
  pts=[]
  for k in range(13):
   x=d+.008+(nose-.02-d-.008)*k/12
   pts.append((x,sign*(q+.06*sin(k*pi/12))*half(x),top(x,q+.06*sin(k*pi/12))+.00055))
  tube('GT_bonnet_seam','trim',pts,.00055)
 # Deep carbon radiator face, painted bridge and lower splitter.
 front_width=half(nose)
 grill=[(nose+.001,-front_width*.63,.027),(nose+.001,front_width*.63,.027),(nose+.001,front_width*.53,min(deck(nose)-.002,.049)),(nose+.001,-front_width*.53,min(deck(nose)-.002,.049))]
 shell('GT_radiator','grille',grill)
 for k in range(0 if family=='gt' else 9):
  y=(k-4)*front_width*.115
  segment('GT_grille_lamella','trim',(nose+.0016,y,.029),(nose+.0016,y,min(deck(nose)-.003,.047)),.00055)
 lip=[]
 for j in range(21):
  x=nose-.022+.024*j/20;w=half(min(nose,x))*(1.02 if x<=nose else 1.0)
  lip.append([(x,-w,.0238),(x,w,.0238),(x,w,.0262),(x,-w,.0262)])
 surface('GT_splitter','black',lip,True)
 if family=='gt':
  # The cover car has twin recessed bonnet extractors and a central honeycomb intake.
  for sign in [-1,1]:
   def ventpoint(u,v):
    x=.042+.067*u
    q=.22+.085*u+v*(.24-.17*u)
    return (x,sign*q*half(x),top(x,q)+.00095)
   surface('GT_bonnet_extractor','black',[[ventpoint(j/16,v) for v in [0,.5,1]] for j in range(17)])
   for k in range(1,7):
    tube('GT_bonnet_louvre','trim',[ventpoint(k/9,v) for v in [.09,.35,.65,.91]],.00067,5)
   for k in range(3):
    px=nose-.008-k*.004;z=.031+k*.005
    tube('GT_canard','black',[(px-.013,sign*half(px-.013)*1.015,z+.003),(px,sign*half(px)*1.057,z),(nose+.003,sign*.061,z-.001)],.0016)
   # The white roundel follows the flank. Ink strokes model a readable race 08 at game distance.
   cx=.002;cz=.051;badge=[]
   for n in range(48):
    angle=2*pi*n/48;x=cx+.012*cos(angle);badge.append((x,sign*(half(x)*1.009+.0005),cz+.015*sin(angle)))
   shell('GT_door_roundel','ivory',badge)
   for digit in (0,8):
    base_x=cx+sign*(.0041 if digit==0 else -.0041)
    for z0,ry in ([(cz,.0079)] if digit==0 else [(cz+.0036,.0041),(cz-.0038,.0046)]):
     pts=[]
     for n in range(25):
      angle=2*pi*n/24;x=base_x+.0028*cos(angle)
      pts.append((x,sign*(half(x)*1.012+.0009),z0+ry*sin(angle)))
     tube('GT_door_number','black',pts,.00075,5)
  # Slightly proud bumper lips surround a deep dark intake in front of the nose cap.
  w=half(nose)
  shape=[(-.80,.027),(-.76,.035),(-.56,.043),(-.43,.046),(.43,.046),(.56,.043),(.76,.035),(.80,.027),(.70,.023),(-.70,.023)]
  rim=[(nose+.0022,y*w,z) for y,z in shape];shell('GT_intake_throat','grille',rim)
  tube('GT_front_cowl','paint',rim+[rim[0]],.0022)
  for row in range(4):
   z=.0275+row*.0041
   limit=(.69-.040*row)*w
   for col in range(-12,13):
    y=(col+(row%2)*.5)*.0050
    if abs(y)>limit:continue
    pts=[(nose+.00275,y+.00278*cos(n*pi/3+pi/6),z+.00257*sin(n*pi/3+pi/6)) for n in range(7)]
    tube('GT_honeycomb','grille',pts,.00024,4)
 # Body-specific hardware gives each silhouette an identity.
 if family=='rally':
  for y in [-.026,-.009,.009,.026]:
   pod('GT_auxiliary_housing','black',nose-.001,y,.069,.006,.008,.008)
   pod('GT_auxiliary_lens','lamp',nose+.004,y,.069,.0028,.0065,.0065)
  pod('GT_roof_airbox','paint',-.042,0,roofh+.001,.020,.019,.005)
 elif family in ('lm','groupc','hyper'):
  fins=[(-.152,.059),(-.128,.095),(-.083,.110 if family=='groupc' else .098),(-.045,.100),(-.057,.067)]
  if family=='hyper':fins=[(-.156,.060),(-.143,.099),(-.124,.102),(-.079,.070)]
  for sign in [-1,1]:shell('GT_engine_spine','paint',[(x,sign*.0013,z) for x,z in fins])
  for x1,x2 in zip(fins,fins[1:]+fins[:1]):surface('GT_engine_spine','trim',[[(x,-.0013,z),(x,.0013,z)] for x,z in [x1,x2]])
 elif family=='classic':
  pod('GT_bonnet_power_bulge','paint',.075,0,deck(.075),.046,.018,.0045)
 if family=='targa':
  for sy in [-1,1]:
   segment('GT_rollhoop','alloy',(-.058,sy*.038,.087),(-.052,sy*.030,.113),.0022)
  segment('GT_rollhoop','alloy',(-.052,-.030,.113),(-.052,.030,.113),.0022)
 if family in ('rally','saloon','gt','endurance','classic'):
  # Hatch, saloon and coupés have a rear lower grille, with exhaust outlets.
  for sy in [-1,1]:
   tube('GT_tailpipe','alloy',[(-tail+.008,sy*.045,.027),(-tail-.002,sy*.045,.027)],.0043,14)
 # The cockpit is geometry, visible through alpha-blended glazing on mobile.
 seatx=b*.46+c*.54-.007
 seatz=deck(seatx)-.008
 for sign in [-1,1]:
  sy=sign*cabw*.39
  pod('GT_bucket_base','seat',seatx,sy,seatz,.026,.014,.0062)
  # Sculpted, sloped backrest with two side bolsters and a rear head restraint.
  rows=[]
  for k in range(13):
   v=k/12;r=.008+.005*sin(pi*v);x=seatx-.015-.010*v;z=seatz+.003+v*(roofh-seatz)*.58
   rows.append([(x+.0045*cos(j*pi/8),sy+r*sin(j*pi/8),z) for j in range(16)])
  surface('GT_bucket_back','seat',rows,True)
  pod('GT_bucket_headrest','seat',seatx-.025,sy,rows[-1][0][2],.0055,.0082,.0060)
  for k in [-1,1]:
   tube('GT_seat_bolster','seat',[(seatx+.017,sy+k*.011,seatz+.002),(seatx-.009,sy+k*.013,seatz+.006),(seatx-.019,sy+k*.011,seatz+.021)],.0025,8)
   tube('GT_harness','red',[(seatx-.020,sy+k*.004,seatz+.024),(seatx-.013,sy+k*.006,seatz+.005),(seatx+.003,sy+k*.003,seatz+.005)],.0012)
 dashx=d-.021
 pod('GT_dashboard','black',dashx,0,deck(dashx)+.001,.014,cabw*.85,.008)
 steering=(dashx-.015,-cabw*.39,deck(dashx)+.003)
 hx,hy,hz=steering
 tube('GT_steering_wheel','black',[(hx-.002*sin(j*pi/18),hy+.0087*cos(j*pi/18),hz+.0087*sin(j*pi/18)) for j in range(37)],.00128,8)
 for j in [0,pi,1.5*pi]:
  segment('GT_steering_spoke','trim',steering,(hx-.002*sin(j),hy+.0087*cos(j),hz+.0087*sin(j)),.001)
 pod('GT_steering_hub','trim',hx,hy,hz,.0016,.003,.003)
 panelx=dashx-.008
 pod('GT_instrument_cowl','trim',panelx,hy,deck(dashx)+.007,.006,.011,.004)
 tube('GT_wiper','black',[cab(d-.008,t) for t in [-.75,-.45,-.1,.27,.39]],.0008,6)
 # Wheel geometry uses a lathed tyre with recessed sidewall, dished rims,
 # staggered forged spokes, machined rotor, valve, lug nuts and tread channels.
 for x in wheelx:
  for sign in [-1,1]:
   y=sign*.075;z=.033;center=(x,y,z)
   def rim(group,material,profile,n=48):
    revolve(group,material,center,[(h*sign,r) for h,r in profile],n)
   rim('GT_tyre','tyre',[(-.012,.021),(-.013,.025),(-.0118,.0298),(-.0095,.0324),(-.006,.033),(0,.0332),(.006,.033),(.0095,.0324),(.0118,.0298),(.013,.026),(.012,.022),(.010,.021),(-.012,.021)])
   for h in [-.006,-.0015,.0045]:rim('GT_tyre_tread','black',[(h-.0004,.03305),(h,.03329),(h+.0004,.03305)])
   rim('GT_alloy_bead','alloy',[(.009,.0205),(.0121,.0224),(.0136,.0219),(.0138,.0207),(.0111,.0196)])
   rim('GT_alloy_disc','disc',[(.006,.0052),(.006,.0178),(.007,.0185),(.007,.0052)])
   # perforated rotor dots, lug bolts and valve are material-grouped
   for k in range(14):
    ang=2*pi*k/14
    revolve('GT_alloy_drilling','black',(x+.015*cos(ang),y+sign*.0071,z+.015*sin(ang)),[(0,.0007),(sign*.00012,.0007),(sign*.00012,.00001)],6)
   count=[7,10,6,8,5,8,5,7,6][index]
   for k in range(count):
    angle=k*2*pi/count
    for fork in [-1,1] if index in (0,2,5,8) else [0]:
     def spoke(r,offset,h):return (x+r*cos(angle+offset),y+sign*h,z+r*sin(angle+offset))
     points=[spoke(.004,-.18,.0115),spoke(.011,-.07,.0104),spoke(.0207,.055+fork*.13,.0125),spoke(.0212,.16+fork*.13,.0126),spoke(.011,.15,.0106),spoke(.004,.24,.0115)]
     shell('GT_wheel_spoke','alloy',points)
     back=[(px,py-sign*.0015,pz) for px,py,pz in points]
     shell('GT_wheel_spoke','alloy',list(reversed(back)))
     surface('GT_wheel_spoke','alloy',[[p,q] for p,q in zip(points+[points[0]],back+[back[0]])])
   rim('GT_alloy_hub','trim',[(.008,.0048),(.014,.0048),(.0146,.004),(.0146,.00001)],24)
   for k in range(5):
    q=2*pi*k/5
    revolve('GT_alloy_stud','alloy',(x+.0034*cos(q),y+sign*.0148,z+.0034*sin(q)),[(0,.00072),(.00025*sign,.00072),(.00026*sign,.00001)],6)
   segment('GT_brake_caliper','red',(x+.012,y+sign*.008,z-.006),(x+.0135,y+sign*.008,z+.0075),.0036)
 # Club 15 manufactured miniature detailing. All opaque parts are explicit geometry.
 # Nothing uses transparent body overlays to imitate missing mesh detail.
 def block(group,material,x,y,z,l,w,h):
  a=[(x+sx*l/2,y+sy*w/2,z+sz*h/2) for sz in [-1,1] for sy in [-1,1] for sx in [-1,1]]
  v,f=buckets[group,material];off=len(v);v.extend(a)
  f.extend(tuple(off+i for i in face) for face in [(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)])
 # A complete solid floor hides internal reverse faces when the car tumbles.
 block('GT_chassis_pan','black',0,0,.0215,.245,width*1.47,.004)
 for ax in wheelx:
  segment('GT_axle','alloy',(ax,-.077,.033),(ax,.077,.033),.0025)
 # Real arch liners sit behind the cut body openings and above the tyre clearance.
 for ax in wheelx:
  for sign in [-1,1]:
   arcs=[]
   for j in range(37):
    angle=j*pi/36
    arcs.append([(ax+.0357*cos(angle),sign*y,.033+.0357*sin(angle)) for y in [.060,.081]])
   surface('GT_wheelwell_liner','black',arcs)
 # Rear diffuser: a sloping carbon floor, crisp fins and centre rain lamp.
 rear0=-tail-.003;rear1=-tail+.041
 surface('GT_diffuser_floor','black',[[(rear0,y,.025) for y in [-width*.88,width*.88]],[(rear1,y,.014) for y in [-width*.72,width*.72]]])
 for j in range(7 if proto else 5):
  y=(j-(3 if proto else 2))*width*.26
  path=[(rear0-.001,y,.029),(rear1,y,.016),(rear1,y,.010),(rear0-.006,y,.006)]
  for sign in [-1,1]:shell('GT_diffuser_fin','black',[(x,py+sign*.00065,z) for x,py,z in path])
  surface('GT_diffuser_fin','black',[[(x,y-.00065,z),(x,y+.00065,z)] for x,_,z in path+[path[0]]])
 block('GT_rain_light_housing','black',-tail-.001,0,.039,.003,.015,.008)
 for row in [-1,0,1]:
  for col in [-2,-1,0,1,2]:
   pod('GT_tail_signature','red',-tail-.0033,col*.0024,.039+row*.002,.00055,.00065,.00065)
 # Recessed rear fascia breaks up the painted rear cap, with layered vent bars.
 rearface=-tail-.0019
 rim=[(-width*.83,.031),(-width*.71,.046),(-width*.47,.049),(width*.47,.049),(width*.71,.046),(width*.83,.031),(width*.68,.026),(-width*.68,.026)]
 shell('GT_rear_fascia','grille',[(rearface,y,z) for y,z in rim])
 tube('GT_rear_fascia_lip','trim',[(rearface-.0005,y,z) for y,z in rim+[rim[0]]],.0011,6)
 for k in range(4):
  z=.030+k*.0033
  segment('GT_rear_grille','black',(rearface-.0011,-width*.52,z),(rearface-.0011,width*.52,z),.0007)
 # Layered red optical bars and dark surrounds wrap around both rear quarter panels.
 for sign in [-1,1]:
  rz=deck(-tail)-.006
  pts=[(-tail-.002,sign*width*.33,rz+.001),(-tail-.0035,sign*width*.70,rz-.001),(-tail+.004,sign*half(-tail+.004)*.994,rz+.002),(-tail+.015,sign*half(-tail+.015)*1.003,rz+.005)]
  tube('GT_taillight','black',pts,.0030,10)
  for dz in [-.0013,.0013]:
   tube('GT_tail_signature','red',[(x-.0033,y+sign*.0016,z+dz) for x,y,z in pts],.00092,8)
  end=pts[0]
  tube('GT_tail_signature','red',[(end[0]-.0033,end[1]+sign*.0016,end[2]-.0013),(end[0]-.0033,end[1]+sign*.0016,end[2]+.0013)],.00092,8)
  segment('GT_rear_reflector','red',(-tail-.003,sign*width*.70,.033),(-tail-.003,sign*width*.61,.033),.0012)
 # Engine-cover shut line and fuel cap use the same painted body surface.
 if family in ('gt','endurance','hyper','groupc','lm'):
  for sign in [-1,1]:
   tube('GT_engine_cover_seam','trim',[(x,sign*half(x)*.52,top(x,.52)+.0006) for x in [-tail+.016+(-.105+tail-.016)*j/12 for j in range(13)]],.00048,5)
 # Wing has closed endplates, real two-piece supports and visible mounting feet.
 if family in ('gt','endurance','lm','groupc','hyper'):
  wz=.094 if proto else .096
  for sign in [-1,1]:
   edge=[(-.144,wz-.005),(-.140,wz+.012),(-.111,wz+.011),(-.109,wz-.004)]
   for side in [-1,1]:shell('GT_wing_endplate','black',[(x,sign*width*1.04+side*.0006,z) for x,z in edge])
   surface('GT_wing_endplate','black',[[(x,sign*width*1.04-.0006,z),(x,sign*width*1.04+.0006,z)] for x,z in edge+[edge[0]]])
   shell('GT_wing_endplate_label','accent',[(x,sign*(width*1.04+.00068),z) for x,z in [(-.143,wz+.005),(-.14,wz+.0115),(-.126,wz+.011),(-.127,wz+.005)]])
   block('GT_wing_mount','trim',-.108,sign*.039,.066,.017,.009,.002)
   for x in [-.114,-.102]:pod('GT_wing_fastener','alloy',x,sign*.039,.0672,.0011,.0011,.0005)
 # Defined window surrounds and window cross-bars follow the cabin surface exactly.
 for sign in [-1,1]:
  for x in [b,c]:tube('GT_roof_frame','paint',[cab(x,sign*t) for t in [.0,.18,.36,.55,.66,.74]],.0018,8)
  # Door glass is kept bordered by seals instead of one large uninterrupted bubble.
  tube('GT_window_seal','black',[cab(x,sign*.86) for x in [a+(d-a)*j/36 for j in range(37)]],.0007,6)
 # A roll cage and helmet give the window real depth at garage distance.
 cagew=cabw*.63;cz=roofh-.014
 for x in [b+.014,c-.008]:
  tube('GT_rollcage','trim',[(x,-cagew,.049),(x,-cagew*.87,cz),(x,cagew*.87,cz),(x,cagew,.049)],.0015,8)
 tube('GT_rollcage','trim',[(b+.014,-cagew*.87,cz),(c-.008,-cagew*.87,cz)],.0013,8)
 tube('GT_rollcage','trim',[(b+.014,cagew*.87,cz),(c-.008,cagew*.87,cz)],.0013,8)
 driverx=seatx-.009;drivery=-cabw*.39;driverz=min(roofh-.016,seatz+.039)
 pod('GT_driver_helmet','ivory',driverx,drivery,driverz,.010,.0095,.011)
 pod('GT_driver_visor','lens',driverx+.0085,drivery,driverz+.001,.0025,.0083,.0038)
 tube('GT_driver_visor_seal','black',[(driverx+.010,drivery+y,driverz+.004) for y in [-.007,-.003,0,.003,.007]],.0007,6)
 # Cover headlights have physically layered reflectors and glass. Upper clear lenses
 # are shiny opaque coated optical covers; window transparency is isolated elsewhere.
 for sign in [-1,1]:
  if family not in ('classic','targa'):
   length=.044 if proto else .032
   for j in range(3):
    x=nose-.012-j*length*.23;q=.68+.05*j;y=sign*q*half(x);z=top(x,q)+.002
    pod('GT_headlight_reflector','chrome',x,y,z,.0048,.0036,.0018)
    pod('GT_headlight_projector','lens',x+.0003,y,z+.001,.0035,.0026,.0013)
    tube('GT_LED_signature','lamp',[(x-.003,y+sign*.0037,z+.0018),(x+.003,y+sign*.0035,z+.0018)],.00055,6)
  # Endurance bumper auxiliary lamps sit inside properly framed housings.
  if family in ('gt','endurance','groupc','lm'):
   bx=nose+.0023;by=sign*half(nose)*.73
   block('GT_auxiliary_housing','grille',bx,by,.036,.0026,.022,.016)
   for i in [-1,1]:
    for j in [-1,1]:
     yy=by+i*.006;zz=.036+j*.004
     pod('GT_auxiliary_reflector','chrome',bx+.0015,yy,zz,.0009,.0032,.0026)
     pod('GT_auxiliary_projector','lens',bx+.0021,yy,zz,.0006,.0026,.0020)
 # Two-tone race stripes hug the body/roof, never span the empty cockpit.
 if family in ('gt','endurance','saloon'):
  for center,widthstripe in [(-.014,.010),(.014,.010)]:
   for x0,x1,isroof in [(d+.006,nose-.012,False),(b+.003,c-.003,True)]:
    if x1<=x0:continue
    stripe=[]
    for j in range(41):
     x=x0+(x1-x0)*j/40
     stripe.append([(x,y,(cab(x,y/cabw)[2] if isroof else top(x,y/half(x)))+.00045) for y in [center-widthstripe/2,center+widthstripe/2]])
    surface('GT_roof_stripe' if isroof else 'GT_hood_race_stripe','trim',stripe)
 # Machined barrel walls and glossy bead shoulders replace flat wheel discs.
 for ax in wheelx:
  for sign in [-1,1]:
   y=sign*.075;z=.033
   revolve('GT_alloy_barrel','alloy',(ax,y,z),[(sign*h,r) for h,r in [(-.008,.0204),(.006,.0204),(.012,.0206),(.0132,.0212)]],64)
   # Tyre transfer rings are flush onto sidewall rather than billboard textures.
   revolve('GT_tyre_transfer','blue',(ax,y,z),[(sign*.0121,.0267),(sign*.0120,.0290)],64)
   for j in range(12):
    a0=.25*pi+j*pi/24
    p0=(ax+.0276*cos(a0),y+sign*.0122,z+.0276*sin(a0))
    p1=(ax+.0276*cos(a0+.018),y+sign*.0122,z+.0276*sin(a0+.018))
    segment('GT_tyre_ink','whiteink',p0,p1,.00048)
   # Raised tyre serial bars and a metal valve stem.
   angle=-.73
   segment('GT_alloy_valve','alloy',(ax+.018*cos(angle),y+sign*.012,z+.018*sin(angle)),(ax+.0205*cos(angle),y+sign*.013,z+.0205*sin(angle)),.0007)

 root=bpy.data.objects.new('CAR_GT',None);bpy.context.collection.objects.link(root)
 for (group,material),(verts,faces) in buckets.items():
  mesh=bpy.data.meshes.new(group);mesh.from_pydata(verts,[],faces);mesh.update()
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-7);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);
  for edge in bm.edges:
   if edge.is_manifold and edge.calc_face_angle(0)>math.radians(42):edge.smooth=False
  bm.to_mesh(mesh);bm.free();mesh.update()
  ob=bpy.data.objects.new(group,mesh);bpy.context.collection.objects.link(ob);ob.parent=root
  mesh.materials.append(materials[material])
  # Hard manufactured edges stay hard; only continuously curved surfaces are smoothed.
  hard=('spoke','fin','endplate','grille','splitter','diffuser','roundel','number','honeycomb','ink','door_panel')
  for poly in mesh.polygons:poly.use_smooth=not any(k in group.lower() for k in hard)
  # Mark acute edges for glTF split normals, avoiding melted rim lips and body panel seams.
 if os.environ.get('SLOT_FLEET_BLEND') and index==0:bpy.ops.wm.save_as_mainfile(filepath=os.environ['SLOT_FLEET_BLEND'])
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'fleet-{index}.glb'),export_format='GLB',export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
if __name__=='__main__':
 selected=[int(n) for n in os.environ.get('SLOT_FLEET_IDS',','.join(map(str,range(len(CARS))))).split(',')]
 for index in selected:build(index)
