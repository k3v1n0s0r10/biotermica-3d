import { expect, test } from 'bun:test';
import { Mesh, LineSegments } from 'three';
import { createHeatPump } from '../src/models/heat-pump';
import { createHeatFlow } from '../src/animations/heat-flow';
import { disposeObject } from '../src/core/dispose';

test('air is fine and dense; water uses distinct liquid meshes with repeatable motion', () => {
  const product = createHeatPump();
  const flow = createHeatFlow(product);
  for (const [time, stage] of [[3, 0], [9, 1], [15, 2], [20, 3]] as const) {
    expect(flow.sample(time)).toBe(stage);
    expect(flow.root.children.filter(system => system.visible)).toEqual([flow.root.children[stage]!]);
    const system = flow.root.children[stage]!;
    if (system instanceof LineSegments) {
      expect(system.geometry.getAttribute('position').count).toBeGreaterThan(1000);
    } else expect(system.getObjectByName('water-surface')).toBeDefined();
  }
  for (const [time, stage] of [[15, 2], [20, 3]] as const) {
    const stream = flow.root.children[stage]!.getObjectByName('water-surface') as Mesh;
    flow.sample(time);
    const positions = stream.geometry.getAttribute('position');
    const expected = Array.from(positions.array);
    flow.sample(time + 0.1);
    expect(Array.from(positions.array)).not.toEqual(expected);
    // The liquid stays attached at the socket while its free surface moves.
    expect(Array.from(positions.array).slice(0, 75)).toEqual(expected.slice(0, 75));
    flow.sample(2); flow.sample(23); flow.sample(time);
    expect(Array.from(positions.array)).toEqual(expected);
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
  }
  disposeObject(product);
});
