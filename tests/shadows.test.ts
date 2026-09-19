import { expect, test } from 'bun:test';
import { type Object3D, PerspectiveCamera } from 'three';
import { disposeObject } from '../src/core/dispose';
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

test('four-stage showcase stays free of scenery and shadows across mode changes', () => {
  const stage = createStudio();
  const film = createHeatPumpCycle(stage, new PerspectiveCamera());
  for (const enabled of [true, false, true, false]) {
    film.setShadows(enabled);
    for (const time of [3, 9, 15, 21, 24, 0]) {
      film.sample(time);
      expect(stage.floor.visible).toBe(false);
      expect(
        stage.scene.getObjectByName('showcase-contact-shadow'),
      ).toBeUndefined();
      expectNoShadows(stage.scene);
    }
  }
  disposeObject(stage.scene);
});
