import {
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector2,
  Vector3,
} from 'three';
import { requireValue } from '../../core/require-value';
import { createPvcPipeRun } from '../../models/components/pvc-pipe-run';
import { elbowPath } from './elbow-path';

/** Cabinet-frame water connections; resources belong to the owning heat pump. */
export function createWaterPipingComposition(cabinet: Group, exchanger: Group) {
  const piping = new Group();
  piping.name = 'water-piping';
  const pvc = new MeshStandardMaterial({ color: 0xdce0df, roughness: 0.38 });
  const sockets = cabinet.children
    .filter((part) => part.name === 'pvc-water-socket')
    .sort((a, b) => a.position.x - b.position.x);
  // Left is hot water in the showcase; right is the cold supply.
  for (const [index, portName, laneZ] of [
    [0, 'water-outlet', 0.17],
    [1, 'water-inlet', 0.125],
  ] as const) {
    const port = requireValue(exchanger.getObjectByName(portName));
    const socket = requireValue(sockets[index]);
    const point = (distance: number) =>
      cabinet.worldToLocal(port.localToWorld(new Vector3(0, distance, 0)));
    // Insert into the blue union bore and reduce to the cabinet socket diameter.
    const reducer = new Mesh(
      new LatheGeometry(
        [
          new Vector2(0.034, 0.085),
          new Vector2(0.034, 0.099),
          new Vector2(0.025, 0.14),
          new Vector2(0.019, 0.14),
          new Vector2(0.019, 0.085),
          new Vector2(0.034, 0.085),
        ],
        48,
      ),
      pvc,
    );
    reducer.name = `${portName}-reducer`;
    reducer.position.copy(point(0));
    reducer.quaternion.setFromUnitVectors(
      new Vector3(0, 1, 0),
      point(1).sub(point(0)).normalize(),
    );
    const start = point(0.14);
    const direction = point(1).sub(point(0)).normalize();
    const lead = start
      .clone()
      .addScaledVector(direction, (laneZ - start.z) / direction.z);
    const end = cabinet.worldToLocal(socket.localToWorld(new Vector3()));
    const points = [start, lead, new Vector3(end.x, start.y, laneZ)];
    // Descend behind the pocket ceiling, then enter the socket along its bore.
    if (index === 0) points.push(new Vector3(end.x, end.y, laneZ));
    else points[2] = new Vector3(end.x, end.y, laneZ);
    points.push(end);
    const pipe = createPvcPipeRun(elbowPath(points, 0.05), pvc);
    pipe.name = `exchanger-${portName}-to-pvc`;
    piping.add(reducer, pipe);
  }
  return piping;
}
