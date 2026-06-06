/**
 * Fallback complete-room Three.js code (defines createCompleteRoom() returning a
 * THREE.Scene). Used ONLY when AI vision generation is unavailable. It is an
 * EMPTY room shell (floor, walls, ceiling, window, lighting) — no furniture — so
 * a fallback never fabricates furniture that wasn't in the user's photo.
 * THREE is in scope when this string is eval'd by the viewer.
 */
export const FALLBACK_ROOM = `function createCompleteRoom() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3efe7);

  const roomWidth = 6, roomDepth = 6, roomHeight = 3;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    new THREE.MeshStandardMaterial({ color: 0xd9c7ad, roughness: 0.85 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    new THREE.MeshStandardMaterial({ color: 0xf2ede3, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = roomHeight;
  scene.add(ceiling);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
  back.position.set(0, roomHeight / 2, -roomDepth / 2);
  back.receiveShadow = true;
  scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-roomWidth / 2, roomHeight / 2, 0);
  left.receiveShadow = true;
  scene.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMat);
  right.rotation.y = -Math.PI / 2;
  right.position.set(roomWidth / 2, roomHeight / 2, 0);
  scene.add(right);

  // Window on the back wall
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xbcd3e0, roughness: 0.2, metalness: 0.1 })
  );
  win.position.set(0, 1.6, -roomDepth / 2 + 0.02);
  scene.add(win);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.5);
  dir.position.set(5, 8, 5);
  dir.castShadow = true;
  scene.add(dir);

  const camera = new THREE.PerspectiveCamera(60, 1.6, 0.1, 100);
  camera.position.set(4, 2.6, 4);
  camera.lookAt(0, 1, 0);
  scene.userData.camera = camera;

  return scene;
}`
