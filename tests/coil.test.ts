import { expect, test } from 'bun:test';
import { Mesh, type Object3D, TubeGeometry } from 'three';
import { disposeObject } from '../src/core/dispose';
import { requireValue } from '../src/core/require-value';
import { createCoil } from '../src/models/coil';

function endpoint(part: Object3D, end: number) {
  if (!(part instanceof Mesh) || !(part.geometry instanceof TubeGeometry))
    throw new Error('Expected a tube');
  return part.geometry.parameters.path.getPoint(end).add(part.position);
}

test('right fittings repeat injection, suction, U-turn from the top; left bends stay adjacent', () => {
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
    const suction = requireValue(fittings[block * 3 + 1]);
    const turn = requireValue(fittings[block * 3 + 2]);
    expect([injection.name, suction.name, turn.name]).toEqual([
      'injection-branch',
      'suction-branch',
      'right-return',
    ]);
    const upperPair = requireValue(circuits[15 - block * 2]);
    const lowerPair = requireValue(circuits[14 - block * 2]);
    for (const [a, aEnd, b, bEnd] of [
      [injection, 0, upperPair, 1],
      [suction, 0, upperPair, 0],
      [turn, 0, lowerPair, 1],
      [turn, 1, lowerPair, 0],
    ] as const) {
      expect(endpoint(a, aEnd).distanceTo(endpoint(b, bEnd))).toBeLessThan(
        1e-8,
      );
    }
    expect(endpoint(injection, 0).y).toBeCloseTo(
      0.88 - block * 4 * (0.84 / 31),
    );
    expect(endpoint(injection, 0).y).toBeGreaterThan(endpoint(suction, 0).y);
    expect(endpoint(suction, 0).y).toBeGreaterThan(endpoint(turn, 0).y);
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
