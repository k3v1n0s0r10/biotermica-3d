import { expect, test } from 'bun:test';
import { type Color, PerspectiveCamera, Vector3 } from 'three';
import { disposeObject } from '../src/core/dispose';
import { requireValue } from '../src/core/require-value';
import { animations, models } from '../src/library/catalog';
import { createStudio } from '../src/scenes/studio';
import { createHeatPumpCycle } from '../src/showcases/heat-pump-cycle';

test('showcase shares the inspection fan motion while retaining cabinet choreography', () => {
  const stage = createStudio();
  const model = requireValue(models[0]).create();
  const study = requireValue(animations.find((entry) => entry.id === 'fan-study')).create(model);
  const film = createHeatPumpCycle(stage, new PerspectiveCamera(35, 16 / 9));
  for (const time of [0.3, 1.1, 5.99, 6, 9.65, 23.99, 24, -0.3]) {
    study.sample(time);
    film.sample(time);
    expect(requireValue(stage.product.getObjectByName('fan-rotor')).rotation.y).toBeCloseTo(
      requireValue(model.getObjectByName('fan-rotor')).rotation.y,
    );
  }
  study.sample(0.3);
  expect(requireValue(model.getObjectByName('fan-rotor')).rotation.y).toBeCloseTo(Math.PI);
  film.sample(8);
  expect(stage.product.rotation.y).toBeCloseTo(0.5);
  expect(model.rotation.y).toBe(0);
  disposeObject(stage.scene);
  disposeObject(model);
});

test('showcase reproduces camera, product, fan and lighting after arbitrary seeks', () => {
  const stage = createStudio();
  const camera = new PerspectiveCamera(35, 16 / 9);
  const film = createHeatPumpCycle(stage, camera);
  const state = () => ({
    camera: camera.position.toArray(),
    rotation: camera.quaternion.toArray(),
    product: stage.product.rotation.y,
    fan: requireValue(stage.product.getObjectByName('fan-rotor')).rotation.y,
    background: (stage.scene.background as Color).getHex(),
    accent: stage.fill.color.getHex(),
    key: stage.key.position.toArray(),
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
  const cabinet = requireValue(stage.product.getObjectByName('cabinet'));
  const internals = requireValue(stage.product.getObjectByName('internals'));
  expect(internals.parent).toBe(cabinet);
  stage.product.updateMatrixWorld(true);
  expect(internals.getWorldPosition(new Vector3()).y).toBeCloseTo(-0.0325);
  disposeObject(stage.scene);
});
