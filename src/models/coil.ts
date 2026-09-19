import {
  BoxGeometry,
  CatmullRomCurve3,
  Curve,
  CylinderGeometry,
  EllipseCurve,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Path,
  TubeGeometry,
  Vector3,
} from 'three';

const rows = 32;
const pitch = 0.84 / (rows - 1);

/** Equal-sized left U-bends join adjacent rows without nesting or overlap. */
class SerpentineCurve extends Curve<Vector3> {
  private readonly runLength: number;
  private readonly turnLength = (Math.PI * pitch) / 2;

  constructor(private readonly perimeter: Path) {
    super();
    this.arcLengthDivisions = 2048;
    this.runLength = perimeter.getLength();
  }

  override getPoint(t: number, target = new Vector3()) {
    const distance = t * (2 * this.runLength + this.turnLength);
    if (distance <= this.runLength) {
      const point = this.perimeter.getPointAt(1 - distance / this.runLength);
      return target.set(point.x, 0.04, point.y);
    }
    if (distance >= this.runLength + this.turnLength) {
      const u = (distance - this.runLength - this.turnLength) / this.runLength;
      const point = this.perimeter.getPointAt(Math.min(1, u));
      return target.set(point.x, 0.04 + pitch, point.y);
    }
    const point = this.perimeter.getPointAt(0);
    const tangent = this.perimeter.getTangentAt(0).negate();
    const angle = ((distance - this.runLength) / this.turnLength) * Math.PI;
    const reach = (pitch / 2) * Math.sin(angle);
    return target.set(
      point.x + tangent.x * reach,
      0.04 + (pitch / 2) * (1 - Math.cos(angle)),
      point.y + tangent.y * reach,
    );
  }
}

function createConnections(material: MeshStandardMaterial) {
  const connections = new Group();
  connections.name = 'coil-connections';
  function tube(name: string, path: Curve<Vector3>, radius: number) {
    const part = new Mesh(
      new TubeGeometry(path, 64, radius, 12, false),
      material,
    );
    part.name = name;
    connections.add(part);
  }
  // Large suction collector and smaller injection distributor inside the opening.
  const suction = new Mesh(
    new CylinderGeometry(0.009, 0.009, 0.88, 24),
    material,
  );
  suction.name = 'suction-header';
  suction.position.set(0.39, 0.46, 0.255);
  connections.add(suction);
  const distributor = new Mesh(
    new CylinderGeometry(0.017, 0.005, 0.035, 24),
    material,
  );
  distributor.name = 'injection-distributor';
  distributor.position.set(0.31, 0.395, 0.3);
  connections.add(distributor);
  for (let row = 0; row < rows; row++) {
    const y = 0.04 + (rows - 1 - row) * pitch;
    const start = new Vector3(0.422, y, 0.19);
    const lead = new Vector3(0.422, y, 0.21);
    // Count from the top: injection, suction, then a downward two-row U-turn.
    if (row % 4 === 3) continue;
    if (row % 4 === 2) {
      const radius = pitch / 2;
      tube(
        'right-return',
        new CatmullRomCurve3(
          Array.from({ length: 17 }, (_, i) => {
            const angle = (i / 16) * Math.PI;
            return new Vector3(
              0.422,
              y - radius * (1 - Math.cos(angle)),
              0.19 + radius * Math.sin(angle),
            );
          }),
        ),
        0.004,
      );
    } else if (row % 4 === 1) {
      tube(
        'suction-branch',
        new CatmullRomCurve3([
          start,
          lead,
          new Vector3(0.41, y, 0.245),
          new Vector3(0.39, y, 0.255),
        ]),
        0.004,
      );
    } else {
      const angle = (row / rows) * Math.PI * 2;
      const port = new Vector3(
        0.31 + Math.cos(angle) * 0.012,
        0.4125,
        0.3 + Math.sin(angle) * 0.012,
      );
      tube(
        'injection-branch',
        new CatmullRomCurve3([
          start,
          lead,
          new Vector3(port.x + 0.035, y, port.z),
          new Vector3(port.x, 0.44, port.z),
          port,
        ]),
        0.0018,
      );
    }
  }
  tube(
    'injection-port',
    new CatmullRomCurve3([
      new Vector3(0.31, 0.3775, 0.3),
      new Vector3(0.31, 0.345, 0.3),
      new Vector3(0.31, 0.325, 0.32),
      new Vector3(0.31, 0.325, 0.36),
    ]),
    0.005,
  );
  return connections;
}

/** Standalone wraparound coil in metres, +Y up, origin at the bottom centre.
 * The opening faces +X/+Z. Each instance exclusively owns its GPU resources.
 */
export function createCoil() {
  const coil = new Group();
  coil.name = 'heat-exchanger';
  // Horizontal footprint; placement within a product belongs to its assembly.
  const perimeter = new Path();
  perimeter.moveTo(0.19, 0.422);
  perimeter.lineTo(-0.38, 0.422);
  perimeter.absarc(-0.38, 0.38, 0.042, Math.PI / 2, Math.PI, false);
  perimeter.lineTo(-0.422, -0.38);
  perimeter.absarc(-0.38, -0.38, 0.042, Math.PI, Math.PI * 1.5, false);
  perimeter.lineTo(0.38, -0.422);
  perimeter.absarc(0.38, -0.38, 0.042, -Math.PI / 2, 0, false);
  perimeter.lineTo(0.422, 0.19);

  // Closer spacing on bends compensates for the fins fanning out at the outer edge.
  const finPlacements = perimeter.curves.flatMap((curve) => {
    const spacing = curve instanceof EllipseCurve ? 0.0035 : 0.006;
    const count = Math.ceil(curve.getLength() / spacing);
    return Array.from({ length: count }, (_, i) => {
      const u = (i + 0.5) / count;
      return { point: curve.getPointAt(u), tangent: curve.getTangentAt(u) };
    });
  });
  const fins = new InstancedMesh(
    new BoxGeometry(0.0008, 0.92, 0.024),
    new MeshStandardMaterial({
      color: 0x929b9e,
      metalness: 0.7,
      roughness: 0.38,
    }),
    finPlacements.length,
  );
  fins.name = 'heat-exchanger-fins';
  const transform = new Object3D();
  for (const [i, { point, tangent }] of finPlacements.entries()) {
    transform.position.set(point.x, 0.46, point.y);
    transform.rotation.y = -Math.atan2(tangent.y, tangent.x);
    transform.updateMatrix();
    fins.setMatrixAt(i, transform.matrix);
  }
  coil.add(fins);
  const copper = new MeshStandardMaterial({
    color: 0xb87343,
    metalness: 0.85,
    roughness: 0.3,
  });
  const serpentine = new Group();
  serpentine.name = 'heat-exchanger-serpentine';
  const returnGeometry = new TubeGeometry(
    new SerpentineCurve(perimeter),
    1024,
    0.004,
    12,
    false,
  );
  for (let pair = 0; pair < rows / 2; pair++) {
    const circuit = new Mesh(returnGeometry, copper);
    circuit.name = 'coil-circuit';
    circuit.position.y = pair * 2 * pitch;
    serpentine.add(circuit);
  }
  coil.add(serpentine, createConnections(copper));
  coil.traverse((part) => {
    if (part instanceof Mesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });
  return coil;
}
