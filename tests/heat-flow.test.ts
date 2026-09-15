import { expect, test } from 'bun:test';
import { InstancedMesh, Matrix4, Points, Vector3 } from 'three';
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
    if (system instanceof Points) {
      expect(system.material.size).toBeLessThan(0.02);
      expect(system.geometry.getAttribute('position').count).toBeGreaterThan(1000);
    } else expect(system.getObjectByName('water-surface')).toBeDefined();
  }
  const matrix = new Matrix4(), point = new Vector3();
  for (const [time, stage, sign] of [[15, 2, 1], [20, 3, -1]] as const) {
    const beads = flow.root.children[stage]!.getObjectByName('moving-water-droplets') as InstancedMesh;
    flow.sample(time);
    const expected = Array.from(beads.instanceMatrix.array);
    const before = Array.from({ length: beads.count }, (_, i) => { beads.getMatrixAt(i, matrix); return point.setFromMatrixPosition(matrix).z; });
    flow.sample(time + 0.001);
    const forward = before.filter((z, i) => { beads.getMatrixAt(i, matrix); return (point.setFromMatrixPosition(matrix).z - z) * sign > 0; }).length;
    expect(forward).toBeGreaterThan(65);
    flow.sample(2); flow.sample(23); flow.sample(time);
    expect(Array.from(beads.instanceMatrix.array)).toEqual(expected);
    // Both water streams remain at/below the port elevation, allowing droplet radius.
    for (let i = 0; i < beads.count; i++) {
      beads.getMatrixAt(i, matrix);
      expect(point.setFromMatrixPosition(matrix).y).toBeLessThan(0.18);
    }
  }
  disposeObject(product);
});
