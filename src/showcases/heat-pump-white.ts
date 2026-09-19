import type { PerspectiveCamera } from 'three';
import { createFanAnimation } from '../animations/fan';
import { loopTime } from '../animations/turntable';
import type { createStudio } from '../scenes/studio';
import { applyWhitePresentation } from '../scenes/white-presentation';

export const whiteShowcaseDuration = 15;

/** A continuous product orbit with a gentle rise over the fan and a seamless return. */
export function createHeatPumpWhite(
  stage: ReturnType<typeof createStudio>,
  camera: PerspectiveCamera,
) {
  const fan = createFanAnimation(stage.product);
  applyWhitePresentation(stage);
  return {
    duration: whiteShowcaseDuration,
    setShadows(_enabled: boolean) {},
    sample(seconds: number) {
      const t = loopTime(seconds, whiteShowcaseDuration);
      const phase = (t / whiteShowcaseDuration) * Math.PI * 2;
      // Slow through the front three-quarter view; accelerate gently around the back.
      const azimuth = Math.PI / 4 + phase - 0.35 * Math.sin(phase);
      const elevation = 0.42 + 0.32 * (1 - Math.cos(phase));
      const distance = 3.05 * Math.max(1, 0.85 / camera.aspect);
      camera.position.set(
        Math.sin(azimuth) * Math.cos(elevation) * distance,
        0.53 + Math.sin(elevation) * distance,
        Math.cos(azimuth) * Math.cos(elevation) * distance,
      );
      camera.lookAt(0, 0.53, 0);
      stage.product.rotation.y = 0;
      fan.sample(t);
      return 0;
    },
  };
}
