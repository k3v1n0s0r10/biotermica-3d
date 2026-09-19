import {
  BoxGeometry,
  type BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';

/** Photo-based proportions in metres; bottom-centre origin, ports face +Z.
 * Resources are owned exclusively by each returned model instance.
 */
export function createTitaniumHeatExchanger() {
  const root = new Group();
  root.name = 'titanium-heat-exchanger';
  const blue = new MeshPhysicalMaterial({
    color: 0x0057df,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
  });
  const sleeveMaterial = blue.clone();
  sleeveMaterial.transparent = true;
  const titanium = new MeshStandardMaterial({
    color: 0x989b91,
    metalness: 0.92,
    roughness: 0.28,
  });
  const brass = new MeshStandardMaterial({
    color: 0xb39445,
    metalness: 0.8,
    roughness: 0.3,
  });
  const copper = new MeshStandardMaterial({
    color: 0xb7784e,
    metalness: 0.8,
    roughness: 0.32,
  });
  function add(
    name: string,
    geometry: BufferGeometry,
    material = blue,
    parent = root,
  ) {
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function lathe(
    name: string,
    points: [number, number][],
    material = blue,
    parent = root,
  ) {
    const profile: Vector2[] = [];
    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[i + 1] ?? start;
      if (!start || !end) continue;
      const steps = Math.max(1, Math.ceil(Math.abs(end[1] - start[1]) / 0.003));
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        profile.push(
          new Vector2(
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t,
          ),
        );
      }
    }
    return add(name, new LatheGeometry(profile, 128), material, parent);
  }
  const lowerHousing = lathe('lower-housing', [
    [0, 0.012],
    [0.078, 0.012],
    [0.095, 0.025],
    [0.1, 0.045],
    [0.1, 0.13],
    [0.094, 0.13],
    [0.094, 0.04],
    [0, 0.027],
  ]);
  const upperHousing = lathe('upper-housing', [
    [0.094, 0.435],
    [0.101, 0.435],
    [0.101, 0.496],
    [0.099, 0.515],
    [0.091, 0.53],
    [0.075, 0.54],
    [0, 0.54],
    [0, 0.531],
    [0.083, 0.526],
    [0.094, 0.508],
    [0.094, 0.435],
  ]);
  openWaterBore(lowerHousing.geometry, 0.075);
  openWaterBore(upperHousing.geometry, 0.485);
  const sleeve = add(
    'reveal-sleeve',
    new CylinderGeometry(0.099, 0.099, 0.305, 96, 1, true),
    sleeveMaterial,
  );
  sleeve.position.y = 0.2825;
  sleeve.renderOrder = 3;
  for (const y of [0.128, 0.435]) {
    const seam = add('housing-seam', new TorusGeometry(0.1, 0.0017, 8, 80));
    seam.rotation.x = Math.PI / 2;
    seam.position.y = y;
  }
  for (const [name, y] of [
    ['water-inlet', 0.075],
    ['water-outlet', 0.485],
  ] as const) {
    const port = new Group();
    port.name = name;
    port.position.set(0, y, 0.077);
    port.rotation.x = Math.PI / 2;
    root.add(port);
    lathe(
      'hollow-union',
      [
        [0.036, 0],
        [0.044, 0],
        [0.044, 0.024],
        [0.053, 0.029],
        [0.053, 0.064],
        [0.043, 0.07],
        [0.04, 0.07],
        [0.04, 0.099],
        [0.034, 0.099],
        [0.034, 0.028],
        [0.036, 0],
      ],
      blue,
      port,
    );
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const grip = add(
        'union-grip',
        new BoxGeometry(0.009, 0.03, 0.006),
        blue,
        port,
      );
      grip.position.set(
        Math.sin(angle) * 0.053,
        0.047,
        Math.cos(angle) * 0.053,
      );
      grip.rotation.y = angle;
    }
  }
  for (const x of [-0.038, 0.038]) {
    const boss = add(
      'refrigerant-boss',
      new CylinderGeometry(0.018, 0.02, 0.032, 6),
    );
    boss.position.set(x, 0.549, 0);
    const nut = new Mesh(new CylinderGeometry(0.013, 0.013, 0.021, 6), brass);
    nut.name = 'brass-compression-nut';
    nut.position.set(x, 0.58, 0);
    root.add(nut);
    const stub = new Mesh(
      new LatheGeometry(
        [
          new Vector2(0.006, 0),
          new Vector2(0.006, 0.05),
          new Vector2(0.0045, 0.05),
          new Vector2(0.0045, 0),
        ],
        32,
      ),
      copper,
    );
    stub.name = 'copper-refrigerant-stub';
    stub.position.set(x, 0.59, 0);
    root.add(stub);
  }
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const foot = add('mounting-tab', new BoxGeometry(0.025, 0.012, 0.042));
    foot.position.set(Math.sin(angle) * 0.097, 0.006, Math.cos(angle) * 0.097);
    foot.rotation.y = angle;
  }
  const coil = createSerpentine(titanium);
  root.add(coil);
  const waterMaterial = new MeshPhysicalMaterial({
    color: 0x5dc5e5,
    transparent: true,
    opacity: 0.13,
    roughness: 0.12,
    metalness: 0,
    depthWrite: false,
  });
  const water = add(
    'water-volume',
    new CylinderGeometry(0.092, 0.092, 0.36, 80),
    waterMaterial,
  );
  water.position.y = 0.22;
  water.castShadow = false;
  water.renderOrder = 1;
  const surfaceMaterial = waterMaterial.clone();
  surfaceMaterial.opacity = 0.32;
  const surface = add(
    'water-surface',
    new CylinderGeometry(0.092, 0.092, 0.0008, 80),
    surfaceMaterial,
  );
  surface.position.y = 0.4;
  surface.castShadow = false;
  surface.renderOrder = 2;
  return root;
}

function createSerpentine(material: MeshStandardMaterial) {
  // One continuous path: top feed descends centrally, then winds back to the top.
  const points = [
    new Vector3(-0.038, 0.594, 0),
    new Vector3(-0.038, 0.09, 0),
    new Vector3(0.02, 0.072, 0),
  ];
  const turns = 17;
  for (let i = 0; i <= turns * 48; i++) {
    const t = i / (turns * 48);
    const angle = t * turns * Math.PI * 2;
    points.push(
      new Vector3(
        0.071 * Math.cos(angle),
        0.083 + t * 0.414,
        0.071 * Math.sin(angle),
      ),
    );
  }
  points.push(new Vector3(0.038, 0.52, 0), new Vector3(0.038, 0.594, 0));
  const geometry = new TubeGeometry(
    new CatmullRomCurve3(points, false, 'centripetal'),
    1600,
    0.009,
    16,
    false,
  );
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  // Shallow helical fluting catches metallic highlights like the reference tubing.
  for (let i = 0; i < position.count; i++) {
    const ridge =
      0.00065 *
      Math.sin(uv.getX(i) * Math.PI * 2 * 310 + uv.getY(i) * Math.PI * 6);
    position.setXYZ(
      i,
      position.getX(i) + normal.getX(i) * ridge,
      position.getY(i) + normal.getY(i) * ridge,
      position.getZ(i) + normal.getZ(i) * ridge,
    );
  }
  geometry.computeVertexNormals();
  const mesh = new Mesh(geometry, material);
  mesh.name = 'titanium-serpentine';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** Remove wall faces within each water passage. The union overlaps the cut edge. */
function openWaterBore(geometry: BufferGeometry, centreY: number) {
  const index = geometry.getIndex();
  if (!index) throw new Error('Housing requires indexed geometry.');
  const position = geometry.getAttribute('position');
  const kept: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    const x = (position.getX(a) + position.getX(b) + position.getX(c)) / 3;
    const y =
      (position.getY(a) + position.getY(b) + position.getY(c)) / 3 - centreY;
    const z = (position.getZ(a) + position.getZ(b) + position.getZ(c)) / 3;
    if (z <= 0 || x * x + y * y > 0.038 ** 2) kept.push(a, b, c);
  }
  geometry.setIndex(kept);
}
