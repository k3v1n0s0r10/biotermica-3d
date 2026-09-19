import { expect, test } from 'bun:test';
import { Box3, Mesh, MeshPhysicalMaterial, Vector3 } from 'three';
import { createExchangerReveal } from '../src/animations/exchanger-reveal';
import { disposeObject } from '../src/core/dispose';
import { createTitaniumHeatExchanger } from '../src/models/components/titanium-heat-exchanger';

test('reveal supports arbitrary seeking and restores the opaque exterior at the loop boundary', () => {
  const model = createTitaniumHeatExchanger();
  const sleeve = model.getObjectByName('reveal-sleeve');
  if (
    !(sleeve instanceof Mesh) ||
    !(sleeve.material instanceof MeshPhysicalMaterial)
  )
    throw new Error('Missing sleeve');
  const animation = createExchangerReveal(model);
  animation.sample(6);
  expect(sleeve.material.opacity).toBeCloseTo(0.06);
  expect(sleeve.material.depthWrite).toBe(false);
  expect(sleeve.castShadow).toBe(false);
  animation.sample(2);
  const intermediate = sleeve.material.opacity;
  animation.sample(10);
  animation.sample(2);
  expect(sleeve.material.opacity).toBe(intermediate);
  animation.sample(12);
  expect(sleeve.material.opacity).toBe(1);
  expect(sleeve.material.depthWrite).toBe(true);
  expect(sleeve.castShadow).toBe(true);
  expect(() => animation.sample(Number.NaN)).toThrow();
  disposeObject(model);
});

test('coil fits inside the sleeve and separate product instances own separate resources', () => {
  const first = createTitaniumHeatExchanger();
  const second = createTitaniumHeatExchanger();
  const coil = first.getObjectByName('titanium-serpentine');
  const other = second.getObjectByName('titanium-serpentine');
  if (!(coil instanceof Mesh) || !(other instanceof Mesh))
    throw new Error('Missing coil');
  const size = new Box3().setFromObject(coil).getSize(new Vector3());
  expect(size.x).toBeLessThan(0.184);
  expect(size.z).toBeLessThan(0.184);
  expect(size.y).toBeGreaterThan(0.5);
  expect(coil.geometry).not.toBe(other.geometry);
  expect(coil.material).not.toBe(other.material);
  disposeObject(first);
  expect(() => createExchangerReveal(second).sample(6)).not.toThrow();
  disposeObject(second);
});
