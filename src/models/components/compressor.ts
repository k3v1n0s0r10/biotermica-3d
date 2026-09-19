import {
  type BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  Shape,
  TorusGeometry,
  Vector2,
} from 'three';

/** Photo-based exterior, approximate metres. Ground origin, +Y up, terminal at +Z.
 * Every instance exclusively owns its GPU resources, including shared local materials.
 */
export function createCompressor() {
  const root = new Group();
  root.name = 'compressor';
  const paint = new MeshPhysicalMaterial({
    color: 0x101112,
    metalness: 0.48,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.17,
  });
  const copper = new MeshStandardMaterial({
    color: 0xb9753d,
    metalness: 0.85,
    roughness: 0.3,
  });
  const rubber = new MeshStandardMaterial({ color: 0x111213, roughness: 0.78 });
  const red = new MeshStandardMaterial({ color: 0xab2912, roughness: 0.34 });
  const paper = new MeshStandardMaterial({ color: 0xecebe3, roughness: 0.65 });
  const ink = new MeshStandardMaterial({ color: 0x343a3b, roughness: 0.7 });
  const yellow = new MeshStandardMaterial({ color: 0xe9c83d, roughness: 0.65 });
  function add(
    name: string,
    geometry: BufferGeometry,
    material: MeshStandardMaterial = paint,
    parent = root,
  ) {
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  // Add 4 cm to the straight shell; keep the dome and fittings at their original size.
  const addedHeight = 0.04;
  const profile: [number, number][] = [
    [0, 0.017],
    [0.067, 0.017],
    [0.079, 0.022],
    [0.087, 0.033],
    [0.09, 0.047],
    [0.09, 0.345],
    [0.091, 0.352],
    [0.092, 0.359],
    [0.091, 0.369],
    [0.087, 0.38],
    [0.077, 0.391],
    [0.061, 0.401],
    [0.04, 0.408],
    [0.018, 0.412],
    [0, 0.413],
  ];
  add(
    'hermetic-shell',
    new LatheGeometry(
      profile.map(([r, y]) => new Vector2(r, y >= 0.345 ? y + addedHeight : y)),
      96,
    ),
  );
  for (const y of [0.035, 0.35, 0.357]) {
    const seam = add(
      'shell-weld-seam',
      new TorusGeometry(y < 0.1 ? 0.085 : 0.0905, 0.0015, 8, 96),
    );
    seam.rotation.x = Math.PI / 2;
    seam.position.y = y > 0.1 ? y + addedHeight : y;
  }
  // Four stamped lobes with actual through-holes, joined under the pressure vessel.
  for (let i = 0; i < 4; i++) {
    const foot = new Shape();
    foot.moveTo(-0.045, 0.042);
    foot.bezierCurveTo(-0.04, 0.083, -0.023, 0.104, -0.019, 0.133);
    foot.bezierCurveTo(-0.016, 0.15, 0.016, 0.15, 0.019, 0.133);
    foot.bezierCurveTo(0.023, 0.104, 0.04, 0.083, 0.045, 0.042);
    foot.closePath();
    const hole = new Path();
    hole.absellipse(0, 0.132, 0.008, 0.006, 0, Math.PI * 2, true, 0);
    foot.holes.push(hole);
    const plate = add(
      `mounting-foot-${i}`,
      new ExtrudeGeometry(foot, {
        depth: 0.004,
        bevelEnabled: true,
        bevelSize: 0.0015,
        bevelThickness: 0.001,
        bevelSegments: 2,
        curveSegments: 16,
      }),
    );
    plate.rotation.set(-Math.PI / 2, 0, (i * Math.PI) / 2);
    plate.position.y = 0.008;
  }
  const base = add(
    'base-saddle',
    new CylinderGeometry(0.082, 0.089, 0.014, 64),
  );
  base.position.y = 0.018;
  function fitting(name: string, y: number, radius: number, angle: number) {
    const group = new Group();
    group.name = name;
    group.position.set(Math.sin(angle) * 0.084, y, Math.cos(angle) * 0.084);
    group.rotation.y = angle;
    root.add(group);
    const boss = add(
      'welded-port-boss',
      new CylinderGeometry(radius * 1.5, radius * 1.7, 0.012, 32),
      paint,
      group,
    );
    boss.rotation.x = Math.PI / 2;
    const tube = add(
      'copper-stub',
      new CylinderGeometry(radius, radius, 0.033, 32, 1, true),
      copper,
      group,
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.z = 0.019;
    const rim = add(
      'copper-port-rim',
      new TorusGeometry(radius - 0.001, 0.001, 8, 32),
      copper,
      group,
    );
    rim.position.z = 0.0355;
    const plug = add(
      'shipping-plug',
      new CylinderGeometry(radius * 0.79, radius * 0.79, 0.007, 32),
      rubber,
      group,
    );
    plug.rotation.x = Math.PI / 2;
    plug.position.z = 0.034;
  }
  fitting('suction-port', 0.302 + addedHeight, 0.012, 1.28);
  fitting('discharge-port', 0.378 + addedHeight, 0.008, 1.1);
  const terminal = add(
    'terminal-surround',
    new TorusGeometry(0.02, 0.005, 16, 48),
  );
  terminal.position.set(0, 0.267 + addedHeight, 0.09);
  const insulator = add(
    'terminal-insulator',
    new CylinderGeometry(0.014, 0.014, 0.008, 32),
    red,
  );
  insulator.rotation.x = Math.PI / 2;
  insulator.position.set(0, 0.267 + addedHeight, 0.095);
  for (let i = 0; i < 3; i++) {
    const pin = add(
      `terminal-pin-${i}`,
      new CylinderGeometry(0.002, 0.002, 0.004, 12),
      copper,
    );
    pin.rotation.x = Math.PI / 2;
    pin.position.set(
      Math.sin((i * Math.PI * 2) / 3) * 0.007,
      0.267 + addedHeight + Math.cos((i * Math.PI * 2) / 3) * 0.007,
      0.101,
    );
  }
  const lugShape = new Shape();
  lugShape.absellipse(0, 0, 0.012, 0.016, 0, Math.PI * 2, false, 0);
  const eye = new Path();
  eye.absellipse(0, 0.002, 0.007, 0.009, 0, Math.PI * 2, true, 0);
  lugShape.holes.push(eye);
  const lug = add(
    'lifting-eye',
    new ExtrudeGeometry(lugShape, {
      depth: 0.004,
      bevelEnabled: true,
      bevelSize: 0.001,
      bevelThickness: 0.001,
      bevelSegments: 2,
    }),
  );
  lug.position.set(-0.05, 0.404 + addedHeight, -0.025);
  lug.rotation.z = 0.3;
  // Curved printed label geometry avoids browser-only canvas dependencies.
  function label(
    name: string,
    y: number,
    height: number,
    start: number,
    arc: number,
    material: MeshStandardMaterial,
    radius = 0.0904,
  ) {
    const mesh = add(
      name,
      new CylinderGeometry(radius, radius, height, 64, 1, true, start, arc),
      material,
    );
    mesh.position.y = y;
  }
  label('identification-label', 0.169, 0.064, -0.86, 1.72, paper);
  label('safety-label', 0.11, 0.053, -0.86, 1.72, ink);
  label('warning-stripe', 0.14, 0.004, -0.86, 1.72, yellow, 0.0906);
  label('nameplate-heading', 0.189, 0.007, -0.75, 0.58, ink, 0.0906);
  for (let i = 0; i < 38; i++) {
    label(
      `barcode-${i}`,
      0.176,
      0.011 + (i % 3) * 0.001,
      0.02 + i * 0.018,
      i % 3 === 0 ? 0.012 : 0.006,
      ink,
      0.0907,
    );
  }
  for (let i = 0; i < 9; i++) {
    label(
      `specification-line-${i}`,
      0.161 - i * 0.0022,
      0.00065,
      -0.74,
      1.3 - (i % 3) * 0.15,
      ink,
      0.0907,
    );
    label(
      `safety-copy-${i}`,
      0.129 - i * 0.0045,
      0.0007,
      -0.74,
      1.15 - (i % 4) * 0.13,
      paper,
      0.0907,
    );
  }
  return root;
}
