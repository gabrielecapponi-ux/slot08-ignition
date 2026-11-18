"""Editable SLOT 08 scene, shared metre-scale geometry with figure-eight.js.
Run in Blender's scripting editor, or via Higgsfield 3D Jutsu.
"""
import bpy, math
from mathutils import Vector

R, D, WIDTH = 1.58, 2.54, 0.70
THETA=math.acos(R/D); Q=D-R*R/D; H=R*math.sqrt(1-(R/D)**2)
L=math.hypot(2*Q,2*H); A=(2*math.pi-2*THETA)*R; TOTAL=2*(L+A)

def sample(s):
    s=s%TOTAL
    if s<L:
        u=s/L; x=-Q+2*Q*u; y=H-2*H*u; tx=2*Q/L; ty=-2*H/L; z=.27*math.sin(math.pi*u)**2
    elif s<L+A:
        a=-math.pi+THETA+(s-L)/R; x=D+R*math.cos(a); y=R*math.sin(a); tx=-math.sin(a);ty=math.cos(a);z=0
    elif s<2*L+A:
        u=(s-L-A)/L;x=Q-2*Q*u;y=H-2*H*u;tx=-2*Q/L;ty=-2*H/L;z=0
    else:
        a=-THETA-(s-2*L-A)/R;x=-D+R*math.cos(a);y=R*math.sin(a);tx=math.sin(a);ty=-math.cos(a);z=0
    return x,y,tx,ty,z

def material(name,color,rough=.5,metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
    return m

def mesh(name,vertices,faces,mat):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return o

def box(name,location,size,mat,bevel=0):
    x,y,z=[d/2 for d in size]
    v=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
    o=mesh(name,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat);o.location=location
    if bevel:
        mod=o.modifiers.new('Manufactured edge','BEVEL');mod.width=bevel;mod.segments=2
        o.modifiers.new('Surface normals','WEIGHTED_NORMAL')
    return o

def ribbon(name,start,end,offset,width,height,mat,step=.04):
    n=max(2,math.ceil((end-start)/step));v=[];f=[]
    for i in range(n+1):
        x,y,tx,ty,z=sample(start+(end-start)*i/n)
        for d in (offset-width/2,offset+width/2):v.append((x-ty*d,-y-tx*d,z+height))
    for i in range(n):f.append((2*i,2*i+1,2*i+3,2*i+2))
    return mesh(name,v,f,mat)

# New project is intentionally empty. Keep subsequent refinements non-destructive.
wood=material('MAT_warm_oak',(0.40,.29,.18),.76)
road=material('MAT_graphite_plastic',(.047,.052,.057),.57)
edge=material('MAT_track_edge',(.025,.028,.030),.6)
board=box('ENV_oak_table',(0,0,-.12),(9.85,5.45,.24),wood,.10)
for i,(start,end) in enumerate([(0,L),(L,L+A),(L+A,2*L+A),(2*L+A,TOTAL)]):
    o=ribbon('TRACK_module_'+str(i),start,end,0,WIDTH,.075,road)
    sol=o.modifiers.new('Plastic thickness','SOLIDIFY');sol.thickness=.04
# Bridge support piers sit outside the lower-track envelope.
for s in (L*.23,L*.77):
    x,y,tx,ty,z=sample(s)
    for off in (-.27,.27):box('BRIDGE_support',(x-ty*off,-y-tx*off,(z+.035)/2),(.10,.10,z+.035),edge,.012)
scene=bpy.context.scene
scene.world=bpy.data.worlds.new('WORLD_studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.36,.43,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
camdata=bpy.data.cameras.new('CAM_main');cam=bpy.data.objects.new('CAM_main',camdata);scene.collection.objects.link(cam)
cam.location=(.8,-8.5,11.5);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=10.9;scene.camera=cam
keydata=bpy.data.lights.new('LGT_key','SUN');keydata.energy=2.2;keydata.angle=.22
key=bpy.data.objects.new('LGT_key',keydata);scene.collection.objects.link(key);key.rotation_euler=(.40,-.55,-.35)
filldata=bpy.data.lights.new('LGT_fill','POINT');filldata.energy=650;filldata.shadow_soft_size=4
fill=bpy.data.objects.new('LGT_fill',filldata);scene.collection.objects.link(fill);fill.location=(-3,-2,6)
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=960;scene.render.resolution_y=600;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
result={'track_length_m':TOTAL,'table':list(board.dimensions),'objects':len(bpy.data.objects),'camera':scene.camera.name}
if 'artifacts' in globals():
    target=artifacts.file(name='slot08-blockout.png',media_type='image/png');scene.render.filepath=str(target.path)
    scene.render.image_settings.media_type='IMAGE';scene.render.image_settings.file_format='PNG';bpy.ops.render.render(write_still=True);target.publish()
