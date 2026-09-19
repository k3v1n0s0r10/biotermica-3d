import { type PerspectiveCamera, Vector3 } from 'three';
import { createFanAnimation } from '../animations/fan';
import { createHeatFlow } from '../animations/heat-flow';
import { loopTime } from '../animations/turntable';
import { requireValue } from '../core/require-value';
import type { createStudio } from '../scenes/studio';
import { applyWhitePresentation } from '../scenes/white-presentation';
import { defaultShowcaseDuration } from './defaults';

type Stage = ReturnType<typeof createStudio>;
type Point = [number, number, number];
interface Shot {
  time: number;
  eye: Point;
  target: Point;
  rotation: number;
}
// All camera, colour and motion values are sampled from absolute time.
// The last key matches the first so the film loops without a pose jump.
const showcaseShots: readonly Shot[] = [
  {
    time: 0,
    eye: [2.7, 1.22, 3.25],
    target: [0, 0.57, 0],
    rotation: -0.22,
  },
  {
    time: (5 / 24) * defaultShowcaseDuration,
    eye: [1.7, 1.48, 2.35],
    target: [0, 0.62, 0],
    rotation: 0.24,
  },
  {
    time: (8 / 24) * defaultShowcaseDuration,
    eye: [1.1, 2.7, 1.8],
    target: [0, 1.0, 0],
    rotation: 0.5,
  },
  {
    time: (11 / 24) * defaultShowcaseDuration,
    eye: [0.95, 2.75, 1.8],
    target: [0, 1.0, 0],
    rotation: 0.5,
  },
  {
    time: (14 / 24) * defaultShowcaseDuration,
    eye: [1.25, 0.65, 1.72],
    target: [0.2, 0.32, 0.2],
    rotation: -0.12,
  },
  {
    time: (18 / 24) * defaultShowcaseDuration,
    eye: [1.25, 0.65, 1.72],
    target: [0.2, 0.32, 0.2],
    rotation: -0.12,
  },
  {
    time: (21 / 24) * defaultShowcaseDuration,
    eye: [1.4, 0.8, 1.95],
    target: [0.2, 0.36, 0.2],
    rotation: -0.12,
  },
  {
    time: defaultShowcaseDuration,
    eye: [2.7, 1.22, 3.25],
    target: [0, 0.57, 0],
    rotation: -0.22,
  },
];

export const showcaseDuration = defaultShowcaseDuration;
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function createHeatPumpCycle(stage: Stage, camera: PerspectiveCamera) {
  const eye = new Vector3(),
    target = new Vector3();
  const nextEye = new Vector3(),
    nextTarget = new Vector3();
  const flow = createHeatFlow(stage.product, showcaseDuration);
  const fan = createFanAnimation(stage.product);
  return {
    setShadows(_enabled: boolean) {},
    duration: showcaseDuration,
    sample(seconds: number) {
      const t = loopTime(seconds, showcaseDuration);
      const index = showcaseShots.findIndex(
        (shot, i) =>
          i < showcaseShots.length - 1 &&
          t >= shot.time &&
          t < requireValue(showcaseShots[i + 1]).time,
      );
      const a = requireValue(showcaseShots[Math.max(index, 0)]);
      const b = requireValue(showcaseShots[Math.max(index, 0) + 1]);
      const u = ease((t - a.time) / (b.time - a.time));
      eye.fromArray(a.eye).lerp(nextEye.fromArray(b.eye), u);
      target.fromArray(a.target).lerp(nextTarget.fromArray(b.target), u);
      // Preserve framing on portrait windows as well as wide film frames.
      if (camera.aspect < 1.2)
        eye
          .sub(target)
          .multiplyScalar(1.2 / camera.aspect)
          .add(target);
      camera.position.copy(eye);
      camera.lookAt(target);
      stage.product.rotation.y = a.rotation + (b.rotation - a.rotation) * u;
      fan.sample(t);
      applyWhitePresentation(stage);
      return flow.sample(t);
    },
  };
}
