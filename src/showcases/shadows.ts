import {
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
} from 'three';
import type { createStudio } from '../scenes/studio';

/** Showcase-owned shadows; shared models and inspection stages stay shadow-free. */
export function createShowcaseShadows(stage: ReturnType<typeof createStudio>) {
  const { key, floor, scene, product } = stage;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 15;
  key.shadow.camera.left = key.shadow.camera.bottom = -2.5;
  key.shadow.camera.right = key.shadow.camera.top = 2.5;
  key.shadow.normalBias = 0.003;
  // Soft contact shading keeps the 1 cm feet visually grounded under broad studio light.
  const shadowSize = 64;
  const shadowPixels = new Uint8Array(shadowSize * shadowSize * 4);
  for (let y = 0; y < shadowSize; y++)
    for (let x = 0; x < shadowSize; x++) {
      const nx = (x / (shadowSize - 1) - 0.5) * 2;
      const ny = (y / (shadowSize - 1) - 0.5) * 2;
      const distance = Math.sqrt(nx * nx + ny * ny);
      shadowPixels[(y * shadowSize + x) * 4 + 3] = Math.round(
        Math.max(0, 1 - distance) ** 1.7 * 170,
      );
    }
  const contactTexture = new DataTexture(shadowPixels, shadowSize, shadowSize);
  contactTexture.minFilter = contactTexture.magFilter = LinearFilter;
  contactTexture.needsUpdate = true;
  const contact = new Mesh(
    new PlaneGeometry(1.8, 1.8),
    new MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  contact.name = 'showcase-contact-shadow';
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.0001;
  scene.add(contact);
  function setEnabled(enabled: boolean) {
    key.castShadow = enabled;
    floor.receiveShadow = enabled;
    contact.visible = enabled;
    product.traverse((part) => {
      if (!(part instanceof Mesh)) return;
      const materials = Array.isArray(part.material)
        ? part.material
        : [part.material];
      part.castShadow =
        enabled && materials.every((material) => material.opacity >= 1);
      part.receiveShadow = enabled;
    });
  }
  setEnabled(true);
  return setEnabled;
}
