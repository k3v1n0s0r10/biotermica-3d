import {
  BoxGeometry,
  type BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Path,
  Shape,
  TorusGeometry,
} from 'three';

/** Reference-based concept, in metres. +Y up, service corner at +X/+Z.
 * Dimensions are illustrative, not manufacturing measurements.
 */
export function createHeatPump() {
  const product = new Group();
  product.name = 'heat-pump';
  const paint = new MeshStandardMaterial({
    color: 0x272b2d,
    metalness: 0.25,
    roughness: 0.43,
  });
  const edge = new MeshStandardMaterial({
    color: 0x34393b,
    metalness: 0.45,
    roughness: 0.36,
  });
  const black = new MeshStandardMaterial({ color: 0x090d0f, roughness: 0.8 });
  const coil = new MeshStandardMaterial({
    color: 0x1c2325,
    metalness: 0.7,
    roughness: 0.55,
  });
  const steel = new MeshStandardMaterial({
    color: 0x929b9e,
    metalness: 0.8,
    roughness: 0.3,
  });
  const pvc = new MeshStandardMaterial({
    color: 0xdce0df,
    metalness: 0,
    roughness: 0.38,
  });

  function mesh(
    name: string,
    geometry: BufferGeometry,
    material = paint,
    parent = product,
  ) {
    const object = new Mesh(geometry, material);
    object.name = name;
    parent.add(object);
    return object;
  }
  function box(
    name: string,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material = paint,
    parent = product,
  ) {
    const object = mesh(name, new BoxGeometry(w, h, d), material, parent);
    object.position.set(x, y, z);
    return object;
  }
  // Dimensions in metres: a 3 mm outward offset keeps the lid ledge visible.
  const cabinetHalf = 0.454;
  const lidOverhang = 0.003;
  const lidHalf = cabinetHalf + lidOverhang;
  const lidRadius = 0.045 + lidOverhang;
  function outline(half: number, radius: number) {
    const shape = new Shape();
    const tangent = half - radius;
    shape.moveTo(-tangent, -half);
    shape.lineTo(tangent, -half);
    shape.absarc(tangent, -tangent, radius, -Math.PI / 2, 0, false);
    shape.lineTo(half, tangent);
    shape.absarc(tangent, tangent, radius, 0, Math.PI / 2, false);
    shape.lineTo(-tangent, half);
    shape.absarc(-tangent, tangent, radius, Math.PI / 2, Math.PI, false);
    shape.lineTo(-half, -tangent);
    shape.absarc(-tangent, -tangent, radius, Math.PI, Math.PI * 1.5, false);
    return shape;
  }
  const base = mesh(
    'base-pan',
    new ExtrudeGeometry(outline(lidHalf, lidRadius), {
      depth: 0.045,
      bevelEnabled: false,
      curveSegments: 16,
    }),
    edge,
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.0425;
  // Hollow cabinet: the fan aperture remains open down to the base pan.
  box('interior-floor', 0.86, 0.006, 0.86, 0, 0.09, 0, black);

  // Actual pierced sheet metal. Capsule slots expose the recessed coil beneath.
  function ventPanel(width: number, name: string) {
    const panel = new Group();
    panel.name = name;
    const height = 0.96; // Panel meets the lid underside at y = 1.065.
    const shape = new Shape();
    shape.moveTo(-width / 2, -0.0175);
    shape.lineTo(width / 2, -0.0175);
    shape.lineTo(width / 2, height);
    shape.lineTo(-width / 2, height);
    shape.closePath();
    const columns = Math.floor((width - 0.035) / 0.029);
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < columns; col++) {
        const x = (col - (columns - 1) / 2) * 0.029;
        const bottom = 0.025 + row * 0.151;
        const r = 0.008;
        const top = bottom + 0.116;
        const hole = new Path();
        hole.moveTo(x - r, bottom + r);
        hole.lineTo(x - r, top - r);
        hole.absarc(x, top - r, r, Math.PI, 0, true);
        hole.lineTo(x + r, bottom + r);
        hole.absarc(x, bottom + r, r, 0, -Math.PI, true);
        shape.holes.push(hole);
      }
    mesh(
      'perforated-sheet',
      new ExtrudeGeometry(shape, {
        depth: 0.007,
        bevelEnabled: false,
        curveSegments: 4,
      }),
      paint,
      panel,
    );
    // Instanced fine horizontal fins keep the repeating coil detail inexpensive.
    const fins = new InstancedMesh(
      new BoxGeometry(width - 0.015, 0.002, 0.015),
      coil,
      150,
    );
    fins.name = 'heat-exchanger-fins';
    const transform = new Object3D();
    for (let i = 0; i < 150; i++) {
      transform.position.set(0, 0.01 + i * 0.00615, -0.019);
      transform.updateMatrix();
      fins.setMatrixAt(i, transform.matrix);
    }
    panel.add(fins);
    return panel;
  }
  // Front and right have space for the electrical lid at their shared corner.
  const front = ventPanel(0.634, 'front-grille');
  front.position.set(-0.092, 0.105, 0.447);
  product.add(front);
  const right = ventPanel(0.634, 'right-grille');
  right.rotation.y = Math.PI / 2;
  right.position.set(0.447, 0.105, -0.092);
  product.add(right);
  const back = ventPanel(0.818, 'back-grille');
  back.rotation.y = Math.PI;
  back.position.set(0, 0.105, -0.447);
  product.add(back);
  const left = ventPanel(0.818, 'left-grille');
  left.rotation.y = -Math.PI / 2;
  left.position.set(-0.447, 0.105, 0);
  product.add(left);
  // Three separate rolled corner panels join the grille faces tangentially.
  // The fourth corner is the curved electrical cover below.
  const rolledCorner = new Shape();
  rolledCorner.absarc(0, 0, 0.045, 0, Math.PI / 2, false);
  rolledCorner.absarc(0, 0, 0.038, Math.PI / 2, 0, true);
  rolledCorner.closePath();
  const cornerGeometry = new ExtrudeGeometry(rolledCorner, {
    depth: 1.065 - 0.0875,
    bevelEnabled: false,
    curveSegments: 24,
  });
  cornerGeometry.rotateX(Math.PI / 2);
  cornerGeometry.translate(0.409, 1.065, 0.409);
  for (let i = 1; i <= 3; i++) {
    const panel = mesh(`curved-corner-panel-${i}`, cornerGeometry, paint);
    panel.rotation.y = (i * Math.PI) / 2;
  }

  const lid = new Group();
  lid.name = 'electrical-lid';
  product.add(lid);
  // Full square corner above a small 14 cm tall, 3 cm deep service pocket.
  box('lid-front', 0.183, 0.812, 0.012, 0.3175, 0.659, 0.448, paint, lid);
  box('lid-return', 0.012, 0.812, 0.183, 0.448, 0.659, 0.3175, paint, lid);
  // Continuous bent sheet-metal corner, tangent to both electrical cover faces.
  const cornerSection = new Shape();
  cornerSection.absarc(0, 0, 0.045, 0, Math.PI / 2, false);
  cornerSection.absarc(0, 0, 0.033, Math.PI / 2, 0, true);
  cornerSection.closePath();
  const lidCorner = mesh(
    'lid-rounded-corner',
    new ExtrudeGeometry(cornerSection, {
      depth: 0.812,
      bevelEnabled: false,
      curveSegments: 16,
    }),
    paint,
    lid,
  );
  lidCorner.rotation.x = Math.PI / 2;
  lidCorner.position.set(0.409, 1.065, 0.409);
  box('pocket-back', 0.218, 0.1625, 0.009, 0.334, 0.16875, 0.416, black);
  box('pocket-side', 0.009, 0.1625, 0.218, 0.416, 0.16875, 0.334, paint);
  box('pocket-ceiling', 0.23, 0.009, 0.23, 0.335, 0.249, 0.335, paint);
  box('pocket-floor', 0.23, 0.009, 0.23, 0.335, 0.092, 0.335, edge);

  // Hollow PVC water sockets with a thicker union collar and visible bore.
  function pipeGeometry(outer: number, inner: number, length: number) {
    const section = new Shape();
    section.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const bore = new Path();
    bore.absarc(0, 0, inner, 0, Math.PI * 2, true);
    section.holes.push(bore);
    return new ExtrudeGeometry(section, {
      depth: length,
      bevelEnabled: false,
      curveSegments: 32,
    });
  }
  for (const x of [0.281, 0.376]) {
    const pipe = mesh(
      'pvc-water-socket',
      pipeGeometry(0.025, 0.019, 0.065),
      pvc,
    );
    pipe.position.set(x, 0.169, 0.421);
    const collar = mesh(
      'pvc-union-collar',
      pipeGeometry(0.03, 0.025, 0.025),
      pvc,
    );
    collar.position.set(x, 0.169, 0.43);
  }
  // Discreet fasteners, without labels or branding.
  for (const y of [0.285, 1.015])
    for (const x of [0.248, 0.389]) {
      const screw = mesh(
        'lid-fastener',
        new CylinderGeometry(0.004, 0.004, 0.003, 12),
        steel,
        lid,
      );
      screw.rotation.x = Math.PI / 2;
      screw.position.set(x, y, 0.456);
      box('screw-slot', 0.004, 0.0008, 0.001, x, y, 0.458, black, lid);
    }

  // Side panels meet the top deck directly, without an intermediate skirt.

  // Close-fitting rounded lid with a real circular fan aperture.
  const deck = outline(lidHalf, lidRadius);
  const aperture = new Path();
  aperture.absarc(0, 0, 0.381, 0, Math.PI * 2, true);
  deck.holes.push(aperture);
  const top = mesh(
    'top-deck',
    new ExtrudeGeometry(deck, {
      depth: 0.019,
      bevelEnabled: false,
      curveSegments: 64,
    }),
    edge,
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 1.065;
  const shroudMaterial = black.clone();
  shroudMaterial.side = DoubleSide;
  const shroud = mesh(
    'fan-shroud',
    new CylinderGeometry(0.38, 0.36, 0.08, 96, 1, true),
    shroudMaterial,
  );
  shroud.position.y = 1.03;
  const fan = new Group();
  fan.name = 'fan-rotor';
  fan.position.y = 1.01;
  product.add(fan);
  const hub = mesh(
    'fan-hub',
    new CylinderGeometry(0.075, 0.085, 0.045, 48),
    steel,
    fan,
  );
  hub.position.y = 0.005;
  for (let i = 0; i < 5; i++) {
    const bladeShape = new Shape();
    bladeShape.moveTo(0.045, -0.025);
    bladeShape.bezierCurveTo(0.14, -0.085, 0.28, -0.13, 0.338, -0.065);
    bladeShape.bezierCurveTo(0.36, -0.025, 0.31, 0.065, 0.25, 0.078);
    bladeShape.quadraticCurveTo(0.13, 0.06, 0.045, 0.025);
    bladeShape.closePath();
    const bladeGeometry = new ExtrudeGeometry(bladeShape, {
      depth: 0.004,
      bevelEnabled: false,
      curveSegments: 16,
    });
    // Lay the blade in XZ, pitch about its radial axis, then distribute around Y.
    // Separate transforms keep every blade below the lid and within the shroud.
    bladeGeometry.rotateX(-Math.PI / 2);
    bladeGeometry.rotateX(0.14);
    const blade = mesh(`fan-blade-${i}`, bladeGeometry, paint, fan);
    blade.rotation.y = (i * Math.PI * 2) / 5;
  }
  const guard = new Group();
  guard.name = 'fan-guard';
  product.add(guard);
  for (let i = 0; i < 12; i++) {
    const ring = mesh(
      'guard-ring',
      new TorusGeometry(0.095 + i * 0.0253, 0.0024, 6, 128),
      edge,
      guard,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.096;
  }
  for (let i = 0; i < 12; i++) {
    const spoke = box(
      'guard-spoke',
      0.004,
      0.006,
      0.76,
      0,
      1.094,
      0,
      edge,
      guard,
    );
    spoke.rotation.y = (i * Math.PI) / 12;
  }
  const cap = mesh(
    'guard-centre-cap',
    new CylinderGeometry(0.06, 0.06, 0.009, 48),
    edge,
    guard,
  );
  cap.position.y = 1.098;
  for (const x of [-0.421, 0.421])
    for (const z of [-0.421, 0.421]) {
      const screw = mesh(
        'deck-fastener',
        new CylinderGeometry(0.005, 0.005, 0.003, 12),
        steel,
      );
      screw.position.set(x, 1.088, z);
    }
  // Keep the cabinet assembly separate from the low-profile support feet.
  const cabinet = new Group();
  cabinet.name = 'cabinet';
  cabinet.add(...[...product.children]);
  const internals = new Group();
  internals.name = 'internals';
  cabinet.add(internals);
  cabinet.position.y = -0.0325; // Base underside at 1 cm above the floor.
  product.add(cabinet);
  const stand = new Group();
  stand.name = 'support-legs';
  product.add(stand);
  for (const x of [-0.37, 0.37])
    for (const z of [-0.37, 0.37]) {
      box('rubber-foot', 0.12, 0.003, 0.12, x, 0.0015, z, black, stand);
      box('support-leg', 0.085, 0.005, 0.085, x, 0.0055, z, edge, stand);
      box('leg-mounting-plate', 0.11, 0.002, 0.11, x, 0.009, z, edge, stand);
    }
  product.traverse((object) => {
    if (object instanceof Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return product;
}
