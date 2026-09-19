import { expect, test } from 'bun:test';
import { Mesh, type Object3D, TubeGeometry, Vector3 } from 'three';
import { disposeObject } from '../src/core/dispose';
import { requireValue } from '../src/core/require-value';
import { createCoil } from '../src/models/coil';
import { createHeatPump } from '../src/models/heat-pump';

function endpoint(part: Object3D, end: number) {
  if (!(part instanceof Mesh) || !(part.geometry instanceof TubeGeometry))
    throw new Error('Expected a tube');
  return part.geometry.parameters.path.getPoint(end).add(part.position);
}

test('right fittings repeat injection, U-turn, suction from the top; left bends stay adjacent', () => {
  const coil = createCoil();
  const circuits = requireValue(
    coil.getObjectByName('heat-exchanger-serpentine'),
  ).children;
  const fittings = requireValue(
    coil.getObjectByName('coil-connections'),
  ).children.filter((part) =>
    ['injection-branch', 'suction-branch', 'right-return'].includes(part.name),
  );
  expect(circuits).toHaveLength(16);
  expect(fittings).toHaveLength(24);
  for (let block = 0; block < 8; block++) {
    const injection = requireValue(fittings[block * 3]);
    const turn = requireValue(fittings[block * 3 + 1]);
    const suction = requireValue(fittings[block * 3 + 2]);
    expect([injection.name, turn.name, suction.name]).toEqual([
      'injection-branch',
      'right-return',
      'suction-branch',
    ]);
    const upperPair = requireValue(circuits[15 - block * 2]);
    const lowerPair = requireValue(circuits[14 - block * 2]);
    for (const [a, aEnd, b, bEnd] of [
      [injection, 0, upperPair, 1],
      [turn, 0, upperPair, 0],
      [turn, 1, lowerPair, 1],
      [suction, 0, lowerPair, 0],
    ] as const) {
      expect(endpoint(a, aEnd).distanceTo(endpoint(b, bEnd))).toBeLessThan(
        1e-8,
      );
    }
    expect(endpoint(injection, 0).y).toBeCloseTo(
      0.88 - block * 4 * (0.84 / 31),
    );
    expect(endpoint(injection, 0).y).toBeGreaterThan(endpoint(turn, 0).y);
    expect(endpoint(turn, 1).y).toBeGreaterThan(endpoint(suction, 0).y);
  }
  for (const [i, circuit] of circuits.entries()) {
    const bottom = endpoint(circuit, 0).y;
    const top = endpoint(circuit, 1).y;
    expect(top - bottom).toBeCloseTo(0.84 / 31);
    if (i > 0)
      expect(bottom).toBeGreaterThan(
        endpoint(requireValue(circuits[i - 1]), 1).y,
      );
  }
  disposeObject(coil);
});

test('recessed injection union stays connected to the assembled feed', () => {
  const model = createHeatPump();
  const port = requireValue(model.getObjectByName('injection-port'));
  const feed = requireValue(
    model.getObjectByName('exchanger-outlet-to-coil-injection'),
  );
  if (
    !(port instanceof Mesh) ||
    !(port.geometry instanceof TubeGeometry) ||
    !(feed instanceof Mesh) ||
    !(feed.geometry instanceof TubeGeometry)
  )
    throw new Error('Expected injection tubes');
  const portPath = port.geometry.parameters.path;
  const feedPath = feed.geometry.parameters.path;
  expect(
    port
      .localToWorld(portPath.getPoint(1))
      .distanceTo(feed.localToWorld(feedPath.getPoint(1))),
  ).toBeLessThan(1e-8);
  expect(portPath.getTangent(1).dot(feedPath.getTangent(1))).toBeLessThan(
    -0.999,
  );
  expect(portPath.getPoint(1).z).toBeLessThan(0.1);
  const distributor = requireValue(
    model.getObjectByName('injection-distributor'),
  );
  const branches = requireValue(
    model.getObjectByName('coil-connections'),
  ).children.filter((part) => part.name === 'injection-branch');
  expect(branches).toHaveLength(8);
  for (const branch of branches) {
    const local = endpoint(branch, 1).sub(distributor.position);
    expect(local.y).toBeCloseTo(0.0175);
    expect(new Vector3(local.x, 0, local.z).length()).toBeLessThan(0.017);
  }
  disposeObject(model);
});
