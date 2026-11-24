import catalog from '../blender/catalog.json';

export const products = catalog;
export type Product = (typeof products)[number];
export type PreviewMode = 'image' | 'video' | 'model';

export function resolveProduct(id: string | null): Product {
  const product = products.find((entry) => entry.id === id) ?? products[0];
  if (!product) throw new Error('The Blender catalog is empty.');
  return product;
}

export function resolveMode(
  value: string | null,
  product: Product,
): PreviewMode {
  if (value === 'model') return 'model';
  if (value === 'video' && product.video) return 'video';
  return 'image';
}

export function assetPath(
  product: Product,
  filename: string,
  base = '/',
): string {
  return `${base}previews/${product.id}/${filename}`;
}
