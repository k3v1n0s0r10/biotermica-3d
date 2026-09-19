import { expect, test } from 'bun:test';
import {
  CurvePath,
  ExtrudeGeometry,
  LineCurve3,
  Mesh,
  TubeGeometry,
  Vector3,
} from 'three';
import { disposeObject } from '../src/core/dispose';
import { requireValue } from '../src/core/require-value';
import { createHeatPump } from '../src/models/heat-pump';

function minimumDistance(first: Vector3[], second: Vector3[]) {
  let minimum = Infinity;
  for (const a of first)
    for (const b of second) minimum = Math.min(minimum, a.distanceTo(b));
  return minimum;
}

test('water routes join the correct unions and sockets with copper and pocket clearance', () => {
  const model = createHeatPump();
  const cabinet = requireValue(model.getObjectByName('cabinet'));
  const sockets = cabinet.children
    .filter((part) => part.name === 'pvc-water-socket')
    .sort((a, b) => a.position.x - b.position.x);
  const copper = requireValue(
    model.getObjectByName('refrigerant-piping'),
  ).children.map((part) => {
    if (!(part instanceof Mesh) || !(part.geometry instanceof TubeGeometry))
      throw new Error('Expected copper tube');
    return {
      points: part.geometry.parameters.path.getPoints(400),
      radius: part.geometry.parameters.radius,
    };
  });
  const routes = ['water-outlet', 'water-inlet'].map((name, index) => {
    const pipe = requireValue(
      model.getObjectByName(`exchanger-${name}-to-pvc`),
    );
    const path = new CurvePath<Vector3>();
    let elbows = 0;
    pipe.traverse((part) => {
      if (part.name === 'pvc-elbow') {
        elbows++;
        expect(
          part.children.filter((child) => child.name === 'pvc-elbow-socket'),
        ).toHaveLength(2);
      }
      if (
        !(part instanceof Mesh) ||
        !(part.geometry instanceof ExtrudeGeometry)
      )
        return;
      const segment = requireValue(
        part.geometry.parameters.options.extrudePath,
      );
      expect(segment instanceof LineCurve3).toBe(
        part.name === 'pvc-straight-pipe',
      );
      path.add(segment);
    });
    expect(elbows).toBe(index === 0 ? 3 : 2);
    const port = requireValue(model.getObjectByName(name));
    const start = cabinet.worldToLocal(
      port.localToWorld(new Vector3(0, 0.14, 0)),
    );
    const socket = requireValue(sockets[index]);
    expect(path.getPoint(0).distanceTo(start)).toBeLessThan(1e-8);
    expect(path.getPoint(1).distanceTo(socket.position)).toBeLessThan(1e-8);
    expect(path.getTangent(1).dot(new Vector3(0, 0, 1))).toBeGreaterThan(0.999);
    const points = path.getPoints(400);
    for (const point of points) {
      expect(point.toArray().every(Number.isFinite)).toBe(true);
      expect(point.y - 0.032).toBeGreaterThan(0.093);
      // Water must pass behind, then below the pocket ceiling.
      if (Math.abs(point.y - 0.249) < 0.037 && point.x > 0.195)
        expect(point.z + 0.032).toBeLessThan(0.22);
    }
    for (const tube of copper)
      expect(minimumDistance(points, tube.points)).toBeGreaterThan(
        0.032 + tube.radius + 0.01,
      );
    return points;
  });
  expect(
    minimumDistance(requireValue(routes[0]), requireValue(routes[1])),
  ).toBeGreaterThan(0.064);
  disposeObject(model);
});
