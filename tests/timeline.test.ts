import { expect, test } from 'bun:test';
import { Group } from 'three';
import { createTurntable, loopTime } from '../src/animations/turntable';

test('seeking reproduces a pose regardless of playback history', () => {
  const product = new Group();
  product.rotation.y = 0.3;
  const sequence = createTurntable(product);
  sequence.sample(2);
  const expected = product.quaternion.clone();
  for (const time of [7.9, 0, 100, -3, 4]) sequence.sample(time);
  sequence.sample(2);
  expect(product.quaternion.equals(expected)).toBe(true);
  sequence.sample(10);
  expect(product.quaternion.equals(expected)).toBe(true);
});
test('timeline wraps and rejects invalid inputs', () => {
  expect(loopTime(-1, 8)).toBe(7);
  expect(loopTime(8, 8)).toBe(0);
  expect(() => loopTime(1, 0)).toThrow(RangeError);
  expect(() => loopTime(NaN, 8)).toThrow(RangeError);
});
