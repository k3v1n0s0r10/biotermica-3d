import { Color, type PerspectiveCamera, Vector3 } from 'three';
import { createFanAnimation } from '../animations/fan';
import { createHeatFlow } from '../animations/heat-flow';
import { loopTime } from '../animations/turntable';
import { brand } from '../brand/theme';
import { requireValue } from '../core/require-value';
import type { createStudio } from '../scenes/studio';

import { createShowcaseShadows } from './shadows';

type Stage = ReturnType<typeof createStudio>;
type Point = [number, number, number];
interface Shot {
  time: number;
  eye: Point;
  target: Point;
  rotation: number;
  background: number;
  accent: number;
}
// All camera, colour and motion values are sampled from absolute time.
// The last key matches the first so the film loops without a pose jump.
const showcaseShots: readonly Shot[] = [
  {
    time: 0,
    eye: [2.7, 1.22, 3.25],
    target: [0, 0.57, 0],
    rotation: -0.22,
    background: brand.colors.stage,
    accent: 0xb6eafa,
  },
  {
    time: 5,
    eye: [1.7, 1.48, 2.35],
    target: [0, 0.62, 0],
    rotation: 0.24,
    background: brand.colors.stage,
    accent: 0xb6eafa,
  },
  {
    time: 8,
    eye: [1.1, 2.7, 1.8],
    target: [0, 1.0, 0],
    rotation: 0.5,
    background: brand.colors.stageCool,
    accent: 0x8fd7ef,
  },
  {
    time: 11,
    eye: [0.95, 2.75, 1.8],
    target: [0, 1.0, 0],
    rotation: 0.5,
    background: brand.colors.stageCool,
    accent: 0x8fd7ef,
  },
  {
    time: 14,
    eye: [1.25, 0.65, 1.72],
    target: [0.2, 0.32, 0.2],
    rotation: -0.12,
    background: brand.colors.stageWarm,
    accent: 0xffc79e,
  },
  {
    time: 18,
    eye: [1.25, 0.65, 1.72],
    target: [0.2, 0.32, 0.2],
    rotation: -0.12,
    background: brand.colors.stageCool,
    accent: 0x9bd9ff,
  },
  {
    time: 21,
    eye: [1.4, 0.8, 1.95],
    target: [0.2, 0.36, 0.2],
    rotation: -0.12,
    background: brand.colors.stage,
    accent: 0xb1e7e5,
  },
  {
    time: 24,
    eye: [2.7, 1.22, 3.25],
    target: [0, 0.57, 0],
    rotation: -0.22,
    background: brand.colors.stage,
    accent: 0xb6eafa,
  },
];
export const showcaseDuration = 24;
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function createHeatPumpCycle(stage: Stage, camera: PerspectiveCamera) {
  const eye = new Vector3(),
    target = new Vector3();
  const nextEye = new Vector3(),
    nextTarget = new Vector3();
  const aColor = new Color(),
    bColor = new Color();
  const flow = createHeatFlow(stage.product);
  const fan = createFanAnimation(stage.product);
  const setShadows = createShowcaseShadows(stage);
  return {
    setShadows,
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
      const background = aColor
        .setHex(a.background)
        .lerp(bColor.setHex(b.background), u);
      (stage.scene.background as Color).copy(background);
      requireValue(stage.scene.fog).color.copy(background);
      stage.floor.visible = true;
      stage.floor.material.color.copy(background).multiplyScalar(0.35);
      stage.floor.material.roughness = 0.56;
      stage.floor.material.metalness = 0;
      stage.scene.environmentIntensity = 0.9;
      stage.ambient.intensity = 0.8;
      stage.key.intensity = 4;
      stage.key.color.setHex(0xe7f3ff);
      stage.key.position.set(2.5 + Math.sin((t / 24) * Math.PI * 2), 4, 3);
      stage.fill.intensity = 2.6;
      stage.fill.color.setHex(a.accent).lerp(bColor.setHex(b.accent), u);
      stage.rim.intensity = 2.8;
      return flow.sample(t);
    },
  };
}
