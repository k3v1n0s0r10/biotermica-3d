import {
  Color,
  DataTexture,
  DirectionalLight,
  Fog,
  HemisphereLight,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
} from 'three';
import { createHeatPump } from '../models/heat-pump';

export function createStudio(product = createHeatPump()) {
  const scene = new Scene();
  scene.background = new Color(0xe9eeed);
  const ambient = new HemisphereLight(0xffffff, 0x667977, 2);
  scene.add(ambient);
  const key = new DirectionalLight(0xfff5e8, 3);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 15;
  key.shadow.normalBias = 0.02;
  key.shadow.camera.left = key.shadow.camera.bottom = -2.5;
  key.shadow.camera.right = key.shadow.camera.top = 2.5;
  key.shadow.normalBias = 0.003;
  scene.add(key);
  const fill = new DirectionalLight(0xb9e9ff, 0);
  fill.position.set(-3, 2, 3);
  const rim = new DirectionalLight(0xffc394, 0);
  rim.position.set(1, 3, -3);
  scene.add(fill, rim);
  const floor = new Mesh(
    new PlaneGeometry(200, 200),
    new MeshStandardMaterial({ color: 0xe9eeed, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.001;
  floor.receiveShadow = true;
  scene.add(floor);
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
  contact.name = 'studio-contact-shadow';
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.0001;
  scene.add(contact);
  scene.add(product);
  scene.fog = new Fog(0xe9eeed, 8, 22);
  return { scene, product, key, fill, rim, ambient, floor };
}
