import { expect, test } from 'bun:test';
import { type Object3D, PerspectiveCamera } from 'three';
import { disposeObject } from '../src/core/dispose';
import { requireValue } from '../src/core/require-value';
import { animations, models } from '../src/library/catalog';
import { createStudio } from '../src/scenes/studio';
import { createHeatPumpCycle } from '../src/showcases/heat-pump-cycle';

function expectNoShadows(root: Object3D) {
  root.traverse((part) => {
    expect(part.castShadow).toBe(false);
    expect(part.receiveShadow).toBe(false);
  });
}

test('every registered model and inspection animation stays shadow-free', () => {
  for (const entry of models) {
    const model = entry.create();
    const stage = createStudio(model);
    expectNoShadows(stage.scene);
    expect(
      stage.scene.getObjectByName('showcase-contact-shadow'),
    ).toBeUndefined();
    expect(
      stage.scene.getObjectByName('studio-contact-shadow'),
    ).toBeUndefined();
    for (const action of animations.filter((item) =>
      item.modelIds.includes(entry.id),
    )) {
      const animation = action.create(model);
      for (const fraction of [0, 0.5, 1, 0.1]) {
        animation.sample(animation.duration * fraction);
        expectNoShadows(stage.scene);
      }
    }
    disposeObject(stage.scene);
  }
});

test('showcase shadows can be disabled for inspection and restored', () => {
  const stage = createStudio();
  const film = createHeatPumpCycle(stage, new PerspectiveCamera());
  const contact = requireValue(
    stage.scene.getObjectByName('showcase-contact-shadow'),
  );
  const cabinet = requireValue(stage.product.getObjectByName('base-pan'));
  for (const enabled of [true, false, true, false]) {
    film.setShadows(enabled);
    film.sample(0);
    expect(stage.key.castShadow).toBe(enabled);
    expect(stage.floor.receiveShadow).toBe(enabled);
    expect(contact.visible).toBe(enabled);
    expect(cabinet.castShadow).toBe(enabled);
    expect(cabinet.receiveShadow).toBe(enabled);
    if (!enabled) expectNoShadows(stage.scene);
  }
  disposeObject(stage.scene);
});
