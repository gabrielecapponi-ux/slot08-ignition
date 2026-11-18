# Execute after build_scene.py; helpers are included by the export runner.
import random
road=bpy.data.materials['MAT_graphite_plastic'];edge=bpy.data.materials['MAT_track_edge']
silver=material('MAT_brushed_steel',(.43,.46,.46),.30,.8)
slot=material('MAT_slot',(.006,.007,.006),.83)
red=material('MAT_curb_vermilion',(.65,.075,.045),.48)
cream=material('MAT_ivory',(.83,.83,.72),.46)
lime=material('MAT_lime_enamel',(.47,.78,.14),.24,.22)
glass=material('MAT_smoked_glass',(.018,.035,.036),.17,.35)
rubber=material('MAT_rubber',(.012,.014,.013),.82)
white=material('MAT_headlamp',(.88,.96,1),.17,.3)
black=material('MAT_carbon',(.012,.016,.014),.4,.22)

def ribbons(name,segments,mat,step=.035):
    vs=[];fs=[]
    for start,end,offset,width,height in segments:
        n=max(2,math.ceil((end-start)/step));base=len(vs)
        for i in range(n+1):
            s=start+(end-start)*i/n;x,y,tx,ty,z=sample(s)
            for d in (offset-width/2,offset+width/2):vs.append((x-ty*d,-y-tx*d,z+height))
        for i in range(n):fs.append((base+2*i,base+2*i+1,base+2*i+3,base+2*i+2))
    return mesh(name,vs,fs,mat)

ribbons('RAILS_steel',[(0,TOTAL,off+.025*side,.009,.079) for off in (-.145,.145) for side in (-1,1)],silver)
ribbons('SLOTS_black',[(0,TOTAL,off,.018,.078) for off in (-.145,.145)],slot)
# Fine white edge lines leave room for the red/white kerbs.
ribbons('TRACK_edge_lines',[(0,TOTAL,off,.011,.0785) for off in (-.314,.314)],cream)
for parity,mat in [(0,red),(1,cream)]:
    seg=[]
    for start,end in [(L,L+A),(2*L+A,TOTAL)]:
        count=math.ceil((end-start)/.19)
        for i in range(count):
            if i%2!=parity:continue
            for off in (-.34,.34):seg.append((start+(end-start)*i/count,start+(end-start)*(i+1)/count,off,.062,.086))
    ribbons('CURBS_'+str(parity),seg,mat,.04)
# Manufactured seams across each modular track piece.
vs=[];fs=[]
for i in range(math.ceil(TOTAL/.45)):
    s=i*.45
    x,y,tx,ty,z=sample(s);base=len(vs)
    for along,off in [(-.004,-.35),(-.004,.35),(.004,.35),(.004,-.35)]:vs.append((x+tx*along-ty*off,-y-ty*along-tx*off,z+.078))
    fs.append(tuple(base+j for j in range(4)))
mesh('TRACK_module_seams',vs,fs,slot)
# Both X sections use smooth quintic lane transitions, matching the physics.
for j,start in enumerate((.48,L+A+.48)):
    for source in (-.145,.145):
        v=[];f=[];n=50
        for i in range(n+1):
            u=i/n;s=start+1.60*u;x,y,tx,ty,z=sample(s);d=source*(1-2*(6*u**5-15*u**4+10*u**3))
            for off in (-.012,.012):v.append((x-ty*(d+off),-y-tx*(d+off),z+.081))
        for i in range(n):f.append((2*i,2*i+1,2*i+3,2*i+2))
        mesh('SWITCH_'+str(j)+'_'+str(source),v,f,silver)
# Bridge guard strips follow the ramp; the lower crossing is genuinely underneath.
ribbons('BRIDGE_guardrails',[(.90,L-.90,off,.035,.125) for off in (-.36,.36)],silver)
# Checkered start line.
for row in range(2):
    for col in range(10):
        s=.08+(row-.5)*.055;off=(col-4.5)*.065;x,y,tx,ty,z=sample(s)
        o=box('START_checker',(x-ty*off,-y-tx*off,z+.079),(.055,.065,.003),cream if (col+row)%2==0 else slot)
        o.rotation_euler.z=-math.atan2(ty,tx)
# Slim oak grain and plank seams, modelled so they survive glTF.
grains=material('MAT_oak_grain',(.31,.214,.13),.88)
vs=[];fs=[]
rng=random.Random(8)
for i in range(150):
    x=rng.uniform(-4.74,4.74);y=rng.uniform(-2.55,2.55);ln=rng.uniform(.1,.8);x2=min(4.76,x+ln);w=rng.uniform(.0009,.0024);base=len(vs)
    vs.extend([(x,y,.002),(x2,y,.002),(x2,y+w,.002),(x,y+w,.002)]);fs.append(tuple(base+j for j in range(4)))
mesh('ENV_oak_grain',vs,fs,grains)
for y in (-1.81,-.91,0,.91,1.81):box('ENV_plank_seam',(0,y,.001),(9.5,.006,.003),grains)
# A miniature controller and cable make the scale readable.
controller=box('PROP_controller',(-3.55,-2.22,.085),(.48,.61,.17),black,.07)
box('PROP_controller_trigger',(-3.55,-1.96,.17),(.29,.13,.055),lime,.02)
for i in range(4):box('PROP_grip_groove',(-3.55,-2.14-i*.065,.171),(.30,.014,.004),edge,.005)
curve=bpy.data.curves.new('PROP_cable','CURVE');curve.dimensions='3D';curve.bevel_depth=.016;curve.bevel_resolution=2
spline=curve.splines.new('BEZIER');spline.bezier_points.add(4)
for p,co in zip(spline.bezier_points,[(-3.55,-1.91,.09),(-3.0,-1.95,.035),(-2.4,-2.3,.03),(-1.9,-1.6,.03),(-1.55,-1.27,.075)]):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
o=bpy.data.objects.new('PROP_controller_cable',curve);bpy.context.collection.objects.link(o);o.data.materials.append(black)
# Branding, modelled as editable text; no font downloads or texture dependencies.
def label(name,text,location,size,mat):
    data=bpy.data.curves.new(name,'FONT');data.body=text;data.size=size;data.align_x='CENTER';data.extrude=.0005
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=location;o.data.materials.append(mat);return o
label('PRINT_left','08',(-2.65,-.18,.008),.77,grains)
label('PRINT_left_small','S L O T  C L U B',(-2.6,-.42,.008),.095,grains)
label('PRINT_right','LESS IS MORE.',(2.64,.04,.008),.14,grains)
label('PRINT_right_small','F I N D  Y O U R  R H Y T H M',(2.64,-.17,.008),.065,grains)
# Car root pivot: ground contact, local +X forward. The game animates this root.
root=bpy.data.objects.new('CAR_GT',None);bpy.context.collection.objects.link(root)
def part(o):o.parent=root;return o
sections=[(-.15,.062,.052),(-.12,.077,.070),(-.075,.074,.076),(.03,.072,.064),(.11,.073,.055),(.15,.059,.041)]
v=[];f=[]
for x,w,top in sections:v.extend([(x,-w,.025),(x,w,.025),(x,w,top),(x,-w,top)])
for i in range(len(sections)-1):
    for j in range(4):f.append((4*i+j,4*i+(j+1)%4,4*(i+1)+(j+1)%4,4*(i+1)+j))
f.extend([(3,2,1,0),tuple(range(len(v)-4,len(v)))])
body=part(mesh('GT_body',v,f,lime));bevel=body.modifiers.new('Body edge radius','BEVEL');bevel.width=.005;bevel.segments=2;body.modifiers.new('Body normals','WEIGHTED_NORMAL')
# Continuous cabin loft: windshield, roof and rear window.
v=[(-.083,-.059,.071),(-.083,.059,.071),(-.046,-.046,.116),(-.046,.046,.116),(.025,-.043,.111),(.025,.043,.111),(.073,-.056,.060),(.073,.056,.060)]
part(mesh('GT_glazing',v,[(0,1,3,2),(2,3,5,4),(4,5,7,6),(0,2,4,6),(1,7,5,3)],glass))
part(box('GT_roof',(-.009,0,.116),(.077,.087,.008),lime,.004))
for y in (-.012,.012):part(box('GT_roof_stripe',(-.009,y,.121),(.075,.008,.002),cream))
for y in (-.052,.052):
    part(box('GT_headlight',(.139,y,.048),(.014,.028,.009),white,.003))
    part(box('GT_taillight',(-.151,y,.047),(.007,.025,.007),red,.002))
for y in (-.053,.053):part(box('GT_wing_mount',(-.117,y,.092),(.014,.009,.057),black))
part(box('GT_rear_wing',(-.12,0,.125),(.039,.188,.012),black,.003))
part(box('GT_splitter',(.134,0,.022),(.041,.151,.009),black,.003))
for x in (-.091,.096):
    for y in (-.075,.075):
        bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.033,depth=.025,location=(x,y,.033),rotation=(math.pi/2,0,0))
        wheel=bpy.context.object;wheel.name='GT_tyre';wheel.data.materials.append(rubber);part(wheel)
        bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.019,depth=.027,location=(x,y,.033),rotation=(math.pi/2,0,0))
        rim=bpy.context.object;rim.name='GT_alloy';rim.data.materials.append(silver);part(rim)
for y in (-.080,.080):part(box('GT_mirror',(.023,y,.087),(.022,.018,.012),lime,.004))
x,y,tx,ty,z=sample(.08);off=-.145;root.location=(x-ty*off,-y-tx*off,z+.077);root.rotation_euler.z=-math.atan2(ty,tx)
scene=bpy.context.scene;scene.eevee.taa_render_samples=12
scene.render.resolution_x=960;scene.render.resolution_y=600
result={'objects':len(bpy.data.objects),'car_root':root.name,'car_length':.30,'materials':len(bpy.data.materials),'track_m':TOTAL}
if 'artifacts' in globals():
    target=artifacts.file(name='slot08-finished.png',media_type='image/png');scene.render.filepath=str(target.path)
    scene.render.image_settings.media_type='IMAGE';scene.render.image_settings.file_format='PNG';bpy.ops.render.render(write_still=True);target.publish()
