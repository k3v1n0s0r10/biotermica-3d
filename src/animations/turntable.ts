import type { Object3D } from 'three';

export function loopTime(seconds: number, duration: number): number {
  if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0) {
    throw new RangeError('Time must be finite and duration must be positive.');
  }
  return ((seconds % duration) + duration) % duration;
}

export interface AnimationSequence {
  readonly duration: number;
  sample(seconds: number): void;
}

/** Absolute time sampling makes seeking independent of playback history. */
export function createTurntable(product: Object3D, duration = 8): AnimationSequence {
  loopTime(0, duration);
  const initialRotation = product.rotation.y;
  return { duration, sample(seconds) {
    product.rotation.y = initialRotation + loopTime(seconds, duration) / duration * Math.PI * 2;
  } };
}
