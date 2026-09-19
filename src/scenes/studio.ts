import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
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
  floor.visible = false; // Ground is presentation scenery, not part of inspection.
  scene.add(floor);
  scene.add(product);
  scene.fog = new Fog(0xe9eeed, 8, 22);
  return { scene, product, key, fill, rim, ambient, floor };
}
