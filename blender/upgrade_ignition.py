"""SLOT08 IGNITION: data from scripts/export-track-data.mjs, metres, Z up.
Run after v1 scene; export keeps independently editable LEVEL_0..2 roots.
"""
import bpy, math, json, random
from mathutils import Vector
# TRACK_DATA is prepended by the runner; local Blender can read track-data.json.
if 'TRACK_DATA' not in globals():
    import os
    with open(os.path.join(os.path.dirname(bpy.data.filepath),'track-data.json')) as f: TRACK_DATA=json.load(f)

def mat(name,c,rough=.5,metal=0,emission=0):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*c,1)
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    if emission:bs.inputs['Emission Color'].default_value=(*c,1);bs.inputs['Emission Strength'].default_value=emission
    return m

def mesh(name,v,f,m,parent=None):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.data.materials.append(m);o.parent=parent;return o

def box(name,p,size,m,parent=None,bevel=0):
    x,y,z=[d/2 for d in size];v=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
    o=mesh(name,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m,parent);o.location=p
    if bevel:mod=o.modifiers.new('Rounded injection mould','BEVEL');mod.width=bevel;mod.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def text(name,body,p,size,m,parent=None):
    d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.align_x='CENTER';d.extrude=.0006;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=p;o.data.materials.append(m);o.parent=parent;return o

car=bpy.data.objects['CAR_GT'];keep={car,*car.children}
for o in list(bpy.data.objects):
    if o not in keep and o.type not in {'CAMERA','LIGHT'}:bpy.data.objects.remove(o,do_unlink=True)
car.location=(0,0,.08);car.rotation_euler=(0,0,0)
carbon=mat('MAT_carbon',(.012,.018,.025),.39,.25);steel=mat('MAT_brushed_steel',(.48,.57,.62),.28,.85);white=mat('MAT_ivory',(.92,.93,.85),.5);orange=mat('MAT_ignition_orange',(.95,.19,.035),.35,.15);glass=mat('MAT_smoked_glass',(.018,.035,.052),.13,.45)
mat('MAT_lime_enamel',(.62,.9,.045),.20,.35)
for y in [-.024,.024]:
    box('GT_hood_race_stripe',(.098,y,.061),(.069,.012,.002),carbon,car)
    for j in range(3):box('GT_hood_vent',(.045+j*.009,y,.068),(.004,.016,.002),carbon,car)
for y in [-.077,.077]:
    box('GT_side_skirt',(0,y,.025),(.21,.009,.016),carbon,car,.002)
    box('GT_door_roundel',(-.01,y*1.01,.052),(.039,.002,.027),white,car,.004)
    box('GT_wing_endplate',(-.12,y*1.28,.13),(.045,.006,.032),orange,car,.002)
for y in [-.016,.016]:
    box('GT_roof_air_channel',(-.01,y,.123),(.04,.004,.002),carbon,car)
for y in [-.05,.05]:
    for j in range(3):box('GT_LED_signature',(.148,y+(j-1)*.007,.048),(.005,.004,.007),mat('MAT_LED',(.74,.95,1),.2,.1,.5),car)
# Wheel faces, spokes, brake discs and tyre sidewall beads remain separate editable parts.
for tyre in [o for o in car.children if o.name.startswith('GT_tyre')]:
    x,y,z=tyre.location
    for a in range(5):
        angle=a*2*math.pi/5;sp=box('GT_wheel_spoke',(x+math.sin(angle)*.009,y+math.copysign(.014,y),z+math.cos(angle)*.009),(.004,.002,.021),steel,car,.001);sp.rotation_euler.y=angle
    box('GT_brake_caliper',(x+.013,y+math.copysign(.013,y),z),(.006,.003,.014),orange,car,.002)
text('GT_roof_number','08',(-.012,-.015,.126),.028,white,car)
road=mat('MAT_road',(.033,.039,.049),.61);slot=mat('MAT_slot',(.004,.006,.009),.8);red=mat('MAT_curb_red',(.85,.075,.028),.5)
for idx,data in enumerate(TRACK_DATA):
    root=bpy.data.objects.new('LEVEL_'+str(idx),None);bpy.context.collection.objects.link(root);root.location.x=23*(idx-1)
    points=data['samples'];N=len(points)-1;length=data['length'];b=data['bounds']
    accent=mat('MAT_accent_'+str(idx),[(.96,.26,.055),(.13,.65,.74),(.49,.27,.92)][idx],.38,.1)
    board=mat('MAT_board_'+str(idx),[(.38,.22,.115),(.12,.20,.25),(.065,.08,.16)][idx],.8)
    bx=(b['minX']+b['maxX'])/2;by=-(b['minY']+b['maxY'])/2;w=b['maxX']-b['minX'];h=b['maxY']-b['minY']
    box('BASE_'+str(idx),(bx,by,-.19),(w,h,.38),board,root,.13)
    def p_at(s):
        f=(s%length)/length*N;i=int(f);u=f-i;return [points[i][k]*(1-u)+points[i+1][k]*u for k in range(6)]
    def ribbon(name,segments,m):
        v=[];f=[]
        for a,e,off,width,height in segments:
            count=max(2,math.ceil((e-a)/.07));base=len(v)
            for j in range(count+1):
                x,y,z,tx,ty,k=p_at(a+(e-a)*j/count)
                for d in [off-width/2,off+width/2]:v.append((x-ty*d,-y-tx*d,z+height))
            for j in range(count):f.append(tuple(base+n for n in [2*j,2*j+1,2*j+3,2*j+2]))
        return mesh(name,v,f,m,root)
    track=ribbon('ROAD_'+str(idx),[(0,length,0,.70,.075)],road);sol=track.modifiers.new('Plastic road thickness','SOLIDIFY');sol.thickness=.055
    ribbon('SLOTS_'+str(idx),[(0,length,o,.018,.078) for o in [-.145,.145]],slot)
    ribbon('RAILS_'+str(idx),[(0,length,o+d,.009,.080) for o in [-.145,.145] for d in [-.025,.025]],steel)
    ribbon('EDGES_'+str(idx),[(0,length,o,.012,.079) for o in [-.307,.307]],white)
    for parity,m in [(0,red),(1,white)]:
        seg=[]
        for j in range(math.ceil(length/.22)):
            s=j*.22
            if j%2==parity and abs(p_at(s)[5])>.05:
                for o in [-.337,.337]:seg.append((s,min(s+.22,length),o,.065,.087))
        ribbon('KERBS_'+str(idx)+'_'+str(parity),seg,m)
    # Module seams batched into one mesh, each a manufactured .5 m piece.
    v=[];f=[]
    for j in range(math.ceil(length/.50)):
        x,y,z,tx,ty,k=p_at(j*.50);base=len(v)
        for along,off in [(-.004,-.35),(-.004,.35),(.004,.35),(.004,-.35)]:v.append((x+tx*along-ty*off,-y-ty*along-tx*off,z+.079))
        f.append(tuple(base+n for n in range(4)))
    mesh('SEAMS_'+str(idx),v,f,slot,root)
    for gate in data['gates']:
        for source in [-.145,.145]:
            v=[];f=[]
            for j in range(65):
                u=j/64;x,y,z,tx,ty,k=p_at(gate['start']+(gate['end']-gate['start'])*u);off=source*(1-2*(6*u**5-15*u**4+10*u**3))
                for d in [-.012,.012]:v.append((x-ty*(off+d),-y-tx*(off+d),z+.083))
            for j in range(64):f.append((2*j,2*j+1,2*j+3,2*j+2))
            mesh('CROSSOVER_'+str(idx),v,f,accent,root)
        x,y,z,tx,ty,k=p_at(gate['start']);sign=text('X_sign','X',(x-ty*.46,-y-tx*.46,z+.012),.16,accent,root)
    # Finish line and low gantry with five start lamps.
    x,y,z,tx,ty,k=p_at(.08);angle=-math.atan2(ty,tx)
    for r in range(2):
        for c in range(10):
            along=(r-.5)*.055;off=(c-4.5)*.065;o=box('CHECKER',(x+tx*along-ty*off,-y-ty*along-tx*off,z+.082),(.055,.065,.004),white if (r+c)%2 else slot,root);o.rotation_euler.z=angle
    for off in [-.50,.50]:
        o=box('GANTRY_post',(x-ty*off,-y-tx*off,.28+z),(.075,.075,.56),accent,root,.012)
    o=box('GANTRY_top',(x,-y,.56+z),(.10,1.12,.13),carbon,root,.025);o.rotation_euler.z=angle
    for j in range(5):
        off=(j-2)*.14;box('GANTRY_lamp',(x+tx*.06-ty*off,-y-ty*.06-tx*off,.56+z),(.018,.06,.045),accent,root,.01)
    # Supports appear only under elevated road, leaving the lower crossing free.
    for j in range(0,N,20):
        x,y,z,tx,ty,k=points[j]
        if z>.10 and not (idx==1 and abs(x)<.50):
            for off in [-.27,.27]:box('BRIDGE_pier',(x-ty*off,-y-tx*off,z/2),(.09,.09,z+.035),accent,root,.015)
    # Miniature infield display buildings: different silhouettes, real metre scale.
    rng=random.Random(80+idx)
    if idx==0:
        for j in range(6):
            xx=-3.5+j*1.35
            box('PIT_garage',(xx,.15,.18),(1.1,.68,.36),white,root,.035)
            box('PIT_door',(xx,-.195,.15),(.8,.012,.23),carbon,root)
            box('PIT_canopy',(xx,-.10,.39),(1.17,.95,.07),accent,root,.025)
        text('INFIELD','S U N S E T', (0,-1.3,.012),.36,white,root)
    elif idx==1:
        for side in [-1,1]:
            for j in range(5):
                xx=side*(3.6+rng.uniform(-.6,.6));yy=rng.uniform(-.85,.85);height=rng.uniform(.3,.85)
                box('CITY_tower',(xx,yy,height/2),(.32,.38,height),board,root,.025)
                for z0 in [.15,.30,.45,.60]:
                    if z0<height:box('CITY_light_band',(xx,yy,z0),(.334,.394,.022),accent,root)
        text('INFIELD','S K Y L I N E', (0,-2.0,.012),.26,white,root)
    else:
        water=mat('MAT_canal',(.025,.20,.29),.25,.45)
        box('HARBOR_water',(3,-.2,.005),(4.4,1.0,.015),water,root,.05)
        for j in range(6):
            xx=-5.6+j*.65;box('HARBOR_container',(xx,-.25,.17),(.54,1.1,.34),accent if j%2 else white,root,.025)
            for q in range(5):box('HARBOR_rib',(xx-.24+q*.12,-.25,.345),(.018,1.08,.012),carbon,root)
        text('INFIELD','N E O N   H A R B O R', (2.5,1.1,.012),.26,accent,root)
    # Outer track wall: discrete segments give convincing toy-scale silhouette.
    for j in range(0,N,8):
        x,y,z,tx,ty,k=points[j]
        if abs(k)>.10:
            off=-math.copysign(.43,k);o=box('BARRIER',(x-ty*off,-y-tx*off,z+.14),(.32,.055,.12),accent,root,.015);o.rotation_euler.z=-math.atan2(ty,tx)
    # A few foam trees/cones and inset label around the wooden plinth.
    text('TRACK_title',data['name'].upper(),(bx,-b['maxY']+.23,.012),.19,white,root)
    text('TRACK_number',str(idx+1).zfill(2),(b['minX']+.55,b['maxY']-.6,.015),.55,accent,root)
# Position the hero at sunset start, camera close enough to show miniature details.
p=TRACK_DATA[0]['samples'][0];car.location=(-23+p[0]+p[4]*.145,-p[1]+p[3]*.145,.077);car.rotation_euler.z=-math.atan2(p[4],p[3])
scene=bpy.context.scene;cam=scene.camera;cam.data.type='PERSP';cam.data.lens=42;cam.location=(-23,-10,12);cam.rotation_euler=(Vector((-23,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='BLENDER_EEVEE';scene.eevee.taa_render_samples=12;scene.render.resolution_x=1200;scene.render.resolution_y=750;scene.render.resolution_percentage=100
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.4,.5,.65,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
scene.view_settings.view_transform='AgX'
result={'levels':3,'lengths':[d['length'] for d in TRACK_DATA],'objects':len(bpy.data.objects),'meshes':len([o for o in bpy.data.objects if o.type=='MESH']),'car_parts':len(car.children)}
if 'artifacts' in globals():
    target=artifacts.file(name='slot08-ignition.png',media_type='image/png');scene.render.filepath=str(target.path);scene.render.image_settings.media_type='IMAGE';scene.render.image_settings.file_format='PNG';bpy.ops.render.render(write_still=True);target.publish()
