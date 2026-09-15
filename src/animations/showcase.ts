import { Color, Vector3, type PerspectiveCamera } from 'three';
import type { createStudio } from '../scenes/studio';
import { loopTime } from './turntable';

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
export const showcaseShots: readonly Shot[] = [
  { time: 0, eye: [2.7, 1.22, 3.25], target: [0, 0.57, 0], rotation: -0.22, background: 0x142b31, accent: 0x9de4e5 },
  { time: 6, eye: [1.7, 1.48, 2.35], target: [0, 0.62, 0], rotation: 0.24, background: 0x19383c, accent: 0x9de4e5 },
  { time: 11, eye: [0.85, 2.8, 1.2], target: [0, 0.84, 0], rotation: 0.5, background: 0x282238, accent: 0xcab4ff },
  { time: 16, eye: [1.25, 0.65, 1.72], target: [0.20, 0.32, 0.20], rotation: -0.12, background: 0x3a2925, accent: 0xffc79e },
  { time: 20, eye: [2.4, 1.6, 3.0], target: [0, 0.58, 0], rotation: -0.42, background: 0x243539, accent: 0xb1e7e5 },
  { time: 24, eye: [2.7, 1.22, 3.25], target: [0, 0.57, 0], rotation: -0.22, background: 0x142b31, accent: 0x9de4e5 },
];
export const showcaseDuration = 24;
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function createShowcase(stage: Stage, camera: PerspectiveCamera) {
  const eye = new Vector3(), target = new Vector3();
  const nextEye = new Vector3(), nextTarget = new Vector3();
  const aColor = new Color(), bColor = new Color();
  const fan = stage.product.getObjectByName('fan-rotor')!;
  return {
    duration: showcaseDuration,
    sample(seconds: number) {
      const t = loopTime(seconds, showcaseDuration);
      const index = showcaseShots.findIndex((shot, i) => i < showcaseShots.length - 1 && t >= shot.time && t < showcaseShots[i + 1]!.time);
      const a = showcaseShots[Math.max(index, 0)]!;
      const b = showcaseShots[Math.max(index, 0) + 1]!;
      const u = ease((t - a.time) / (b.time - a.time));
      eye.fromArray(a.eye).lerp(nextEye.fromArray(b.eye), u);
      target.fromArray(a.target).lerp(nextTarget.fromArray(b.target), u);
      // Preserve framing on portrait windows as well as wide film frames.
      if (camera.aspect < 1.2) eye.sub(target).multiplyScalar(1.2 / camera.aspect).add(target);
      camera.position.copy(eye);
      camera.lookAt(target);
      stage.product.rotation.y = a.rotation + (b.rotation - a.rotation) * u;
      fan.rotation.y = t * Math.PI / 3; // Exactly four turns per loop.
      const background = aColor.setHex(a.background).lerp(bColor.setHex(b.background), u);
      (stage.scene.background as Color).copy(background);
      stage.scene.fog!.color.copy(background);
      stage.floor.material.color.copy(background);
      stage.floor.material.roughness = 0.56;
      stage.floor.material.metalness = 0.12;
      stage.scene.environmentIntensity = 0.9;
      stage.ambient.intensity = 0.8;
      stage.key.intensity = 4;
      stage.key.color.setHex(0xe7f3ff);
      stage.key.position.set(2.5 + Math.sin(t / 24 * Math.PI * 2), 4, 3);
      stage.fill.intensity = 2.6;
      stage.fill.color.setHex(a.accent).lerp(bColor.setHex(b.accent), u);
      stage.rim.intensity = 4.5;
      return t < 5 ? 0 : t < 12 ? 1 : t < 18 ? 2 : 3;
    },
  };
}
