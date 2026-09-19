import {
  type BufferGeometry,
  Line,
  type Material,
  Mesh,
  type Object3D,
  Points,
  Texture,
} from 'three';

/** Dispose exclusively owned assets; shared assets must remain alive until unused. */
export function disposeObject(root: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse((object) => {
    if (
      !(object instanceof Mesh) &&
      !(object instanceof Points) &&
      !(object instanceof Line)
    )
      return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof Texture) textures.add(value);
    }
  });
  for (const value of textures) value.dispose();
  for (const value of materials) value.dispose();
  for (const value of geometries) value.dispose();
}
