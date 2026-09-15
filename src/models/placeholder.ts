import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';

/** Scale reference only. One unit = one metre; +Y up, +Z front. */
export function createPlaceholder() {
  const product = new Group();
  product.name = 'heat-pump-placeholder';
  const housing = new Mesh(new BoxGeometry(1.2, 0.9, 0.45), new MeshStandardMaterial({ color: 0xe3e8e7, roughness: 0.45, metalness: 0.2 }));
  housing.position.y = 0.55;
  const fan = new Mesh(new CylinderGeometry(0.32, 0.32, 0.025, 48), new MeshStandardMaterial({ color: 0x263b40, roughness: 0.65 }));
  fan.rotation.x = Math.PI / 2;
  fan.position.set(-0.12, 0.55, 0.24);
  product.add(housing, fan);
  for (const x of [-0.42, 0.42]) {
    const foot = new Mesh(new BoxGeometry(0.14, 0.1, 0.5), fan.material);
    foot.position.set(x, 0.05, 0);
    product.add(foot);
  }
  product.traverse(object => {
    if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  return product;
}
