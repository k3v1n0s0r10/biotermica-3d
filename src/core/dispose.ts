import { Mesh, Points, Texture, type Object3D, type Material, type BufferGeometry } from 'three';

/** Dispose exclusively owned assets; shared assets must remain alive until unused. */
export function disposeObject(root: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse(object => {
    if (!(object instanceof Mesh) && !(object instanceof Points)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  textures.forEach(value => value.dispose());
  materials.forEach(value => value.dispose());
  geometries.forEach(value => value.dispose());
}
