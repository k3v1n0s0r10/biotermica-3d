import {
  CubicBezierCurve3,
  CurvePath,
  Group,
  LineCurve3,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import { requireValue } from '../../core/require-value';

/** Straight runs with tangent quarter-circle elbows, with no spline overshoot. */
function elbowPath(points: Vector3[], bendRadius: number) {
  const path = new CurvePath<Vector3>();
  let previous = requireValue(points[0]);
  for (let i = 1; i < points.length - 1; i++) {
    const corner = requireValue(points[i]);
    const incoming = corner.clone().sub(requireValue(points[i - 1]));
    const outgoing = requireValue(points[i + 1])
      .clone()
      .sub(corner);
    const radius = Math.min(
      bendRadius,
      incoming.length() * 0.45,
      outgoing.length() * 0.45,
    );
    incoming.normalize();
    outgoing.normalize();
    const start = corner.clone().addScaledVector(incoming, -radius);
    const end = corner.clone().addScaledVector(outgoing, radius);
    const handle = radius * (4 / 3) * Math.tan(Math.PI / 8);
    path.add(new LineCurve3(previous, start));
    path.add(
      new CubicBezierCurve3(
        start,
        start.clone().addScaledVector(incoming, handle),
        end.clone().addScaledVector(outgoing, -handle),
        end,
      ),
    );
    previous = end;
  }
  path.add(new LineCurve3(previous, requireValue(points.at(-1))));
  return path;
}

/** Heat-pump composition: connects existing components in the cabinet frame.
 * The owning heat-pump instance owns and disposes all returned GPU resources.
 */
export function createHeatPumpPipingComposition(
  cabinet: Group,
  compressor: Group,
  exchanger: Group,
  coil: Group,
) {
  const piping = new Group();
  piping.name = 'refrigerant-piping';
  const copper = new MeshStandardMaterial({
    color: 0xb87343,
    metalness: 0.85,
    roughness: 0.3,
  });
  function point(part: Object3D, x: number, y: number, z: number) {
    return cabinet.worldToLocal(part.localToWorld(new Vector3(x, y, z)));
  }
  function line(name: string, radius: number, points: Vector3[]) {
    const mesh = new Mesh(
      new TubeGeometry(elbowPath(points, radius * 2), 256, radius, 16, false),
      copper,
    );
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    piping.add(mesh);
  }
  const suction = requireValue(compressor.getObjectByName('suction-port'));
  const discharge = requireValue(compressor.getObjectByName('discharge-port'));
  // Shipping plugs remain part of the standalone compressor, hidden when plumbed.
  for (const port of [suction, discharge]) {
    requireValue(port.getObjectByName('shipping-plug')).visible = false;
  }
  const header = requireValue(coil.getObjectByName('suction-header'));
  // Enter the very bottom of the 0.88 m collector, just above the cabinet floor.
  const suctionLead = point(suction, 0, 0, 0.13);
  const headerBottom = point(header, 0, -0.44, 0);
  const lowRunY = headerBottom.y - 0.024;
  line('compressor-to-coil-suction', 0.009, [
    point(suction, 0, 0, 0.033),
    suctionLead,
    new Vector3(suctionLead.x, lowRunY, suctionLead.z),
    new Vector3(headerBottom.x, lowRunY, headerBottom.z),
    headerBottom,
  ]);
  // The left top stub feeds the descending titanium tube; the right is its outlet.
  const stubs = exchanger.children.filter(
    (part) => part.name === 'copper-refrigerant-stub',
  );
  const inlet = requireValue(stubs.find((part) => part.position.x < 0));
  const outlet = requireValue(stubs.find((part) => part.position.x > 0));
  const dischargeLead = point(discharge, 0, 0, 0.105);
  const inletEnd = point(inlet, 0, 0.05, 0);
  line('compressor-to-exchanger-inlet', 0.006, [
    point(discharge, 0, 0, 0.033),
    dischargeLead,
    new Vector3(dischargeLead.x, 0.78, dischargeLead.z),
    new Vector3(inletEnd.x, 0.78, inletEnd.z),
    inletEnd,
  ]);
  const injection = requireValue(coil.getObjectByName('injection-port'));
  if (
    !(injection instanceof Mesh) ||
    !(injection.geometry instanceof TubeGeometry)
  ) {
    throw new Error('Coil injection port must expose its tube path.');
  }
  const injectionEnd = injection.geometry.parameters.path.getPoint(1);
  const end = point(injection, injectionEnd.x, injectionEnd.y, injectionEnd.z);
  const outletEnd = point(outlet, 0, 0.05, 0);
  line('exchanger-outlet-to-coil-injection', 0.005, [
    outletEnd,
    new Vector3(outletEnd.x, 0.82, outletEnd.z),
    new Vector3(end.x, 0.82, outletEnd.z),
    new Vector3(end.x, 0.82, end.z + 0.025),
    end.clone().add(new Vector3(0, 0, 0.025)),
    end,
  ]);
  return piping;
}
