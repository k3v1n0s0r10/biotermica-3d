import type { Object3D } from 'three';
import { loopTime, type AnimationSequence } from './turntable';

export const fanDuration = 6;

/** Shared rotor motion: ten turns per six seconds, independent of cabinet motion. */
export function createFanAnimation(model: Object3D): AnimationSequence {
  const fan = model.getObjectByName('fan-rotor');
  if (!fan) throw new Error('Fan motion requires a fan-rotor group.');
  return {
    duration: fanDuration,
    sample(seconds) {
      fan.rotation.y = loopTime(seconds, fanDuration) / fanDuration * Math.PI * 2 * 10;
    },
  };
}
