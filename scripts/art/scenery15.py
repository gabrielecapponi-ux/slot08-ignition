"""Original SLOT08 miniature landmarks, modelled and exported with Blender.

blender -b -P scripts/art/scenery15.py -- assets/scenery15.glb [--render]
The GLB contains four independently instantiable PROP_ roots, all planted at Z=0.
References inform the architectural/material direction only; no supplied photos,
third-party logos, or unlicensed scanned models are embedded.
"""
import bpy, bmesh, math, random, sys, json, gzip
import numpy as np
from pathlib import Path
from collections import defaultdict
from math import sin, cos, pi
from mathutils import Vector, Euler, noise as bnoise

args=sys.argv[sys.argv.index('--')+1:]
output=Path(args[0]);output.parent.mkdir(parents=True,exist_ok=True)
render='--render' in args
bpy.ops.wm.read_factory_settings(use_empty=True)
rng=random.Random(1508)

def tint(code,gain=1):
    c=[int(code[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(min(1,(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)*gain) for v in c)+(1,)

materials={}
for name,metal,rough,coat,emission in [
    ('limestone',.02,.79,0,0),('soil',0,.96,0,0),('foliage',0,.85,0,0),
    ('brushed_alloy',.82,.26,.2,0),('enamel',.28,.27,.75,0),
    ('glass',.47,.13,.75,0),('window_lit',.12,.27,0,1.6),
    ('neon',.15,.22,.8,3.5),('water',.10,.22,1,0),('foam',.02,.54,0,.12)]:
    m=bpy.data.materials.new('Scenery15_'+name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=coat
    node=m.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='tint'
    m.node_tree.links.new(node.outputs['Color'],p.inputs['Base Color'])
    if emission:
        m.node_tree.links.new(node.outputs['Color'],p.inputs['Emission Color'])
        p.inputs['Emission Strength'].default_value=emission
    materials[name]=m

# Tileable, original mineral color and relief. The pixels are derived from the
# same periodic height field, not photographs; packed images are embedded in GLB.
edge=512
yy,xx=np.mgrid[0:edge,0:edge]/edge
noise=np.zeros((edge,edge),dtype=np.float32)
prng=np.random.default_rng(1508)
for frequency,amplitude in [(2,.31),(5,.22),(11,.15),(23,.12),(47,.09),(97,.07)]:
    grid=prng.random((frequency,frequency))
    gx=xx*frequency;gy=yy*frequency;ix=gx.astype(int);iy=gy.astype(int)
    tx=gx-ix;ty=gy-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty)
    a=grid[iy%frequency,ix%frequency]*(1-tx)+grid[iy%frequency,(ix+1)%frequency]*tx
    b=grid[(iy+1)%frequency,ix%frequency]*(1-tx)+grid[(iy+1)%frequency,(ix+1)%frequency]*tx
    noise+=amplitude*(a*(1-ty)+b*ty)
fissure=np.power(np.maximum(0,1-np.abs(np.sin(xx*pi*12+.9*np.sin(yy*4*pi)+noise*6))/.12),3)
grain=prng.random((edge,edge))
height=noise*.60+grain*.030-fissure*.13
tone=np.clip(.39+noise*1.06+(grain-.5)*.16-fissure*.41,.19,1)
rgba=np.ones((edge,edge,4),dtype=np.float32)
rgba[:,:,0]=tone*1.0;rgba[:,:,1]=tone*.987;rgba[:,:,2]=tone*.944
color_image=bpy.data.images.new('SLOT08 original mineral pigment',width=edge,height=edge)
color_image.pixels.foreach_set(rgba.ravel());color_image.pack()
dx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*11
dy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*11
normal=np.stack([-dx,-dy,np.ones_like(dx)],axis=2);normal/=np.linalg.norm(normal,axis=2)[:,:,None]
rgba[:,:,:3]=normal*.5+.5
normal_image=bpy.data.images.new('SLOT08 original mineral relief',width=edge,height=edge)
normal_image.colorspace_settings.name='Non-Color';normal_image.pixels.foreach_set(rgba.ravel());normal_image.pack()
rock_mat=materials['limestone'];tree=rock_mat.node_tree;principled=tree.nodes.get('Principled BSDF')
pigment=tree.nodes.new('ShaderNodeTexImage');pigment.image=color_image
vertex=next(n for n in tree.nodes if n.type=='VERTEX_COLOR')
multiply=tree.nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1
tree.links.new(pigment.outputs['Color'],multiply.inputs[1]);tree.links.new(vertex.outputs['Color'],multiply.inputs[2]);tree.links.new(multiply.outputs[0],principled.inputs['Base Color'])
relief=tree.nodes.new('ShaderNodeTexImage');relief.image=normal_image
normal_node=tree.nodes.new('ShaderNodeNormalMap');normal_node.inputs['Strength'].default_value=1.3
tree.links.new(relief.outputs['Color'],normal_node.inputs['Color']);tree.links.new(normal_node.outputs[0],principled.inputs['Normal'])

class Prop:
    def __init__(self,name):self.name=name;self.buckets=defaultdict(lambda:[[],[],[],[]])
    def mesh(self,vertices,faces,color,material='limestone',smooth=False,jitter=0):
        v,f,c,s=self.buckets[material];n=len(v);v.extend(vertices)
        for face in faces:
            f.append(tuple(n+i for i in face));c.append(tint(color,1+rng.uniform(-jitter,jitter)));s.append(smooth)
    def box(self,x,y,z,w,d,h,color,material='enamel',angle=0):
        verts=[]
        for a,b,k in [(-1,-1,0),(1,-1,0),(1,1,0),(-1,1,0),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
            dx=w*a/2;dy=d*b/2;verts.append((x+dx*cos(angle)-dy*sin(angle),y+dx*sin(angle)+dy*cos(angle),z+k*h))
        self.mesh(verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],color,material)
    def rod(self,a,b,r,color,material='brushed_alloy',n=8,r2=None):
        a=Vector(a);b=Vector(b);axis=(b-a).normalized()
        u=axis.cross(Vector((0,1,0)) if abs(axis.y)<.9 else Vector((1,0,0))).normalized();v=axis.cross(u)
        vertices=[tuple(origin+(u*cos(i*2*pi/n)+v*sin(i*2*pi/n))*radius)
                  for origin,radius in ((a,r),(b,r if r2 is None else r2)) for i in range(n)]
        faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)]
        self.mesh(vertices,faces,color,material,True)
    def line(self,points,r,color,material='brushed_alloy',n=6):
        # Swept cross sections make a continuous strip, with no overlapping tubes at bends.
        rings=[]
        for i,p in enumerate(points):
            p=Vector(p);axis=(Vector(points[min(len(points)-1,i+1)])-Vector(points[max(0,i-1)])).normalized()
            side=axis.cross(Vector((0,0,1)))
            if side.length<.02:side=axis.cross(Vector((0,1,0)))
            side.normalize();up=axis.cross(side)
            rings.extend(tuple(p+r*(side*cos(j*2*pi/n)+up*sin(j*2*pi/n))) for j in range(n))
        faces=[]
        for i in range(len(points)-1):
            for j in range(n):a=i*n+j;b=i*n+(j+1)%n;faces.append((a,b,b+n,a+n))
        self.mesh(rings,faces,color,material,True)
    def rock(self,x,y,z,w,d,h,palette,n=16,seed=0):
        # A closed, displaced icosphere, rather than a cylinder assembled from
        # horizontal rings. Every boulder has its own fracture planes and tilt.
        local=random.Random(seed);bm=bmesh.new()
        bmesh.ops.create_icosphere(bm,subdivisions=4 if max(w,d,h)>.5 else 2,radius=1)
        bm.verts.ensure_lookup_table();bm.verts.index_update()
        faces=[tuple(v.index for v in f.verts) for f in bm.faces]
        offset=Vector((seed*.731,seed*.917,seed*.381))
        rotation=Euler((local.uniform(-.38,.38),local.uniform(-.34,.34),local.uniform(-pi,pi))).to_matrix()
        verts=[];shade=[]
        # Rotated planes make broad split faces without flat artificial lids.
        plane=Vector((local.uniform(-.7,.7),local.uniform(-.7,.7),local.uniform(.1,.6))).normalized()
        for vertex in bm.verts:
            q=rotation@vertex.co
            coarse=bnoise.noise(q*2.35+offset)
            medium=bnoise.noise(q*7.2+offset)
            fine=bnoise.noise(q*16.1+offset)
            radius=1+.34*coarse+.15*medium+.042*fine
            q=Vector(tuple(math.copysign(abs(v)**.86,v) for v in q))*radius
            distance=q.dot(plane)
            if distance>.63:q-=plane*(distance-.63)*.63
            # Cut a narrow angled cleft into a minority of the surface.
            crack=math.exp(-((q.x*.84+q.z*.35-.13)/.025)**2)*.082
            q.y+=crack if q.y<0 else -crack
            verts.append(q);shade.append(.98+.045*coarse+.018*medium)
        bm.free()
        lo=[min(v[i] for v in verts) for i in range(3)];hi=[max(v[i] for v in verts) for i in range(3)]
        vertices=[(x+(q.x-(lo[0]+hi[0])/2)*2*w/(hi[0]-lo[0]),
                   y+(q.y-(lo[1]+hi[1])/2)*2*d/(hi[1]-lo[1]),
                   z+(q.z-lo[2])*h/(hi[2]-lo[2])) for q in verts]
        # A single mineral family varies continuously over a rock. No horizontal
        # color bands: the previous repeated stripes looked like stacked boxes.
        color=palette[seed%len(palette)]
        v,f,c,s=self.buckets['limestone'];start=len(v);v.extend(vertices)
        for face in faces:
            f.append(tuple(start+i for i in face));c.append(tint(color,sum(shade[i] for i in face)/len(face)));s.append(True)
    def text(self,value,position,size,color,material='neon',rotation=(pi/2,0,0)):
        curve=bpy.data.curves.new('engraved_brand','FONT');curve.body=value;curve.size=size;curve.extrude=.0015;curve.bevel_depth=.0003;curve.resolution_u=4;curve.align_x='CENTER'
        ob=bpy.data.objects.new('lettering',curve);bpy.context.collection.objects.link(ob);ob.location=position;ob.rotation_euler=rotation
        bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob=bpy.context.object
        ob.update_tag();bpy.context.view_layer.update();vertices=[tuple(ob.matrix_world@v.co) for v in ob.data.vertices]
        self.mesh(vertices,[tuple(p.vertices) for p in ob.data.polygons],color,material)
        bpy.data.objects.remove(ob,do_unlink=True)
    def export(self):
        root=bpy.data.objects.new(self.name,None);bpy.context.collection.objects.link(root)
        for key,(verts,faces,colors,smooth) in self.buckets.items():
            mesh=bpy.data.meshes.new(self.name+'_'+key);mesh.from_pydata(verts,[],faces);mesh.update()
            ca=mesh.color_attributes.new(name='tint',type='BYTE_COLOR',domain='CORNER')
            if key=='limestone':
                uv=mesh.uv_layers.new(name='mineral_box_projection')
                for poly in mesh.polygons:
                    axis=max(range(3),key=lambda n:abs(poly.normal[n]));a,b=[j for j in range(3) if j!=axis]
                    for loop in poly.loop_indices:
                        co=mesh.vertices[mesh.loops[loop].vertex_index].co
                        uv.data[loop].uv=(co[a]*3,co[b]*3)
            for p,c,s in zip(mesh.polygons,colors,smooth):
                p.use_smooth=s
                for j in p.loop_indices:ca.data[j].color=c
            if key=='limestone':
                bm=bmesh.new();bm.from_mesh(mesh)
                bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=0.000001)
                bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
                bm.to_mesh(mesh);bm.free();mesh.update()
            ob=bpy.data.objects.new(mesh.name,mesh);bpy.context.collection.objects.link(ob);ob.parent=root;mesh.materials.append(materials[key])
        return root

def hotel():
    p=Prop('PROP_neon_hotel15')
    p.box(0,0,0,1.66,.76,.075,'807c70','limestone')
    p.box(0,0,.075,1.53,.66,.18,'252c38','enamel')
    # A stepped central hotel and two lower wings; opaque faceted panes sit inside
    # relief frames rather than sharing coincident surfaces with the wall.
    for center,width,height,depth in [(0,.76,2.42,.57),(-.59,.40,1.91,.48),(.59,.40,1.91,.48)]:
        p.box(center,0,.25,width,depth,height-.25,'d3bea0','limestone')
        floors=int((height-.40)/.143);columns=5 if width>.5 else 3
        for side in (-1,1):
            y=side*(depth/2+.003)
            for floor in range(floors):
                z=.36+floor*.143
                p.box(center,y,z-.015,width+.018,.024,.017,'a58a66','brushed_alloy')
                for col in range(columns):
                    x=center+(col-(columns-1)/2)*(width-.08)/columns
                    lit=rng.random()>.31;color=rng.choice(['ffe4a7','e9c879','d3e8e9']) if lit else '21303d'
                    p.box(x,y+side*.009,z,.085 if columns==5 else .073,.009,.099,color,'window_lit' if lit else 'glass')
                    p.box(x,y+side*.016,z,.004,.005,.099,'b9a279','brushed_alloy')
            for col in range(columns+1):
                x=center+(col-columns/2)*(width-.08)/columns
                p.box(x,y,.28,.012,.028,height-.30,'e0c69d','limestone')
        for side in (-1,1):
            x=center+side*(width/2+.007)
            for floor in range(floors):
                z=.36+floor*.143
                p.box(x,0,z-.015,.025,depth+.015,.017,'a58a66','brushed_alloy')
                for col in range(3):
                    y=(col-1)*(depth-.08)/3;lit=rng.random()>.35
                    p.box(x+side*.008,y,z,.009,.074,.099,'ffe0a0' if lit else '21303d','window_lit' if lit else 'glass')
            for col in range(4):p.box(x,(col-1.5)*(depth-.08)/3,.28,.028,.010,height-.30,'dfc59b','limestone')
        for z,w,d in [(height-.045,width+.05,depth+.045),(height,width+.07,depth+.06)]:
            p.box(center,0,z,w,d,.025,'c9b18d','limestone')
            for side in (-1,1):p.box(center,side*(d/2+.006),z+.006,w,.009,.012,'ffbd61','neon')
        # Rooftop plant enclosures and fluted crown.
        p.box(center,.035,height+.026,width*.72,depth*.64,.075,'56616a','enamel')
        for i in range(8):p.box(center+(i-3.5)*width*.081,.035,height+.102,.006,depth*.65,.012,'acb2af','brushed_alloy')
    p.box(0,-.43,.23,1.17,.28,.043,'334955','enamel')
    for x in [-.50,-.25,.25,.50]:p.rod((x,-.49,.065),(x,-.49,.26),.016,'c6a66c','brushed_alloy',10)
    p.box(0,-.571,.238,1.18,.008,.012,'54dedf','neon')
    for x in [-.12,0,.12]:p.box(x,-.336,.079,.104,.015,.146,'6c98a1','glass')
    p.box(0,-.311,2.15,.70,.025,.18,'182733','enamel')
    p.text('SLOT 08',(0,-.327,2.19),.12,'ffd586')
    return p.export()

def tower():
    p=Prop('PROP_neon_tower15')
    # Original four-legged observation tower, not a copy of a particular landmark.
    p.box(0,0,0,.99,.99,.065,'79776e','limestone')
    levels=[(.07,.45),(.68,.31),(1.30,.20),(1.93,.13),(2.25,.10)]
    for side in (-1,1):
        for other in (-1,1):
            for (za,ra),(zb,rb) in zip(levels,levels[1:]):
                p.rod((side*ra,other*ra,za),(side*rb,other*rb,zb),.018,'b49a65','brushed_alloy',8)
    for k,((za,ra),(zb,rb)) in enumerate(zip(levels,levels[1:])):
        for j in range(4):
            a=j*pi/2
            def pt(t,d):return (cos(a)*d-sin(a)*t,sin(a)*d+cos(a)*t)
            for m in range(3):
                t0=m/3;t1=(m+1)/3;r0=ra+(rb-ra)*t0;r1=ra+(rb-ra)*t1;z0=za+(zb-za)*t0;z1=za+(zb-za)*t1
                x,y=pt(-r0,r0);xx,yy=pt(r1,r1);p.rod((x,y,z0),(xx,yy,z1),.0065,'8d896f','brushed_alloy',5)
                x,y=pt(r0,r0);xx,yy=pt(-r1,r1);p.rod((x,y,z0),(xx,yy,z1),.0065,'b09f7b','brushed_alloy',5)
                x,y=pt(-r0,r0);xx,yy=pt(r0,r0);p.rod((x,y,z0),(xx,yy,z0),.008,'c3b17c','brushed_alloy',6)
        for side in (-1,1):
            for other in (-1,1):p.rod((side*ra,other*ra,za),(side*rb,other*rb,zb),.006,'f5ba60' if k%2 else '62dbe3','neon',5)
    for z,r,h in [(1.30,.29,.055),(2.18,.23,.05),(2.23,.19,.16),(2.39,.24,.035)]:
        p.rod((0,0,z),(0,0,z+h),r,'b69b6c' if h<.10 else '234255','brushed_alloy' if h<.10 else 'glass',32)
    for z,r in [(1.36,.28),(2.22,.228),(2.42,.235)]:p.line([(r*cos(j*2*pi/80),r*sin(j*2*pi/80),z) for j in range(81)],.008,'ffba65','neon')
    p.rod((0,0,2.42),(0,0,2.73),.025,'adb7b4','brushed_alloy',10,.006)
    p.rod((0,0,2.73),(0,0,2.77),.011,'fa565b','neon',10)
    # Circular observation gondolas and a luminous racing globe give recognisable skyline detail.
    for j in range(12):
        a=j*2*pi/12;p.rod((.185*cos(a),.185*sin(a),2.25),(.185*cos(a),.185*sin(a),2.38),.004,'c4b386','brushed_alloy',5)
    return p.export()

def pine(p,x,y,z,h,seed):
    local=random.Random(seed)
    p.rod((x,y,z),(x+.015,y-.009,z+h),h*.028,'695849','soil',8,.008)
    for k in range(7):
        t=k/7;zz=z+h*(.26+.65*t);r=h*(.24*(1-t)+.04)
        for j in range(7):
            a=j*2*pi/7+k*.87;rr=r*local.uniform(.85,1.12);tip=(x+cos(a)*rr,y+sin(a)*rr,zz-.07*h)
            p.rod((x,y,zz),tip,.006*h,'5b5340','soil',5,.001)
            vertices=[(x,y,zz+h*.13),(tip[0]-sin(a)*rr*.25,tip[1]+cos(a)*rr*.25,tip[2]),(tip[0],tip[1],tip[2]+.015),(tip[0]+sin(a)*rr*.25,tip[1]-cos(a)*rr*.25,tip[2])]
            p.mesh(vertices,[(0,1,2),(0,2,3)],local.choice(['25493a','42644a','355b41','55744c']),'foliage')

def cascade():
    from mathutils.bvhtree import BVHTree
    p=Prop('PROP_cascade15');palette=['879083','92998a','7b8679','a2a595','7f8d7b','8f9887']
    # Interlocking irregular limestone masses. They overlap below the exposed
    # surface, but neither tops nor seams form a regular series of shelves.
    blocks=[(-.60,.31,0,.53,.43,.86),(.13,.40,0,.57,.45,.94),(.66,.27,0,.42,.42,.77),
            (-.59,.37,.58,.49,.41,.96),(.03,.44,.69,.56,.41,1.03),(.65,.35,.51,.45,.37,1.02),
            (-.38,.43,1.19,.53,.36,.79),(.31,.43,1.19,.48,.35,.84),(-.86,.03,0,.30,.30,.57),(.84,.03,0,.28,.30,.62)]
    for i,(x,y,z,w,d,h) in enumerate(blocks):p.rock(x,y,z,w,d,h,palette,18,seed=600+i*11)
    vertices,faces,*_=p.buckets['limestone'];surface=BVHTree.FromPolygons(vertices,faces)
    def face_y(x,z):
        result=surface.ray_cast(Vector((x,-4,z)),Vector((0,1,0)),8)
        return result[0].y if result[0] is not None else .20
    # Dozens of actual, slender rivulets with irregular breaks and lateral drift.
    # The water attaches to the exposed rock instead of crossing its interior.
    falls=[(-.41,1.73,.12),(-.14,1.91,.21),(.21,1.88,.19),(.57,1.58,.10)]
    for stream,(cx,top,width) in enumerate(falls):
        start=face_y(cx,top)-.012
        for strand in range(48 if width>.15 else 31):
            u=rng.uniform(-.47,.47)*width;phase=rng.random()*2*pi
            top2=top-rng.uniform(0,.022);points=[]
            for k in range(33):
                t=k/32;z=top2*(1-t)+.103*t
                x=cx+u*(1+.48*t)+(.002+.007*t)*sin(t*39+phase)+.003*sin(t*83+phase)
                free=start-.06*t-.27*t*t
                y=min(free,face_y(x,z)-.010)+.003*sin(t*29+phase)
                points.append((x,y,z))
            radius=rng.uniform(.0014,.0028)
            p.line(points,radius,rng.choice(['d4e2db','c8ddd6','b7cfc9','e7eee8']),'foam' if strand%3 else 'water',3)
            # Tiny disconnected droplets follow the outside of the plunge.
            if strand%4==0:
                for k in range(5):
                    t=rng.uniform(.58,.96);z=top2*(1-t)+.11*t
                    x=cx+u*(1+.6*t)+rng.uniform(-.018,.018);y=min(start-.06*t-.27*t*t,face_y(x,z)-.016)-rng.uniform(.002,.022)
                    p.rod((x,y,z),(x+.0005,y-.0007,z-.009),rng.uniform(.0012,.0028),'d9e6de','foam',5,.0007)
    # The shoreline is an irregular shallow basin; rock clusters interrupt it,
    # rather than identical polygonal stones lining a perfect ellipse.
    vertices=[(0,-.43,.085)];rings=16;segments=96
    for ring in range(1,rings+1):
        t=ring/rings
        for j in range(segments):
            a=j*2*pi/segments;r=1+.072*sin(a*5)+.039*cos(a*9+.7)+.021*cos(a*17)
            vertices.append((cos(a)*1.08*t*r,-.43+sin(a)*.72*t*r,.085+.0017*sin(t*73-a*3)))
    for j in range(segments):p.mesh([vertices[q] for q in [0,1+j,1+(j+1)%segments]],[(0,1,2)],'397d76','water',True)
    for ring in range(rings-1):
        for j in range(segments):
            a=1+ring*segments+j;b=1+ring*segments+(j+1)%segments
            p.mesh([vertices[q] for q in [a,b,b+segments,a+segments]],[(0,1,2,3)],'4b978b' if ring>11 else '3f837c','water',True)
    # A closed wet stone bank carries the entire pond. No paper-thin water edge
    # floats over the ground; the bank and pond share the same irregular outline.
    edge=vertices[-segments:]
    lower=[(x*1.025,-.43+(y+.43)*1.025,0) for x,y,z in edge]
    shoulder=[(x*1.017,-.43+(y+.43)*1.017,.072+.004*sin(i*.7)) for i,(x,y,z) in enumerate(edge)]
    for i in range(segments):
        j=(i+1)%segments
        p.mesh([lower[i],lower[j],shoulder[j],shoulder[i]],[(0,1,2,3)],'566454','soil',True)
        p.mesh([shoulder[i],shoulder[j],edge[j],edge[i]],[(0,1,2,3)],'6e7c60','soil',True)
    p.mesh(lower,[tuple(reversed(range(segments)))],'495749','soil')
    for i,(x,y,w,d,h) in enumerate([(-.96,-.31,.24,.20,.26),(-.82,-.57,.22,.15,.16),(-1.02,-.66,.18,.16,.21),(-.74,-.80,.15,.18,.13),
                                  (.94,-.34,.23,.20,.28),(.85,-.65,.22,.17,.16),(.69,-.86,.17,.19,.17),(.97,-.78,.15,.12,.15),
                                  (-.35,-1.03,.17,.12,.09),(.25,-1.10,.14,.09,.07)]):
        p.rock(x,y,0,w,d,h,palette,seed=750+i*7)
    for i in range(24):
        side=-1 if i%2 else 1;x=side*rng.uniform(.75,1.09);y=rng.uniform(-.77,-.18);size=rng.uniform(.025,.075)
        p.rock(x,y,.015,size,size*rng.uniform(.55,.9),size*rng.uniform(.5,.85),palette,seed=870+i)
    bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=1,radius=1);bm.verts.ensure_lookup_table();bm.verts.index_update()
    fv=[v.co.copy() for v in bm.verts];ff=[tuple(v.index for v in f.verts) for f in bm.faces];bm.free()
    for cx,top,width in falls:
        # Real geometry in the whitewater pool, small enough to read as bubbles.
        start=face_y(cx,top);cy=min(start-.33,face_y(cx,.11)-.015)
        for j in range(85):
            angle=rng.random()*2*pi;radius=(rng.random()**.5)*width*.65
            x=cx+cos(angle)*radius;y=cy+sin(angle)*radius*.48
            size=rng.uniform(.002,.009)*(1-radius/(width*.9))
            p.mesh([(x+v.x*size,y+v.y*size,.090+v.z*size*.55) for v in fv],ff,rng.choice(['dbe6dc','c7dcd3','b9d3ca']),'foam',True)
    return p.export()

def cliff():
    p=Prop('PROP_alpine_cliff15');palette=['858b82','92978d','7c857d','a3a69a','7e877d','969b90','737e75']
    # Separate oblique stone masses form an asymmetrical ridge with a broken crest.
    # No cylinders, flat caps or regular painted strata.
    blocks=[(-.58,.21,0,.89,.63,2.35),(.48,.25,0,.86,.57,2.19),
            (-.27,.39,1.28,.74,.57,2.72),(.66,.37,1.14,.68,.49,2.40),(-.92,.15,.78,.58,.51,1.95),
            (-1.00,-.26,0,.43,.37,1.01),(.51,-.30,0,.57,.37,1.24),(.99,-.16,0,.40,.36,.72)]
    for i,(x,y,z,w,d,h) in enumerate(blocks):p.rock(x,y,z,w,d,h,palette,seed=900+i*13)
    for i in range(46):
        x=rng.uniform(-1.40,1.34);y=rng.uniform(-.86,-.27);size=rng.uniform(.025,.14)
        p.rock(x,y,0,size,size*rng.uniform(.61,.95),size*rng.uniform(.48,1.1),palette,seed=1020+i*3)
    return p.export()

roots=[hotel(),tower(),cascade(),cliff()]
bpy.context.view_layer.update()
stats=[]
for root in roots:
    bounds=[root.matrix_world@Vector(c) for ob in root.children for c in ob.bound_box]
    lo=[min(v[i] for v in bounds) for i in range(3)];hi=[max(v[i] for v in bounds) for i in range(3)]
    stats.append({'name':root.name,'dimensions':[round(b-a,4) for a,b in zip(lo,hi)],'min':[round(v,4) for v in lo],
                  'materials':len(root.children),'triangles':sum(len(p.vertices)-2 for ob in root.children for p in ob.data.polygons)})
bpy.ops.object.select_all(action='DESELECT')
for root in roots:
    root.select_set(True)
    for ob in root.children:ob.select_set(True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(Path(__file__).with_suffix('.blend')),compress=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
print('SCENERY15 '+json.dumps(stats))
print('GLB_BYTES '+str(output.stat().st_size))
compressed=output.with_suffix(output.suffix+'.gz')
compressed.write_bytes(gzip.compress(output.read_bytes(),compresslevel=9,mtime=0))
print('GZIP_BYTES '+str(compressed.stat().st_size))

if render:
    # Review renders use the exact exported geometry and materials, no retouching.
    # The named sources stay in place; only visibility changes between shots.
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.cycles.use_denoising=False;scene.render.resolution_x=720;scene.render.resolution_y=720;scene.render.resolution_percentage=100
    if scene.world is None:scene.world=bpy.data.worlds.new('Scenery15 review world')
    scene.world.color=(.12,.12,.12);scene.view_settings.view_transform='AgX'
    floor_mat=bpy.data.materials.new('review_floor');floor_mat.diffuse_color=(.14,.16,.17,1)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012));floor=bpy.context.object;floor.data.materials.append(floor_mat)
    bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.lens=48
    for location,energy,size in [((3,-4,7),650,5),((-4,-1,4),350,4),((1,5,5),850,3)]:
        bpy.ops.object.light_add(type='AREA',location=location);light=bpy.context.object;light.data.energy=energy;light.data.shape='DISK';light.data.size=size
        light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
    for root,stat in zip(roots,stats):
        for r in roots:
            for ob in r.children:ob.hide_render=r!=root
        height=stat['dimensions'][2];target=Vector((0,0,height*.45));distance=max(3.8,height*2.05)
        camera.location=(distance*.57,-distance*.78,height*.45+distance*.36)
        camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(output.parent/(root.name.replace('PROP_','scenery15-')+'.png'))
        bpy.ops.render.render(write_still=True)
