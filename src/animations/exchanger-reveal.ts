import { MathUtils, Mesh, MeshPhysicalMaterial, type Object3D } from 'three';
import { type AnimationSequence, loopTime } from './turntable';

export const exchangerRevealDuration = 12;

/** Controls only the central sleeve opacity/depth state; reversible seeking. */
export function createExchangerReveal(model: Object3D): AnimationSequence {
  const sleeve = model.getObjectByName('reveal-sleeve');
  if (
    !(sleeve instanceof Mesh) ||
    !(sleeve.material instanceof MeshPhysicalMaterial)
  ) {
    throw new Error('Exchanger reveal requires a physical reveal-sleeve mesh.');
  }
  const material = sleeve.material;
  return {
    duration: exchangerRevealDuration,
    sample(seconds) {
      const t = loopTime(seconds, exchangerRevealDuration);
      const reveal =
        MathUtils.smoothstep(t, 1, 3.5) *
        (1 - MathUtils.smoothstep(t, 9, 11.5));
      material.opacity = 1 - reveal * 0.94;
      material.depthWrite = reveal === 0;
    },
  };
}
