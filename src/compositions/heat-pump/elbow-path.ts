import { CubicBezierCurve3, CurvePath, LineCurve3, type Vector3 } from 'three';
import { requireValue } from '../../core/require-value';

/** Straight runs with tangent circular elbows, including oblique component ports. */
export function elbowPath(points: Vector3[], bendRadius: number) {
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
    const angle = incoming.angleTo(outgoing);
    const handle =
      (radius / Math.tan(angle / 2)) * (4 / 3) * Math.tan(angle / 4);
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
