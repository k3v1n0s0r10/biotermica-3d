import { expect, test } from 'bun:test';
import {
  assetPath,
  products,
  resolveMode,
  resolveProduct,
} from '../src/catalog';

test('catalog resolves stale URLs and keeps all four migrated models', () => {
  expect(new Set(products.map((entry) => entry.id)).size).toBe(4);
  expect(resolveProduct('missing').id).toBe('heat-pump-v1');
  for (const product of products)
    expect(resolveProduct(product.id)).toBe(product);
});

test('video views are limited to models with a published film', () => {
  for (const product of products) {
    expect(resolveMode('video', product)).toBe(
      product.video ? 'video' : 'image',
    );
    expect(resolveMode('model', product)).toBe('model');
    expect(resolveMode('unknown', product)).toBe('image');
  }
});

test('asset links support static deployments below a path prefix', () => {
  expect(assetPath(resolveProduct(null), 'model.glb', '/studio/')).toBe(
    '/studio/previews/heat-pump-v1/model.glb',
  );
});
