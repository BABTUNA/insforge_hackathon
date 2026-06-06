/**
 * Parametric furniture as Three.js code strings. Each defines createFurniture()
 * returning a THREE.Group. Used as the safety fallback when AI generation fails,
 * so the 3D room is always populated (never gray boxes). THREE is in scope when
 * the string is eval'd by the viewer.
 */

const SOFA = `function createFurniture(){
  const g=new THREE.Group();
  const body=new THREE.MeshStandardMaterial({color:0xd8cfc0,roughness:0.9});
  const wood=new THREE.MeshStandardMaterial({color:0x6b4f3a,roughness:0.6});
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.45,0.9),body);base.position.y=0.45;g.add(base);
  const back=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.6,0.18),body);back.position.set(0,0.85,-0.36);g.add(back);
  for(const x of [-0.92,0.92]){const arm=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.55,0.9),body);arm.position.set(x,0.6,0);g.add(arm);}
  for(const x of [-0.55,0.55]){const c=new THREE.Mesh(new THREE.BoxGeometry(0.82,0.18,0.8),body);c.position.set(x,0.74,0.03);g.add(c);}
  for(const [x,z] of [[-0.9,0.4],[0.9,0.4],[-0.9,-0.4],[0.9,-0.4]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.22,12),wood);l.position.set(x,0.11,z);g.add(l);}
  return g;
}`

const TABLE = `function createFurniture(){
  const g=new THREE.Group();
  const wood=new THREE.MeshStandardMaterial({color:0xc8a87a,roughness:0.5});
  const top=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.08,0.6),wood);top.position.y=0.42;g.add(top);
  for(const [x,z] of [[-0.48,0.24],[0.48,0.24],[-0.48,-0.24],[0.48,-0.24]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.42,12),wood);l.position.set(x,0.21,z);g.add(l);}
  return g;
}`

const RUG = `function createFurniture(){
  const g=new THREE.Group();
  const m=new THREE.MeshStandardMaterial({color:0xeae3d6,roughness:1.0});
  const rug=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.03,1.6),m);rug.position.y=0.015;g.add(rug);
  const border=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.032,1.4),new THREE.MeshStandardMaterial({color:0xd7cbb4,roughness:1.0}));border.position.y=0.02;g.add(border);
  return g;
}`

const LAMP = `function createFurniture(){
  const g=new THREE.Group();
  const metal=new THREE.MeshStandardMaterial({color:0x2b2b2b,metalness:0.6,roughness:0.4});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.2,0.05,20),metal);base.position.y=0.025;g.add(base);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1.5,12),metal);pole.position.y=0.78;g.add(pole);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,0.3,24,1,true),new THREE.MeshStandardMaterial({color:0xf3ead2,roughness:0.8,side:THREE.DoubleSide}));shade.position.y=1.6;g.add(shade);
  const bulb=new THREE.PointLight(0xfff1cc,0.8,6);bulb.position.set(0,1.55,0);g.add(bulb);
  return g;
}`

const CHAIR = `function createFurniture(){
  const g=new THREE.Group();
  const fab=new THREE.MeshStandardMaterial({color:0xcdb1a4,roughness:0.9});
  const wood=new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:0.6});
  const seat=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.14,0.66),fab);seat.position.y=0.46;g.add(seat);
  const back=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.7,0.12),fab);back.position.set(0,0.82,-0.28);back.rotation.x=-0.12;g.add(back);
  for(const [x,z] of [[-0.3,0.28],[0.3,0.28],[-0.3,-0.28],[0.3,-0.28]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.46,12),wood);l.position.set(x,0.23,z);g.add(l);}
  return g;
}`

const BOOKSHELF = `function createFurniture(){
  const g=new THREE.Group();
  const wood=new THREE.MeshStandardMaterial({color:0xe7e2d8,roughness:0.7});
  const w=1.0,h=1.8,d=0.32;
  const side=()=>new THREE.Mesh(new THREE.BoxGeometry(0.05,h,d),wood);
  const left=side();left.position.set(-w/2,h/2,0);g.add(left);
  const right=side();right.position.set(w/2,h/2,0);g.add(right);
  for(let i=0;i<=4;i++){const sh=new THREE.Mesh(new THREE.BoxGeometry(w,0.05,d),wood);sh.position.set(0,(h/4)*i+0.02,0);g.add(sh);}
  const colors=[0x9b4f3a,0x3a5a7a,0x5a7a4a,0xc8a23a];
  for(let s=1;s<4;s++){for(let b=0;b<4;b++){const bk=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.28,0.2),new THREE.MeshStandardMaterial({color:colors[(s+b)%4],roughness:0.8}));bk.position.set(-0.35+b*0.12,(h/4)*s+0.18,0);g.add(bk);}}
  return g;
}`

const PLANT = `function createFurniture(){
  const g=new THREE.Group();
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.13,0.3,20),new THREE.MeshStandardMaterial({color:0xb9a98f,roughness:0.9}));pot.position.y=0.15;g.add(pot);
  const leafMat=new THREE.MeshStandardMaterial({color:0x3f7d4f,roughness:0.7});
  for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8),leafMat);leaf.scale.set(0.5,1.4,0.5);const a=(i/7)*Math.PI*2;leaf.position.set(Math.cos(a)*0.1,0.55+Math.sin(i)*0.15,Math.sin(a)*0.1);leaf.rotation.z=Math.cos(a)*0.5;g.add(leaf);}
  return g;
}`

const PAINTING = `function createFurniture(){
  const g=new THREE.Group();
  const frame=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.7,0.04),new THREE.MeshStandardMaterial({color:0x2b2b2b,roughness:0.5}));g.add(frame);
  const canvas=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.6,0.045),new THREE.MeshStandardMaterial({color:0xe9e2d2,roughness:0.9}));g.add(canvas);
  const blob=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.3,0.05),new THREE.MeshStandardMaterial({color:0xb58b62,roughness:0.8}));blob.position.set(-0.05,0.03,0.005);g.add(blob);
  g.position.y=1.4;
  return g;
}`

const GENERIC = `function createFurniture(){
  const g=new THREE.Group();
  const m=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6),new THREE.MeshStandardMaterial({color:0xb8b0a2,roughness:0.8}));
  m.position.y=0.3;g.add(m);return g;
}`

export function fallbackCode(type: string): string {
  const t = (type || '').toLowerCase()
  if (t.includes('sofa') || t.includes('couch')) return SOFA
  if (t.includes('coffee') || t.includes('table') || t.includes('desk')) return TABLE
  if (t.includes('rug') || t.includes('carpet')) return RUG
  if (t.includes('lamp') || t.includes('light')) return LAMP
  if (t.includes('chair') || t.includes('armchair') || t.includes('seat')) return CHAIR
  if (t.includes('book') || t.includes('shelf') || t.includes('storage')) return BOOKSHELF
  if (t.includes('plant') || t.includes('tree')) return PLANT
  if (t.includes('art') || t.includes('paint') || t.includes('picture') || t.includes('frame')) return PAINTING
  return GENERIC
}
