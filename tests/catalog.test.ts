import { expect, test } from 'bun:test';
import { requireValue } from '../src/core/require-value';
import { animations, models, resolveSelection, showcases } from '../src/library/catalog';

test('all catalog references resolve and IDs are unique within each collection', () => {
  for (const collection of [models, animations, showcases]) {
    expect(new Set(collection.map((entry) => entry.id)).size).toBe(collection.length);
  }
  for (const film of showcases)
    expect(models.some((model) => model.id === film.modelId)).toBe(true);
  for (const animation of animations) {
    expect(animation.modelIds.length).toBeGreaterThan(0);
    for (const id of animation.modelIds) expect(models.some((model) => model.id === id)).toBe(true);
  }
});
test('stale selection links fall back to valid items while valid animation selections survive', () => {
  const fallback = resolveSelection({
    mode: 'studio',
    modelId: 'removed-model',
    animationId: 'removed-animation',
    showcaseId: 'removed-film',
  });
  expect(models.some((model) => model.id === fallback.modelId)).toBe(true);
  expect(animations.find((animation) => animation.id === fallback.animationId)?.modelIds).toContain(
    fallback.modelId,
  );
  const chosen = resolveSelection({ ...fallback, animationId: 'fan-study' });
  expect(chosen.animationId).toBe('fan-study');
  const film = resolveSelection({ ...chosen, mode: 'showcase' });
  expect(film.modelId).toBe(
    requireValue(showcases.find((entry) => entry.id === film.showcaseId)).modelId,
  );
});
