/**
 * Fallback complete-room Three.js code (defines createCompleteRoom() returning a
 * THREE.Scene). Used when AI vision generation is unavailable so the studio always
 * renders a room. THREE is in scope when this string is eval'd by the viewer.
 */
export const FALLBACK_ROOM = `function createCompleteRoom() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3efe7);

  const roomWidth = 6, roomDepth = 6, roomHeight = 3;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    new THREE.MeshStandardMaterial({ color: 0xd9c7ad, roughness: 0.8 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
  back.position.set(0, roomHeight / 2, -roomDepth / 2);
  scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-roomWidth / 2, roomHeight / 2, 0);
  scene.add(left);

  // Sofa
  const sofa = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0xcfc3b0, roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.95), body); base.position.y = 0.45; sofa.add(base);
  const back2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.2), body); back2.position.set(0, 0.85, -0.38); sofa.add(back2);
  sofa.position.set(0, 0, -1.9); scene.add(sofa);

  // Coffee table
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xc6a578, roughness: 0.5 });
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.6), tableMat); tableTop.position.set(0, 0.42, -0.6); scene.add(tableTop);

  // Rug
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshStandardMaterial({ color: 0xe7dfce, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, -0.9); scene.add(rug);

  // Floor lamp
  const lamp = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.6, roughness: 0.4 }));
  pole.position.y = 0.8; lamp.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0xf3ead2, roughness: 0.8 }));
  shade.position.y = 1.65; lamp.add(shade);
  const bulb = new THREE.PointLight(0xfff1cc, 0.7, 6); bulb.position.set(0, 1.6, 0); lamp.add(bulb);
  lamp.position.set(-2.2, 0, -1.6); scene.add(lamp);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.5);
  dir.position.set(5, 8, 5); dir.castShadow = true; scene.add(dir);

  const camera = new THREE.PerspectiveCamera(60, 1.6, 0.1, 100);
  camera.position.set(4, 2.6, 4);
  camera.lookAt(0, 1, 0);
  scene.userData.camera = camera;

  return scene;
}`
