import { expect, test } from 'bun:test';
import { products } from '../src/catalog';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readGlb(path: string) {
  const bytes = await Bun.file(path).arrayBuffer();
  const header = new DataView(bytes);
  expect(header.getUint32(0, true)).toBe(0x46546c67);
  expect(header.getUint32(4, true)).toBe(2);
  expect(header.getUint32(8, true)).toBe(bytes.byteLength);
  expect(header.getUint32(16, true)).toBe(0x4e4f534a);
  const document: unknown = JSON.parse(
    new TextDecoder().decode(bytes.slice(20, 20 + header.getUint32(12, true))),
  );
  if (!record(document)) throw new Error('Invalid GLB document.');
  return document;
}

function verifyGeometry(document: Record<string, unknown>, root: string) {
  if (!Array.isArray(document.nodes) || !Array.isArray(document.meshes))
    throw new Error('Missing GLB geometry.');
  expect(document.meshes.length).toBeGreaterThan(0);
  expect(
    document.nodes.some((node: unknown) => record(node) && node.name === root),
  ).toBe(true);
}

function verifyLighting(document: Record<string, unknown>) {
  expect(document.cameras).toBeUndefined();
  if (Array.isArray(document.extensionsUsed))
    expect(document.extensionsUsed).not.toContain('KHR_lights_punctual');
  if (!Array.isArray(document.materials))
    throw new Error('Missing GLB materials.');
  for (const material of document.materials) {
    if (!record(material)) throw new Error('Invalid GLB material.');
    expect(material.occlusionTexture).toBeUndefined();
  }
}

for (const product of products) {
  test(`${product.name}: deployable Blender geometry and poster`, async () => {
    const document = await readGlb(`public/previews/${product.id}/model.glb`);
    verifyGeometry(document, product.root);
    verifyLighting(document);
    const poster = new Uint8Array(
      await Bun.file(`public/previews/${product.id}/poster.png`).arrayBuffer(),
    );
    expect(Array.from(poster.slice(0, 8))).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
  });
}

test('native source and silent movie are included in static deployment', async () => {
  const source = Bun.file('blender/models/heat-pump.blend');
  const published = Bun.file('public/previews/studio.blend');
  expect(Bun.hash(await source.arrayBuffer())).toBe(
    Bun.hash(await published.arrayBuffer()),
  );
  const movie = new Uint8Array(
    await Bun.file('public/previews/heat-pump-v1/orbit.mp4').arrayBuffer(),
  );
  expect(new TextDecoder().decode(movie.slice(4, 8))).toBe('ftyp');
  const document = await readGlb('public/previews/heat-pump-v1/model.glb');
  if (!Array.isArray(document.animations))
    throw new Error('Missing fan animation.');
  expect(document.animations.length).toBeGreaterThan(0);
});
