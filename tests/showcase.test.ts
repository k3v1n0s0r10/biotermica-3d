import { expect, test } from 'bun:test';
import { PerspectiveCamera, Color, Vector3 } from 'three';
import { createStudio } from '../src/scenes/studio';
import { createShowcase } from '../src/animations/showcase';
import { disposeObject } from '../src/core/dispose';

test('showcase reproduces camera, product, fan and lighting after arbitrary seeks', () => {
  const stage = createStudio();
  const camera = new PerspectiveCamera(35, 16 / 9);
  const film = createShowcase(stage, camera);
  const state = () => ({
    camera: camera.position.toArray(), rotation: camera.quaternion.toArray(),
    product: stage.product.rotation.y,
    fan: stage.product.getObjectByName('fan-rotor')!.rotation.y,
    background: (stage.scene.background as Color).getHex(),
    accent: stage.fill.color.getHex(), key: stage.key.position.toArray(),
  });
  film.sample(9.25);
  const expected = state();
  for (const t of [23.9, 1, 17, 0, -5]) film.sample(t);
  film.sample(9.25);
  expect(state()).toEqual(expected);
  film.sample(0);
  const start = state();
  film.sample(24);
  expect(state()).toEqual(start);
  for (const t of [0, 6, 11, 16, 20, 23.999]) {
    film.sample(t);
    expect(camera.position.y).toBeGreaterThan(0);
    expect(camera.position.toArray().every(Number.isFinite)).toBe(true);
  }
  const cabinet = stage.product.getObjectByName('cabinet')!;
  const internals = stage.product.getObjectByName('internals')!;
  expect(internals.parent).toBe(cabinet);
  stage.product.updateMatrixWorld(true);
  expect(internals.getWorldPosition(new Vector3()).y).toBeCloseTo(-0.0325);
  disposeObject(stage.scene);
});
